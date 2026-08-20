import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { format as formatWithPrettier } from "prettier";
import { z } from "zod";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
} from "../../data/schemas/curatedMappings";
import {
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA,
  FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
} from "../../data/schemas/fpOneWordPublicationReview";
import {
  JobOfferSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import {
  matchOffersForProgram,
  type OfferMatchingData,
} from "../../src/domain/offerMatching";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";

export const EVALUATION_SCHEMA_VERSION = "1.0.0" as const;
export const EVALUATION_DIRECTORY = "analysis/matching-evaluation";
export const LABELS_ARTIFACT_PATH = EVALUATION_DIRECTORY + "/labels.json";
export const RESULTS_ARTIFACT_PATH = EVALUATION_DIRECTORY + "/results.json";
export const REPORT_ARTIFACT_PATH = EVALUATION_DIRECTORY + "/report.md";

export const TRUTH_ARTIFACT_SHA256 =
  "d7fce4553804dfcd87ba2039c170f399746cc3b67a084791f59f67f5f00cfdf1";
export const CURRENT_ALIASES_PATH = "data/curated/occupation-aliases.json";
export const CURRENT_ALIASES_SHA256 =
  "fbd4ca379e14c5152ee1620de5b4176d8102fc554c4e31139a98550d8855dd68";
export const SNAPSHOT_OFFERS_SHA256 =
  "5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const SnapshotContractSchema = z
  .object({
    snapshotId: z.literal(FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.snapshotId),
    resourcePath: z.literal(
      FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.resourcePath,
    ),
    sha256: z.literal(FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.sha256),
    recordCount: z.literal(FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.recordCount),
  })
  .strict();

const FormTruthSummarySchema = z
  .object({
    form: z.string().min(1),
    programKey: z.string().min(1),
    rowCount: z.number().int().nonnegative(),
    acceptedCount: z.number().int().nonnegative(),
    rejectedCount: z.number().int().nonnegative(),
  })
  .strict();

const EvaluationLabelsSchema = z
  .object({
    schemaVersion: z.literal(EVALUATION_SCHEMA_VERSION),
    sourceArtifactPath: z.literal(FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH),
    sourceArtifactSha256: z.literal(TRUTH_ARTIFACT_SHA256),
    snapshot: SnapshotContractSchema,
    review: FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA,
  })
  .strict();

const FormMetricSchema = z
  .object({
    form: z.string().min(1),
    programKey: z.string().min(1),
    predictedCount: z.number().int().nonnegative(),
    labeledPredictionCount: z.number().int().nonnegative(),
    unlabeledPredictionCount: z.number().int().nonnegative(),
    truePositiveCount: z.number().int().nonnegative(),
    falsePositiveCount: z.number().int().nonnegative(),
    precision: z.number().min(0).max(1).nullable(),
    knownPositiveCount: z.number().int().nonnegative(),
    coveredKnownPositiveCount: z.number().int().nonnegative(),
    knownPositiveCoverage: z.number().min(0).max(1).nullable(),
  })
  .strict();

const PredictionsByFormSchema = z
  .object({
    form: z.string().min(1),
    programKey: z.string().min(1),
    offerIds: z.array(z.string().min(1)),
  })
  .strict();

const LaneMetricShape = {
  predictedCount: z.number().int().nonnegative(),
  labeledPredictionCount: z.number().int().nonnegative(),
  unlabeledPredictionCount: z.number().int().nonnegative(),
  truePositiveCount: z.number().int().nonnegative(),
  falsePositiveCount: z.number().int().nonnegative(),
  precision: z.number().min(0).max(1).nullable(),
  knownPositiveCount: z.number().int().nonnegative(),
  coveredKnownPositiveCount: z.number().int().nonnegative(),
  knownPositiveCoverage: z.number().min(0).max(1).nullable(),
  byForm: z.array(FormMetricSchema),
  predictionsByForm: z.array(PredictionsByFormSchema),
} as const;

const ShadowLaneSchema = z
  .object({
    lane: z.literal("shadow_lexical"),
    ...LaneMetricShape,
  })
  .strict();

const PublishedBaselineMatchSchema = z
  .object({
    programKey: z.string().min(1),
    offerId: z.string().min(1),
    offerTitle: z.string().min(1),
    matchRule: z.enum([
      "title_alias_exact",
      "title_alias_phrase",
      "published_qualification_exact",
      "human_override",
    ]),
  })
  .strict();

const PublishedBaselineLaneSchema = z
  .object({
    lane: z.literal("published_baseline"),
    ...LaneMetricShape,
    matches: z.array(PublishedBaselineMatchSchema),
  })
  .strict();

const EvaluationResultsSchema = z
  .object({
    schemaVersion: z.literal(EVALUATION_SCHEMA_VERSION),
    snapshot: SnapshotContractSchema,
    truthArtifactSha256: z.literal(TRUTH_ARTIFACT_SHA256),
    currentAliases: z
      .object({
        path: z.literal(CURRENT_ALIASES_PATH),
        sha256: z.literal(CURRENT_ALIASES_SHA256),
        recordCount: z.number().int().nonnegative(),
      })
      .strict(),
    labeledTruth: z
      .object({
        rowCount: z.number().int().nonnegative(),
        acceptedCount: z.number().int().nonnegative(),
        rejectedCount: z.number().int().nonnegative(),
        forms: z.array(FormTruthSummarySchema),
      })
      .strict(),
    closedSet: z
      .object({
        labelPairCount: z.number().int().nonnegative(),
        shadowPredictionPairCount: z.number().int().nonnegative(),
        shadowUnlabeledPredictionCount: z.number().int().nonnegative(),
        shadowUnpredictedLabelCount: z.number().int().nonnegative(),
      })
      .strict(),
    shadow: ShadowLaneSchema,
    publishedBaseline: PublishedBaselineLaneSchema,
    limitations: z.array(z.string().min(5)).min(1),
  })
  .strict();

export type EvaluationLabels = z.infer<typeof EvaluationLabelsSchema>;
export type EvaluationResults = z.infer<typeof EvaluationResultsSchema>;

type ReviewRow = EvaluationLabels["review"]["rows"][number];
type JobOffer = z.infer<typeof JobOfferSchema>;
type Prediction = {
  form: string;
  programKey: string;
  offerId: string;
};
type LaneMetric = Omit<EvaluationResults["shadow"], "lane"> & {
  lane: "shadow_lexical" | "published_baseline";
};

function assertCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

function sha256Bytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJsonWithHash<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<{ data: T; sha256: string }> {
  const bytes = await readFile(path);
  const json = JSON.parse(bytes.toString("utf8")) as unknown;
  return { data: schema.parse(json), sha256: sha256Bytes(bytes) };
}

function snapshotFile(root: string, fileName: string): string {
  return join(
    root,
    "public",
    "data",
    "v1",
    "snapshots",
    FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.snapshotId,
    fileName,
  );
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareStable);
}

