# Reglas de evidencia

## Ofertas

| Estado | Significado visible |
| --- | --- |
| `explicit_fit` | La oferta publica una titulación pertinente o existe una relación ocupacional exacta aprobada. |
| `declared_explicit_gap` | La oferta publica un requisito y la persona declara que no lo tiene. |
| `unclassified_requirement` | Hay texto de requisito, pero no se puede clasificar con seguridad. |
| `incomplete` | Falta información suficiente para afirmar encaje o brecha. |

Cada requisito conserva categoría, valor normalizado, cita exacta, regla y versión del parser. «No publicado» significa que la fuente no lo declara; no significa que la oferta carezca de ese requisito.

## Resultados

- Los valores `null` con supresión se muestran como «No publicado».
- Se exige una misma cohorte y año desde la graduación.
- Se exige la misma medida y unidad.
- Los indicadores `spain_program_group` se presentan separados de los indicadores regionales.
- No se suma, imputa, promedia ni convierte una referencia regional en un resultado por ciclo.

## Acciones

Las acciones son un contrato cerrado: `open_original_offer`, `verify_unpublished_requirement`, `adjust_search_area`, `review_remote_work`, `view_regulated_training_route`, `explore_related_occupations` y `view_training_centers`. Cada acción lleva destino oficial o filtro interno explícito; ninguna envía datos personales ni crea una cuenta.
