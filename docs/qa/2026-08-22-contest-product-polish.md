# QA local — contest product polish

- Fecha de ejecución automatizada y manual: 2026-08-22
- Base inicial de Task 8: `854f81876137710dc7b1c0feb696e52b9bf56cd0`
- Ajuste visual posterior verificado: `79f5939`

Este registro cubre la migración E2E de Task 8, la matriz manual responsive y la
revisión visual independiente. Los checks automatizados se ejecutaron con el
wrapper del repositorio; no se invocó Playwright directamente. La QA manual se
realizó en Codex IAB contra el build local y la copia versionada de
`public/data/v1`, sin fixtures ad hoc. Las capturas se normalizaron a PNG real y
se revisaron visualmente; los dos defectos de copy encontrados se corrigieron con
tests en `79f5939` y sus estados se volvieron a capturar.

## Evidencia automatizada

| Check                                     | Comando                                                                                                                                                          | Resultado observado                                                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused Task 8 E2E                        | `rtk npm run test:e2e:chromium -- tests/e2e/home.spec.ts tests/e2e/training-first.spec.ts tests/e2e/compare-studies.spec.ts tests/e2e/contest-readiness.spec.ts` | PASS final — **90/90 tests totales entre los dos proyectos Chromium** (`chromium-desktop` y `chromium-mobile`), no 90/90 por proyecto (37.8 s tras la revisión final)                                          |
| Chromium E2E completo                     | `rtk npm run test:e2e:chromium`                                                                                                                                  | PASS final reproducido por el agente principal — **154/154 entre los dos proyectos Chromium** (1.0 min tras el ajuste visual)                                                                                  |
| Unit suite                                | `rtk npm test`                                                                                                                                                   | PASS final — 114 archivos pasaron, 23 omitidos; 1.178 tests pasaron, 180 omitidos (127.78 s, ejecución completa sin contención)                                                                                |
| Build, runtime data, asset y distribución | `rtk npm run build`                                                                                                                                              | PASS final — 21 recursos de manifest, presupuesto de assets 1,747,460/1,800,000 bytes raw en 31 archivos; distribución 21 recursos verificados, 28 archivos de datos, 22,494,862 bytes y cero bytes duplicados |
| Candidate boundary                        | `rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist`                                                                            | PASS final — 21 recursos, 116 registros SEPE                                                                                                                                                                   |
| Licencias                                 | `rtk npm run license:check`                                                                                                                                      | PASS final — 363 entradas fijadas en `package-lock.json`                                                                                                                                                       |
| Typecheck                                 | `rtk npm run typecheck`                                                                                                                                          | PASS final — exit 0                                                                                                                                                                                            |
| Lint                                      | `rtk npm run lint`                                                                                                                                               | PASS final — exit 0                                                                                                                                                                                            |
| Formato                                   | `rtk npm run format:check`                                                                                                                                       | PASS final — todos los archivos usan el estilo Prettier                                                                                                                                                        |
| Diff whitespace                           | `rtk git diff --check`                                                                                                                                           | PASS final — exit 0                                                                                                                                                                                            |

La evidencia E2E automatizada registrada cubre, entre otros recorridos, la
confirmación teclada de ciclos FP mediante opciones oficiales, texto arbitrario y
cero resultados, filtros y provincia `León`, el enlace contextual
`/comparar?program=IFC03S`, la carga diferida de ingresos, la reescritura y
recarga de comparadores, la recuperación fail-closed de queries inválidas, el
menú móvil a 390×844, overflow corporal/documental y el contrato de metadata
con título, descripción, canonical, Open Graph, Twitter, favicon y theme-color.
Los asserts Axe de home y búsqueda FP exigen cero violaciones; los del
comparador y readiness conservan el contrato de cero impactos `serious` o
`critical`. La impresión automatizada usa un espía de `window.print` y exige
exactamente una llamada en estados de resultado válidos; no abre el diálogo del
sistema operativo. Los tests también prueban la preselección `IFC03S` antes y
después de recargar el comparador y los 18 centros completos tras abrir desde el
resultado provincial el enlace oficial de centros.

## RED→GREEN de Task 8

