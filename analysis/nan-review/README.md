# Revisión ampliada con Qwen y Gemma

Revisión de la base `20260908044344059-f92da75832e9`, con candidato
`20260908155911229-c72920ec4fed`. Publicado en la web principal como candidate.20. Los informes de modelos no constituyen aprobación por sí solos.

Resultados preparados: 528 dictámenes para las 264 relaciones existentes y 98 para
49 propuestas seleccionadas. Se corrigieron 44 citas o fuentes y seis códigos CNO;
ocho relaciones quedaron pendientes y dos se rechazaron. Se incorporaron 43 salidas
y 23 relaciones de modalidad verificadas por identidad de programa. El candidato
contiene 320 relaciones aprobadas y cubre 185 de 187 claves (98,9 %).

La nueva descarga contiene 1.032 ofertas, de las que 301 tienen relación revisada
(29,2 %), con 536 vínculos. Cinco denominaciones principales del catálogo SISPE
del SEPE tienen reglas exactas específicas. No se cruzan automáticamente todas las
formaciones que comparten un código CNO, ni se infieren requisitos de contratación.
Los dos programas IMA01E e IMA02E siguen pendientes de evidencia suficientemente
precisa; esto no significa que carezcan de salidas.

Las cifras de agrupaciones por clave y título no acreditan un número de títulos
distintos: hay variantes de modalidad y diferencias de denominación. El piloto
humano sigue sin ejecutarse.

Se utilizan exclusivamente `nan/qwen3.6` y `nan/gemma4`, con un máximo de cuatro
procesos simultáneos. La configuración de OpenCode procede del kit privado del
autor y permanece fuera del repositorio público. El coordinador distribuye los
paquetes y resuelve las discrepancias; no se ha delegado la aprobación de datos en
los modelos ni se ha activado la aprobación automática de Orca.

## Universo y evidencia

- Las 264 relaciones curadas existentes, incluidas variantes a distancia.
- Los 41 grupos de la cola sin relación publicada: 26 pendientes y 15 descartados
  anteriormente frente al catálogo reducido. No deben interpretarse sin más como
  41 titulaciones nuevas distintas.
- El catálogo oficial completo de 502 códigos CNO-11 y sus notas explicativas del
  INE, versión de julio de 2026.
- Fuentes de FP de TodoFP y BOE, descargadas con fecha y SHA-256. Un HTTP 200 no
  acredita que el contenido sea válido: se han detectado páginas de error del BOE.

Las propuestas deben citar texto de la fuente de FP. Citar únicamente la definición
CNO no acredita una relación con una formación. Tampoco basta con que dos modelos
coincidan. Se comprueban las exclusiones del código, los límites de una función
auxiliar, la identidad del programa y la diferencia entre una relación ocupacional
y una exigencia de titulación o habilitación profesional.

## Control del proceso

La primera tanda con `opencode run --file` se invalidó como revisión completa:
OpenCode recortaba líneas a 2.000 caracteres y archivos a 2.000 líneas. Sus salidas
solo sirvieron para localizar asuntos que investigar. No cuentan como revisión
completa ni como métricas de exactitud.

El ejecutor actual entrega el paquete por la entrada estándar y exporta la sesión
local para verificar que el mensaje recibido coincide íntegramente con el enviado,
normalizando únicamente los saltos de línea. Las respuestas vacías, incompletas,
duplicadas o con un veredicto no admitido se rechazan. Los fallos se reintentan de
forma limitada y quedan pendientes si no se obtiene una respuesta válida.

Ambos modelos superaron nueve controles de diagnóstico con esta entrega íntegra:
tres relaciones claras, tres incompatibles y tres con evidencia retirada. Son
controles deliberadamente sencillos, separados de los datos reales; no constituyen
una estimación de precisión, exhaustividad ni impacto del producto.

## Reproducción

Los ejecutores Python usan biblioteca estándar. Las capturas y trazas completas
permanecen en el directorio de trabajo ignorado; no deben incluir credenciales en
los archivos públicos. Los paquetes deben utilizar el recurso de programas
referenciado por el manifiesto activo, no las proyecciones históricas de `data/v1`.

1. Capturar las fuentes oficiales con URL, fecha, contenido y SHA-256.
2. Construir los paquetes con `scripts/analysis/buildNanMappingPackets.py`.
3. Ejecutar `scripts/analysis/runNanEvidenceReview.py` con el runtime de OpenCode,
   las carpetas de paquetes y resultados y los dos modelos autorizados.
4. Consolidar las relaciones con `scripts/analysis/summarizeNanEvidenceReview.py`
   y las propuestas nuevas con `scripts/analysis/collectNanExpansionCandidates.py`.
5. Adjudicar contra las fuentes primarias antes de modificar datos curados.
6. Regenerar datos derivados, cifras y documentación; superar los controles del
   candidato antes de publicar una nueva versión.

Las pruebas del ejecutor se ejecutan con:

```text
python -B -m unittest discover -s scripts/analysis -p test_nan_evidence_review.py
```

Referencias: [modelos y cuotas de NaN](https://nan.builders/docs/models),
[kit del autor](https://github.com/Huntsman1756/opencode-orca-nan-orchestrator),
[notas explicativas del INE](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf).

El extractor `extractSispeOfferCandidates.py` utiliza `pdfplumber`, exige el SHA-256
del PDF inspeccionado y separa la columna principal de las denominaciones alternativas.
Sus resultados son candidatos, no reglas aprobadas. La edición SISPE es de 2018;
la descarga del 8 de septiembre de 2026 no se presenta como actualización del catálogo.

Las relaciones adyacentes requieren evidencia específica de la oferta y no heredan coincidencias de alias genéricos. Este límite evita cruces de especializaciones con empleos de otros ámbitos; las relaciones FP-CNO siguen consultables.
