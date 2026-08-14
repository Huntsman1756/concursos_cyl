import {
  OccupationAliasSchema,
  OccupationSchema,
  TrainingOccupationLinkSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

export interface CuratedMappingsInput {
  occupations: unknown[];
  aliases: unknown[];
  links: unknown[];
}

export interface CuratedCoverage {
  totalPrograms: number;
  coveredPrograms: number;
  uncoveredPrograms: number;
  linksByReviewStatus: Record<"approved" | "draft" | "rejected", number>;
}

export interface ValidatedCuratedMappings {
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
  coverage: CuratedCoverage;
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Duplicate ${label}`);
  }
}

function assertSpecificAlias(alias: OccupationAlias): void {
  const wordCount = alias.alias.trim().split(/\s+/u).length;
  if (wordCount < 2) {
    throw new Error(`Generic one-word alias is not allowed: ${alias.alias}`);
  }
}

export function validateCuratedMappings(
  input: CuratedMappingsInput,
  programKeys: Iterable<string> = [],
): ValidatedCuratedMappings {
  const occupations = input.occupations.map((item) =>
    OccupationSchema.parse(item),
  );
  const aliases = input.aliases.map((item) =>
    OccupationAliasSchema.parse(item),
  );
  const links = input.links.map((item) =>
    TrainingOccupationLinkSchema.parse(item),
  );
  const occupationIds = new Set(occupations.map((item) => item.occupationId));
  const validProgramKeys = new Set(programKeys);

  assertUnique(
    occupations.map((item) => item.occupationId),
    "occupation identifier",
  );
  assertUnique(
    aliases.map(
      (item) => `${item.occupationId}:${item.alias.toLocaleLowerCase("es")}`,
    ),
    "occupation alias",
  );
  assertUnique(
    links.map((item) => `${item.trainingProgramKey}:${item.occupationId}`),
    "training occupation link",
  );

  for (const alias of aliases) {
    if (!occupationIds.has(alias.occupationId)) {
      throw new Error(
        `Alias references missing occupation ${alias.occupationId}`,
      );
    }
    assertSpecificAlias(alias);
  }

  for (const link of links) {
    if (!occupationIds.has(link.occupationId)) {
      throw new Error(
        `Link references missing occupation ${link.occupationId}`,
      );
    }
    if (
      validProgramKeys.size > 0 &&
      !validProgramKeys.has(link.trainingProgramKey)
    ) {
      throw new Error(
        `Link references missing training program ${link.trainingProgramKey}`,
      );
    }
    if (link.reviewStatus === "approved") {
      if (!link.sourceUrl || !link.sourceQuote) {
        throw new Error("Approved mapping requires source citation");
      }
    }
  }

  const allProgramKeys = [...validProgramKeys];
  const approvedProgramKeys = new Set(
    links
      .filter((link) => link.reviewStatus === "approved")
      .map((link) => link.trainingProgramKey),
  );
  const linksByReviewStatus = {
    approved: links.filter((link) => link.reviewStatus === "approved").length,
    draft: links.filter((link) => link.reviewStatus === "draft").length,
    rejected: links.filter((link) => link.reviewStatus === "rejected").length,
  };

  return {
    occupations,
    aliases: aliases.filter((alias) => alias.reviewStatus === "approved"),
    links: links.filter((link) => link.reviewStatus === "approved"),
    coverage: {
      totalPrograms: allProgramKeys.length,
      coveredPrograms: [...approvedProgramKeys].filter((key) =>
        validProgramKeys.has(key),
      ).length,
      uncoveredPrograms: allProgramKeys.filter(
        (key) => !approvedProgramKeys.has(key),
      ).length,
      linksByReviewStatus,
    },
  };
}

export function loadApprovedMappings(
  input: CuratedMappingsInput,
  programKeys: Iterable<string> = [],
): ValidatedCuratedMappings {
  return validateCuratedMappings(input, programKeys);
}
