# Próxima sesión: publicar el lote AFD y continuar cobertura

## Estado confirmado

- Producto público anterior verificado en `b0cbf69b103610b4d371e215688f254c3aeeb207`.
- Freeze candidato: `62bb32dd794dfb67f57899eb7861724273b4448f`.
- Snapshot candidato: `20260821070248908-85affbaf7072`.
- Ocho datasets JCyL visibles y 20 recursos inmutables en el manifiesto.
- Cobertura candidata: 56 cualificaciones, 69 claves de modalidad, 132 relaciones aprobadas y 21 alias.
- Ofertas alcanzadas: 39 de 1.055; la cifra es una unión acotada de IDs, no todo el mercado.
- Directorio educativo: 1.741 registros y reconciliación exacta de los 229 centros FP por código.
- La ficha de ciclo incorpora ingresos observados de EDUCAbase con referencia nacional y agregada de Castilla y León, sin presentarlos como predicción individual.
- QA del lote: 346 pruebas de datos y 18 E2E focalizadas aprobadas; CI completo pendiente del PR.
- Matriz opcional preparada para Chromium, Firefox y WebKit sin encarecer el CI ordinario.
- Último workflow público verificado: `32454915276`.
- Las capturas del release anterior permanecen válidas para `b0cbf69b`; el lote candidato requiere recaptura tras desplegarse.

## Orden de trabajo

1. Publicar y verificar el snapshot candidato con 132 relaciones.
2. Recapturar la evidencia visual contra el commit desplegado.
3. Mantener la evaluación etiquetada de precisión/cobertura antes de ampliar el matching de ofertas.
4. Continuar la cola con relaciones que dispongan de evidencia oficial suficiente.
5. Completar identidad, consentimiento y aprobación humana antes del envío externo.

## Política de ejecución NAN

La telemetría del 20/08/2026 registró cuatro contratos sin candidato aceptable y
400.166 tokens de proveedor. El orquestador local usa desde la siguiente
revisión presupuestos 40k/90k/180k/300k, agentes de 5/10/14 pasos y un corte tras
tres pasos sin edición. Arquitectura, selección de evidencia y revisión siguen
reservadas a Frontier; NAN se limita a implementación mecánica con rutas exactas.

La URL canónica de candidatura es
<https://salida-cyl.157-90-22-40.sslip.io/>.
