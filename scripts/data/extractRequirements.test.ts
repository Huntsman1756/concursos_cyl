import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PublishedRequirementSchema,
  publishedRequirementId,
} from "../../src/domain/requirements";
import {
  PublishedRequirementsResourceSchema,
  extractPublishedRequirements,
} from "./extractRequirements";

interface RequirementFixture {
  offerId: string;
  requirements: string[];
}

function fixture(name: string): RequirementFixture {
  return JSON.parse(
    readFileSync(
      resolve("tests", "fixtures", "requirements", `${name}.json`),
      "utf8",
    ),
  ) as RequirementFixture;
}

function description(requirements: readonly string[]) {
  return {
    sections: {
      summary: ["Permiso de conducir B."],
      functions: ["Se conducirán vehículos."],
      requirements: [...requirements],
      conditions: ["Teletrabajo tres días por semana."],
      application: [],
      other: ["Inglés B2."],
    },
  };
}

describe("extractPublishedRequirements", () => {
  it.each([
    "Permiso de conducir B si el puesto lo requiere.",
    "Permiso de conducir B si procede.",
    "Permiso de conducir B si aplica.",
    "Permiso de conducir B si cabe.",
    "Permiso de conducir B en su caso.",
    "Permiso de conducir B cuando proceda.",
    "Permiso de conducir B cuando corresponda.",
    "Permiso de conducir B cuando aplique.",
    "Experiencia mínima de 2 años siempre que sea posible.",
    "Experiencia mínima de 2 años de poder ser.",
    "Experiencia mínima de 2 años; se podría valorar.",
    "Experiencia mínima de 2 años; se podrían valorar.",
    "Experiencia mínima de 2 años: podría valorarse.",
    "Experiencia mínima de 2 años: podrían valorarse.",
    "• PERMISO DE CONDUCIR B, SI PROCEDE.",
    "SI TIENE permiso de conducir B.",
  ])("fails closed for extended conditional prose: %s", (sourceQuote) => {
    expect(
      extractPublishedRequirements(
        "offer:extended-conditional",
        description([sourceQuote]),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "unclassified",
        normalizedValue: null,
        parserRule: "unclassified.ambiguous_or_negated",
        sourceQuote,
      }),
    ]);
  });

  it.each([
    "Sí, se requiere permiso de conducir B.",
    "SÍ: SE REQUIERE PERMISO DE CONDUCIR B.",
    "• Sí; se requiere permiso de conducir B.",
    "- SÍ, permiso de conducir B obligatorio.",
  ])("keeps accented affirmative driving requirements: %s", (sourceQuote) => {
    expect(
      extractPublishedRequirements(
        "offer:affirmative",
        description([sourceQuote]),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "driving_license_or_vehicle",
        normalizedValue: "B",
        parserRule: "license.driving_b",
        sourceQuote,
      }),
    ]);
  });

  it.each([
    [
      "Observaciones: Se requiere carné de conducir clase B",
      "license.driving_b",
    ],
    ["Carnet de conducir B en vigor.", "license.driving_b"],
    ["Permiso de conducción B y vehículo propio.", "license.driving_b"],
    [
      "Vehículo propio para acudir al centro de trabajo.",
      "mobility.own_vehicle",
    ],
    ["Graduado en ESO o equivalente.", "qualification.official_title"],
    ["Nivel C1 o superior de Español", "language.cefr"],
    ["Idiomas: Castellano (nivel C1).", "language.cefr"],
    ["Horarios en turnos rotativos de lunes a sábados.", "schedule.weekends"],
    [
      "Disponibilidad para trabajar en turnos rotativos de mañana, tarde y noche.",
      "schedule.night_shifts",
    ],
  ])(
    "keeps explicit live requirement grammar: %s",
    (sourceQuote, parserRule) => {
      expect(
        extractPublishedRequirements(
          "offer:live-grammar",
          description([sourceQuote]),
        ),
      ).toEqual([
        expect.objectContaining({
          parserRule,
          sourceQuote,
        }),
      ]);
    },
  );

  it.each([
    "Permiso de conducir B bajo criterio empresarial.",
    "Experiencia mínima de 2 años según circunstancias futuras.",
  ])(
    "fails closed when recognized evidence has unknown residue: %s",
    (sourceQuote) => {
      expect(
        extractPublishedRequirements(
          "offer:unknown-residue",
          description([sourceQuote]),
        ),
      ).toEqual([
        expect.objectContaining({
          category: "unclassified",
          normalizedValue: null,
          parserRule: "unclassified.ambiguous_or_negated",
        }),
      ]);
    },
  );

  it("preserves exact quote bytes and exports the canonical SHA-256 ID", () => {
    const offerId = "offer:exact-bytes";
    const sourceQuote = "  Permiso de conducir B.  ";
    const separator = String.fromCharCode(0);
    const expectedId = `requirement:${createHash("sha256")
      .update(
        `${offerId}${separator}driving_license_or_vehicle${separator}${sourceQuote}`,
      )
      .digest("hex")}`;

    expect(
      publishedRequirementId(
        offerId,
        "driving_license_or_vehicle",
        sourceQuote,
      ),
    ).toBe(expectedId);
    expect(
      extractPublishedRequirements(offerId, description([sourceQuote])),
    ).toEqual([
      expect.objectContaining({
        id: expectedId,
        sourceQuote,
      }),
    ]);
  });

  it.each([
    "Experiencia mínima de 2 años, si fuera posible.",
    "Experiencia mínima de 2 años, si fuese posible.",
    "Experiencia mínima de 2 años; se valorase.",
    "La valoraríamos: experiencia mínima de 2 años.",
    "Experiencia mínima de 2 años, de ser posible.",
    "Permiso de conducir B en caso de disponer de él.",
    "Permiso de conducir B en caso de tenerlo.",
    "Si dispone de permiso de conducir B.",
    "Si dispusiera de permiso de conducir B.",
    "Si tiene permiso de conducir B.",
    "Si tuviera permiso de conducir B.",
    "Permiso de conducir B en caso de contar con él.",
    "• SI DISPUSIERA de permiso de conducir B.",
    "Experiencia mínima de 2 años; SE VALORASEN.",
  ])("fails closed for clause-bound conditional prose: %s", (sourceQuote) => {
    expect(
      extractPublishedRequirements(
        "offer:conditional",
        description([sourceQuote]),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "unclassified",
        normalizedValue: null,
        parserRule: "unclassified.ambiguous_or_negated",
        sourceQuote,
      }),
    ]);
  });

  it.each([
    "Experiencias valorables: experiencia mínima de 2 años.",
    "• EXPERIENCIAS VALORABLES: experiencia mínima de 2 años.",
    "Titulaciones valorables: Grado en Derecho.",
    "Se valoraría permiso de conducir B.",
    "Se valorarían inglés B2 y modalidad híbrida.",
    "No hace falta carné de manipulador de alimentos.",
    "No hace falta vehículo propio.",
    "Certificados opcionales: carné de manipulador de alimentos.",
    "Idiomas preferibles: inglés B2.",
    "Turnos deseables: disponibilidad horaria.",
    "Vehículos valorados: vehículo propio.",
  ])("fails closed for review-round optional prose: %s", (sourceQuote) => {
    expect(
      extractPublishedRequirements(
        "offer:review-optional",
        description([sourceQuote]),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "unclassified",
        normalizedValue: null,
        parserRule: "unclassified.ambiguous_or_negated",
        sourceQuote,
      }),
    ]);
  });

  it.each([
    ["Permiso de conducir B sin restricciones.", "B", "license.driving_b"],
    ["Permiso de conducir B sin incidencias.", "B", "license.driving_b"],
    [
      "Experiencia mínima de 2 años sin interrupciones.",
      24,
      "experience.years",
    ],
    ["Experiencia mínima de 2 años sin limitaciones.", 24, "experience.years"],
  ])(
    "keeps mandatory prose structured when sin does not negate the requirement: %s",
    (sourceQuote, normalizedValue, parserRule) => {
      expect(
        extractPublishedRequirements(
          "offer:mandatory-sin",
          description([sourceQuote as string]),
        ),
      ).toEqual([
        expect.objectContaining({
          normalizedValue,
          parserRule,
          sourceQuote,
        }),
      ]);
    },
  );

  it("does not treat the standalone adjective preferente as optional", () => {
    expect(
      extractPublishedRequirements(
        "offer:preferente",
        description(["Permiso de conducir B para centro preferente."]),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "driving_license_or_vehicle",
        normalizedValue: "B",
        parserRule: "license.driving_b",
      }),
    ]);
  });

  it.each(fixture("ambiguous").requirements.slice(0, 20))(
    "fails closed for guarded requirement prose: %s",
    (sourceQuote) => {
      expect(
        extractPublishedRequirements(
          "offer:guarded",
          description([sourceQuote]),
        ),
      ).toEqual([
        expect.objectContaining({
          category: "unclassified",
          normalizedValue: null,
          parserRule: "unclassified.ambiguous_or_negated",
          sourceQuote,
        }),
      ]);
    },
  );

  it("extracts qualifications and regulated credentials from exact quotes", () => {
    const input = fixture("qualification");

    expect(
      extractPublishedRequirements(
        input.offerId,
        description(input.requirements),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "qualification_or_specialization",
        normalizedValue: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
        sourceQuote: input.requirements[0],
        parserRule: "qualification.official_title",
        parserVersion: "1.0.0",
      }),
      expect.objectContaining({
        category: "certificate_or_regulated_license",
        normalizedValue: "professional_registration",
        sourceQuote: input.requirements[1],
        parserRule: "certificate.professional_registration",
      }),
    ]);
  });

  it("normalizes explicit experience durations to months", () => {
    const input = fixture("experience");

    expect(
      extractPublishedRequirements(
        input.offerId,
        description(input.requirements),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "experience",
        normalizedValue: 6,
        parserRule: "experience.months",
        sourceQuote: input.requirements[0],
      }),
      expect.objectContaining({
        category: "experience",
        normalizedValue: 24,
        parserRule: "experience.years",
        sourceQuote: input.requirements[1],
      }),
    ]);
  });

  it("extracts licence, CEFR, schedule and mobility evidence conservatively", () => {
    const input = fixture("license-language-mobility");

    expect(
      extractPublishedRequirements(
        input.offerId,
        description(input.requirements),
      ),
    ).toEqual([
      expect.objectContaining({
        category: "driving_license_or_vehicle",
        normalizedValue: "B",
        parserRule: "license.driving_b",
        sourceQuote: input.requirements[0],
      }),
      expect.objectContaining({
        category: "language",
        normalizedValue: "inglés:B2",
        parserRule: "language.cefr",
        sourceQuote: input.requirements[1],
      }),
      expect.objectContaining({
        category: "schedule_availability",
        normalizedValue: "night_shifts",
        parserRule: "schedule.night_shifts",
        sourceQuote: input.requirements[2],
      }),
      expect.objectContaining({
        category: "mobility_or_work_mode",
        normalizedValue: "hybrid",
        parserRule: "work_mode.hybrid",
        sourceQuote: input.requirements[3],
      }),
      expect.objectContaining({
        category: "mobility_or_work_mode",
        normalizedValue: "travel",
        parserRule: "mobility.travel",
        sourceQuote: input.requirements[4],
      }),
    ]);
  });

  it("keeps ambiguous, optional, negated and conflicting prose unclassified", () => {
    const input = fixture("ambiguous");
    const result = extractPublishedRequirements(
      input.offerId,
      description(input.requirements),
    );

    expect(result).toHaveLength(input.requirements.length);
    expect(
      result.every((requirement) => requirement.category === "unclassified"),
    ).toBe(true);
    expect(
      result
        .slice(0, 20)
        .every(
          (requirement) =>
            requirement.parserRule === "unclassified.ambiguous_or_negated",
        ),
    ).toBe(true);
    expect(result.map((requirement) => requirement.sourceQuote)).toEqual(
      input.requirements,
    );
    expect(
      result.every((requirement) => requirement.normalizedValue === null),
    ).toBe(true);
  });

  it("does not infer requirements from non-requirement sections or absence", () => {
    expect(extractPublishedRequirements("offer:none", description([]))).toEqual(
      [],
    );
  });

  it("uses boundaries and supports accents, casing, punctuation and list markers", () => {
    const result = extractPublishedRequirements(
      "offer:boundaries",
      description([
        "• CARNÉ DE CONDUCIR B.",
        "Trabajo presencial.",
        "Experiencialmente aprenderá con el equipo.",
        "Nivel inglés b2.",
      ]),
    );

    expect(result).toEqual([
      expect.objectContaining({
        category: "driving_license_or_vehicle",
        normalizedValue: "B",
        sourceQuote: "• CARNÉ DE CONDUCIR B.",
      }),
      expect.objectContaining({
        category: "mobility_or_work_mode",
        normalizedValue: "on_site",
        sourceQuote: "Trabajo presencial.",
      }),
      expect.objectContaining({
        category: "unclassified",
        sourceQuote: "Experiencialmente aprenderá con el equipo.",
      }),
      expect.objectContaining({
        category: "language",
        normalizedValue: "inglés:B2",
        sourceQuote: "Nivel inglés b2.",
      }),
    ]);
  });

  it("deduplicates exact repeated items and keeps deterministic source order", () => {
    const first = extractPublishedRequirements(
      "offer:stable",
      description([
        "Experiencia mínima de 6 meses.",
        "Permiso de conducir B.",
        "Experiencia mínima de 6 meses.",
      ]),
    );
    const second = extractPublishedRequirements(
      "offer:stable",
      description(["Permiso de conducir B.", "Experiencia mínima de 6 meses."]),
    );

    expect(first.map(({ sourceQuote }) => sourceQuote)).toEqual([
      "Experiencia mínima de 6 meses.",
      "Permiso de conducir B.",
    ]);
    expect(new Set(first.map(({ id }) => id)).size).toBe(2);
    expect(
      Object.fromEntries(first.map(({ sourceQuote, id }) => [sourceQuote, id])),
    ).toEqual(
      Object.fromEntries(
        second.map(({ sourceQuote, id }) => [sourceQuote, id]),
      ),
    );
  });

  it("rejects duplicate offer keys in the additive resource contract", () => {
    expect(() =>
      PublishedRequirementsResourceSchema.parse([
        { offerId: "offer:1", requirements: [] },
        { offerId: "offer:1", requirements: [] },
      ]),
    ).toThrow(/offer id.*unique/i);
  });

  it.each([
    {
      id: `requirement:${"a".repeat(64)}`,
      category: "experience",
      normalizedValue: "12",
      sourceQuote: "Experiencia mínima de 1 año.",
      parserRule: "experience.years",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"b".repeat(64)}`,
      category: "driving_license_or_vehicle",
      normalizedValue: "vehicle_owned",
      sourceQuote: "Permiso de conducir B.",
      parserRule: "license.driving_b",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"c".repeat(64)}`,
      category: "language",
      normalizedValue: "inglés:B9",
      sourceQuote: "Inglés B9.",
      parserRule: "language.cefr",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"d".repeat(64)}`,
      category: "unclassified",
      normalizedValue: "B",
      sourceQuote: "Texto ambiguo.",
      parserRule: "unclassified.conservative_fallback",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"e".repeat(64)}`,
      category: "qualification_or_specialization",
      normalizedValue: "Grado en Derecho",
      sourceQuote: "Grado en Derecho.",
      parserRule: "license.driving_b",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"f".repeat(64)}`,
      category: "certificate_or_regulated_license",
      normalizedValue: "food_handler",
      sourceQuote: "Colegiación vigente.",
      parserRule: "certificate.professional_registration",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"0".repeat(64)}`,
      category: "schedule_availability",
      normalizedValue: "weekends",
      sourceQuote: "Turnos de noche.",
      parserRule: "schedule.night_shifts",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"1".repeat(64)}`,
      category: "mobility_or_work_mode",
      normalizedValue: "hybrid",
      sourceQuote: "Trabajo remoto.",
      parserRule: "work_mode.remote",
      parserVersion: "1.0.0",
    },
  ])("rejects contradictory published requirement %#", (requirement) => {
    expect(PublishedRequirementSchema.safeParse(requirement).success).toBe(
      false,
    );
  });

  it.each([12, 24])(
    "accepts %i months for an experience.years normalized value",
    (normalizedValue) => {
      expect(
        PublishedRequirementSchema.safeParse({
          id: `requirement:${"2".repeat(64)}`,
          category: "experience",
          normalizedValue,
          sourceQuote: "Experiencia mínima de 2 años.",
          parserRule: "experience.years",
          parserVersion: "1.0.0",
        }).success,
      ).toBe(true);
    },
  );

  it.each([13, 18])(
    "rejects %i months for an experience.years normalized value",
    (normalizedValue) => {
      expect(
        PublishedRequirementSchema.safeParse({
          id: `requirement:${"3".repeat(64)}`,
          category: "experience",
          normalizedValue,
          sourceQuote: "Experiencia ambigua.",
          parserRule: "experience.years",
          parserVersion: "1.0.0",
        }).success,
      ).toBe(false);
    },
  );

  it.each([
    {
      id: `requirement:${"4".repeat(64)}`,
      category: "qualification_or_specialization",
      normalizedValue: "Grado en Derecho",
      sourceQuote: " ",
      parserRule: "qualification.official_title",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"5".repeat(64)}`,
      category: "qualification_or_specialization",
      normalizedValue: " ",
      sourceQuote: "Grado en Derecho.",
      parserRule: "qualification.official_title",
      parserVersion: "1.0.0",
    },
    {
      id: `requirement:${"6".repeat(64)}`,
      category: "certificate_or_regulated_license",
      normalizedValue: " ",
      sourceQuote: "Certificado de profesionalidad.",
      parserRule: "certificate.professional_certificate",
      parserVersion: "1.0.0",
    },
  ])("rejects whitespace-only requirement strings %#", (requirement) => {
    expect(PublishedRequirementSchema.safeParse(requirement).success).toBe(
      false,
    );
  });

  it("rejects blank offer IDs and format-valid forged requirement IDs", () => {
    const requirement = {
      id: `requirement:${"7".repeat(64)}`,
      category: "driving_license_or_vehicle",
      normalizedValue: "B",
      sourceQuote: "Permiso de conducir B.",
      parserRule: "license.driving_b",
      parserVersion: "1.0.0",
    };

    expect(
      PublishedRequirementsResourceSchema.safeParse([
        { offerId: " ", requirements: [requirement] },
      ]).success,
    ).toBe(false);
    expect(
      PublishedRequirementsResourceSchema.safeParse([
        { offerId: "offer:forged", requirements: [requirement] },
      ]).success,
    ).toBe(false);
  });
});
