# Offer evidence scope audit

- OFFER_DATASET_INTRODUCED_COMMIT: `9bad066a1144e6055e087e2c6e64f371521bf10d` — 2026-09-01 — `chore(contest): converge local release candidate`.
- Purpose: activate the Expansion V1 derived offer-evidence resource in the immutable manifest and expose its evidence-backed offer journey.
- PUBLIC_FILE: `/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json`
- GENERATOR: `scripts/data/buildOfferEvidenceSnapshot.ts`, `scripts/data/activateOfferEvidenceCandidate.ts`
- RECORD_COUNT: 1058
- SCHEMA: `data/schemas/offerEvidence.ts:OfferEvidenceResourceSchema` (1.0.0)
- LICENSE: source documented as CC BY 4.0 ES, but derived-resource reuse terms are not declared in its own manifest/catalog entry.
- PROVENANCE: base snapshot `20260822085631889-fc9bf2ba23f9`; review version `1.0.0`; review catalog SHA-256 `0f7e913c70e7f1e66686bb0837a617667130d0dfa6e17aed647d74fb825b7127`.
- HASH: 80dd7ccb917c75015bf38492cc5baf4bed6ee20a3a4043e3a981a9a6d38c17d4 (manifest match: YES)
- SNAPSHOT: `1058` records, generated `2026-08-30T12:00:00.000Z`, base offer count `1058`.
- MANIFEST_RELATIONSHIP: key `offerEvidence`, quality `passed`, immutable resource path, derived dependency keys `jobOffers, occupationAliases, occupations, professionalCertificates, professionalProfiles, programs, publishedRequirements, trainingOccupationLinks`.
- CANONICAL_OR_DERIVED: DERIVED
- CONTAINS_PRIVATE_EMPLOYERS: NO
- CONTAINS_PREDICTIONS: NO
- OFFER_DATASET_PUBLIC_SURFACE: REMOVED_FROM_OPEN_DATA_SURFACE
- OFFER_DATASET_RUNTIME_ROLE: RUNTIME_DERIVED_RESOURCE
- OFFER_DATASET_STANDALONE_PUBLICATION_STATUS: NOT_PUBLISHED_AS_STANDALONE_REUSABLE_DATASET
- CLASSIFICATION: D. INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION
- METHODOLOGY_COVERAGE: PRESENT
- TESTS: schema, generator, domain, loader, boundary, distribution and offer-first E2E coverage are present.

## Decision

**D. INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION**.

The artifact is technically reproducible and hash-checked. The public Methodology now explains its derived runtime role and makes clear that it is not published as a standalone reusable dataset. The independent publication remains out of scope until its reuse terms are documented at the same level as the published datasets. Keep the immutable JSON, manifest resource and generators/data artifacts; do not alter the data or canonical source snapshots.
