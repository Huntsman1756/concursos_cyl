import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const results = JSON.parse(
  await readFile(
    new URL(
      "../../analysis/fp_official_alias_pass_results.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  programs: { programKey: string; afterOfferCount: number }[];
};
const oneWordPublicationReviews = JSON.parse(
  await readFile(
    new URL(
      "../../analysis/fp_one_word_publication_reviews.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  rows: {
    form: string;
    programKey: string;
    offerId: string;
    disposition: "accepted" | "rejected" | "needs_human_review";
  }[];
  publicationDecision: Record<
    string,
    { status: "accepted" | "rejected"; acceptedOfferIds: string[] }
  >;
};

/** Historical bounded offer IDs, one per one-word publication row that was accepted and published. */
const boundedOneWordOfferIdsByProgram = new Map<string, string[]>();
for (const row of oneWordPublicationReviews.rows) {
  const decision = oneWordPublicationReviews.publicationDecision[row.form];
  if (
    row.disposition === "accepted" &&
    decision?.status === "accepted" &&
    decision.acceptedOfferIds.includes(row.offerId)
  ) {
    const offerIds = boundedOneWordOfferIdsByProgram.get(row.programKey) ?? [];
    offerIds.push(row.offerId);
    boundedOneWordOfferIdsByProgram.set(row.programKey, offerIds);
  }
}

/** Current feed IDs for EOC01M (historical + newly added offers). */
const currentEoc01mOfferIds = [
  "1285667539377",
  "1285668256621",
  "1285670018399",
];

for (const program of results.programs) {
  test(`${program.programKey} keeps the historical alias result plus bounded one-word publication`, async ({
    page,
  }) => {
    await page.goto(`/desde-fp/${program.programKey}`);

    const boundedOneWordOfferCount =
      boundedOneWordOfferIdsByProgram.get(program.programKey)?.length ?? 0;
    const boundedIds =
      boundedOneWordOfferIdsByProgram.get(program.programKey) ?? [];
    // For EOC01M the current feed has additional offers beyond the historical bounded result
    const currentOfferCount =
      program.programKey === "EOC01M"
        ? currentEoc01mOfferIds.length
        : boundedOneWordOfferCount;
    await expect(page.getByRole("article")).toHaveCount(
      program.afterOfferCount + currentOfferCount,
    );

    if (program.afterOfferCount + currentOfferCount === 0) {
      await expect(
        page.getByText(
          /No hay ofertas relacionadas en la copia de datos del/u,
        ),
      ).toBeVisible();
    }

    // Verify historical bounded IDs are a subset of rendered IDs
    if (boundedIds.length > 0) {
      const renderedIds = await page
        .getByRole("article")
        .evaluateAll((articles) =>
          articles
            .map((a) => a.getAttribute("aria-labelledby"))
            .filter((id): id is string => id !== null)
            .sort(),
        );
      for (const id of boundedIds) {
        expect(renderedIds).toContain(`offer-${id}`);
      }
    }

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
  });
}
