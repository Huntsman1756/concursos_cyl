# Propuesta de cobertura CNO-11 — INA01S

## Datos del programa

| Campo      | Valor                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Clave      | INA01S                                                                                                 |
| Titulación | Técnico Superior en Vitivinicultura                                                                    |
| Familia    | INA — Industrias Alimentarias                                                                          |
| Nivel      | higher (Técnico Superior)                                                                              |
| Fuente     | TodoFP                                                                                                 |
| URL fuente | https://www.todofp.es/que-estudiar/familias-profesionales/industrias-alimentarias/vitivinicultura.html |

---

## Citas literales TodoFP (7)

| #   | Cita literal                                                                           |
| --- | -------------------------------------------------------------------------------------- |
| 1   | Analista sensorial.                                                                    |
| 2   | Encargada / encargado de envejecimiento y crianza de destilados y vinagres.            |
| 3   | Encargada / encargado de la línea de envasado de destilación, concentrados y vinagres. |
| 4   | Encargada / encargado de proceso de destilación y rectificación.                       |
| 5   | Encargada / encargado de recepción de mostos frescos y sulfatados.                     |
| 6   | Supervisor / supervisora de columnas de destilación y concentración.                   |
| 7   | Vitivinícola.                                                                          |

---

## Candidatos CNO-11 approved — correspondencia funcional directa

### Candidato 1 — Analista sensorial

| Campo                 | Valor                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------- |
| occupationId          | `occupation:cno11:3160`                                                               |
| Código CNO-11         | 3160                                                                                  |
| Etiqueta exacta       | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías |
| reviewStatus          | approved                                                                              |
| Cita literal cubierta | Analista sensorial                                                                    |

**Justificación:** El análisis sensorial en vitivinicultura es una función de control de calidad aplicada a productos alimentarios que requiere conocimientos de ciencias físicas y químicas (umbral sensorial, fichas de cata, métodos descriptorios). El código 3160 recoge específicamente técnicos de control de calidad en ciencias físicas y químicas, lo que constituye correspondencia funcional directa con la actividad de analista sensorial en la industria del vino.

**Riesgo:** Bajo. La correspondencia es funcional directa y se mantiene en el grupo 3 del CNO-11 (profesionales técnicos y afines), preservando el nivel jerárquico de Técnico Superior.

---

### Candidato 2 — Encargada / encargado de envejecimiento y crianza de destilados y vinagres

| Campo                 | Valor                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| occupationId          | `occupation:cno11:3209`                                                    |
| Código CNO-11         | 3209                                                                       |
| Etiqueta exacta       | Supervisores de otras industrias manufactureras                            |
| reviewStatus          | approved                                                                   |
| Cita literal cubierta | Encargada / encargado de envejecimiento y crianza de destilados y vinagres |

**Justificación:** La supervisión de procesos de envejecimiento y crianza de destilados y vinagres corresponde a una función de supervisión en industria manufacturera de alimentos. El código 3209 recoge supervisores de industrias manufactureras no clasificadas en otros epígrafes, lo que incluye la supervisión de procesos de elaboración en la industria vinícola y de destilados. El rol implica gobierno de proceso productivo, control de tiempos de crianza y gestión de recursos, propias de un puesto de supervisión manufacturera.

**Riesgo:** Medio. 3209 es un código amplio ("otras industrias manufactureras") que no especifica sector alimentario. Sin embargo, es el único código approved de supervisión manufacturera disponible en el catálogo que no contradice la jerarquía del programa.

---

### Candidato 3 — Encargada / encargado de la línea de envasado de destilación, concentrados y vinagres

| Campo                 | Valor                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------- |
| occupationId          | `occupation:cno11:3209`                                                               |
| Código CNO-11         | 3209                                                                                  |
| Etiqueta exacta       | Supervisores de otras industrias manufactureras                                       |
| reviewStatus          | approved                                                                              |
| Cita literal cubierta | Encargada / encargado de la línea de envasado de destilación, concentrados y vinagres |

**Justificación:** La supervisión de líneas de envasado en la industria del vino y destilados es una función de supervisión en planta manufacturera de alimentos. El código 3209 cubre supervisores de procesos productivos en industrias manufactureras, incluyendo líneas de envasado, embotellado y acondicionamiento de productos alimentarios. La gestión de líneas de envasado implica control de calidad en línea, coordinación de operarios y cumplimiento de especificaciones de producto, competencias propias de la supervisión manufacturera.

**Riesgo:** Medio. Mismo caso que el Candidato 2; la amplitud del código 3209 introduce ambigüedad sectorial, pero es la mejor correspondencia disponible sin descender jerárquicamente.

---

### Candidato 4 — Encargada / encargado de proceso de destilación y rectificación

| Campo                 | Valor                                                           |
| --------------------- | --------------------------------------------------------------- |
| occupationId          | `occupation:cno11:3209`                                         |
| Código CNO-11         | 3209                                                            |
| Etiqueta exacta       | Supervisores de otras industrias manufactureras                 |
| reviewStatus          | approved                                                        |
| Cita literal cubierta | Encargada / encargado de proceso de destilación y rectificación |

**Justificación:** La supervisión de procesos de destilación y rectificación es una función de supervisión de proceso industrial en el ámbito de la industria alimentaria y de bebidas. La destilación y rectificación son operaciones unitarias de separación que forman parte del procesamiento industrial de alimentos (vinos, destilados, vinagres). El código 3209 recoge supervisores de industrias manufactureras y es funcionalmente equivalente a la supervisión de este tipo de procesos productivos.