function pairKey(form: string, offerId: string): string {
  return form + "\u0000" + offerId;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

export function containsBoundedPhrase(text: string, phrase: string): boolean {
  const normalizedTextValue = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);
  return (
    normalizedPhrase.length > 0 &&
    (" " + normalizedTextValue + " ").includes(" " + normalizedPhrase + " ")
  );
}

function formProgramMap(rows: readonly ReviewRow[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const row of rows) {
    const previous = result.get(row.form);
    if (previous !== undefined && previous !== row.programKey) {
      throw new Error(
        "A reviewed form maps to more than one program: " + row.form,
      );
    }
    result.set(row.form, row.programKey);
  }
  return result;
}

function formTruthSummaries(
  rows: readonly ReviewRow[],
  formToProgram: ReadonlyMap<string, string>,
): EvaluationResults["labeledTruth"]["forms"] {
  return uniqueSorted([...formToProgram.keys()]).map((form) => {
    const formRows = rows.filter((row) => row.form === form);
    return {
      form,
      programKey: formToProgram.get(form) as string,
      rowCount: formRows.length,
      acceptedCount: formRows.filter((row) => row.disposition === "accepted")
        .length,
      rejectedCount: formRows.filter((row) => row.disposition === "rejected")
        .length,
    };
  });
}

