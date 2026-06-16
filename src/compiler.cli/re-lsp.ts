#!/usr/bin/env node
// ============================================================
// re-lsp.ts — Servidor LSP del lenguaje RE
//
// Se comunica con editores de código (VS Code, Neovim, Helix,
// Sublime Text, Zed, etc.) a través del protocolo LSP estándar
// usando stdin/stdout (JSON-RPC).
//
// Capacidades implementadas:
//   - textDocument/didOpen    → Analiza el archivo al abrirlo
//   - textDocument/didChange  → Analiza el archivo en cada cambio
//   - textDocument/didSave    → Analiza el archivo al guardar
//   - publishDiagnostics      → Reporta errores de tipo al editor
// ============================================================
import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    TextDocumentSyncKind,
    InitializeResult,
    TextDocumentChangeEvent,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { TextDocumentWillSaveEvent } from 'vscode-languageserver/node';
import { CharStreams, CommonTokenStream, ANTLRErrorListener, Recognizer, RecognitionException } from 'antlr4ts';
import { Re_Lexer } from '../compiler.core/Re_Lexer.js';
import { Re_Parser } from '../compiler.core/Re_Parser.js';
import { TypeChecker, TypeCheckError } from '../compiler.core/Enviroment/TypeChecker.js';

// ─────────────────────────────────────────────
// Listener de Errores de Sintaxis para ANTLR
// ─────────────────────────────────────────────
class ReErrorListener implements ANTLRErrorListener<any> {
    public errors: Array<{ line: number; col: number; msg: string }> = [];

    syntaxError(
        recognizer: Recognizer<any, any>,
        offendingSymbol: any,
        line: number,
        charPositionInLine: number,
        msg: string,
        e: RecognitionException | undefined
    ): void {
        this.errors.push({ line, col: charPositionInLine, msg });
    }
}

// ─────────────────────────────────────────────
// Conexión LSP: usa stdin/stdout (node IPC)
// ─────────────────────────────────────────────
const connection = createConnection(ProposedFeatures.all);

// Manejador de documentos abiertos en el editor
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;

// ─────────────────────────────────────────────
// Inicialización del servidor
// ─────────────────────────────────────────────
connection.onInitialize((params: InitializeParams): InitializeResult => {
    const capabilities = params.capabilities;
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
        },
        serverInfo: {
            name: 'RE Language Server',
            version: '1.0.0',
        },
    };
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    connection.console.log('[RE LSP] Servidor iniciado y listo.');
});

// ─────────────────────────────────────────────
// Función central: analizar un documento RE
// Traduce TypeCheckError → Diagnostic de LSP
// ─────────────────────────────────────────────
function validateDocument(textDocument: TextDocument): void {
    const text = textDocument.getText();
    const diagnostics: Diagnostic[] = [];

    try {
        // Fase 0: Lexer + Parser
        const inputStream = CharStreams.fromString(text);
        const lexer = new Re_Lexer(inputStream);
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new Re_Parser(tokenStream);

        const lexerListener = new ReErrorListener();
        const parserListener = new ReErrorListener();

        lexer.removeErrorListeners();
        lexer.addErrorListener(lexerListener);

        parser.removeErrorListeners();
        parser.addErrorListener(parserListener);

        const tree = parser.program();

        // Si hay errores de sintaxis, reportarlos y no ejecutar TypeChecker
        const syntaxErrors = [...lexerListener.errors, ...parserListener.errors];
        if (syntaxErrors.length > 0) {
            for (const err of syntaxErrors) {
                const line = err.line - 1;
                const col = err.col;
                const diagnostic: Diagnostic = {
                    severity: DiagnosticSeverity.Error,
                    range: {
                        start: { line, character: col },
                        end:   { line, character: col + 1 },
                    },
                    message: err.msg,
                    source: 'RE Parser',
                };
                diagnostics.push(diagnostic);
            }
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
            return;
        }

        // Fase 1: Análisis estático de tipos
        const typeErrors: TypeCheckError[] = TypeChecker.check(tree);

        for (const err of typeErrors) {
            // Convertir línea/columna del TypeChecker a rango LSP (0-indexed)
            const line = err.line !== undefined ? err.line - 1 : 0;
            const col  = err.col  !== undefined ? err.col       : 0;

            const diagnostic: Diagnostic = {
                severity: DiagnosticSeverity.Error,
                range: {
                    start: { line, character: col },
                    end:   { line, character: col + 1 },
                },
                message: err.message,
                source: 'RE TypeChecker',
            };
            diagnostics.push(diagnostic);
        }
    } catch (_parseError) {
        // Si el código tiene errores de sintaxis que ANTLR no puede recuperar,
        // reportamos un diagnóstico genérico de sintaxis
        const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: 0, character: 0 },
                end:   { line: 0, character: 1 },
            },
            message: 'Error de sintaxis en el programa. Verifique la estructura del bloque "program".',
            source: 'RE Parser',
        };
        diagnostics.push(diagnostic);
    }

    // Enviar diagnósticos al editor
    connection.sendDiagnostics({
        uri: textDocument.uri,
        diagnostics,
    });
}

// ─────────────────────────────────────────────
// Suscribirse a eventos de documentos
// ─────────────────────────────────────────────

// Al abrir un archivo .re
documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
    validateDocument(event.document);
});

// Al modificar el contenido (mientras el usuario escribe)
documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>) => {
    validateDocument(change.document);
});

// Al guardar el archivo
documents.onDidSave((event: TextDocumentChangeEvent<TextDocument>) => {
    validateDocument(event.document);
});

// Al cerrar el archivo: limpiar los diagnósticos
documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// ─────────────────────────────────────────────
// Arrancar el servidor LSP
// ─────────────────────────────────────────────
documents.listen(connection);
connection.listen();
