import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

import {
  FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA,
  FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT,
  type FpOneWordPublicationReview,
  type ReviewRow,
} from "../../data/schemas/fpOneWordPublicationReview";

type Offer = { id: string; title: string };

const RAW_PINNED_OFFER_SCHEMA = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
  })
  .passthrough();

export const PINNED_OFFER_SCHEMA = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

const CANDIDATES = [
  {
    candidateId: "cocinero-s",
    forms: ["cocinero", "cocineros"],
    programKey: "HOT01M",
    occupationId: "occupation:cno11:5110",
    ids: [
      "1285614233577",
      "1285626761329",
      "1285627823296",
      "1285637347955",
      "1285639495437",
      "1285640091376",
      "1285640170324",
      "1285645512831",
      "1285655155784",
      "1285659376390",
      "1285659956971",
      "1285660807038",
      "1285662378630",
      "1285663812475",
      "1285664451544",
      "1285665562689",
      "1285665634431",
      "1285665790208",
      "1285666442607",
      "1285666499205",
      "1285666617717",
      "1285666617827",
      "1285666878773",
      "1285666909272",
      "1285666909300",
      "1285666999271",
      "1285667211184",
      "1285667333359",
      "1285667333387",
      "1285667926910",
      "1285667926938",
      "1285667926966",
      "1285668256453",
      "1285668323029",
      "1285668911911",
      "1285669059164",
      "1285669380024",
      "1285669380068",
      "1285669482753",
      "1285669506800",
      "1285669719137",
    ],
  },
  {
    candidateId: "albanil-es",
    forms: ["albañil", "albañiles"],
    programKey: "EOC01M",
    occupationId: "occupation:cno11:7121",
    ids: [
      "1285613685343",
      "1285614585114",
      "1285658958752",
      "1285662949857",
      "1285663783370",
      "1285663974168",
      "1285664082111",
      "1285664848132",
      "1285664861533",
      "1285665269105",
      "1285665380724",
      "1285665380790",
      "1285665634810",
      "1285667539516",
      "1285667539544",
      "1285667590834",
      "1285667964750",
      "1285668256677",
      "1285668256705",
      "1285668323262",
      "1285668412750",
      "1285668877598",
      "1285669061589",
      "1285669638729",
    ],
  },
  {
    candidateId: "encofradores",
    forms: ["encofradores"],
    programKey: "EOC01M",
    occupationId: "occupation:cno11:7111",
    ids: ["1285667539377", "1285668256621"],
  },
] as const;

const SPECIAL_FORMS: Record<string, string> = {
  "1285669506800": "cocinero",
  "1285664848132": "albañil",
  "1285669061589": "albañil",
};

