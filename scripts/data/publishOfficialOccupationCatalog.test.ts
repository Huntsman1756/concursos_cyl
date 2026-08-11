import { describe, expect, it } from "vitest";

import { officialOccupationSnapshot } from "./publishOfficialOccupationCatalog";

describe("official occupation sidecar publication", () => {
  it("binds the manifest entry to the exact bytes and official BOE source", () => {
    const contents = "[]\n";
    expect(
      officialOccupationSnapshot(
        "/data/v1/snapshots/20260809185438334-65ce4d3c4e14/official-occupations.json",
        contents,
        0,
        "2026-08-11T11:35:02.063Z",
      ),
    ).toMatchObject({
      sourceId: "boe-cno11-complete-occupation-catalog",
      sourceUrl: "https://www.boe.es/eli/es/rd/2010/11/26/1591",
      recordCount: 0,
      sha256:
        "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570",
    });
  });
});