function assertUniquePredictions(predictions: readonly Prediction[]): void {
  const seen = new Set<string>();
  for (const prediction of predictions) {
    const key = pairKey(prediction.form, prediction.offerId);
    assertCondition(!seen.has(key), "Duplicate evaluation prediction: " + key);
    seen.add(key);
  }
}

function metricForRows(
  rows: readonly ReviewRow[],
  predictions: readonly Prediction[],
  formToProgram: ReadonlyMap<string, string>,
  lane: "shadow_lexical" | "published_baseline",
): LaneMetric {
  assertUniquePredictions(predictions);
  const rowsByPair = new Map(
    rows.map((row) => [pairKey(row.form, row.offerId), row]),
  );
  const predictedKeys = new Set(
    predictions.map((prediction) =>
      pairKey(prediction.form, prediction.offerId),
    ),
  );
  const labeledPredictions = predictions
    .map((prediction) =>
      rowsByPair.get(pairKey(prediction.form, prediction.offerId)),
    )
    .filter((row): row is ReviewRow => row !== undefined);
  const truePositiveCount = labeledPredictions.filter(
    (row) => row.disposition === "accepted",
  ).length;
  const falsePositiveCount = labeledPredictions.filter(
    (row) => row.disposition === "rejected",
  ).length;
  const knownPositiveRows = rows.filter(
    (row) => row.disposition === "accepted",
  );
  const coveredKnownPositiveCount = knownPositiveRows.filter((row) =>
    predictedKeys.has(pairKey(row.form, row.offerId)),
  ).length;
  const forms = uniqueSorted([
    ...formToProgram.keys(),
    ...predictions.map((prediction) => prediction.form),
  ]);
  const byForm = forms.map((form) => {
    const formPredictions = predictions.filter(
      (prediction) => prediction.form === form,
    );
    const formLabeled = formPredictions
      .map((prediction) => rowsByPair.get(pairKey(form, prediction.offerId)))
      .filter((row): row is ReviewRow => row !== undefined);
    const formKnownPositiveRows = rows.filter(
      (row) => row.form === form && row.disposition === "accepted",
    );
    const formCoveredKnownPositiveCount = formKnownPositiveRows.filter((row) =>
      predictedKeys.has(pairKey(row.form, row.offerId)),
    ).length;
    return {
      form,
      programKey:
        formToProgram.get(form) ?? formPredictions[0]?.programKey ?? "",
      predictedCount: formPredictions.length,
      labeledPredictionCount: formLabeled.length,
      unlabeledPredictionCount: formPredictions.length - formLabeled.length,
      truePositiveCount: formLabeled.filter(
        (row) => row.disposition === "accepted",
      ).length,
      falsePositiveCount: formLabeled.filter(
        (row) => row.disposition === "rejected",
      ).length,
      precision:
        formLabeled.length === 0
          ? null
          : formLabeled.filter((row) => row.disposition === "accepted").length /
            formLabeled.length,
      knownPositiveCount: formKnownPositiveRows.length,
      coveredKnownPositiveCount: formCoveredKnownPositiveCount,
      knownPositiveCoverage:
        formKnownPositiveRows.length === 0
          ? null
          : formCoveredKnownPositiveCount / formKnownPositiveRows.length,
    };
  });
  const predictionsByForm = forms.map((form) => ({
    form,
    programKey:
      formToProgram.get(form) ??
      predictions.find((prediction) => prediction.form === form)?.programKey ??
      "",
    offerIds: predictions
      .filter((prediction) => prediction.form === form)
      .map((prediction) => prediction.offerId)
      .sort(compareStable),
  }));
  return {
    lane,
    predictedCount: predictions.length,
    labeledPredictionCount: labeledPredictions.length,
    unlabeledPredictionCount: predictions.length - labeledPredictions.length,
    truePositiveCount,
    falsePositiveCount,
    precision:
      labeledPredictions.length === 0
        ? null
        : truePositiveCount / labeledPredictions.length,
    knownPositiveCount: knownPositiveRows.length,
    coveredKnownPositiveCount,
    knownPositiveCoverage:
      knownPositiveRows.length === 0
        ? null
        : coveredKnownPositiveCount / knownPositiveRows.length,
    byForm,
    predictionsByForm,
  };
}

