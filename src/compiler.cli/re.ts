#!/usr/bin/env node
// ============================================================
// re.ts — Punto de entrada de la CLI del lenguaje RE
// Uso: re <archivo.re>
// ============================================================
import * as fs from 'fs';
import * as path from 'path';
import { CharStreams, CommonTokenStream, ANTLRErrorListener, Recognizer, RecognitionException } from 'antlr4ts';
import { Re_Lexer } from '../compiler.core/Re_Lexer.js';
import { Re_Parser } from '../compiler.core/Re_Parser.js';
import { Interpreter } from '../compiler.core/Enviroment/Interpreter.js';
import { TypeChecker } from '../compiler.core/Enviroment/TypeChecker.js';

const VERSION = '1.0.0';

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
// Manejo de flags especiales
// ─────────────────────────────────────────────
const arg = process.argv[2];

if (arg === '--version' || arg === '-v') {
    console.log(`re ${VERSION}`);
    process.exit(0);
}

if (arg === '--help' || arg === '-h' || !arg) {
    console.log(`
Re Language CLI v${VERSION}
Uso: re <archivo.re> [opciones]

Opciones:
  --version, -v    Muestra la versión del lenguaje
  --help,    -h    Muestra esta ayuda
  --check,   -c    Solo analiza tipos, no ejecuta el programa

Ejemplos:
  re mi_programa.re
  re mi_programa.re --check
`);
    process.exit(arg ? 0 : 1);
}

// ─────────────────────────────────────────────
// Determinar si solo se hace análisis estático
// ─────────────────────────────────────────────
const checkOnly = process.argv.includes('--check') || process.argv.includes('-c');
const filePath = arg;

// ─────────────────────────────────────────────
// Leer el archivo fuente
// ─────────────────────────────────────────────
let sourceCode: string;
try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`[Error] Archivo no encontrado: ${absolutePath}`);
        process.exit(1);
    }
    if (!absolutePath.endsWith('.re')) {
        console.error(`[Advertencia] El archivo no tiene extensión ".re": ${absolutePath}`);
    }
    sourceCode = fs.readFileSync(absolutePath, 'utf-8');
} catch (err: any) {
    console.error(`[Error] No se pudo leer el archivo: ${err.message}`);
    process.exit(1);
}

// ─────────────────────────────────────────────
// Fase 0: Lexer + Parser
// ─────────────────────────────────────────────
const inputStream = CharStreams.fromString(sourceCode);
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

// Validar errores de sintaxis antes de continuar
if (lexerListener.errors.length > 0 || parserListener.errors.length > 0) {
    console.error(`\n[RE] Se encontraron error(es) de sintaxis en "${filePath}":\n`);
    for (const err of lexerListener.errors) {
        console.error(`  [LexerError] Línea ${err.line}:${err.col} ${err.msg}`);
    }
    for (const err of parserListener.errors) {
        console.error(`  [SyntaxError] Línea ${err.line}:${err.col} ${err.msg}`);
    }
    console.error('\n[RE] El programa no se ejecutará hasta corregir todos los errores.\n');
    process.exit(1);
}

// ─────────────────────────────────────────────
// Fase 1: Análisis estático de tipos
// ─────────────────────────────────────────────
const typeErrors = TypeChecker.check(tree);
if (typeErrors.length > 0) {
    console.error(`\n[RE] Se encontraron ${typeErrors.length} error(es) de tipo en "${filePath}":\n`);
    for (const err of typeErrors) {
        console.error(`  ${err.toString()}`);
    }
    console.error('\n[RE] El programa no se ejecutará hasta corregir todos los errores.\n');
    process.exit(1);
}

if (checkOnly) {
    console.log(`[RE] Análisis completado: sin errores en "${filePath}".`);
    process.exit(0);
}

// ─────────────────────────────────────────────
// Fase 2: Ejecución del intérprete
// ─────────────────────────────────────────────
try {
    const interpreter = new Interpreter();
    interpreter.visit(tree);
} catch (err: any) {
    console.error(`\n[RE Runtime Error] ${err.message}\n`);
    process.exit(1);
}
