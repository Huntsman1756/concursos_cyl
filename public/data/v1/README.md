# Version 1 generated data layout

`manifest.json` is the current publication entry point. The application reads
the manifest and loads the immutable resource paths under `snapshots/` that it
names. Those resources and their counts/hashes represent the current generated
dataset.

The four flat JSON files in this directory are intentionally retained
pre-hardening compatibility assets:

- `programs.json`
- `centers.json`
- `training-offerings.json`
- `job-offers.json`

Older clients may have cached a flat v1 manifest that addresses these exact
paths. The files therefore must not be moved, deleted, or silently rewritten
until that compatibility contract is explicitly retired.

Their schemas and record counts may differ from the current immutable snapshot.
That difference is expected: the current manifest and application use the
immutable resources, while the flat files exist only to keep cached flat-v1
manifests loadable.
