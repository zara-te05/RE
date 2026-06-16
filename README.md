# Re Language

**Re** es un lenguaje de programación interpretado con **fines educativos**. El objetivo con el que fue concebido es el poder ofrecer una sintaxis limpia, fácil,legible y sobre todo, que sea divertida de codificar para alumnos y personas que empiezan en el mundo de la programacion (inspirada en la simplicidad de **Python**), pero combinada con la estructura, la seguridad y el diseño de lenguajes de tipado fuerte como lo son **C#** y **Java**. 

Está construido sobre **Node.js** y **TypeScript**, y utiliza **ANTLR4** para el análisis léxico y sintáctico (parsing). El lenguaje intento, sea ideal para aprender conceptos de programación estructurada, estructuras de datos y análisis estático.

## Sus Características Principales:

### 1. Sistema de Tipos Fuerte y Estático
Re detecta errores antes de ejecutar el código gracias a su analizador estático (`TypeChecker`). 
*   **Tipos Primitivos:** `int`, `double`, `string`, `bool`.
*   **Tipado Dinámico:** Soporte para tipado flexible usando la palabra clave `var`.
*   **Validación Estricta:** Impide operaciones inválidas (ej. sumar `int + string` sin conversión previa, usar `-` con strings, etc.).
*   **Conversión Explicita:** Funciones incorporadas como `to_int()`, `to_str()`, y `to_double()`.

### 2. Colecciones Especializadas y Fuertemente Tipadas
El lenguaje incluye estructuras de datos avanzadas y genéricas:
*   `list<T>`: Listas dinámicas con métodos nativos (`.add()`, `.remove()`, `.get()`, `.size()`).
*   `array<T>`: Arreglos de tamaño fijo (`.get()`, `.size()`).
*   `queue<T>`: Colas (FIFO) independientes con métodos (`.enqueue()`, `.dequeue()`, `.size()`).
*   `stack<T>`: Pilas (LIFO) independientes con métodos (`.push()`, `.pop()`, `.size()`).
*   **Validación de Colecciones:** El compilador previene errores lógicos (ej. encolar un `string` en una `queue<int>`) y valida que las listas literales no mezclen tipos incompatibles.

### 3. Estructuras de Control e Inferencia
*   **Condicionales:** `if`, `else if`, `else`.
*   **Bucles Tradicionales:** `while`, `do-while`.
*   **Iterador For-In (`for x in coleccion`):** Soporta rangos (`1..10`), listas literales y variables de colección. Cuenta con **inferencia estática de tipos** para la variable iteradora.

### 4. Funciones
Soporte completo para declaración de funciones con parámetros, tipos de retorno, y ámbitos (scopes) aislados y anidados.

### 5. Métodos Integrados y Cadenas (Strings)
Los strings son objetos de primera clase con métodos útiles integrados: `.upper()`, `.lower()`, `.contains()`, `.substring()`, `.size()`.

### 6. Interacción con el Usuario (I/O)
*   `print(expr)`: Muestra salidas en consola con soporte especial para mostrar el contenido de las colecciones.
*   `input("prompt")`: Lectura de entradas de consola de forma síncrona y **multiplataforma**.

---

## Sintaxis y Ejemplos de Código:

Todo programa en Re debe estar contenido dentro de un bloque `program`. 

### Hola Mundo y Entrada de Datos
La sintaxis se lee de forma natural, pero exige definir tipos.
```re
program HolaMundo {
    string nombre = input("¿Cuál es tu nombre? ");
    print("¡Hola, " + nombre + "!");
}
```

### Tipos y Operaciones Seguras
A diferencia de Python, Re no permite mezclar tipos sin conversión, previniendo errores en tiempo de ejecución (al estilo de Java/C#).
```re
program TiposSeguros {
    int edad = 20;
    string mensaje = "Tengo " + to_str(edad) + " años.";
    print(mensaje);
    
    // Esto lanzaría un error en el TypeChecker antes de ejecutar:
    // string error = "Tengo " + edad; 
}
```

### Funciones y Retornos
Las funciones declaran explícitamente sus tipos de retorno y parámetros.
```re
int calcularArea(int base, int altura) {
    return (base * altura) / 2;
}

program Funciones {
    int area = calcularArea(10, 5);
    print("El área es: " + to_str(area));
}
```

### Colecciones y Bucles con Inferencia
El bucle `for-in` es tan cómodo como en Python, pero el motor infiere estáticamente el tipo de la variable iteradora para mantener la seguridad.
```re
program EjemploColecciones {
    // Declaración de una Cola tipada
    queue<int> turnos = [10, 20, 30];
    turnos.enqueue(40);
    
    print("Turnos en espera:");
    // 't' es inferido automáticamente como 'int'
    for t in turnos {
        int calculo = t * 2; 
        print("Procesando: " + to_str(calculo));
    }
    
    int siguiente = turnos.dequeue();
    print("Atendiendo a: " + to_str(siguiente));
}
```

### Estructuras de Control Clásicas
```re
program Logica {
    int contador = 5;
    
    while (contador > 0) {
        if (contador % 2 == 0) {
            print(to_str(contador) + " es par");
        } else {
            print(to_str(contador) + " es impar");
        }
        contador -= 1;
    }
}
```

---

## 🚀 Requisitos e Instalación

Para compilar, ejecutar y usar el lenguaje RE en tu terminal o editor, necesitas tener **Node.js** (versión 18 o superior) instalado.

### 🐧 Instalar en Linux y macOS
Abre una terminal en la raíz del proyecto y ejecuta:
```bash
chmod +x install.sh
./install.sh
```
El instalador compilará el compilador y creará enlaces simbólicos en `/usr/local/bin` para los comandos `re` (CLI) y `re-lsp` (Servidor de Lenguaje).

### 🪟 Instalar en Windows
Abre **PowerShell como Administrador** en la raíz del proyecto y ejecuta:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install.ps1
```
*Nota: Cierra y vuelve a abrir tu terminal tras la instalación para que se aplique la variable `PATH`.*

---

## 💻 Uso en la Terminal (CLI)

Una vez instalado, el comando `re` estará disponible globalmente:

*   **Ejecutar un archivo:**
    ```bash
    re mi_programa.re
    ```
*   **Solo analizar tipos y sintaxis (sin ejecutar):**
    ```bash
    re mi_programa.re --check
    ```
*   **Ver versión o ayuda:**
    ```bash
    re --version
    re --help
    ```

---

## 🎨 Soporte para Editores de Código (LSP)

El instalador expone el servidor de lenguaje **`re-lsp`**. Esto permite a cualquier editor compatible con el protocolo LSP (Language Server Protocol) darte autocompletado y validación de tipos en tiempo real.

Hemos desarrollado soporte específico para:
*   **VS Code:** Extensión integrada de cliente LSP y coloreado de sintaxis (ubicada en `editors/vscode`).
*   **Neovim:** Configuración mediante `nvim-lspconfig`.
*   **Sublime Text:** Integración usando el plugin `LSP`.
*   **Helix:** Configuración nativa en `languages.toml`.

> [!TIP]
> Consulta el archivo [TUTORIAL.md](file:///home/zarate/RE/TUTORIAL.md) para ver ejemplos completos de sintaxis, colecciones, funciones y la guía de configuración detallada para cada editor de código.