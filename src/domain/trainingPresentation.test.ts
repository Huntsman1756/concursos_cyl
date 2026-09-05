import { describe, expect, it } from "vitest";

import type { MappingCoverage } from "../../data/schemas/curatedMappings";
import {
  featuredTrainingCoverage,
  formatProgramTitle,
} from "./trainingPresentation";

describe("featuredTrainingCoverage", () => {
  const row = (programKey: string, approvedMappings = 1, status = "reviewed") =>
    ({
      scope: "program",
      programKey,
      programTitle: programKey,
      familyCode: programKey.slice(0, 3),
      familyName: programKey.slice(0, 3),
      approvedMappings,
      draftMappings: 0,
      rejectedMappings: 0,
      uncoveredPrograms: 0,
      coverageStatus: status,
      coverageNote: "Fixture",
    }) as Extract<MappingCoverage, { scope: "program" }>;

  it("shows diverse reviewed examples instead of alphabetic first entries", () => {
    const input = [
      row("AAA01M"),
      row("IFC03S"),
      row("SSC01M"),
      row("ADG02S"),
      row("ADG02SD"),
    ];
    expect(
      featuredTrainingCoverage(input).map((item) => item.programKey),
    ).toEqual(["ADG02S", "SSC01M", "IFC03S"]);
    expect(input[0]?.programKey).toBe("AAA01M");
  });

  it("never features a preferred example without approved evidence", () => {
    const input = [
      row("ADG02S", 0),
      row("SSC01M", 2, "draft"),
      row("IFC03S"),
      row("IFC02S", 3),
      row("SAN21", 2),
    ];
    expect(
      featuredTrainingCoverage(input).map((item) => item.programKey),
    ).toEqual(["IFC03S", "SAN21"]);
    expect(featuredTrainingCoverage([])).toEqual([]);
  });
});

describe("formatProgramTitle", () => {
  it("corrects known catalog typos for display only", () => {
    expect(
      formatProgramTitle(
        "Mantenimiento y seguridad en sistemas de vehículos hibridos y eléctricos",
      ),
    ).toBe(
      "Mantenimiento y seguridad en sistemas de vehículos híbridos y eléctricos",
    );
    expect(formatProgramTitle("Desarrollo de Aplicaciones WEB")).toBe(
      "Desarrollo de Aplicaciones Web",
    );
  });

  it("leaves correct titles untouched", () => {
    expect(formatProgramTitle("Administración y Finanzas")).toBe(
      "Administración y Finanzas",
    );
    expect(formatProgramTitle("Desarrollo de Aplicaciones Web")).toBe(
      "Desarrollo de Aplicaciones Web",
    );
    expect(formatProgramTitle("Radioterapia y Dosimetría")).toBe(
      "Radioterapia y Dosimetría",
    );
  });
});
