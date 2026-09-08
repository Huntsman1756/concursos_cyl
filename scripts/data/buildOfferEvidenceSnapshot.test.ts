import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildOfferEvidenceResource } from "./buildOfferEvidenceSnapshot";

describe("buildOfferEvidenceSnapshot", () => {
  it("uses reviewed exact SISPE titles without treating related university occupations as FP", async () => {
    const resource = await buildOfferEvidenceResource();
    for (const [title, key] of [
      ["COCINEROS, EN GENERAL", "HOT01M"],
      ["CAMAREROS, EN GENERAL", "HOT02M"],
      ["AUXILIARES DE ENFERMERÍA", "SAN21"],
      [
        "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
        "SSC01M",
      ],
    ]) {
      const offers = resource.records.filter(
        (record) => record.title === title,
      );
      expect(offers.length).toBeGreaterThan(0);
      expect(
        offers.every((record) =>
          record.relations.some(
            (relation) =>
              relation.programKey === key &&
              relation.matchRule === "reviewed_title_alias_exact",
          ),
        ),
      ).toBe(true);
    }
    for (const title of [
      "ENFERMEROS DE CUIDADOS GENERALES",
      "FISIOTERAPEUTAS, EN GENERAL",
      "TERAPEUTAS OCUPACIONALES",
    ]) {
      const offers = resource.records.filter(
        (record) => record.title === title,
      );
      expect(offers.length).toBeGreaterThan(0);
      expect(offers.every((record) => record.relations.length === 0)).toBe(
        true,
      );
    }
  }, 30_000);

  it("rejects an exact-title review that bypasses the approved FP relation", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "salida-title-review-"));
    try {
      const review = JSON.parse(
        await readFile("data/curated/offer-evidence-reviews.json", "utf8"),
      );
      review.reviews[0].programKey = "HOT01M";
      const reviewCatalogPath = join(temporary, "review.json");
      await writeFile(reviewCatalogPath, JSON.stringify(review));
      await expect(
        buildOfferEvidenceResource({ reviewCatalogPath }),
      ).rejects.toThrow(/no approved FP relation/u);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it("rebuilds the complete candidate without widening reviewed coverage", async () => {
    const resource = await buildOfferEvidenceResource({
      manifestPath: "docs/contest/manifest-20260830-historical.json",
      reviewCatalogPath: "data/curated/offer-evidence-reviews-20260830.json",
    });

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
        ({ actionType, caveat }) =>
          actionType === "professional_alternative" &&
          caveat?.includes("no equivale automáticamente a un título de FP"),
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
      ({ title }) => title === "FISIOTERAPEUTAS, EN GENERAL",
    );
    expect(universityOffer?.evidenceStatus).toBe(
      "university_or_regulatory_route",
    );
    expect(
      universityOffer?.nextActions.some(
        ({ actionType, caveat }) =>
          actionType === "university_route" &&
          caveat?.includes("No inferimos equivalencias"),
      ),
    ).toBe(true);

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
    expect(resource.counts.offersWithReviewedFpRelationship).toBe(135);
    expect(resource.counts.offersWithAmbiguity).toBe(352);
  }, 30_000);
});
