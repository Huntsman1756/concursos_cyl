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
for (const form of ["cocinero", "cocineros"] as const) {
  const decision = publicationReviews.publicationDecision[form];
  if (decision === undefined || decision.status !== "rejected") {
    throw new Error(`Expected ${form} to be rejected.`);
  }
}
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
/** IDs present in the current verified fallback snapshot. */
const currentEoc01mOfferIds = [
  "1285667539377",
  "1285668256621",
  "1285671523023",
];
/** Current candidate IDs accepted from the literal published requirement review. */
const currentHot01mOfferIds = ["1285659376390", "1285671836252"];

const cases = [
  {
    programKey: "HOT01M",
    offerIds: currentHot01mOfferIds,
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
      for (const id of historicalEoc01mAcceptedIds.filter((id) =>
        offerIds.includes(id),
      )) {
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
        page
          .locator(".status-panel")
          .getByText(/0 ofertas con correspondencia validada/u),
      ).toBeVisible();
      await expect(
        page.getByText(/no hay (empleo|trabajo|puestos)/iu),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole("heading", {
          name:
            programKey === "HOT01M" ? "COCINEROS, EN GENERAL" : "ENCOFRADORES",
        }),
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
