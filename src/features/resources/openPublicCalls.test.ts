import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { PublicEmploymentCall } from "../../../data/schemas/publicEmployment";
import { selectOpenPublicCalls } from "./openPublicCalls";

const root = process.cwd();

function call(overrides: Partial<PublicEmploymentCall>): PublicEmploymentCall {
  return {
    id: "call-1",
    title: "Convocatoria de prueba",
    organization: "Junta de Castilla y León",
    places: 10,
    municipality: "Valladolid",
    applicationStart: "2026-07-28",
    applicationDeadline: "2026-08-24",
    requirements: null,
    deadlineCopy: null,
    accessType: "open",
    applicationUrl: null,
    officialUrl: "https://empleo.jcyl.es/convocatoria",
    sourceUpdatedAt: null,
    ...overrides,
  };
}

// The contractual audit value (OPEN_PUBLIC_CALLS = 4) is derived against the
// snapshot reference date, not the runtime clock:
// accessType=open ∧ applicationDeadline ≥ fecha de la copia.
describe("open public calls runtime truth", () => {
  it("derives the contractual 4 open calls at the snapshot reference date", () => {
    // The four processes that were open when the snapshot was taken
    // (deadline 2026-08-24 > reference date 2026-08-22).
    const calls = [
      "1285666453332",
      "1285666480084",
      "1285666447460",
      "1285666500281",
    ].map((id) =>
      call({
        id,
        applicationDeadline: "2026-08-24",
      }),
    );
    expect(selectOpenPublicCalls(calls, "2026-08-22")).toHaveLength(4);
  });

  it("derives an honest 0 once the published deadlines have closed", () => {
    const calls = [
      call({ applicationDeadline: "2026-08-24" }),
      call({ id: "call-2", applicationDeadline: "2026-08-18" }),
    ];
    expect(selectOpenPublicCalls(calls, "2026-08-30")).toHaveLength(0);
    expect(selectOpenPublicCalls(calls, "2026-09-02")).toHaveLength(0);
  });

  it("keeps calls whose window has not started out of the open count", () => {
    const calls = [
      call({
        applicationDeadline: "2026-12-31",
        applicationStart: "2026-10-01",
      }),
    ];
    expect(selectOpenPublicCalls(calls, "2026-09-02")).toHaveLength(0);
    expect(selectOpenPublicCalls(calls, "2026-10-15")).toHaveLength(1);
  });

  it("excludes internal, mixed, and unknown access types", () => {
    const calls = [
      call({ accessType: "open" }),
      call({ id: "call-2", accessType: "internal" }),
      call({ id: "call-3", accessType: "mixed" }),
      call({ id: "call-4", accessType: "unknown" }),
    ];
    expect(selectOpenPublicCalls(calls, "2026-08-04")).toHaveLength(1);
  });

  it("matches the refreshed runtime snapshot: 307 calls, none open at its reference date", () => {
    const manifestPath = join(root, "public/data/v1/manifest.json");
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      snapshotId: string;
      resourceSnapshots: Record<
        string,
        { snapshotFetchedAt: string; resourcePath: string }
      >;
    };
    const snapshot = manifest.resourceSnapshots.publicEmploymentCalls;
    const snapshotFile = join(
      root,
      "public",
      snapshot.resourcePath.replace(/^\//u, ""),
    );
    expect(existsSync(snapshotFile)).toBe(true);

    const calls = JSON.parse(readFileSync(snapshotFile, "utf8")) as Array<
      Pick<
        PublicEmploymentCall,
        "accessType" | "applicationDeadline" | "applicationStart"
      >
    >;
    const referenceDate = snapshot.snapshotFetchedAt.slice(0, 10);

    expect(calls).toHaveLength(307);
    expect(selectOpenPublicCalls(calls, referenceDate)).toHaveLength(0);
    // No call can be open after the last published deadline of the copy.
    const lastDeadline = calls
      .map((entry) => entry.applicationDeadline)
      .filter((deadline): deadline is string => deadline !== null)
      .sort()
      .at(-1);
    expect(lastDeadline).toBe("2026-08-24");
    expect(selectOpenPublicCalls(calls, "2026-08-25")).toHaveLength(0);
  });
});
