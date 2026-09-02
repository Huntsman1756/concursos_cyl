# SALIDA CyL — Image QA policy (editorial assets)

Fase: congelación de diseño de `feature/competition-visual-redesign`.
Alcance: control de calidad de los assets editoriales generados por IA antes de
aprobar cualquier composición. **No se generan imágenes nuevas en esta fase.**

## Regla base

Ningún asset se aprueba si presenta artefactos evidentes. La inspección se hace
**a resolución completa** (abrir el fichero fuente a 100 % o más, nunca la
miniatura del explorador ni el render recortado de la página). Cada asset de
`public/images/editorial/` (y sus orígenes en `assets-src/editorial/`) se
revisa contra el checklist siguiente y se registra veredicto por variante, no
solo por familia.

## Checklist de inspección (resolución completa)

Revisar cada variante aprobada (mínimo la de mayor anchura por formato) contra
estos nueve puntos:

| #   | Punto                | Qué buscar                                                                                          |
| --- | -------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | **Hands**            | Manos con número de dedos correcto, uñas y nudillos coherentes, sin fusión con objetos.             |
| 2   | **Fingers**          | Dedos sin alargamientos, gemelos, ausencias o poses imposibles (el fallo IA más frecuente).         |
| 3   | **Faces**            | Rasgos simétricos, ojos/orejas/bocas correctos, sin fundidos con el fondo ni expresiones deformes.  |
| 4   | **Screens**          | Pantallas y tabletas con contenido plausible, sin texto ilegible duplicado ni UI fantasma.          |
| 5   | **Background text**  | Ningún texto ilegible o pseudo-alfabeto en carteles, cuadernos, paquetería o pantallas del fondo.   |
| 6   | **Logos**            | Sin marcas reales reconocibles ni logos "casi reales" de fabricantes o instituciones.               |
| 7   | **Tools**            | Herramientas con geometría y función coherentes (no taladros con dos empuñaduras, llaves fundidas). |
| 8   | **Reflections**      | Reflejos en mesas, pantallas y metales coherentes con la escena (sin sujetos duplicados imposibles).|
| 9   | **Geometry**         | Perspective, líneas y solapamientos coherentes; bordes de mesas, estanterías y suelos estables.     |

Veredictos posibles por variante: `APPROVED` · `APPROVED_WITH_CROP` (el
artefacto queda fuera del recorte seguro y del `mobileCrop` band declarado en
`editorial-assets.config.json`) · `REJECTED`.

- Un asset `REJECTED` no entra en ninguna composición hasta regenerarse en una
  fase posterior con presupuesto propio.
- `APPROVED_WITH_CROP` exige comprobar el artefacto en **todas** las
  composiciones y ratios donde se usa (3:2, 4:3, 16:9 y recortes móviles).

## Registro de estado (fase actual)

- Los 5 assets (`hero-career-guidance`, `path-training`, `path-occupation`,
  `path-offer`, `centers-vocational-training`) están en uso en el prototipo
  Home y se consideran **aprobados provisionalmente para prototipo**.
- Esta aprobación **no es** la aprobación de release: el checklist anterior no
  se ha ejecutado aún de forma documentada variante a variante.
- Acción obligatoria antes de release: ejecutar el checklist a resolución
  completa sobre las variantes AVIF y WebP de mayor anchura y registrar el
  veredicto en este documento.

## Diversidad sectorial (pendiente antes de release)

El conjunto actual representa mayoritariamente **taller / industria**
(mecanizado, electrónica, aula-taller técnico). Eso sesga la imagen de la FP
hacia sectores industriales y minusvalora familias como Sanidad, Servicios
Socioculturales, Administración y Gestión, Comercio, Hostelería o Informática
de oficina.

Antes de release debe revisarse la diversidad sectorial de las composiciones
(de dónde salen las imágenes y qué familias representan) y planificar assets
alternativos o recortes alternativos. Decisión pendiente, **no ejecutada en
esta fase** (no se generan imágenes nuevas).
