# Próxima sesión: publicación y cierre de candidatura

## Estado preparado

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama de integración: `codex/parallel-continuation-wave-20260821`.
- Límite fuente del freeze: `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`.
- Snapshot activo: `20260822021233066-9d8fa948959b`.
- Cobertura: 104 cualificaciones base, 121 claves de modalidad, 248 relaciones aprobadas y 21 alias.
- Cola oficial: 35 cualificaciones pendientes y 15 resultados sin publicación revalidados contra el catálogo actual.
- La remediación retiró seis relaciones sin reemplazo y corrigió una cita; el grafo y el snapshot reflejan 248 relaciones.
- El manifest conserva los recursos inmutables del snapshot y el freeze mantiene despliegue `pending`.
- La muestra independiente vigente de 15 relaciones está seleccionada, pero pendiente de comprobación contra fuentes vivas.
- No existe evidencia humana de adopción o piloto: el protocolo anónimo está preparado, pero no se generan resultados ni afirmaciones sin sesiones reales y consentimiento.

## Estado de publicación

- GitHub Pages y el VPS no se han desplegado ni verificado para el límite `e41c539`; `docs/contest/release-evidence.json` conserva ambos estados como pendientes.
- Las capturas PNG existentes son históricas respecto al snapshot actual y deben recapturarse después de un despliegue verificable.
- La candidatura no se envía automáticamente. Identidad, declaraciones, consentimiento y envío oficial requieren autorización humana explícita separada.

## Orden de trabajo

1. Ejecutar los gates locales sobre el árbol final y registrar sus resultados sin atribuirles verificación pública.
2. Promover la rama solo con autorización explícita y avance fast-forward sobre el SHA observado de `origin/main`.
3. Esperar el workflow de Pages y verificar `version.json`, manifest y recursos contra el commit publicado.
4. Autorizar la clave dedicada del VPS, repetir el preflight read-only y ejecutar el despliegue únicamente si autentica.
5. Recapturar la evidencia visual en contexto anónimo y revisar cada imagen contra el claim ledger y el freeze actual.
6. Completar la cola de 35 titulaciones con evidencia primaria; no convertir señales de oferta en evidencia CNO.
7. Realizar el piloto anónimo con personas adultas y consentimiento antes de afirmar adopción.
8. Completar los campos humanos y obtener autorización explícita antes del envío externo.

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
