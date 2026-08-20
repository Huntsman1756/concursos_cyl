import { createHash } from "node:crypto";

import type {
  Occupation,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import type { TrainingProgram } from "../../data/schemas/generated";
import {
  DerivedFpOccupationGraphResourceSchema,
  type DerivedFpOccupationRow,
} from "../../data/schemas/openData";

const CSV_COLUMNS = [
  "program_key",
  "program_title",
  "training_level",
  "family_code",
  "family_name",
  "occupation_id",
  "cno11_code",
  "occupation_label",
  "relationship_type",
  "source_url",
  "source_quote",
  "reviewed_at",
  "mapping_version",
] as const;

function csvCell(value: string): string {
  const spreadsheetSafe = /^[=+\-@]/u.test(value) ? `'${value}` : value;
  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}

export function buildDerivedFpOccupationGraph(
  programs: readonly TrainingProgram[],
  occupations: readonly Occupation[],
  links: readonly TrainingOccupationLink[],
): DerivedFpOccupationRow[] {
  const programByKey = new Map(
    programs.map((program) => [program.programKey, program]),
  );
  const occupationById = new Map(
    occupations.map((occupation) => [occupation.occupationId, occupation]),
  );

  return DerivedFpOccupationGraphResourceSchema.parse(
    links
      .filter((link) => link.reviewStatus === "approved")
      .map((link) => {
        const program = programByKey.get(link.trainingProgramKey);
        const occupation = occupationById.get(link.occupationId);
        if (program === undefined || occupation === undefined) {
          throw new Error(
            `Derived graph cannot resolve ${link.trainingProgramKey} -> ${link.occupationId}.`,
          );
        }
        return {
          programKey: program.programKey,
          programTitle: program.programTitle,
          trainingLevel: program.level,
          familyCode: program.familyCode,
          familyName: program.familyName,
          occupationId: occupation.occupationId,
          cno11Code: occupation.classificationCode,
          occupationLabel: occupation.preferredLabel,
          relationshipType: link.relationshipType,
          sourceUrl: link.sourceUrl,
          sourceQuote: link.sourceQuote,
          reviewedAt: link.reviewedAt,
          mappingVersion: link.mappingVersion,
        };
      })
      .sort((left, right) =>
        `${left.programKey}:${left.cno11Code}`.localeCompare(
          `${right.programKey}:${right.cno11Code}`,
          "es",
        ),
      ),
  );
}

export function serializeDerivedFpOccupationGraphCsv(
  rows: readonly DerivedFpOccupationRow[],
): string {
  const body = rows.map((row) =>
    [
      row.programKey,
      row.programTitle,
      row.trainingLevel,
      row.familyCode,
      row.familyName,
      row.occupationId,
      row.cno11Code,
      row.occupationLabel,
      row.relationshipType,
      row.sourceUrl,
      row.sourceQuote,
      row.reviewedAt,
      row.mappingVersion,
    ]
      .map(csvCell)
      .join(","),
  );
  return `\uFEFF${CSV_COLUMNS.join(",")}\n${body.join("\n")}\n`;
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