El resultado RED previo se conserva como evidencia automatizada registrada:
antes de completar la migración, el focused wrapper produjo la RED contractual:
90 tests, 62 pasaron y 28 fallaron. Entre los fallos observados estuvo el
`.selectOption("IFC03S")` heredado contra el nuevo combobox de texto, además de
selectores móviles ocultos y una coincidencia ambigua de `IFC03S`/`IFC03SD`.
Tras migrar los selectores a escritura + opción oficial y ajustar los probes de
ruta/disclosure, el mismo focused wrapper quedó en 90/90. Después de la revisión
adversarial y su corrección final, el agente principal volvió a confirmar los 90
tests totales en 37.8 s sobre la base que incluye el ajuste visual `79f5939` y
los asserts exactos de la revisión final.

## Matriz manual IAB — PASS de pantalla / A4 bloqueado

Frontier ejecutó todas las rutas y estados de pantalla indicados abajo en Codex
IAB. Se observaron URL, foco, árbol semántico, ARIA, consola, recursos declarados,
overflow y geometría táctil. IAB no incorpora Axe en el contexto de página ni
expone una previsualización de impresión o media `print`; por ello los estados
manuales se acompañaron del gate Axe automatizado sobre las mismas superficies y
la salida A4 se trató mediante el waiver explícito de la sección final. Esta
limitación no se presenta como una previsualización realizada.

### Procedimiento común por viewport

- [x] Abrir un contexto limpio en IAB, fijar exactamente el viewport indicado y
      anotar la URL, el HEAD y la fecha/hora antes de cada recorrido.
- [x] Operar con teclado: `Tab`/`Shift+Tab`, flechas, `Enter` y `Escape`. Confirmar
      que el foco visible queda en el control activo; el foco inicial listo debe
      ser `main#main-content` sin dibujar un contorno de página completa, y el skip
      link `Saltar al contenido` debe llevar allí.
- [x] Revisar el árbol semántico en IAB y ejecutar el gate Axe automatizado tras
      las interacciones primarias equivalentes. Resultado: cero violaciones en
      home/búsqueda FP y cero impactos `serious` o `critical` en comparador y
      readiness. Los gates de comparador/readiness no afirman cero total para
      impactos menores.
- [x] Revisar consola y red mediante los logs IAB, los recursos DOM del documento
      y los diagnósticos de ruta automatizados. Resultado: cero errores o warnings
      de consola, requests fallidas, respuestas `>=400` o requests externas
      inesperadas. Los enlaces oficiales externos no se activaron durante la QA.
- [x] Medir el overflow en cada estado: `document.body.scrollWidth -
document.body.clientWidth <= 1` y `document.documentElement.scrollWidth -
document.documentElement.clientWidth <= 1`. Resultado observado: `0/0` en todos
      los estados registrados.
- [x] Confirmar geometría de los objetivos táctiles primarios. El botón del menú
      mide exactamente `44 × 44`; sus seis links miden `341 × 44.34`; las tarjetas
      radio de home miden `302.63 × 91.98`, el combobox `302.63 × 50` y el CTA
      `302.63 × 49.59` CSS px. Los enlaces inline de texto no se clasificaron como
      controles táctiles de bloque.

### Matriz de recorridos y estados exactos

