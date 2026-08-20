import { describe, expect, it } from "vitest";

import { normalizePublicEmploymentCalls } from "./normalizePublicEmployment";

describe("normalizePublicEmploymentCalls", () => {
  it("keeps actionable fields, strips HTML and identifies open access", () => {
    const [call] = normalizePublicEmploymentCalls([
      {
        identificador: 1285,
        titulo: "Ayudante Técnico de Laboratorio",
        clasificador: "Turno Libre / Ingreso Libre",
        organismo_gestor: "Consejería de Educación",
        numeroplazas: 8,
        municipio: "Valladolid",
        fecha_de_inicio: "2026-07-28",
        fechafinalizacion: "2026-08-24",
        requisitos_necesarios: "<p>Título exigido</p>",
        plazo_de_presentacion: "20 días hábiles",
        urlenlaceaplicacion: null,
        actualizacionmetadatos: "2026-08-17",
        enlace_al_contenido: "https://empleopublico.jcyl.es/convocatoria/1285",
      },
    ]);

    expect(call).toMatchObject({
      id: "1285",
      places: 8,
      requirements: "Título exigido",
      accessType: "open",
      applicationDeadline: "2026-08-24",
    });
  });
});
