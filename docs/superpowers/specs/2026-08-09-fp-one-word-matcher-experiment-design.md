# Diseño del experimento acotado de coincidencia de una palabra

## Objetivo

Medir, sin modificar el producto ni publicar alias, cuántas ofertas de la instantánea oficial fijada podrían recuperar tres términos de una sola palabra ya aprobados para el experimento. En paralelo, corregir dos contaminaciones conocidas del notebook de ranking antes de reutilizar sus cifras.

El experimento responde únicamente a una pregunta técnica: qué cambia al permitir coincidencia por palabra completa para un inventario cerrado. No decide nuevas correspondencias CNO, no amplía la política general del matcher y no convierte el resultado en cobertura pública.

## Alcance y orden

El trabajo se divide en dos unidades independientes y revisables:

1. sanear y volver a ejecutar el notebook de ranking de familias;
2. ejecutar el simulador analítico de una palabra con un ejecutor ArliAI sin autoridad de curación ni publicación.

La primera unidad debe terminar antes de citar de nuevo los volúmenes por familia. No condiciona el algoritmo del simulador, que opera directamente sobre la instantánea pública fijada.

Quedan fuera de alcance:

- SSC01M y cualquier nueva investigación de correspondencia oficial;
- cambios en `src/domain/offerMatching.ts`;
- cambios en los catálogos curados, manifiesto o instantáneas públicas;
- alias de una palabra genéricos, stemming, fuzzy matching, puntuaciones o coincidencia por subcadena;
- ajustes de interfaz, publicación o despliegue;
- inferencias a partir de descripciones, requisitos o texto distinto del título de la oferta.

## Alternativas consideradas

### A. Simulador analítico con inventario cerrado — elegida

Un módulo separado recibe ofertas y candidatos ya fijados, normaliza el título y exige tokens completos. Sus resultados se comparan con expectativas escritas por Sol y se guardan como evidencia analítica. Es reversible, no altera el producto y permite medir la utilidad antes de decidir una política.

### B. Excepción detrás de una bandera en el matcher de producción — descartada

Mediría el comportamiento real del matcher, pero introduce una ruta publicable y aumenta innecesariamente el riesgo antes de conocer el beneficio y las colisiones.

### C. Incorporar directamente los términos al catálogo de alias — descartada

Confundiría experimento con decisión editorial, rompería la política vigente de más de una palabra y podría llegar a recursos públicos mediante el pipeline estándar.

## Contrato de datos bloqueado por Sol

El experimento usa exclusivamente:

- instantánea: `20260809014318761-5b22c488ce4b`;
- recurso: `public/data/v1/snapshots/20260809014318761-5b22c488ce4b/job-offers.json`;
- SHA-256 del recurso: `5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba`;
- número de ofertas: `1077`;
- campo observado: `title`;
- identidad de salida: el identificador estable ya presente en cada oferta.

El inventario es literal y cerrado:

| Programa | CNO-11 | Candidato lógico | Formas completas permitidas |
| -------- | ------ | ---------------- | --------------------------- |
| HOT01M   | 5110   | cocinero(s)      | `cocinero`, `cocineros`     |
| EOC01M   | 7121   | albañil(es)      | `albañil`, `albañiles`      |
| EOC01M   | 7111   | encofradores     | `encofradores`              |

Las formas se normalizan con NFD, eliminación de diacríticos, minúsculas y sustitución de cualquier secuencia no alfanumérica por un espacio. Una forma coincide solo si aparece como token completo normalizado. `albañil` no puede coincidir con una palabra más larga; singular y plural están enumerados, no derivados por stemming.

La asimetría inicial de `cocineros` se comprobó contra la instantánea fijada antes de ejecutar el experimento. Existen 40 títulos `COCINEROS, EN GENERAL` y una oferta distinta que contiene `Cocinero/a`; por ello el contrato incluye explícitamente `cocinero` y `cocineros`. No se incorpora ninguna otra flexión.

Sol fija además, antes de invocar ArliAI, la lista exacta esperada de identificadores y títulos para cada candidato. Esas expectativas se extraen de la instantánea fijada y forman parte de pruebas que ArliAI no puede editar. La comprobación literal previa encuentra 41 títulos para `cocinero(s)`, 24 para `albañil(es)` y 2 para `encofradores`: un techo léxico preliminar de 67 ofertas si no hay solapamientos. Entre las 24 coincidencias de albañilería figura `3 Oficial/a Segunda Oficios (Especialidad Albañil-Conductor/a) para Ayto. de Palencia`; se conserva en la salida para revisión, no se convierte silenciosamente en cobertura. El resultado aceptable será el conjunto exacto probado, no un número introducido manualmente.

## Arquitectura del simulador

El código de producción no importa ni llama al simulador. El módulo analítico expone una interfaz pequeña:

```ts
type OneWordCandidate = {
  programKey: "HOT01M" | "EOC01M";
  occupationId:
    "occupation:cno11:5110" | "occupation:cno11:7111" | "occupation:cno11:7121";
  candidateId: "cocinero-s" | "albanil-es" | "encofradores";
  forms: readonly string[];
};

type OneWordCandidateResult = {
  candidateId: OneWordCandidate["candidateId"];
  programKey: OneWordCandidate["programKey"];
  occupationId: OneWordCandidate["occupationId"];
  matchedOfferIds: readonly string[];
  matchedTitles: readonly string[];
};

function simulateApprovedOneWordCandidates(
  offers: readonly { id: string; title: string }[],
  candidates: readonly OneWordCandidate[],
): readonly OneWordCandidateResult[];
```

