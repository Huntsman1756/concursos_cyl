# Próxima sesión: continuar cobertura y cerrar candidatura

## Estado confirmado

- Producto público verificado en `84a88f433167a95d42322cd5218ec1f4801f7222`.
- Freeze fuente: `c7d0ec0e3565b195b84fa603dabdd8a7e96bef74`.
- Snapshot activo: `20260821093504689-b562e0e12b59`.
- Ocho datasets JCyL visibles y 20 recursos inmutables en el manifiesto.
- Cobertura: 62 cualificaciones, 76 claves de modalidad, 152 relaciones aprobadas y 21 alias.
- Ofertas alcanzadas: 39 de 1.055; la cifra es una unión acotada de IDs, no todo el mercado.
- Directorio educativo: 1.741 registros y reconciliación exacta de los 229 centros FP por código.
- La ficha de ciclo incorpora ingresos observados de EDUCAbase con referencia nacional y agregada de Castilla y León, sin presentarlos como predicción individual.
- QA local completo: 752 pruebas aprobadas y 178 omitidas por condiciones de plataforma; matriz E2E con 210 aprobadas y 2 omitidas.
- La matriz cubre Chromium de escritorio y móvil, Firefox y WebKit.
- Workflow público: `32469137629`.
- Diez capturas finales anónimas ligadas a `84a88f4` y validadas con Axe, red, consola, recursos externos y overflow.
- Cola oficial pendiente: 77 cualificaciones base; las siguientes prioridades son COM04S, FME01B y AFD02S.

## Orden de trabajo

1. Continuar la cola con relaciones que dispongan de evidencia oficial suficiente.
2. Mantener la evaluación etiquetada de precisión/cobertura antes de ampliar el matching de ofertas.
3. Repetir freeze, CI, despliegue y capturas después de cada lote aceptado.
4. Completar identidad, consentimiento y adjuntos humanos.
5. Obtener aprobación explícita antes del envío externo.

## Política de ejecución NAN

La telemetría del 20/08/2026 registró cuatro contratos sin candidato aceptable y
400.166 tokens de proveedor. El orquestador local usa desde la siguiente
revisión presupuestos 40k/90k/180k/300k, agentes de 5/10/14 pasos, un modo
`CreateOnly` sin lecturas para artefactos cerrados, dependencias efímeras en los
worktrees y un corte de 16 usos de herramienta para impedir bucles. Arquitectura,
selección de evidencia y revisión siguen
reservadas a Frontier; NAN se limita a implementación mecánica con rutas exactas.

La URL canónica de candidatura es
<https://salida-cyl.157-90-22-40.sslip.io/>.
