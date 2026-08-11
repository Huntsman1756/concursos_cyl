import { describe, expect, it } from "vitest";

import type { TrainingProgram } from "./generated";
import {
  ProfessionalProfilesResourceSchema,
  assertCompleteProfessionalProfileCoverage,
  type ProfessionalProfile,
} from "./professionalProfiles";

const program: TrainingProgram = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones WEB",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
};

const profile: ProfessionalProfile = {
  profileId: `professional-profile:${"a".repeat(64)}`,
  ...program,
  officialTitle: "Técnico Superior en Desarrollo de Aplicaciones Web",
  outputLabel: "Programador web.",
  sourceSystem: "TodoFP",
  sourceUrl:
    "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html",
  sourceQuote: "Programador web.",
};

describe("professional profile publication gate", () => {
  it("accepts literal official profiles covering every program", () => {
    const profiles = ProfessionalProfilesResourceSchema.parse([profile]);
    expect(() =>
      assertCompleteProfessionalProfileCoverage([program], profiles),
    ).not.toThrow();
  });

  it("rejects incomplete current-program coverage", () => {
    expect(() =>
      assertCompleteProfessionalProfileCoverage(
        [program, { ...program, programKey: "IFC04S" }],
        [profile],
      ),
    ).toThrow(/incomplete \(1\/2\)/u);
  });

  it("rejects invented labels and non-official hosts", () => {
    expect(() =>
      ProfessionalProfilesResourceSchema.parse([
        {
          ...profile,
          sourceQuote: "Texto distinto.",
          sourceUrl: "https://example.com/profile",
        },
      ]),
    ).toThrow();
  });
});
