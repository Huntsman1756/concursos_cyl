import { describe, expect, it } from "vitest";

import { formatProgramTitle } from "./trainingPresentation";

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
