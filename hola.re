program HolaMundo {
    string nombre = "Mundo";
    int contador = 1;

    print("=== Prueba de la CLI del lenguaje RE ===");
    print("Hola, " + nombre + "!");

    // Probar bucle
    while (contador <= 3) {
        print("Iteracion: " + to_str(contador));
        contador += 1;
    }

    // Probar lista
    list<string> frutas = ["manzana", "pera", "uva"];
    frutas.add("mango");

    for f in frutas {
        print("Fruta: " + f);
    }

    print("=== Fin de la prueba ===");
}