| Viewport           | Ruta/fixture y acciones exactas                                                                                                                                                                     | Estado esperado y evidencia a anotar                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop `1280×800` | `/` — modo FP: radio `Tengo un título de FP`; escribir `IFC03S`, confirmar la opción oficial con teclado y revisar el CTA `Ver las salidas de este título`.                                         | La opción queda confirmada, el CTA se habilita y el foco visible no desaparece. Registrar Axe, consola/red y overflow.                                                                                                                                                                                                                                                             |
| Desktop `1280×800` | `/` — modo ocupación: radio `Tengo un empleo en mente`; escribir `Programación web`, elegir `Analistas, programadores y diseñadores web y multimedia` y revisar `Ver cómo llegar a esta ocupación`. | La ocupación queda confirmada y el CTA se habilita. Si se activa, la ruta esperada es `/desde-ocupacion/occupation%3Acno11%3A2713`; anotar foco, Axe, consola/red y overflow.                                                                                                                                                                                                      |
| Desktop `1280×800` | `/desde-fp` — filtro `Filtrar por nivel = Grado medio`, después `Todos los niveles`; búsqueda `texto inventado` (o `zzzzzz`) para cero; finalmente escribir y confirmar `IFC03S`.                   | Cambiar el filtro limpia la búsqueda y deja el CTA deshabilitado; el cero muestra exactamente `No encontramos un ciclo oficial con ese nombre.` y no habilita el CTA; `IFC03S` solo habilita el CTA tras confirmación oficial. Registrar cada estado por separado.                                                                                                                 |
| Desktop `1280×800` | `/desde-fp/IFC03S?province=Le%C3%B3n` — resultado FP con provincia.                                                                                                                                 | Heading `Desarrollo de Aplicaciones Web`, texto `Contexto provincial elegido: León`, CTA de impresión visible y enlace contextual con href exacto `/comparar?program=IFC03S`. Abrir `Ver centros y modalidades`, comprobar `/formacion/IFC03S` y 18 centros; volver atrás y confirmar que la provincia sigue en la URL. Registrar foco, Axe, consola/red y overflow.               |
| Desktop `1280×800` | `/desde-ocupacion/occupation%3Acno11%3A2713` — resultado de ocupación.                                                                                                                              | Heading `Analistas, programadores y diseñadores web y multimedia` visible, `Imprimir esta orientación` visible en estado válido, sin overflow; registrar foco, Axe, consola/red y enlaces de fuente.                                                                                                                                                                               |
| Desktop `1280×800` | `/comparar?level=higher&group=income-group-db9adff8e25e2290&cohort=2019-2020&year=4` — cargar y recargar el canonical.                                                                              | La URL permanece exactamente igual; visible `Cohorte 2019-2020 · año 4 tras titularse`, heading `Ingresos observados del ciclo o grupo en España` y checkbox `Desarrollo de aplicaciones web` marcado. Verificar impresión, foco, Axe, consola/red y overflow.                                                                                                                     |
| Desktop `1280×800` | `/comparar?program=IFC03S` — carga del deep-link por `program`.                                                                                                                                     | Comprobar la reescritura al tuple canónico exacto `/comparar?level=higher&group=income-group-db9adff8e25e2290&cohort=2019-2020&year=4`, el checkbox `Desarrollo de aplicaciones web` marcado, el heading de ingresos y el botón de impresión en resultado válido.                                                                                                                  |
| Desktop `1280×800` | `/comparar?level=higher&group=secret-arbitrary-value&cohort=2019-2020&year=4` — query inválida exacta.                                                                                              | La URL inválida se conserva para recuperación fail-closed; alert exacto `Este enlace de comparación no es válido. Elige de nuevo los datos para continuar.`; no aparece `secret-arbitrary-value`, ni región `Evidencia seleccionada`, ni `Imprimir esta orientación`. Registrar foco, Axe, consola/red y overflow.                                                                 |
| Tablet `768×1024`  | Smoke de las mismas rutas y estados de FP, ocupación y comparación; comprobar el cambio de header en el límite de `48 rem` y la disclosure que corresponda al ancho real.                           | Ningún texto o control cortado; navegación y resultados siguen utilizables con teclado/tacto, targets `44 × 44`, Axe/consola/red limpios y body/document overflow `<=1`.                                                                                                                                                                                                           |
| Tablet `1024×768`  | Smoke de navegación, resultados y print button en las mismas rutas exactas.                                                                                                                         | Navegación de escritorio visible según breakpoint, resultados legibles y sin overflow; anotar las mismas comprobaciones y capturas.                                                                                                                                                                                                                                                |
| Mobile `390×844`   | `/?tab=coverage#freshness` — carga inicial con menú cerrado.                                                                                                                                        | URL, query `?tab=coverage` y hash `#freshness` exactos; botón `Abrir menú principal` con `aria-expanded=false` y `aria-controls="mobile-primary-navigation"`, navegación oculta y sus links fuera del orden de tabulación; región `Fecha de relaciones revisadas`, texto `Relaciones revisadas: copia del …` y su `<time>` completamente visibles. Body y document overflow `<=1`. |
| Mobile `390×844`   | En la misma URL, abrir el menú y luego pulsar `Escape`.                                                                                                                                             | Abierto: botón `Cerrar menú principal`, `aria-expanded=true`, `aria-controls` correcto, link `Inicio` con `aria-current=page` y todos los objetivos visibles `>=44 × 44`. Tras `Escape`: menú oculto, nombre `Abrir menú principal` y foco devuelto al botón; Axe/consola/red y overflow limpios en ambos estados.                                                                 |
| Mobile `390×844`   | Desde `/?tab=coverage#freshness`, abrir menú → activar `Metodología` → `Back` → `Forward`.                                                                                                          | Tras activar: `/metodologia`, menú oculto y el foco no se devuelve al botón por navegación normal. `Back` vuelve exactamente a `/?tab=coverage#freshness` (incluidos query y hash); `Forward` vuelve a `/metodologia`. Registrar cada URL, foco, Axe, consola/red y overflow.                                                                                                      |

