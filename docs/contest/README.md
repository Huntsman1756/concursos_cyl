# Documentación de la candidatura

## Para evaluar el proyecto

- [Memoria](jury-memo.md) y [PDF](../../public/candidatura.pdf): documento sujeto al límite de 1.000 palabras, con los siete criterios de valoración.
- [Resumen del proyecto](application-summary.md): problema, audiencia y alcance.
- [Fuentes](source-ledger.md), [limitaciones](limitations.md) y [evidencia técnica](technical-evidence.md): procedencia y comprobación de las afirmaciones.
- [Guía de la demostración](demo-guide.md): vídeo recomendado y procedencia de la grabación.

## Para presentar la solicitud

Seguir la [guía de entrega](submission-guide.md), contrastada con la convocatoria y la primera pantalla pública del formulario. La entrega general exige solicitud normalizada, memoria y URL. El resto de esta carpeta es apoyo; no debe adjuntarse automáticamente ni emplearse para ampliar la memoria.

Los datos identificativos, certificados, documentos firmados y justificantes de registro se guardan fuera del repositorio. La carpeta local `/private-submission/` está excluida de Git si se necesita conservar una copia de trabajo.

## Registros técnicos e históricos

`submission-checklist.md`, `application-summary.md`, `technical-evidence.md` y `limitations.md` se generan desde la evidencia de release con `npx tsx scripts/release/renderContestSubmission.ts --write`. No editar a mano esos archivos; la guía de entrega se mantiene separada. La memoria HTML/PDF se genera desde `jury-memo.md` con `scripts/release/renderJuryMemoPdf.py`.

Los archivos fechados, `NEXT_SESSION.md`, registros de releases, manifiestos y capturas documentan estados anteriores. Sus fechas, commits y límites forman parte de la trazabilidad; no equivalen a una comprobación de la versión actual ni a una solicitud presentada. La [síntesis técnica](technical-summary.md) distingue los identificadores observados de las pruebas históricas.

Los vídeos anteriores se conservan con su procedencia. La versión recomendada es `demo-salidacyl-ximena-20260910.mp4`; no hace falta enviar las variantes históricas.
