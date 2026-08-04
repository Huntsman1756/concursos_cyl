# Dependency license policy

SALIDA CyL is open-source software distributed under the MIT license. Runtime
and development software packages must use an approved open-source or
permissive license. The automated allowlist currently covers `0BSD`,
`Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `MIT`, `MIT-0`, and
`MPL-2.0`.

Compatibility datasets embedded in software packages are open content rather
than executable software. The following narrow exceptions are reviewed and
attributed:

- `caniuse-lite`: `CC-BY-4.0`, browser-compatibility data only.
- `mdn-data`: `CC0-1.0`, web-platform data only.
- `lru-cache` and `minimatch`: `BlueOak-1.0.0`, reviewed permissive packages.

No other package may use these exception licenses without a documented review
and an explicit policy update. Proprietary licenses and missing license
metadata fail the gate.

Run `npm run license:check` after every dependency change. The command reads
the complete locked dependency tree from `package-lock.json`, evaluates every
entry, and exits non-zero for an unapproved or unreviewed license. It uses only
Node.js and project-owned TypeScript; no proprietary audit service is needed.