function shadowPredictions(
  rows: readonly ReviewRow[],
  offers: readonly JobOffer[],
  formToProgram: ReadonlyMap<string, string>,
): Prediction[] {
  const predictions: Prediction[] = [];
  for (const form of uniqueSorted([...formToProgram.keys()])) {
    for (const offer of offers) {
      if (containsBoundedPhrase(offer.title, form)) {
        predictions.push({
          form,
          programKey: formToProgram.get(form) as string,
          offerId: offer.id,
        });
      }
    }
  }
  return predictions.sort(
    (left, right) =>
      compareStable(left.form, right.form) ||
      compareStable(left.offerId, right.offerId),
  );
}

function baselinePredictions(
  rows: readonly ReviewRow[],
  matches: readonly EvaluationResults["publishedBaseline"]["matches"][number][],
): Prediction[] {
  const predictions = matches.map((match) => {
    const labeledForms = uniqueSorted(
      rows
        .filter(
          (row) =>
            row.programKey === match.programKey &&
            row.offerId === match.offerId,
        )
        .map((row) => row.form),
    );
    return {
      form: labeledForms[0] ?? "program:" + match.programKey,
      programKey: match.programKey,
      offerId: match.offerId,
    };
  });
  return predictions.sort(
    (left, right) =>
      compareStable(left.form, right.form) ||
      compareStable(left.offerId, right.offerId),
  );
}

function buildLabels(review: EvaluationLabels["review"]): EvaluationLabels {
  return EvaluationLabelsSchema.parse({
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    sourceArtifactPath: FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
    sourceArtifactSha256: TRUTH_ARTIFACT_SHA256,
    snapshot: FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
    review,
  });
}

async function loadEvaluationInputs(root: string) {
  const truth = await readJsonWithHash(
    resolve(root, FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH),
    FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA,
  );
  assertCondition(
    truth.sha256 === TRUTH_ARTIFACT_SHA256,
    "The existing labeled truth artifact changed: " + truth.sha256,
  );
  const labels = buildLabels(truth.data);
  const programs = (
    await readJsonWithHash(
      snapshotFile(root, "programs.json"),
      z.array(TrainingProgramSchema),
    )
  ).data;
  const occupations = (
    await readJsonWithHash(
      snapshotFile(root, "occupations.json"),
      OccupationsSchema,
    )
  ).data;
  const links = (
    await readJsonWithHash(
      snapshotFile(root, "training-occupation-links.json"),
      TrainingOccupationLinksSchema,
    )
  ).data;
  const offersResult = await readJsonWithHash(
    snapshotFile(root, "job-offers.json"),
    z.array(JobOfferSchema),
  );
  assertCondition(
    offersResult.sha256 === SNAPSHOT_OFFERS_SHA256,
    "The pinned offer snapshot changed: " + offersResult.sha256,
  );
  assertCondition(
    offersResult.data.length ===
      FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.recordCount,
    "The pinned offer snapshot record count changed.",
  );
  const requirements = (
    await readJsonWithHash(
      snapshotFile(root, "published-requirements.json"),
      PublishedRequirementsResourceSchema,
    )
  ).data;
  const aliasesResult = await readJsonWithHash(
    resolve(root, CURRENT_ALIASES_PATH),
    OccupationAliasesSchema,
  );
  assertCondition(
    aliasesResult.sha256 === CURRENT_ALIASES_SHA256,
    "The current curated aliases artifact changed: " + aliasesResult.sha256,
  );
  return {
    labels,
    programs,
    occupations,
    links,
    offers: offersResult.data,
    requirements,
    aliases: aliasesResult.data,
    aliasesSha256: aliasesResult.sha256,
  };
}

