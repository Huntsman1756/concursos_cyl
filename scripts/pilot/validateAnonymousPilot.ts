import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import {
  ANONYMOUS_PILOT_TASK_KEYS,
  AnonymousPilotAggregateSchema,
  type AnonymousPilotAggregate,
} from "./anonymousPilotSchema";

export type AnonymousPilotValidationOptions = {
  requireComplete?: boolean;
};

const PII_PATTERNS: readonly [string, RegExp][] = [
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu],
  [
    "Spanish phone number",
    /(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/u,
  ],
  [
    "international phone number",
    /\+\d{1,3}[\s.-]\d{3}[\s.-]\d{3}[\s.-]\d{3,4}\b/u,
  ],
  ["phone number", /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/u],
  ["Spanish identity number", /\b[XYZ]\d{7}[A-Z]\b/iu],
  ["IP address", /\b(?:\d{1,3}\.){3}\d{1,3}\b/u],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns a path and category, never the leaf value itself. */
function findPiiLeaf(
  value: unknown,
  path = "aggregate",
): { path: string; category: string } | undefined {
  if (typeof value === "string") {
    for (const [category, pattern] of PII_PATTERNS) {
      if (pattern.test(value)) return { path, category };
    }
    return undefined;
  }
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const result = findPiiLeaf(entry, `${path}[${index}]`);
      if (result !== undefined) return result;
    }
    return undefined;
  }
  if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      const result = findPiiLeaf(entry, `${path}.${key}`);
      if (result !== undefined) return result;
    }
  }
  return undefined;
}

function formatSchemaError(error: z.ZodError): Error {
  const details = error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "aggregate";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
  return new Error(`Anonymous pilot aggregate is invalid. ${details}`);
}

function assertAggregateInvariants(
  aggregate: AnonymousPilotAggregate,
  requireComplete: boolean,
): void {
  const taskStarts = aggregate.tasks.reduce(
    (total, task) => total + task.started,
    0,
  );
  const taskCompletions = aggregate.tasks.reduce(
    (total, task) => total + task.completed,
    0,
  );
  const taskBlocks = aggregate.tasks.reduce(
    (total, task) => total + task.blocked,
    0,
  );

  for (const task of aggregate.tasks) {
    if (task.completed > task.started) {
      throw new Error(
        `Task count invariant failed for ${task.taskKey}: completed exceeds started.`,
      );
    }
    if (task.blocked > task.started) {
      throw new Error(
        `Task count invariant failed for ${task.taskKey}: blocked exceeds started.`,
      );
    }
    if (task.completed + task.blocked > task.started) {
      throw new Error(
        `Task count invariant failed for ${task.taskKey}: completed and blocked exceed started.`,
      );
    }
  }

  if (aggregate.counts.taskStarts !== taskStarts) {
    throw new Error("Aggregate taskStarts does not match the five task rows.");
  }
  if (aggregate.counts.taskCompletions !== taskCompletions) {
    throw new Error(
      "Aggregate taskCompletions does not match the five task rows.",
    );
  }
  if (aggregate.counts.taskBlocks !== taskBlocks) {
    throw new Error("Aggregate taskBlocks does not match the five task rows.");
  }

  const completionRequested =
    requireComplete || aggregate.status === "complete";
  if (!completionRequested) return;

  if (aggregate.status !== "complete") {
    throw new Error("A complete aggregate is required for this validation.");
  }
  if (aggregate.counts.sessions < 1) {
    throw new Error("A complete aggregate requires at least one session.");
  }
  for (const task of aggregate.tasks) {
    if (task.started !== aggregate.counts.sessions) {
      throw new Error(
        `Each fixed task must have one started count per session (${task.taskKey}).`,
      );
    }
    if (task.completed + task.blocked !== task.started) {
      throw new Error(
        `Complete task ${task.taskKey} must account for every started session.`,
      );
    }
  }
  if (
    aggregate.counts.taskStarts !==
    aggregate.counts.sessions * ANONYMOUS_PILOT_TASK_KEYS.length
  ) {
    throw new Error(
      "Aggregate taskStarts must equal sessions multiplied by five.",
    );
  }
  if (
    aggregate.counts.taskCompletions + aggregate.counts.taskBlocks !==
    aggregate.counts.taskStarts
  ) {
    throw new Error(
      "Complete aggregate task counts must account for every started task.",
    );
  }
  if (aggregate.blockers.some((blocker) => blocker.status === "open")) {
    throw new Error("Complete aggregate cannot contain unresolved blockers.");
  }
  if (
    aggregate.review.status !== "approved" ||
    aggregate.review.reviewedAt === undefined
  ) {
    throw new Error(
      "Complete aggregate requires an approved review with a review timestamp.",
    );
  }
}

