import { describe, expect, it } from "vitest";

import {
  EducationCenterSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import type { TrainingSourceRecord } from "../../data/schemas/trainingSource";
import { normalizeTraining } from "./normalizeTraining";

const valladolidCenter: TrainingSourceRecord = {
  clave_ciclo: "IFC03S",
  denominacion_ciclo: "Desarrollo de Aplicaciones Web",
  nivel: "Grado Superior",
  familia_profesional: "Informática y Comunicaciones",
  codigo_centro: "47000000",
  nombre_centro: "IES Río Duero",
  provincia: "Valladolid",
  localidad: "Valladolid",
  modalidad: "Presencial",
  titularidad: "Público",
  direccion: "Calle Mayor, 1",
  telefono: "983000000",
  email: "info@example.test",
  web: "https://example.test/ies-rio-duero",
};

const secondProgramAtSameCenter: TrainingSourceRecord = {
  ...valladolidCenter,
  clave_ciclo: "ADG01M",
  denominacion_ciclo: "Gestión Administrativa",
  nivel: "Grado Medio",
  familia_profesional: "Administración y Gestión",
};

describe("normalizeTraining", () => {
  it("deduplicates programs and centers while retaining each offering", () => {
    const result = normalizeTraining([
      valladolidCenter,
      secondProgramAtSameCenter,
      valladolidCenter,
    ]);

    expect(result.programs).toHaveLength(2);
    expect(result.centers).toHaveLength(1);
    expect(result.offerings).toHaveLength(2);
    expect(
      result.programs.every(
        (program) => TrainingProgramSchema.safeParse(program).success,
      ),
    ).toBe(true);
    expect(
      result.centers.every(
        (center) => EducationCenterSchema.safeParse(center).success,
      ),
    ).toBe(true);
    expect(
      result.offerings.every(
        (offering) => TrainingOfferingSchema.safeParse(offering).success,
      ),
    ).toBe(true);
  });

  it("uses official lookup values and sorts Spanish labels with stable identifiers", () => {
    const result = normalizeTraining([
      secondProgramAtSameCenter,
      valladolidCenter,
    ]);

    expect(result.programs).toMatchObject([
      {
        programKey: "IFC03S",
        level: "higher",
        familyCode: "IFC",
      },
      {
        programKey: "ADG01M",
        level: "intermediate",
        familyCode: "ADG",
      },
    ]);
    expect(result.offerings.map((offering) => offering.modality)).toEqual([
      "on_site",
      "on_site",
    ]);
  });

  it("rejects blank official training and center identifiers", () => {
    expect(() =>
      normalizeTraining([{ ...valladolidCenter, clave_ciclo: "   " }]),
    ).toThrow(/clave_ciclo/i);
    expect(() =>
      normalizeTraining([{ ...valladolidCenter, codigo_centro: "" }]),
    ).toThrow(/codigo_centro/i);
  });

  it("returns the same normalized values for equivalent input order", () => {
    const first = normalizeTraining([
      valladolidCenter,
      secondProgramAtSameCenter,
    ]);
    const second = normalizeTraining([
      secondProgramAtSameCenter,
      valladolidCenter,
    ]);

    expect(second).toEqual(first);
  });

  it("resolves duplicate stable offering identities independently of input order", () => {
    const updatedCenter = {
      ...valladolidCenter,
      nombre_centro: "IES Álamos",
    };

    const first = normalizeTraining([valladolidCenter, updatedCenter]);
    const second = normalizeTraining([updatedCenter, valladolidCenter]);

    expect(second).toEqual(first);
  });
});
