# Próxima sesión: publicación y cierre de candidatura

## Estado preparado

- Repositorio canónico: <https://github.com/Huntsman1756/concursos_cyl>.
- Rama de integración: `codex/parallel-continuation-wave-20260821`.
- Commit fuente del freeze de cobertura: `c15abe83e9f1aacff6237c37644b9bb9025e7d89`.
- Snapshot activo: `20260821211208576-0eb34bdc0798`.
- Cobertura: 92 cualificaciones base, 110 claves de modalidad, 241 relaciones aprobadas y 21 alias.
- Cola oficial: 47 cualificaciones pendientes y 15 resultados no-match revalidados contra el catálogo actual.
- La revalidación añadió `AGA01S|5993` con evidencia oficial y dejó trazabilidad explícita de los otros 15 no-match.
- Ocho datasets JCyL visibles y 20 recursos inmutables en el manifiesto.
- El runtime conserva dos snapshots, comprueba todos los recursos del manifiesto y sustituye el staging con restauración segura ante fallo.
- GitHub Pages verifica después del despliegue el SHA y los bytes exactos del manifiesto y de sus recursos.
- El despliegue POSIX del VPS usa un archivo remoto exclusivo por ejecución, activación atómica y retención fail-closed.
- QA local del candidato: 854 pruebas aprobadas y 180 omitidas por plataforma; build, freeze, formato y lint correctos; E2E Chromium con 124 recorridos aprobados en escritorio y móvil.
- No existe evidencia humana de adopción o piloto: el protocolo anónimo está preparado, pero no se generan resultados ni afirmaciones sin sesiones reales y consentimiento.

## Estado de publicación

- `origin/main` y GitHub Pages deben comprobarse contra el SHA de la rama de integración después de promoverla.
- El VPS sigue bloqueado desde este Mac hasta que el host autorice la clave dedicada `salida_cyl_vps_ed25519`; no debe declararse sincronizado mientras falle el preflight SSH.
- El freeze mantiene el despliegue como `pending` hasta observar los hosts públicos correctos.
- La candidatura no se envía automáticamente. Identidad, declaraciones, consentimiento y envío oficial requieren autorización humana explícita separada.

## Orden de trabajo

1. Promover la rama de integración a `main` solo con avance fast-forward y lease sobre el SHA observado de `origin/main`.
2. Esperar el workflow de Pages y verificar `version.json`, manifiesto y recursos contra el commit publicado.
3. Autorizar la clave dedicada en el VPS, repetir el preflight read-only y ejecutar `deployVps.sh` únicamente si autentica.
4. Registrar evidencia de despliegue observada y mantener cualquier host no sincronizado como pendiente.
5. Continuar la cola de 47 titulaciones con evidencia primaria; no convertir señales de oferta en evidencia CNO.
6. Realizar el piloto anónimo con personas adultas y consentimiento antes de afirmar adopción.
7. Completar los campos humanos y obtener autorización explícita antes del envío externo.

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
