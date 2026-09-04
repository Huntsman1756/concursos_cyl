import { describe, expect, it } from "vitest";

import {
  capitalizeFirst,
  formatEducationalLevel,
  formatOfferTitle,
  formatOccupationLabel,
  longDate,
  longDateFromCalendarDay,
  parseDateValue,
  readableOfficialTitle,
  tidyPunctuation,
} from "./displayFormat";

describe("parseDateValue", () => {
  it("parses ISO instants", () => {
    expect(parseDateValue("2026-08-22T00:00:00.000Z")).not.toBeNull();
  });

  it("returns null for invalid and blank input", () => {
    expect(parseDateValue("no es una fecha")).toBeNull();
    expect(parseDateValue("")).toBeNull();
    expect(parseDateValue("   ")).toBeNull();
  });
});

describe("longDate", () => {
  it("formats the standard citizen-facing long date", () => {
    expect(longDate("2026-08-22T00:00:00.000Z")).toBe("22 de agosto de 2026");
  });

  it("keeps UTC so the day does not shift with the local zone", () => {
    expect(longDate("2026-01-01T00:30:00.000Z")).toBe("1 de enero de 2026");
  });

  it("returns an empty string instead of 'Invalid Date'", () => {
    expect(longDate("not-a-date")).toBe("");
  });
});

describe("longDateFromCalendarDay", () => {
  it("formats a bare calendar day without timezone drift", () => {
    expect(longDateFromCalendarDay("2026-08-22")).toBe("22 de agosto de 2026");
    expect(longDateFromCalendarDay("2026-12-31")).toBe(
      "31 de diciembre de 2026",
    );
  });

  it("returns null for missing values", () => {
    expect(longDateFromCalendarDay(null)).toBeNull();
  });
});

describe("tidyPunctuation", () => {
  it("removes whitespace before : and ;", () => {
    expect(
      tidyPunctuation("Relaciones revisadas : copia del 22 ago 2026"),
    ).toBe("Relaciones revisadas: copia del 22 ago 2026");
    expect(tidyPunctuation("30 ago 2026 ; siguiente dato")).toBe(
      "30 ago 2026; siguiente dato",
    );
  });

  it("preserves the interpunto separator with its surrounding spaces", () => {
    expect(tidyPunctuation("León · Burgos · Palencia")).toBe(
      "León · Burgos · Palencia",
    );
  });

  it("collapses duplicated spaces", () => {
    expect(tidyPunctuation("Dato  doble   espacio")).toBe("Dato doble espacio");
  });
});

describe("formatEducationalLevel", () => {
  it("uses sentence-style citizen labels", () => {
    expect(formatEducationalLevel("basic")).toBe("grado básico");
    expect(formatEducationalLevel("intermediate")).toBe("grado medio");
    expect(formatEducationalLevel("higher")).toBe("grado superior");
    expect(formatEducationalLevel("specialization")).toBe(
      "curso de especialización",
    );
  });
});

describe("readableOfficialTitle", () => {
  it("preserves acronym-like tokens in all-caps official titles", () => {
    expect(readableOfficialTitle("ATS/DUE (2023/24/25)")).toBe(
      "ATS/DUE (2023/24/25)",
    );
  });

  it("title-cases long words and lowercases stopwords", () => {
    expect(readableOfficialTitle("TÉCNICO EN CUIDADOS DE ANIMALES")).toBe(
      "Técnico en Cuidados de Animales",
    );
  });

  it("leaves mixed-case titles untouched", () => {
    expect(readableOfficialTitle("Curso de inventario")).toBe(
      "Curso de inventario",
    );
  });
});

describe("capitalizeFirst", () => {
  it("uppercases only the first letter", () => {
    expect(capitalizeFirst("grado medio")).toBe("Grado medio");
    expect(capitalizeFirst("")).toBe("");
  });
});

describe("formatOccupationLabel", () => {
  it("normalizes the generic common noun Web to sentence-style lowercase", () => {
    // Official CNO-11 catalog literal (data/curated/official-occupations.json)
    // capitalizes "Web"; the curated catalog and the selector use "web".
    expect(
      formatOccupationLabel(
        "Analistas, programadores y diseñadores Web y multimedia",
      ),
    ).toBe("Analistas, programadores y diseñadores web y multimedia");
  });

  it("leaves already sentence-style labels untouched", () => {
    expect(
      formatOccupationLabel(
        "Analistas, programadores y diseñadores web y multimedia",
      ),
    ).toBe("Analistas, programadores y diseñadores web y multimedia");
  });

  it("does not rewrite words that merely contain web", () => {
    expect(formatOccupationLabel("Técnico en webmastering")).toBe(
      "Técnico en webmastering",
    );
  });
});

describe("formatOfferTitle", () => {
  it("reduces ALL-CAPS source titles to a readable display form", () => {
    expect(formatOfferTitle("PEÓN DE ALMACÉN")).toBe("Peón de Almacén");
  });

  it("preserves real acronyms and official abbreviations", () => {
    expect(formatOfferTitle("AYTO. DE BURGOS: ATS/DUE")).toBe(
      "Ayto. de Burgos: ATS/DUE",
    );
    expect(formatOfferTitle("PROGRAMADOR HTML CSS SQL")).toBe(
      "Programador HTML CSS SQL",
    );
    expect(formatOfferTitle("TÉCNICO FP DIGITALIZACIÓN")).toContain("FP");
  });

  it("leaves mixed-case titles untouched", () => {
    expect(formatOfferTitle("Empleado administrativo de contabilidad")).toBe(
      "Empleado administrativo de contabilidad",
    );
  });
});
