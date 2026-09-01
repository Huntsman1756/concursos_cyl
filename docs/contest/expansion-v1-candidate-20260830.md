# SALIDA CyL — candidato de expansión V1

Fecha de verificación: 30 de agosto de 2026. Esta nota documenta una expansión de producto, no una autorización de release.

## PRODUCTO

SALIDA incorpora una tercera puerta de entrada: `Desde oferta`. Una persona puede buscar cualquiera de las 1.058 ofertas de la instantánea, leer el requisito literal publicado, distinguir entre relación FP revisada, vía universitaria/regulada, alternativa de cualificación, ambigüedad o ausencia de relación, y seguir solo acciones oficiales respaldadas.

La ruta es `/desde-oferta`. La portada conserva las entradas FP-first y ocupación-first y añade `Estoy mirando una oferta`. Las tres demos reproducibles son `cocina`, `cuidador` y `fisioterapeuta`.

## DATA

El dataset derivado candidato está en:

`/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json`

Su base inmutable es `20260822085631889-fc9bf2ba23f9`. Se genera con `scripts/data/buildOfferEvidenceSnapshot.ts` a partir de los recursos del manifest activo y la revisión curada de `data/curated/offer-evidence-reviews.json`.

El recurso conserva identificador de oferta, título, fuente, fechas, ubicación, empleador como `null`, requisito literal, categoría normalizada, estado de evidencia, citas y URL de procedencia, relaciones FP revisadas y acciones siguientes. No publica datos privados ni transforma la presencia de una oferta en “abierta” o “actual”.

El snapshot candidato está retenido como fuente histórica, pero el manifest activo y `runtimeSnapshotIds` siguen apuntando al baseline. Así se conserva el fallback deployable y no se modifica silenciosamente la evidencia histórica.

## COVERAGE

| Métrica                               | Baseline | Candidato | Denominador / lectura                                                 |
| ------------------------------------- | -------: | --------: | --------------------------------------------------------------------- |
| Ofertas descubribles                  |    1.058 |     1.058 | Todas las ofertas de la población fuente                              |
| Ofertas con requisito publicado       |      354 |       354 | Ofertas con fila en `published-requirements.json`                     |
| Requisitos clasificados de forma útil |       69 |        70 | 1.055 filas de requisito; las restantes 986/985 quedan sin clasificar |
| Ofertas con relación FP revisada      |      133 |       138 | Unión de IDs de oferta; no es cobertura de mercado                    |
| Ofertas con incertidumbre visible     |      353 |       352 | Ofertas con algún requisito ambiguo o sin clasificar                  |
| Vía de certificado profesional        |        — |         3 | Ofertas con acción alternativa de certificado                         |
| Vía de acreditación                   |        — |        26 | Ofertas con experiencia clasificada y procedimiento oficial           |
| Límite/vía universitaria o regulada   |        — |       235 | No implica equivalencia FP, acceso ni empleabilidad                   |

No se fija un objetivo porcentual de cobertura. La mejora FP es exactamente +5 ofertas en el candidato; el resto de la población sigue siendo evidencia utilizable aunque no tenga una relación revisada.

## REQUIREMENTS

La taxonomía publicada es conservadora: `fp`, `university`, `certificate`, `licence`, `experience`, `driving`, `language`, `skill`, `schedule`, `location`, `other` y `unknown`. La cita literal siempre permanece separada de la categoría y del valor normalizado. Lo no resuelto se muestra como tal.

No hay inferencia generativa en runtime. La clasificación y las relaciones se construyen offline con reglas deterministas, revisión explícita y validación de esquema. La interfaz no expone las categorías internas A–G.

## NEXT ACTIONS

- Las relaciones FP revisadas llevan a dónde estudiar el ciclo y a la admisión oficial de FP.
- Los certificados se presentan como alternativa de cualificación y llevan a recursos, con la advertencia explícita de que no equivalen automáticamente a FP.
- La experiencia clasificada lleva al procedimiento oficial de acreditación.
- Las ofertas universitarias/reguladas muestran el límite y la vía universitaria oficial, sin construir un grafo universitario ni afirmar equivalencias.
- La oficina ECYL aparece para contrastar requisitos o acceso cuando la evidencia no permite una acción más específica.
- No se recomienda automáticamente ningún curso ECYL: las 791 fichas no conservan condiciones de frescura suficientes para sostener esa recomendación.

## MAPPINGS