function fail(message: string): never {
  throw new Error(message);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function compareNormalizedCodePointStrings(
  left: string,
  right: string,
): number {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function readPinnedOffers(rootDirectory: string): Offer[] {
  const path = resolve(
    rootDirectory,
    FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.resourcePath,
  );
  const bytes = readFileSync(path);
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.sha256) {
    fail("Pinned one-word publication review snapshot SHA-256 mismatch.");
  }
  const value = JSON.parse(bytes.toString("utf8")) as unknown;
  if (
    !Array.isArray(value) ||
    value.length !== FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.recordCount
  ) {
    fail("Pinned one-word publication review snapshot record count mismatch.");
  }
  return value.map((entry) => {
    try {
      const rawOffer = RAW_PINNED_OFFER_SCHEMA.parse(entry);
      return PINNED_OFFER_SCHEMA.parse({
        id: rawOffer.id,
        title: rawOffer.title,
      });
    } catch {
      fail(
        "Pinned one-word publication review snapshot contains an invalid offer.",
      );
    }
  });
}

function reconstruct(rootDirectory: string): ReviewRow[] {
  const offers = readPinnedOffers(rootDirectory);
  const byId = new Map(offers.map((offer) => [offer.id, offer]));
  const rows: ReviewRow[] = [];
  for (const candidate of CANDIDATES) {
    for (const id of candidate.ids) {
      const offer = byId.get(id);
      if (!offer) fail(`Expected pinned offer is missing: ${id}.`);
      const form = (SPECIAL_FORMS[id] ??
        candidate.forms.at(-1)!) as ReviewRow["form"];
      if (!` ${normalize(offer.title)} `.includes(` ${normalize(form)} `)) {
        fail(`Expected form ${form} is not a whole normalized token in ${id}.`);
      }
      rows.push({
        candidateId: candidate.candidateId,
        form,
        programKey: candidate.programKey,
        occupationId: candidate.occupationId,
        offerId: id,
        offerTitle: offer.title,
        disposition: "needs_human_review",
        reasonCode: "insufficient_title_evidence",
        rationale:
          "The trusted title match is retained for human publication review; no terminal decision is inferred.",
        requirementQuotes: [offer.title],
      });
    }
  }
  return rows.sort(
    (left, right) =>
      compareNormalizedCodePointStrings(left.candidateId, right.candidateId) ||
      compareNormalizedCodePointStrings(left.form, right.form) ||
      compareNormalizedCodePointStrings(left.offerId, right.offerId),
  );
}

function expectedDecision(rows: readonly ReviewRow[]) {
  const forms = [
    "cocinero",
    "cocineros",
    "albañil",
    "albañiles",
    "encofradores",
  ] as const;
  return Object.fromEntries(
    forms.map((form) => {
      const formRows = rows.filter((row) => row.form === form);
      const acceptedOfferIds = formRows
        .filter((row) => row.disposition === "accepted")
        .map((row) => row.offerId)
        .sort(compareNormalizedCodePointStrings);
      const rejectedOfferIds = formRows
        .filter((row) => row.disposition === "rejected")
        .map((row) => row.offerId)
        .sort(compareNormalizedCodePointStrings);
      if (formRows.some((row) => row.disposition === "needs_human_review")) {
        return [
          form,
          {
            status: "rejected",
            acceptedOfferIds: [],
            rejectedOfferIds: formRows
              .map((row) => row.offerId)
              .sort(compareNormalizedCodePointStrings),
            reason: "Pending human review; not approved for publication.",
          },
        ];
      }
      return [
        form,
        {
          status: acceptedOfferIds.length > 0 ? "accepted" : "rejected",
          acceptedOfferIds,
          rejectedOfferIds,
          reason:
            acceptedOfferIds.length > 0
              ? "Accepted offers are eligible for publication."
              : "No offers are approved for publication.",
        },
      ];
    }),
  );
}

export function validateFpOneWordPublicationReviewArtifact(
  value: unknown,
  rootDirectoryOrOptions: string | { allowInProgress?: boolean } = resolve(
    import.meta.dirname,
    "../..",
  ),
  maybeOptions: { allowInProgress?: boolean } = {},
): FpOneWordPublicationReview {
  const rootDirectory =
    typeof rootDirectoryOrOptions === "string"
      ? rootDirectoryOrOptions
      : resolve(import.meta.dirname, "../..");
  const options =
    typeof rootDirectoryOrOptions === "string"
      ? maybeOptions
      : rootDirectoryOrOptions;
  const artifact = FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA.parse(value);
  const expectedRows = reconstruct(rootDirectory);
  if (artifact.rows.length !== expectedRows.length) {
    fail("FP one-word publication review row count drift.");
  }
  if (
    !options.allowInProgress &&
    artifact.rows.some((row) => row.disposition === "needs_human_review")
  ) {
    fail(
      "Terminal artifact contains needs_human_review; use --allow-in-progress.",
    );
  }
  if (options.allowInProgress) {
    const actualRows = artifact.rows.map((row) => JSON.stringify(row));
    const expectedRowsJson = expectedRows.map((row) => JSON.stringify(row));
    if (JSON.stringify(actualRows) !== JSON.stringify(expectedRowsJson)) {
      fail("FP one-word in-progress row review or evidence drift.");
    }
  } else {
    const actualIdentities = artifact.rows.map(
      ({ candidateId, form, programKey, occupationId, offerId, offerTitle }) =>
        `${candidateId}\0${form}\0${programKey}\0${occupationId}\0${offerId}\0${offerTitle}`,
    );
    const expectedIdentities = expectedRows.map(
      ({ candidateId, form, programKey, occupationId, offerId, offerTitle }) =>
        `${candidateId}\0${form}\0${programKey}\0${occupationId}\0${offerId}\0${offerTitle}`,
    );
    if (
      JSON.stringify(actualIdentities) !== JSON.stringify(expectedIdentities)
    ) {
      fail("FP one-word publication review identities or ordering drift.");
    }
  }
  if (
    JSON.stringify(artifact.publicationDecision) !==
    JSON.stringify(expectedDecision(artifact.rows))
  ) {
    fail("FP one-word publication decision drift.");
  }
  return artifact;
}

export function validateFpOneWordPublicationReview(
  rootDirectory: string,
  options: { allowInProgress?: boolean } = {},
): FpOneWordPublicationReview {
  const artifactPath = resolve(
    rootDirectory,
    FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH,
  );
  return validateFpOneWordPublicationReviewArtifact(
    JSON.parse(readFileSync(artifactPath, "utf8")),
    rootDirectory,
    options,
  );
}

if (process.argv[1]?.endsWith("validateFpOneWordPublicationReview.ts")) {
  const allowInProgress = process.argv.includes("--allow-in-progress");
  validateFpOneWordPublicationReview(resolve(process.cwd()), {
    allowInProgress,
  });
}
