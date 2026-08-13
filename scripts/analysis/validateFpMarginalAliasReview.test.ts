import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import curatedAliases from "../../data/curated/occupation-aliases.json";
import { FpMarginalAliasReviewSchema } from "../../data/schemas/fpMarginalAliasReview";
import type { GeneratedManifest, JobOffer } from "../../data/schemas/generated";

const root = resolve(__dirname, "../..");

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

describe("FP marginal alias review", () => {
  it("validates a unique terminal decision for every reviewed alias", async () => {
    const artifact = FpMarginalAliasReviewSchema.parse(
      await readJson(resolve(root, "analysis/fp_marginal_alias_review.json")),
    );
    expect(artifact.rows).toHaveLength(8);
    expect(
      artifact.rows.filter((row) => row.disposition === "accepted"),
    ).toHaveLength(3);
    expect(
      artifact.rows.filter((row) => row.disposition === "deferred"),
    ).toHaveLength(4);
    expect(
      artifact.rows.filter((row) => row.disposition === "rejected"),
    ).toHaveLength(1);
  });

  it("publishes exactly the accepted decisions and no deferred or rejected alias", async () => {
    const artifact = FpMarginalAliasReviewSchema.parse(
      await readJson(resolve(root, "analysis/fp_marginal_alias_review.json")),
    );
    const published = new Set(
      curatedAliases.map(
        (alias) => `${normalized(alias.alias)}\u0000${alias.occupationId}`,
      ),
    );
    for (const row of artifact.rows) {
      const identity = `${normalized(row.alias)}\u0000${row.occupationId}`;
      expect(published.has(identity)).toBe(row.disposition === "accepted");
    }
  });

  it("pins every marginal offer to the reviewed snapshot and a bounded title phrase", async () => {
    const artifact = FpMarginalAliasReviewSchema.parse(
      await readJson(resolve(root, "analysis/fp_marginal_alias_review.json")),
    );
    const manifest = await readJson<GeneratedManifest>(
      resolve(root, "public/data/v1/manifest.json"),
    );
    const pinnedOffersPath =
      manifest.resourceSnapshots.jobOffers.resourcePath.replace(
        /\/snapshots\/[^/]+\//u,
        `/snapshots/${artifact.snapshotId}/`,
      );
    const offers = await readJson<JobOffer[]>(
      resolve(root, "public", pinnedOffersPath.slice(1)),
    );
    const offersById = new Map(offers.map((offer) => [offer.id, offer]));
    for (const row of artifact.rows) {
      const phrase = ` ${normalized(row.alias)} `;
      for (const offerId of row.marginalOfferIds) {
        const offer = offersById.get(offerId);
        expect(offer, offerId).toBeDefined();
        expect(` ${normalized(offer?.title ?? "")} `).toContain(phrase);
      }
    }
  });

  it("defers only one-token aliases and keeps accepted aliases multi-token", async () => {
    const artifact = FpMarginalAliasReviewSchema.parse(
      await readJson(resolve(root, "analysis/fp_marginal_alias_review.json")),
    );
    for (const row of artifact.rows) {
      const tokenCount = normalized(row.alias).split(" ").length;
      if (row.disposition === "deferred") expect(tokenCount).toBe(1);
      if (row.disposition === "accepted")
        expect(tokenCount).toBeGreaterThanOrEqual(2);
    }
  });
});
