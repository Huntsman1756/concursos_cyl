import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadAndValidateContestClaims } from "./validateContestClaims";

const MANIFEST_KEYS = [
  "schemaVersion",
  "freezeRequired",
  "outputDirectory",
  "captures",
] as const;
const CAPTURE_KEYS = [
  "evidenceId",
  "route",
  "viewport",
  "requiredVisible",
  "claimIds",
  "outputFile",
  "freezeRequired",
  "redactionRule",
] as const;
const CAPTURE_PROVENANCE_KEYS = [
  "sha256",
  "capturedAt",
  "localCommitSha",
  "deployedCommitSha",
] as const;
const VIEWPORT_KEYS = ["width", "height"] as const;
const REQUIRED_TEXT_KEYS = ["kind", "value"] as const;
const REQUIRED_ROLE_KEYS = ["kind", "role", "name"] as const;
const OUTPUT_DIRECTORY = "docs/contest/evidence";
const CHECKLIST_PATH = "docs/contest/evidence-capture.md";
const VIEWPORTS = new Set(["1440x900", "360x800"]);

type RequiredVisibleText = { kind: "text"; value: string };
type RequiredVisibleRole = { kind: "role"; role: string; name: string };
export type RequiredVisible = RequiredVisibleText | RequiredVisibleRole;

export type ContestEvidenceCapture = {
  evidenceId: string;
  route: string;
  viewport: { width: 1440; height: 900 } | { width: 360; height: 800 };
  requiredVisible: RequiredVisible[];
  claimIds: string[];
  outputFile: string;
  freezeRequired: boolean;
  redactionRule: string;
  sha256?: string;
  capturedAt?: string;
  localCommitSha?: string;
  deployedCommitSha?: string | null;
};

export type ContestEvidenceManifest = {
  schemaVersion: "1.0.0";
  freezeRequired: true;
  outputDirectory: typeof OUTPUT_DIRECTORY;
  captures: ContestEvidenceCapture[];
};

