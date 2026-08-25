# Checklist de presentación

## Campos que debe completar una persona

- Convocatoria: [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html).
- Categoría: **Productos y Servicios**; primer premio: **2.500 €**.
- Plazo de presentación: **del 22 de julio al 21 de septiembre de 2026**.
- Presentación: [sede electrónica](https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Premio/1285664800452/Propuesta).
- Identidad de la persona solicitante: **PENDIENTE — no consta en el repositorio**.
- Contacto: **PENDIENTE — no consta en el repositorio**.
- Declaraciones, consentimiento y adjuntos exigidos: **PENDIENTE — revisar en el portal**.

## Campos técnicos verificados

- URL raíz a presentar: <https://salida-cyl.157-90-22-40.sslip.io/>.
- Fallback verificada: <https://huntsman1756.github.io/concursos_cyl/>.
- Commit fuente del freeze: `ff9e6197f926e462bea1a3e8ac6a57a23d3f825a`.
- Snapshot: `20260822085631889-7bbe69380f6d`.
- Commit desplegado: `f55de804cc94b5d928484e846b933a9dea94b7d0`.
- Release: `v2026.08.22`.
- Run del workflow: `32597524256`.
- `version.json` verificado: [respuesta pública](https://huntsman1756.github.io/concursos_cyl/version.json) con `commit` igual a `f55de804cc94b5d928484e846b933a9dea94b7d0`.

## Evidencia visual y gate final

- [ ] Ejecutar la captura nativa OS A4 en un Mac desbloqueado.
- [ ] Revisar la aplicación pública del release actual en contexto anónimo,
      incluyendo las rutas de FP, ocupación y comparador.
- [ ] Conservar solo capturas actuales, sin datos personales ni credenciales;
      las 13 capturas existentes son históricas.
- [ ] Confirmar que las cifras visibles siguen coincidiendo con
      `20260822085631889-7bbe69380f6d`.
- [ ] Obtener aprobación humana explícita para la solicitud externa.

La verificación técnica del release no autoriza el envío al concurso ni decide
los campos de identidad, contacto, declaraciones o consentimiento. Cualquier
cambio posterior debe seguir el flujo rama de trabajo → PR → checks →
revisión/aprobación → merge a `main` → GitHub Pages.