La implementación debe:

- rechazar inventarios vacíos, formas vacías o formas con más de un token;
- rechazar candidatos, programas o CNO fuera del contrato cerrado;
- deduplicar una oferta alcanzada por dos formas del mismo candidato;
- ordenar candidatos, identificadores y títulos por comparación estricta de cadenas normalizadas con `<` y `>`; `localeCompare`, `Intl.Collator` y cualquier dependencia de ICU o locale están prohibidos;
- conservar el conjunto de coincidencias por candidato y calcular la unión sin duplicados;
- no leer el sistema de archivos, red, catálogos ni variables de entorno;
- no escribir archivos.

Un runner de confianza, fuera del módulo delegado, carga y valida el recurso fijado, verifica SHA y conteo, invoca el simulador y serializa el resultado. El validador vuelve a computar todos los valores y compara bytes con el JSON comprobado. El informe Markdown deriva del JSON validado y distingue claramente “coincidencia léxica experimental” de “oferta publicada como relacionada”.

## Límite de capacidad del ejecutor ArliAI

ArliAI recibe un directorio temporal aislado que contiene únicamente:

- el contrato de tipos;
- la descripción del algoritmo;
- ejemplos sintéticos sin datos reales;
- el nombre de un único archivo de salida.

No recibe el repositorio, PDFs, auditorías, inventario editable, ofertas reales, pruebas de aceptación, validador, credenciales de publicación ni rutas del workspace. La invocación solicita el código como salida textual; ArliAI no escribe en el repositorio. Codex registra modelo, identificador de sesión, tiempo de pared, tokens de entrada/salida si OpenCode los expone, primera ejecución de pruebas y número de rondas de corrección.

Codex inspecciona la salida, la incorpora mediante un parche explícito y ejecuta las pruebas bloqueadas. Cualquier cambio necesario en candidatos, fuentes, pruebas o expectativas invalida la delegación y vuelve a revisión Sol/humana.

## Correcciones del notebook

### Exclusión `degree_or_license_led`

La exclusión se evalúa antes que las reglas de inclusión y es incondicional. Un título que contiene `trabajador.*social`, `educador.*social` u otra profesión regulada permanece excluido aunque también contenga `ayuda a domicilio`, `dependencia` u otro término FP. Se elimina la resta mediante `fp_specific_overrides` para esta clase de exclusión.

Una aserción ejecutable debe demostrar que `Trabajador/a social - coordinador/a de ayuda a domicilio` termina en `No FP o relación insuficiente desde el título`.

### Exclusiones explícitas de Edificación y Obra Civil

Después de la detección candidata y antes de agregar resultados, se excluyen de EOC los patrones conocidos:

- mecánica o reparación de maquinaria de construcción;
- pintura de estructuras metálicas o cascos de buques;
- pintura/decoración de rótulos.

Las exclusiones son explícitas y auditables; no se ensancha el regex general ni se eliminan `pintor` o `construccion` del clasificador. Aserciones ejecutables fijan los tres ejemplos observados como no EOC.

El notebook se ejecuta de principio a fin con la misma fuente fijada, actualiza sus salidas y el Markdown derivado, y conserva comprobaciones de unicidad, conteos y trazabilidad. Las cifras posteriores se presentan como resultado corregido, no como equivalentes a las publicadas antes del saneamiento.

## TDD y verificaciones

### Notebook

1. Añadir primero las cuatro aserciones de contaminación y ejecutar el notebook para observar el fallo.
2. Aplicar la precedencia y las exclusiones mínimas.
3. Ejecutar el notebook completo y comprobar que las aserciones pasan.
4. Regenerar el Markdown y verificar que no contiene las filas contaminadas como EOC/SSC.

### Simulador

1. Crear pruebas Sol que fijen inventario, SHA, conteo y conjuntos exactos de ofertas.
2. Observar RED por ausencia del módulo.
3. Invocar ArliAI una sola vez con el paquete aislado.
4. Incorporar solo el módulo propuesto y ejecutar GREEN.
5. Si falla, devolver únicamente el error de prueba y el contrato original; no mostrar ni permitir editar las pruebas.
6. Añadir pruebas adversariales de límites de token, acentos, singular/plural explícito, deduplicación, orden y rechazo de inventario alterado.
   La prueba de orden debe incluir `n`, `ñ` y una forma acentuada, y debe fijar la salida por puntos de código normalizados sin usar el locale del proceso.
7. Recomputar JSON e informe dos veces y exigir igualdad byte a byte.

Los gates finales incluyen las suites focalizadas, alias pass y piloto históricos, lint, build, licencia, Prettier y `git diff --check`. También se exige un diff cero en `data/curated`, `public/data/v1`, `src/domain/offerMatching.ts` y componentes de interfaz.

## Criterios de decisión

El experimento no publica nada. Su salida habilita una decisión posterior:

- si los conjuntos exactos son útiles y la revisión humana no detecta colisiones semánticas, se redactará una especificación separada para una lista blanca publicable;
- si el rendimiento es pequeño o contaminado, se archiva el mecanismo sin cambiar la política;
- SSC01M permanece fuera hasta que una fuente oficial específica y un contraste humano permitan fijar un nuevo candidato.

Ningún resultado de esta prueba autoriza automáticamente un nuevo alias, una excepción global ni una cifra pública de cobertura.
