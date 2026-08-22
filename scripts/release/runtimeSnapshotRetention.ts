import { lstatSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SNAPSHOT_ID_PATTERN = /^\d{17}-[a-f0-9]{12}$/u;
const RETENTION_CONFIG_RELATIVE_PATH = [
  "config",
  "runtime-snapshot-retention.json",
] as const;

export interface RuntimeSnapshotRetention {
  schemaVersion: "1.0.0";
  sourceSnapshotIds: string[];
  runtimeSnapshotIds: string[];
}

interface RuntimeSnapshotRetentionRecord {
  schemaVersion?: unknown;
  sourceSnapshotIds?: unknown;
  runtimeSnapshotIds?: unknown;
}

function recordValue(value: unknown): RuntimeSnapshotRetentionRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Runtime snapshot retention must be an object.");
  }
  return value as RuntimeSnapshotRetentionRecord;
}

function assertExactKeys(value: RuntimeSnapshotRetentionRecord): void {
  const actualKeys = Object.keys(value).sort();
  if (
    actualKeys.length !== 3 ||
    actualKeys[0] !== "runtimeSnapshotIds" ||
    actualKeys[1] !== "schemaVersion" ||
    actualKeys[2] !== "sourceSnapshotIds"
  ) {
    throw new Error(
      "Runtime snapshot retention must contain exact keys: schemaVersion, sourceSnapshotIds, runtimeSnapshotIds.",
    );
  }
}

function compareSnapshotIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function parseRuntimeSnapshotRetention(
  value: unknown,
): RuntimeSnapshotRetention {
  const record = recordValue(value);
  assertExactKeys(record);
  if (record.schemaVersion !== "1.0.0") {
    throw new Error(
      'Runtime snapshot retention.schemaVersion must be exactly "1.0.0".',
    );
  }
  const parseSnapshotIds = (
    field: "sourceSnapshotIds" | "runtimeSnapshotIds",
  ) => {
    const value = record[field];
    if (!Array.isArray(value)) {
      throw new Error(`Runtime snapshot retention.${field} must be an array.`);
    }

    const snapshotIds = value.map((snapshotId, index) => {
      if (
        typeof snapshotId !== "string" ||
        !SNAPSHOT_ID_PATTERN.test(snapshotId)
      ) {
        throw new Error(
          `Runtime snapshot retention.${field}[${index}] must match ${SNAPSHOT_ID_PATTERN.source}.`,
        );
      }
      return snapshotId;
    });
    const sortedUnique = [...snapshotIds].sort(compareSnapshotIds);
    if (
      new Set(snapshotIds).size !== snapshotIds.length ||
      snapshotIds.some(
        (snapshotId, index) => snapshotId !== sortedUnique[index],
      )
    ) {
      throw new Error(
        `Runtime snapshot retention.${field} must be sorted unique values.`,
      );
    }
    return snapshotIds;
  };

  const sourceSnapshotIds = parseSnapshotIds("sourceSnapshotIds");
  const runtimeSnapshotIds = parseSnapshotIds("runtimeSnapshotIds");
  const sourceSnapshotIdSet = new Set(sourceSnapshotIds);
  if (
    runtimeSnapshotIds.some(
      (snapshotId) => !sourceSnapshotIdSet.has(snapshotId),
    )
  ) {
    throw new Error(
      "Runtime snapshot retention.runtimeSnapshotIds must be a subset of sourceSnapshotIds.",
    );
  }

  return { schemaVersion: "1.0.0", sourceSnapshotIds, runtimeSnapshotIds };
}

export function loadRuntimeSnapshotRetention(
  rootDir = process.cwd(),
  snapshotsDirectory = join(rootDir, "public", "data", "v1", "snapshots"),
): RuntimeSnapshotRetention {
  const root = resolve(rootDir);
  const configPath = join(root, ...RETENTION_CONFIG_RELATIVE_PATH);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8")) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to load runtime snapshot retention at ${configPath}: ${detail}`,
      { cause: error },
    );
  }

  const retention = parseRuntimeSnapshotRetention(parsed);
  const snapshotsRoot = resolve(snapshotsDirectory);
  for (const snapshotId of retention.sourceSnapshotIds) {
    const snapshotPath = join(snapshotsRoot, snapshotId);
    let snapshotStat;
    try {
      snapshotStat = lstatSync(snapshotPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `Runtime snapshot retention directory is missing: ${snapshotPath}.`,
          { cause: error },
        );
      }
      throw error;
    }
    if (snapshotStat.isSymbolicLink() || !snapshotStat.isDirectory()) {
      throw new Error(
        `Runtime snapshot retention path is not a directory: ${snapshotPath}.`,
      );
    }
  }

  return retention;
}