**Riesgo:** Medio. La destilación y rectificación son procesos con alto contenido técnico; un código más específico de control de procesos (3139) podría ser más preciso, pero 3139 es "Técnicos" (nivel técnico, no de supervisión), por lo que 3209 preserva mejor la jerarquía de "Encargada/Encargado" como rol de supervisión.

---

### Candidato 5 — Encargada / encargado de recepción de mostos frescos y sulfatados

| Campo                 | Valor                                                             |
| --------------------- | ----------------------------------------------------------------- |
| occupationId          | `occupation:cno11:3209`                                           |
| Código CNO-11         | 3209                                                              |
| Etiqueta exacta       | Supervisores de otras industrias manufactureras                   |
| reviewStatus          | approved                                                          |
| Cita literal cubierta | Encargada / encargado de recepción de mostos frescos y sulfatados |

**Justificación:** La supervisión de la recepción de mostos frescos y sulfatados es una función de supervisión de aprovisionamiento y control de materias primas en industria alimentaria. El mosto es la materia prima fundamental de la elaboración vinícola; su recepción implica control de calidad de entrada, verificación de parámetros (grado Brix, acidez, sulfuro), gestión documental y coordinación logística. El código 3209 recoge supervisores de procesos productivos en industrias manufactureras, y la recepción de materias primas es una etapa crítica de dichos procesos.

**Riesgo:** Medio. La recepción de mostos tiene componente logístico y de control de calidad que podría corresponder parcialmente a códigos de gestión de almacén (4121), pero el rol es de supervisión de proceso, no de empleo administrativo, por lo que 3209 es más preciso jerárquicamente.

---

### Candidato 6 — Supervisor / supervisora de columnas de destilación y concentración

| Campo                 | Valor                                                               |
| --------------------- | ------------------------------------------------------------------- |
| occupationId          | `occupation:cno11:3209`                                             |
| Código CNO-11         | 3209                                                                |
| Etiqueta exacta       | Supervisores de otras industrias manufactureras                     |
| reviewStatus          | approved                                                            |
| Cita literal cubierta | Supervisor / supervisora de columnas de destilación y concentración |

**Justificación:** La supervisión de columnas de destilación y concentración es una función de supervisión de equipos industriales de procesamiento en la industria alimentaria y de bebidas. Las columnas de destilación y concentración son equipos críticos en la producción de destilados, concentrados de mosto y vinagres; su supervisión implica gobierno de operación de equipos, control de parámetros de proceso (temperatura, caudal, presión) y gestión de seguridad industrial. El código 3209 recoge supervisores de industrias manufactureras y es funcionalmente equivalente a la supervisión de este tipo de equipos.

**Riesgo:** Medio. Las columnas de destilación son equipos de proceso con alta complejidad técnica. El código 3139 (Técnicos en control de procesos) podría ser más específico, pero al ser un código de nivel técnico (no de supervisión), 3209 preserva mejor la jerarquía del puesto de "Supervisor/Supervisora".

---

## Salidas sin candidato approved

| #   | Cita literal | Motivo de ausencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Vitivinícola | El término "Vitivinícola" designa la identidad profesional global del programa (Técnico Superior en Vitivinicultura) y no corresponde a una tarea concreta con equivalentes funcionales en CNO-11. El candidato más próximo en dominio sería 6110 (Trabajadores cualificados en actividades agrícolas), pero este código pertenece al grupo 6 del CNO-11 (trabajadores agrícolas cualificados) y constituiría una rebaja jerárquica inaceptable: INA01S es nivel "higher" (Técnico Superior) y mapear su identidad profesional a un código de trabajador agrícola violaría la instrucción de no rebajar supervisión técnica a peonaje agrícola. Tampoco corresponde confundir esta identidad profesional con hostelería (3734, 5110, 5120) ni con venta minorista (5210, 5220, 5300). No existe en el catálogo CNO-11 approved un código específico para enólogos, tecnólogos alimentarios o técnicos superiores en vitivinicultura. |

---

## Resumen de cobertura

| Métrica                             | Valor                             |
| ----------------------------------- | --------------------------------- |
| Total citas TodoFP                  | 7                                 |
| Citas con candidato approved        | 6                                 |
| Citas sin candidato                 | 1                                 |
| Códigos CNO-11 utilizados           | 3160, 3209                        |
| Rechazos por degradación jerárquica | 1 (Vitivinícola → 6110 rechazado) |
| Rechazos por confusión sectorial    | 0                                 |

### Nota sobre jerarquía

INA01S es un programa de nivel "higher" (Técnico Superior). Todos los candidatos propuestos pertenecen al grupo 3 del CNO-11 (profesionales técnicos y afines), preservando la jerarquía laboral. Se ha excluido expresamente:

- Grupo 6 (agrícolas): 6110, 6120 — rebajaría supervisión técnica a trabajo agrícola cualificado
- Grupo 9 (elementales): 9700 — rebajaría supervisión técnica a peonaje
- Hostelería: 3734 (Chefs), 5110 (Cocineros), 5120 (Camareros) — confundiría industria del vino con restauración
- Comercio: 5210 (Jefes de sección tiendas), 5220 (Vendedores), 5300 (Comerciantes) — confundiría producción con venta minorista

### Nota sobre amplitud de 3209

Cinco de las seis citas con candidato mapean a 3209 (Supervisores de otras industrias manufactureras). Esto refleja una limitación estructural del catálogo CNO-11 approved: no existe un código específico para supervisores de industria alimentaria o vinícola. El código 3209 es la mejor correspondencia funcional disponible sin comprometer la jerarquía del programa.
