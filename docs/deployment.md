# Despliegue

La [operativa en español](operations.md) define comprobaciones, mantenimiento, recuperación y límites del seguimiento. La configuración de logs del VPS aplica filtrado y rotación por sitio; su activación se documenta en el informe de cierre.

## GitHub Pages

The `Deploy GitHub Pages` workflow verifies the repository, builds with `VITE_PUBLIC_BASE_PATH=/concursos_cyl/`, materializes known routes as directory indexes (HTTP 200 after any directory redirect), keeps `dist/404.html` for unknown-route fallback, and uploads only `dist`. Its permissions are limited to repository reads plus Pages and OIDC deployment writes. The live verifier requests the final `/comparar/` directory URL and requires HTTP 200; it continues to reject redirects for all verification requests.

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
docker build --build-arg RELEASE_COMMIT="$(git rev-parse HEAD)" -t salida-cyl:local .
docker run -d --rm --name salida-cyl-smoke -p 8080:8080 salida-cyl:local
CADDY_SMOKE_BASE_URL=http://127.0.0.1:8080 CADDY_SMOKE_EXPECTED_COMMIT="$(git rev-parse HEAD)" npm run release:caddy:verify
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
`https://salidacyl.es`. The domain uses DonDominio DNS: an A record for `salidacyl.es` points to
`157.90.22.40`, and `www` is a CNAME for `salidacyl.es`.
`deploy/vps/Caddyfile` serves the canonical host and redirects `www` while
preserving the request URI. The previous `salida-cyl.157-90-22-40.sslip.io` host
continues to serve the application during DNS activation. Caddy obtains and
renews the new certificates automatically once the public DNS delegation is live.

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

On macOS or Linux, keep `deployVps.ps1` as the Windows entry point and use the
POSIX counterpart after the read-only SSH preflight succeeds:

```sh
ssh -o BatchMode=yes -o IdentitiesOnly=yes salida-cyl-vps true
./scripts/release/deployVps.sh salida-cyl-vps
```

The POSIX command accepts an optional release ID as its second argument. The
preflight only checks authentication and does not change the remote host.

PowerShell delegates to the same POSIX script through Git for Windows Bash, so both entry points share locking, staging, retention and failure reporting.

The deployment script does a clean dependency install, builds locally, uploads
one uniquely named archive per execution, switches the symlink atomically,
retains the five newest releases, reloads Caddy and runs the same live SPA/header
verifier used for the container. A remote deployment lock serializes activation
and retention so concurrent runs cannot delete a release being activated.
Retention inventory, sorting, selection and
deletion are checked separately; any failure stops the deployment before Caddy
is reloaded. The remote host therefore needs GNU `find`, `sort`, `tail`, `cut`
and `mv`, in addition to Caddy and the documented SSH permissions. The script
never copies repository metadata or credentials to the server.

## Operational version identification

Identifica operativamente el SHA, pero en BOUNDED_LOCAL no es evidencia firmada ni prueba criptográfica de procedencia.

```sh
curl https://salidacyl.es/version.json
ssh mcpspain-official-sources-vps "cat /srv/salida-cyl/current/version.json"
```
