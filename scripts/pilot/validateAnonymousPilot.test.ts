import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ANONYMOUS_PILOT_TASK_IDS } from "./anonymousPilotSchema";
import {
  validateAnonymousPilotAggregate,
  validateAnonymousPilotAggregateFile,
} from "./validateAnonymousPilot";

function taskResult(
  taskId: (typeof ANONYMOUS_PILOT_TASK_IDS)[number],
  attempted = 0,
) {
  return {
    taskId,
    attempted,
    completed: attempted,
    blocked: 0,
    abandoned: 0,
    misinterpretations: 0,
    timeBands: {
      under_5m: attempted,
      "5_to_10m": 0,
      over_10m: 0,
      not_recorded: 0,
    },
    issueCounts: { minor: 0, major: 0, stop: 0 },
  };
}

function aggregate(status: "draft" | "complete" | "blocked" = "draft") {
  const sessions = status === "complete" ? 5 : 0;
  return {
    schemaVersion: "1.0.0",
    artifactKind: "anonymous_pilot_aggregate",
    status,
    blockerCodes: status === "blocked" ? ["missing_sample"] : [],
    protocol: {
      protocolVersion: "1.0.0",
      taskCatalogVersion: "1.0.0",
      adultOnly: true,
      minorsIncluded: false,
      targetSessions: 5,
      minimumByRole: { learner: 1, counsellor: 1 },
      protocolSha256: "a".repeat(64),
      taskScriptSha256: "b".repeat(64),
    },
    release: {
      rootUrl: "https://salida-cyl.157-90-22-40.sslip.io/",
      deployedCommitSha: "c".repeat(40),
      snapshotId: "20260821144454118-a56e3eeaffa6",
    },
    consentPolicy: {
      participation: "required_before_session",
      recording: "none",
      publicQuotes: "none",
      publicMedia: "none",
      rawConsentStorage: "outside_repository",
    },
    sample: {
      totalSessions: sessions,
      consentedSessions: sessions,
      withdrawnSessions: 0,
      analyzableSessions: sessions,
      byRole: {
        learner: status === "complete" ? 4 : 0,
        counsellor: status === "complete" ? 1 : 0,
      },
    },
    taskResults: ANONYMOUS_PILOT_TASK_IDS.map((taskId) =>
      taskResult(taskId, sessions),
    ),
    issues: [],
    privacy: {
      aggregateOnly: true,
      aggregateContainsPii: false,
      rawMaterialsInRepository: false,
      retentionDays: 30,
    },
    verification: {
      humanReview: status === "complete" ? "approved" : "pending",
      protocolApproved: status === "complete",
      consentApproved: status === "complete",
      noPiiReview: status === "complete" ? "approved" : "pending",
      reviewedAt: status === "complete" ? "2026-08-21T12:00:00.000Z" : null,
    },
  };
}

describe("anonymous pilot aggregate", () => {
  it("accepts an empty draft and a reviewed complete aggregate", () => {
    expect(validateAnonymousPilotAggregate(aggregate()).status).toBe("draft");
    expect(
      validateAnonymousPilotAggregate(aggregate("complete"), {
        requireComplete: true,
      }).status,
    ).toBe("complete");
  });

  it("rejects unknown and participant-level fields", () => {
    expect(() =>
      validateAnonymousPilotAggregate({
        ...aggregate(),
        participantName: "not allowed",
      }),
    ).toThrow(/schema|unknown|unrecognized/i);
    expect(() =>
      validateAnonymousPilotAggregate({ ...aggregate(), sessions: [] }),
    ).toThrow(/schema|unknown|unrecognized/i);
  });

  it.each([
    "contact@example.invalid",
    "+34 612 345 678",
    "12345678Z",
    "ES9121000418450200051332",
    "192.168.1.20",
    "https://example.invalid/?person=1",
  ])("rejects PII-like leaf values without echoing them: %s", (value) => {
    const candidate = aggregate() as Record<string, unknown>;
    candidate.release = { ...(candidate.release as object), rootUrl: value };
    try {
      validateAnonymousPilotAggregate(candidate);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(String(error)).not.toContain(value);
    }
  });

  it("rejects minors, recording, quotes and public media", () => {
    for (const mutation of [
      { protocol: { ...aggregate().protocol, minorsIncluded: true } },
      { consentPolicy: { ...aggregate().consentPolicy, recording: "audio" } },
      { consentPolicy: { ...aggregate().consentPolicy, publicQuotes: "yes" } },
      { consentPolicy: { ...aggregate().consentPolicy, publicMedia: "yes" } },
    ])
      expect(() =>
        validateAnonymousPilotAggregate({ ...aggregate(), ...mutation }),
      ).toThrow(/schema|invalid|literal|expected/i);
  });

  it("rejects inconsistent sample, task and time-band counts", () => {
    const badSample = aggregate("complete");
    badSample.sample.analyzableSessions = 4;
    expect(() => validateAnonymousPilotAggregate(badSample)).toThrow(/sample/i);
    const badTask = aggregate("complete");
    badTask.taskResults[0]!.blocked = 1;
    expect(() => validateAnonymousPilotAggregate(badTask)).toThrow(/task/i);
    const badBand = aggregate("complete");
    badBand.taskResults[0]!.timeBands.under_5m = 4;
    expect(() => validateAnonymousPilotAggregate(badBand)).toThrow(/time/i);
  });

  it("rejects missing, duplicate and unknown tasks", () => {
    const missing = aggregate();
    missing.taskResults.pop();
    expect(() => validateAnonymousPilotAggregate(missing)).toThrow(/task/i);
    const duplicate = aggregate();
    duplicate.taskResults[1]!.taskId = duplicate.taskResults[0]!.taskId;
    expect(() => validateAnonymousPilotAggregate(duplicate)).toThrow(/task/i);
    const unknown = aggregate() as Record<string, unknown>;
    unknown.taskResults = [
      ...aggregate().taskResults.slice(0, 4),
      { ...aggregate().taskResults[4], taskId: "T6_unknown" },
    ];
    expect(() => validateAnonymousPilotAggregate(unknown)).toThrow(
      /task|schema/i,
    );
  });

  it("rejects complete status without five sessions, both roles and human review", () => {
    const tooSmall = aggregate("complete");
    tooSmall.sample = {
      totalSessions: 4,
      consentedSessions: 4,
      withdrawnSessions: 0,
      analyzableSessions: 4,
      byRole: { learner: 4, counsellor: 0 },
    };
    tooSmall.taskResults = ANONYMOUS_PILOT_TASK_IDS.map((id) =>
      taskResult(id, 4),
    );
    expect(() => validateAnonymousPilotAggregate(tooSmall)).toThrow(
      /complete/i,
    );
    const unreviewed = aggregate("complete");
    unreviewed.verification.humanReview = "pending";
    unreviewed.verification.reviewedAt = null;
    expect(() => validateAnonymousPilotAggregate(unreviewed)).toThrow(
      /review/i,
    );
  });

  it("rejects blocked status without an enumerated blocker", () => {
    expect(() =>
      validateAnonymousPilotAggregate({
        ...aggregate("blocked"),
        blockerCodes: [],
      }),
    ).toThrow(/blocker/i);
  });

  it("fails closed when the aggregate file is missing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "anonymous-pilot-"));
    await expect(
      validateAnonymousPilotAggregateFile(join(directory, "missing.json")),
    ).rejects.toThrow(/missing|unreadable/i);
  });
});