function buildBaselineMatches(
  inputs: Awaited<ReturnType<typeof loadEvaluationInputs>>,
): EvaluationResults["publishedBaseline"]["matches"] {
  const targetProgramKeys = uniqueSorted(
    inputs.labels.review.rows.map((row) => row.programKey),
  );
  const programKeys = new Set(
    inputs.programs.map((program) => program.programKey),
  );
  const programQualificationLinks = REVIEWED_PROGRAM_QUALIFICATION_LINKS.filter(
    (link) => programKeys.has(link.programKey),
  );
  const data: OfferMatchingData = {
    programs: inputs.programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks,
    occupations: inputs.occupations,
    aliases: inputs.aliases,
    links: inputs.links,
    offers: inputs.offers,
    publishedRequirements: inputs.requirements,
    humanOverrides: [],
  };
  const offerTitles = new Map(
    inputs.offers.map((offer) => [offer.id, offer.title]),
  );
  return targetProgramKeys
    .flatMap((programKey) =>
      matchOffersForProgram(programKey, data).map((match) => ({
        programKey,
        offerId: match.offerId,
        offerTitle: offerTitles.get(match.offerId) as string,
        matchRule: match.matchRule,
      })),
    )
    .sort(
      (left, right) =>
        compareStable(left.programKey, right.programKey) ||
        compareStable(left.offerId, right.offerId),
    );
}

function buildResults(
  labels: EvaluationLabels,
  inputs: Awaited<ReturnType<typeof loadEvaluationInputs>>,
): EvaluationResults {
  const rows = labels.review.rows;
  const formToProgram = formProgramMap(rows);
  const shadowPredictionRows = shadowPredictions(
    rows,
    inputs.offers,
    formToProgram,
  );
  const baselineMatches = buildBaselineMatches(inputs);
  const baselinePredictionRows = baselinePredictions(rows, baselineMatches);
  const shadow = metricForRows(
    rows,
    shadowPredictionRows,
    formToProgram,
    "shadow_lexical",
  );
  const publishedBaseline = {
    ...metricForRows(
      rows,
      baselinePredictionRows,
      formToProgram,
      "published_baseline",
    ),
    matches: baselineMatches,
  };
  const acceptedCount = rows.filter(
    (row) => row.disposition === "accepted",
  ).length;
  const rejectedCount = rows.filter(
    (row) => row.disposition === "rejected",
  ).length;
  const results = EvaluationResultsSchema.parse({
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    snapshot: FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
    truthArtifactSha256: TRUTH_ARTIFACT_SHA256,
    currentAliases: {
      path: CURRENT_ALIASES_PATH,
      sha256: inputs.aliasesSha256,
      recordCount: inputs.aliases.length,
    },
    labeledTruth: {
      rowCount: rows.length,
      acceptedCount,
      rejectedCount,
      forms: formTruthSummaries(rows, formToProgram),
    },
    closedSet: {
      labelPairCount: rows.length,
      shadowPredictionPairCount: shadow.predictedCount,
      shadowUnlabeledPredictionCount: shadow.unlabeledPredictionCount,
      shadowUnpredictedLabelCount: rows.length - shadow.labeledPredictionCount,
    },
    shadow,
    publishedBaseline,
    limitations: [
      "La verdad etiquetada es el audit existente de ofertas candidatas; este benchmark no crea etiquetas nuevas.",
      "La cobertura positiva conocida usa como denominador los positivos del audit cerrado y no es recall del mercado ni cobertura de todas las ofertas de Castilla y León.",
      "La lane shadow aplica matching léxico a la instantánea histórica y no modifica aliases, datos publicados ni la lógica pública.",
      "La lane published_baseline reproduce el matcher publicado con aliases curados actuales sobre la instantánea histórica fijada.",
      "Los resultados dependen de los hashes de la verdad, aliases y snapshot declarados en este artefacto.",
    ],
  });
  return results;
}

