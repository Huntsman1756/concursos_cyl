import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
  REVIEW_ROW_SCHEMA,
  type FpOneWordPublicationReview,
} from "../../data/schemas/fpOneWordPublicationReview";
import {
  compareNormalizedCodePointStrings,
  PINNED_OFFER_SCHEMA,
  validateFpOneWordPublicationReview,
  validateFpOneWordPublicationReviewArtifact,
} from "./validateFpOneWordPublicationReview";

const ROOT = resolve(import.meta.dirname, "../..");
const ARTIFACT_PATH = resolve(
  ROOT,
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
);

function readArtifact(): FpOneWordPublicationReview {
  return JSON.parse(readFileSync(ARTIFACT_PATH, "utf8"));
}

function cloned<T>(value: T): T {
  return structuredClone(value);
}

function createTerminalArtifact(): FpOneWordPublicationReview {
  const artifact = cloned(readArtifact());
  const acceptedOfferIds = new Set(["1285664848132", "1285669506800"]);
  for (const row of artifact.rows) {
    if (acceptedOfferIds.has(row.offerId)) {
      row.disposition = "accepted";
      row.reasonCode = "exact_occupation_title";
      row.rationale =
        "Manual review confirmed the pinned title is an exact occupation title match for publication.";
    } else {
      row.disposition = "rejected";
      row.reasonCode = "outside_program_boundary";
      row.rationale =
        "Manual review rejected this pinned title for publication and retained the exact title as evidence.";
    }
    row.requirementQuotes = [row.offerTitle];
  }
  artifact.publicationDecision = {
    cocinero: {
      status: "accepted",
      acceptedOfferIds: ["1285669506800"],
      rejectedOfferIds: [],
      reason: "Accepted offers are eligible for publication.",
    },
    cocineros: {
      status: "rejected",
      acceptedOfferIds: [],
      rejectedOfferIds: artifact.rows
        .filter((row) => row.form === "cocineros")
        .map((row) => row.offerId),
      reason: "No offers are approved for publication.",
    },
    albañil: {
      status: "accepted",
      acceptedOfferIds: ["1285664848132"],
      rejectedOfferIds: ["1285669061589"],
      reason: "Accepted offers are eligible for publication.",
    },
    albañiles: {
      status: "rejected",
      acceptedOfferIds: [],
      rejectedOfferIds: artifact.rows
        .filter((row) => row.form === "albañiles")
        .map((row) => row.offerId),
      reason: "No offers are approved for publication.",
    },
    encofradores: {
      status: "rejected",
      acceptedOfferIds: [],
      rejectedOfferIds: artifact.rows
        .filter((row) => row.form === "encofradores")
        .map((row) => row.offerId),
      reason: "No offers are approved for publication.",
    },
  };
  return artifact;
}

function withTemporaryRoot(
  mutate: (paths: {
    rootDirectory: string;
    artifactPath: string;
    snapshotPath: string;
  }) => void,
): void {
  const rootDirectory = mkdtempSync(
    resolve(tmpdir(), "fp-one-word-publication-review-"),
  );
  const artifactPath = resolve(
    rootDirectory,
    FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  );
  const snapshotPath = resolve(
    rootDirectory,
    FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.resourcePath,
  );
  mkdirSync(dirname(artifactPath), { recursive: true });
  mkdirSync(dirname(snapshotPath), { recursive: true });
  copyFileSync(ARTIFACT_PATH, artifactPath);
  copyFileSync(
    resolve(ROOT, FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.resourcePath),
    snapshotPath,
  );
  try {
    mutate({ rootDirectory, artifactPath, snapshotPath });
  } finally {
    rmSync(rootDirectory, { recursive: true, force: true });
  }
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
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows.pop();
      },
    ],
    [
      "extra row",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows.push(cloned(artifact.rows[0]));
      },
    ],
    [
      "altered id",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].offerId = "9";
      },
    ],
    [
      "altered title",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].offerTitle = "alterado";
      },
    ],
    [
      "altered form",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].form = "cocinero";
      },
    ],
    [
      "altered program",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].programKey = "HOT01M";
      },
    ],
    [
      "altered CNO",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].occupationId = "occupation:cno11:5110";
      },
    ],
    [
      "duplicate identity",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[1] = cloned(artifact.rows[0]);
      },
    ],
    [
      "non-locale ordering",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows.reverse();
      },
    ],
    [
      "count drift",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows = artifact.rows.slice(0, 66);
      },
    ],
    [
      "accepted/rejected drift",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.publicationDecision.cocinero.status = "accepted";
      },
    ],
    [
      "missing required identity",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows.find((row) => row.offerId === "1285664848132")!.offerId =
          "9";
      },
    ],
    [
      "changed snapshot id",
      (artifact: FpOneWordPublicationReview): void => {
        (artifact as { snapshotId: string }).snapshotId = "changed";
      },
    ],
    [
      "hand-edited publication decision",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.publicationDecision.albañil.reason = "edited";
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

  it.each([
    [
      "disposition drift",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].disposition = "rejected";
      },
    ],
    [
      "reasonCode drift",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].reasonCode = "mixed_role";
      },
    ],
    [
      "rationale drift",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].rationale =
          "Manual review rewrote this rationale while leaving the seeded identity in place.";
      },
    ],
    [
      "requirementQuotes drift",
      (artifact: FpOneWordPublicationReview): void => {
        artifact.rows[0].requirementQuotes = [
          artifact.rows[0].offerTitle,
          "extra evidence",
        ];
      },
    ],
  ] as const)("rejects in-progress %s", (_name, mutate) => {
    const artifact = readArtifact();
    mutate(artifact);
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(artifact, {
        allowInProgress: true,
      }),
    ).toThrow(/row review|evidence drift/i);
  });

  it("rejects unresolved rows in terminal validation", () => {
    expect(() => validateFpOneWordPublicationReview(ROOT)).toThrow(
      /allow-in-progress|needs_human_review/i,
    );
  });

  it("accepts terminal accepted and rejected decisions when they match the rows", () => {
    const artifact = createTerminalArtifact();
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(artifact),
    ).not.toThrow();
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

  it("rejects changed snapshot bytes from the caller-supplied rootDirectory", () => {
    withTemporaryRoot(({ rootDirectory, snapshotPath }) => {
      const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as Array<{
        id: string;
        title: string;
      }>;
      snapshot[0] = { ...snapshot[0], title: `${snapshot[0].title} alterado` };
      writeFileSync(snapshotPath, JSON.stringify(snapshot));
      expect(() =>
        validateFpOneWordPublicationReview(rootDirectory, {
          allowInProgress: true,
        }),
      ).toThrow(/SHA-256 mismatch/i);
    });
  });

  it("orders strings by normalized code points with a raw-string tiebreaker", () => {
    expect(
      ["álbanil", "albanil", "cocinero"].sort(
        compareNormalizedCodePointStrings,
      ),
    ).toEqual(["albanil", "álbanil", "cocinero"]);
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

  it("requires strict projected pinned offers", () => {
    expect(() =>
      PINNED_OFFER_SCHEMA.parse({
        id: "1285664848132",
        title: "Oferta",
        extra: true,
      }),
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
