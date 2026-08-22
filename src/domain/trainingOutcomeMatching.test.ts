import { describe, expect, it } from "vitest";

import type { OutcomeGroup } from "../../data/schemas/outcomes";
import type { IncomeOutcomeIndex } from "./outcomes";
import { findTrainingOutcomeGroup } from "./trainingOutcomeMatching";

function group(
  officialLabel: string,
  trainingLevel: OutcomeGroup["trainingLevel"] = "higher",
): OutcomeGroup {
  return {
    kind: "group",
    groupKey: `income-group-${officialLabel.length.toString(16).padStart(16, "0")}`,
    trainingLevel,
    officialLabel,
    sourceTableId: trainingLevel === "higher" ? "famprof_3_08" : "famprof_2_08",
  };
}

function indexWithGroups(
  groups: readonly OutcomeGroup[],
): Pick<IncomeOutcomeIndex, "groupsByKey"> {
  return {
    groupsByKey: new Map(groups.map((item) => [item.groupKey, item])),
  };
}

describe("findTrainingOutcomeGroup", () => {
  it("classifies an exact cycle before a family fallback", () => {
    const family = group("Informática y Comunicaciones");
    const cycle = group("Desarrollo de aplicaciones web");

    expect(
      findTrainingOutcomeGroup(
        {
          level: "higher",
          programTitle: "Desarrollo de Aplicaciones WEB",
          familyName: "Informática y Comunicaciones",
        },
        indexWithGroups([family, cycle]),
      ),
    ).toEqual({ group: cycle, matchType: "cycle" });
  });

  it("normalizes accents and distance suffixes", () => {
    const cycle = group("Gestión Administrativa", "intermediate");

    expect(
      findTrainingOutcomeGroup(
        {
          level: "intermediate",
          programTitle: "Gestión Administrativa (a distancia)",
          familyName: "Administración y Gestión",
        },
        indexWithGroups([cycle]),
      ),
    ).toEqual({ group: cycle, matchType: "cycle" });
  });

  it("returns a family match only when no exact cycle is published", () => {
    const family = group("INFORMÁTICA Y COMUNICACIONES");

    expect(
      findTrainingOutcomeGroup(
        {
          level: "higher",
          programTitle: "Un ciclo sin grupo propio",
          familyName: "Informática y Comunicaciones",
        },
        indexWithGroups([family]),
      ),
    ).toEqual({ group: family, matchType: "family" });
  });

  it("returns null for unsupported levels and no matches", () => {
    const available = group("Administración y Gestión");
    expect(
      findTrainingOutcomeGroup(
        {
          level: "basic",
          programTitle: "Servicios Administrativos",
          familyName: "Administración y Gestión",
        },
        indexWithGroups([available]),
      ),
    ).toBeNull();
    expect(
      findTrainingOutcomeGroup(
        {
          level: "higher",
          programTitle: "Ciclo sin correspondencia",
          familyName: "Familia inexistente",
        },
        indexWithGroups([available]),
      ),
    ).toBeNull();
  });
});
