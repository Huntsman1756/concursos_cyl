# Próxima sesión: cierre de candidatura

## Estado confirmado

- HEAD al redactar este handoff: `8560e0976d0c6c05adfa021dcc1bb5a6331e48e7`.
- Frontera fuente del freeze: `4fdf078c87905fe7adf84b07850789306f87b3f1`.
- Snapshot activo: `20260809185438334-e9ea8694331b`.
- Cobertura: 6 cualificaciones, 7 modalidades, 14 relaciones aprobadas y 21 alias.
- Ofertas alcanzadas: 46 de 1.077.
- `npm test`: 705 pruebas aprobadas y 178 pruebas históricas omitidas explícitamente; 0 fallos.
- E2E: 80/80 en escritorio y móvil.

SSC01M permanece en el fallback: nueve salidas actuales en TodoFP, once ocupaciones en el RD 1593/2011 y dos relaciones CNO-11 publicadas (`5629` y `5710`). Una relación `zeroReviewed` está revisada, pero no alcanza ninguna oferta de la instantánea; no significa falta de revisión.

## Decisión de alcance

No añadir fuentes, alias, cualificaciones ni relaciones antes del envío. La variedad de fuentes ya es suficiente; ahora importa que repositorio, despliegues, memoria y evidencia describan exactamente el mismo producto. Cualquier ampliación debe quedar para después del concurso o para una rama experimental no publicable.

## Orden de trabajo

1. Retirar temporalmente GitHub Pages del README y del About mientras no esté sincronizado.
2. Hacer push del estado final y esperar todos los gates de CI.
3. Desplegar el mismo SHA en el VPS y en Pages.
4. Verificar ambas URLs, rutas profundas, consola, red, accesibilidad y cifras visibles.
5. Reintroducir Pages como «despliegue de desarrollo» solo después de comprobar que está sincronizado.
6. Regenerar `docs/contest/release-evidence.json` y las capturas con el commit realmente desplegado.
7. Cerrar la memoria de 1.000 palabras con las cifras 6/46 y el caso SSC01M 9/11/2.
8. Completar título oficial, categoría, identidad, contacto, declaraciones, consentimiento y adjuntos del portal.
9. Obtener aprobación humana antes del envío externo.

La URL canónica prevista para la candidatura es `https://salida-cyl.157-90-22-40.sslip.io/`, pero todavía debe verificarse de nuevo después del despliegue. No consta en este handoff que se haya hecho push, desplegado o enviado la solicitud.

## Gates antes de publicar

```powershell
npm run contest:submission:check
npm test -- --testTimeout=60000
npm run test:e2e
npm run lint
npm run format:check
npm run build
```

Después del despliegue, actualizar `docs/contest/submission-checklist.md` con el commit desplegado, el workflow observado y la evidencia visual anónima.
