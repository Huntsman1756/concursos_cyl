import { expect, describe, it } from "vitest";

import {
  ANONYMOUS_PILOT_TASK_KEYS,
  AnonymousPilotAggregateSchema,
} from "./anonymousPilotSchema";
import {
  validateAnonymousPilotAggregate,
  validateAnonymousPilotAggregateFile,
} from "./validateAnonymousPilot";

function completeAggregate() {
  const sessions = 3;
  const tasks = ANONYMOUS_PILOT_TASK_KEYS.map((taskKey) => ({
    taskKey,
    started: sessions,
    completed: sessions,
    blocked: 0,
  }));

  return {
    schemaVersion: 1,
    pilotKey: "anonymous-fp-navigation",
    status: "complete",
    tasks,
    counts: {
      sessions,
      taskStarts: sessions * ANONYMOUS_PILOT_TASK_KEYS.length,
      taskCompletions: sessions * ANONYMOUS_PILOT_TASK_KEYS.length,
      taskBlocks: 0,
    },
    safety: {
      adultOnly: true,
      recording: false,
      dataMode: "aggregate-only",
      consent: "unsigned-template",
    },
    blockers: [],
    review: {
      status: "approved",
      reviewedAt: "2026-08-21T12:00:00.000Z",
    },
  };
}

describe("validateAnonymousPilotAggregate", () => {
  it("accepts an empty draft but requires a complete aggregate when requested", () => {
    const draft = validateAnonymousPilotAggregate(
      {},
      { requireComplete: false },
    );

    expect(draft.status).toBe("draft");
    expect(draft.counts.sessions).toBe(0);
    expect(() =>
      validateAnonymousPilotAggregate({}, { requireComplete: true }),
    ).toThrow(/complete/i);
  });

  it("accepts a complete aggregate with exactly the five fixed tasks", () => {
    const aggregate = validateAnonymousPilotAggregate(completeAggregate(), {
      requireComplete: true,
    });

    expect(aggregate.status).toBe("complete");
    expect(aggregate.tasks).toHaveLength(ANONYMOUS_PILOT_TASK_KEYS.length);
    expect(aggregate.counts.taskCompletions).toBe(15);
  });

  it("rejects unknown and participant-level keys", () => {
    const aggregate = completeAggregate();

    expect(() =>
      validateAnonymousPilotAggregate(
        { ...aggregate, unexpected: true },
        { requireComplete: true },
      ),
    ).toThrow(/unexpected|unknown/i);
    expect(() =>
      validateAnonymousPilotAggregate(
        {
          ...aggregate,
          tasks: aggregate.tasks.map((task, index) =>
            index === 0 ? { ...task, participantId: "participant-1" } : task,
          ),
        },
        { requireComplete: true },
      ),
    ).toThrow(/participant|unknown/i);
  });

  it("rejects PII-like leaf strings without echoing the input", () => {
    const aggregate = completeAggregate();
    const withEmail = {
      ...aggregate,
      review: {
        ...aggregate.review,
        note: "contact@example.invalid",
      },
    };

    expect(() =>
      validateAnonymousPilotAggregate(withEmail, { requireComplete: true }),
    ).toThrow(/personal|PII/i);
    try {
      validateAnonymousPilotAggregate(withEmail, { requireComplete: true });
    } catch (error) {
      expect(String(error)).not.toContain("contact@example.invalid");
    }
  });

  it("rejects minors and recording", () => {
    const aggregate = completeAggregate();

    expect(() =>
      validateAnonymousPilotAggregate(
        { ...aggregate, safety: { ...aggregate.safety, adultOnly: false } },
        { requireComplete: true },
      ),
    ).toThrow(/adult|minor/i);
    expect(() =>
      validateAnonymousPilotAggregate(
        { ...aggregate, safety: { ...aggregate.safety, recording: true } },
        { requireComplete: true },
      ),
    ).toThrow(/record/i);
  });

  it("rejects task and count invariant violations", () => {
    const aggregate = completeAggregate();
    const inconsistentTask = {
      ...aggregate,
      tasks: aggregate.tasks.map((task, index) =>
        index === 0 ? { ...task, completed: task.completed + 1 } : task,
      ),
    };
    expect(() =>
      validateAnonymousPilotAggregate(inconsistentTask, {
        requireComplete: true,
      }),
    ).toThrow(/task|count|started|completed/i);

    const inconsistentTotals = {
      ...aggregate,
      counts: { ...aggregate.counts, taskCompletions: 14 },
    };
    expect(() =>
      validateAnonymousPilotAggregate(inconsistentTotals, {
        requireComplete: true,
      }),
    ).toThrow(/task|count|total/i);
  });

  it("rejects a missing task and a non-enumerated task key", () => {
    const aggregate = completeAggregate();

    expect(() =>
      validateAnonymousPilotAggregate(
        { ...aggregate, tasks: aggregate.tasks.slice(0, 4) },
        { requireComplete: true },
      ),
    ).toThrow(/five|task/i);
    expect(() =>
      validateAnonymousPilotAggregate(
        {
          ...aggregate,
          tasks: aggregate.tasks.map((task, index) =>
            index === 0 ? { ...task, taskKey: "task-6" } : task,
          ),
        },
        { requireComplete: true },
      ),
    ).toThrow(/task/i);
  });

  it("requires terminal review gates for completion", () => {
    const aggregate = completeAggregate();

    expect(() =>
      validateAnonymousPilotAggregate(
        { ...aggregate, review: { status: "pending" } },
        { requireComplete: true },
      ),
    ).toThrow(/review/i);
    expect(() =>
      validateAnonymousPilotAggregate(
        { ...aggregate, review: { status: "approved" } },
        { requireComplete: true },
      ),
    ).toThrow(/review/i);
  });

  it("rejects unresolved blockers for a complete aggregate", () => {
    const aggregate = completeAggregate();
    const blocked = {
      ...aggregate,
      blockers: [
        {
          code: "technical",
          status: "open",
          count: 1,
          summary: "The route was unavailable.",
        },
      ],
    };

    expect(() =>
      validateAnonymousPilotAggregate(blocked, { requireComplete: true }),
    ).toThrow(/blocker/i);
  });

  it("fails closed when the input file is missing", async () => {
    await expect(
      validateAnonymousPilotAggregateFile(
        "/tmp/anonymous-pilot-input-that-does-not-exist.json",
      ),
    ).rejects.toThrow(/missing|input|file/i);
  });

  it("keeps the aggregate schema strict", () => {
    expect(
      AnonymousPilotAggregateSchema.safeParse({
        participant: { id: "not-allowed" },
      }).success,
    ).toBe(false);
  });
});
