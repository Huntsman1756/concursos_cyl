# SALIDA CyL — EXPANSION V1 CERTIFICATION

Certification scope: the isolated candidate worktree only. This report records
the activation gate for the offer-first expansion; it does not refresh the
jury memo, final application, A4, pilot, release evidence, or final demo.

## BASELINE

- Public baseline: 8ed1e7b3f7709b2dfe7d5f3bc2486380e694e952.
- Historical immutable snapshot: 20260822085631889-fc9bf2ba23f9.
- Previous decision: EXPANSION_NEEDS_BOUNDED_FIXES.
- Baseline was installed and built in a separate exact-SHA worktree. Its
  asset inventory was 1,754,298 bytes: 549,948 JavaScript, 79,364 CSS and
  1,124,963 image bytes.
- The shared checkout remains dirty with unrelated user work and was not used
  as certification evidence.

## CANDIDATE

- Worktree: F:\CodexHome\worktrees\expansion-v1-certification-20260830.
- Branch: codex/expansion-v1-certification-20260830.
- Candidate snapshot: 20260830120000000-8c6c79fbd2a1.
- Candidate changes are limited to the offer-evidence data contract, its
  builder/activation path, the offer-first route, open-data publication,
  release guards, tests and this certification report.
- No scripts/analysis files, unrelated untracked files, history rewrite,
  push, merge, deployment or production activation was performed.
- The candidate is derived from the immutable baseline; the source snapshot
  remains available and is not replaced.

## MANIFEST

- Active manifest SHA-256:
  3244fdfedd9f4d7122adaf900ebe0d9d1a27b8e2d4243badbe19c624f65cc907.
- Active manifest snapshotId:
  20260830120000000-8c6c79fbd2a1.
- Active resource set: 22 entries, comprising 21 copied source resources and
  one derived offerEvidence resource. The historical freeze remains the
  original 21-resource artifact.
- Derived path:
  /data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json.
- Derived resource SHA-256:
  b5c1d6d32440c949715b55e41ec23c54becd5a733e93137cfdbe5dc2967caffe.
- Derived recordCount: 1,058.
- Source manifest SHA-256 recorded in activation provenance:
  b41189db5e116bb83f2ec07e865909e6114c31622324e5c5f0f268161f2381e1.
- Provenance records the candidate snapshot, source snapshot, source-resource
  partition, derived-resource partition, and the exact derived dependencies:
  jobOffers, publishedRequirements, programs, occupations,
  occupationAliases, trainingOccupationLinks, professionalProfiles and
  professionalCertificates.
- Runtime retention contains the immutable historical snapshot and the active
  candidate snapshot. The fallback path excludes the candidate-only derived
  resource and preserves the historical 21-resource identity.
- The activation is candidate-only. Main, production and deployment artifacts
  are not changed.

## OFFER EVIDENCE

The first-class runtime/open-data resource is schema-validated, manifest
addressed, hash checked and built from the immutable source snapshot plus the
review catalog. Every record keeps the published offer literal, source URL
and source date; employer data is not completed by inference.

| Metric                               | Verified value |
| ------------------------------------ | -------------: |
| Offers in candidate                  |          1,058 |
| Offers with published requirements   |            354 |
| Requirement rows                     |          1,055 |
| Classified requirement rows          |             70 |
| Unclassified requirement rows        |            985 |
| Offers with reviewed FP relationship |            138 |
| Reviewed FP relationships            |            196 |
| Offers with an alternative pathway   |             29 |
| Offers with ambiguity                |            352 |
| Raw university/regulatory signals    |            235 |
| Accepted university-evidence records |              6 |
| Accreditation actions                |             26 |
| Certificate actions                  |              3 |

The invariant 1,055 = 70 + 985 holds in the generated JSON and in the
builder test. The /desde-oferta route reads the manifest descriptor rather
than a hard-coded filename. The open-data page exposes the candidate dataset,
download, snapshot relationship and limitations; it does not claim that a
published-in-snapshot offer is still open.