Resultado observado: **PASS en las trece filas**. En desktop quedaron confirmados
los dos modos de home, filtro/limpieza/cero/confirmación FP, 18 centros y vuelta
con `province=León`, resultado de ocupación, tuple canónico persistente,
reescritura de `program=IFC03S` y recuperación fail-closed no reflectiva. A
`768×1024` y `1024×768` no hubo clipping ni overflow y el breakpoint mostró la
navegación esperada. A `390×844`, menú cerrado/abierto/Escape, `aria-expanded`,
`aria-controls`, `aria-current`, foco, freshness, `Back` y `Forward` coincidieron
con el contrato exacto. La auditoría visual independiente dio PASS tras corregir
el espaciado de ejemplos y el singular de `1 grupo`.

### Capturas, favicon y tarjeta social

Las 17 capturas nuevas están en
`docs/qa/2026-08-22-contest-product-polish/`. El viewport se fijó con la capacidad
IAB exacta; las capturas full-page excluyen los 15 px ocupados por el scrollbar
cuando corresponde. Todos los archivos fueron verificados como PNG RGB real, no
solo renombrados por extensión.

- [x] `desktop-1280x800-home-fp.png`,
      `desktop-1280x800-home-occupation.png`,
      `desktop-1280x800-desde-fp-filters.png`,
      `desktop-1280x800-desde-fp-zero.png`,
      `desktop-1280x800-desde-fp-ifc03s.png`,
      `desktop-1280x800-desde-fp-ifc03s-leon.png`,
      `desktop-1280x800-desde-ocupacion-cno11-2713.png`.
- [x] `desktop-1280x800-comparar-canonical.png`,
      `desktop-1280x800-comparar-program-ifc03s.png` y
      `desktop-1280x800-comparar-invalid.png`.
- [x] `mobile-390x844-freshness-menu-closed.png`,
      `mobile-390x844-freshness-menu-open.png`,
      `mobile-390x844-metodologia.png`,
      `mobile-390x844-freshness-back.png` y
      `mobile-390x844-metodologia-forward.png`.
- [x] `tablet-768x1024-smoke.png` y `tablet-1024x768-smoke.png`.
- [x] Revisar manualmente `public/salida-cyl-icon.png` a 16×16 y 32×32 px:
      marca legible, fondo marfil cálido liso, sin checkerboard ni texto cortado.
- [x] Revisar `public/salida-cyl-social.png` en el crop Open Graph 1200×630
      (1.91:1): se conserva completo `SALIDA CyL — FP y empleo con datos públicos`,
      sin recorte de texto, personas, rankings, puntuaciones ni números inventados.

### Previsualización A4

- [x] Auditoría estática del CSS cargado: `@page { size: a4; margin: 14mm; }`,
      dos bloques `@media print`, una columna en rejillas de evidencia, overflow
      visible en tarjetas/tablas y `break-inside: avoid` donde corresponde.
- [x] Auditoría DOM/source de las tres rutas: FP, ocupación y comparador conservan
      título, entidad oficial, resumen, evidencia, fuentes, fechas, cautelas y
      limitaciones; print CSS oculta header/footer, formularios, filtros, acciones,
      skip link y botón de impresión. Los E2E exigen exactamente una llamada a
      `window.print()` en cada resultado válido.
- [ ] Previsualización nativa y capturas `a4-fp-result.png`,
      `a4-occupation-result.png` y `a4-comparator.png`: **no realizadas**. Codex
      IAB solo expone `pageAssets` en la pestaña y viewport de pantalla en el
      navegador; no expone print preview, media `print`, PDF ni CDP. Usar otro
      navegador o Playwright directo contradiría la elección de navegador y
      requeriría autorización nueva.

**Waiver Frontier `A4-IAB-20260822`: ACCEPT-WITH-WAIVER únicamente para integrar
la evidencia E2E/de pantalla y continuar auditorías locales que no formen un
candidato de release.** La evidencia estática, DOM y de invocación reduce el
riesgo, pero no certifica paginación real, cortes entre páginas ni legibilidad
del render nativo. Antes de iniciar release-hardening Task 5, publicar, desplegar
o presentar al concurso debe ejecutarse una previsualización A4 humana en un
navegador autorizado y adjuntar las tres capturas; este waiver no autoriza esas
acciones.

La matriz de pantalla queda aprobada. El gate final de Task 8 permanece bloqueado
exclusivamente por la previsualización A4 nativa; release-hardening Task 5 no está
autorizado todavía.
