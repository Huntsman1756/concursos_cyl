import { z } from "zod";

/**
 * The task keys are deliberately positional.  The task script is versioned
 * documentation, while the aggregate keeps only these stable keys and counts.
 */
export const ANONYMOUS_PILOT_TASK_KEYS = [
  "task-1",
  "task-2",
  "task-3",
  "task-4",
  "task-5",
] as const;

export const AnonymousPilotTaskKeySchema = z.enum(ANONYMOUS_PILOT_TASK_KEYS);

const NonNegativeCountSchema = z.number().int().min(0);

const AnonymousPilotTaskSchema = z
  .object({
    taskKey: AnonymousPilotTaskKeySchema,
    started: NonNegativeCountSchema,
    completed: NonNegativeCountSchema,
    blocked: NonNegativeCountSchema,
    note: z.string().trim().max(280).optional(),
  })
  .strict();

function taskSchemaForKey(taskKey: (typeof ANONYMOUS_PILOT_TASK_KEYS)[number]) {
  return AnonymousPilotTaskSchema.extend({
    taskKey: z.literal(taskKey),
  });
}

export const AnonymousPilotTasksSchema = z.tuple([
  taskSchemaForKey("task-1"),
  taskSchemaForKey("task-2"),
  taskSchemaForKey("task-3"),
  taskSchemaForKey("task-4"),
  taskSchemaForKey("task-5"),
]);

export const AnonymousPilotCountsSchema = z
  .object({
    sessions: NonNegativeCountSchema.default(0),
    taskStarts: NonNegativeCountSchema.default(0),
    taskCompletions: NonNegativeCountSchema.default(0),
    taskBlocks: NonNegativeCountSchema.default(0),
  })
  .strict()
  .default({
    sessions: 0,
    taskStarts: 0,
    taskCompletions: 0,
    taskBlocks: 0,
  });

export const AnonymousPilotSafetySchema = z
  .object({
    adultOnly: z.boolean().default(true),
    recording: z.boolean().default(false),
    dataMode: z.literal("aggregate-only").default("aggregate-only"),
    consent: z.literal("unsigned-template").default("unsigned-template"),
  })
  .strict()
  .default({
    adultOnly: true,
    recording: false,
    dataMode: "aggregate-only",
    consent: "unsigned-template",
  });

export const AnonymousPilotBlockerSchema = z
  .object({
    code: z.enum([
      "accessibility",
      "comprehension",
      "consent",
      "technical",
      "privacy",
      "other",
    ]),
    status: z.enum(["open", "resolved"]),
    count: z.number().int().positive(),
    summary: z.string().trim().min(1).max(280).optional(),
  })
  .strict();

export const AnonymousPilotReviewSchema = z
  .object({
    status: z.enum(["pending", "approved"]).default("pending"),
    reviewedAt: z.string().datetime().optional(),
    note: z.string().trim().max(280).optional(),
  })
  .strict()
  .default({ status: "pending" });

const DEFAULT_TASKS: [
  { taskKey: "task-1"; started: number; completed: number; blocked: number },
  { taskKey: "task-2"; started: number; completed: number; blocked: number },
  { taskKey: "task-3"; started: number; completed: number; blocked: number },
  { taskKey: "task-4"; started: number; completed: number; blocked: number },
  { taskKey: "task-5"; started: number; completed: number; blocked: number },
] = [
  { taskKey: "task-1", started: 0, completed: 0, blocked: 0 },
  { taskKey: "task-2", started: 0, completed: 0, blocked: 0 },
  { taskKey: "task-3", started: 0, completed: 0, blocked: 0 },
  { taskKey: "task-4", started: 0, completed: 0, blocked: 0 },
  { taskKey: "task-5", started: 0, completed: 0, blocked: 0 },
];

const AnonymousPilotAggregateBaseSchema = z
  .object({
    schemaVersion: z.literal(1).default(1),
    pilotKey: z
      .literal("anonymous-fp-navigation")
      .default("anonymous-fp-navigation"),
    status: z.enum(["draft", "complete"]).default("draft"),
    tasks: AnonymousPilotTasksSchema.default(DEFAULT_TASKS),
    counts: AnonymousPilotCountsSchema,
    safety: AnonymousPilotSafetySchema,
    blockers: z.array(AnonymousPilotBlockerSchema).max(20).default([]),
    review: AnonymousPilotReviewSchema,
  })
  .strict();

/**
 * Structural contract for the anonymous pilot.  No participant, identity,
 * contact, transcript, or recording field is part of this schema.
 */
export const AnonymousPilotAggregateSchema =
  AnonymousPilotAggregateBaseSchema.superRefine((aggregate, context) => {
    if (!aggregate.safety.adultOnly) {
      context.addIssue({
        code: "custom",
        path: ["safety", "adultOnly"],
        message: "The anonymous pilot is adult-only; minors are not permitted.",
      });
    }
    if (aggregate.safety.recording) {
      context.addIssue({
        code: "custom",
        path: ["safety", "recording"],
        message: "Recording is not permitted for the anonymous pilot.",
      });
    }
  });

export type AnonymousPilotAggregate = z.infer<
  typeof AnonymousPilotAggregateSchema
>;
export type AnonymousPilotTask = z.infer<typeof AnonymousPilotTaskSchema>;
export type AnonymousPilotCounts = z.infer<typeof AnonymousPilotCountsSchema>;