## UNIVERSITY

The 235 figure is the raw signal universe, not 235 accepted qualification
claims:

- U1 literal offer requirement: 6 accepted records.
- U2 regulated-profession official-source evidence: 0 activated records.
- U3 other reviewed official evidence: 0 activated records.
- Rejected title-only university/regulatory signals: 229.

The six accepted records carry the literal requirement and publication source.
The 229 title-only cases do not receive a university route. The schema,
builder tests and UI fixture cover the U2 contract and use wording equivalent
to “Esta profesión está regulada y requiere comprobar la fuente oficial”; no
record renders “Esta oferta exige X” unless the offer itself supplies the
literal requirement. U2/U3 were not populated without a per-record reviewed
official evidence object, which keeps the absence of evidence explicit.

## ACCREDITATION

All 26 accreditation actions point to the official Castilla y León
procedure:
https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Tramite/1285133303625/Tramite

Every action carries eligibilityStatus not_calculated. The copy presents the
procedure as a consultation step only. Experience alone is not represented as
eligibility or entitlement; the action tells the user to have the
administration check applicability, documentation and the current call.

## CERTIFICATES

The three certificate actions now carry exact evidence objects with the
certificate code, official title, literal offer quote, authoritative SEPE
program URL and an explicit relevance explanation:

- Offer 1285625266971: the offer explicitly accepts SSCS0208 and SSCS0108.
- Offer 1285659912842: the offer explicitly accepts SSCS0208.
- Offer 1285670904240: the literal is only “Certificado de
  Profesionalidad.”; SSCS0208 is therefore shown as an
  occupation-related alternative, not as an accepted certificate.

Counts are two offer-explicitly-accepts actions and one
occupation-related-alternative action. The UI labels those routes differently,
links the official SEPE source and states that a certificate is not
automatically equivalent to an FP title. No action guarantees that the
generic certificate wording satisfies the offer.

## FP MAPPINGS

The independently revalidated +5 coverage is exact, source-backed and
deduplicated:

- Forestry: PEONES FORESTALES → CNO 9543 → AGA03B, official TodoFP evidence,
  three affected offers: 1285668535907, 1285669240896 and 1285671921353.
- Cooking: literal “Técnico en Cocina y Gastronomía” → HOT01M, official TodoFP
  evidence, two affected offers: 1285659376390 and 1285671836252.

Both mappings preserve the reviewed source quote, URL, review date and rule.
They are not lexical-only matches, introduce no duplicate relation and do not
inflate the reviewed 138-offer coverage metric.

## ASSETS

The comparison uses the exact baseline build and the activated candidate
build, including the same raw asset policy:

| Build     | Raw inventory | JavaScript |    CSS |    Images |
| --------- | ------------: | ---------: | -----: | --------: |
| Baseline  |     1,754,298 |    549,948 | 79,364 | 1,124,963 |
| Candidate |     1,792,741 |    581,918 | 85,837 | 1,124,963 |
| Delta     |       +38,443 |    +31,970 | +6,473 |         0 |

The offer-first route remains lazy. Its current chunk is 17,174 bytes JS and
6,405 bytes CSS. The shared entry moved from 379,208 to 392,954 bytes and
the Open Data JS chunk moved from 4,848 to 5,895 bytes. The increase is
therefore explained by the new lazy route, the manifest-addressed dataset
card, certificate evidence rendering and their shared imports; there is no
identified duplicate feature bundle.

The measured policy is:

- JavaScript cap: 582,500 bytes, leaving 582 bytes of deliberate rounded
  candidate reserve above the deterministic 581,918-byte build.
- CSS cap: 90,000 bytes.
- Images cap: 1,150,000 bytes.
- Total cap: 1,800,000 bytes, with 7,259 bytes remaining.

