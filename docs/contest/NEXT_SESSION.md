# Próxima sesión: publicación y cierre de candidatura

## Estado preparado

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama de integración: `codex/parallel-continuation-wave-20260821`.
- Límite fuente del freeze: `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`.
- Snapshot activo: `20260822021233066-9d8fa948959b`.
- Cobertura: 104 cualificaciones base, 121 claves de modalidad, 248 relaciones aprobadas y 21 alias.
- Cola oficial: 35 cualificaciones pendientes y 15 resultados sin publicación revalidados contra el catálogo actual.
- La remediación retiró seis relaciones sin reemplazo y corrigió una cita; el grafo y el snapshot reflejan 248 relaciones.
- El manifest conserva los recursos inmutables del snapshot. GitHub Pages, VPS
  y 13 capturas se verificaron para el commit
  `05407a0600f1d533d01e97757a98189f030ea6e0`.
- La muestra determinista vigente registra 15 PASS y 0 FAIL tras una segunda
  revisión independiente de la URL oficial y la cita registrada. Es una muestra
  delimitada: las otras 233 relaciones no fueron muestreadas y no se afirma una
  auditoría exhaustiva.
- No existe evidencia humana de adopción o piloto: el protocolo anónimo está preparado, pero no se generan resultados ni afirmaciones sin sesiones reales y consentimiento.

## Estado de publicación

- GitHub Pages y el VPS publicaron el mismo commit `05407a0`; el workflow
  `32548299249` terminó en verde y verificó Pages en vivo.
- Las 13 capturas PNG se regeneraron desde el VPS publicado y pasaron la
  validación automática y la inspección visual.
- La candidatura no se envía automáticamente. Identidad, declaraciones, consentimiento y envío oficial requieren autorización humana explícita separada.

## Orden de trabajo

1. Completar la cola de 35 titulaciones con evidencia primaria; no convertir
   señales de oferta en evidencia CNO.
2. Realizar el piloto anónimo con personas adultas y consentimiento antes de
   afirmar adopción.
3. Completar identidad, declaraciones y documentación humana.
4. Obtener autorización explícita antes del envío externo.

## Arranque en otro ordenador

Requiere Git y Node.js 24. La fuente de verdad es `origin/main`:

```powershell
git clone https://github.com/Huntsman1756/concursos_cyl.git
Set-Location concursos_cyl
git switch main
git pull --ff-only origin main
npm ci
npm run contest:submission:check
npm run dev
```

Antes de editar, comprobar que `git rev-parse HEAD` y
`git rev-parse origin/main` devuelven el mismo hash y que
`git status --short` no devuelve líneas. GitHub Pages y el VPS se comprueban
por separado mediante sus respectivos `version.json`; no se presume que un
despliegue implica el otro.

No se necesitan worktrees, contratos NAN ni estados temporales de este
ordenador. Las credenciales y la evidencia privada permanecen fuera del
repositorio.
