# Checklist de presentación

## Campos que debe completar una persona

- Convocatoria: [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html).
- Categoría: **Productos y Servicios**; primer premio: **2.500 €**.
- Plazo de presentación: **del 22 de julio al 21 de septiembre de 2026**.
- Presentación: [sede electrónica](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta).
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## Baseline funcional verificada

- URL raíz a presentar: [https://salida-cyl.157-90-22-40.sslip.io/](https://salida-cyl.157-90-22-40.sslip.io/)
- Fallback verificada: [https://huntsman1756.github.io/concursos_cyl/](https://huntsman1756.github.io/concursos_cyl/)
- Commit fuente del freeze: `ff9e6197f926e462bea1a3e8ac6a57a23d3f825a`.
- Snapshot: `20260822085631889-7bbe69380f6d`.
- Commit de baseline desplegado: `cab7a3b9dbdf8d2922506e9207242d537347d720`.
- Run del workflow: `32896247977`.
- Release funcional de referencia: `v2026.08.25-candidate.2`.
- `version.json` verificado: [respuesta pública](https://huntsman1756.github.io/concursos_cyl/version.json) con commit igual a `cab7a3b9dbdf8d2922506e9207242d537347d720`.
- Evidencia visual: **capturada y validada en `docs/contest/evidence-capture.json`**.

## Estado temporal de la candidatura

- Baseline funcional verificada: commit `cab7a3b9dbdf8d2922506e9207242d537347d720`, release funcional de referencia `v2026.08.25-candidate.2`.
- Pages y VPS de la baseline: verificados con ese SHA; `version.json`: verificado y coincidente.
- A4 de la baseline: 13/13 capturas PASS.
- Rama documental actual: `codex/final-candidature-coherence-20260826`.
- HEAD documental de referencia antes de esta corrección: `25fc0f89097e107eb47c49b0a848ba822bc4cea1`.
- Release candidata final: **PENDIENTE**.
- Nombre previsto: `v2026.08.26-candidate.3`.
- SHA final: **PENDIENTE HASTA EL MERGE**.
- Pages/VPS finales: **PENDIENTES**.
- `version.json` final: **PENDIENTE**.
- A4 final sobre ese SHA: **PENDIENTE**.

## Evidencia visual y gate final

- [x] Captura automatizada A4 de la baseline: 13/13 capturas actuales recapturadas y validadas en `docs/contest/evidence-capture.json`.
- [ ] Ejecutar la captura nativa OS A4 en un Mac desbloqueado.
- [ ] Revisar la aplicación pública de la baseline funcional observada en contexto anónimo, incluyendo las rutas de FP, ocupación y comparador.
- [ ] Conservar solo capturas actuales, sin datos personales ni credenciales; el manifiesto contiene las capturas actuales de la baseline, ligadas a su commit de publicación.
- [x] Ejecutar los gates de release y verificar la aplicación pública.
- [x] Rellenar el commit desplegado y el run del workflow con datos observados.
- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales. (capturas actuales; revisión humana pendiente)
- [ ] Confirmar que las cifras visibles siguen coincidiendo con `20260822085631889-7bbe69380f6d`. (revisión humana pendiente)
- [ ] Obtener aprobación humana explícita para la solicitud externa.

## Release candidata final posterior al merge

- [ ] Verificar Pages/VPS finales sobre el SHA real del merge.
- [ ] Verificar `version.json` final tras la publicación de candidate.3.
- [ ] Ejecutar A4 final sobre el SHA real de candidate.3.

**PENDIENTE DE APROBACIÓN HUMANA:** este repositorio no envía la solicitud al concurso ni decide los campos de identidad, contacto, declaraciones o consentimiento.

Cualquier cambio posterior debe seguir el flujo rama de trabajo → PR → checks → revisión/aprobación → merge a `main` → GitHub Pages.