The prior 572,059-byte intermediate JavaScript figure was not used as final
evidence; it predated the activated first-class resource and certificate
evidence. The smallest defensible rounded threshold for the final build is
582,500 bytes. Result: ASSET_POLICY_ACCEPT.

## TESTS

All required gates were run against the candidate:

- npm ci: PASS; 311 packages installed, 0 vulnerabilities.
- npm run format:check: PASS.
- npm run lint: PASS.
- npm run typecheck: PASS.
- npm run license:check: PASS; 363 locked package entries.
- npm test -- --run --maxWorkers=1 --fileParallelism=false --reporter=dot:
  PASS; 121 files passed, 22 skipped; 1,232 tests passed, 178 skipped.
- npm run test:release -- --run scripts/release --reporter=dot
  --maxWorkers=1 --fileParallelism=false: PASS; 25 files and 312 tests.
- npm run build: PASS; Vite build, runtime retention, asset budget,
  distribution and candidate boundary all passed.
- npm run test:e2e:chromium: PASS; 164/164 Chromium tests across desktop and
  mobile.
- npm run contest:submission:check: PASS; submission documents match the
  historical coverage freeze.
- Fresh compact data/hash audit: PASS; zero violations, sidecar hash matches
  the manifest, and all required count and mapping invariants hold.
- git diff --check and the baseline-to-candidate boundary check are required
  again after the final commit and must remain clean.

The expected React error-boundary stderr is produced only by tests that
deliberately exercise the fallback component; it does not represent a failed
test.

## QA

Manual browser QA was performed against the activated candidate, with
desktop and 390px mobile views:

- Home exposes the three journeys and the Desde oferta entry point.
- The /desde-oferta route loads all 1,058 offers, supports search/status/province
  filters and preserves the query in a deep-link reload.
- The exact cooking path shows the literal requirement, reviewed HOT01M
  relationship, official admission action and original offer.
- The caregiver path shows ambiguity and does not claim a qualification.
- The physiotherapy path separates accepted literal U1 from rejected title-only
  cases and never emits “Esta oferta exige”.
- Certificate cards show exact SEPE sources and distinguish accepted from
  related alternatives.
- The /datos-abiertos page shows the candidate label, immutable-base count,
  JSON download, source/limitations context and offer explorer link.
- FP-first and occupation-first routes remain reachable and distinct.
- Mobile layout had no horizontal overflow: measured body and document width
  375px at a 390px viewport.
- Native controls and focus indicators remain keyboard reachable; the
  Chromium keyboard/focus tests pass.
- Browser development logs during the manual route pass contained no console
  errors or warnings.

## CLAIMS

Fresh adversarial review accepted EXPANSION_CLAIMS_ACCEPT:

- Literal requirements are shown as literal evidence; title-only signals are
  not converted into requirements.
- FP relations are shown only when reviewed and source-backed.
- University, certificate and FP relationships are not presented as
  equivalence, entitlement, hiring, salary, ranking or recommendation claims.
- Accreditation is a procedure-to-consult action with eligibility not
  calculated.
- Offer status is bounded to the source snapshot; no current-open claim is
  made.
- The dataset contains no employer completion, prediction, market total,
  full-employment claim, stale course recommendation or hidden tracking.
- The open-data resource is reproducible from manifest-addressed source
  snapshots, review metadata and hashes.

## CONTEST VALUE

The baseline already had useful FP-first and occupation-first journeys, but it
did not give a citizen a bounded path from a real offer to the published
requirement, reviewed relationship, source and next official action. The
expansion adds that missing path over the complete 1,058-offer candidate,
including 1,055 auditable requirement rows, explicit ambiguity, conservative
university boundaries, certificate semantics, official links and a reusable
open JSON resource.

This is a meaningful product payoff rather than a second dashboard: a user
starts with the offer they actually have, sees what the publication says,
understands what was and was not reviewed, and can continue to the official
source. The open-data artifact makes the same evidence reusable outside the
interface.

## FINAL DECISION

EXPANSION_READY_FOR_PR
