# UPDATE V8

Esta versión corrige dos problemas:

1. Historial viejo servido desde caché.
2. Fallback de UFC.com que podía terminar marcando resultados incorrectos.

Ahora UFCStats es la única fuente de WIN/LOST para Fight History. Si la fuente no devuelve un resultado verificable, se muestra estado vacío en vez de inventarlo.
