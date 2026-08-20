import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertEvaluationContract,
  containsBoundedPhrase,
  evaluateFpOfferMatching,
  generateEvaluationArtifacts,
  renderEvaluationReport,
  type EvaluationResults,
} from "./evaluateFpOfferMatching";

const ROOT = process.cwd();

describe("evaluateFpOfferMatching", () => {
  it("reproduces the closed labeled metrics and baseline IDs", async () => {
    const { labels, results } = await evaluateFpOfferMatching(ROOT);

    expect(labels.review.rows).toHaveLength(68);
    expect(results.labeledTruth).toMatchObject({
      rowCount: 68,
      acceptedCount: 54,
      rejectedCount: 14,
    });
    expect(results.shadow).toMatchObject({
      predictedCount: 68,
      labeledPredictionCount: 68,
      truePositiveCount: 54,
      falsePositiveCount: 14,
      precision: 54 / 68,
      knownPositiveCoverage: 1,
    });
    expect(results.publishedBaseline).toMatchObject({
      predictedCount: 2,
      truePositiveCount: 2,
      falsePositiveCount: 0,
      precision: 1,
      knownPositiveCoverage: 2 / 54,
    });
    expect(
      results.publishedBaseline.matches.map((match) => match.offerId),
    ).toEqual(["1285667539377", "1285668256621"]);
    expect(results.closedSet).toEqual({
      labelPairCount: 68,
      shadowPredictionPairCount: 68,
      shadowUnlabeledPredictionCount: 0,
      shadowUnpredictedLabelCount: 0,
    });
  });

  it("keeps normalization and whole-word matching bounded", () => {
    expect(containsBoundedPhrase("precocinero", "cocinero")).toBe(false);
    expect(containsBoundedPhrase("COCINEROS, EN GENERAL", "cocineros")).toBe(
      true,
    );
    expect(containsBoundedPhrase("AlbaÑil", "albanil")).toBe(true);
  });

  it("renders committed artifacts deterministically", async () => {
    const artifacts = await generateEvaluationArtifacts(ROOT);
    for (const [relativePath, expected] of Object.entries(artifacts)) {
      await expect(readFile(resolve(ROOT, relativePath), "utf8")).resolves.toBe(
        expected,
      );
    }
  });

  it("rejects a changed metric contract", async () => {
    const { labels, results } = await evaluateFpOfferMatching(ROOT);
    const mutated = structuredClone(results) as EvaluationResults;
    mutated.shadow.truePositiveCount += 1;

    expect(() => assertEvaluationContract(labels, mutated)).toThrow(
      "Unexpected shadow metrics.",
    );
  });

  it("states the market-recall limitation in the report", async () => {
    const { labels, results } = await evaluateFpOfferMatching(ROOT);
    const report = renderEvaluationReport(labels, results);

    expect(report).toContain("## Verdad etiquetada");
    expect(report).toContain("## Métricas");
    expect(report).toContain("## Limitaciones");
    expect(report).toContain("recall del mercado");
    expect(report).toContain("no se inventan etiquetas");
    expect(report).toContain("no publica ni despliega");
  });
});
