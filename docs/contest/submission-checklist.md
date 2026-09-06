# Checklist de presentación

## Campos que debe completar una persona

- Convocatoria: [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html).
- Categoría: **Productos y Servicios**; primer premio: **2.500 €**.
- Plazo recogido en el expediente: **del 22 de julio al 21 de septiembre de 2026**; confirmar en la sede antes del envío. Véase [estado administrativo](closing-status.md).
- Presentación: [sede electrónica](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta).
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## Campos técnicos

- URL raíz a presentar: [https://salida-cyl.157-90-22-40.sslip.io/](https://salida-cyl.157-90-22-40.sslip.io/)
- URL histórica de fallback (C15 no verificada allí): [https://huntsman1756.github.io/concursos_cyl/](https://huntsman1756.github.io/concursos_cyl/)
- Commit fuente del freeze: `36659e6a2e127630e72b14b8641504d5dbea7a9e`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`.
- Commit desplegado: `02d6805e5cb661f3289ade47ad2364b26fd346f8`.
- Run del workflow: No aplica: despliegue manual VPS; véase [evidencia C15](release-c15.md).
- Release: `v2026.09.06-candidate.15`.
- `version.json` verificado: [respuesta pública](https://salida-cyl.157-90-22-40.sslip.io/version.json) con commit igual a `02d6805e5cb661f3289ade47ad2364b26fd346f8`.
- Evidencia visual: El inventario A4 conserva 13 capturas históricas; se conserva como archivo. Para C15, consultar las capturas públicas y su alcance en [release-c15.md](release-c15.md).

## Evidencia pública C15 y pendientes

C15 está publicado y verificado. [Release C15](release-c15.md) conserva los resultados reales y capturas públicas. El inventario A4 anterior es histórico. El estado pendiente del gate conjunto no equivale a ausencia de despliegue. NVDA y el piloto real siguen pendientes. No se ha enviado la candidatura.

## Evidencia visual y gate final

- [x] Incorporar las capturas públicas y el registro de comprobación C15; el inventario A4 anterior se conserva como histórico.
- [ ] Completar la revisión humana de accesibilidad; NVDA aplazado a petición del titular. No se declara conformidad WCAG.
- [x] Comprobar automáticamente las rutas públicas de FP, ocupación y comparador; alcance y límites en release-c15.md.
- [x] Separar capturas públicas C15 del inventario histórico; falta inspección humana final de la selección.
- [ ] Cerrar el gate documental conjunto; comprobar el alcance de pruebas ya ejecutadas en la evidencia de la release.
- [x] Registrar el commit publicado y su método de despliegue con datos observados.
- [ ] Revisar las capturas en contexto anónimo, sin datos personales ni credenciales.
- [ ] Confirmar humanamente las cifras de las capturas elegidas antes de la entrega; los hashes públicos ya están verificados.
- [ ] Obtener aprobación humana explícita para la solicitud externa.

**PENDIENTE DE APROBACIÓN HUMANA:** este repositorio no envía la solicitud al concurso ni decide los campos de identidad, contacto, declaraciones o consentimiento.

Los cambios de producto requieren validación sobre un SHA exacto y verificación del despliegue elegido. Una actualización documental no modifica por sí sola la versión pública.