export async function evaluateFpOfferMatching(
  root = PROJECT_ROOT,
): Promise<{ labels: EvaluationLabels; results: EvaluationResults }> {
  const inputs = await loadEvaluationInputs(root);
  const results = buildResults(inputs.labels, inputs);
  assertEvaluationContract(inputs.labels, results);
  return { labels: inputs.labels, results };
}

function percentage(value: number | null): string {
  return value === null ? "n/a" : (value * 100).toFixed(2) + "%";
}

export function renderEvaluationReport(
  labels: EvaluationLabels,
  results: EvaluationResults,
): string {
  const lines = [
    "# Evaluación etiquetada de matching FP ↔ ofertas",
    "",
    "Esta evaluación es un benchmark reproducible y cerrado para separar verdad etiquetada, métricas y limitaciones.",
    "",
    "## Verdad etiquetada",
    "",
    "- Fuente: " +
      labels.sourceArtifactPath +
      " (" +
      labels.sourceArtifactSha256 +
      ")",
    "- Snapshot de ofertas: " +
      labels.snapshot.snapshotId +
      " (" +
      labels.snapshot.recordCount +
      " registros; " +
      labels.snapshot.sha256 +
      ")",
    "- Filas auditadas: " +
      results.labeledTruth.rowCount +
      " (" +
      results.labeledTruth.acceptedCount +
      " accepted, " +
      results.labeledTruth.rejectedCount +
      " rejected)",
    "",
    "Las etiquetas se copian y validan desde el audit existente; no se inventan etiquetas en este benchmark.",
    "",
    "## Métricas",
    "",
    "| Lane | Predicciones | Dentro de verdad | TP | FP | Precisión sobre verdad | Positivos conocidos cubiertos | Cobertura positiva conocida |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    "| shadow_lexical | " +
      results.shadow.predictedCount +
      " | " +
      results.shadow.labeledPredictionCount +
      " | " +
      results.shadow.truePositiveCount +
      " | " +
      results.shadow.falsePositiveCount +
      " | " +
      percentage(results.shadow.precision) +
      " | " +
      results.shadow.coveredKnownPositiveCount +
      "/" +
      results.shadow.knownPositiveCount +
      " | " +
      percentage(results.shadow.knownPositiveCoverage) +
      " |",
    "| published_baseline | " +
      results.publishedBaseline.predictedCount +
      " | " +
      results.publishedBaseline.labeledPredictionCount +
      " | " +
      results.publishedBaseline.truePositiveCount +
      " | " +
      results.publishedBaseline.falsePositiveCount +
      " | " +
      percentage(results.publishedBaseline.precision) +
      " | " +
      results.publishedBaseline.coveredKnownPositiveCount +
      "/" +
      results.publishedBaseline.knownPositiveCount +
      " | " +
      percentage(results.publishedBaseline.knownPositiveCoverage) +
      " |",
    "",
    "La precisión usa como denominador las predicciones que caen dentro del conjunto etiquetado. Las predicciones fuera de ese conjunto quedan separadas como no etiquetadas y no se convierten en positivos o negativos inventados.",
    "",
    "La cobertura positiva conocida es " +
      percentage(results.shadow.knownPositiveCoverage) +
      " para shadow y " +
      percentage(results.publishedBaseline.knownPositiveCoverage) +
      " para published_baseline dentro de este audit dirigido. No es recall del mercado, no estima cobertura de todas las ofertas y no permite afirmar que el matcher encuentre todos los positivos reales.",
    "",
    "### Shadow por forma",
    "",
    "| Forma | Programa | Predicciones | TP | FP | Precisión | Positivos conocidos cubiertos | Cobertura positiva conocida |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const metric of results.shadow.byForm) {
    lines.push(
      "| " +
        metric.form +
        " | " +
        metric.programKey +
        " | " +
        metric.predictedCount +
        " | " +
        metric.truePositiveCount +
        " | " +
        metric.falsePositiveCount +
        " | " +
        percentage(metric.precision) +
        " | " +
        metric.coveredKnownPositiveCount +
        "/" +
        metric.knownPositiveCount +
        " | " +
        percentage(metric.knownPositiveCoverage) +
        " |",
    );
  }
  lines.push(
    "",
    "## Limitaciones",
    "",
    ...results.limitations.map((limitation) => "- " + limitation),
    "",
    "## Decisión",
    "",
    "El artefacto deja una línea shadow lexical medible y una reproducción del baseline publicado, pero no convierte la shadow en lógica pública. El benchmark no publica ni despliega datos.",
  );
  return lines.join("\n") + "\n";
}

