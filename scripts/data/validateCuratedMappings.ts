import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  MappingCoverageResourceSchema,
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type MappingCoverage,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import type { TrainingProgram } from "../../data/schemas/generated";
import {
  APPROVED_SINGLE_TOKEN_MATCH_POLICY,
  approvedSingleTokenAuditIdentity,
  approvedSingleTokenAuditIdentities,
  validateFpOneWordPublicationReview,
} from "../analysis/validateFpOneWordPublicationReview";

export interface CuratedMappingCandidate {
  programs: readonly TrainingProgram[];
  occupations: readonly unknown[];
  aliases: readonly unknown[];
  links: readonly unknown[];
}

export interface ValidatedCuratedMappings {
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
}

const DEFAULT_ROOT_DIRECTORY = resolve(import.meta.dirname, "../..");
const STRICT_MULTIWORD_MATCH_POLICY = "strict_multiword";

function normalizeAlias(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function resolvedAliasMatchPolicy(
  alias: OccupationAlias,
):
  | typeof APPROVED_SINGLE_TOKEN_MATCH_POLICY
  | typeof STRICT_MULTIWORD_MATCH_POLICY {
  return alias.matchPolicy ?? STRICT_MULTIWORD_MATCH_POLICY;
}

function isPrimaryOfficialSource(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLocaleLowerCase("en-US");
    return ["boe.es", "todofp.es", "ine.es", "sepe.es", "jcyl.es"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

function assertApprovedCitations(links: readonly unknown[]): void {
  for (const rawLink of links) {
    if (rawLink === null || typeof rawLink !== "object") continue;
    const link = rawLink as Record<string, unknown>;
    if (
      link.reviewStatus === "approved" &&
      (typeof link.sourceUrl !== "string" ||
        !isPrimaryOfficialSource(link.sourceUrl) ||
        typeof link.sourceQuote !== "string" ||
        link.sourceQuote.trim().length < 10)
    ) {
      throw new Error(
        "Approved mapping requires a primary official source URL and exact quote of at least 10 characters.",
      );
    }
  }
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}.`);
    seen.add(value);
  }
}

export function validateCuratedMappings(
  candidate: CuratedMappingCandidate,
): ValidatedCuratedMappings {
  assertApprovedCitations(candidate.links);
  const occupations = OccupationsSchema.parse(candidate.occupations);
  const aliases = OccupationAliasesSchema.parse(candidate.aliases);
  const links = TrainingOccupationLinksSchema.parse(candidate.links);

  assertUnique(
    occupations.map((occupation) => occupation.occupationId),
    "occupation identifier",
  );
  const occupationIds = new Set(
    occupations.map((occupation) => occupation.occupationId),
  );
  const programKeys = new Set(
    candidate.programs.map((program) => program.programKey),
  );
  const normalizedAliases = new Map<string, string>();
  const approvedSingleTokenIdentities = approvedSingleTokenAuditIdentities(
    validateFpOneWordPublicationReview(DEFAULT_ROOT_DIRECTORY),
  );

  for (const alias of aliases) {
    const normalized = normalizeAlias(alias.alias);
    const normalizedTokenCount =
      normalized.length === 0 ? 0 : normalized.split(" ").length;
    const matchPolicy = resolvedAliasMatchPolicy(alias);
    if (normalizedTokenCount < 2) {
      if (matchPolicy !== APPROVED_SINGLE_TOKEN_MATCH_POLICY) {
        throw new Error(
          `Generic one-word alias is not allowed: ${alias.alias}.`,
        );
      }
      if (normalizedTokenCount !== 1) {
        throw new Error(
          `approved_single_token requires exactly one normalized token: ${alias.alias}.`,
        );
      }
      if (
        !links
          .filter(
            (link) =>
              link.reviewStatus === "approved" &&
              link.occupationId === alias.occupationId,
          )
          .every((link) =>
            approvedSingleTokenIdentities.has(
              approvedSingleTokenAuditIdentity({
                alias: alias.alias,
                occupationId: alias.occupationId,
                programKey: link.trainingProgramKey,
                matchPolicy,
              }),
            ),
          ) ||
        !links.some(
          (link) =>
            link.reviewStatus === "approved" &&
            link.occupationId === alias.occupationId &&
            approvedSingleTokenIdentities.has(
              approvedSingleTokenAuditIdentity({
                alias: alias.alias,
                occupationId: alias.occupationId,
                programKey: link.trainingProgramKey,
                matchPolicy,
              }),
            ),
        )
      ) {
        throw new Error(
          `approved_single_token alias lacks an exact accepted publication audit tuple: ${alias.alias}.`,
        );
      }
    } else if (matchPolicy === APPROVED_SINGLE_TOKEN_MATCH_POLICY) {
      throw new Error(
        `approved_single_token requires exactly one normalized token: ${alias.alias}.`,
      );
    }
    const existing = normalizedAliases.get(normalized);
    if (existing !== undefined) {
      throw new Error(
        `Duplicate normalized alias ${alias.alias} targets ${existing} and ${alias.occupationId}.`,
      );
    }
    normalizedAliases.set(normalized, alias.occupationId);
    if (!occupationIds.has(alias.occupationId)) {
      throw new Error(
        `Alias references unknown occupation ${alias.occupationId}.`,
      );
    }
  }

  const linkIdentities: string[] = [];
  for (const link of links) {
    if (!programKeys.has(link.trainingProgramKey)) {
      throw new Error(
        `Mapping references unknown training program ${link.trainingProgramKey}.`,
      );
    }
    if (!occupationIds.has(link.occupationId)) {
      throw new Error(
        `Mapping references unknown occupation ${link.occupationId}.`,
      );
    }
    if (
      link.reviewStatus === "approved" &&
      !isPrimaryOfficialSource(link.sourceUrl)
    ) {
      throw new Error(
        "Approved mapping requires a primary official source URL and exact quote.",
      );
    }
    linkIdentities.push(
      `${link.trainingProgramKey}:${link.occupationId}:${link.relationshipType}`,
    );
  }
  assertUnique(linkIdentities, "training occupation relationship");

  return { occupations, aliases, links };
}

function countsForLinks(links: readonly TrainingOccupationLink[]) {
  return {
    approvedMappings: links.filter((link) => link.reviewStatus === "approved")
      .length,
    draftMappings: links.filter((link) => link.reviewStatus === "draft").length,
    rejectedMappings: links.filter((link) => link.reviewStatus === "rejected")
      .length,
  };
}

export function buildMappingCoverage(
  programs: readonly TrainingProgram[],
  links: readonly TrainingOccupationLink[],
): MappingCoverage[] {
  const linksByProgram = new Map<string, TrainingOccupationLink[]>();
  for (const link of links) {
    linksByProgram.set(link.trainingProgramKey, [
      ...(linksByProgram.get(link.trainingProgramKey) ?? []),
      link,
    ]);
  }

  const programRows: MappingCoverage[] = [...programs]
    .sort((left, right) => left.programKey.localeCompare(right.programKey))
    .map((program) => {
      const counts = countsForLinks(
        linksByProgram.get(program.programKey) ?? [],
      );
      const coverageStatus =
        counts.approvedMappings > 0
          ? "reviewed"
          : counts.draftMappings > 0
            ? "draft"
            : "uncovered";
      return {
        scope: "program" as const,
        programKey: program.programKey,
        programTitle: program.programTitle,
        familyCode: program.familyCode,
        familyName: program.familyName,
        ...counts,
        uncoveredPrograms: coverageStatus === "uncovered" ? 1 : 0,
        coverageStatus,
        coverageNote:
          coverageStatus === "reviewed"
            ? "Incluye relaciones ocupacionales revisadas y citadas."
            : "Aún no hay una relación ocupacional aprobada; esto no significa que el ciclo no tenga salidas profesionales.",
      };
    });

  const rowsByFamily = new Map<
    string,
    Extract<MappingCoverage, { scope: "program" }>[]
  >();
  for (const row of programRows) {
    if (row.scope !== "program") continue;
    rowsByFamily.set(row.familyCode, [
      ...(rowsByFamily.get(row.familyCode) ?? []),
      row,
    ]);
  }
  const familyRows: MappingCoverage[] = [...rowsByFamily.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([familyCode, rows]) => ({
      scope: "family" as const,
      familyCode,
      familyName: rows[0]!.familyName,
      programCount: rows.length,
      approvedMappings: rows.reduce(
        (sum, row) => sum + row.approvedMappings,
        0,
      ),
      draftMappings: rows.reduce((sum, row) => sum + row.draftMappings, 0),
      rejectedMappings: rows.reduce(
        (sum, row) => sum + row.rejectedMappings,
        0,
      ),
      uncoveredPrograms: rows.reduce(
        (sum, row) => sum + row.uncoveredPrograms,
        0,
      ),
      coverageNote:
        "La cobertura mide relaciones revisadas del catálogo, no la existencia de salidas profesionales.",
    }));

  return MappingCoverageResourceSchema.parse([...programRows, ...familyRows]);
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function loadCuratedMappingsFromDisk(
  rootDirectory: string,
  programs: readonly TrainingProgram[],
): Promise<ValidatedCuratedMappings> {
  const directory = resolve(rootDirectory, "data", "curated");
  const [occupations, aliases, links] = await Promise.all([
    readJson(resolve(directory, "occupations.json")),
    readJson(resolve(directory, "occupation-aliases.json")),
    readJson(resolve(directory, "training-occupation-links.json")),
  ]);
  return validateCuratedMappings({
    programs,
    occupations: Array.isArray(occupations) ? occupations : [occupations],
    aliases: Array.isArray(aliases) ? aliases : [aliases],
    links: Array.isArray(links) ? links : [links],
  });
}
