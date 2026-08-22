import type {
  Occupation,
  TrainingOccupationLink,
} from "../../../data/schemas/curatedMappings";

export interface ResolvedOccupation {
  occupationId: string;
  preferredLabel: string;
  classificationCode: string;
  functionalBoundary?: TrainingOccupationLink["functionalBoundary"];
}

export function resolveApprovedOccupations(
  programKey: string,
  links: TrainingOccupationLink[],
  occupations: Occupation[],
): ResolvedOccupation[] {
  const occupationsById = new Map(
    occupations.map((occupation) => [occupation.occupationId, occupation]),
  );
  const seen = new Set<string>();
  const result: ResolvedOccupation[] = [];

  for (const link of links) {
    if (
      link.trainingProgramKey !== programKey ||
      link.reviewStatus !== "approved" ||
      seen.has(link.occupationId)
    ) {
      continue;
    }
    const occupation = occupationsById.get(link.occupationId);
    if (occupation === undefined) continue;
    seen.add(link.occupationId);
    result.push({
      occupationId: occupation.occupationId,
      preferredLabel: occupation.preferredLabel,
      classificationCode: occupation.classificationCode,
      ...(link.functionalBoundary === undefined
        ? {}
        : { functionalBoundary: link.functionalBoundary }),
    });
  }

  return result.sort((a, b) =>
    a.preferredLabel.localeCompare(b.preferredLabel, "es"),
  );
}
