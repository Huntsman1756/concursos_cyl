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
- Datos reutilizables: `/datos-abiertos` enlaza el grafo FP↔CNO-11 y los recursos publicados con su manifest.
- Nota técnica: Las páginas de ofertas utilizan un recurso derivado de evidencia generado sobre el snapshot. Se conserva como recurso runtime trazable, pero no se publica en esta candidatura como dataset reutilizable independiente.

## Cifras congeladas

El candidato usa el snapshot `20260830120000000-8c6c79fbd2a1`, manifest SHA-256 `e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df` y 22 recursos. Incluye 187 programas, 229 centros, 1.294 ofertas formativas, 1.058 ofertas laborales, 264 relaciones FP–ocupación aprobadas, 35 alias y 0 programas diferidos.

La cobertura contiene 113 cualificaciones distintas y 130 claves de modalidad. 138 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas; es una unión de IDs, no una medida de todo el mercado.

El recurso `offerEvidence` contiene 1.058 registros, 196 relaciones y 138 ofertas con relación FP revisada. Las 138 ofertas son una unión de IDs de esta copia fechada, no una medida de todo el mercado. Cinco IDs adicionales respecto del matcher base están justificados por dos revisiones curadas: `PEONES FORESTALES → CNO 9543 → AGA03B` y el requisito literal `Técnico en Cocina y Gastronomía → HOT01M`.

## Calidad y límites

La aplicación mantiene fail-closed la frontera entre evidencia y conjetura. No afirma equivalencias universitarias o profesionales, empleabilidad, salario individual, completitud del mercado ni impacto medido. EDUCAbase conserva su alcance estadístico; el contexto provincial no se convierte en una predicción personal.

La interfaz es responsive, navegable por teclado y sin persistencia de búsquedas o resultados. La validación de accesibilidad, overflow, red y consola se ejecuta como gate local y se repitió durante la recaptura de las 13 capturas actuales incluidas en `docs/contest/evidence-capture.json`; la captura nativa OS A4 y la revisión visual humana siguen siendo pasos pendientes y no se presentan como hechos.

## Estado del candidato

La candidatura se construye sobre el producto publicado `v2026.09.04-candidate.10`: tag anotado sobre el commit `4b67443c4cb1b29347eef38d751eb4f8d02cb2a9`, con GitHub Release pública y despliegue verificado en la raíz pública, donde `version.json` declara ese mismo commit. La evidencia observada (gates, despliegue, verificación pública y capturas) está registrada en `docs/contest/release-evidence.json`.

Los commits posteriores que empaquetan esta documentación no alteran el producto desplegado. La identidad de la persona solicitante, el contacto, las declaraciones, el consentimiento y el envío real a la sede electrónica siguen siendo pasos humanos pendientes; este repositorio no los ejecuta.
