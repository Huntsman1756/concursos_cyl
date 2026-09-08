import type { Occupation } from "../../data/schemas/curatedMappings";
import type { TrainingProgram } from "../../data/schemas/generated";
import { longDateFromCalendarDay } from "./displayFormat";
import { trainingLevelLabel } from "./trainingPresentation";

export interface ApprovedExampleOccupation {
  occupationId: string;
  label: string;
  reviewedAt: string;
  sourceLabel: string;
}

export interface ApprovedExampleData {
  programKey: string;
  programTitle: string;
  levelLabel: string;
  familyName: string;
  occupations: ApprovedExampleOccupation[];
  centersCount: number;
  provincesCount: number;
  topProvinces: Array<{ province: string; centers: number }>;
}

interface LinkLike {
  trainingProgramKey: string;
  occupationId: string;
  relationshipType: string;
  reviewedAt: string;
  sourceUrl: string;
}

interface OfferingLike {
  centerCode: string;
  programKey: string;
}

interface CenterLike {
  centerCode: string;
  province: string;
}

function sourceLabelFor(sourceUrl: string): string {
  if (/todofp\.es/u.test(sourceUrl)) return "TodoFP";
  if (/boe\.es/u.test(sourceUrl)) return "BOE";
  return "fuente oficial";
}

function reviewDateLabel(reviewedAt: string): string {
  return longDateFromCalendarDay(reviewedAt) ?? reviewedAt;
}

/**
 * Builds the Home "real example" strictly from runtime data. The approved
 * example (APPROVED_EXAMPLES_POLICY, analysis/prototype-data-integrity.md) is
 * ADG02S ↔ CNO 4111. If the reviewed relationship is not present in the
 * current copy, the example cannot be shown (fail-closed: never invent a
 * relation).
 */
export function buildApprovedExample({
  programs,
  links,
  occupations,
  offerings,
  centers,
  programKey = "ADG02S",
}: {
  programs: TrainingProgram[];
  links: LinkLike[];
  occupations: Occupation[];
  offerings: OfferingLike[];
  centers: CenterLike[];
  programKey?: string;
}): ApprovedExampleData | null {
  const program = programs.find(
    (candidate) => candidate.programKey === programKey,
  );
  if (program === undefined) return null;

  const rows = links.filter((row) => row.trainingProgramKey === programKey);
  if (
    rows.length === 0 ||
    !rows.some((row) => row.relationshipType === "official_output")
  ) {
    return null;
  }

  const labelByOccupation = new Map(
    occupations.map((occupation) => [occupation.occupationId, occupation]),
  );
  const byOccupation = new Map<string, ApprovedExampleOccupation>();
  for (const row of rows) {
    if (byOccupation.has(row.occupationId)) continue;
    const occupation = labelByOccupation.get(row.occupationId);
    if (occupation === undefined) continue;
    byOccupation.set(row.occupationId, {
      occupationId: row.occupationId,
      label: occupation.preferredLabel,
      reviewedAt: reviewDateLabel(row.reviewedAt),
      sourceLabel: sourceLabelFor(row.sourceUrl),
    });
  }
  const occupationsForExample = [...byOccupation.values()].sort((left, right) =>
    left.label.localeCompare(right.label, "es"),
  );
  if (occupationsForExample.length === 0) return null;

  const centerCodes = new Set(
    offerings
      .filter((offering) => offering.programKey === programKey)
      .map((offering) => offering.centerCode),
  );
  if (centerCodes.size === 0) return null;

  const provinceByCenter = new Map(
    centers.map((center) => [center.centerCode, center.province]),
  );
  const centersByProvince = new Map<string, number>();
  for (const centerCode of centerCodes) {
    const province = provinceByCenter.get(centerCode);
    if (province === undefined) continue;
    centersByProvince.set(province, (centersByProvince.get(province) ?? 0) + 1);
  }
  const topProvinces = [...centersByProvince.entries()]
    .map(([province, count]) => ({ province, centers: count }))
    .sort(
      (left, right) =>
        right.centers - left.centers ||
        left.province.localeCompare(right.province, "es"),
    );

  return {
    programKey: program.programKey,
    programTitle: program.programTitle,
    levelLabel: trainingLevelLabel(program.level),
    familyName: program.familyName,
    occupations: occupationsForExample,
    centersCount: centerCodes.size,
    provincesCount: topProvinces.length,
    topProvinces: topProvinces.slice(0, 3),
  };
}
