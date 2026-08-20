import { describe, expect, it } from "vitest";
import type { OutcomeGroup } from "../../../data/schemas/outcomes";
import type { IncomeOutcomeIndex } from "../../domain/outcomes";
import { findTrainingOutcomeGroup } from "./trainingOutcome";

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
  it("prefers an exact cycle group over a family fallback", () => {
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

  it("normalizes accents and distance suffixes before matching", () => {
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

  it("uses a family group only when no cycle group is published", () => {
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

  it("does not attach income groups to unsupported training levels", () => {
    expect(
      findTrainingOutcomeGroup(
        {
          level: "basic",
          programTitle: "Servicios Administrativos",
          familyName: "Administración y Gestión",
        },
        indexWithGroups([group("Administración y Gestión")]),
      ),
    ).toBeNull();
  });
});
