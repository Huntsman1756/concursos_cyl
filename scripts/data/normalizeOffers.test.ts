import { describe, expect, it } from "vitest";

import { JobOfferSchema } from "../../data/schemas/generated";
import type { OfferSourceRecord } from "../../data/schemas/offerSource";
import { normalizeOffers } from "./normalizeOffers";

const offerSourceWithRequirements: OfferSourceRecord = {
  identificador: "08-2026-12345",
  titulo: "Desarrollador/a web",
  provincia: "Valladolid",
  localidad: "Valladolid",
  fecha_publicacion: "2026-08-03",
  fuente: "ECYL",
  descripcion:
    "<p><strong>Requisitos:</strong></p><ul><li>Carné B</li></ul><script>alert(1)</script>",
  enlace_al_contenido: "https://empleo.jcyl.es/oferta/08-2026-12345",
  fecha_actualizacion: "2026-08-04T10:00:00.000Z",
};

describe("normalizeOffers", () => {
  it("sanitizes descriptions into the public offer contract without raw HTML", () => {
    const [offer] = normalizeOffers([offerSourceWithRequirements]);

    expect(offer).toMatchObject({
      id: "08-2026-12345",
      publishedAt: "2026-08-03T00:00:00.000Z",
      originalUrl: "https://empleo.jcyl.es/oferta/08-2026-12345",
      descriptionText: "Requisitos: Carné B",
      descriptionSections: { requirements: ["Carné B"] },
      sourceSnapshot: { sourceUpdatedAt: "2026-08-04T10:00:00.000Z" },
    });
    expect(JSON.stringify(offer)).not.toContain("<li>");
    expect(JSON.stringify(offer)).not.toContain("alert(1)");
    expect(JobOfferSchema.safeParse(offer).success).toBe(true);
  });

  it("normalizes missing locations to null instead of empty strings", () => {
    const [offer] = normalizeOffers([
      { ...offerSourceWithRequirements, provincia: " ", localidad: null },
    ]);

    expect(offer.province).toBeNull();
    expect(offer.locality).toBeNull();
  });

  it("orders offers by Spanish title and stable official identifier", () => {
    const result = normalizeOffers([
      { ...offerSourceWithRequirements, identificador: "2", titulo: "Álbum" },
      { ...offerSourceWithRequirements, identificador: "1", titulo: "Álbum" },
      {
        ...offerSourceWithRequirements,
        identificador: "3",
        titulo: "Zarzuela",
      },
    ]);

    expect(result.map((offer) => offer.id)).toEqual(["1", "2", "3"]);
  });

  it("returns deterministic normalized data for equivalent input order", () => {
    const first = normalizeOffers([
      offerSourceWithRequirements,
      {
        ...offerSourceWithRequirements,
        identificador: "09-2026-00001",
        titulo: "Álbum",
      },
    ]);
    const second = normalizeOffers([
      {
        ...offerSourceWithRequirements,
        identificador: "09-2026-00001",
        titulo: "Álbum",
      },
      offerSourceWithRequirements,
    ]);

    expect(second).toEqual(first);
  });

  it("resolves duplicate official identifiers independently of input order", () => {
    const correctedDescription = {
      ...offerSourceWithRequirements,
      descripcion: "<p>Oferta corregida.</p>",
    };

    const first = normalizeOffers([
      offerSourceWithRequirements,
      correctedDescription,
    ]);
    const second = normalizeOffers([
      correctedDescription,
      offerSourceWithRequirements,
    ]);

    expect(second).toEqual(first);
  });
});
