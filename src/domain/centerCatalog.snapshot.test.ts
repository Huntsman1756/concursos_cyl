import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildCenterCatalogRows, filterCenterRows } from "./centerCatalog";
import type {
  EducationCenter,
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";

// Contractual invariants of the frozen active snapshot
// (analysis/prototype-data-integrity.md). These lock the aggregation truth
// of snapshot 20260830120000000-8c6c79fbd2a1 and fail loudly if data drifts.

const SNAPSHOT = "20260830120000000-8c6c79fbd2a1";

const offerings = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "public/data/v1/snapshots",
      SNAPSHOT,
      "training-offerings.json",
    ),
    "utf8",
  ),
) as TrainingOffering[];
const centers = JSON.parse(
  readFileSync(
    join(process.cwd(), "public/data/v1/snapshots", SNAPSHOT, "centers.json"),
    "utf8",
  ),
) as EducationCenter[];
const programs = JSON.parse(
  readFileSync(
    join(process.cwd(), "public/data/v1/snapshots", SNAPSHOT, "programs.json"),
    "utf8",
  ),
) as TrainingProgram[];

describe("center catalog snapshot invariants (20260830120000000-8c6c79fbd2a1)", () => {
  const rows = buildCenterCatalogRows({ offerings, centers, programs });

  it("aggregates 1294 raw offerings into 1293 unique center-program rows", () => {
    expect(offerings).toHaveLength(1294);
    expect(rows).toHaveLength(1293);
  });

  it("represents every center exactly once in the row keys per program", () => {
    const uniqueKeys = new Set(rows.map((row) => row.rowKey));
    expect(uniqueKeys.size).toBe(rows.length);
  });

  it("keeps the RÍO DUERO × AFD02M multivalue row single and dual-facet", () => {
    const rioDuero = rows.find(
      (row) => row.centerCode === "47011115" && row.programKey === "AFD02M",
    );
    expect(rioDuero).toBeDefined();
    expect(rioDuero?.teachingTypes).toEqual(["concerted", "private"]);
    expect(
      filterCenterRows(rows, { titularidad: "concerted" }).some(
        (row) => row.rowKey === "47011115:AFD02M",
      ),
    ).toBe(true);
    expect(
      filterCenterRows(rows, { titularidad: "private" }).some(
        (row) => row.rowKey === "47011115:AFD02M",
      ),
    ).toBe(true);
    // never duplicated in results
    expect(
      filterCenterRows(rows, { titularidad: "concerted" }).filter(
        (row) => row.rowKey === "47011115:AFD02M",
      ),
    ).toHaveLength(1);
  });

  it("matches modality facets against aggregated modalities, not raw offerings", () => {
    const distance = filterCenterRows(rows, { modalidad: "distance" });
    expect(distance).toHaveLength(89);
    expect(distance.every((row) => row.modalities.includes("distance"))).toBe(
      true,
    );
    const onSite = filterCenterRows(rows, { modalidad: "on_site" });
    expect(onSite).toHaveLength(1204);
  });

  it("keeps province facet counts on rows (1293 total) and centers separate (229)", () => {
    const byProvince = new Map<string, number>();
    for (const row of rows) {
      byProvince.set(row.province, (byProvince.get(row.province) ?? 0) + 1);
    }
    expect([...byProvince.values()].reduce((a, b) => a + b, 0)).toBe(1293);
    expect(byProvince.get("Valladolid")).toBe(298);
    const uniqueCenters = new Set(rows.map((row) => row.centerCode));
    expect(uniqueCenters.size).toBe(229);
  });
});
