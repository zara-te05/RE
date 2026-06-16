"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    let serverModule;
    // 1. Intentar resolver la ruta real del symlink /usr/local/bin/re-lsp
    const symlinkPath = '/usr/local/bin/re-lsp';
    try {
        if (fs.existsSync(symlinkPath)) {
            const stats = fs.lstatSync(symlinkPath);
            if (stats.isSymbolicLink()) {
                const target = fs.readlinkSync(symlinkPath);
                serverModule = path.resolve(path.dirname(symlinkPath), target);
            }
            else {
                serverModule = symlinkPath;
            }
        }
    }
    catch (err) {
        // Ignorar y usar fallback
    }
    // 2. Fallback: usar ruta relativa del espacio de trabajo
    if (!serverModule || !fs.existsSync(serverModule)) {
        serverModule = context.asAbsolutePath(path.join('..', '..', 'dist', 'compiler.cli', 're-lsp.js'));
    }
    let serverOptions;
    if (fs.existsSync(serverModule)) {
        // Ejecutar como módulo de Node usando el motor interno de VS Code
        serverOptions = {
            run: {
                module: serverModule,
                transport: node_1.TransportKind.ipc
            },
            debug: {
                module: serverModule,
                transport: node_1.TransportKind.ipc,
                options: { execArgv: ['--nolazy', '--inspect=6009'] }
            }
        };
    }
    else {
        // Si todo falla, intentar ejecutar 're-lsp' como comando global del sistema
        serverOptions = {
            run: { command: 're-lsp' },
            debug: { command: 're-lsp' }
        };
    }
    // ─────────────────────────────────────────────
    // Opciones del cliente de lenguaje
    // ─────────────────────────────────────────────
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 're' }],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.re')
        }
    };
    // Crear y arrancar el cliente de lenguaje
    client = new node_1.LanguageClient('reLanguageServer', 'RE Language Server', serverOptions, clientOptions);
    client.start();
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map