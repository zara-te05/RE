# ============================================================
# install.ps1 — Instalador del Lenguaje RE para Windows
# ============================================================
# Uso (en PowerShell como Administrador):
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   .\install.ps1
# ============================================================

param(
    [string]$InstallDir = "$env:USERPROFILE\.re-lang\bin"
)

$ErrorActionPreference = "Stop"

# Colores de consola
function Write-Header($msg) { Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-Step($msg)   { Write-Host $msg -ForegroundColor Yellow }
function Write-OK($msg)     { Write-Host "       $msg" -ForegroundColor Green }
function Write-Err($msg)    { Write-Host "[Error] $msg" -ForegroundColor Red; exit 1 }

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Header "======================================"
Write-Header "  Instalador del Lenguaje RE v1.0.0"
Write-Header "======================================"

# ─────────────────────────────────────────────
# Paso 1: Verificar Node.js
# ─────────────────────────────────────────────
Write-Step "[1/6] Verificando Node.js..."
try {
    $nodeVersion = node --version 2>&1
    Write-OK "Node.js $nodeVersion encontrado."
} catch {
    Write-Err "Node.js no esta instalado. Instalalo desde https://nodejs.org"
}

# ─────────────────────────────────────────────
# Paso 2: Verificar npm
# ─────────────────────────────────────────────
Write-Step "[2/6] Verificando npm..."
try {
    $npmVersion = npm --version 2>&1
    Write-OK "npm $npmVersion encontrado."
} catch {
    Write-Err "npm no esta instalado."
}

# ─────────────────────────────────────────────
# Paso 3: Instalar dependencias
# ─────────────────────────────────────────────
Write-Step "[3/6] Instalando dependencias npm..."
Set-Location $ProjectDir
npm install --silent
Write-OK "Dependencias instaladas."

# ─────────────────────────────────────────────
# Paso 4: Compilar el proyecto
# ─────────────────────────────────────────────
Write-Step "[4/6] Compilando el proyecto..."
npm run build
Write-OK "Compilacion exitosa."

# ─────────────────────────────────────────────
# Paso 5: Crear directorio de instalacion
# ─────────────────────────────────────────────
Write-Step "[5/6] Creando directorio de instalacion: $InstallDir"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-OK "Directorio creado: $InstallDir"
} else {
    Write-OK "Directorio ya existe: $InstallDir"
}

# Crear wrappers .cmd que invoquen node sobre los .js compilados
$ReBin   = Join-Path $ProjectDir "dist\compiler.cli\re.js"
$LspBin  = Join-Path $ProjectDir "dist\compiler.cli\re-lsp.js"
$ReCmd   = Join-Path $InstallDir "re.cmd"
$LspCmd  = Join-Path $InstallDir "re-lsp.cmd"

if (-not (Test-Path $ReBin))  { Write-Err "No se encontro el ejecutable compilado: $ReBin" }
if (-not (Test-Path $LspBin)) { Write-Err "No se encontro el ejecutable compilado: $LspBin" }

# Escribir wrapper re.cmd
@"
@echo off
node "$ReBin" %*
"@ | Set-Content -Path $ReCmd -Encoding ASCII

# Escribir wrapper re-lsp.cmd
@"
@echo off
node "$LspBin" %*
"@ | Set-Content -Path $LspCmd -Encoding ASCII

Write-OK "Wrapper creado: $ReCmd"
Write-OK "Wrapper creado: $LspCmd"

# ─────────────────────────────────────────────
# Paso 6: Agregar InstallDir al PATH del usuario
# ─────────────────────────────────────────────
Write-Step "[6/6] Agregando $InstallDir al PATH del usuario..."
$currentPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$InstallDir*") {
    [System.Environment]::SetEnvironmentVariable(
        "PATH",
        "$currentPath;$InstallDir",
        "User"
    )
    Write-OK "$InstallDir agregado al PATH del usuario."
    Write-Host ""
    Write-Host "  IMPORTANTE: Abre una nueva ventana de PowerShell o CMD para" -ForegroundColor Yellow
    Write-Host "              que el cambio de PATH tome efecto." -ForegroundColor Yellow
} else {
    Write-OK "$InstallDir ya estaba en el PATH."
}

# ─────────────────────────────────────────────
# Resultado final
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Instalacion completada exitosamente" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos disponibles (en una nueva terminal):"
Write-Host "  re --version             -> Version del lenguaje"
Write-Host "  re <archivo.re>          -> Ejecuta un programa RE"
Write-Host "  re <archivo.re> --check  -> Solo valida tipos"
Write-Host "  re-lsp                   -> Inicia el servidor LSP"
Write-Host ""
