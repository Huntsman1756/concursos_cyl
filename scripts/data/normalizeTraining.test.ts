import { describe, expect, it } from "vitest";
import { normalizeTraining } from "./normalizeTraining";

const sourceRecord = {
  clave_ciclo: "IFC03S",
  nivel_educativo: "Grado Superior",
  codigo_familia: "IFC",
  familia_profesional: "Informática y Comunicaciones",
  codigo_centro: "47000000",
  centro_educativo: "IES Río Esgueva",
  provincia: "Valladolid",
  localidad: "Valladolid",
  modalidad: "Presencial",
  ciclo_formativo_curso_de_especializacion: "Desarrollo de Aplicaciones Web",
};

describe("normalizeTraining", () => {
  it("deduplicates programs and centers while retaining each offering", () => {
    const result = normalizeTraining([
      sourceRecord,
      {
        ...sourceRecord,
        clave_ciclo: "IFC02S",
        ciclo_formativo_curso_de_especializacion:
          "Administración de Sistemas Informáticos",
        modalidad: "A distancia",
      },
      sourceRecord,
    ]);

    expect(result.programs).toHaveLength(2);
    expect(result.centers).toHaveLength(1);
    expect(result.offerings).toHaveLength(2);
    expect(result.offerings.map((item) => item.modality)).toEqual([
      "distance",
      "on_site",
    ]);
  });

  it("rejects blank stable identifiers and unsupported levels", () => {
    expect(() =>
      normalizeTraining([{ ...sourceRecord, clave_ciclo: " " }]),
    ).toThrow();
    expect(() =>
      normalizeTraining([{ ...sourceRecord, nivel_educativo: "Doctorado" }]),
    ).toThrow(/unsupported training level/i);
  });
});
