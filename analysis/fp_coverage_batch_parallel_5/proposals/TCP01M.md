# TCP01M — Confección y Moda: CNO-11 approved

**Program:** TCP01M — Técnico en Confección y Moda (nivel intermedio, TodoFP)
**Familia:** Textil, Confección y Piel
**Fuente:** 10 salidas profesionales (TodoFP, quotes deduplicadas)
**Catálogo base:** data/curated/occupations.json (solo `reviewStatus: "approved"`)

---

## Criterios de emparejamiento

- Correspondencia exacta o funcional directa para las funciones de: **confección, moda, patronaje, corte y costura industrial**.
- **No se rebajan** funciones de patronaje y moda a confección simple sin cualificación.
- Si no hay candidato approved con correspondencia válida => salida anotada sin candidato.

---

## Filtro del catálogo: aprobados (28 entradas totales de `reviewStatus: "approved"`)

Se filtraron 28 ocupaciones approved de un total de 33 entradas. Las **4 rechazos/draft** se omiten:

| occupationId | label (resumen)                                     | estado   |
| ------------ | --------------------------------------------------- | -------- |
| 3734         | Chefs                                               | rejected |
| 3202         | Supervisores de la construcción de edificios        | rejected |
| 5831         | Supervisores de mantenimiento y limpieza en hoteles | rejected |
| 5891         | Asistentes personales o de compañía                 | rejected |
| 4309         | Empleados administrativos (draft)                   | draft    |

---

## Candidatos con correspondencia approved

### CC-01 — Montajes/ensamblajes genéricos → 8209

| Campo                   | Valor                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**        | `occupation:cno11:8209`                                                                                                                                                                                                                                                                                                                                                   |
| **Código CNO-11**       | 8209                                                                                                                                                                                                                                                                                                                                                                      |
| **Etiqueta exacta**     | `Montadores y ensambladores no clasificados en otros epígrafes`                                                                                                                                                                                                                                                                                                           |
| **Confirmación**        | `Montaje y ensamblaje no clasificado`                                                                                                                                                                                                                                                                                                                                     |
| **Cita literal fuente** | \"Confeccionista.\" (#2);\n\"Especialista en confección.\" (#5);\n\"Oficial de confección.\" (#7);\n\"Cosedor-ensamblador / cosedora-ensambladora.\" (#4)                                                                                                                                                                                                                 |
| **Justificación**       | 8209 agrupa montajes y ensamblajes no incluidos en otro epígrafe. \"Cosedor-ensamblador\" y \"Confeccionista\" implican montaje/ensamblaje de prendas textiles: superposición funcional directa en la operación de ensamblar componentes sobre el producto final. \"Especialista en confección\" y \"Oficial de confección\" pueden ejercerse como ensamblador de prenda. |
| **Riesgo**              | **MEDIO.** 8209 es una categoría residual genérica que abarca todos los ensamblajes no clasificados (electrónica, metal, muebles, etc.). No es exclusivo del sector textil; podría asignarse a puestos de ensamblaje mecánico, por lo que la correspondencia es funcional pero ambigua. No cubre funciones de diseño de patronaje ni corte de piezas.                     |

---

## Salidas sin candidato (todas las demás)

Las siguientes 8 salidas **no disponen de ningún approved en el catálogo** con correspondencia exacta ni funcional directa. Se excluyen explícitamente por riesgo de descalificación o equivalencia forzada.

| #   | Cita literal (fuente)                                                                | Sin candidato: razón                                                  | CNO-11 más cercano NO usado | Por qué no se adopta                                                                                                |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | "Ayudante de sastrería y modistería."                                                | No hay candidato.                                                     | —                           | No existe ningún epígrafe CNO-11 para sastrería, costura o modistería.                                              |
| 3   | \"Cortador / cortadora de prendas y artículos textiles.\"                            | Sin candidato.                                                        | —                           | No existe epígrafe CNO-11 para cortadores textiles. Las funciones de corte de piezas no están representadas.        |
| 4   | "Cosedor-ensamblador / cosedora-ensambladora."                                       | Sin candidato (solapado con CC-01 pero no es correspondencia exacta). | 8209 (generalista)          | Solo 8209 aproxima ensamblaje genérico, pero esta salida es específica de costura industrial; 8209 no acota sector. |
| 6   | \"Marcador-cortador / marcadora-cortadora de prendas y artículos en textil y piel.\" | Sin candidato.                                                        | —                           | Sin epígrafe CNO-11 para maquinaria de corte/tejeduría.                                                             |
| 8   | "Operador / operadora de máquinas de acabado."                                       | Sin candidato.                                                        | —                           | Acabado post-costura no corresponde a ningún epígrafe approved.                                                     |
| 9   | "Operador / operadora de máquinas industriales de coser y bordar."                   | Sin candidato.                                                        | —                           | Sin epígrafe específico para máquinas industriales textiles o bordado.                                              |
| 10  | "Planchador-acabador / planchadora-acabadora."                                       | Sin candidato.                                                        | —                           | Acabado a planchar; no corresponde a ningún approved.                                                               |

**Nota:** 6 salidas de 10 están sin candidato. La falta de epígrafes CNO-11 para el sector textil se considera una **laguna del catálogo actual**, no un fallo del mapeo.

---

## Exclusiones explícitas (se rechazan para esta familia)

- **9700** — _Peones de las industrias manufactureras_: aunque el sector es manufacturing, este epígrafe corresponde a peones generales (mano de obra no cualificada). Rebaja funciones cualificadas (patronaje, costura industrial, corte) a peón genérico → **descalificado**.
- **3209** — _Supervisores de otras industrias manufactureras_: categoría genérica de supervisión no acota sector textil. No corresponde a las funciones listadas → **excluido**.

---

## Resumen del mapeo

| Métrica                      | Valor                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Salida fuente total          | 10                                                                                |
| Candidato CC-01 (8209) cubre | 1-3 salidas (#4, #2, #5, #7: ensamblaje/confección genérica)                      |
| Sin candidato                | 6 de 10                                                                           |
| Rechazadas explícitamente    | 2 (9700, 3209)                                                                    |
| Risk flag                    | **Alto**: 60% de las salidas no mapeadas porque CNO-11 carece de epígrafe textil. |

### Lagunas identificadas

1. **Patronaje y diseño de patrones** — Ausente por completo.
2. **Corte de telas/prendas** — Ausente; no hay epígrafe para cortadores textiles.
3. **Bordado industrial** — Ausente; no hay epígrafe para bordado o máquinas textiles.
4. **Acabado textil (planchado, remate)** — Ausente; solo 10 y 6 sin correspondencia.
5. **Sastrería y modistería** — Ausente; no existe clasificación CNO-11 para estos oficios.
