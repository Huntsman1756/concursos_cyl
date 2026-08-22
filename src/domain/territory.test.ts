import { describe, expect, it } from "vitest";
import { CYL_PROVINCES, parseCylProvince } from "./territory";

describe("parseCylProvince", () => {
  it("returns none only when the query has no province values", () => {
    expect(parseCylProvince([])).toEqual({ kind: "none" });
  });

  it("accepts one exact official Castilla y León province", () => {
    expect(parseCylProvince([CYL_PROVINCES[2]])).toEqual({
      kind: "valid",
      province: "León",
    });
  });

  it.each([
    ["", "empty"],
    ["Madrid", "unknown"],
    ["león", "case-changed"],
    [" León", "whitespace-padded"],
    ["León ", "whitespace-padded"],
  ])("rejects %s (%s) instead of echoing it", (value) => {
    expect(parseCylProvince([value])).toEqual({ kind: "invalid" });
  });

  it("rejects repeated values even when each value is official", () => {
    expect(parseCylProvince(["León", "León"])).toEqual({ kind: "invalid" });
  });
});
