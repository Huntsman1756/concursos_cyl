# SALIDA CyL

SALIDA CyL convierte formación profesional, ocupaciones y ofertas oficiales de
Castilla y León en una siguiente decisión comprobable. Ofrece dos entradas con
el mismo peso: desde un ciclo de FP y desde una ocupación. También separa los
indicadores nacionales y regionales de inserción para no fabricar una cifra
por ciclo y territorio que no publica ninguna fuente.

## Ejecutar

```powershell
rtk npm ci
rtk npm run dev
```

Comandos de calidad:

```powershell
rtk npm run data:build
rtk npm run licenses:check
rtk npm run lint
rtk npm test
rtk npm run build
rtk npm run test:e2e
```

La metodología pública está en `/metodologia` e incluye el manifiesto
descargable, fuentes, transformaciones y límites. La documentación técnica de
fuentes y evidencia está en `docs/methodology/`.

## Privacidad y alcance

La aplicación no crea cuentas, no guarda respuestas en `localStorage` y no
envía respuestas, checklist ni datos personales. Las acciones enlazan con la
fuente oficial o aplican filtros internos a snapshots públicos.

## Licencias

El código está bajo MIT. Los datos conservan las condiciones de sus fuentes;
consulta `DATA_LICENSE.md` y `THIRD_PARTY_NOTICES.md`.
