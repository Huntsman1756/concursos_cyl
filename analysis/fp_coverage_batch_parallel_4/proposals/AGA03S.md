# Propuesta de cobertura CNO-11 — AGA03S

## Titulo analizado

**Codigo:** AGA03S
**Titulo oficial:** Tecnico Superior en Ganaderia y Asistencia en Sanidad Animal
**Familia profesional:** Agraria (AGA)
**Fuente:** `analysis/fp_coverage_batch_parallel_4/sources/AGA03S.txt`

## Ambito del titulo

Este titulo cubre exclusivamente **ganaderia, asistencia en sanidad animal, cuidados equinos y productos veterinarios**. No cubre gestion del arbolado, levantamientos geodesicos ni seguridad ciudadana; no existen salidas equivalentes en esos ambitos dentro de este titulo.

## Metodologia

Se evaluaron las 10 salidas del titulo contra las ocupaciones CNO-11 **approved** del archivo `data/curated/occupations.json`. Solo se consideraron candidatos con `reviewStatus: "approved"`. Se busco correspondencia exacta o funcional directa, preservando la jerarquia laboral (el titulo es de tecnico superior / nivel 3).

---

## Candidatos identificados

### 1. Visitador de productos de veterinaria

| Campo               | Valor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Salida fuente**   | Visitador / visitadora de productos de veterinaria.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Cita literal**    | "Visitador / visitadora de productos de veterinaria."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **occupationId**    | `occupation:cno11:2640`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Codigo CNO-11**   | 2640                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Etiqueta exacta** | Profesionales de ventas tecnicas y medicas (excepto las TIC)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Justificacion**   | La salida describe la visita comercial a clientes para vender o promocionar productos veterinarios. El CNO-11 2640 cubre "Profesionales de ventas tecnicas y medicas (excepto las TIC)", que incluye la venta de productos medicos y tecnicos a clientes profesionales. Los productos veterinarios son un subconjunto de productos medicos. La funcion es esencialmente la misma: vender productos tecnicos/medicos especializados a clientes del sector sanitario. La jerarquia laboral es compatible (nivel tecnico/profesional de ventas). |
| **Riesgo**          | **Medio.** La correspondencia funcional es directa en cuanto a la actividad de venta de productos medicos/tecnicos, pero el CNO-11 2640 no menciona especificamente productos de salud animal o veterinaria. La especializacion en el sector ganadero/veterinario no queda reflejada en la etiqueta del CNO-11. Podria haber sobreinclusion si el visitador trabaja exclusivamente con clientes ganaderos, aunque la funcion base (venta tecnica medica) es equivalente.                                                                      |

---

## Salidas sin candidato CNO-11 approved

Las siguientes 9 salidas **no tienen correspondencia exacta ni funcional directa** con ninguna ocupacion CNO-11 approved en `data/curated/occupations.json`:

### 2. Ayudante de veterinaria en equipos veterinarios especializados en animales de granja y produccion

| Campo                    | Valor                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Ayudante de veterinaria en equipos veterinarios especializados en animales de granja y producción, en explotaciones ganaderas,en empresas del sector agroalimentario y de servicios a la ganadería"                          |
| **Motivo sin candidato** | El catalogo curado no contiene ocupaciones de asistencia veterinaria ni de salud animal. La ocupacion mas cercana del catalogo oficial (3327 - Ayudantes de veterinaria) no esta presente en `data/curated/occupations.json`. |
| **Riesgo**               | La ocupacion 5621 (Tecnicos auxiliares de farmacia) cubre asistencia tecnica en farmacia humana, no veterinaria. No es correspondencia funcional directa.                                                                     |

### 3. Encargado/a de explotacion ganadera, en general

| Campo                    | Valor                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Encargada / encargado de explotación ganadera, en general."                                                                                                                                                                     |
| **Motivo sin candidato** | No existe en el catalogo curado una ocupacion de direccion o gestion de explotaciones ganaderas. Las ocupaciones 6110/6120 (actividades agricolas/huertas) se refieren a trabajos cualificados agricolas, no a gestion ganadera. |
| **Riesgo**               | Alto. La gestion de explotaciones ganaderas es una funcion de supervision tecnica que no tiene equivalente en el catalogo curado.                                                                                                |

### 4. Encargado/a de maquinas y equipos ganaderos

| Campo                    | Valor                                                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Encargada / encargado de máquinas y equipos ganaderos."                                                                                                                                                                          |
| **Motivo sin candidato** | La ocupacion 8321 (Operadores de maquinaria agricola movil) es de nivel 8 (operador) y se refiere a la operacion de maquinaria, no a la gestion o supervision de equipos ganaderos especificos. La jerarquia laboral no coincide. |
| **Riesgo**               | Alto. Diferencia de nivel jerarquico (tecnico superior vs. operador) y de ambito (ganadero vs. agricola general).                                                                                                                 |

### 5. Responsable de inseminacion artificial en explotaciones ganaderas o en centros de recogida de semen

| Campo                    | Valor                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Responsable de inseminación artificial en explotaciones ganaderas o en centros de recogida de semen."                                         |
| **Motivo sin candidato** | No existe en el catalogo curado ninguna ocupacion relacionada con reproduccion animal, inseminacion artificial o centros de recogida de semen. |
| **Riesgo**               | Muy alto. Funcion altamente especializada sin equivalente en el catalogo CNO-11 curado.                                                        |

