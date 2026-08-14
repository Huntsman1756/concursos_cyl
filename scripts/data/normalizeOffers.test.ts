import { describe, expect, it } from "vitest";
import { normalizeOffers } from "./normalizeOffers";

describe("normalizeOffers", () => {
  it("sanitizes descriptions and normalizes absent locations to null", () => {
    const [offer] = normalizeOffers(
      [
        {
          identificador: "offer-1",
          titulo: "Desarrollador web",
          provincia: " ",
          localidad: null,
          fecha_publicacion: "2026-08-14",
          fecha_actualizacion: "2026-08-14T12:00:00Z",
          nombre_fuente: "ECYL",
          descripcion:
            "<strong>Requisitos:</strong><ul><li>Carné B</li></ul><script>alert(1)</script>",
          enlace_al_contenido: "https://empleo.jcyl.es/oferta/offer-1",
        },
      ],
      { snapshotFetchedAt: "2026-08-14T13:00:00.000Z" },
    );

    expect(offer.descriptionText).toContain("Carné B");
    expect(JSON.stringify(offer)).not.toContain("<li>");
    expect(JSON.stringify(offer)).not.toContain("alert(1)");
    expect(offer.province).toBeNull();
    expect(offer.locality).toBeNull();
    expect(offer.publishedAt).toBe("2026-08-14T00:00:00.000Z");
    expect(offer.updatedAt).toBe("2026-08-14T12:00:00.000Z");
  });
});
