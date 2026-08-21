# Próxima sesión: continuar cobertura y cerrar candidatura

## Estado confirmado

- Producto público verificado en `56219dec861fa9693870edd02586df69db8e096e`.
- Freeze fuente: `22205db9a0cfd8ef5ed5fad6ef48ce8a1c38fa8d`.
- Snapshot activo: `20260821111803121-ce75d7161084`.
- Ocho datasets JCyL visibles y 20 recursos inmutables en el manifiesto.
- Cobertura: 73 cualificaciones, 89 claves de modalidad, 187 relaciones aprobadas y 21 alias.
- Ofertas alcanzadas: 39 de 1.055; la cifra es una unión acotada de IDs, no todo el mercado.
- Directorio educativo: 1.741 registros y reconciliación exacta de los 229 centros FP por código.
- La ficha de ciclo incorpora ingresos observados de EDUCAbase con referencia nacional y agregada de Castilla y León, sin presentarlos como predicción individual.
- QA público: 750 pruebas aprobadas y 180 omitidas por condiciones de plataforma; E2E Chromium con 112 recorridos aprobados en escritorio y móvil.
- Workflow público: `32477831352`.
- Diez capturas finales anónimas ligadas a `56219de` y validadas con Axe, red, consola, recursos externos y overflow.
- Cola oficial pendiente: 66 cualificaciones base; las siguientes prioridades son IMP02S, FME03S, HOT02S, IMS03S y SSC02S.

## Orden de trabajo

1. Continuar la cola con relaciones que dispongan de evidencia oficial suficiente.
2. Mantener la evaluación etiquetada de precisión/cobertura antes de ampliar el matching de ofertas.
3. Repetir freeze, CI, despliegue y capturas después de cada lote aceptado.
4. Completar identidad, consentimiento y adjuntos humanos.
5. Obtener aprobación explícita antes del envío externo.

## Política de ejecución

La ejecución directa en el repositorio es el camino predeterminado. NAN,
OpenCode y otros workers son aceleradores opcionales para contratos mecánicos
acotados; un fallo de proveedor no bloquea el desarrollo ni provoca cadenas de
reintentos. Arquitectura, selección de evidencia y revisión permanecen bajo el
control del agente principal.

La URL canónica de candidatura es
<https://salida-cyl.157-90-22-40.sslip.io/>.
