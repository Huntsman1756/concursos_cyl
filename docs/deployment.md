# Deployment

## GitHub Pages

The `Deploy GitHub Pages` workflow verifies the repository, builds with `VITE_PUBLIC_BASE_PATH=/concursos_cyl/`, creates `dist/404.html` for SPA deep-link fallback, and uploads only `dist`. Its permissions are limited to repository reads plus Pages and OIDC deployment writes.

On its first run, `actions/configure-pages` requests Pages enablement for the repository. GitHub documents automatic enablement as requiring a token with repository administration and Pages write access; the default workflow token may therefore be rejected on a repository where Pages has never been configured. If that happens, a repository owner must select **GitHub Actions** once under **Settings → Pages**, then rerun the same workflow. No application or data change is required.

After deployment, verify:

- `https://huntsman1756.github.io/concursos_cyl/`
- `/concursos_cyl/comparar` and `/concursos_cyl/metodologia` after a direct reload
- `/concursos_cyl/data/v1/manifest.json`
- the immutable `outcomeIndicators.resourcePath` beneath the same base

The Pages host controls response headers; Vite Preview and the container policy are not evidence of the headers GitHub serves. After every deployment, inspect the live Pages response separately (for example, `curl -I https://huntsman1756.github.io/concursos_cyl/`) and record any host-policy change. The application itself uses no cookies, analytics, accounts, or browser storage.

## Container

Build and run the reproducible static image:

```sh
docker build -t salida-cyl:local .
docker run -d --rm --name salida-cyl-smoke -p 8080:8080 salida-cyl:local
CADDY_SMOKE_BASE_URL=http://127.0.0.1:8080 npm run release:caddy:verify
docker stop salida-cyl-smoke
```

Caddy serves SPA fallback, gzip/zstd compression, CSP, `nosniff`, a strict referrer policy, and a restrictive permissions policy. The verifier checks those Caddy-specific headers, both deep links, the manifest, and its immutable outcome resource. For manual inspection:

```sh
curl -I http://127.0.0.1:8080/comparar
curl http://127.0.0.1:8080/data/v1/manifest.json
```

For a reverse proxy mounted below a path, build with `--build-arg VITE_PUBLIC_BASE_PATH=/desired-path/`; the proxy must strip that prefix before forwarding to Caddy. The base must be a same-origin absolute pathname; external and traversal-like values fail the build.

## VPS production

The canonical VPS deployment serves the root-based build from
`https://salida-cyl.157-90-22-40.sslip.io`. The DNS name resolves directly to
the dedicated host and can be replaced with a project-owned domain by changing
the site address in `deploy/vps/Caddyfile`.

The host uses the official Caddy package and serves immutable release
directories below `/srv/salida-cyl/releases`. The `current` symlink is replaced
atomically only after the archive has been extracted and checked. Five releases
are retained for rollback. Install the tracked Caddy configuration with:

```sh
scp deploy/vps/Caddyfile mcpspain-official-sources-vps:/etc/caddy/Caddyfile
ssh mcpspain-official-sources-vps "caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy"
```

From PowerShell, publish and verify a root build with:

```powershell
./scripts/release/deployVps.ps1
```

The deployment script does a clean dependency install, builds locally, uploads
one release archive, switches the symlink atomically, retains the five newest
releases, reloads Caddy and runs the same live SPA/header verifier used for the
container. It never copies repository metadata or credentials to the server.

## Operational version identification

Identifica operativamente el SHA, pero en BOUNDED_LOCAL no es evidencia firmada ni prueba criptográfica de procedencia.

```sh
curl https://salida-cyl.157-90-22-40.sslip.io/version.json
ssh mcpspain-official-sources-vps "cat /srv/salida-cyl/current/version.json"
```
