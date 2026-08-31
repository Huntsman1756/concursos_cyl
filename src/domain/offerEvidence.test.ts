import { describe, expect, it } from "vitest";

import {
  OfferEvidenceNextActionSchema,
  OfferEvidenceRecordSchema,
  OfferEvidenceResourceSchema,
  type OfferEvidenceRecord,
} from "../../data/schemas/offerEvidence";
import {
  filterOfferEvidenceRecords,
  offerEvidenceCategoryLabel,
  offerEvidenceStatusLabel,
  sortOfferEvidenceRecords,
} from "./offerEvidence";

function record(
  overrides: Partial<OfferEvidenceRecord> = {},
): OfferEvidenceRecord {
  return {
    offerId: "offer-1",
    title: "CUIDADORES DE PERSONAS EN INSTITUCIONES",
    occupationLabel: "CUIDADORES DE PERSONAS EN INSTITUCIONES",
    province: "Burgos",
    locality: "Burgos",
    sourceName: "ECYL",
    employer: null,
    status: "published_in_snapshot",
    publishedAt: "2026-08-18T00:00:00.000Z",
    sourceDate: "2026-08-18T00:00:00.000Z",
    freshnessDate: "2026-08-20T00:00:00.000Z",
    sourceUrl: "https://example.com/dataset",
    originalUrl: "https://example.com/offer-1",
    evidenceStatus: "ambiguous_requirement",
    hasAmbiguousRequirements: true,
    universitySignal: "none",
    universityEvidenceClass: null,
    universityEvidence: null,
    certificateRouteType: null,
    requirements: [
      {
        requirementId:
          "requirement:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        literalRequirement: "Se valorará formación relacionada.",
        normalizedCategory: "unknown",
        normalizedValue: null,
        classificationStatus: "ambiguous",
        parserRule: "unclassified.ambiguous_or_negated",
        sourceUrl: "https://example.com/offer-1",
        sourceDate: "2026-08-18T00:00:00.000Z",
      },
    ],
    relations: [],
    nextActions: [
      {
        actionType: "open_original_offer",
        targetKind: "external",
        label: "Abrir la oferta original",
        href: "https://example.com/offer-1",
        reason: "Comprobar la publicación.",
      },
    ],
    ...overrides,
  };
}

describe("offer evidence domain", () => {
  it("filters accents, status and province without changing the source records", () => {
    const records = [
      record(),
      record({ offerId: "offer-2", province: "León" }),
    ];

    expect(
      filterOfferEvidenceRecords(records, {
        query: "cuidador",
        status: "ambiguous_requirement",
        province: "Burgos",
      }).map(({ offerId }) => offerId),
    ).toEqual(["offer-1"]);
    expect(records[0]?.requirements[0]?.literalRequirement).toBe(
      "Se valorará formación relacionada.",
    );
  });

  it("sorts by publication date and then stable title/id", () => {
    const records = [
      record({
        offerId: "older",
        publishedAt: "2026-07-01T00:00:00.000Z",
        sourceDate: "2026-07-01T00:00:00.000Z",
      }),
      record({
        offerId: "newer",
        publishedAt: "2026-08-20T00:00:00.000Z",
        sourceDate: "2026-08-20T00:00:00.000Z",
      }),
    ];
    expect(
      sortOfferEvidenceRecords(records).map(({ offerId }) => offerId),
    ).toEqual(["newer", "older"]);
  });

  it("exposes only the small user-facing taxonomy", () => {
    expect(offerEvidenceStatusLabel("reviewed_fp_relationship")).toBe(
      "Relación revisada",
    );
    expect(offerEvidenceCategoryLabel("unknown")).toBe("Sin clasificar");
    expect(OfferEvidenceResourceSchema.shape.records).toBeDefined();
  });

  it("accepts an official U2 signal only when the evidence class is explicit", () => {
    const u2 = record({
      evidenceStatus: "university_or_regulatory_route",
      universitySignal: "regulated_profession_official_source",
      universityEvidenceClass: "U2",
      universityEvidence: {
        evidenceClass: "U2",
        basis: "regulated_profession_official_source",
        sourceUrl: "https://example.com/official-regulated-profession",
        sourceQuote: "La profesión está regulada.",
      },
      nextActions: [
        {
          actionType: "open_original_offer",
          targetKind: "external",
          label: "Abrir la oferta original",
          href: "https://example.com/offer-1",
          reason: "Comprobar la publicación.",
        },
        {
          actionType: "university_route",
          targetKind: "external",
          label: "Consultar la vía oficial",
          href: "https://example.com/official-regulated-profession",
          reason: "Comprobar la regulación.",
          universityEvidenceClass: "U2",
        },
      ],
    });
    expect(OfferEvidenceRecordSchema.safeParse(u2).success).toBe(true);
    expect(
      OfferEvidenceRecordSchema.safeParse({
        ...u2,
        universityEvidenceClass: null,
        universityEvidence: null,
      }).success,
    ).toBe(false);
  });

  it("requires exact official certificate evidence on certificate actions", () => {
    const certificateAction = {
      actionType: "professional_alternative" as const,
      targetKind: "internal" as const,
      label: "Explorar certificados profesionales",
      href: "/recursos",
      reason: "La oferta menciona una credencial.",
      caveat: "No equivale automáticamente a un título de FP.",
      certificateRouteType: "occupation_related_alternative" as const,
      certificateEvidence: [
        {
          certificateCode: "SSCS0208",
          certificateTitle:
            "ATENCIÓN SOCIOSANITARIA A PERSONAS DEPENDIENTES EN INSTITUCIONES SOCIALES",
          authoritativeSourceUrl:
            "https://sede.sepe.gob.es/es/portaltrabaja/resources/pdf/especialidades/SSCS0208.pdf",
          sourceQuote: ". Certificado de Profesionalidad.",
          relevance: "Alternativa relacionada, no requisito satisfecho.",
        },
      ],
    };
    expect(
      OfferEvidenceNextActionSchema.safeParse(certificateAction).success,
    ).toBe(true);
    expect(
      OfferEvidenceNextActionSchema.safeParse({
        ...certificateAction,
        certificateEvidence: undefined,
      }).success,
    ).toBe(false);
  });
});
