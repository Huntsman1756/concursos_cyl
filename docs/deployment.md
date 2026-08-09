# Deployment

## GitHub Pages

The `Deploy GitHub Pages` workflow verifies the repository, builds with `VITE_PUBLIC_BASE_PATH=/concursos_cyl/`, creates `dist/404.html` for SPA deep-link fallback, and uploads only `dist`. Its permissions are limited to repository reads plus Pages and OIDC deployment writes.

After deployment, verify:

- `https://huntsman1756.github.io/concursos_cyl/`
- `/concursos_cyl/comparar` and `/concursos_cyl/metodologia` after a direct reload
- `/concursos_cyl/data/v1/manifest.json`
- the immutable `outcomeIndicators.resourcePath` beneath the same base

The Pages host controls response headers. The application itself uses no cookies, analytics, accounts, or browser storage.

## Container

Build and run the reproducible static image:

```sh
docker build -t salida-cyl:local .
docker run --rm -p 8080:8080 salida-cyl:local
```

Caddy serves SPA fallback, gzip/zstd compression, CSP, `nosniff`, a strict referrer policy, and a restrictive permissions policy. Check a deep link and headers:

```sh
curl -I http://127.0.0.1:8080/comparar
curl http://127.0.0.1:8080/data/v1/manifest.json
```

For a reverse proxy mounted below a path, build with `--build-arg VITE_PUBLIC_BASE_PATH=/desired-path/`; the proxy must strip that prefix before forwarding to Caddy. The base must be a same-origin absolute pathname; external and traversal-like values fail the build.