type ValidationOptions = {
  rootDir?: string;
  knownClaimIds?: Iterable<string>;
  freezeRecordPresent?: boolean;
  requireProvenance?: boolean;
};

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
  required: readonly string[] = allowed,
): void {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label} has unknown field(s): ${unknown.join(", ")}`);
  }
  for (const key of required) {
    if (!(key in record)) throw new Error(`${label} is missing ${key}`);
  }
}

function assertNonEmptyString(
  value: unknown,
  label: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertSafeRelativePath(
  value: unknown,
  label: string,
): asserts value is string {
  assertNonEmptyString(value, label);
  if (
    path.isAbsolute(value) ||
    value.includes("\\") ||
    value.split("/").includes("..") ||
    value.startsWith("./")
  ) {
    throw new Error(`${label} must be a safe repository-relative POSIX path`);
  }
}

function validateRequiredVisible(
  value: unknown,
  index: number,
): RequiredVisible {
  const record = assertRecord(value, `requiredVisible[${index}]`);
  if (record.kind === "text") {
    assertExactKeys(record, REQUIRED_TEXT_KEYS, `requiredVisible[${index}]`);
    assertNonEmptyString(record.value, `requiredVisible[${index}].value`);
    return { kind: "text", value: record.value };
  }
  if (record.kind === "role") {
    assertExactKeys(record, REQUIRED_ROLE_KEYS, `requiredVisible[${index}]`);
    assertNonEmptyString(record.role, `requiredVisible[${index}].role`);
    assertNonEmptyString(record.name, `requiredVisible[${index}].name`);
    if (!/^[a-z][a-z0-9_-]*$/u.test(record.role)) {
      throw new Error(`requiredVisible[${index}].role is invalid`);
    }
    return { kind: "role", role: record.role, name: record.name };
  }
  throw new Error(`requiredVisible[${index}].kind must be text or role`);
}

function validateViewport(value: unknown): ContestEvidenceCapture["viewport"] {
  const record = assertRecord(value, "viewport");
  assertExactKeys(record, VIEWPORT_KEYS, "viewport");
  if (
    typeof record.width !== "number" ||
    typeof record.height !== "number" ||
    !Number.isInteger(record.width) ||
    !Number.isInteger(record.height)
  ) {
    throw new Error("viewport dimensions must be integers");
  }
  const signature = `${record.width}x${record.height}`;
  if (!VIEWPORTS.has(signature)) {
    throw new Error("viewport must be exactly 1440x900 or 360x800");
  }
  return record.width === 1440
    ? { width: 1440, height: 900 }
    : { width: 360, height: 800 };
}

function validateOutputFile(value: unknown): string {
  assertSafeRelativePath(value, "outputFile");
  if (!value.startsWith(`${OUTPUT_DIRECTORY}/`) || !value.endsWith(".png")) {
    throw new Error(`outputFile must be a PNG below ${OUTPUT_DIRECTORY}/`);
  }
  if (
    /(?:profile|api[_ -]?key|password|secret|token|authorization)/iu.test(value)
  ) {
    throw new Error("outputFile must not contain sensitive path terms");
  }
  return value;
}

function validateCaptureProvenance(
  captureRecord: Record<string, unknown>,
  index: number,
  root: string | undefined,
  outputFile: string,
  required: boolean,
): Pick<
  ContestEvidenceCapture,
  "sha256" | "capturedAt" | "localCommitSha" | "deployedCommitSha"
> {
  const present = CAPTURE_PROVENANCE_KEYS.filter((key) => key in captureRecord);
  if (required && present.length !== CAPTURE_PROVENANCE_KEYS.length) {
    throw new Error(
      `captures[${index}] requires complete capture provenance after the freeze`,
    );
  }
  if (present.length === 0) return {};
  if (present.length !== CAPTURE_PROVENANCE_KEYS.length) {
    throw new Error(
      `captures[${index}] capture provenance must include sha256, capturedAt, localCommitSha, and deployedCommitSha`,
    );
  }

  const sha256 = captureRecord.sha256;
  if (typeof sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(sha256)) {
    throw new Error(`captures[${index}].sha256 must be a SHA-256 hex digest`);
  }
  const capturedAt = captureRecord.capturedAt;
  if (
    typeof capturedAt !== "string" ||
    !capturedAt.endsWith("Z") ||
    Number.isNaN(Date.parse(capturedAt))
  ) {
    throw new Error(
      `captures[${index}].capturedAt must be an ISO UTC timestamp`,
    );
  }
  const localCommitSha = captureRecord.localCommitSha;
  if (
    typeof localCommitSha !== "string" ||
    !/^[a-f0-9]{40}$/u.test(localCommitSha)
  ) {
    throw new Error(`captures[${index}].localCommitSha must be a commit SHA`);
  }
  const deployedCommitSha = captureRecord.deployedCommitSha;
  if (
    deployedCommitSha !== null &&
    (typeof deployedCommitSha !== "string" ||
      !/^[a-f0-9]{40}$/u.test(deployedCommitSha))
  ) {
    throw new Error(
      `captures[${index}].deployedCommitSha must be null or a commit SHA`,
    );
  }

  if (root !== undefined) {
    const absoluteOutput = path.resolve(root, outputFile);
    if (!fs.existsSync(absoluteOutput)) {
      throw new Error(`capture output is missing: ${outputFile}`);
    }
    const actualHash = createHash("sha256")
      .update(fs.readFileSync(absoluteOutput))
      .digest("hex");
    if (actualHash !== sha256) {
      throw new Error(`capture output hash does not match: ${outputFile}`);
    }
  }

  return { sha256, capturedAt, localCommitSha, deployedCommitSha };
}

export function validateContestEvidenceManifest(
  manifest: unknown,
  options: ValidationOptions = {},
): { valid: true; errors: [] } {
  const root =
    options.rootDir === undefined ? undefined : path.resolve(options.rootDir);
  const record = assertRecord(manifest, "evidence manifest");
  assertExactKeys(record, MANIFEST_KEYS, "evidence manifest");
  if (record.schemaVersion !== "1.0.0") {
    throw new Error("schemaVersion must be 1.0.0");
  }
  if (record.freezeRequired !== true) {
    throw new Error("evidence manifest freezeRequired must be true");
  }
  if (record.outputDirectory !== OUTPUT_DIRECTORY) {
    throw new Error(`outputDirectory must be ${OUTPUT_DIRECTORY}`);
  }
  if (!Array.isArray(record.captures) || record.captures.length === 0) {
    throw new Error("captures must be a non-empty array");
  }

  const knownClaimIds =
    options.knownClaimIds === undefined
      ? undefined
      : new Set(options.knownClaimIds);
  const evidenceIds = new Set<string>();
  const outputFiles = new Set<string>();

  const captures = record.captures.map((value, index) => {
    const captureRecord = assertRecord(value, `captures[${index}]`);
    assertExactKeys(
      captureRecord,
      [...CAPTURE_KEYS, ...CAPTURE_PROVENANCE_KEYS],
      `captures[${index}]`,
      CAPTURE_KEYS,
    );
    assertNonEmptyString(
      captureRecord.evidenceId,
      `captures[${index}].evidenceId`,
    );
    if (!/^[a-z][a-z0-9-]*$/u.test(captureRecord.evidenceId)) {
      throw new Error(`captures[${index}].evidenceId is invalid`);
    }
    if (evidenceIds.has(captureRecord.evidenceId)) {
      throw new Error(`duplicate evidenceId: ${captureRecord.evidenceId}`);
    }
    evidenceIds.add(captureRecord.evidenceId);

    assertNonEmptyString(captureRecord.route, `captures[${index}].route`);
    if (
      !captureRecord.route.startsWith("/") ||
      captureRecord.route.startsWith("//") ||
      /^(?:https?:)?\/\//iu.test(captureRecord.route) ||
      /[\s<>]/u.test(captureRecord.route)
    ) {
      throw new Error(
        `captures[${index}].route must be a local application route`,
      );
    }

    const viewport = validateViewport(captureRecord.viewport);
    if (
      typeof captureRecord.requiredVisible !== "object" ||
      !Array.isArray(captureRecord.requiredVisible) ||
      captureRecord.requiredVisible.length === 0
    ) {
      throw new Error(`captures[${index}].requiredVisible must be non-empty`);
    }
    const requiredVisible = captureRecord.requiredVisible.map(
      (item, itemIndex) => validateRequiredVisible(item, itemIndex),
    );

    if (
      !Array.isArray(captureRecord.claimIds) ||
      captureRecord.claimIds.length === 0 ||
      captureRecord.claimIds.some((claimId) => typeof claimId !== "string")
    ) {
      throw new Error(`captures[${index}].claimIds must be non-empty strings`);
    }
    const claimIds = captureRecord.claimIds as string[];
    if (new Set(claimIds).size !== claimIds.length) {
      throw new Error(`captures[${index}].claimIds must not repeat a claim`);
    }
    if (knownClaimIds !== undefined) {
      const unknownClaims = claimIds.filter(
        (claimId) => !knownClaimIds.has(claimId),
      );
      if (unknownClaims.length > 0) {
        throw new Error(
          `captures[${index}] references unknown claim(s): ${unknownClaims.join(", ")}`,
        );
      }
    }

    const outputFile = validateOutputFile(captureRecord.outputFile);
    if (outputFiles.has(outputFile)) {
      throw new Error(`duplicate outputFile: ${outputFile}`);
    }
    outputFiles.add(outputFile);
    if (typeof captureRecord.freezeRequired !== "boolean") {
      throw new Error(`captures[${index}].freezeRequired must be boolean`);
    }
    assertNonEmptyString(
      captureRecord.redactionRule,
      `captures[${index}].redactionRule`,
    );
    if (!/fresh|anonymous/iu.test(captureRecord.redactionRule)) {
      throw new Error(
        `captures[${index}].redactionRule must require a fresh or anonymous context`,
      );
    }

    const provenance = validateCaptureProvenance(
      captureRecord,
      index,
      root,
      outputFile,
      options.requireProvenance === true,
    );

    if (
      root !== undefined &&
      captureRecord.freezeRequired === true &&
      options.freezeRecordPresent !== true &&
      fs.existsSync(path.join(root, outputFile))
    ) {
      throw new Error(
        `capture output already exists before the freeze record: ${outputFile}`,
      );
    }

    return {
      evidenceId: captureRecord.evidenceId,
      route: captureRecord.route,
      viewport,
      requiredVisible,
      claimIds,
      outputFile,
      freezeRequired: captureRecord.freezeRequired,
      redactionRule: captureRecord.redactionRule,
      ...provenance,
    } satisfies ContestEvidenceCapture;
  });

  void captures;
  return { valid: true, errors: [] };
}

export function loadAndValidateContestEvidenceManifest(
  filePath: string,
  options: Omit<ValidationOptions, "rootDir"> = {},
): ContestEvidenceManifest {
  const manifest = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  validateContestEvidenceManifest(manifest, options);
  return manifest as ContestEvidenceManifest;
}

export function validateContestEvidenceManifestFromRoot(
  rootDir = process.cwd(),
): ContestEvidenceManifest {
  const resolvedRoot = path.resolve(rootDir);
  const claims = loadAndValidateContestClaims(
    path.join(resolvedRoot, "docs", "contest", "claim-ledger.json"),
  );
  const manifestPath = path.join(
    resolvedRoot,
    "docs",
    "contest",
    "evidence-capture.json",
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
  validateContestEvidenceManifest(manifest, {
    rootDir: resolvedRoot,
    knownClaimIds: claims.map(({ claimId }) => claimId),
    freezeRecordPresent: fs.existsSync(
      path.join(resolvedRoot, "docs", "contest", "coverage-freeze.json"),
    ),
    requireProvenance: fs.existsSync(
      path.join(resolvedRoot, "docs", "contest", "coverage-freeze.json"),
    ),
  });
  return manifest as ContestEvidenceManifest;
}

function formatRequiredVisible(requiredVisible: RequiredVisible[]): string {
  return requiredVisible
    .map((item) =>
      item.kind === "text"
        ? `texto «${item.value}»`
        : `rol ${item.role} «${item.name}»`,
    )
    .join("; ");
}

export function renderContestEvidenceChecklist(
  manifest: ContestEvidenceManifest,
): string {
  const rows = manifest.captures
    .map((capture) => {
      const claimList = capture.claimIds
        .map((claimId) => "`" + claimId + "`")
        .join(", ");
      return [
        "| `",
        capture.evidenceId,
        "` | `",
        capture.route,
        "` | ",
        `${capture.viewport.width}×${capture.viewport.height}`,
        " | ",
        formatRequiredVisible(capture.requiredVisible),
        " | ",
        claimList,
        " | `",
        capture.outputFile,
        "` | ",
        capture.freezeRequired ? "sí" : "no",
        " | ",
        capture.redactionRule,
        " |",
      ].join("");
    })
    .join("\n");
  return [
    "# Contest evidence capture checklist",
    "",
    "This checklist is rendered from `docs/contest/evidence-capture.json`. Capture only the listed routes and viewports after the coverage freeze. Do not submit the application from this checklist.",
    "",
    "<!-- prettier-ignore -->",
    "| Evidence | Route | Viewport | Required visible state | Claim IDs | Output | Freeze required | Privacy/redaction rule |",
    "| --- | --- | ---: | --- | --- | --- | --- | --- |",
    rows,
    "",
    "## Operator gates",
    "",
    "- [x] Use a fresh anonymous browser context for every capture.",
    "- [x] Confirm the displayed route is the local or deployed root application, not a deep route submitted to the contest.",
    "- [x] Wait for loading to settle, then run the matching Axe, overflow, request, and console checks.",
    "- [ ] Inspect the original PNG for browser chrome, personal data, account state, cookies, tokens, local filesystem paths, clipping, and misleading empty states.",
    "- [x] Record the coverage-freeze commit and local capture commit; record the deployed commit after live verification.",
    "- [ ] Have a reviewer compare each image with the claim ledger and the frozen data before committing evidence.",
    "",
  ].join("\n");
}

export function writeContestEvidenceChecklist(rootDir = process.cwd()): void {
  const resolvedRoot = path.resolve(rootDir);
  const manifest = validateContestEvidenceManifestFromRoot(resolvedRoot);
  fs.writeFileSync(
    path.join(resolvedRoot, CHECKLIST_PATH),
    renderContestEvidenceChecklist(manifest),
    "utf8",
  );
}

if (
  path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename)
) {
  const rootDir = process.cwd();
  const manifest = validateContestEvidenceManifestFromRoot(rootDir);
  const rendered = renderContestEvidenceChecklist(manifest);
  const checklistPath = path.join(rootDir, CHECKLIST_PATH);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(checklistPath, rendered, "utf8");
    console.info("Contest evidence manifest validated and checklist rendered.");
  } else {
    if (!fs.existsSync(checklistPath)) {
      throw new Error(`Missing ${CHECKLIST_PATH}; run with --write first.`);
    }
    const existing = fs.readFileSync(checklistPath, "utf8");
    if (existing !== rendered) {
      throw new Error(
        `${CHECKLIST_PATH} is not byte-identical to the manifest renderer.`,
      );
    }
    console.info("Contest evidence manifest and checklist are valid.");
  }
}
