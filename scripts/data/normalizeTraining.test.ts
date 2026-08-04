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

  it("retains official rows that differ by teaching type in the stable identity", () => {
    const common = {
      ...valladolidCenter,
      clave_ciclo: "AFD02M",
      ciclo_formativo_curso_de_especializacion:
        "Guía en el Medio Natural y de Tiempo Libre",
      familia_profesional: "Actividades Físicas y Deportivas",
      codigo_familia: "AFD",
      codigo_centro: "47011115",
      centro_educativo: "RÍO DUERO",
      titularidad_centro: "Privada",
      modalidad: "Presencial",
    };

    const result = normalizeTraining([
      { ...common, tipo_ensenanza: "Concertada" },
      { ...common, tipo_ensenanza: "Privada" },
    ]);

    expect(result.offerings).toHaveLength(2);
    expect(result.offerings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          offeringId: "AFD02M:47011115:on_site:concerted:private",
          teachingType: "concerted",
          centerOwnership: "private",
        }),
        expect.objectContaining({
          offeringId: "AFD02M:47011115:on_site:private:private",
          teachingType: "private",
          centerOwnership: "private",
        }),
      ]),
    );
  });

  it("reconciles canonical program metadata by normalized majority and reports material conflicts", () => {
    const common = {
      ...valladolidCenter,
      clave_ciclo: "INA01M",
      ciclo_formativo_curso_de_especializacion:
        "Panadería, Repostería y Confitería",
      familia_profesional: "Industrias Alimentarias",
      codigo_familia: "INA",
    };
    const records = [
      {
        ...common,
        codigo_centro: "09012163",
        codigo_familia: "HOT",
      },
      {
        ...common,
        codigo_centro: "34003831",
        ciclo_formativo_curso_de_especializacion:
          "  Panadería,   Repostería y Confitería  ",
      },
      {
        ...common,
        codigo_centro: "24018775",
        ciclo_formativo_curso_de_especializacion:
          "panadería, repostería y confitería",
      },
    ];

    const result = normalizeTraining(records);
    const reversed = normalizeTraining([...records].reverse());
    const canonicalProgram = result.programs[0];

    expect(reversed).toEqual(result);
    expect(canonicalProgram).toMatchObject({
      programKey: "INA01M",
      programTitle: "Panadería, Repostería y Confitería",
      familyCode: "INA",
      familyName: "Industrias Alimentarias",
    });
    expect(result.reconciliationAnomalies).toEqual([
      {
        entityType: "program",
        entityId: "INA01M",
        field: "familyCode",
        selectedValue: "INA",
        candidates: [
          { value: "INA", count: 2 },
          { value: "HOT", count: 1 },
        ],
      },
    ]);

    const centers = new Map(
      result.centers.map((item) => [item.centerCode, item]),
    );
    for (const item of result.offerings) {
      expect(item).toMatchObject(canonicalProgram!);
      const referencedCenter = centers.get(item.centerCode)!;
      expect(item).toMatchObject({
        centerCode: referencedCenter.centerCode,
        centerName: referencedCenter.centerName,
        province: referencedCenter.province,
        locality: referencedCenter.locality,
        centerOwnership: referencedCenter.centerOwnership,
      });
    }
  });

  it("treats phone-number spacing as equivalent canonical evidence", () => {
    const records = [
      { ...valladolidCenter, telefono: "983 47 1600" },
      { ...valladolidCenter, telefono: "983 471 600" },
    ];

    const result = normalizeTraining(records);
    expect(normalizeTraining([...records].reverse())).toEqual(result);
    expect(
      result.reconciliationAnomalies.filter(
        (anomaly) => anomaly.field === "phone",
      ),
    ).toEqual([]);
  });
});
