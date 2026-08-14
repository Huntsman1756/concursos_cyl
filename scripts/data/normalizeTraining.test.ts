import { describe, expect, it } from "vitest";
import { normalizeTraining } from "./normalizeTraining";

const sourceRecord = {
  clave_ciclo: "IFC03S",
  nombre_ciclo: "Desarrollo de Aplicaciones Web",
  nivel: "Grado Superior",
  familia_profesional_codigo: "IFC",
  familia_profesional_nombre: "Informática y Comunicaciones",
  codigo_centro: "47000000",
  nombre_centro: "IES Río Esgueva",
  provincia: "Valladolid",
  localidad: "Valladolid",
  modalidad: "Presencial",
};

describe("normalizeTraining", () => {
  it("deduplicates programs and centers while retaining each offering", () => {
    const result = normalizeTraining([
      sourceRecord,
      {
        ...sourceRecord,
        clave_ciclo: "IFC02S",
        nombre_ciclo: "Administración de Sistemas Informáticos",
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
      normalizeTraining([{ ...sourceRecord, nivel: "Doctorado" }]),
    ).toThrow(/unsupported training level/i);
  });
});
