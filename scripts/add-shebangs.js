// scripts/add-shebangs.js
// ─────────────────────────────────────────────────────────────
// Este script se ejecuta después de `npx tsc` para añadir el
// shebang "#!/usr/bin/env node" al principio de los archivos
// compilados de la CLI y del LSP, y darles permisos de ejecución.
// ─────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const SHEBANG = '#!/usr/bin/env node\n';

const targets = [
    path.join(__dirname, '..', 'dist', 'compiler.cli', 're.js'),
    path.join(__dirname, '..', 'dist', 'compiler.cli', 're-lsp.js'),
];

for (const filePath of targets) {
    if (!fs.existsSync(filePath)) {
        console.warn(`[add-shebangs] Archivo no encontrado, omitiendo: ${filePath}`);
        continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Añadir shebang solo si no está ya presente
    if (!content.startsWith('#!')) {
        fs.writeFileSync(filePath, SHEBANG + content, 'utf-8');
        console.log(`[add-shebangs] Shebang añadido a: ${path.basename(filePath)}`);
    } else {
        console.log(`[add-shebangs] Shebang ya presente en: ${path.basename(filePath)}`);
    }

    // Dar permisos de ejecución en Unix (no aplica en Windows, se ignora)
    try {
        fs.chmodSync(filePath, 0o755);
        console.log(`[add-shebangs] chmod +x aplicado a: ${path.basename(filePath)}`);
    } catch (_) {
        // En Windows chmod no aplica, se ignora silenciosamente
    }
}

console.log('[add-shebangs] Listo. Los ejecutables están en dist/compiler.cli/');
