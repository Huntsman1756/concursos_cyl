import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import {
  ANONYMOUS_PILOT_TASK_IDS,
  AnonymousPilotAggregateSchema,
  type AnonymousPilotAggregate,
} from "./anonymousPilotSchema";

export type AnonymousPilotValidationOptions = { requireComplete?: boolean };

const PII_PATTERNS: readonly [string, RegExp][] = [
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu],
  ["phone", /(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/u],
  ["dni-nif-nie", /\b(?:[XYZ]\d{7}|\d{8})[A-Z]\b/iu],
  ["iban", /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/iu],
  ["ipv4", /\b(?:\d{1,3}\.){3}\d{1,3}\b/u],
  ["ipv6", /\b(?:[A-F0-9]{1,4}:){2,7}[A-F0-9]{1,4}\b/iu],
  ["parameterized-url", /https?:\/\/[^\s?#]+[?#][^\s]*/iu],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
    for (const [index, item] of value.entries()) {
      const found = findPiiLeaf(item, `${path}[${index}]`);
      if (found) return found;
    }
    return undefined;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const found = findPiiLeaf(item, `${path}.${key}`);
      if (found) return found;
    }
  }
  return undefined;
}

function schemaError(error: z.ZodError): Error {
  const paths = [...new Set(error.issues.map((issue) => issue.path.join(".")))]
    .filter(Boolean)
    .join(", ");
  return new Error(
    `Anonymous pilot schema validation failed${paths ? ` at ${paths}` : ""}.`,
  );
}

function assertInvariants(
  value: AnonymousPilotAggregate,
  requireComplete: boolean,
): void {
  const { sample } = value;
  if (
    sample.consentedSessions > sample.totalSessions ||
    sample.withdrawnSessions > sample.totalSessions ||
    sample.analyzableSessions !==
      sample.totalSessions - sample.withdrawnSessions ||
    sample.byRole.learner + sample.byRole.counsellor !==
      sample.analyzableSessions
  ) {
    throw new Error("Anonymous pilot sample counts are inconsistent.");
  }

  const taskIds = value.taskResults.map((task) => task.taskId);
  if (
    new Set(taskIds).size !== ANONYMOUS_PILOT_TASK_IDS.length ||
    ANONYMOUS_PILOT_TASK_IDS.some((taskId) => !taskIds.includes(taskId))
  ) {
    throw new Error("Anonymous pilot task set is incomplete or duplicated.");
  }

  for (const task of value.taskResults) {
    if (
      task.completed + task.blocked + task.abandoned !== task.attempted ||
      task.attempted > sample.analyzableSessions ||
      task.misinterpretations > task.attempted
    ) {
      throw new Error(
        `Anonymous pilot task counts are inconsistent (${task.taskId}).`,
      );
    }
    if (
      task.timeBands.under_5m +
        task.timeBands["5_to_10m"] +
        task.timeBands.over_10m +
        task.timeBands.not_recorded !==
      task.attempted
    ) {
      throw new Error(
        `Anonymous pilot time bands are inconsistent (${task.taskId}).`,
      );
    }
    for (const severity of ["minor", "major", "stop"] as const) {
      const issueTotal = value.issues
        .filter(
          (issue) =>
            issue.taskId === task.taskId && issue.severity === severity,
        )
        .reduce((total, issue) => total + issue.count, 0);
      if (task.issueCounts[severity] !== issueTotal) {
        throw new Error(
          `Anonymous pilot issue counts are inconsistent (${task.taskId}).`,
        );
      }
    }
  }

  if (new Set(value.blockerCodes).size !== value.blockerCodes.length) {
    throw new Error("Anonymous pilot blocker codes must be unique.");
  }
  if (value.status === "blocked" && value.blockerCodes.length === 0) {
    throw new Error(
      "Blocked anonymous pilot evidence requires a blocker code.",
    );
  }

  const completionRequested = requireComplete || value.status === "complete";
  if (!completionRequested) return;
  if (value.status !== "complete") {
    throw new Error("Complete anonymous pilot evidence is required.");
  }
  if (
    sample.analyzableSessions < value.protocol.targetSessions ||
    sample.byRole.learner < value.protocol.minimumByRole.learner ||
    sample.byRole.counsellor < value.protocol.minimumByRole.counsellor ||
    sample.consentedSessions !== sample.totalSessions ||
    value.blockerCodes.length !== 0
  ) {
    throw new Error(
      "Complete anonymous pilot evidence does not meet the sample and consent gates.",
    );
  }
  if (
    value.verification.humanReview !== "approved" ||
    !value.verification.protocolApproved ||
    !value.verification.consentApproved ||
    value.verification.noPiiReview !== "approved" ||
    value.verification.reviewedAt === null
  ) {
    throw new Error(
      "Complete anonymous pilot evidence requires approved human review.",
    );
  }
}

export function validateAnonymousPilotAggregate(
  value: unknown,
  options: AnonymousPilotValidationOptions = {},
): AnonymousPilotAggregate {
  const pii = findPiiLeaf(value);
  if (pii) {
    throw new Error(
      `Anonymous pilot aggregate contains possible personal data (${pii.category}) at ${pii.path}.`,
    );
  }
  const parsed = AnonymousPilotAggregateSchema.safeParse(value);
  if (!parsed.success) throw schemaError(parsed.error);
  assertInvariants(parsed.data, options.requireComplete ?? false);
  return parsed.data;
}

export async function validateAnonymousPilotAggregateFile(
  inputPath: string,
  options: AnonymousPilotValidationOptions = {},
): Promise<AnonymousPilotAggregate> {
  let source: string;
  try {
    source = await readFile(inputPath, "utf8");
  } catch {
    throw new Error("Anonymous pilot input file is missing or unreadable.");
  }
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    throw new Error("Anonymous pilot input file is not valid JSON.");
  }
  return validateAnonymousPilotAggregate(value, options);
}

function cliOptions(arguments_: readonly string[]): {
  inputPath: string;
  requireComplete: boolean;
} {
  let inputPath: string | undefined;
  let requireComplete = false;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--require-complete") {
      requireComplete = true;
    } else if (argument === "--input" && arguments_[index + 1]) {
      inputPath = resolve(arguments_[index + 1]!);
      index += 1;
    } else {
      throw new Error(
        "Usage: validateAnonymousPilot --input <path> [--require-complete]",
      );
    }
  }
  if (!inputPath) {
    throw new Error(
      "Usage: validateAnonymousPilot --input <path> [--require-complete]",
    );
  }
  return { inputPath, requireComplete };
}

async function main(): Promise<void> {
  const options = cliOptions(process.argv.slice(2));
  const aggregate = await validateAnonymousPilotAggregateFile(
    options.inputPath,
    { requireComplete: options.requireComplete },
  );
  console.log(`Anonymous pilot aggregate is valid (${aggregate.status}).`);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
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
