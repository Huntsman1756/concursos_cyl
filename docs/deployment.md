# Despliegue reproducible

SALIDA CyL es un artefacto estático. El build no necesita una base de datos,
cuentas ni un runtime propietario.

## Desarrollo local

```powershell
rtk npm ci
rtk npm run data:build
rtk npm run licenses:check
rtk npm run lint
rtk npm test
rtk npm run build
rtk npm run preview -- --host 127.0.0.1
```

`npm run data:build` consulta las fuentes configuradas, valida el contrato y
solo reemplaza `public/data/v1` cuando pasan los gates. Si EDUCAbase no tiene
una extracción disponible, `outcome-indicators.json` permanece vacío y su
entrada del manifiesto queda `stale`; no se deben rellenar cifras a mano.

## Contenedor

```powershell
rtk docker build -t salida-cyl:local .
rtk docker run --rm -p 8080:8080 salida-cyl:local
```

Caddy sirve `dist`, redirige las rutas de la SPA a `index.html`, comprime las
respuestas y aplica CSP, `nosniff`, política de referer y permisos mínimos.

## Refresco operativo

Programa `npm run data:build` en un entorno controlado. Guarda el último
directorio `public/data/v1` que haya pasado la validación y revisa el diff del
manifiesto antes de publicar. El navegador solo realiza lecturas GET de los
snapshots; las respuestas y comprobaciones de la persona permanecen en
memoria y no se envían a ningún servidor.

## Publicación

El sitio puede servirse detrás de cualquier CDN o servidor HTTP que respete el
fallback de SPA. El dominio final se configura en la infraestructura, no en
el código fuente.
