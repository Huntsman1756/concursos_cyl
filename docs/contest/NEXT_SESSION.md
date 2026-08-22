# Próxima sesión: publicación y cierre de candidatura

## Estado preparado

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama de integración: `codex/parallel-continuation-wave-20260821`.
- Límite fuente del freeze: `05f905397d22b217c4716c88a2406d802892fb6d`.
- Snapshot activo: `20260822085631889-7bbe69380f6d`.
- Cobertura: 113 cualificaciones base, 130 claves de modalidad, 264 relaciones aprobadas y 21 alias.
- Cola oficial: 26 cualificaciones pendientes y 15 resultados sin publicación revalidados contra el catálogo actual.
- El manifest conserva 21 recursos inmutables del snapshot, incluido SEPE con 116 registros canónicos.
- La publicación final, el workflow y las capturas de este freeze aún están pendientes. La evidencia de despliegues anteriores se conserva solo como historial.
- La muestra determinista vigente registra 15 PASS y 0 FAIL tras una segunda
  revisión independiente de la URL oficial y la cita registrada. Es una muestra
  delimitada: las otras 249 relaciones no fueron muestreadas y no se afirma una
  auditoría exhaustiva.
- No existe evidencia humana de adopción o piloto: el protocolo anónimo está preparado, pero no se generan resultados ni afirmaciones sin sesiones reales y consentimiento.

## Estado de publicación

- GitHub Pages y el VPS deben publicar el mismo commit P; todavía no se ha registrado ese commit ni su workflow.
- Las capturas PNG deben regenerarse desde P y revisarse visualmente antes de registrar evidencia verificada.
- La candidatura no se envía automáticamente. Identidad, declaraciones, consentimiento y envío oficial requieren autorización humana explícita separada.

## Orden de trabajo

1. Completar la cola de 26 titulaciones con evidencia primaria; no convertir
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
