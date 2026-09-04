import { describe, expect, it } from "vitest";
import type { TrainingProgram } from "../../data/schemas/generated";
import { buildApprovedExample } from "./approvedExample";

const program: TrainingProgram = {
  programKey: "ADG02S",
  programTitle: "Administración y Finanzas",
  level: "higher",
  familyCode: "ADG",
  familyName: "Administración y Gestión",
};

// minimal typed occupation stubs matching the Occupation fields used
function occupation(id: string, label: string) {
  return { occupationId: id, preferredLabel: label };
}

const links = [
  {
    trainingProgramKey: "ADG02S",
    occupationId: "occupation:cno11:4111",
    relationshipType: "official_output",
    reviewedAt: "2026-08-12",
    sourceUrl: "https://www.todofp.es/adg/administracion-y-finanzas.html",
  },
  {
    trainingProgramKey: "ADG02S",
    occupationId: "occupation:cno11:4113",
    relationshipType: "official_output",
    reviewedAt: "2026-08-12",
    sourceUrl: "https://www.todofp.es/adg/administracion-y-finanzas.html",
  },
];

const offerings = [
  { centerCode: "47012030", programKey: "ADG02S" },
  { centerCode: "47012030", programKey: "ADG02S" }, // same center:program row
  { centerCode: "05009698", programKey: "ADG02S" },
];

const centers = [
  { centerCode: "47012030", province: "Valladolid" },
  { centerCode: "05009698", province: "Ávila" },
];

describe("approved example contract", () => {
  it("builds the ADG02S example with unique center-program rows", () => {
    const example = buildApprovedExample({
      programs: [program],
      links,
      occupations: [
        occupation("occupation:cno11:4111", "Empleados de contabilidad"),
        occupation(
          "occupation:cno11:4113",
          "Empleados de oficina de servicios estadísticos",
        ),
      ] as never,
      offerings,
      centers,
    });

    expect(example).not.toBeNull();
    expect(example?.programKey).toBe("ADG02S");
    expect(example?.centersCount).toBe(2); // 3 raw offerings → 2 unique rows
    expect(example?.provincesCount).toBe(2);
    expect(example?.topProvinces[0]).toEqual({ province: "Ávila", centers: 1 });
    expect(example?.occupations[0]?.label).toBe("Empleados de contabilidad");
    expect(example?.levelLabel).toBe("grado superior");
  });

  it("fails closed when the reviewed relationship is absent", () => {
    expect(
      buildApprovedExample({
        programs: [program],
        links: [],
        occupations: [] as never,
        offerings,
        centers,
      }),
    ).toBeNull();
  });

  it("fails closed when the program does not exist in the catalog", () => {
    expect(
      buildApprovedExample({
        programs: [],
        links,
        occupations: [] as never,
        offerings,
        centers,
      }),
    ).toBeNull();
  });

  it("fails closed when the program has no published centers", () => {
    expect(
      buildApprovedExample({
        programs: [program],
        links,
        occupations: [
          occupation("occupation:cno11:4111", "Empleados de contabilidad"),
        ] as never,
        offerings: [],
        centers,
      }),
    ).toBeNull();
  });
});