### 6. Responsable de la produccion en explotaciones o empresas ganaderas

| Campo                    | Valor                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Responsable de la producción en explotaciones o empresas ganaderas."                                                                                                                           |
| **Motivo sin candidato** | No existe en el catalogo curado una ocupacion de gestion de produccion ganadera. Las ocupaciones 6201-6205 y 6209 (actividades ganaderas) del catalogo oficial no estan presentes en el curado. |
| **Riesgo**               | Alto. Funcion de supervision tecnica de produccion ganadera sin equivalente en el catalogo curado.                                                                                              |

### 7. Responsable del manejo y de los cuidados del ganado y de las instalaciones en centros de adiestramiento, doma y entrenamiento de ganado equino

| Campo                    | Valor                                                                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Responsable del manejo y de los cuidados del ganado y de las instalaciones en centros de adiestramiento, doma y entrenamiento de ganado equino."                                                                                                                                                         |
| **Motivo sin candidato** | Las ocupaciones 3722/3723/3724 (entrenadores/instructores/monitores de actividades deportivas y recreativas) se refieren a actividades deportivas humanas, no al manejo y cuidado de ganado equino. La ocupacion 5893 (Cuidadores de animales y adiestradores) del catalogo oficial no esta en el curado. |
| **Riesgo**               | Alto. El ambito equino (cuidado del ganado, instalaciones, doma) no tiene equivalente funcional en el catalogo curado.                                                                                                                                                                                    |

### 8. Responsable del manejo, de los cuidados y de la administracion de terapias en centros de pupilaje, descanso y recuperacion de ganado equino

| Campo                    | Valor                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Responsable del manejo, de los cuidados y de la administración de terapias en centros de pupilaje, descanso y recuperación de ganado equino." |
| **Motivo sin candidato** | No existe en el catalogo curado una ocupacion de cuidado y terapia de ganado equino.                                                           |
| **Riesgo**               | Alto. Funcion que combina manejo ganadero equino con administracion de terapias, sin equivalente en el catalogo curado.                        |

### 9. Responsable/gestor de ganaderias equinas

| Campo                    | Valor                                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| **Cita literal**         | "Responsable/gestor de ganaderías equinas."                                       |
| **Motivo sin candidato** | No existe en el catalogo curado una ocupacion de gestion de ganaderias equinas.   |
| **Riesgo**               | Alto. Gestion especifica del sector equino sin equivalente en el catalogo curado. |

### 10. Asesor/a y supervisor/a para la planificacion, montaje y funcionamiento de empresas y entidades asociadas a eventos, espectaculos, demostraciones ecuestres, actividades recreativas, deportivas y terapeuticas (hipoterapia)

| Campo                    | Valor                                                                                                                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cita literal**         | "Asesor / asesora y supervisor / supervisora para la planificación, montaje y funcionamiento de empresas y entidades asociadas a eventos, espectáculos, demostraciones ecuestres, actividades recreativas, deportivas y terapéuticas (hipoterapia)." |
| **Motivo sin candidato** | Aunque hay cierto termino solapante con actividades recreativas y deportivas (3722/3723/3724), la salida describe una funcion de asesoria y supervision de empresas ecuestres, no de instruccion deportiva. No es correspondencia funcional directa. |
| **Riesgo**               | Alto. Funcion de asesoria empresarial ecuestre sin equivalente directo.                                                                                                                                                                              |

---

## Resumen de cobertura

| Metrica                                   | Valor |
| ----------------------------------------- | ----- |
| **Total de salidas**                      | 10    |
| **Salidas con candidato CNO-11 approved** | 1     |
| **Salidas sin candidato**                 | 9     |
| **Tasa de cobertura**                     | 10%   |

## Observaciones

1. **Catalogo curado insuficiente:** El archivo `data/curated/occupations.json` no contiene las ocupaciones ganaderas, equinas, veterinarias ni de sanidad animal que si existen en el catalogo oficial CNO-11 (codigos 3327, 5893, 6201-6209, 9520). Esto limita severamente la capacidad de encontrar correspondencias.

2. **Unico candidato con riesgo medio:** La unica correspondencia funcional directa es la salida 10 (Visitador de productos de veterinaria) con el CNO-11 2640 (Profesionales de ventas tecnicas y medicas). El riesgo es medio porque la etiqueta del CNO-11 no menciona explicitamente el sector veterinario/ganadero.

3. **Exclusiones confirmadas:** El titulo AGA03S no cubre gestion del arbolado, levantamientos geodesicos ni seguridad ciudadana. Estas areas no aparecen en ninguna de las 10 salidas del titulo.

4. **Jerarquia laboral preservada:** El titulo es de tecnico superior (nivel 3). El unico candidato (2640) esta en un nivel jerarquico compatible (ventas tecnicas/medicas, nivel 2-3 del CNO-11).

5. **Recomendacion:** Para una cobertura completa del ambito ganadero y de sanidad animal, seria necesario incluir en el catalogo curado las ocupaciones oficiales CNO-11: 3327 (Ayudantes de veterinaria), 5893 (Cuidadores de animales y adiestradores), 6201-6209 (actividades ganaderas) y 9520 (Peones ganaderos).
