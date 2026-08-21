# Próxima sesión: continuar cobertura y cerrar candidatura

## Estado confirmado

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- `main` local y `origin/main`: `80b1a38495806c10e274e4567ef0e641ead0a996` (relevo y evidencia; no modifica el producto desplegado).
- Producto público verificado en `90aba16a5bcef42ae6f966e9aaff9c53d82369aa`.
- Commit fuente de cobertura: `ae63e89e47057de74b77009aa1d95e817a2d6fc7`; commit documental del freeze: `90aba16a5bcef42ae6f966e9aaff9c53d82369aa`.
- Snapshot activo: `20260821120933391-9bd4488f9029`.
- Ocho datasets JCyL visibles y 20 recursos inmutables en el manifiesto.
- Cobertura: 77 cualificaciones, 93 claves de modalidad, 196 relaciones aprobadas y 21 alias.
- Ofertas alcanzadas: 39 de 1.055; la cifra es una unión acotada de IDs, no todo el mercado.
- Directorio educativo: 1.741 registros y reconciliación exacta de los 229 centros FP por código.
- La ficha de ciclo incorpora ingresos observados de EDUCAbase con referencia nacional y agregada de Castilla y León, sin presentarlos como predicción individual.
- QA local: 758 pruebas aprobadas y 178 omitidas por condiciones de plataforma. QA público: 756 aprobadas y 180 omitidas por plataforma; E2E Chromium con 124 recorridos aprobados en escritorio y móvil.
- Workflow público: `32483659589`.
- Trece capturas finales anónimas ligadas a `90aba16` y validadas con Axe, red, consola, recursos externos y overflow.
- Cola oficial pendiente: 62 cualificaciones base; las siguientes prioridades son IMS03S, INA01S, AGA01M, AGA02M y AGA03B.

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

## Arranque en otro ordenador

Requiere Git y Node.js 24. No hay cambios locales que rescatar ni archivos de
WordPress. La fuente de verdad es `origin/main`:

```powershell
git clone https://github.com/Huntsman1756/concursos_cyl.git
Set-Location concursos_cyl
git switch main
git pull --ff-only origin main
npm ci
npm run contest:submission:check
npm run dev
```

Antes de editar, comprobar que `git rev-parse HEAD` devuelve
`80b1a38495806c10e274e4567ef0e641ead0a996` y que `git status --short` no
devuelve líneas. El VPS debe seguir publicando
`90aba16a5bcef42ae6f966e9aaff9c53d82369aa` en `/version.json`; la diferencia
es intencionada porque `80b1a38` contiene solo evidencia con `[skip ci]`.

No se necesitan los worktrees, contratos NAN ni estados temporales de este
ordenador. La configuración personal de OpenCode tampoco forma parte del
proyecto ni se debe copiar para continuar el desarrollo.
