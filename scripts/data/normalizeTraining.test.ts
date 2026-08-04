import { describe, expect, it } from "vitest";

import {
  EducationCenterSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import { TrainingSourceRecordSchema } from "../../data/schemas/trainingSource";
import { liveTrainingSourceRecord } from "../../tests/fixtures/sourceRecords";
import { normalizeTraining } from "./normalizeTraining";

const valladolidCenter = TrainingSourceRecordSchema.parse({
  ...liveTrainingSourceRecord,
  clave_ciclo: "IFC03S",
  ciclo_formativo_curso_de_especializacion: "Desarrollo de Aplicaciones Web",
  nivel_educativo: "Grado Superior",
  familia_profesional: "Informática y Comunicaciones",
  codigo_familia: "IFC",
  codigo_centro: "47000000",
  centro_educativo: "IES Río Duero",
  provincia: "Valladolid",
  localidad: "Valladolid",
  direccion_centro: "Calle Mayor, 1",
  telefono: "983000000",
  e_mail: "info@example.test",
  web: "https://example.test/ies-rio-duero",
});

const secondProgramAtSameCenter = {
  ...valladolidCenter,
  clave_ciclo: "ADG01M",
  ciclo_formativo_curso_de_especializacion: "Gestión Administrativa",
  nivel_educativo: "Grado Medio",
  familia_profesional: "Administración y Gestión",
  codigo_familia: "ADG",
};

describe("normalizeTraining", () => {
  it("accepts the configured FP endpoint record shape", () => {
    expect(
      TrainingSourceRecordSchema.safeParse(liveTrainingSourceRecord).success,
    ).toBe(true);
  });

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

  it("accepts the live Curso Especialización level label", () => {
    const result = normalizeTraining([
      {
        ...valladolidCenter,
        nivel_educativo: "Curso Especialización",
      },
    ]);

    expect(result.programs[0]?.level).toBe("specialization");
  });

  it("normalizes recoverable websites and drops malformed optional URLs", () => {
    const bareHost = normalizeTraining([
      { ...valladolidCenter, web: "www.centrodonbosco.es" },
    ]);
    const malformed = normalizeTraining([
      {
        ...valladolidCenter,
        web: "http://:iesfuentesnuevas.centros.educa.jcyl.es",
      },
    ]);

    expect(bareHost.centers[0]?.website).toBe("https://www.centrodonbosco.es/");
    expect(malformed.centers[0]?.website).toBeNull();
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
      centro_educativo: "IES Álamos",
    };

    const first = normalizeTraining([valladolidCenter, updatedCenter]);
    const second = normalizeTraining([updatedCenter, valladolidCenter]);

    expect(second).toEqual(first);
    expect(first.centers[0]?.centerName).toBe("IES Álamos");
  });
});
