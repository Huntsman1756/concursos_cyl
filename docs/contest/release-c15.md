# C15: publicación, evidencia y límites

Estado observado el 6 de septiembre de 2026. Este registro describe el producto publicado; las modificaciones posteriores de esta carpeta son documentales y no cambian el binario público.

## Identidad

- URL: https://salida-cyl.157-90-22-40.sslip.io/
- Commit publicado: `02d6805e5cb661f3289ade47ad2364b26fd346f8`.
- Tag local: `v2026.09.06-candidate.15`. No se afirma un tag remoto ni una GitHub Release.
- Método: publicación manual VPS, directorio de release inmutable y activación mediante enlace atómico.
- Release activa observada: `/srv/salida-cyl/releases/20260906-candidate15-02d6805`.
- Rollback conservado: C14, `/srv/salida-cyl/releases/20260906-candidate14-c3d8fe2`.
- SHA-256 del paquete: `17e46b65c27b764b063988cd65fd9eac11c9c2aefdab53d052eb2a0dcf7096f5`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`; manifest SHA-256 `e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df`.
- No existe un run de GitHub Actions acreditado para este despliegue. Sus campos permanecen en null deliberadamente. GitHub Pages no está verificado como copia de C15.

## Comprobaciones ejecutadas

| Evidencia                     | Resultado                          | Alcance                                                                                  |
| ----------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Suite unitaria final C15      | 1.351 PASS, 0 FAIL, 178 omitidas   | Ejecución anterior al despliegue sobre el mismo código                                   |
| Regresión E2E                 | 130 PASS, 0 FAIL, 2 omitidas       | Siete archivos; Chromium escritorio/móvil, Firefox y WebKit; no toda la matriz histórica |
| Revisión local visual/Axe     | 28 estados                         | 320/360/390/1440 px                                                                      |
| Reconstrucción                | 104 archivos idénticos byte a byte | Se añadió version.json: 105 archivos finales                                             |
| Integridad HTTP               | 105/105 hashes coincidentes        | Artefacto servido desde la URL pública                                                   |
| Páginas públicas              | 44 comprobaciones                  | 11 rutas × 320/360/390/1280 px, Chromium                                                 |
| Estados públicos interactivos | 19                                 | Fuentes, comparación, paginación, expansión y filtros                                    |

Fuentes portables: [validación previa](evidence/c15/predeployment-validation.json), [reconstrucción](evidence/c15/reproducible-build.json), [comprobación pública completa](evidence/c15/rc15-public-smoke.json). El primero conserva su estado histórico `deployment: not performed`: fue escrito antes de publicar; la comprobación pública posterior acredita el despliegue. No se sobrescriben los hechos históricos.

El registro público comenzó a las 09:07:46 UTC y terminó a las 09:09:34 UTC del 6 de septiembre. `version.json` coincidió al inicio y al final. No hubo errores de navegador ni desbordamientos en las páginas comprobadas.

## Accesibilidad: interpretación exacta

No hubo violaciones Axe en las comprobaciones públicas. Hubo resultados `incomplete` en 9 comprobaciones de página y 6 estados interactivos (entre ellos contraste y atributos ARIA): requieren juicio humano y no se convierten en PASS. NVDA está instalado, pero los cinco recorridos auditivos no se han realizado y quedan aplazados a petición del titular. No se declara certificación ni conformidad WCAG completa.

Se conserva la limitación histórica de Tab en WebKit Windows reproducida también en C13/C14, y el aviso best-practice de H1 durante el loader. C15 no incluye una nueva medición de rendimiento. Los resultados CLS/LCP de C14 son mediciones de laboratorio anteriores, no datos de usuarios reales de C15.

## Capturas públicas seleccionadas

Estas imágenes proceden de la comprobación pública anterior, no de una reproducción local. Los archivos históricos de `evidence-capture.json` corresponden a otro protocolo/versión y no se presentan como C15.

- [Portada móvil](evidence/c15/home-390.png).
- [Profesión en escritorio](evidence/c15/occupation-1280.png).
- [Ficha FP móvil](evidence/c15/fp-390.png).
- [Acceso a comparación móvil](evidence/c15/comparison-shortcut-390.png).
- [Ofertas móvil](evidence/c15/offers-390.png).
- [Centros móvil](evidence/c15/centers-390.png).

## Qué permanece pendiente

La identidad publicada y su comprobación pública están verificadas en `release-evidence.json`. El estado raíz `pending` pertenece al gate conjunto del esquema v1, cuyos campos de captura y pruebas exigen una consolidación completa distinta del registro operativo anterior. No significa «no desplegado». Los resultados efectivos son los de esta página y sus archivos fuente; no se inventan ejecuciones para completar campos del protocolo antiguo.

Faltan el piloto con participantes reales, la revisión humana de accesibilidad y la revisión administrativa de la solicitud. Identidad, contacto, declaraciones y autorización de envío no se deducen de la autorización de despliegue. La revisión técnica es autoverificación, no una auditoría independiente.
