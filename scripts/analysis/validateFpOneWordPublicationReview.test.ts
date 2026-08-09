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
import { z } from "zod";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
  REVIEW_ROW_SCHEMA,
  type FpOneWordPublicationReview,
} from "../../data/schemas/fpOneWordPublicationReview";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import { loadApprovedMappings } from "../../src/domain/occupation";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";
import { loadCuratedMappingsFromDisk } from "../data/validateCuratedMappings";
import {
  APPROVED_SINGLE_TOKEN_MATCH_POLICY,
  approvedSingleTokenAuditIdentities,
  approvedSingleTokenAuditIdentity,
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

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function resourcePathInRoot(resourcePath: string): string {
  return resolve(ROOT, "public", resourcePath.replace(/^\/data\//u, "data/"));
}

function readCurrentManifest() {
  return GeneratedManifestSchema.parse(
    readJson(resolve(ROOT, "public", "data", "v1", "manifest.json")),
  );
}

async function loadCurrentApprovedMappings() {
  const manifest = readCurrentManifest();
  const programs = z
    .array(TrainingProgramSchema)
    .parse(
      readJson(
        resourcePathInRoot(manifest.resourceSnapshots.programs.resourcePath),
      ),
    );
  const curated = await loadCuratedMappingsFromDisk(ROOT, programs);
  return {
    manifest,
    programs,
    approved: loadApprovedMappings(curated),
  };
}

function approvedSingleTokenCuratedIdentities(input: {
  aliases: ReturnType<typeof loadApprovedMappings>["aliases"];
  links: ReturnType<typeof loadApprovedMappings>["links"];
}): string[] {
  return [
    ...new Set(
      input.aliases
        .filter(
          (alias) => alias.matchPolicy === APPROVED_SINGLE_TOKEN_MATCH_POLICY,
        )
        .flatMap((alias) =>
          input.links
            .filter((link) => link.occupationId === alias.occupationId)
            .map((link) =>
              approvedSingleTokenAuditIdentity({
                alias: alias.alias,
                occupationId: alias.occupationId,
                programKey: link.trainingProgramKey,
                matchPolicy: APPROVED_SINGLE_TOKEN_MATCH_POLICY,
              }),
            ),
        ),
    ),
  ].sort(compareNormalizedCodePointStrings);
}

function cloned<T>(value: T): T {
  return structuredClone(value);
}

function createInProgressArtifact(): FpOneWordPublicationReview {
  const artifact = cloned(readArtifact());
  for (const row of artifact.rows) {
    row.disposition = "needs_human_review";
    row.reasonCode = "insufficient_title_evidence";
    row.rationale =
      "The trusted title match is retained for human publication review; no terminal decision is inferred.";
    row.requirementQuotes = [row.offerTitle];
  }
  for (const form of [
    "cocinero",
    "cocineros",
    "albañil",
    "albañiles",
    "encofradores",
  ] as const) {
    artifact.publicationDecision[form] = {
      status: "rejected",
      acceptedOfferIds: [],
      rejectedOfferIds: artifact.rows
        .filter((row) => row.form === form)
        .map((row) => row.offerId),
      reason: "Pending human review; not approved for publication.",
    };
  }
  return artifact;
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
      status: "rejected",
      acceptedOfferIds: ["1285664848132"],
      rejectedOfferIds: ["1285669061589"],
      reason: "Known rejected offers prevent publication.",
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
  it("validates the checked-in strict 67-row artifact as terminal", () => {
    const artifact = readArtifact();
    expect(artifact.rows).toHaveLength(67);
    expect(artifact.rows.map((row) => row.offerId)).toContain("1285664848132");
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(artifact),
    ).not.toThrow();
    const inProgress = createInProgressArtifact();
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(inProgress, {
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
    expect(() =>
      validateFpOneWordPublicationReviewArtifact(createInProgressArtifact()),
    ).toThrow(/allow-in-progress|needs_human_review/i);
  });

  it("rejects a mixed form even when it retains its exact accepted offer IDs", () => {
    const artifact = createTerminalArtifact();
    expect(artifact.publicationDecision.albañil).toMatchObject({
      status: "rejected",
      acceptedOfferIds: ["1285664848132"],
      rejectedOfferIds: ["1285669061589"],
    });
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

  it("keeps curated approved_single_token aliases in exact parity with the accepted terminal audit tuple", async () => {
    const artifact = validateFpOneWordPublicationReview(ROOT);
    const acceptedForms = [
      ...new Set(
        artifact.rows
          .filter(
            (row) =>
              row.disposition === "accepted" &&
              artifact.publicationDecision[row.form].status === "accepted",
          )
          .map((row) => normalize(row.form)),
      ),
    ].sort(compareNormalizedCodePointStrings);
    const acceptedIdentities = [
      ...approvedSingleTokenAuditIdentities(artifact),
    ].sort(compareNormalizedCodePointStrings);
    const { approved } = await loadCurrentApprovedMappings();
    const curatedSingleTokenAliases = approved.aliases.filter(
      (alias) => alias.matchPolicy === APPROVED_SINGLE_TOKEN_MATCH_POLICY,
    );
    const curatedForms = [
      ...new Set(
        curatedSingleTokenAliases.map((alias) => normalize(alias.alias)),
      ),
    ].sort(compareNormalizedCodePointStrings);

    expect(curatedForms).toEqual(acceptedForms);
    expect(
      approvedSingleTokenCuratedIdentities({
        aliases: approved.aliases,
        links: approved.links,
      }),
    ).toEqual(acceptedIdentities);
  });

  it("recomputes only the accepted encofradores offer delta in memory and keeps equal-title ids distinct", async () => {
    const artifact = validateFpOneWordPublicationReview(ROOT);
    const acceptedOfferIds = [
      ...artifact.publicationDecision.encofradores.acceptedOfferIds,
    ].sort(compareNormalizedCodePointStrings);
    const acceptedOfferIdSet = new Set(acceptedOfferIds);
    const { manifest, programs, approved } =
      await loadCurrentApprovedMappings();
    const offers = z
      .array(JobOfferSchema)
      .parse(
        readJson(
          resourcePathInRoot(manifest.resourceSnapshots.jobOffers.resourcePath),
        ),
      );
    const publishedRequirements = PublishedRequirementsResourceSchema.parse(
      readJson(
        resourcePathInRoot(
          manifest.resourceSnapshots.publishedRequirements.resourcePath,
        ),
      ),
    );
    const approvedPrograms = [
      ...new Set(approved.links.map((link) => link.trainingProgramKey)),
    ].sort(compareNormalizedCodePointStrings);
    const approvedWithoutSingleTokenAliases = {
      ...approved,
      aliases: approved.aliases.filter(
        (alias) => alias.matchPolicy !== APPROVED_SINGLE_TOKEN_MATCH_POLICY,
      ),
    };

    const deltaByProgram = approvedPrograms.map((programKey) => {
      const withSingleToken = matchOffersForProgram(programKey, {
        programs,
        qualifications: REVIEWED_QUALIFICATIONS,
        programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
        occupations: approved.occupations,
        aliases: approved.aliases,
        links: approved.links,
        offers,
        publishedRequirements,
        humanOverrides: [],
      });
      const withoutSingleToken = matchOffersForProgram(programKey, {
        programs,
        qualifications: REVIEWED_QUALIFICATIONS,
        programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
        occupations: approvedWithoutSingleTokenAliases.occupations,
        aliases: approvedWithoutSingleTokenAliases.aliases,
        links: approvedWithoutSingleTokenAliases.links,
        offers,
        publishedRequirements,
        humanOverrides: [],
      });
      const withIds = withSingleToken.map((match) => match.offerId);
      const withoutIdSet = new Set(
        withoutSingleToken.map((match) => match.offerId),
      );
      const withIdSet = new Set(withIds);

      return {
        programKey,
        matches: withSingleToken,
        addedOfferIds: withIds.filter((offerId) => !withoutIdSet.has(offerId)),
        removedOfferIds: withoutSingleToken
          .map((match) => match.offerId)
          .filter((offerId) => !withIdSet.has(offerId)),
      };
    });

    const eocDelta = deltaByProgram.find(
      ({ programKey }) => programKey === "EOC01M",
    );
    if (eocDelta === undefined) throw new Error("Missing EOC01M coverage.");

    expect(eocDelta.addedOfferIds).toEqual(acceptedOfferIds);
    expect(eocDelta.removedOfferIds).toEqual([]);
    expect(
      deltaByProgram
        .filter(({ programKey }) => programKey !== "EOC01M")
        .every(
          ({ addedOfferIds, removedOfferIds }) =>
            addedOfferIds.length === 0 && removedOfferIds.length === 0,
        ),
    ).toBe(true);
    expect(
      deltaByProgram
        .flatMap(({ addedOfferIds }) => addedOfferIds)
        .sort(compareNormalizedCodePointStrings),
    ).toEqual(acceptedOfferIds);
    expect(
      deltaByProgram.flatMap(({ removedOfferIds }) => removedOfferIds),
    ).toEqual([]);

    const acceptedMatches = eocDelta.matches.filter((match) =>
      acceptedOfferIdSet.has(match.offerId),
    );
    expect(
      acceptedMatches.map(({ offerId, matchRule }) => ({ offerId, matchRule })),
    ).toEqual([
      {
        offerId: "1285667539377",
        matchRule: "title_alias_exact",
      },
      {
        offerId: "1285668256621",
        matchRule: "title_alias_exact",
      },
    ]);
    expect(new Set(acceptedMatches.map((match) => match.offerId)).size).toBe(2);
    expect(
      new Set(
        acceptedMatches.flatMap((match) =>
          "titleEvidence" in match ? [match.titleEvidence.offerTitle] : [],
        ),
      ).size,
    ).toBe(1);
  });
});