- **Aceptado C:** `PEONES FORESTALES → CNO 9543 → AGA03B`, relación oficial revisada y +3 ofertas. No se amplió a títulos parecidos.
- **Aceptado E:** requisito literal `Técnico en Cocina y Gastronomía` en 2 ofertas, enlazado a `HOT01M` con la cita y la revisión oficial conservadas.
- **B:** no se promovieron candidatos adicionales. La cola se mantiene para una revisión posterior con ganancia potencial, fuerza de evidencia y utilidad ciudadana; no se revisaron automáticamente 121 ofertas.

## UX

QA en navegador local:

- escritorio: portada con tres entradas, búsqueda de ofertas y detalle desplegable;
- móvil de 390×844: navegación compacta y tarjetas en una sola columna;
- Cocina: requisito literal, FP, enlace a `/formacion/HOT01M` y admisión oficial;
- certificado: alternativa visible, caveat de no equivalencia y oficina ECYL;
- ambigüedad: cita literal preservada, sin relación forzada;
- fisioterapia: frontera universitaria visible y acción oficial separada;
- regresión: `/desde-fp`, `/desde-ocupacion` y `/datos-abiertos` cargan correctamente;
- consola del navegador: sin errores en los recorridos comprobados.

## TESTS

- `tsc -p tsconfig.app.json --noEmit`: OK.
- Vite production build: OK.
- Test dirigido de expansión: 6 archivos, 75 tests: OK.
- Suite completo en worktree compartido: 1.228 tests pasaron y 178 quedaron omitidos; los 2 fallos restantes son preflight de `coverage-freeze` por los dos archivos candidatos aún no versionados en este worktree. El test actualizado de presupuesto queda confirmado aparte: 2 archivos, 13 tests: OK.
- Rebuild del snapshot candidato: OK; 1.058 ofertas, IDs únicos, 196 relaciones y controles C/E.
- `release:runtime-data`: OK; conserva solo el snapshot runtime activo.
- `release:candidate:verify`: OK; 21 recursos, 116 registros SEPE.
- `qa:distribution:check`: OK; 21 recursos del manifest y 28 archivos de datos en el bundle runtime, sin duplicados deducibles. El JSON candidato se conserva aparte en `public` hasta su activación autorizada.
- `prettier` sobre los archivos de la expansión: OK después de formatear.
- `npm run lint` y `npm run build` (en su fase `tsc -b`) siguen afectados por scripts de análisis locales preexistentes y ajenos a esta expansión; no se tocaron para no sobrescribir trabajo del usuario. El typecheck de la app, Vite y los checks de release equivalentes pasan.
- `qa:assets:check`: OK tras recalibrar el presupuesto por buckets para esta expansión: JavaScript 572.059/580.000 bytes y CSS 85.436/90.000 bytes; el total de inventario queda en 1.782.458/1.800.000 bytes.

## CLAIMS

Auditoría adversarial: no se afirma equivalencia FP automática, equivalencia universitaria, certificado igual a FP, empleabilidad, garantía de empleo, completitud de mercado ni salario. Se explican fecha y semántica de snapshot, se suprimen cursos ECYL no verificables, y la ambigüedad se conserva visible. Resultado: `EXPANSION_CLAIMS_ACCEPT`.

## CONTEST VALUE

El baseline demuestra relaciones FP↔ocupación; este candidato añade una historia ciudadana verificable de extremo a extremo: oferta real → requisito que realmente publica → relación solo si está revisada → límite explícito → siguiente acción oficial. La tercera demo universitaria demuestra confianza precisamente porque no convierte una profesión regulada en una FP. La contribución open-data también es reutilizable y auditable, no solo una pantalla nueva.

## DIFF

La expansión añade el esquema y snapshot derivado, catálogo de revisiones, builder reproducible, loader validado, dominio de filtros, ruta y estilos de `Desde oferta`, integración en portada/datos abiertos y pruebas. El bundle de producción añade el chunk lazy de la ruta y su hoja de estilos; no añade dependencias externas nuevas.

## FINAL DECISION

`EXPANSION_NEEDS_BOUNDED_FIXES`

El producto y la evidencia candidata están implementados y auditados, pero antes de abrir un PR hace falta resolver el presupuesto de assets y acordar la activación del snapshot candidato en el proceso de release. No se ha hecho push, merge, release ni deploy. El baseline seguro sigue siendo deployable.
