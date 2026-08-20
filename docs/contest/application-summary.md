# SALIDA CyL

## Problema y audiencia

SALIDA CyL ayuda a personas de Castilla y León a explorar opciones de formación profesional y sus relaciones ocupacionales revisadas con fuentes identificadas. La aplicación reúne una consulta formativa, una exploración de ofertas relacionadas y una comparación separada de referencias oficiales de ingresos de titulados.

## Solución

La interfaz permite elegir directamente cualquiera de los 187 ciclos de FP o filtrar los 502 grupos primarios de la CNO-11. Expone por separado el catálogo oficial completo y la cobertura parcial de relaciones FP–ocupación revisadas, incluidas las relaciones con ofertas, las revisadas sin coincidencias y las todavía no validadas. La metodología explica el origen de cada dato y los límites de interpretación.

SALIDA CyL conecta FP y ocupación en ambos sentidos con evidencia verificable. Integra siete datasets del Portal de Datos Abiertos de la Junta de Castilla y León, todos visibles en la ficha o en las rutas de apoyo.

El grafo revisado se devuelve a la comunidad como dataset derivado descargable en JSON y CSV, con licencia abierta, fuente por relación e integridad SHA-256 verificable.

## Cobertura congelada

- Instantánea publicada: `20260820131614043-1c06f1f9f7e6`.
- Grupos primarios CNO-11 consultables: **502**.
- **42 cualificaciones distintas**.
- Claves de modalidad públicas: **48** (ADG01S, AFD02M, AGA01B, AGA03S, AGA04M, COM02M, COM02S, COM02SD, COM03S, ELE01M, ELE01S, ELE02S, ENA03S, EOC01M, EOC02S, EOC02SD, FME01S, FME02B, FME02S, HOT01M, HOT01S, HOT02M, HOT03S, HOT05S, IFC01MD, IFC02B, IFC03S, IFC03SD, IMP01M, IMP01S, INA02S, MAM01B, QUI01S, QUI02M, SAN02M, SAN04S, SAN07S, SAN07SD, SAN08S, SAN08SD, SAN09S, SAN09SD, SAN21, SEA03S, SSC01M, SSC05S, TMV01M, TMV03E).
- Relaciones ocupacionales aprobadas: **87**.
- Alias aprobados: **21**.
- **39 de las 1.026 ofertas de la instantánea** quedan alcanzadas por relaciones publicadas (unión de IDs).
- Relaciones revisadas sin oferta alcanzada: **84**.
- Programas diferidos por evidencia insuficiente: ninguno.

Las claves de modalidad se informan aparte de las identidades de cualificación. Una relación revisada sin coincidencia no se convierte en una afirmación sobre la ausencia de oportunidades; un programa diferido permanece fuera de las afirmaciones revisadas.

## Acceso

URL raíz para la candidatura: [https://salida-cyl.157-90-22-40.sslip.io/](https://salida-cyl.157-90-22-40.sslip.io/)

Datos derivados: [https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos)

La memoria ordenada por criterios está en [jury-memo.md](jury-memo.md). La procedencia técnica, los límites estadísticos, las pruebas y los campos que requieren confirmación humana están en [technical-evidence.md](technical-evidence.md), [limitations.md](limitations.md) y [submission-checklist.md](submission-checklist.md).
