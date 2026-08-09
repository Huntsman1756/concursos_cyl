import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
  REVIEW_ROW_SCHEMA,
} from "../../data/schemas/fpOneWordPublicationReview";
import {
  validateFpOneWordPublicationReview,
  validateFpOneWordPublicationReviewArtifact,
} from "./validateFpOneWordPublicationReview";

const ROOT = resolve(import.meta.dirname, "../..");
const ARTIFACT_PATH = resolve(
  ROOT,
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
);

type TestArtifact = {
  rows: Array<{
    offerId: string;
    offerTitle: string;
    form: string;
    programKey: string;
    occupationId: string;
  }>;
  snapshotId: string;
  publicationDecision: Record<string, { status: string; reason: string }>;
};

function readArtifact(): TestArtifact {
  return JSON.parse(readFileSync(ARTIFACT_PATH, "utf8"));
}

function cloned<T>(value: T): T {
  return structuredClone(value);
}

describe("FP one-word publication review validator", () => {
  it("validates the checked-in strict 67-row artifact only in progress mode", () => {
    const artifact = readArtifact();
    expect(artifact.rows).toHaveLength(67);
    expect(artifact.rows.map((row) => row.offerId)).toContain("1285664848132");
    expect(() => validateFpOneWordPublicationReviewArtifact(artifact)).toThrow(
      /needs_human_review|allow-in-progress/i,
    );
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(artifact, {
        allowInProgress: true,
      }),
    ).not.toThrow();
  });

  it.each([
    [
      "missing row",
      (value: TestArtifact): void => {
        value.rows.pop();
      },
    ],
    [
      "extra row",
      (value: TestArtifact): void => {
        value.rows.push(cloned(value.rows[0]));
      },
    ],
    [
      "altered id",
      (value: TestArtifact): void => {
        value.rows[0].offerId = "9";
      },
    ],
    [
      "altered title",
      (value: TestArtifact): void => {
        value.rows[0].offerTitle = "alterado";
      },
    ],
    [
      "altered form",
      (value: TestArtifact): void => {
        value.rows[0].form = "cocinero";
      },
    ],
    [
      "altered program",
      (value: TestArtifact): void => {
        value.rows[0].programKey = "HOT01M";
      },
    ],
    [
      "altered CNO",
      (value: TestArtifact): void => {
        value.rows[0].occupationId = "occupation:cno11:5110";
      },
    ],
    [
      "duplicate identity",
      (value: TestArtifact): void => {
        value.rows[1] = cloned(value.rows[0]);
      },
    ],
    [
      "non-locale ordering",
      (value: TestArtifact): void => {
        value.rows.reverse();
      },
    ],
    [
      "count drift",
      (value: TestArtifact): void => {
        value.rows = value.rows.slice(0, 66);
      },
    ],
    [
      "accepted/rejected drift",
      (value: TestArtifact): void => {
        value.publicationDecision.cocinero.status = "accepted";
      },
    ],
    [
      "missing required identity",
      (value: TestArtifact): void => {
        value.rows.find((row) => row.offerId === "1285664848132")!.offerId =
          "9";
      },
    ],
    [
      "changed snapshot bytes",
      (value: TestArtifact): void => {
        value.snapshotId = "changed";
      },
    ],
    [
      "hand-edited publication decision",
      (value: TestArtifact): void => {
        value.publicationDecision.albañil.reason = "edited";
      },
    ],
  ] as const)("rejects %s", (_name, mutate) => {
    const artifact = readArtifact();
    mutate(artifact);
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(artifact, {
        allowInProgress: true,
      }),
    ).toThrow();
  });

  it("rejects unresolved rows in terminal validation", () => {
    expect(() => validateFpOneWordPublicationReview(ROOT)).toThrow(
      /allow-in-progress|needs_human_review/i,
    );
  });

  it("verifies snapshot bytes before parsing and reconstructs exact identities", () => {
    const path = resolve(
      ROOT,
      FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.resourcePath,
    );
    const bytes = readFileSync(path);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.sha256,
    );
    expect(() => REVIEW_ROW_SCHEMA.parse(readArtifact().rows[0])).not.toThrow();
  });

  it("requires strict row shape", () => {
    const row = readArtifact().rows[0];
    expect(() =>
      REVIEW_ROW_SCHEMA.parse({ ...row, unexpected: true }),
    ).toThrow();
    expect(() =>
      REVIEW_ROW_SCHEMA.parse({ ...row, rationale: "short" }),
    ).toThrow();
  });

  it("does not accept an edited artifact", () => {
    const artifact = readArtifact();
    artifact.rows[0].offerId = "1";
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(artifact, {
        allowInProgress: true,
      }),
    ).toThrow();
  });
});
