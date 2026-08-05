import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

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
    expect(result.map((requirement) => requirement.sourceQuote)).toEqual(
      input.requirements,
    );
    expect(result.map((requirement) => requirement.normalizedValue)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
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
});
