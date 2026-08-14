# Análisis de cobertura IMS02S

## Fuente

- **Título:** Técnico Superior en Realización de Proyectos Audiovisuales y Espectáculos
- **Sistema:** TodoFP
- **Familia:** Imagen y Sonido (IMS)
- **URL:** https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/realizacion-proy-audiovisuales-espectaculos.html

## Alcance del título (según contrato)

- **Incluye:** Realización de proyectos audiovisuales y espectáculos, dirección de cine/televisión/video, regiduría de espectáculos en vivo.
- **Excluye expresamente:** Sonorización, animación musical, iluminación, ajuste de imagen digital.

## Categorización de las salidas del catálogo fuente

Las 9 salidas de IMS02S se agrupan en tres dominios funcionales:

| Dominio                    | Salidas fuente                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dirección**              | 1. Ayudante de dirección en cine.                                                                                                                     |
| **Realización**            | 2. Ayudante de realización de televisión. / 3. Ayudante de realización de vídeo.                                                                      |
| **Montaje/Postproducción** | 4. Editor-montador / editora-montadora de vídeo. / 6. Montador / montadora de cine.                                                                   |
| **Regiduría**              | 5. Jefa / jefe de regiduría. / 7. Regidor / regidora de espectáculos en vivo. / 8. Regidor / regidora de eventos. / 9. Regidor / regidora de paredes. |

Todas las salidas están dentro del alcance declarado del título (dirección, realización, regiduría). Ninguna corresponde a los perfiles excluidos (sonorización, animación musical, iluminación).

## Candidatos CNO-11 approved: correspondencia exacta o funcional directa

**No se identifican candidatos CNO-11 approved de correspondencia exacta o funcional directa** para ninguna de las 9 salidas de IMS02S.

### Razonamiento del vacío

El catálogo CNO-11 contiene los siguientes códigos que cubrirían el dominio audiovisual, pero **ninguno se encuentra en el catálogo aprobado** (`data/curated/occupations.json`):

| Código CNO-11 esperado | Etiqueta esperada                                                               | Salidas IMS02S que cubriría            | Estado en catálogo |
| ---------------------- | ------------------------------------------------------------------------------- | -------------------------------------- | ------------------ |
| 2642                   | Directores de fotografía, cine y televisión                                     | 1, 2, 3 (dirección/realización)        | **No presente**    |
| 2652                   | Profesionales de la producción cinematográfica, de televisión y del espectáculo | 4, 5, 6, 7, 8, 9 (montaje y regiduría) | **No presente**    |
| 2650                   | Profesionales de la dirección artística, escénica y afines                      | 5, 7 (regiduría escénica)              | **No presente**    |

### Candidato funcional evaluado y descartado

| Código CNO-11 | preferredLabel                                            | Evaluación                                                                                                                                                                                                                                                                                                                                                       | Resultado                                      |
| ------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 3724          | Monitores de actividades recreativas y de entretenimiento | Se evaluó como candidato funcional para "Regidor/a de eventos" (salida 8). Sin embargo, 3724 describe la supervisión/monitorización de actividades recreativas, no la dirección técnica de regiduría escénica. La regiduría de espectáculos implica gestión técnica de espacios, montaje y coordinación de producción en vivo, que es cualitativamente distinto. | **Descartado** — correspondencia insuficiente. |

Ningún otro código aprobado del catálogo (2312, 2713, 3713, 3722, 3723, ni ninguno del grupo 5xxx o 7xxx) tiene relación funcional con dirección audiovisual, realización o regiduría.

## Salidas sin candidato CNO-11 approved

Todas las salidas del catálogo fuente quedan sin candidato:

| #   | Cita literal (salida fuente)                  | Dominio                | Candidato CNO-11 approved | Observación                                                 |
| --- | --------------------------------------------- | ---------------------- | ------------------------- | ----------------------------------------------------------- |
| 1   | Ayudante de dirección en cine.                | Dirección              | Ninguno                   | Código esperado 2642 ausente del catálogo aprobado.         |
| 2   | Ayudante de realización de televisión.        | Realización            | Ninguno                   | Código esperado 2642 ausente del catálogo aprobado.         |
| 3   | Ayudante de realización de vídeo.             | Realización            | Ninguno                   | Código esperado 2642 ausente del catálogo aprobado.         |
| 4   | Editor-montador / editora-montadora de vídeo. | Montaje/Postproducción | Ninguno                   | Código esperado 2652 ausente del catálogo aprobado.         |
| 5   | Jefa / jefe de regiduría.                     | Regiduría              | Ninguno                   | Código esperado 2652 o 2650 ausentes del catálogo aprobado. |
| 6   | Montador / montadora de cine.                 | Montaje/Postproducción | Ninguno                   | Código esperado 2652 ausente del catálogo aprobado.         |
| 7   | Regidor / regidora de espectáculos en vivo.   | Regiduría              | Ninguno                   | Código esperado 2652 ausente del catálogo aprobado.         |
| 8   | Regidor / regidora de eventos.                | Regiduría              | Ninguno                   | 3724 descartada por insuficiencia funcional.                |
| 9   | Regidor / regidora de paredes.                | Regiduría              | Ninguno                   | Código esperado 2652 ausente del catálogo aprobado.         |

**Total salidas IMS02S:** 9
**Salidas con candidato approved:** 0
**Salidas sin candidato:** 9

## Perfiles excluidos verificados

No se han identificado perfiles en las salidas de IMS02S que correspondan a:

- Sonorización → ausente en las 9 salidas.
- Animación musical → ausente en las 9 salidas.
- Iluminación → ausente en las 9 salidas.
- Ajuste de imagen digital → ausente en las 9 salidas.

El análisis se ha realizado exclusivamente sobre los 9 sourceQuotes del archivo fuente. No se han introducido perfiles adicionales.

## Resumen

IMS02S presenta un dominio (dirección audiovisual, realización, regiduría escénica) para el cual los códigos CNO-11 naturalmente aplicables (2642, 2650, 2652) no están incluidos en el catálogo aprobado de `data/curated/occupations.json`. El único candidato funcional evaluado (3724) fue descartado por insuficiencia de correspondencia. Las 9 salidas quedan catalogadas como **sin candidato CNO-11 approved**.
