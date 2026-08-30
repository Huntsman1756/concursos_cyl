import { describe, expect, it } from "vitest";

import { buildOfferEvidenceResource } from "./buildOfferEvidenceSnapshot";

describe("buildOfferEvidenceSnapshot", () => {
  it("rebuilds the complete candidate without widening reviewed coverage", async () => {
    const resource = await buildOfferEvidenceResource();

    expect(resource.baseSnapshotId).toBe("20260822085631889-fc9bf2ba23f9");
    expect(resource.records).toHaveLength(1058);
    expect(resource.counts.offerCount).toBe(1058);
    expect(resource.records.every(({ employer }) => employer === null)).toBe(
      true,
    );
    expect(new Set(resource.records.map(({ offerId }) => offerId)).size).toBe(
      1058,
    );

    const forestOffers = resource.records.filter(
      ({ title }) => title === "PEONES FORESTALES",
    );
    expect(forestOffers).toHaveLength(3);
    expect(
      forestOffers.every(({ relations }) =>
        relations.some(
          ({ programKey, occupationId, matchRule }) =>
            programKey === "AGA03B" &&
            occupationId === "occupation:cno11:9543" &&
            matchRule === "reviewed_title_alias_exact",
        ),
      ),
    ).toBe(true);

    const cookingOffers = resource.records.filter(({ offerId }) =>
      ["1285659376390", "1285671836252"].includes(offerId),
    );
    expect(cookingOffers).toHaveLength(2);
    expect(
      cookingOffers.every(
        ({ requirements, relations }) =>
          requirements.some(
            ({
              normalizedCategory,
              classificationStatus,
              literalRequirement,
            }) =>
              normalizedCategory === "fp" &&
              classificationStatus === "reviewed" &&
              literalRequirement.toLocaleLowerCase("es-ES").includes("cocina"),
          ) &&
          relations.some(
            ({ programKey, matchRule }) =>
              programKey === "HOT01M" &&
              matchRule === "reviewed_exact_program_title",
          ),
      ),
    ).toBe(true);

    const certificateOffer = resource.records.find(
      ({ offerId }) => offerId === "1285625266971",
    );
    expect(certificateOffer?.evidenceStatus).toBe(
      "alternative_vocational_route",
    );
    expect(
      certificateOffer?.requirements.some(
        ({ normalizedCategory, literalRequirement }) =>
          normalizedCategory === "certificate" &&
          literalRequirement.includes("Certificado de Profesionalidad"),
      ),
    ).toBe(true);
    expect(
      certificateOffer?.nextActions.some(
        ({ actionType, caveat, certificateEvidence }) =>
          actionType === "professional_alternative" &&
          caveat?.includes("no equivale automáticamente a un título de FP") &&
          certificateEvidence?.some(
            ({ certificateCode, authoritativeSourceUrl, relevance }) =>
              certificateCode === "SSCS0208" &&
              authoritativeSourceUrl.includes("SSCS0208.pdf") &&
              relevance.includes("literal de la oferta"),
          ),
      ),
    ).toBe(true);
    const relatedCertificateOffer = resource.records.find(
      ({ offerId }) => offerId === "1285670904240",
    );
    expect(
      relatedCertificateOffer?.nextActions.some(
        ({ actionType, certificateRouteType, certificateEvidence }) =>
          actionType === "professional_alternative" &&
          certificateRouteType === "occupation_related_alternative" &&
          certificateEvidence?.some(
            ({ certificateCode, authoritativeSourceUrl, relevance }) =>
              certificateCode === "SSCS0208" &&
              authoritativeSourceUrl.includes("SSCS0208.pdf") &&
              relevance.includes("alternativa relacionada"),
          ),
      ),
    ).toBe(true);

    const ambiguousOffer = resource.records.find(
      ({ offerId }) => offerId === "1285666486875",
    );
    expect(ambiguousOffer?.evidenceStatus).toBe("ambiguous_requirement");
    expect(ambiguousOffer?.hasAmbiguousRequirements).toBe(true);
    expect(
      ambiguousOffer?.requirements.some(
        ({ normalizedCategory, classificationStatus }) =>
          normalizedCategory === "unknown" &&
          classificationStatus === "unclassified",
      ),
    ).toBe(true);
    expect(
      ambiguousOffer?.nextActions.some(
        ({ actionType }) => actionType === "university_route",
      ),
    ).toBe(false);

    const universityOffer = resource.records.find(
      ({ offerId }) => offerId === "1285640580510",
    );
    expect(universityOffer?.evidenceStatus).toBe(
      "university_or_regulatory_route",
    );
    expect(universityOffer?.universitySignal).toBe("literal_offer_requirement");
    expect(universityOffer?.universityEvidenceClass).toBe("U1");
    expect(universityOffer?.universityEvidence?.sourceQuote).toBe(
      "Grado en Fisioterapia.",
    );
    expect(
      universityOffer?.nextActions.some(
        ({ actionType, caveat, universityEvidenceClass }) =>
          actionType === "university_route" &&
          universityEvidenceClass === "U1" &&
          caveat?.includes("No inferimos equivalencias"),
      ),
    ).toBe(true);

    const titleOnlyUniversityOffer = resource.records.find(
      ({ offerId }) => offerId === "1285672143052",
    );
    expect(titleOnlyUniversityOffer?.universitySignal).toBe(
      "title_only_unverified",
    );
    expect(titleOnlyUniversityOffer?.universityEvidenceClass).toBeNull();
    expect(
      titleOnlyUniversityOffer?.nextActions.some(
        ({ actionType }) => actionType === "university_route",
      ),
    ).toBe(false);

    const unsupportedOffer = resource.records.find(
      ({ offerId }) => offerId === "1285667273467",
    );
    expect(unsupportedOffer?.evidenceStatus).toBe("no_reviewed_relationship");
    expect(
      unsupportedOffer?.nextActions.some(({ actionType }) =>
        [
          "view_fp_route",
          "professional_alternative",
          "university_route",
        ].includes(actionType),
      ),
    ).toBe(false);

    expect(
      resource.records.every(({ nextActions }) => nextActions.length > 0),
    ).toBe(true);
    expect(resource.counts.offersWithReviewedFpRelationship).toBe(138);
    expect(resource.counts.offersWithAmbiguity).toBe(352);
    expect(resource.counts.universitySignalCount).toBe(235);
    expect(resource.counts.universityAcceptedRecordCount).toBe(6);
    expect(resource.counts.titleOnlyUniversitySignalCount).toBe(229);
    expect(resource.counts.universityEvidenceClassCounts).toEqual({
      U1: 6,
      U2: 0,
      U3: 0,
    });
    expect(resource.counts.accreditationActionCount).toBe(26);
    expect(resource.counts.certificateOfferAcceptanceCount).toBe(2);
    expect(resource.counts.certificateAlternativeRouteCount).toBe(1);
  }, 30_000);
});
