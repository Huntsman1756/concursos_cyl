# Candidatos de alias FP – Análisis de ofertas

## Resumen del snapshot

- Identificador del snapshot: `20260812091756510-cac7c1d65a73`
- Total de ofertas analizadas: 1054
- Relaciones aprobadas (enlaces): 36
- Relaciones con cero coincidencias: 27
- Programas con cero coincidencias: 11

## Recuentos de candidatos

- Candidatos totales: 11
- Hipótesis revisión (solapamiento): 11
- Frases exactas contiguas (fuente oficial): 0
- Coincidencias de alias aprobadas: 0
- Coincidencias por frase: 0
- Coincidencias por solapamiento de tokens: 0

### Hipótesis revisión (solapamiento)

| Alias                                                                                    | Programa                                               | Ocupación                                                                       | Ofertas   | Causa                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| Alias                                                                                    | Programa                                               | Ocupación                                                                       | Ofertas   | Causa                                               | Colisiones            |
| ---                                                                                      | ---                                                    | ---                                                                             | ---       | ---                                                 | ---                   |
| `SOLDADORES DE ESTRUCTURAS METÁLICAS PESADAS`                                            | FME02M (Soldadura y Calderería)                        | Montadores de estructuras metálicas (occupation:cno11:7314)                     | 3 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.67 | —                     |
| `CONDUCTORES-OPERADORES DE HORMIGONERA MÓVIL`                                            | AGA01M (Producción Agroecológica)                      | Operadores de maquinaria agrícola móvil (occupation:cno11:8321)                 | 2 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.50 | —                     |
| `MONTADORES DE GRANDES ESTRUCTURAS METÁLICAS, EN GENERAL`                                | FME02M (Soldadura y Calderería)                        | Montadores de estructuras metálicas (occupation:cno11:7314)                     | 2 ofertas | token_overlap_hypothesis;share_stems=3;overlap=1.00 | —                     |
| `SOLDADORES DE ESTRUCTURAS METÁLICAS LIGERAS`                                            | FME02M (Soldadura y Calderería)                        | Montadores de estructuras metálicas (occupation:cno11:7314)                     | 2 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.67 | —                     |
| `CONDUCTORES-OPERADORES DE MAQUINARIA DE TRANSPORTE DE TIERRAS, EN GENERAL`              | AGA01M (Producción Agroecológica)                      | Operadores de maquinaria agrícola móvil (occupation:cno11:8321)                 | 1 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.50 | —                     |
| `MECÁNICOS REPARADORES DE CALEFACCIONES`                                                 | ELE03S (Mantenimiento Electrónico)                     | Mecánicos y reparadores de equipos electrónicos (occupation:cno11:7531)         | 1 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.50 | —                     |
| `MECÁNICOS REPARADORES DE EQUIPOS INDUSTRIALES DE REFRIGERACIÓN Y CLIMATIZACIÓN`         | ELE03S (Mantenimiento Electrónico)                     | Mecánicos y reparadores de equipos electrónicos (occupation:cno11:7531)         | 1 ofertas | token_overlap_hypothesis;share_stems=3;overlap=0.75 | occupation:cno11:7250 |
| `MECÁNICOS REPARADORES DE EQUIPOS INDUSTRIALES DE REFRIGERACIÓN Y CLIMATIZACIÓN`         | IMA02M (Instalaciones Frigoríficas y de Climatización) | Mecánicos-instaladores de refrigeración y climatización (occupation:cno11:7250) | 1 ofertas | token_overlap_hypothesis;share_stems=3;overlap=0.75 | occupation:cno11:7531 |
| `MECÁNICOS REPARADORES DE MAQUINARIA DE CONSTRUCCIÓN, MOVIMIENTO DE TIERRAS Y/O MINERÍA` | ELE03S (Mantenimiento Electrónico)                     | Mecánicos y reparadores de equipos electrónicos (occupation:cno11:7531)         | 1 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.50 | —                     |
| `MECÁNICOS-AJUSTADORES DE MAQUINARIA AGRÍCOLA, EN GENERAL`                               | AGA01M (Producción Agroecológica)                      | Operadores de maquinaria agrícola móvil (occupation:cno11:8321)                 | 1 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.50 | —                     |
| `PINTORES DE ESTRUCTURAS METÁLICAS Y CASCOS DE BUQUES`                                   | FME02M (Soldadura y Calderería)                        | Montadores de estructuras metálicas (occupation:cno11:7314)                     | 1 ofertas | token_overlap_hypothesis;share_stems=2;overlap=0.67 | —                     |

## Limitaciones

- Análisis determinístico basado en la instantánea v1; no estima el empleo total del mercado.
- Solo se examinan relaciones aprobadas con cero coincidencias actuales.
- Las frases exactas contiguas de la cita oficial se priorizan sobre hipótesis de solapamiento.
- No se modifica la colección de alias aprobados ni se aprueba ningún candidato automáticamente.
- Solo se utilizan campos normalizados (título, descripción, requisitos); no se analiza el texto de la oferta original completo.
- Los alias ya publicados en occupationAliases no se re-incluyen como candidatos nuevos.
- No se consideran ofertas no publicadas ni requisitos fuera del recurso published-requirements.

## Decisión

Se identificaron 11 candidatos de alias como REVISIÓN para relaciones aprobadas sin coincidencia de ofertas. Ningún candidato se aprueba automáticamente; estos resultados son evidencia para revisión por Sol y Gemma.

[Este informe es determinístico y carece de marcas de tiempo murciélago. Los recuentos corresponden a la instantánea controlada.]
