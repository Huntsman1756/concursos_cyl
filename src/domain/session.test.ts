import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDecisionSession } from "./session";

describe("useDecisionSession", () => {
  it("keeps answers and checklist in React memory only", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const fetchSpy = vi.spyOn(window, "fetch");
    const originalBeacon = navigator.sendBeacon;
    const beacon = vi.fn().mockReturnValue(false);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: beacon,
    });
    const { result } = renderHook(() => useDecisionSession());

    act(() => {
      result.current.answerRequirement("requirement:license", "lacks");
      result.current.addChecklistItem({
        id: "requirement:license",
        label: "Permiso B",
      });
    });

    expect(result.current.answers).toEqual({ "requirement:license": "lacks" });
    expect(result.current.checklist).toEqual([
      { id: "requirement:license", label: "Permiso B" },
    ]);
    expect(setItem).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();

    setItem.mockRestore();
    fetchSpy.mockRestore();
    if (originalBeacon) {
      Object.defineProperty(navigator, "sendBeacon", {
        configurable: true,
        value: originalBeacon,
      });
    } else {
      Reflect.deleteProperty(navigator, "sendBeacon");
    }
  });

  it("clears the ephemeral session", () => {
    const { result } = renderHook(() => useDecisionSession());
    act(() => {
      result.current.answerRequirement("requirement:one", "has");
      result.current.addChecklistItem({ id: "one", label: "Uno" });
    });
    act(() => result.current.clearSession());
    expect(result.current.answers).toEqual({});
    expect(result.current.checklist).toEqual([]);
  });
});
