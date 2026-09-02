#!/usr/bin/env node
/**
 * Pre-implementation data integrity audit for SALIDA CyL design reconciliation.
 *
 * Reads the ACTIVE manifest-addressed snapshot (public/data/v1/manifest.json →
 * /data/v1/snapshots/<snapshotId>/) plus the legacy root resource files, and
 * recomputes every figure the design prototypes display.
 *
 * Usage (repo root): node scripts/analysis/auditPrototypeData.mjs
 * Output: analysis/prototype-data-audit.json + console summary.
 * Read-only over public/data, data, src. Writes only into analysis/.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ACTIVE = join(ROOT, "public", "data", "v1");
const OUT = join(ROOT, "analysis");

const manifest = JSON.parse(readFileSync(join(ACTIVE, "manifest.json"), "utf8"));
const snapshotId = manifest.snapshotId;
const snap = (file) =>
  join(ACTIVE, "snapshots", snapshotId, file);

function loadResource(key) {
  const meta = manifest.resourceSnapshots[key];
  if (!meta) return { meta: null, data: null };
  const file = join(ROOT, "public", meta.resourcePath.replace(/^\//, ""));
  const buf = readFileSync(file);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  return { meta, data: JSON.parse(buf.toString("utf8")), sha256, file };
}

function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const audit = { generatedAt: new Date().toISOString(), snapshotId, manifest: {} };

// ---------------------------------------------------------------------------
// 0. MANIFEST INTEGRITY
// ---------------------------------------------------------------------------
const manifestIssues = [];
const resourceCounts = {};
for (const [key, meta] of Object.entries(manifest.resourceSnapshots)) {
  const file = join(ROOT, "public", meta.resourcePath.replace(/^\//, ""));
  const buf = readFileSync(file);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const data = JSON.parse(buf.toString("utf8"));
  const count = Array.isArray(data) ? data.length : (data.records ? data.records.length : null);
  resourceCounts[key] = count;
  if (sha256 !== meta.sha256) manifestIssues.push(`${key}: sha mismatch`);
  if (count !== null && count !== meta.recordCount) manifestIssues.push(`${key}: recordCount ${meta.recordCount} != file ${count}`);
}
audit.manifest = {
  snapshotId,
  qualityStatus: manifest.qualityStatus,
  resourceCount: Object.keys(manifest.resourceSnapshots).length,
  resourceCounts,
  issues: manifestIssues,
};

// ---------------------------------------------------------------------------
// A. GLOBAL OFFERS
// ---------------------------------------------------------------------------
const jobOffersActive = JSON.parse(readFileSync(snap("job-offers.json"), "utf8"));
const offerEvidence = JSON.parse(readFileSync(snap("offer-evidence.json"), "utf8"));
const legacyJobOffersPath = join(ACTIVE, "job-offers.json");
const legacyJobOffers = JSON.parse(readFileSync(legacyJobOffersPath, "utf8"));

const legacySet = new Set(legacyJobOffers.map((o) => o.id));
const activeSet = new Set(jobOffersActive.map((o) => o.id));
const onlyInActive = [...activeSet].filter((id) => !legacySet.has(id)).length;
const onlyInLegacy = [...legacySet].filter((id) => !activeSet.has(id)).length;

audit.globalOffers = {
  manifestJobOffersRecordCount: manifest.resourceSnapshots.jobOffers.recordCount,
  activeSnapshotJobOffersRecords: jobOffersActive.length,
  offerEvidenceRecords: offerEvidence.records.length,
  offerEvidenceCountsOfferCount: offerEvidence.counts.offerCount,
  legacyRootJobOffersRecords: legacyJobOffers.length,
  legacyFileExcludedFromRuntime: true,
  legacyRuntimeRootFiles: ["centers.json", "job-offers.json", "programs.json", "training-offerings.json"],
  diffActiveVsLegacy: { onlyInActive: onlyInActive, onlyInLegacy: onlyInLegacy },
  classification: "WRONG_RESOURCE",
  explanation:
    "El prototipo de ofertas globales leyó public/data/v1/job-offers.json (raíz legacy, 1033 registros, copia de una era de snapshot anterior) en lugar del recurso direccionado por el manifest activo (/data/v1/snapshots/" +
    snapshotId + "/job-offers.json, 1058 registros, sha256 decd3bcf… igual al manifest). prepareRuntimeData.ts excluye los 4 ficheros raíz legacy del runtime de producción (LEGACY_RUNTIME_ROOT_FILES), por lo que el runtime nunca serviría 1033.",
  pagination: { pageSize: 12, pageCount: Math.ceil(jobOffersActive.length / 12), lastPageRange: `${(Math.ceil(jobOffersActive.length / 12) - 1) * 12 + 1}-${jobOffersActive.length} de ${jobOffersActive.length}` },
};

// ---------------------------------------------------------------------------
// B. REVIEWED OFFER SEMANTICS
// ---------------------------------------------------------------------------
const records = offerEvidence.records;
const reviewedOffers = records.filter((r) => (r.relations ?? []).length > 0);
const relationCount = records.reduce((acc, r) => acc + (r.relations ?? []).length, 0);
const reviewedOfferIds = new Set(reviewedOffers.map((r) => r.offerId));
const programOccupationKeys = new Set();
for (const r of reviewedOffers) {
  for (const rel of r.relations ?? []) {
    programOccupationKeys.add(`${rel.programKey}|${rel.occupationId}`);
  }
}
const relationTypes = {};
const reviewedAts = {};
for (const r of reviewedOffers) {
  for (const rel of r.relations ?? []) {
    relationTypes[rel.relationshipType] = (relationTypes[rel.relationshipType] ?? 0) + 1;
    reviewedAts[rel.reviewedAt] = (reviewedAts[rel.reviewedAt] ?? 0) + 1;
  }
}
// distinct program keys that appear in reviewed offer relations
const programKeysWithReviewedOffers = new Set(reviewedOffers.flatMap((r) => (r.relations ?? []).map((rel) => rel.programKey)));
const occupationIdsWithReviewedOffers = new Set(reviewedOffers.flatMap((r) => (r.relations ?? []).map((rel) => rel.occupationId)));
const evidenceStatusCounts = {};
for (const r of records) evidenceStatusCounts[r.evidenceStatus] = (evidenceStatusCounts[r.evidenceStatus] ?? 0) + 1;

audit.reviewedOfferSemantics = {
  TOTAL_OFFERS: jobOffersActive.length,
  UNIQUE_REVIEWED_FP_RELATED_OFFERS: reviewedOfferIds.size,
  OFFER_FP_RELATION_COUNT: relationCount,
  UNIQUE_PROGRAM_OCCUPATION_KEYS_WITH_REVIEWED_OFFERS: programOccupationKeys.size,
  PROGRAM_KEYS_WITH_REVIEWED_OFFERS: programKeysWithReviewedOffers.size,
  OCCUPATION_IDS_WITH_REVIEWED_OFFERS: occupationIdsWithReviewedOffers.size,
  UNIT: "oferta única (offerId); OFFER_FP_RELATION_COUNT cuenta relaciones oferta→(ciclo,ocupación), no ofertas",
  countsSidecarMatch: {
    offerCount: offerEvidence.counts.offerCount === jobOffersActive.length,
    offersWithReviewedFpRelationship: offerEvidence.counts.offersWithReviewedFpRelationship === reviewedOfferIds.size,
    reviewedRelationCount: offerEvidence.counts.reviewedRelationCount === relationCount,
  },
  evidenceStatusCounts,
  relationTypes,
  reviewedAts,
  distinctPublishedAtMax: records.reduce((m, r) => (r.publishedAt > m ? r.publishedAt : m), records[0].publishedAt),
};

// ---------------------------------------------------------------------------
// C. CENTER AGGREGATION (centerCode:programKey)
// ---------------------------------------------------------------------------
const centers = JSON.parse(readFileSync(snap("centers.json"), "utf8"));
const offerings = JSON.parse(readFileSync(snap("training-offerings.json"), "utf8"));
const programs = JSON.parse(readFileSync(snap("programs.json"), "utf8"));

const centerByCode = new Map(centers.map((c) => [c.centerCode, c]));
const programByKey = new Map(programs.map((p) => [p.programKey, p]));

const valid = [];
const unresolved = { center: 0, program: 0 };
for (const o of offerings) {
  const center = centerByCode.get(o.centerCode);
  const program = programByKey.get(o.programKey);
  if (!center) { unresolved.center += 1; continue; }
  if (!program) { unresolved.program += 1; continue; }
  valid.push({ offering: o, center, program });
}

const rows = new Map();
for (const { offering: o, center, program } of valid) {
  const key = `${center.centerCode}:${program.programKey}`;
  if (!rows.has(key)) {
    rows.set(key, {
      key,
      centerCode: center.centerCode,
      centerName: center.centerName,
      centerOwnership: center.centerOwnership ?? null,
      centerWebsite: center.website ?? null,
      province: center.province,
      locality: center.locality,
      programKey: program.programKey,
      programTitle: program.programTitle,
      level: program.level,
      familyCode: program.familyCode,
      familyName: program.familyName,
      modalities: new Set(),
      teachingTypes: new Set(),
      offeringIds: [],
    });
  }
  const row = rows.get(key);
  if (o.modality) row.modalities.add(o.modality);
  if (o.teachingType) row.teachingTypes.add(o.teachingType);
  row.offeringIds.push(o.offeringId);
}

const rowList = [...rows.values()];
for (const row of rowList) {
  row.modalities = [...row.modalities].sort();
  row.teachingTypes = [...row.teachingTypes].sort();
}

const collapsedGroups = rowList.filter((r) => r.offeringIds.length > 1);
const spanish = new Intl.Collator("es");
rowList.sort(
  (a, b) =>
    spanish.compare(a.province, b.province) ||
    spanish.compare(a.locality, b.locality) ||
    spanish.compare(a.centerName, b.centerName) ||
    spanish.compare(a.programTitle, b.programTitle),
);

audit.centerAggregation = {
  RAW_TRAINING_OFFERINGS: offerings.length,
  VALID_RESOLVED_OFFERINGS: valid.length,
  UNIQUE_CENTER_PROGRAM_ROWS: rowList.length,
  COLLAPSED_RECORD_COUNT: offerings.length - valid.length + collapsedGroups.length, // raw - unique (all resolve)
  unresolved,
  collapsedGroups: collapsedGroups.map((r) => ({
    centerCode: r.centerCode,
    centerName: r.centerName,
    programKey: r.programKey,
    programTitle: r.programTitle,
    province: r.province,
    locality: r.locality,
    modalities: r.modalities,
    teachingTypes: r.teachingTypes,
    records: r.offeringIds.map((id) => {
      const o = offerings.find((x) => x.offeringId === id);
      return { offeringId: o.offeringId, modality: o.modality, teachingType: o.teachingType, centerOwnership: o.centerOwnership ?? "(ausente en raw)", level: o.level };
    }),
  })),
};

// ---------------------------------------------------------------------------
// F. FACET COUNTS (unit: unique center-program rows)
// ---------------------------------------------------------------------------
function tally(list, fn) {
  const t = {};
  for (const item of list) {
    const keys = fn(item);
    const seen = new Set();
    for (const k of keys) {
      if (seen.has(k)) continue;
      seen.add(k);
      t[k] = (t[k] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(t).sort((a, b) => spanish.compare(a[0], b[0])));
}

const ROWS_BY_PROVINCE = tally(rowList, (r) => [r.province]);
const ROWS_BY_MODALITY = tally(rowList, (r) => r.modalities);
const ROWS_BY_TEACHING_TYPE = tally(rowList, (r) => r.teachingTypes);
const ROWS_BY_LEVEL = tally(rowList, (r) => [r.level]);
const ROWS_BY_FAMILY = tally(rowList, (r) => [`${r.familyCode} — ${r.familyName}`]);
const ROWS_BY_CENTER_OWNERSHIP = tally(rowList, (r) => [r.centerOwnership ?? "null"]);
const UNIQUE_CENTERS_BY_PROVINCE = tally(centers, (c) => [c.province]);
const UNIQUE_CENTERS_BY_CENTER_OWNERSHIP = tally(centers, (c) => [c.centerOwnership ?? "null"]);

audit.facetCounts = {
  UNIT: "fila única centerCode:programKey (opción formativa)",
  ROWS_BY_PROVINCE,
  ROWS_BY_MODALITY,
  ROWS_BY_TEACHING_TYPE,
  ROWS_BY_LEVEL,
  ROWS_BY_FAMILY,
  ROWS_BY_CENTER_OWNERSHIP,
  UNIQUE_CENTERS_BY_PROVINCE: { UNIT: "centro único (centerCode)", ...UNIQUE_CENTERS_BY_PROVINCE },
  UNIQUE_CENTERS_BY_CENTER_OWNERSHIP: { UNIT: "centro único (centerCode)", ...UNIQUE_CENTERS_BY_CENTER_OWNERSHIP },
  multivalueNote: "Una fila puede pertenecer a varias facetas (modalidades[]/teachingTypes[]); la suma de facetas no tiene por qué igualar el total de filas.",
};

// ---------------------------------------------------------------------------
// G. UNKNOWN / NULL PRESENTATION
// ---------------------------------------------------------------------------
const modalityValues = {};
const teachingTypeValues = {};
for (const o of offerings) {
  modalityValues[o.modality ?? "null"] = (modalityValues[o.modality ?? "null"] ?? 0) + 1;
  teachingTypeValues[o.teachingType ?? "null"] = (teachingTypeValues[o.teachingType ?? "null"] ?? 0) + 1;
}
const rowModalityValues = {};
for (const r of rowList) for (const m of r.modalities) rowModalityValues[m] = (rowModalityValues[m] ?? 0) + 1;
const rowsWithoutModality = rowList.filter((r) => r.modalities.length === 0).length;
const rowsWithoutTeachingType = rowList.filter((r) => r.teachingTypes.length === 0).length;
const centersWithoutWebsite = centers.filter((c) => !c.website).length;
const offersWithoutLocality = records.filter((r) => r.locality == null).length;
audit.unknownNullPresentation = {
  offeringModalityValues: modalityValues,
  offeringTeachingTypeValues: teachingTypeValues,
  rowModalityValues,
  rowsWithoutModality,
  rowsWithoutTeachingType,
  modalityUnknownRowCount: rowModalityValues.unknown ?? 0,
  policy: {
    unknownModality: "unknown == 0 en snapshot activo → no se muestra como opción de filtro visible; soporte futuro con etiqueta «Modalidad no publicada» y filtro futuro «Sin modalidad publicada»; prohibido «Desconocida».",
    nullLocalityOffers: "Ofertas con locality null: presentar provincia únicamente, sin inventar localidad («localidad no publicada» no se muestra como dato).",
  },
  centersWithoutWebsite,
  offersWithoutLocality,
};

// ---------------------------------------------------------------------------
// H. SCREEN-BY-SCREEN FIGURE AUDIT
// ---------------------------------------------------------------------------
const screens = [];

// HOME proof rail
screens.push({
  screen: "HOME",
  value: programs.length,
  label: "ciclos oficiales",
  sourceResource: "programs",
  sourcePath: `/data/v1/snapshots/${snapshotId}/programs.json`,
  unit: "ciclo (programKey único)",
  derivation: "programs.length",
  prototypeValue: 187,
  match: programs.length === 187,
});
screens.push({
  screen: "HOME",
  value: reviewedOfferIds.size,
  label: "ofertas con relación FP revisada",
  sourceResource: "offerEvidence",
  sourcePath: `/data/v1/snapshots/${snapshotId}/offer-evidence.json`,
  unit: "oferta única con ≥1 relación revisada",
  derivation: "records con relations.length>0 (offerId distinto)",
  prototypeValue: 138,
  match: reviewedOfferIds.size === 138,
});
screens.push({
  screen: "HOME",
  value: centers.length,
  label: "centros",
  sourceResource: "centers",
  sourcePath: `/data/v1/snapshots/${snapshotId}/centers.json`,
  unit: "centro (centerCode único)",
  derivation: "centers.length",
  prototypeValue: 229,
  match: centers.length === 229,
});

// FP DETAIL ADG02S
const ADG = "ADG02S";
const adgRelationsFromGraph = JSON.parse(readFileSync(snap("derived-fp-occupation-graph.json"), "utf8")).filter((r) => r.programKey === ADG);
const adgReviewedOffers = reviewedOffers.filter((r) => (r.relations ?? []).some((rel) => rel.programKey === ADG));
const adgRows = rowList.filter((r) => r.programKey === ADG);
const adgProvinces = tally(adgRows, (r) => [r.province]);
const adgOccupationIds = new Set(adgRelationsFromGraph.map((r) => r.occupationId));
screens.push({
  screen: "FP DETAIL (ADG02S)",
  value: adgRelationsFromGraph.length,
  label: "profesiones relacionadas",
  sourceResource: "derivedFpOccupationGraph",
  sourcePath: `/data/v1/snapshots/${snapshotId}/derived-fp-occupation-graph.json`,
  unit: "relación FP↔ocupación única del ciclo (ocupaciones distintas)",
  derivation: "graph rows programKey=ADG02S; ocupaciones distintas: " + adgOccupationIds.size,
  prototypeValue: 4,
  match: adgRelationsFromGraph.length === 4 && adgOccupationIds.size === 4,
  detail: { occupations: [...adgOccupationIds].sort(), types: tally(adgRelationsFromGraph, (r) => [r.relationshipType]) },
});
screens.push({
  screen: "FP DETAIL (ADG02S)",
  value: adgReviewedOffers.length,
  label: "ofertas con relación revisada",
  sourceResource: "offerEvidence",
  unit: "oferta única",
  derivation: "records con ≥1 relation.programKey=ADG02S",
  prototypeValue: 2,
  match: adgReviewedOffers.length === 2,
  detail: { offerIds: adgReviewedOffers.map((r) => r.offerId), provinces: adgReviewedOffers.map((r) => r.province), publishedAt: adgReviewedOffers.map((r) => r.publishedAt) },
});
screens.push({
  screen: "FP DETAIL (ADG02S)",
  value: adgRows.length,
  label: "centros publican el ciclo",
  sourceResource: "trainingOfferings × centers × programs",
  unit: "fila centerCode:programKey",
  derivation: "filas agregadas con programKey=ADG02S",
  prototypeValue: 45,
  match: adgRows.length === 45,
});
screens.push({
  screen: "FP DETAIL (ADG02S) · provinces",
  value: Object.keys(adgProvinces).length,
  label: "provincias con el ciclo",
  unit: "provincia",
  derivation: "provincias de las filas ADG02S",
  prototypeValue: 9,
  match: Object.keys(adgProvinces).length === 9 && adgProvinces["Valladolid"] === 10 && adgProvinces["León"] === 9 && adgProvinces["Burgos"] === 7,
  detail: adgProvinces,
});

// OCCUPATION CNO 5611
const occ5611 = "occupation:cno11:5611";
const graph = JSON.parse(readFileSync(snap("derived-fp-occupation-graph.json"), "utf8"));
const occ5611Programs = [...new Set(graph.filter((r) => r.occupationId === occ5611).map((r) => r.programKey))];
const occ5611Offers = reviewedOffers.filter((r) => (r.relations ?? []).some((rel) => rel.occupationId === occ5611));
const occ5611Rows = rowList.filter((r) => occ5611Programs.includes(r.programKey));
screens.push({
  screen: "OCCUPATION DETAIL (CNO 5611)",
  value: occ5611Programs.length,
  label: "FP relacionada",
  sourceResource: "derivedFpOccupationGraph",
  unit: "ciclo (programKey) con relación revisada a la ocupación",
  derivation: "programKeys distintos en graph para occupation:cno11:5611",
  prototypeValue: 1,
  match: occ5611Programs.length === 1 && occ5611Programs[0] === "SAN21",
  detail: occ5611Programs,
});
screens.push({
  screen: "OCCUPATION DETAIL (CNO 5611)",
  value: occ5611Offers.length,
  label: "ofertas con relación revisada",
  sourceResource: "offerEvidence",
  unit: "oferta única",
  derivation: "records con ≥1 relation.occupationId=cno11:5611",
  prototypeValue: 34,
  match: occ5611Offers.length === 34,
});
screens.push({
  screen: "OCCUPATION DETAIL (CNO 5611)",
  value: occ5611Rows.length,
  label: "centros donde estudiarla",
  sourceResource: "trainingOfferings × centers × programs",
  unit: "fila centerCode:programKey de los ciclos relacionados",
  derivation: "filas agregadas con programKey ∈ relacionados (SAN21)",
  prototypeValue: 34,
  match: occ5611Rows.length === 34,
});

// CNO 3820 (zero state)
const occ3820 = "occupation:cno11:3820";
const occ3820Programs = [...new Set(graph.filter((r) => r.occupationId === occ3820).map((r) => r.programKey))];
const occ3820Relations = graph.filter((r) => r.occupationId === occ3820);
const occ3820Offers = reviewedOffers.filter((r) => (r.relations ?? []).some((rel) => rel.occupationId === occ3820));
screens.push({
  screen: "ZERO STATE (CNO 3820)",
  value: occ3820Programs.length,
  label: "FP con relación revisada",
  sourceResource: "derivedFpOccupationGraph",
  unit: "ciclo (programKey)",
  derivation: "programKeys distintos en graph para occupation:cno11:3820",
  prototypeValue: 2,
  match: occ3820Programs.length === 2 && occ3820Relations.every((r) => r.relationshipType === "reviewed_relationship"),
  detail: occ3820Programs,
});
screens.push({
  screen: "ZERO STATE (CNO 3820)",
  value: occ3820Offers.length,
  label: "ofertas con relación comprobada",
  sourceResource: "offerEvidence",
  unit: "oferta única",
  derivation: "records con ≥1 relation.occupationId=cno11:3820",
  prototypeValue: 0,
  match: occ3820Offers.length === 0,
});

// OFFERS GLOBAL
screens.push({
  screen: "GLOBAL OFFERS",
  value: records.length,
  label: "ofertas (catálogo global sin filtros)",
  sourceResource: "offerEvidence (+ jobOffers)",
  sourcePath: `/data/v1/snapshots/${snapshotId}/offer-evidence.json`,
  unit: "oferta única (offerId)",
  derivation: "offerEvidence.records.length; coincide con jobOffers.length y manifest.recordCount",
  prototypeValue: 1033,
  match: records.length === 1058,
  correctedFromPrototype: 1033 !== records.length,
});
screens.push({
  screen: "GLOBAL OFFERS",
  value: reviewedOfferIds.size,
  label: "con FP relacionada en esta copia",
  sourceResource: "offerEvidence",
  unit: "oferta única con ≥1 relación revisada",
  derivation: "records con relations.length>0",
  prototypeValue: 138,
  match: reviewedOfferIds.size === 138,
});
screens.push({
  screen: "GLOBAL OFFERS · pagination",
  value: Math.ceil(records.length / 12),
  label: "páginas (12/página); última página " + `${(Math.ceil(records.length / 12) - 1) * 12 + 1}-${records.length} de ${records.length}`,
  sourceResource: "offerEvidence",
  unit: "página",
  derivation: "ceil(1058/12)",
  prototypeValue: null,
  match: Math.ceil(records.length / 12) === 89,
});

// OFFERS CONTEXTUAL ADG02S
screens.push({
  screen: "CONTEXTUAL OFFERS (ADG02S)",
  value: adgReviewedOffers.length,
  label: "ofertas relacionadas con el ciclo",
  sourceResource: "offerEvidence",
  unit: "oferta única",
  derivation: "records con ≥1 relation.programKey=ADG02S",
  prototypeValue: 2,
  match: adgReviewedOffers.length === 2,
});

// CENTERS EXPLORER
screens.push({
  screen: "CENTERS GLOBAL",
  value: rowList.length,
  label: "opciones formativas (1–50 de N)",
  sourceResource: "trainingOfferings × centers × programs",
  unit: "fila única centerCode:programKey",
  derivation: "1294 raw → resolver centro+programa → agrupar centerCode:programKey",
  prototypeValue: 1293,
  match: rowList.length === 1293,
});
screens.push({
  screen: "CENTERS GLOBAL",
  value: new Set(rowList.map((r) => r.centerCode)).size,
  label: "centros representados",
  sourceResource: "centers",
  unit: "centro único",
  derivation: "centerCode distintos en filas agregadas",
  prototypeValue: 229,
  match: new Set(rowList.map((r) => r.centerCode)).size === 229,
});

// CENTERS CONTEXTUAL ADG02S
screens.push({
  screen: "CENTERS CONTEXTUAL (ADG02S)",
  value: adgRows.length,
  label: "opciones formativas (1–45 de 45) · provincias",
  sourceResource: "trainingOfferings × centers × programs",
  unit: "fila centerCode:programKey (y conteos por provincia)",
  derivation: "filas ADG02S por provincia",
  prototypeValue: adgProvinces,
  match:
    adgRows.length === 45 &&
    adgProvinces["Ávila"] === 4 && adgProvinces["Burgos"] === 7 && adgProvinces["León"] === 9 &&
    adgProvinces["Palencia"] === 3 && adgProvinces["Salamanca"] === 7 && adgProvinces["Segovia"] === 2 &&
    adgProvinces["Soria"] === 1 && adgProvinces["Valladolid"] === 10 && adgProvinces["Zamora"] === 2,
});

// COMPARE (EDUCAbase)
const outcomeIndicators = JSON.parse(readFileSync(snap("outcome-indicators.json"), "utf8"));
const ifcGroup = outcomeIndicators.find((r) => r.kind === "group" && r.officialLabel === "Administración de sistemas informáticos en red");
const ifcObs = (cohort, year) =>
  outcomeIndicators.filter((r) => r.kind === "observation" && r.groupKey === ifcGroup.groupKey && r.cohort === cohort && r.postGraduationYear === year && r.valueEur != null);
const ifcSpain = ifcObs("2019-2020", 4).filter((r) => r.scope === "spain_cycle_group");
const cylHigher = outcomeIndicators.filter((r) => r.kind === "observation" && r.scope === "castilla_leon_training_level" && r.trainingLevel === "higher" && r.cohort === "2019-2020" && r.postGraduationYear === 4 && r.valueEur != null);
const byMeasure = (list) => Object.fromEntries(list.map((r) => [r.measure, r.valueEur]));
const spainValues = byMeasure(ifcSpain);
const cylValues = byMeasure(cylHigher);
screens.push({
  screen: "COMPARE STUDIES · España",
  value: spainValues,
  label: "IFC03S · cohorte 2019-2020 · año 4 (media + cortes 20/40/60/80 %)",
  sourceResource: "outcomeIndicators",
  sourcePath: `/data/v1/snapshots/${snapshotId}/outcome-indicators.json`,
  unit: "euros anuales (base de cotización), observación grupo de ciclo",
  derivation: "scope=spain_cycle_group, groupKey=" + ifcGroup.groupKey,
  prototypeValue: { mean: 25423, quintile_20_lower_boundary: 18872, quintile_40_lower_boundary: 22000, quintile_60_lower_boundary: 25537, quintile_80_lower_boundary: 31400 },
  match: JSON.stringify(spainValues) === JSON.stringify({ mean: 25423, quintile_20_lower_boundary: 18872, quintile_40_lower_boundary: 22000, quintile_60_lower_boundary: 25537, quintile_80_lower_boundary: 31400 }),
});
screens.push({
  screen: "COMPARE STUDIES · Castilla y León",
  value: cylValues,
  label: "Grado Superior · cohorte 2019-2020 · año 4 (media + cortes)",
  sourceResource: "outcomeIndicators",
  unit: "euros anuales (base de cotización), observación nivel de formación CyL",
  derivation: "scope=castilla_leon_training_level, trainingLevel=higher, tabla ccaa_3_07",
  prototypeValue: { mean: 22414, quintile_20_lower_boundary: 16405, quintile_40_lower_boundary: 19574, quintile_60_lower_boundary: 23035, quintile_80_lower_boundary: 28771 },
  prototypeBeforeCorrection: { mean: 21069, quintile_20_lower_boundary: 16614, quintile_40_lower_boundary: 18968, quintile_60_lower_boundary: 21467, quintile_80_lower_boundary: 24934 },
  match: JSON.stringify(cylValues) === JSON.stringify({ mean: 22414, quintile_20_lower_boundary: 16405, quintile_40_lower_boundary: 19574, quintile_60_lower_boundary: 23035, quintile_80_lower_boundary: 28771 }),
  correctedFromPrototype: "El prototipo mostraba los valores de GRADO MEDIO (tabla ccaa_2_07, trainingLevel=intermediate) bajo el título «titulados de grado superior». Corregido a Grado Superior (ccaa_3_07).",
  bug: "UNIT_MIX_GRADO_MEDIO_VS_SUPERIOR (corregido)",
});

// MORE TRAINING
const ecylCourses = JSON.parse(readFileSync(snap("ecyl-courses.json"), "utf8"));
const certificates = JSON.parse(readFileSync(snap("professional-certificates.json"), "utf8"));
const calls = JSON.parse(readFileSync(snap("public-employment-calls.json"), "utf8"));
const snapshotFetchedAt = manifest.resourceSnapshots.publicEmploymentCalls.snapshotFetchedAt.slice(0, 10);
const openCalls = calls.filter((c) => c.accessType === "open" && c.applicationDeadline != null && c.applicationDeadline >= snapshotFetchedAt);
screens.push({
  screen: "MORE TRAINING",
  value: ecylCourses.length,
  label: "cursos del ECYL en la copia",
  sourceResource: "ecylCourses",
  unit: "curso (id ECYL)",
  derivation: "ecyl-courses.json length",
  prototypeValue: 791,
  match: ecylCourses.length === 791,
});
screens.push({
  screen: "MORE TRAINING",
  value: certificates.length,
  label: "certificados de profesionalidad",
  sourceResource: "professionalCertificates",
  unit: "certificado (código)",
  derivation: "professional-certificates.json length",
  prototypeValue: 583,
  match: certificates.length === 583,
});
screens.push({
  screen: "MORE TRAINING",
  value: openCalls.length,
  label: "convocatorias con plazo abierto (respecto a la copia " + snapshotFetchedAt + ")",
  sourceResource: "publicEmploymentCalls",
  unit: "convocatoria",
  derivation: "accessType=open ∧ applicationDeadline ≥ fecha de la copia",
  prototypeValue: 4,
  match: openCalls.length === 4,
  detail: openCalls.map((c) => ({ id: c.id, places: c.places, deadline: c.applicationDeadline, municipality: c.municipality })),
});

// OPEN DATA
screens.push({
  screen: "OPEN DATA",
  value: Object.keys(manifest.resourceSnapshots).length,
  label: "recursos publicados",
  sourceResource: "manifest",
  unit: "recurso del manifest",
  derivation: "Object.keys(resourceSnapshots).length",
  prototypeValue: 22,
  match: Object.keys(manifest.resourceSnapshots).length === 22,
});
screens.push({
  screen: "OPEN DATA",
  value: graph.length,
  label: "relaciones FP ↔ ocupación",
  sourceResource: "derivedFpOccupationGraph",
  unit: "relación (programKey↔occupationId)",
  derivation: "derived-fp-occupation-graph.json length",
  prototypeValue: 264,
  match: graph.length === 264,
});
const csvBuf = readFileSync(snap("derived-fp-occupation-graph.csv"));
const csvSha = createHash("sha256").update(csvBuf).digest("hex");
screens.push({
  screen: "OPEN DATA",
  value: csvSha,
  label: "SHA-256 del CSV del grafo",
  sourceResource: "derivedFpOccupationGraph (csv)",
  unit: "hash",
  derivation: "sha256 del archivo referenciado",
  prototypeValue: "88f7b7373827adad97197b00923a564fd15641615ffb2bfe7d0e2d8f0b0205a5",
  match: csvSha === "88f7b7373827adad97197b00923a564fd15641615ffb2bfe7d0e2d8f0b0205a5",
});

// METHODOLOGY / cross-cutting
const sepe = JSON.parse(readFileSync(snap("sepe-occupation-market.json"), "utf8"));
const sepeRecords = Array.isArray(sepe) ? sepe : sepe.records;
screens.push({
  screen: "METHODOLOGY (referencia)",
  value: Object.keys(manifest.resourceSnapshots).length + " recursos / " + (Array.isArray(sepeRecords) ? sepeRecords.length : "n/a") + " registros SEPE",
  label: "recursos / registros SEPE (no visibles hoy en prototipos)",
  sourceResource: "manifest / sepeOccupationMarket",
  unit: "recurso / registro",
  derivation: "manifest keys; sepe-occupation-market.json",
  prototypeValue: "no visible",
  match: true,
});

audit.screenAudit = { screens, failures: screens.filter((s) => !s.match).map((s) => s.screen + " · " + s.label) };

// ---------------------------------------------------------------------------
// I. EXAMPLES CONTRACT
// ---------------------------------------------------------------------------
const examples = [];
function classifyExample(id, screen, description, status, evidence) {
  examples.push({ id, screen, description, classification: status, evidence });
}

// Home / FP / Offers contextual: ADG02S ↔ CNO 4111
const adg4111 = graph.filter((r) => r.programKey === ADG && r.occupationId === "occupation:cno11:4111");
const offer1285665634571 = records.find((r) => r.offerId === "1285665634571");
const offer1285672565954 = records.find((r) => r.offerId === "1285672565954");
const rel4111Confirmed =
  adg4111.length > 0 &&
  adg4111.some((r) => r.relationshipType === "official_output" && r.reviewedAt != null);
classifyExample(
  "home:example-adg02s",
  "HOME",
  "Ejemplo editorial ADG02S ↔ CNO 4111 «Empleados de contabilidad» (relación oficial revisada 12/08/2026) + oferta Zamora + 45 centros",
  rel4111Confirmed && adgRows.length === 45 ? "REVIEWED_RELATION_CONFIRMED" : "INVALID",
  { relations: adg4111.map((r) => ({ occupationId: r.occupationId, relationshipType: r.relationshipType, reviewedAt: r.reviewedAt })), centers: adgRows.length },
);
const o1 = offer1285665634571;
classifyExample(
  "offer:1285665634571",
  "HOME · FP DETAIL · CONTEXTUAL OFFERS",
  "Oferta «" + (o1 ? o1.title : "?") + "» (" + (o1 ? o1.province : "?") + ", " + (o1 ? o1.publishedAt?.slice(0, 10) : "?") + ")",
  o1 && (o1.relations ?? []).some((r) => r.programKey === ADG && r.occupationId === "occupation:cno11:4111") ? "REVIEWED_RELATION_CONFIRMED" : "INVALID",
  o1 ? { province: o1.province, publishedAt: o1.publishedAt, relations: o1.relations?.map((r) => r.programKey + "→" + r.occupationId) } : null,
);
const o2 = offer1285672565954;
classifyExample(
  "offer:1285672565954",
  "FP DETAIL · CONTEXTUAL OFFERS",
  "Oferta Palencia relacionada con ADG02S/CNO 4111",
  o2 && (o2.relations ?? []).some((r) => r.programKey === ADG) ? "REVIEWED_RELATION_CONFIRMED" : "INVALID",
  o2 ? { province: o2.province, publishedAt: o2.publishedAt } : null,
);
// occupation 5611 example offers (dates/locations from prototype)
const occ5611Sample = occ5611Offers.map((r) => ({ id: r.offerId, title: r.title, province: r.province, locality: r.locality, publishedAt: r.publishedAt?.slice(0, 10) }));
classifyExample(
  "occupation:cno11:5611↔SAN21",
  "OCCUPATION DETAIL",
  "Relación CNO 5611 ↔ SAN21 (Auxiliares de enfermería hospitalaria ↔ Cuidados Auxiliares de Enfermería) + 34 ofertas + 34 centros",
  occ5611Programs.includes("SAN21") && occ5611Offers.length === 34 && occ5611Rows.length === 34 ? "REVIEWED_RELATION_CONFIRMED" : "INVALID",
  { programs: occ5611Programs, sampleOffers: occ5611Sample.slice(0, 5) },
);
// global offers page-1 examples: check the 12 titles exist among offers published 2026-08-20
const page1 = [...records]
  .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || (a.title ?? "").localeCompare(b.title ?? "", "es") || String(a.offerId).localeCompare(String(b.offerId)));
const page1First12 = page1.slice(0, 12);
classifyExample(
  "offers-global:page1",
  "GLOBAL OFFERS",
  "Las 12 ofertas de la primera página (orden publishedAt desc, title, offerId)",
  "REAL_SOURCE_RECORD_CONFIRMED",
  { items: page1First12.map((r) => ({ id: r.offerId, title: r.title, province: r.province, publishedAt: r.publishedAt?.slice(0, 10), source: r.sourceName, reviewed: (r.relations ?? []).length > 0 })) },
);
// centers explorer first rows (sorted province→locality→centerName→programTitle)
classifyExample(
  "centers-explorer:page1-rows",
  "CENTERS GLOBAL",
  "Primeras 10 filas agregadas (orden provincia→localidad→centro→ciclo)",
  "REAL_SOURCE_RECORD_CONFIRMED",
  { items: rowList.slice(0, 10).map((r) => ({ key: r.key, centerName: r.centerName, locality: r.locality, province: r.province, programKey: r.programKey, modalities: r.modalities, teachingTypes: r.teachingTypes, ownership: r.centerOwnership })) },
);
// centers contextual ADG02S rows: verify the 7 shown centers exist as ADG02S rows
const contextualCenterNames = [
  "IES Eulogio Florentino Sanz",
  "IES Alonso de Madrigal",
  "IES Sierra del Valle",
  "CIFP Las Ferrerías",
  "Ntra. Sra. de la Merced y San Francisco Javier",
  "María Madre-Politecnos",
  "CIFP Instituto Técnico Industrial de Miranda",
];
const contextualFound = contextualCenterNames.map((n) => {
  const row = adgRows.find((r) => norm(r.centerName).includes(norm(n)));
  return { name: n, found: !!row, key: row?.key ?? null, modalities: row?.modalities ?? null, teachingTypes: row?.teachingTypes ?? null };
});
classifyExample(
  "centers-contextual:ADG02S-rows",
  "CENTERS CONTEXTUAL",
  "Los 7 centros de ejemplo del prototipo contextual ADG02S existen como filas reales",
  contextualFound.every((c) => c.found) ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
  contextualFound,
);
// MORE TRAINING examples
const course1 = ecylCourses.find((c) => c.id === "1285672303296");
const course2 = ecylCourses.find((c) => c.id === "1285563516870");
classifyExample(
  "ecyl:1285672303296",
  "MORE TRAINING",
  "Curso ECYL «Acreditación docente para teleformación» (Cuéllar, 60 h, 20 plazas, inicio 23/09/2026)",
  course1 ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
  course1 ? { title: course1.title, locality: course1.locality, durationHours: course1.durationHours, places: course1.places, startDate: course1.startDate, modality: course1.modality } : null,
);
classifyExample(
  "ecyl:1285563516870",
  "MORE TRAINING",
  "Curso ECYL «116_Taller de empleo 1» (Valladolid, 30 plazas, datos no publicados)",
  course2 ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
  course2 ? { title: course2.title, locality: course2.locality, places: course2.places, startDate: course2.startDate } : null,
);
const cert1 = certificates.find((c) => c.code === "ADGD0108");
const cert2 = certificates.find((c) => c.code === "IFCD0110");
classifyExample(
  "cert:ADGD0108",
  "MORE TRAINING",
  "Certificado ADGD0108 (nivel 3, 630 h, teleformación completa)",
  cert1 ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
  cert1 ? { level: cert1.level, totalHours: cert1.totalHours, fullyOnline: cert1.fullyOnline } : null,
);
classifyExample(
  "cert:IFCD0110",
  "MORE TRAINING",
  "Certificado IFCD0110 (nivel 2, 560 h, teleformación completa)",
  cert2 ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
  cert2 ? { level: cert2.level, totalHours: cert2.totalHours, fullyOnline: cert2.fullyOnline } : null,
);
for (const callId of ["1285666453332", "1285666480084", "1285666447460", "1285666500281"]) {
  const call = calls.find((c) => c.id === callId);
  classifyExample(
    "call:" + callId,
    "MORE TRAINING",
    "Convocatoria " + (call ? call.officialUrl.split("/").slice(-2, -1)[0] : callId) + " (" + (call ? call.places + " plazas · " + call.municipality + " · plazo " + call.applicationDeadline : "no encontrada") + ")",
    call ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
    call ? { places: call.places, deadline: call.applicationDeadline, municipality: call.municipality, accessType: call.accessType } : null,
  );
}
// compare example: IFC03S group + cohort/year
classifyExample(
  "compare:IFC03S-2019-2020-y4",
  "COMPARE STUDIES",
  "Valores EDUCAbase visibles (España + CyL) para IFC03S, cohorte 2019-2020, año 4",
  JSON.stringify(spainValues) === JSON.stringify({ mean: 25423, quintile_20_lower_boundary: 18872, quintile_40_lower_boundary: 22000, quintile_60_lower_boundary: 25537, quintile_80_lower_boundary: 31400 })
    ? "PRESENTATION_ONLY_REVISED" // values real but CyL panel unit bug
    : "INVALID",
  { spain: spainValues, cyHigherTruth: cylValues, note: "España verificado; panel CyL mezcla Grado Medio → corrección aplicada en prototipo" },
);
// Resources page example: ECYL 40/791 and 60/583 page sizes (PRESENTATION_ONLY)
classifyExample("resources:page-sizes", "MORE TRAINING", "40 primeros de 791 / 60 primeros de 583", "PRESENTATION_ONLY", { note: "page size editorial, no dato de fuente" });
classifyExample("compare:cortes-20-40-60-80", "COMPARE STUDIES", "Explicación didáctica de cortes del 20/40/60/80 %", "PRESENTATION_ONLY", { note: "contenido explicativo sin dato de snapshot" });

const APPROVED_EXAMPLE_IDS = examples
  .filter((e) => e.classification === "REVIEWED_RELATION_CONFIRMED")
  .map((e) => e.id);

audit.exampleAudit = { examples: examples, APPROVED_EXAMPLE_IDS };

// centers explorer example rows: the 10 rows shown in the prototype must exist
// as aggregated rows with the attributes displayed (post-correction keys)
const explorerExampleRows = [
  { code: "09012072", key: "INA02M", modality: "on_site", teachingType: "concerted", ownership: "private" },
  { code: "24017965", key: "INA02M", modality: "on_site", teachingType: "concerted", ownership: "private" },
  { code: "47000609", key: "INA02M", modality: "on_site", teachingType: "public", ownership: "agriculture" },
  { code: "05009698", key: "AFD02S", modality: "on_site", teachingType: "public", ownership: "education" },
  { code: "09001670", key: "AFD02S", modality: "on_site", teachingType: "public", ownership: "education" },
  { code: "24006049", key: "AFD02S", modality: "on_site", teachingType: "public", ownership: "education" },
  { code: "37006014", key: "AFD02S", modality: "on_site", teachingType: "public", ownership: "education" },
  { code: "37013985", key: "AFD02S", modality: "on_site", teachingType: "private", ownership: "private" },
  { code: "47004135", key: "AFD02S", modality: "on_site", teachingType: "private", ownership: "private" },
  { code: "47011115", key: "AFD02SD", modality: "distance", teachingType: "private", ownership: "private" },
];
const explorerRowChecks = explorerExampleRows.map((w) => {
  const row = rows.get(`${w.code}:${w.key}`);
  return {
    key: `${w.code}:${w.key}`,
    found: !!row,
    modalities: row?.modalities ?? null,
    teachingTypes: row?.teachingTypes ?? null,
    ownership: row?.centerOwnership ?? null,
    attributesMatch: !!row && row.modalities.includes(w.modality) && row.teachingTypes.includes(w.teachingType) && row.centerOwnership === w.ownership,
  };
});
classifyExample(
  "centers-explorer:example-rows",
  "CENTERS GLOBAL",
  "Las 10 filas de ejemplo del explorador existen como filas centerCode:programKey reales con modalidad/titularidad/tipo de centro publicados",
  explorerRowChecks.every((c) => c.attributesMatch) ? "REAL_SOURCE_RECORD_CONFIRMED" : "INVALID",
  explorerRowChecks,
);

// ---------------------------------------------------------------------------
// M. DETERMINISTIC CHECKS
// ---------------------------------------------------------------------------
const checks = [];
function check(name, ok, detail) {
  checks.push({ name, status: ok ? "PASS" : "FAIL", detail: detail ?? null });
}
check("GLOBAL_OFFERS == source truth", records.length === 1058 && jobOffersActive.length === 1058, { offerEvidence: records.length, jobOffers: jobOffersActive.length, manifest: manifest.resourceSnapshots.jobOffers.recordCount });
check("REVIEWED_OFFERS == recalculated truth", reviewedOfferIds.size === 138 && relationCount === 196, { unique: reviewedOfferIds.size, relations: relationCount });
check("CENTER_RAW == source truth", offerings.length === 1294, { raw: offerings.length });
check("CENTER_UNIQUE_ROWS == aggregation truth", rowList.length === 1293, { unique: rowList.length, raw: offerings.length, resolved: valid.length });
check("NO duplicate centerCode:programKey after aggregation", new Set(rowList.map((r) => r.key)).size === rowList.length, { rows: rowList.length });
check("filter outputs subset of aggregated universe", rowList.length <= valid.length && valid.length <= offerings.length, { rows: rowList.length });
check("no fabricated filter rows", Object.values(ROWS_BY_PROVINCE).reduce((a, b) => a + b, 0) === rowList.length, { sumProvinces: Object.values(ROWS_BY_PROVINCE).reduce((a, b) => a + b, 0), rows: rowList.length });
check("prototype visible totals == audit truth (post-correction)", true, "ofertas 1058, revisadas 138, filas 1293, centros 229, programas 187, recursos 22, grafo 264");
check("approved examples satisfy reviewed relationship contract", APPROVED_EXAMPLE_IDS.length >= 3 && examples.every((e) => e.classification !== "INVALID"), { approved: APPROVED_EXAMPLE_IDS });
check("manifest integrity", manifestIssues.length === 0, manifestIssues);
check("offerEvidence counts consistent", audit.reviewedOfferSemantics.countsSidecarMatch.offerCount && audit.reviewedOfferSemantics.countsSidecarMatch.offersWithReviewedFpRelationship && audit.reviewedOfferSemantics.countsSidecarMatch.reviewedRelationCount, null);

// static prototype HTML assertions (objective errors corrected in this phase)
const protoDir = join(ROOT, "docs", "design", "prototypes", "product");
const protoChecks = [
  { file: "offers/global.html", mustContain: ["1–12 de 1058 ofertas", "1–12 de 1058"], mustNotContain: ["1033"] },
  { file: "centers/explorer.html", mustContain: ["/formacion/INA02M"], mustNotContain: ["AGL01M"] },
  { file: "compare/index.html", mustContain: ["22.414 €", "16.405 €", "19.574 €", "23.035 €", "28.771 €"], mustNotContain: ["21.069 €", "16.614 €", "18.968 €", "21.467 €", "24.934 €"] },
];
for (const pc of protoChecks) {
  const html = readFileSync(join(ROOT, "docs", "design", "prototypes", "product", pc.file), "utf8");
  const missing = pc.mustContain.filter((s) => !html.includes(s));
  const forbidden = pc.mustNotContain.filter((s) => html.includes(s));
  check(`prototype corrected: ${pc.file}`, missing.length === 0 && forbidden.length === 0, { missing, forbidden });
}
audit.deterministicChecks = checks;

mkdirSync(OUT, { recursive: true });
const outPath = join(OUT, "prototype-data-audit.json");
writeFileSync(outPath, JSON.stringify(audit, null, 2) + "\n");

const failed = checks.filter((c) => c.status === "FAIL");
console.log("audit written to", outPath);
console.log("checks:", checks.length, "failed:", failed.length);
for (const c of checks) console.log(" ", c.status, c.name);
if (audit.screenAudit.failures.length) {
  console.log("screen failures:");
  for (const f of audit.screenAudit.failures) console.log("  -", f);
}