export function assertEvaluationContract(
  labels: EvaluationLabels,
  results: EvaluationResults,
): void {
  EvaluationLabelsSchema.parse(labels);
  EvaluationResultsSchema.parse(results);
  assertCondition(
    labels.sourceArtifactSha256 === TRUTH_ARTIFACT_SHA256,
    "Unexpected labeled truth hash.",
  );
  assertCondition(
    results.truthArtifactSha256 === TRUTH_ARTIFACT_SHA256,
    "Unexpected result truth hash.",
  );
  assertCondition(
    results.snapshot.snapshotId ===
      FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.snapshotId,
    "Unexpected result snapshot.",
  );
  assertCondition(
    results.labeledTruth.rowCount === 68,
    "Expected 68 labeled rows.",
  );
  assertCondition(
    results.labeledTruth.acceptedCount === 54 &&
      results.labeledTruth.rejectedCount === 14,
    "Expected 54 accepted and 14 rejected labeled rows.",
  );
  assertCondition(
    results.currentAliases.sha256 === CURRENT_ALIASES_SHA256 &&
      results.currentAliases.recordCount === 21,
    "Unexpected current aliases provenance.",
  );
  assertCondition(
    results.shadow.predictedCount === 68 &&
      results.shadow.labeledPredictionCount === 68 &&
      results.shadow.unlabeledPredictionCount === 0 &&
      results.shadow.truePositiveCount === 54 &&
      results.shadow.falsePositiveCount === 14 &&
      results.shadow.precision === 54 / 68 &&
      results.shadow.knownPositiveCount === 54 &&
      results.shadow.coveredKnownPositiveCount === 54 &&
      results.shadow.knownPositiveCoverage === 1,
    "Unexpected shadow metrics.",
  );
  assertCondition(
    results.publishedBaseline.predictedCount === 2 &&
      results.publishedBaseline.labeledPredictionCount === 2 &&
      results.publishedBaseline.unlabeledPredictionCount === 0 &&
      results.publishedBaseline.truePositiveCount === 2 &&
      results.publishedBaseline.falsePositiveCount === 0 &&
      results.publishedBaseline.precision === 1 &&
      results.publishedBaseline.knownPositiveCount === 54 &&
      results.publishedBaseline.coveredKnownPositiveCount === 2 &&
      results.publishedBaseline.knownPositiveCoverage === 2 / 54,
    "Unexpected published baseline metrics.",
  );
  assertCondition(
    results.publishedBaseline.matches
      .map((match) => match.offerId)
      .join(",") === "1285667539377,1285668256621",
    "Unexpected published baseline offer IDs.",
  );
  const expectedByForm: Record<
    string,
    {
      predictedCount: number;
      truePositiveCount: number;
      falsePositiveCount: number;
    }
  > = {
    cocinero: {
      predictedCount: 1,
      truePositiveCount: 0,
      falsePositiveCount: 1,
    },
    cocineros: {
      predictedCount: 40,
      truePositiveCount: 30,
      falsePositiveCount: 10,
    },
    albañil: { predictedCount: 2, truePositiveCount: 1, falsePositiveCount: 1 },
    albañiles: {
      predictedCount: 22,
      truePositiveCount: 20,
      falsePositiveCount: 2,
    },
    encofradores: {
      predictedCount: 2,
      truePositiveCount: 2,
      falsePositiveCount: 0,
    },
    teleoperadores: {
      predictedCount: 1,
      truePositiveCount: 1,
      falsePositiveCount: 0,
    },
  };
  for (const [form, expected] of Object.entries(expectedByForm)) {
    const metric = results.shadow.byForm.find((item) => item.form === form);
    assertCondition(
      metric !== undefined,
      "Missing shadow form metric: " + form,
    );
    assertCondition(
      metric.predictedCount === expected.predictedCount &&
        metric.truePositiveCount === expected.truePositiveCount &&
        metric.falsePositiveCount === expected.falsePositiveCount,
      "Unexpected shadow form metric: " + form,
    );
  }
  assertCondition(
    results.closedSet.labelPairCount === 68 &&
      results.closedSet.shadowPredictionPairCount === 68 &&
      results.closedSet.shadowUnlabeledPredictionCount === 0 &&
      results.closedSet.shadowUnpredictedLabelCount === 0,
    "The shadow lane is not closed over the labeled pair set.",
  );
}

