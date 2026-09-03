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
- CLASSIFICATION: D. INSUFFICIENTLY_DOCUMENTED
- METHODOLOGY_COVERAGE: ABSENT
- TESTS: schema, generator, domain, loader, boundary, distribution and offer-first E2E coverage are present.

## Decision

**INSUFFICIENTLY_DOCUMENTED** for a public Open Data release at candidate.8.

The artifact is technically reproducible and hash-checked, but the public surface does not yet provide the explicit license/reuse statement and Methodology scope required to call it release-ready. Remove only the conditional offer-evidence section from the public Open Data page for candidate.8. Keep the immutable JSON, manifest resource and internal generator/data artifacts; do not alter the data or canonical source snapshots.
