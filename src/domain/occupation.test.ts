import { describe, expect, it } from "vitest";
import type {
  Occupation,
  OccupationAlias,
} from "../../data/schemas/curatedMappings";
import { buildOccupationIndex } from "./occupation";

const occupation: Occupation = {
  occupationId: "occupation:cno11:2713",
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  reviewedAt: "2026-08-04",
  catalogVersion: "1.0.0",
};

const aliases: OccupationAlias[] = [
  {
    alias: "desarrollador web",
    occupationId: occupation.occupationId,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    alias: "programación web",
    occupationId: occupation.occupationId,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
];

describe("controlled occupation search corpus", () => {
  it("does not search the display-only confirmation label", () => {
    const index = buildOccupationIndex([occupation], aliases);

    expect(index.search("desarrollo")).toEqual([]);
    expect(index.search("programación web")).toEqual([
      {
        occupationId: occupation.occupationId,
        preferredLabel: occupation.preferredLabel,
        confirmationLabel: occupation.confirmationLabel,
      },
    ]);
  });
});