export async function generateEvaluationArtifacts(
  root = PROJECT_ROOT,
): Promise<Record<string, string>> {
  const { labels, results } = await evaluateFpOfferMatching(root);
  const report = renderEvaluationReport(labels, results);
  return {
    [LABELS_ARTIFACT_PATH]: await formatWithPrettier(
      JSON.stringify(labels) + "\n",
      { parser: "json" },
    ),
    [RESULTS_ARTIFACT_PATH]: await formatWithPrettier(
      JSON.stringify(results) + "\n",
      { parser: "json" },
    ),
    [REPORT_ARTIFACT_PATH]: await formatWithPrettier(report, {
      parser: "markdown",
    }),
  };
}

export async function writeEvaluationArtifacts(
  root = PROJECT_ROOT,
): Promise<void> {
  const artifacts = await generateEvaluationArtifacts(root);
  await mkdir(resolve(root, EVALUATION_DIRECTORY), { recursive: true });
  for (const [relativePath, contents] of Object.entries(artifacts)) {
    await writeFile(resolve(root, relativePath), contents, "utf8");
  }
}

export async function checkEvaluationArtifacts(
  root = PROJECT_ROOT,
): Promise<void> {
  const expected = await generateEvaluationArtifacts(root);
  for (const [relativePath, contents] of Object.entries(expected)) {
    const path = resolve(root, relativePath);
    let actual: string;
    try {
      actual = await readFile(path, "utf8");
    } catch (error) {
      throw new Error("Missing evaluation artifact: " + relativePath, {
        cause: error,
      });
    }
    if (actual !== contents) {
      throw new Error("Stale evaluation artifact: " + relativePath);
    }
  }
}

async function run(): Promise<void> {
  const mode = process.argv.slice(2);
  if (
    mode.length > 1 ||
    (mode.length === 1 && !["--write", "--check"].includes(mode[0]))
  ) {
    throw new Error("Usage: evaluateFpOfferMatching.ts [--write|--check]");
  }
  if (mode[0] === "--write") {
    await writeEvaluationArtifacts(PROJECT_ROOT);
  } else {
    await checkEvaluationArtifacts(PROJECT_ROOT);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await run();
}
