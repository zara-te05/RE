import * as fs from 'fs';
import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    let serverModule: string | undefined;

    // 1. Intentar resolver la ruta real del symlink /usr/local/bin/re-lsp
    const symlinkPath = '/usr/local/bin/re-lsp';
    try {
        if (fs.existsSync(symlinkPath)) {
            const stats = fs.lstatSync(symlinkPath);
            if (stats.isSymbolicLink()) {
                const target = fs.readlinkSync(symlinkPath);
                serverModule = path.resolve(path.dirname(symlinkPath), target);
            } else {
                serverModule = symlinkPath;
            }
        }
    } catch (err) {
        // Ignorar y usar fallback
    }

    // 2. Fallback: usar ruta relativa del espacio de trabajo
    if (!serverModule || !fs.existsSync(serverModule)) {
        serverModule = context.asAbsolutePath(
            path.join('..', '..', 'dist', 'compiler.cli', 're-lsp.js')
        );
    }

    let serverOptions: ServerOptions;

    if (fs.existsSync(serverModule)) {
        // Ejecutar como módulo de Node usando el motor interno de VS Code
        serverOptions = {
            run: { 
                module: serverModule, 
                transport: TransportKind.ipc 
            },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: { execArgv: ['--nolazy', '--inspect=6009'] }
            }
        };
    } else {
        // Si todo falla, intentar ejecutar 're-lsp' como comando global del sistema
        serverOptions = {
            run: { command: 're-lsp' },
            debug: { command: 're-lsp' }
        };
    }

    // ─────────────────────────────────────────────
    // Opciones del cliente de lenguaje
    // ─────────────────────────────────────────────
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 're' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/*.re')
        }
    };

    // Crear y arrancar el cliente de lenguaje
    client = new LanguageClient(
        'reLanguageServer',
        'RE Language Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
