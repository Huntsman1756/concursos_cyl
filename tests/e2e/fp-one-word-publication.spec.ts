import { readFile } from "node:fs/promises";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicationReviews = JSON.parse(
  await readFile(
    new URL(
      "../../analysis/fp_one_word_publication_reviews.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  publicationDecision: Record<
    string,
    { status: string; acceptedOfferIds: string[] }
  >;
};
const hotOfferIds = (["cocinero", "cocineros"] as const).flatMap((form) => {
  const decision = publicationReviews.publicationDecision[form];
  if (decision === undefined || decision.status !== "rejected") {
    throw new Error(`Expected ${form} to be rejected.`);
  }
  return [];
});
const encofradoresDecision =
  publicationReviews.publicationDecision.encofradores;
if (
  encofradoresDecision === undefined ||
  encofradoresDecision.status !== "accepted"
) {
  throw new Error("Expected encofradores to be accepted.");
}

/** Historical accepted offer IDs from the bounded publication review snapshot. */
const historicalEoc01mAcceptedIds = encofradoresDecision.acceptedOfferIds;
/** Current feed IDs for EOC01M (historical + newly added offers). */
const currentEoc01mOfferIds = [
  "1285667539377",
  "1285668256621",
  "1285670018399",
];

const cases = [
  {
    programKey: "HOT01M",
    offerIds: hotOfferIds,
  },
  {
    programKey: "EOC01M",
    offerIds: currentEoc01mOfferIds,
  },
];

for (const { programKey, offerIds } of cases) {
  test(`${programKey} exposes its bounded publication result`, async ({
    page,
  }) => {
    await page.goto(`/desde-fp/${programKey}`);

    await expect(page.getByRole("article")).toHaveCount(offerIds.length);
    const renderedArticleIds = await page
      .getByRole("article")
      .evaluateAll((articles) =>
        articles
          .map((article) => article.getAttribute("aria-labelledby"))
          .filter((id): id is string => id !== null)
          .sort(),
      );
    expect(renderedArticleIds).toEqual(
      offerIds.map((offerId) => `offer-${offerId}`).sort(),
    );
    // Verify historical bounded accepted IDs are a subset of rendered IDs
    if (programKey === "EOC01M") {
      for (const id of historicalEoc01mAcceptedIds) {
        expect(renderedArticleIds).toContain(`offer-${id}`);
      }
    }

    const manifestOffers = await page.evaluate(
      async (expectedIds) => {
        const manifest = (await (
          await fetch("/data/v1/manifest.json")
        ).json()) as {
          resourceSnapshots: { jobOffers: { resourcePath: string } };
        };
        const offers = (await (
          await fetch(manifest.resourceSnapshots.jobOffers.resourcePath)
        ).json()) as { id: string }[];
        return offers
          .filter((offer) => expectedIds.includes(offer.id))
          .map((offer) => offer.id)
          .sort();
      },
      [...offerIds],
    );
    expect(manifestOffers).toEqual([...offerIds].sort());
    if (offerIds.length === 0) {
      await expect(
        page.getByText(
          /No hay ofertas relacionadas en la instant\u00e1nea del/u,
        ),
      ).toBeVisible();
      await expect(
        page.getByText(/no hay (empleo|trabajo|puestos)/iu),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole("heading", { name: "ENCOFRADORES" }),
      ).toHaveCount(offerIds.length);
    }

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(
      axe.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      ),
      JSON.stringify(axe.violations, null, 2),
    ).toEqual([]);
  });
}
