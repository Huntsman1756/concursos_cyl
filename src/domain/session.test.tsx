import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { JobOffer } from "../../data/schemas/generated";
import {
  deriveActions,
  type AddSessionCheckAction,
  type ActionContext,
} from "./actionEngine";
import {
  publishedRequirementId,
  type PublishedRequirement,
} from "./requirements";
import { useDecisionSession } from "./session";

function fixture(offerId: string, quote: string) {
  const offer: JobOffer = {
    id: offerId,
    title: "Oferta",
    province: "León",
    locality: "León",
    publishedAt: "2026-08-01T00:00:00.000Z",
    sourceName: "ECYL",
    descriptionText: quote,
    descriptionSections: {
      summary: [],
      functions: [],
      requirements: [quote],
      conditions: [],
      application: [],
      other: [],
    },
    originalUrl: `https://empleo.jcyl.es/${offerId.replace(":", "-")}`,
    sourceSnapshot: {
      sourceId: "ofertas-de-empleo",
      sourceUrl: "https://datosabiertos.jcyl.es/ofertas-de-empleo",
      sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
      snapshotFetchedAt: "2026-08-02T00:00:00.000Z",
      schemaVersion: "1.0.0",
      recordCount: 1,
      sha256: "a".repeat(64),
      qualityStatus: "passed",
    },
  };
  const requirement: PublishedRequirement = {
    id: publishedRequirementId(
      offerId,
      "certificate_or_regulated_license",
      quote,
    ),
    category: "certificate_or_regulated_license",
    normalizedValue: "food_handler",
    sourceQuote: quote,
    parserRule: "certificate.food_handler",
    parserVersion: "1.0.0",
  };
  const context: ActionContext = {
    offer,
    evidenceState: "declared_explicit_gap",
    requirements: [requirement],
    answers: { [requirement.id]: "lacks" },
  };
  const action = deriveActions(context).find(
    (candidate): candidate is AddSessionCheckAction =>
      candidate.actionType === "add_session_check",
  );
  if (!action) throw new Error("Missing engine-issued checklist action.");
  return { requirement, action };
}

const first = fixture("offer:1", "Carné de manipulador de alimentos.");
const second = fixture("offer:2", "Certificado de manipulador de alimentos.");

afterEach(() => vi.restoreAllMocks());

describe("useDecisionSession", () => {
  it("stores exact answers and clears them", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => result.current.answerRequirement(first.requirement, "lacks"));
    expect(result.current.answers).toEqual({ [first.requirement.id]: "lacks" });
    act(() => result.current.clearSession());
    expect(result.current.answers).toEqual({});
  });

  it("accepts only the actual engine-issued action, deduplicates it and removes it", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => {
      result.current.addChecklistItem(first.action);
      result.current.addChecklistItem(first.action);
    });
    expect(result.current.checklist).toEqual([first.action.checklistItem]);
    act(() =>
      result.current.removeChecklistItem(first.action.checklistItem.id),
    );
    expect(result.current.checklist).toEqual([]);
  });

  it("rejects clones and reconstructed self-consistent public payloads", () => {
    const { result } = renderHook(() => useDecisionSession());
    const clone = structuredClone(first.action);
    expect(() => act(() => result.current.addChecklistItem(clone))).toThrow(
      /engine-issued/iu,
    );
    expect(() =>
      act(() => result.current.addChecklistItem({ ...first.action })),
    ).toThrow(/engine-issued/iu);
    expect(() =>
      act(() =>
        result.current.addChecklistItem(
          JSON.parse(JSON.stringify(first.action)) as AddSessionCheckAction,
        ),
      ),
    ).toThrow(/engine-issued/iu);
    expect(result.current.checklist).toEqual([]);
  });

  it("rejects mutation before first insert and safely reuses the intact issued action", () => {
    const { result } = renderHook(() => useDecisionSession());
    expect(() => {
      (first.action.requirementAudit as { sourceQuote: string }).sourceQuote =
        "Mutación previa";
    }).toThrow(TypeError);
    expect(() => {
      (first.action.checklistItem as { label: string }).label =
        "Mutación previa";
    }).toThrow(TypeError);
    act(() => result.current.addChecklistItem(first.action));
    expect(result.current.checklist).toEqual([first.action.checklistItem]);
  });

  it("preserves concurrent distinct engine-issued checks and rejects duplicates", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => {
      result.current.addChecklistItem(first.action);
      result.current.addChecklistItem(second.action);
      result.current.addChecklistItem(first.action);
    });
    expect(result.current.checklist).toEqual([
      first.action.checklistItem,
      second.action.checklistItem,
    ]);
  });

  it("never writes storage, network, beacon or history state", () => {
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const fetchSpy = vi.spyOn(window, "fetch");
    const beacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: beacon,
    });
    const pushState = vi.spyOn(history, "pushState");
    const replaceState = vi.spyOn(history, "replaceState");
    const { result } = renderHook(() => useDecisionSession());
    act(() => {
      result.current.answerRequirement(first.requirement, "has");
      result.current.addChecklistItem(first.action);
    });
    expect(storage).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("starts empty after remount and clearSession resets the checklist", () => {
    const firstMount = renderHook(() => useDecisionSession());
    act(() => firstMount.result.current.addChecklistItem(first.action));
    firstMount.unmount();
    const secondMount = renderHook(() => useDecisionSession());
    expect(secondMount.result.current.answers).toEqual({});
    expect(secondMount.result.current.checklist).toEqual([]);
    act(() => {
      secondMount.result.current.addChecklistItem(first.action);
      secondMount.result.current.clearSession();
    });
    expect(secondMount.result.current.checklist).toEqual([]);
  });
});
