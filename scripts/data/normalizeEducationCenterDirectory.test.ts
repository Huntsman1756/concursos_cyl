import { describe, expect, it } from "vitest";

import { normalizeEducationCenterDirectory } from "./normalizeEducationCenterDirectory";

const sourceRecord = {
  curso_academico: "2025",
  codigo: "05009923",
  situacion: "ALTA" as const,
  naturaleza: "PÚBLICO" as const,
  denominacion_generica: "CENTRO INTEGRADO DE FORMACIÓN PROFESIONAL",
  denominacion_especifica: "LAS FERRERÍAS",
  provincia: "AVILA",
  municipio: "ARENAS DE SAN PEDRO",
  localidad: "ARENAS DE SAN PEDRO",
  c_postal: 5400,
  correo_electronico: "05009923@educa.jcyl.es",
  web: "http://cifparenasdesanpedro.centros.educa.jcyl.es/",
  coord_longitud: -5.08499,
  coord_latitud: 40.21005,
  internado: "N" as const,
  comedor: "S" as const,
  transporte: "S" as const,
};

describe("education center directory normalization", () => {
  it("preserves the official center identity, coordinates and services", () => {
    expect(normalizeEducationCenterDirectory([sourceRecord])).toEqual([
      {
        academicYear: "2025",
        centerCode: "05009923",
        ownership: "public",
        centerType: "CENTRO INTEGRADO DE FORMACIÓN PROFESIONAL",
        centerName: "LAS FERRERÍAS",
        province: "AVILA",
        municipality: "ARENAS DE SAN PEDRO",
        locality: "ARENAS DE SAN PEDRO",
        postalCode: "05400",
        email: "05009923@educa.jcyl.es",
        website: "http://cifparenasdesanpedro.centros.educa.jcyl.es/",
        latitude: 40.21005,
        longitude: -5.08499,
        hasBoarding: false,
        hasCanteen: true,
        hasTransport: true,
      },
    ]);
  });

  it("rejects duplicate center codes and half coordinates", () => {
    expect(() =>
      normalizeEducationCenterDirectory([sourceRecord, sourceRecord]),
    ).toThrow(/duplicate/i);
    expect(() =>
      normalizeEducationCenterDirectory([
        { ...sourceRecord, coord_longitud: null },
      ]),
    ).toThrow(/coordinates/i);
  });
});
