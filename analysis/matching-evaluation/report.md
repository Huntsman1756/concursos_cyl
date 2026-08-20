# Evaluación etiquetada de matching FP ↔ ofertas

Esta evaluación es un benchmark reproducible y cerrado para separar verdad etiquetada, métricas y limitaciones.

## Verdad etiquetada

- Fuente: analysis/fp_one_word_publication_reviews.json (d7fce4553804dfcd87ba2039c170f399746cc3b67a084791f59f67f5f00cfdf1)
- Snapshot de ofertas: 20260809014318761-5b22c488ce4b (1077 registros; 5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba)
- Filas auditadas: 68 (54 accepted, 14 rejected)

Las etiquetas se copian y validan desde el audit existente; no se inventan etiquetas en este benchmark.

## Métricas

| Lane               | Predicciones | Dentro de verdad |  TP |  FP | Precisión sobre verdad | Positivos conocidos cubiertos | Cobertura positiva conocida |
| ------------------ | -----------: | ---------------: | --: | --: | ---------------------: | ----------------------------: | --------------------------: |
| shadow_lexical     |           68 |               68 |  54 |  14 |                 79.41% |                         54/54 |                     100.00% |
| published_baseline |            2 |                2 |   2 |   0 |                100.00% |                          2/54 |                       3.70% |

La precisión usa como denominador las predicciones que caen dentro del conjunto etiquetado. Las predicciones fuera de ese conjunto quedan separadas como no etiquetadas y no se convierten en positivos o negativos inventados.

La cobertura positiva conocida es 100.00% para shadow y 3.70% para published_baseline dentro de este audit dirigido. No es recall del mercado, no estima cobertura de todas las ofertas y no permite afirmar que el matcher encuentre todos los positivos reales.

### Shadow por forma

| Forma          | Programa | Predicciones |  TP |  FP | Precisión | Positivos conocidos cubiertos | Cobertura positiva conocida |
| -------------- | -------- | -----------: | --: | --: | --------: | ----------------------------: | --------------------------: |
| albañil        | EOC01M   |            2 |   1 |   1 |    50.00% |                           1/1 |                     100.00% |
| albañiles      | EOC01M   |           22 |  20 |   2 |    90.91% |                         20/20 |                     100.00% |
| cocinero       | HOT01M   |            1 |   0 |   1 |     0.00% |                           0/0 |                         n/a |
| cocineros      | HOT01M   |           40 |  30 |  10 |    75.00% |                         30/30 |                     100.00% |
| encofradores   | EOC01M   |            2 |   2 |   0 |   100.00% |                           2/2 |                     100.00% |
| teleoperadores | COM01M   |            1 |   1 |   0 |   100.00% |                           1/1 |                     100.00% |

## Limitaciones

- La verdad etiquetada es el audit existente de ofertas candidatas; este benchmark no crea etiquetas nuevas.
- La cobertura positiva conocida usa como denominador los positivos del audit cerrado y no es recall del mercado ni cobertura de todas las ofertas de Castilla y León.
- La lane shadow aplica matching léxico a la instantánea histórica y no modifica aliases, datos publicados ni la lógica pública.
- La lane published_baseline reproduce el matcher publicado con aliases curados actuales sobre la instantánea histórica fijada.
- Los resultados dependen de los hashes de la verdad, aliases y snapshot declarados en este artefacto.

## Decisión

El artefacto deja una línea shadow lexical medible y una reproducción del baseline publicado, pero no convierte la shadow en lógica pública. El benchmark no publica ni despliega datos.
