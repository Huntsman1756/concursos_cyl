import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  renderContestEvidenceChecklist,
  validateContestEvidenceManifest,
  type ContestEvidenceManifest,
} from "./validateContestEvidenceManifest";

const knownClaimIds = ["problem_audience", "accessibility_intent"];
const redactionRule =
  "Use a fresh anonymous browser context; omit browser chrome and personal data.";

const validManifest: ContestEvidenceManifest = {
  schemaVersion: "1.0.0",
  freezeRequired: true,
  outputDirectory: "docs/contest/evidence",
  captures: [
    {
      evidenceId: "home-desktop",
      route: "/",
      viewport: { width: 1440, height: 900 },
      requiredVisible: [
        { kind: "role", role: "heading", name: "Principal" },
        { kind: "text", value: "Elige tu camino" },
      ],
      claimIds: ["problem_audience", "accessibility_intent"],
      outputFile: "docs/contest/evidence/home-desktop.png",
      freezeRequired: true,
      redactionRule,
    },
  ],
};

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("contest evidence manifest validator", () => {
  it("accepts the strict route, viewport, claim, and output contract", () => {
    expect(
      validateContestEvidenceManifest(validManifest, { knownClaimIds }),
    ).toEqual({ valid: true, errors: [] });
  });

  it("rejects unknown fields, duplicate evidence IDs, and duplicate outputs", () => {
    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          extra: true,
        },
        { knownClaimIds },
      ),
    ).toThrow(/unknown field/iu);

    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            validManifest.captures[0],
            { ...validManifest.captures[0] },
          ],
        },
        { knownClaimIds },
      ),
    ).toThrow(/duplicate evidenceId/iu);

    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            validManifest.captures[0],
            {
              ...validManifest.captures[0],
              evidenceId: "comparison-desktop",
            },
          ],
        },
        { knownClaimIds },
      ),
    ).toThrow(/duplicate outputFile/iu);
  });

  it("rejects non-final viewports, unsafe outputs, and unknown claims", () => {
    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            {
              ...validManifest.captures[0],
              viewport: { width: 1280, height: 800 } as never,
            },
          ],
        },
        { knownClaimIds },
      ),
    ).toThrow(/viewport/iu);
    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            {
              ...validManifest.captures[0],
              outputFile: "../private.png",
            },
          ],
        },
        { knownClaimIds },
      ),
    ).toThrow(/outputFile/iu);
    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            {
              ...validManifest.captures[0],
              claimIds: ["unknown_claim"],
            },
          ],
        },
        { knownClaimIds },
      ),
    ).toThrow(/unknown claim/iu);
  });

  it("rejects an existing frozen output before a freeze record exists", () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "salida-cyl-contest-evidence-"),
    );
    temporaryRoots.push(root);
    const outputPath = path.join(root, validManifest.captures[0].outputFile);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, "provisional", "utf8");

    expect(() =>
      validateContestEvidenceManifest(validManifest, {
        rootDir: root,
        knownClaimIds,
        freezeRecordPresent: false,
      }),
    ).toThrow(/freeze record/iu);
    expect(
      validateContestEvidenceManifest(validManifest, {
        rootDir: root,
        knownClaimIds,
        freezeRecordPresent: true,
      }),
    ).toEqual({ valid: true, errors: [] });
  });

  it("renders a deterministic human checklist from the validated entries", () => {
    const checklist = renderContestEvidenceChecklist(validManifest);
    expect(checklist).toContain("home-desktop");
    expect(checklist).toContain("1440×900");
    expect(checklist).toContain("docs/contest/evidence/home-desktop.png");
    expect(checklist).toContain("Use a fresh anonymous browser context");
    expect(checklist).toContain(
      "- [ ] Inspect the original PNG for browser chrome, personal data, account state, cookies, tokens, local filesystem paths, clipping, and misleading empty states.",
    );
    expect(checklist).toContain(
      "- [ ] Have a reviewer compare each image with the claim ledger and the frozen data before committing evidence.",
    );
    expect(checklist.endsWith("\n")).toBe(true);
  });

  it("accepts final capture provenance and verifies the PNG hash", () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "salida-cyl-contest-evidence-final-"),
    );
    temporaryRoots.push(root);
    const capture = validManifest.captures[0];
    const outputPath = path.join(root, capture.outputFile);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const pngBytes = Buffer.from("captured-png-placeholder", "utf8");
    fs.writeFileSync(outputPath, pngBytes);

    expect(
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            {
              ...capture,
              sha256: createHash("sha256").update(pngBytes).digest("hex"),
              capturedAt: "2026-08-09T22:00:00.000Z",
              localCommitSha: "a".repeat(40),
              deployedCommitSha: null,
            },
          ],
        },
        { rootDir: root, knownClaimIds, freezeRecordPresent: true },
      ),
    ).toEqual({ valid: true, errors: [] });
  });

  it("rejects missing provenance fields and stale image hashes", () => {
    expect(() =>
      validateContestEvidenceManifest(
        {
          ...validManifest,
          captures: [
            {
              ...validManifest.captures[0],
              sha256: "a".repeat(64),
            },
          ],
        },
        { knownClaimIds },
      ),
    ).toThrow(/provenance|capturedAt|localCommitSha/iu);
  });
});