/**
 * Validates an anonymous aggregate without logging or returning participant
 * level values.  Drafts are useful while the pilot is being prepared; the
 * `requireComplete` gate is used by release and handoff checks.
 */
export function validateAnonymousPilotAggregate(
  value: unknown,
  options: AnonymousPilotValidationOptions = {},
): AnonymousPilotAggregate {
  const parsed = AnonymousPilotAggregateSchema.safeParse(value);
  if (!parsed.success) throw formatSchemaError(parsed.error);

  const pii = findPiiLeaf(parsed.data);
  if (pii !== undefined) {
    throw new Error(
      `Anonymous pilot aggregate contains possible personal data (PII: ${pii.category}) at ${pii.path}; only aggregate-safe text is permitted.`,
    );
  }

  assertAggregateInvariants(parsed.data, options.requireComplete ?? false);
  return parsed.data;
}

async function readAggregateInput(inputPath: string): Promise<unknown> {
  let source: string;
  try {
    source = await readFile(inputPath, "utf8");
  } catch {
    throw new Error("Anonymous pilot input file is missing or unreadable.");
  }
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new Error("Anonymous pilot input file is not valid JSON.");
  }
}

export async function validateAnonymousPilotAggregateFile(
  inputPath: string,
  options: AnonymousPilotValidationOptions = {},
): Promise<AnonymousPilotAggregate> {
  return validateAnonymousPilotAggregate(
    await readAggregateInput(inputPath),
    options,
  );
}

export const validateAnonymousPilotAggregateFromFile =
  validateAnonymousPilotAggregateFile;

export type AnonymousPilotCliOptions = {
  inputPath: string;
  requireComplete: boolean;
};

export function parseAnonymousPilotCliArguments(
  arguments_: readonly string[],
): AnonymousPilotCliOptions {
  let inputPath: string | undefined;
  let requireComplete = false;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--require-complete") {
      requireComplete = true;
      continue;
    }
    if (argument === "--input") {
      const candidate = arguments_[index + 1];
      if (candidate === undefined || candidate.startsWith("--")) {
        throw new Error("--input requires a path.");
      }
      inputPath = resolve(candidate);
      index += 1;
      continue;
    }
    throw new Error(
      "Usage: tsx scripts/pilot/validateAnonymousPilot.ts --input <path> [--require-complete]",
    );
  }
  if (inputPath === undefined) {
    throw new Error(
      "Usage: tsx scripts/pilot/validateAnonymousPilot.ts --input <path> [--require-complete]",
    );
  }
  return { inputPath, requireComplete };
}

async function main(): Promise<void> {
  const options = parseAnonymousPilotCliArguments(process.argv.slice(2));
  const aggregate = await validateAnonymousPilotAggregateFile(
    options.inputPath,
    {
      requireComplete: options.requireComplete,
    },
  );
  console.info(`Anonymous pilot aggregate is valid (${aggregate.status}).`);
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    await main();
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Anonymous pilot validation failed.",
    );
    process.exitCode = 1;
  }
}
