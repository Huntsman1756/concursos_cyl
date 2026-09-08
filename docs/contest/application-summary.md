# SALIDA CyL

## Convocatoria

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**. El plazo oficial finaliza el **21 de septiembre de 2026** y la presentación se realiza mediante la [sede electrónica](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta).

## Problema y audiencia

SALIDA CyL permite explorar qué ocupaciones se relacionan con una FP, dónde estudiarla y qué ofertas de una instantánea fechada se conectan mediante evidencia revisada. Se dirige a estudiantes, personas que buscan empleo, familias y profesionales de orientación. Los enlaces oficiales permiten contrastar la información antes de decidir una matrícula o candidatura.

## Solución

La interfaz permite explorar 187 claves de programa de FP, incluidas modalidades, o los 502 grupos primarios de la CNO-11. Por ejemplo, desde Cuidados Auxiliares de Enfermería se pueden consultar ocupaciones relacionadas y centros de estudio, revisar las ofertas vinculadas y abrir sus fuentes. También permite comenzar por una profesión o una oferta.

SALIDA CyL conecta FP y ocupación en ambos sentidos con evidencia verificable. Integra ocho datasets del Portal de Datos Abiertos de la Junta de Castilla y León, todos visibles en la ficha o en las rutas de apoyo.

El grafo revisado se devuelve a la comunidad como dataset derivado descargable en JSON y CSV, con licencia abierta, fuente por relación e integridad SHA-256 verificable.

## Cobertura congelada

- Instantánea publicada: `20260908152239149-2a613b74a192`.
- Grupos primarios CNO-11 consultables: **502**.
- **185 de 187 claves de programa** tienen alguna relación aprobada (98,9 %). Incluyen modalidades; no son titulaciones distintas.
- Relaciones ocupacionales aprobadas: **320**.
- Alias aprobados: **35**.
- **307 de las 1.032 ofertas de la instantánea** quedan alcanzadas por relaciones publicadas (unión de IDs).
- Relaciones revisadas sin oferta alcanzada: **275**.
- Programas diferidos por evidencia insuficiente: IMA01E, IMA02E.

Las cifras describen cobertura de datos, no impacto medido ni todo el mercado laboral. Una relación revisada sin coincidencia no significa ausencia de oportunidades. Las fechas de descarga, publicación y generación se distinguen en [la revisión de fuentes](verification-20260908.md). El inventario completo de claves permanece en [la evidencia técnica](technical-evidence.md).

## Acceso

URL raíz para la candidatura: [https://salida-cyl.157-90-22-40.sslip.io/](https://salida-cyl.157-90-22-40.sslip.io/)

Datos derivados: [https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos)

La memoria ordenada por criterios está en [jury-memo.md](jury-memo.md). La procedencia técnica, los límites estadísticos, las pruebas y los campos que requieren confirmación humana están en [technical-evidence.md](technical-evidence.md), [limitations.md](limitations.md) y [submission-checklist.md](submission-checklist.md).
