# Informe IMS05S: Iluminación, Captación y Tratamiento de Imagen

## 1. Objetivo

Análisis del programa **IMS05S** (Técnico Superior en Iluminación, Captación y Tratamiento de Imagen) para identificar candidatos CNO-11 _approved_ de correspondencia exacta o funcional directa en las áreas de iluminación, captación de imagen, tratamiento de imagen, fotografía y video.

**Exclusiones explícitas (según contrato):**

- Sonorización.
- Animación musical.
- Iluminación escénica/espectáculos en vivo (perfiles distintos de la imagen audiovisual).

## 2. Fuentes

- **Programa (TodoFP):** `analysis/fp_coverage_batch_parallel_5/sources/IMS05S.txt` (13 citas literales).
- **Catálogo (CNO-11):** `data/curated/occupations.json` (Solo ocupaciones con `reviewStatus: approved`).

## 3. Candidatos CNO-11 (Correspondencia Funcional Directa)

Tras revisar el catálogo CNO-11 aprobado, se identifica una única correspondencia funcional directa para roles de **tratamiento de imagen digital** y **sistemas de imagen**.

| #   | Cita Literal TodoFP                                      | Categoría             | occupationId            | Codigo | Etiqueta Exacta CNO-11                                  | Justificación Funcional                                                                                                                                             | Riesgo / Nota                                                                                                                                         |
| --- | -------------------------------------------------------- | --------------------- | ----------------------- | ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Retocador fotográfico / retocadora fotográfica digital   | Tratamiento de Imagen | `occupation:cno11:2713` | 2713   | Analistas, programadores y diseñadores web y multimedia | El diseño multimedia es el único perfil aprobado que incluye de forma explícita la manipulación y edición de contenidos de imagen digital como competencia técnica. | Medio: El foco del CNO-11 es el desarrollo web y multimedia, por lo que puede no cubrir el retoque fotográfico artístico o de prensa puro.            |
| 12  | Supervisor de sistemas digitales y vectoriales de imagen | Tratamiento de Imagen | `occupation:cno11:2713` | 2713   | Analistas, programadores y diseñadores web y multimedia | La gestión de sistemas de imagen digital y vectorial se solapa con la administración y diseño de contenidos multimedia complejos.                                   | Medio: El rol de "supervisor" en el programa puede implicar una gestión de infraestructura de vídeo o cámara que va más allá del software multimedia. |

**Nota sobre iluminación:** Aunque existen roles técnicos en electricidad (`3123`) o electrónica (`3124`), su etiqueta generalista no corresponde a la especialización de "iluminación de imagen" (TV/Cine), por lo que se descartan para evitar mapeos indirectos de alto riesgo.

## 4. Salidas sin Candidato CNO-11 Approved (Ausencias)

Las siguientes salidas del catálogo TodoFP **no poseen una correspondencia directa ni funcional aceptable** en el listado curado actual:

- **Captación de Imagen y Video:**
  1. Ayudante de cámara (Cita: "1. Ayudante de cámara.")
  2. Cámara de cine, vídeo y televisión (Cita: "3. Cámara de cine, vídeo y televisión.")
  3. Cámara de ENG (Electronics News Gathering) (Cita: "4. Cámara de ENG (Electronics News Gathering).")
- **Fotografía:** 5. Foto fija (Cita: "5. Foto fija.") 6. Fotógrafa / fotógrafo (Cita: "6. Fotógrafa / fotógrafo.") 9. Reportero gráfico / reportera gráfica (Cita: "9. Reportero gráfico / reportera gráfica.")
- **Iluminación (Especializada en Imagen):** 2. Ayudante de iluminación (Cita: "2. Ayudante de iluminación.") 7. Iluminador / iluminadora de televisión (Cita: "7. Iluminador / iluminadora de televisión.")

## 5. Perfiles Excluidos (Iluminación Escénica)

Los siguientes perfiles se excluyen del análisis por pertenecer a la industria del espectáculo en vivo, la cual se separa expresamente de la iluminación de imagen (TV/Cine) en el contrato:

- 8. Luminotécnica / luminotécnico de espectáculos en vivo.
- 10. Responsable de iluminación en espectáculos en vivo.
- 13. Técnica / técnico de mesas de control de iluminación en espectáculos.

## 6. Conclusiones y Riesgos

- **Agrupación Multimedia:** El código CNO-11 `2713` es el único punto de entrada aprobado para el subcatálogo, limitándose al ámbito del **tratamiento digital**.
- **Ausencias de Captación y Fotografía:** El 70% de las salidas relevantes del programa (7 de 10) no tienen contrapartidas aprobadas en el conjunto de datos actual. Esto sugiere que el listado curado carece de categorías como `2522` (Productores/Directores de cine) o `3521` (Técnicos audiovisuales) que suelen albergar a camarógrafos, fotógrafos e iluminadores.
- **Riesgo de Mapeo:** Se evita el mapeo de "Iluminador de TV" a "Técnico en electricidad" (`3123`) debido a la alta especialización del oficio audiovisual frente a la electricidad industrial o de edificación.
