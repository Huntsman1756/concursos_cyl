# Remediación de evidencia del concurso — 2026-08-22

## Límite revisado

La fuente de esta remediación es el commit `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`. La publicación no añade relaciones por similitud ni sustituye una frontera CNO dudosa por otra inferida.

Se retiraron seis relaciones aprobadas sin reemplazo, alias ni fallback:

| Clave    | Evidencia publicada    | Motivo de remediación                                       |
| -------- | ---------------------- | ----------------------------------------------------------- |
| `FME02B  | occupation:cno11:7314` | «Auxiliar de montador / montadora de estructuras metálicas» | La salida oficial está en nivel auxiliar y CNO 7314 expresa una frontera cualificada; falta evidencia que preserve el nivel de responsabilidad. |
| `EOC02SD | occupation:cno11:3129` | «Delineante de obra civil.»                                 | La frontera específica de delineación técnica queda en 3110; 3129 no es una sustitución segura.                                                 |
| `IMP01S  | occupation:cno11:2640` | «Técnica / técnico comercial.»                              | La salida comercial genérica no demuestra el ámbito industrial, médico o farmacéutico de CNO 2640.                                              |
| `AGA01B  | occupation:cno11:4121` | «Auxiliar de almacén de flores.»                            | La asistencia de almacén no demuestra las tareas administrativas de existencias de CNO 4121.                                                    |
| `COM01M  | occupation:cno11:5300` | «Comerciante de tienda.»                                    | La etiqueta no demuestra la propiedad o gestión exigida por CNO 5300.                                                                           |
| `HOT02S  | occupation:cno11:3510` | «Agente de viajes»                                          | La correspondencia correcta es CNO 4421; 3510 no conserva la ocupación publicada.                                                               |

## Invariantes comprobadas

- La publicación final contiene 248 relaciones aprobadas; el grafo derivado y el snapshot activo contienen la misma cifra.
- La cobertura revisada abarca 104 cualificaciones base y 121 claves de modalidad; la cola conserva 104 bases revisadas, 15 resultados sin publicación y 35 bases pendientes.
- Las seis claves retiradas están ausentes de los datos curados, del allow-list de restauración, del grafo derivado y del snapshot.
- El catálogo de ocupaciones no se modifica para fabricar un reemplazo.
- La relación `ELE02B|occupation:cno11:9700` conserva la cita oficial exacta «Peones de industrias manufactureras.».
- La relación `SSC01S|occupation:cno11:2252` conserva ahora la frase BOE contigua «Educador o educadora infantil en primer ciclo de educación infantil».

## Verificación

Las aserciones de ausencia viven en las suites de restauración y validación de mappings. El snapshot y el manifest se regeneraron después de retirar el snapshot no publicado anterior; los snapshots históricos de agosto permanecen byte a byte sin cambios.

La muestra independiente vigente se ha seleccionado sobre el límite `e41c539`, pero aún está pendiente de comprobación viva. Por eso la matriz separa el suelo común del validador de la suficiencia semántica y no presenta la coaparición textual como prueba suficiente.
