import { describe, expect, it } from "vitest";
import { runQualityGates } from "./qualityGates";

describe("runQualityGates", () => {
  it("rejects a candidate that unexpectedly loses most records", () => {
    expect(() =>
      runQualityGates(
        { programs: 20, centers: 20, offerings: 100, offers: 80 },
        { programs: 187, centers: 223, offerings: 1294, offers: 1000 },
      ),
    ).toThrow(/unexpected record loss/i);
  });

  it("accepts a count increase and reports optional null rates", () => {
    expect(
      runQualityGates(
        { programs: 200, centers: 250, offerings: 1400, offers: 1100 },
        { programs: 187, centers: 223, offerings: 1294, offers: 1000 },
      ),
    ).toMatchObject({
      counts: { programs: 200, centers: 250, offerings: 1400, offers: 1100 },
    });
  });
});
