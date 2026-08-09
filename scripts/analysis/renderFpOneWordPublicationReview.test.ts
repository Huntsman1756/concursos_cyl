import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertRenderedFpOneWordPublicationReview,
  renderValidatedFpOneWordPublicationReview,
  renderFpOneWordPublicationReview,
} from "./renderFpOneWordPublicationReview";

const ROOT = resolve(import.meta.dirname, "../..");

describe("renderFpOneWordPublicationReview", () => {
  it("renders the exact terminal 67-offer audit from validated JSON", () => {
    const report = renderFpOneWordPublicationReview(ROOT);
    const checkedIn = readFileSync(
      resolve(ROOT, "analysis/fp_one_word_publication_reviews.md"),
      "utf8",
    );

    expect(checkedIn).toBe(report);
    expect(renderFpOneWordPublicationReview(ROOT)).toBe(report);
    expect(report.endsWith("\n")).toBe(true);
    expect(report).toContain("67 ofertas auditadas.");
    expect(report).toContain("`cocinero`: 0 aceptadas; 1 rechazada.");
    expect(report).toContain("`cocineros`: 30 aceptadas; 10 rechazadas.");
    expect(report).toContain("`albañil`: 1 aceptada; 1 rechazada.");
    expect(report).toContain("`albañiles`: 20 aceptadas; 2 rechazadas.");
    expect(report).toContain("`encofradores`: 2 aceptadas; 0 rechazadas.");
    expect(report).toContain("Albañil-Conductor/a");
    expect(report).toContain(
      "No se aprueba ninguna regla general de coincidencia de una sola palabra.",
    );
    expect(report).toContain(
      "Solo `encofradores` puede publicarse condicionalmente",
    );
  });

  it("rejects every stale byte variation", () => {
    expect(() =>
      assertRenderedFpOneWordPublicationReview("stale", "rendered\n"),
    ).toThrow(/validated rendered/i);
    expect(() =>
      assertRenderedFpOneWordPublicationReview("rendered\r\n", "rendered\n"),
    ).toThrow(/validated rendered/i);
    expect(() =>
      assertRenderedFpOneWordPublicationReview("rendered\n\n", "rendered\n"),
    ).toThrow(/validated rendered/i);
  });

  it("derives the total and publication conclusion from a terminal decision fixture", () => {
    const fixture = structuredClone(
      JSON.parse(
        readFileSync(
          resolve(ROOT, "analysis/fp_one_word_publication_reviews.json"),
          "utf8",
        ),
      ),
    );
    fixture.rows = fixture.rows.slice(0, 1);
    fixture.publicationDecision = {
      cocinero: {
        status: "accepted",
        acceptedOfferIds: [fixture.rows[0].offerId],
        rejectedOfferIds: [],
        reason: "Accepted offers are eligible for publication.",
      },
      cocineros: {
        status: "rejected",
        acceptedOfferIds: [],
        rejectedOfferIds: [],
        reason: "No offers are approved for publication.",
      },
      albañil: {
        status: "rejected",
        acceptedOfferIds: [],
        rejectedOfferIds: [],
        reason: "No offers are approved for publication.",
      },
      albañiles: {
        status: "rejected",
        acceptedOfferIds: [],
        rejectedOfferIds: [],
        reason: "No offers are approved for publication.",
      },
      encofradores: {
        status: "rejected",
        acceptedOfferIds: [],
        rejectedOfferIds: [],
        reason: "No offers are approved for publication.",
      },
    };
    expect(renderValidatedFpOneWordPublicationReview(fixture)).toContain(
      "1 ofertas auditadas.",
    );
  });
});
