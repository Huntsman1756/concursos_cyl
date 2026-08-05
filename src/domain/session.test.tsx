import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  publishedRequirementId,
  type PublishedRequirement,
} from "./requirements";
import { sessionChecklistId } from "./actionEngine";
import { useDecisionSession } from "./session";

const requirement: PublishedRequirement = {
  id: publishedRequirementId(
    "offer:1",
    "experience",
    "Experiencia de 12 meses.",
  ),
  category: "experience",
  normalizedValue: 12,
  sourceQuote: "Experiencia de 12 meses.",
  parserRule: "experience.months",
  parserVersion: "1.0.0",
};

const checklistAction = {
  actionType: "add_session_check" as const,
  targetKind: "in_memory_checklist" as const,
  datasetKey: "browser-memory" as const,
  label: "Añadir a comprobaciones de esta sesión" as const,
  explanation: "No hay una acción automática fiable disponible." as const,
  offerId: "offer:1",
  checklistItem: {
    id: sessionChecklistId("offer:1", requirement.id),
    offerId: "offer:1",
    requirementId: requirement.id,
    sourceActionType: "add_session_check" as const,
    label: "Comprobar «Experiencia de 12 meses.» en la oferta oficial",
  },
  requirementAudit: {
    requirementId: requirement.id,
    sourceQuote: requirement.sourceQuote,
    parserRule: requirement.parserRule,
  },
};

afterEach(() => vi.restoreAllMocks());

describe("useDecisionSession", () => {
  it("stores only exact answers for schema-valid requirements and clears them", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => result.current.answerRequirement(requirement, "lacks"));
    expect(result.current.answers).toEqual({ [requirement.id]: "lacks" });
    act(() => result.current.clearSession());
    expect(result.current.answers).toEqual({});
  });

  it("stores source-backed checklist actions, deduplicates and removes them", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => result.current.addChecklistItem(checklistAction));
    act(() => result.current.addChecklistItem(checklistAction));
    expect(result.current.checklist).toHaveLength(1);

    act(() =>
      result.current.removeChecklistItem(checklistAction.checklistItem.id),
    );
    expect(result.current.checklist).toEqual([]);
  });

  it("rejects conflicting or arbitrary checklist copy for a stable identity", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => result.current.addChecklistItem(checklistAction));
    expect(() =>
      act(() =>
        result.current.addChecklistItem({
          ...checklistAction,
          checklistItem: {
            ...checklistAction.checklistItem,
            label: "Conflicto",
          },
        }),
      ),
    ).toThrow(/source-backed action copy/iu);
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
      result.current.answerRequirement(requirement, "has");
      result.current.addChecklistItem(checklistAction);
    });
    expect(storage).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("starts empty after remount and clearSession resets the checklist", () => {
    const first = renderHook(() => useDecisionSession());
    act(() => first.result.current.addChecklistItem(checklistAction));
    first.unmount();
    const second = renderHook(() => useDecisionSession());
    expect(second.result.current.answers).toEqual({});
    expect(second.result.current.checklist).toEqual([]);
    act(() => {
      second.result.current.addChecklistItem(checklistAction);
      second.result.current.clearSession();
    });
    expect(second.result.current.checklist).toEqual([]);
  });
});
