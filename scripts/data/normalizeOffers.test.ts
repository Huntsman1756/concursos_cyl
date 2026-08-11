import { describe, expect, it } from "vitest";

import { JobOfferSchema } from "../../data/schemas/generated";
import { OfferSourceRecordSchema } from "../../data/schemas/offerSource";
import { liveOfferSourceRecord } from "../../tests/fixtures/sourceRecords";
import {
  normalizeOffers,
  normalizeOffersWithPublishedRequirements,
} from "./normalizeOffers";

const offerSourceWithRequirements = OfferSourceRecordSchema.parse({
  ...liveOfferSourceRecord,
  identificador: "08-2026-12345",
  titulo: "Desarrollador/a web",
  provincia: "Valladolid",
  localidad: "Valladolid",
  fecha_publicacion: "2026-08-03",
  fuentecontenido: "ECYL",
  descripcion:
    "<p><strong>Requisitos:</strong></p><ul><li>Carné B</li></ul><script>alert(1)</script>",
  enlace_al_contenido: "https://empleo.jcyl.es/oferta/08-2026-12345",
  actualizacionmetadatos: "2026-08-04T10:00:00.000Z",
});

describe("normalizeOffers", () => {
  it("accepts the configured employment-offers endpoint record shape", () => {
    expect(
      OfferSourceRecordSchema.safeParse(liveOfferSourceRecord).success,
    ).toBe(true);
  });

  it("sanitizes descriptions into the public offer contract without raw HTML", () => {
    const [offer] = normalizeOffers([offerSourceWithRequirements]);

    expect(offer).toMatchObject({
      id: "08-2026-12345",
      publishedAt: "2026-08-03T00:00:00.000Z",
      originalUrl: "https://empleo.jcyl.es/oferta/08-2026-12345",
      descriptionText: "Requisitos: Carné B",
      descriptionSections: { requirements: ["Carné B"] },
      sourceSnapshot: {
        sourceUpdatedAt: "2026-08-04T10:00:00.000Z",
      },
    });
    expect(JSON.stringify(offer)).not.toContain("<li>");
    expect(JSON.stringify(offer)).not.toContain("alert(1)");
    expect(JobOfferSchema.safeParse(offer).success).toBe(true);
  });

  it("keeps the strict JobOffer contract unchanged and returns requirements as a sidecar", () => {
    const source = {
      ...offerSourceWithRequirements,
      descripcion:
        "<h2>Requisitos</h2><ul><li>Permiso de conducir B.</li></ul><h2>Condiciones</h2><p>Teletrabajo.</p>",
    };

    const result = normalizeOffersWithPublishedRequirements([source]);

    expect(result.jobOffers).toHaveLength(1);
    expect(result.jobOffers[0]).not.toHaveProperty("publishedRequirements");
    expect(JobOfferSchema.safeParse(result.jobOffers[0]).success).toBe(true);
    expect(
      JobOfferSchema.safeParse({
        ...result.jobOffers[0],
        publishedRequirements: result.publishedRequirements,
      }).success,
    ).toBe(false);
    expect(result.publishedRequirements).toEqual([
      {
        offerId: "08-2026-12345",
        requirements: [
          expect.objectContaining({
            category: "driving_license_or_vehicle",
            normalizedValue: "B",
            sourceQuote: "Permiso de conducir B.",
          }),
        ],
      },
    ]);
  });

  it("keeps the record update timestamp separate from dataset snapshot provenance", () => {
    const datasetSnapshot = {
      sourceId: "jcyl-employment-offers",
      sourceUrl:
        "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records",
      sourceUpdatedAt: "2026-08-05T00:00:00.000Z",
      snapshotFetchedAt: "2026-08-06T09:00:00.000Z",
      schemaVersion: "1.0.0" as const,
      recordCount: 2,
      sha256: "b".repeat(64),
      qualityStatus: "passed" as const,
    };

    const [offer] = normalizeOffers(
      [
        {
          ...offerSourceWithRequirements,
          actualizacionmetadatos: "2026-08-04",
        },
      ],
      { datasetSnapshot },
    );

    expect(offer.sourceSnapshot.sourceUpdatedAt).not.toBe(
      datasetSnapshot.sourceUpdatedAt,
    );
    expect(offer.sourceSnapshot.sourceUpdatedAt).toBe(
      "2026-08-04T00:00:00.000Z",
    );
    expect(offer.sourceSnapshot.snapshotFetchedAt).toBe(
      "2026-08-06T09:00:00.000Z",
    );
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

  it("produces canonical order when titles differ only by accents or case, with stable id tie-break", () => {
    const result = normalizeOffers([
      { ...offerSourceWithRequirements, identificador: "10", titulo: "Código" },
      { ...offerSourceWithRequirements, identificador: "01", titulo: "codigo" },
      { ...offerSourceWithRequirements, identificador: "02", titulo: "CODIGO" },
      {
        ...offerSourceWithRequirements,
        identificador: "03",
        titulo: "Zapatero",
      },
    ]);

    expect(result.map((offer) => offer.id)).toEqual([
      "01",
      "02",
      "10",
      "03",
    ]);
  });

  it("rejects a blank official identifier", () => {
    expect(() =>
      normalizeOffers([{ ...offerSourceWithRequirements, identificador: " " }]),
    ).toThrow(/identificador.*blank/i);
  });

  it.each(["2026-02-31", "2026-02-31T10:00:00.000Z"])(
    "rejects impossible publication date %s",
    (fechaPublicacion) => {
      expect(() =>
        normalizeOffers([
          {
            ...offerSourceWithRequirements,
            fecha_publicacion: fechaPublicacion,
          },
        ]),
      ).toThrow(/fecha_publicacion.*valid date/i);
    },
  );

  it("rejects an impossible metadata update date", () => {
    expect(() =>
      normalizeOffers([
        {
          ...offerSourceWithRequirements,
          actualizacionmetadatos: "2026-02-31",
        },
      ]),
    ).toThrow(/actualizacionmetadatos.*valid date/i);
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

  it("rejects duplicate official identifiers instead of hiding collisions", () => {
    const correctedDescription = {
      ...offerSourceWithRequirements,
      descripcion: "<p>Oferta corregida.</p>",
    };

    expect(() =>
      normalizeOffers([offerSourceWithRequirements, correctedDescription]),
    ).toThrow(/duplicate.*08-2026-12345/i);
  });
});
