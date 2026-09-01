# Memoria de candidatura: SALIDA CyL

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**.

## Qué resuelve

SALIDA CyL convierte catálogos públicos separados en una ruta de decisión: `FP → ocupación → evidencia → siguiente paso`. También permite recorrer el camino inverso y empezar desde una oferta laboral. Cada relación publicada conserva fuente, fecha, estado y límites; lo no revisado no se rellena por similitud.

## Qué debe comprobar el jurado

- Desde FP: `/desde-fp/SAN21` muestra relaciones revisadas y ofertas acotadas por la instantánea.
- Desde ocupación: `/desde-ocupacion/occupation%3Acno11%3A5611` muestra el recorrido inverso.
- Cobertura positiva: `/desde-ocupacion/occupation%3Acno11%3A7111` conserva sus ofertas revisadas.
- Límite honesto: `/desde-ocupacion/occupation%3Acno11%3A3820` no fabrica ofertas cuando no hay evidencia en la instantánea.
- Desde oferta: `/desde-oferta` conserva requisito literal, tipo de evidencia, relación revisada y siguiente acción oficial.
- Datos reutilizables: `/datos-abiertos` enlaza el grafo y el recurso derivado con su manifest.

## Cifras congeladas

El candidato usa el snapshot `20260830120000000-8c6c79fbd2a1`, manifest SHA-256 `e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df` y 22 recursos. Incluye 187 programas, 229 centros, 1.294 ofertas formativas, 1.058 ofertas laborales, 264 relaciones FP–ocupación aprobadas, 35 alias y 0 programas diferidos.

La cobertura contiene 113 cualificaciones distintas y 130 claves de modalidad. 138 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas; es una unión de IDs, no una medida de todo el mercado.

El recurso `offerEvidence` contiene 1.058 registros, 196 relaciones y 138 ofertas con relación FP revisada. Las 138 ofertas son una unión de IDs de esta copia fechada, no una medida de todo el mercado. Cinco IDs adicionales respecto del matcher base están justificados por dos revisiones curadas: `PEONES FORESTALES → CNO 9543 → AGA03B` y el requisito literal `Técnico en Cocina y Gastronomía → HOT01M`.

## Calidad y límites

La aplicación mantiene fail-closed la frontera entre evidencia y conjetura. No afirma equivalencias universitarias o profesionales, empleabilidad, salario individual, completitud del mercado ni impacto medido. EDUCAbase conserva su alcance estadístico; el contexto provincial no se convierte en una predicción personal.

La interfaz es responsive, navegable por teclado y sin persistencia de búsquedas o resultados. La validación de accesibilidad, overflow, red y consola se ejecuta como gate local; la captura pública anterior no se presenta como evidencia del candidato actual.

## Estado de autorización

El candidato está en estado local técnico y documental. No tiene tag, release, deployment ni verificación pública nueva. `docs/contest/release-evidence.json` está deliberadamente en `pending`; la aprobación de identidad, contacto, declaraciones, consentimiento, URL y envío queda en manos humanas.
