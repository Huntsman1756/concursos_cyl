# Propuesta de correspondencia CNO-11: AGA04M

**Programa:** AGA04M — Aprovechamiento y Conservación del Medio Natural
**Familia:** AGA (Agraria)
**Título oficial:** Técnico en Aprovechamiento y Conservación del Medio Natural
**Nivel:** Intermediate
**Fuente TodoFP:** https://www.todofp.es/que-estudiar/familias-profesionales/agraria/aprovechamiento-conservacion-medio-natural.html

---

## Resumen de correspondencias

| #   | Salida TodoFP | Candidato CNO-11        | Codigo | Etiqueta CNO-11                                                        | Tipo de correspondencia |
| --- | ------------- | ----------------------- | ------ | ---------------------------------------------------------------------- | ----------------------- |
| 11  | Tractorista   | `occupation:cno11:8321` | 8321   | Operadores de maquinaria agrícola móvil                                | Funcional directa       |
| 12  | Viverista     | `occupation:cno11:6120` | 6120   | Trabajadores cualificados en huertas, invernaderos, viveros y jardines | Funcional directa       |

---

## Candidatos detallados

### Candidato 1 — Tractorista

- **occupationId:** `occupation:cno11:8321`
- **Codigo:** 8321
- **Etiqueta exacta:** Operadores de maquinaria agrícola móvil
- **Cita literal TodoFP:** "Tractorista."
- **Justificacion:** La funcion central del tractorista es la conduccion y operacion de maquinaria agricola movil, en particular tractores, para labores de cultivo, preparacion de terreno y transporte en explotaciones agrarias y forestales. La denominacion CNO-11 8321 ("Operadores de maquinaria agricola movil") describe exactamente esta misma funcion: operar maquinaria agricola movil. La correspondencia es funcional directa porque el tractor es el arquetipo de maquinaria agricola movil.
- **Riesgo:** La cobertura CNO-11 8321 es amplia e incluye toda maquinaria agricola movil (excavadoras, cosechadoras, etc.), no solo tractores. Puede subsumir funciones de otras salidas como "Maquinista de procesadora forestal" si se interpreta laxamente, lo cual excede la correspondencia directa con el tractorista.

### Candidato 2 — Viverista

- **occupationId:** `occupation:cno11:6120`
- **Codigo:** 6120
- **Etiqueta exacta:** Trabajadores cualificados en huertas, invernaderos, viveros y jardines
- **Cita literal TodoFP:** "Viverista."
- **Justificacion:** El viverista se dedica al cuidado, mantenimiento y reproduccion de plantas en viveros forestales y ornamentales. La denominacion CNO-11 6120 incluye expresamente "viveros" entre sus ambitos de actuacion, ademas de huertas, invernaderos y jardines. La correspondencia es funcional directa porque el termino "viverista" y la denominacion "viveros" comparten la misma actividad basal: trabajo cualificado en la produccion y mantenimiento de plantas en viveros.
- **Riesgo:** La denominacion CNO-11 6120 es amplia y abarca huertas, invernaderos y jardines, no solo viveros forestales. Un viverista especializado en produccion forestal podria encontrar que la clasificacion CNO-11 no captura la especificidad de su formacion en silvicultura y produccion de planton forestal.

---

## Salidas sin candidato CNO-11 aprobado

Las siguientes 10 salidas del programa AGA04M no tienen correspondencia exacta ni funcional directa con ninguna ocupacion CNO-11 con estado "approved" en el catalogo curado:

| #   | Salida TodoFP                                                                                                 | Motivo de ausencia                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Aplicador / aplicadora de productos fitosanitarios.                                                           | Ninguna ocupacion CNO-11 approved describe la aplicacion de productos fitosanitarios como funcion principal.                                                                                                                                                           |
| 2   | Corchero / corchera.                                                                                          | Ninguna ocupacion CNO-11 approved describe la recoleccion y processing de corcho como funcion principal.                                                                                                                                                               |
| 3   | Injertador / injertadora.                                                                                     | Ninguna ocupacion CNO-11 approved describe la injertacion como funcion principal.                                                                                                                                                                                      |
| 4   | Maquinista de procesadora forestal.                                                                           | Ninguna ocupacion CNO-11 approved describe la operacion de procesadoras forestales.                                                                                                                                                                                    |
| 5   | Motoserrista, talador / taladora, trozador / trozadora.                                                       | Ninguna ocupacion CNO-11 approved describe el trabajo con motosierra, tala o troceo como funcion principal.                                                                                                                                                            |
| 6   | Trabajador / trabajadora cualificado en actividades forestales.                                               | Ninguna ocupacion CNO-11 approved describe actividades forestales cualificadas. El codigo 6110 cubre actividades agricolas (excluyendo huertas, invernaderos, viveros y jardines), no forestales; la equivalencia por semejanza sectorial queda excluida por contrato. |
| 7   | Trabajador / trabajadora especialista de empresas que realicen trabajos de corrección hidrológico-forestal.   | Ninguna ocupacion CNO-11 approved describe trabajos de correccion hidrologico-forestal.                                                                                                                                                                                |
| 8   | Trabajador / trabajadora especialista en aprovechamientos de maderas, corcho y leñas                          | Ninguna ocupacion CNO-11 approved describe el aprovechamiento de maderas, corcho o lenas como funcion principal.                                                                                                                                                       |
| 10  | Trabajador / trabajadora especialista por cuenta propia en trabajos de repoblación y tratamientos selvícolas. | Ninguna ocupacion CNO-11 approved describe repoblacion o tratamientos selvicolas como funcion principal.                                                                                                                                                               |

### Salida excluida por criterio de aceptacion

| #   | Salida TodoFP                                                               | Motivo de exclusion                                                                                                                                                           |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | Trabajador / trabajadora especialista en trabajos de altura en los árboles. | Excluida expresamente por el criterio de aceptacion que proscribe "gestion del arbolado". Los trabajos de altura en arboles constituyen gestion del arbolado (arboricultura). |

---

## Estadisticas de cobertura

- **Total salidas TodoFP:** 12
- **Salida excluida (gestion del arbolado):** 1
- **Salidas elegibles:** 11
- **Con candidato CNO-11 approved:** 2 (18%)
- **Sin candidato CNO-11 approved:** 9 (82%)

---

## Notas metodologicas

1. Solo se consideraron ocupaciones CNO-11 con `reviewStatus: "approved"` en `data/curated/occupations.json`.
2. La correspondencia se evaluo por coincidencia funcional directa (misma actividad basal) o coincidencia literal de terminos clave, no por proximidad sectorial.
3. No se modificaron datos curados ni se infirieron equivalencias por semejanza sectorial, siguiendo la restriccion del contrato.
4. La gestion del arbolado (quote 9 del TodoFP) fue excluida segun criterio de aceptacion.
