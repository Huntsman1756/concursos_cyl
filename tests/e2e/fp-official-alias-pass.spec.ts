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

const fallbackOfferIdsByProgram: Record<string, string[]> = {
  HOT01M: ["1285671836252"],
  SSC01M: [
    "1285620653126",
    "1285629158396",
    "1285631739680",
    "1285637975976",
    "1285640948901",
    "1285643274420",
    "1285646840496",
    "1285647687060",
    "1285651638453",
    "1285654004126",
    "1285656209312",
    "1285658994748",
    "1285660030053",
    "1285660489054",
    "1285660519315",
    "1285661179988",
    "1285661241095",
    "1285662467522",
    "1285662467588",
    "1285663192909",
    "1285664934729",
    "1285664976346",
    "1285665099048",
    "1285665756044",
    "1285665756072",
    "1285666004800",
    "1285666076349",
    "1285666076377",
    "1285666076442",
    "1285666137989",
    "1285666442663",
    "1285667211360",
    "1285667211388",
    "1285667891829",
    "1285668051299",
    "1285668877533",
    "1285669380182",
    "1285669380247",
    "1285669484226",
    "1285670055297",
    "1285670055466",
    "1285670082044",
    "1285670314991",
    "1285670583569",
    "1285670583597",
    "1285670802553",
    "1285671046460",
    "1285671206652",
    "1285671248506",
    "1285671557433",
    "1285671867754",
    "1285671920706",
    "1285672104200",
    "1285672131085",
    "1285672164768",
    "1285672205408",
    "1285672244571",
    "1285672244599",
    "1285672481412",
  ],
  EOC01M: ["1285667539377", "1285673429524", "1285674513041"],
};

for (const program of results.programs) {
  test(`${program.programKey} keeps the historical alias result plus bounded one-word publication`, async ({
    page,
  }) => {
    await page.goto(`/desde-fp/${program.programKey}`);

    const boundedIds =
      boundedOneWordOfferIdsByProgram.get(program.programKey) ?? [];
    const fallbackOfferIds =
      fallbackOfferIdsByProgram[program.programKey] ?? [];
    await expect(page.getByRole("article")).toHaveCount(
      Math.min(fallbackOfferIds.length, 8),
    );

    if (fallbackOfferIds.length === 0) {
      await expect(
        page
          .locator(".status-panel")
          .getByText(/0 ofertas con correspondencia validada/u),
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
      for (const id of boundedIds.filter((id) =>
        fallbackOfferIds.includes(id),
      )) {
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
