# Tutorial de Uso del Lenguaje RE

¡Bienvenido al tutorial del lenguaje **RE**! Este documento te enseñará cómo instalar el lenguaje, ejecutar código desde la terminal y configurar tu editor de código preferido para programar de forma cómoda.

---

## 🚀 1. Instalación

El lenguaje RE requiere tener **Node.js** (versión 18 o superior) instalado.

### En Linux y macOS
Abre una terminal en la raíz de este proyecto y ejecuta:
```bash
# Dar permisos de ejecución
chmod +x install.sh

# Correr el instalador
./install.sh
```
El instalador creará enlaces simbólicos en tu máquina de tal forma que puedas llamar a `re` y `re-lsp` de forma global.

### En Windows
Abre **PowerShell como Administrador** en la raíz del proyecto y ejecuta:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install.ps1
```
> [!IMPORTANT]
> Una vez que termine la instalación, **cierra y vuelve a abrir tu terminal** (PowerShell o CMD) para que se aplique la variable `PATH`.

---

## 💻 2. Uso en la Terminal (CLI)

El ejecutable principal es `re`. Sus comandos básicos son:

### Ejecutar un programa
Para ejecutar un archivo con código RE:
```bash
re hola.re
```

### Solo analizar errores (Check)
Si quieres verificar si un archivo tiene errores sintácticos o de tipos pero **sin ejecutarlo**:
```bash
re hola.re --check
```

### Consultar Ayuda y Versión
```bash
re --help
re --version
```

---

## 📝 3. Guía Básica del Lenguaje RE

Todo código RE válido debe estar contenido dentro de un bloque `program`:

```re
program MiPrograma {
    // 1. Declaración de variables con tipos fuertes
    int edad = 21;
    double altura = 1.75;
    string nombre = "Juan";
    bool esEstudiante = true;

    // 2. Operaciones compuestas y strings
    print("Hola " + nombre);
    edad += 1;

    // 3. Estructuras de control
    if (edad >= 18) {
        print("Eres mayor de edad");
    } else {
        print("Eres menor de edad");
    }

    // Bucles con rangos
    print("Contando del 1 al 3:");
    for i in 1..3 {
        print("Numero: " + to_str(i));
    }
}
```

### Funciones
Las funciones se declaran dentro del bloque `program`, pero antes de las sentencias del cuerpo principal:
```re
program ConFunciones {
    // Declaración
    int duplicar(int x) {
        return x * 2;
    }

    // Uso
    int valor = duplicar(10);
    print("El doble es: " + to_str(valor));
}
```

### Colecciones
RE soporta listas dinámicas, arreglos fijos, colas y pilas:
```re
program EjemploColecciones {
    // Listas
    list<string> compras = ["leche", "pan"];
    compras.add("fruta");
    print(compras); // Muestra: [leche, pan, fruta]

    // Colas (FIFO)
    queue<int> fila = [1, 2];
    fila.enqueue(3);
    int atendido = fila.dequeue(); // 1
}
```

---

## 🎨 4. Configuración de Editores de Código

Gracias a que implementamos el protocolo LSP, puedes configurar casi cualquier editor.

### A. Visual Studio Code (VS Code)
Puedes instalar la extensión localmente para probarla en desarrollo:
1. Copia la carpeta `editors/vscode` a tu directorio local de extensiones de VS Code:
   * **Linux/macOS:** `~/.vscode/extensions/re-vscode`
   * **Windows:** `%USERPROFILE%\.vscode\extensions\re-vscode`
2. O bien, abre la carpeta `editors/vscode` en una nueva ventana de VS Code y presiona `F5` para iniciar una instancia de VS Code en modo de desarrollo con la extensión activa.

### B. Neovim (v0.8 o superior)
Si utilizas Neovim con `nvim-lspconfig`, puedes añadir tu servidor agregando esto a tu `init.lua`:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Registrar re-lsp como un servidor válido
if not configs.re_lsp then
  configs.re_lsp = {
    default_config = {
      cmd = { 're-lsp' },
      filetypes = { 're' },
      root_dir = lspconfig.util.find_git_ancestor,
      single_file_support = true,
      settings = {},
    },
  }
end

-- Activar el servidor
lspconfig.re_lsp.setup{}
```

### C. Sublime Text (Sublime LSP)
1. Instala el paquete **LSP** desde el Package Control de Sublime Text.
2. Abre la configuración de LSP (`Preferences > Package Settings > LSP > Settings`).
3. Añade tu configuración en `clients`:
```json
{
  "clients": {
    "re-lsp": {
      "enabled": true,
      "command": ["re-lsp"],
      "selector": "source.re"
    }
  }
}
```

### D. Helix Editor
Helix soporta LSP de forma nativa. Edita tu archivo `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "re"
scope = "source.re"
file-types = ["re"]
roots = [".git"]
language-servers = [ "re-lsp" ]

[language-server.re-lsp]
command = "re-lsp"
```
