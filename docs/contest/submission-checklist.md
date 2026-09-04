# Checklist de presentación

## Campos que debe completar una persona

- Convocatoria: [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html).
- Categoría: **Productos y Servicios**; primer premio: **2.500 €**.
- Plazo de presentación: **del 22 de julio al 21 de septiembre de 2026**.
- Presentación: [sede electrónica](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta).
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## Campos técnicos

- URL raíz a presentar: [https://salida-cyl.157-90-22-40.sslip.io/](https://salida-cyl.157-90-22-40.sslip.io/)
- Fallback verificada: [https://huntsman1756.github.io/concursos_cyl/](https://huntsman1756.github.io/concursos_cyl/)
- Commit fuente del freeze: `36659e6a2e127630e72b14b8641504d5dbea7a9e`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`.
- Commit desplegado: `4b67443c4cb1b29347eef38d751eb4f8d02cb2a9`.
- Run del workflow: no aplica (despliegue por script VPS, sin GitHub Actions).
- Release: `v2026.09.04-candidate.10`.
- `version.json` verificado: [respuesta pública](https://salida-cyl.157-90-22-40.sslip.io/version.json) con commit igual a `4b67443c4cb1b29347eef38d751eb4f8d02cb2a9`.
- Identidad del producto: el commit desplegado registrado arriba es el commit de producto; esta documentación de candidatura vive en una rama documental posterior y no forma parte del commit desplegado.

- Evidencia visual: **capturada y validada en `docs/contest/evidence-capture.json`**.

## Evidencia visual y gate final

- [x] Captura automatizada A4: 13/13 capturas actuales recapturadas y validadas en `docs/contest/evidence-capture.json`.
- [ ] Ejecutar la captura nativa OS A4 en un Mac desbloqueado.
- [ ] Revisar la aplicación pública de la release actual en contexto anónimo, incluyendo las rutas de FP, ocupación y comparador.
- [ ] Conservar solo capturas actuales, sin datos personales ni credenciales; el manifiesto contiene capturas actuales ligadas al commit de publicación.
- [x] Ejecutar los gates de release y verificar la aplicación pública.
- [x] Registrar el commit desplegado y la verificación pública observados (despliegue por script VPS, sin run de GitHub Actions).
- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales. (capturas actuales; revisión humana pendiente)
- [ ] Confirmar que las cifras visibles siguen coincidiendo con `20260830120000000-8c6c79fbd2a1`. (revisión humana pendiente)
- [ ] Obtener aprobación humana explícita para la solicitud externa.

**PENDIENTE DE APROBACIÓN HUMANA:** este repositorio no envía la solicitud al concurso ni decide los campos de identidad, contacto, declaraciones o consentimiento.

Cualquier cambio posterior debe seguir el flujo rama de trabajo → PR → checks → revisión/aprobación → merge a `main` → GitHub Pages.
