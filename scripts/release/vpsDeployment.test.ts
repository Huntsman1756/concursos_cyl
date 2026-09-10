import { spawnSync } from "node:child_process";
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const scriptPath = resolve(root, "scripts/release/deployVps.sh");

/**
 * Resolves a POSIX shell for the deployment harness. deployVps.sh is a POSIX
 * deployment script, so its execution tests require a real POSIX shell; the
 * static contract tests run everywhere. On Windows the shell is only present
 * when Git for Windows (or another POSIX environment) is installed, so the
 * harness resolves it explicitly instead of assuming `sh` is on PATH.
 */
function resolvePosixShell(): string | null {
  const probe = spawnSync("sh", ["-c", "exit 0"], { stdio: "ignore" });
  if (probe.error === undefined && probe.status === 0) return "sh";
  if (process.platform !== "win32") return null;
  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const programFilesX86 =
    process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA;
  const candidates = [
    join(programFiles, "Git", "usr", "bin", "sh.exe"),
    join(programFiles, "Git", "bin", "sh.exe"),
    join(programFilesX86, "Git", "usr", "bin", "sh.exe"),
    join(programFilesX86, "Git", "bin", "sh.exe"),
    ...(localAppData === undefined
      ? []
      : [
          join(localAppData, "Programs", "Git", "usr", "bin", "sh.exe"),
          join(localAppData, "Programs", "Git", "bin", "sh.exe"),
        ]),
  ];
  for (const candidate of candidates) {
    if (pathExists(candidate)) return candidate;
  }
  return null;
}

const posixShell = resolvePosixShell();

/**
 * The fake scripts are POSIX sh. When the resolved shell comes from a Git for
 * Windows installation, its coreutils live next to it and must stay on the
 * child PATH (Git Bash auto-converts the Windows-style PATH it receives).
 */
function childPath(...extraDirs: readonly string[]): string {
  const shellDirs =
    posixShell !== null && posixShell !== "sh" ? [dirname(posixShell)] : [];
  return [...extraDirs, ...shellDirs, process.env.PATH ?? ""]
    .filter((entry) => entry !== "")
    .join(delimiter);
}

/**
 * Creates a portable symbolic link. Windows lacks the privileges to create a
 * native file symlink in the test sandbox, so a directory target becomes a
 * junction, which Git Bash still reports through `test -L`.
 */
function createSymlink(target: string, linkPath: string): void {
  const targetIsDirectory = (() => {
    try {
      return statSync(target).isDirectory();
    } catch {
      return false;
    }
  })();
  try {
    symlinkSync(target, linkPath, targetIsDirectory ? "dir" : "file");
    return;
  } catch {
    const result = spawnSync("ln", ["-s", target, linkPath], {
      stdio: "ignore",
    });
    if (result.error !== undefined || result.status !== 0) {
      throw new Error(`could not create test symlink ${linkPath}`);
    }
  }
}

function writeExecutable(path: string, contents: string): void {
  writeFileSync(path, contents, "utf8");
  chmodSync(path, 0o755);
}

function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function runWithValidationFakes(args: string[]) {
  const fakeBin = mkdtempSync(join(tmpdir(), "cyl-vps-validation-"));
  writeExecutable(
    join(fakeBin, "git"),
    `#!/bin/sh
case "$*" in
  *--show-toplevel*) printf '%s\\n' '${root}';;
  *'rev-parse HEAD'*) printf '%s\\n' 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';;
  *'status --porcelain'*) exit 0;;
  *) exit 1;;
esac
`,
  );
  writeExecutable(join(fakeBin, "npm"), "#!/bin/sh\nexit 77\n");

  try {
    return spawnSync(posixShell ?? "sh", [scriptPath, ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: childPath(fakeBin),
      },
    });
  } finally {
    rmSync(fakeBin, { force: true, recursive: true });
  }
}

function runWithDeploymentFakes(options: {
  observedSha?: string;
  observedTarget?: string;
  preserveSandbox?: boolean;
  scpExit?: number;
  sshExit?: number;
  sshMode?: "release-exists";
  verifyExit?: number;
}) {
  const sandbox = mkdtempSync(join(tmpdir(), "cyl-vps-deployment-"));
  const fakeBin = join(sandbox, "bin");
  const fixtureRoot = join(sandbox, "root");
  const traceFile = join(sandbox, "trace");
  const sshCommandFile = join(sandbox, "ssh-command");
  mkdirSync(fakeBin);
  mkdirSync(join(fixtureRoot, "node_modules", ".bin"), { recursive: true });

  writeExecutable(
    join(fakeBin, "git"),
    `#!/bin/sh
case "$*" in
  *--show-toplevel*) printf '%s\\n' "$FIXTURE_ROOT";;
  *'rev-parse HEAD'*) printf '%s\\n' 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';;
  *'status --porcelain'*) exit 0;;
  *) exit 1;;
esac
`,
  );
  writeExecutable(
    join(fakeBin, "npm"),
    `#!/bin/sh
case "$*" in
  ci) exit 0;;
  'run build') mkdir -p dist; printf '%s\\n' '<html></html>' > dist/index.html; exit 0;;
  'run release:caddy:verify') exit "\${CADDY_VERIFY_EXIT:-0}";;
  *) exit 1;;
esac
`,
  );
  writeExecutable(
    join(fixtureRoot, "node_modules", ".bin", "tsx"),
    `#!/bin/sh
printf '{"schemaVersion":"1.0.0","commit":"%s"}\\n' "$3" > "$2/version.json"
`,
  );
  writeExecutable(join(fakeBin, "tar"), '#!/bin/sh\n: > "$2"\n');
  writeExecutable(
    join(fakeBin, "scp"),
    '#!/bin/sh\nprintf \'%s\\n\' scp >> "$TRACE_FILE"\nexit "${SCP_EXIT:-0}"\n',
  );
  writeExecutable(
    join(fakeBin, "ssh"),
    '#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$SSH_COMMAND_FILE"\ncase "${SSH_MODE:-}" in\n  release-exists) exit 17;;\nesac\ncase "$*" in\n  *version.json*) printf \'%s\\n\' "${OBSERVED_SHA:-}";;\n  *readlink*) printf \'%s\\n\' "${OBSERVED_TARGET:-}";;\nesac\nexit "${SSH_EXIT:-0}"\n',
  );

  const result = spawnSync(
    posixShell ?? "sh",
    [scriptPath, "salida-cyl-vps", "round-1"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        CADDY_VERIFY_EXIT: String(options.verifyExit ?? 0),
        FIXTURE_ROOT: fixtureRoot,
        PATH: childPath(fakeBin),
        OBSERVED_SHA: options.observedSha ?? "",
        OBSERVED_TARGET: options.observedTarget ?? "",
        SSH_COMMAND_FILE: sshCommandFile,
        SSH_EXIT: String(options.sshExit ?? 0),
        SSH_MODE: options.sshMode ?? "",
        SCP_EXIT: String(options.scpExit ?? 0),
        TRACE_FILE: traceFile,
      },
    },
  );
  const sshCommand = readFileSync(sshCommandFile, "utf8");
  const remotePayload = sshCommand.slice(sshCommand.indexOf("set -eu"));
  if (!options.preserveSandbox) {
    rmSync(sandbox, { force: true, recursive: true });
  }
  return { result, remotePayload, sandbox, sshCommand };
}

function runRemotePayloadInIsolation(
  remotePayload: string,
  options: {
    existingCurrentNext?: "directory" | "symlink";
    existingDeployLock?: boolean;
    existingFinal?: "directory" | "file" | "symlink";
    existingStaging?: boolean;
    findExit?: number;
    systemctlExit?: number;
    tarExit?: number;
  } = {},
) {
  const sandbox = mkdtempSync(join(tmpdir(), "cyl-vps-remote-"));
  const fakeBin = join(sandbox, "bin");
  const releases = join(sandbox, "srv", "salida-cyl", "releases");
  const archiveDir = join(sandbox, "tmp");
  const archive = join(archiveDir, "salida-cyl-round-1.tar.gz.testnonce");
  const finalRelease = join(releases, "round-1");
  const staging = join(releases, ".staging-round-1");
  const currentNext = join(sandbox, "srv", "salida-cyl", "current.next");
  const deployLock = join(sandbox, "srv", "salida-cyl", ".deploy-lock");
  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(releases, { recursive: true });
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(archive, "archive", "utf8");

  if (options.existingDeployLock) {
    mkdirSync(deployLock);
  }

  if (options.existingStaging) {
    mkdirSync(staging);
    writeFileSync(join(staging, "marker"), "keep", "utf8");
  }
  if (options.existingFinal === "directory") {
    mkdirSync(finalRelease);
    writeFileSync(join(finalRelease, "marker"), "keep", "utf8");
  } else if (options.existingFinal === "file") {
    writeFileSync(finalRelease, "keep", "utf8");
  } else if (options.existingFinal === "symlink") {
    writeFileSync(join(sandbox, "old-target"), "keep", "utf8");
    writeFileSync(finalRelease, "dangling", "utf8");
    rmSync(finalRelease);
    createSymlink(join(sandbox, "old-target"), finalRelease);
  }
  if (options.existingCurrentNext === "directory") {
    mkdirSync(currentNext);
    writeFileSync(join(currentNext, "marker"), "keep", "utf8");
  } else if (options.existingCurrentNext === "symlink") {
    createSymlink(join(sandbox, "old-target"), currentNext);
  }

  writeExecutable(
    join(fakeBin, "tar"),
    '#!/bin/sh\nif [ "${TAR_EXIT:-0}" -ne 0 ]; then exit "$TAR_EXIT"; fi\ndestination=\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = "-C" ]; then destination=$2; shift 2; else shift; fi\ndone\nmkdir -p "$destination"\nprintf index > "$destination/index.html"\nprintf version > "$destination/version.json"\n',
  );
  writeExecutable(join(fakeBin, "chown"), "#!/bin/sh\nexit 0\n");
  writeExecutable(
    join(fakeBin, "mv"),
    '#!/bin/sh\nif [ "$1" = "-Tn" ]; then\n  if [ -e "$3" ] || [ -L "$3" ]; then exit 0; fi\n  /bin/mv "$2" "$3"\nelif [ "$1" = "-Tf" ]; then\n  /bin/rm -rf "$3" 2>/dev/null || :\n  /bin/mv "$2" "$3"\nelse\n  /bin/mv "$@"\nfi\n',
  );
  writeExecutable(
    join(fakeBin, "systemctl"),
    '#!/bin/sh\nexit "${SYSTEMCTL_EXIT:-0}"\n',
  );
  writeExecutable(join(fakeBin, "find"), '#!/bin/sh\nexit "${FIND_EXIT:-0}"\n');
  writeExecutable(
    join(fakeBin, "ln"),
    '#!/bin/sh\nif [ "$1" = "-s" ]; then\n  node -e "const fs=require(\'node:fs\');const t=process.argv[1];const l=process.argv[2];let isDir=false;try{isDir=fs.statSync(t).isDirectory()}catch{}fs.symlinkSync(t,l,isDir?\'dir\':\'file\')" "$2" "$3"\n  exit $?\nfi\nexit 1\n',
  );

  const remappedPayload = remotePayload
    .replaceAll("/srv/salida-cyl", join(sandbox, "srv", "salida-cyl"))
    .replaceAll(/\/tmp\/salida-cyl-round-1\.tar\.gz\.[A-Za-z0-9]+/g, archive);
  const result = spawnSync(posixShell ?? "sh", ["-c", remappedPayload], {
    encoding: "utf8",
    env: {
      ...process.env,
      FIND_EXIT: String(options.findExit ?? 0),
      PATH: childPath(fakeBin),
      SYSTEMCTL_EXIT: String(options.systemctlExit ?? 0),
      TAR_EXIT: String(options.tarExit ?? 0),
    },
  });
  const state = {
    archiveExists: pathExists(archive),
    currentNextExists: pathExists(currentNext),
    deployLockExists: pathExists(deployLock),
    finalExists: pathExists(finalRelease),
    stagingExists: pathExists(staging),
  };
  rmSync(sandbox, { force: true, recursive: true });
  return { result, state };
}

describe("VPS deployment contract", () => {
  it("serves the root build with HTTPS, SPA fallback and hardened headers", () => {
    const caddyfile = readFileSync(
      resolve(root, "deploy/vps/Caddyfile"),
      "utf8",
    );

    expect(caddyfile).toContain("salidacyl.es {");
    expect(caddyfile).toContain("root * /srv/salida-cyl/current");
    expect(caddyfile).toContain("try_files {path} /index.html");
    expect(caddyfile).toContain("Strict-Transport-Security");
    expect(caddyfile).toContain("Content-Security-Policy");
    expect(caddyfile).toContain('?Cache-Control "no-cache"');
    expect(caddyfile).toContain(
      'Cache-Control "public, max-age=31536000, immutable"',
    );
  });

  it("routes Windows deployment through the same locked POSIX implementation", () => {
    const deployScript = readFileSync(
      resolve(root, "scripts/release/deployVps.ps1"),
      "utf8",
    );
    expect(deployScript).toContain('Join-Path $PSScriptRoot "deployVps.sh"');
    expect(deployScript).toContain(
      "& $bashExecutable $deploymentScript $SshHost $ReleaseId",
    );
    expect(deployScript).toContain("if ($LASTEXITCODE -ne 0)");
    expect(deployScript).toContain("$env:CADDY_SMOKE_BASE_URL = $oldSmokeUrl");
    expect(deployScript).not.toContain("ssh $SshHost");
  });

  it("defines the POSIX deployment contract and its ordered remote checks", () => {
    const deployScript = readFileSync(
      resolve(root, "scripts/release/deployVps.sh"),
      "utf8",
    );

    expect(deployScript).toContain("set -eu");
    expect(deployScript).toContain("git status --porcelain");
    expect(deployScript).toContain('export VITE_PUBLIC_BASE_PATH="/"');
    expect(deployScript).toContain("npm ci");
    expect(deployScript).toContain("npm run build");
    expect(deployScript).toContain("writeVersionMetadata.ts");
    expect(deployScript).toContain("mktemp");
    expect(deployScript).toMatch(/mktemp "[^"\n]*\.tar\.gz\.XXXXXX"/);
    expect(deployScript).toContain(
      'REMOTE_ARCHIVE="/tmp/$(basename "$ARCHIVE")"',
    );
    expect(deployScript).toContain("trap cleanup EXIT");
    expect(deployScript).toContain("trap remote_cleanup EXIT");
    expect(deployScript).toContain("deploy_lock_owned=0");
    expect(deployScript).toContain("mkdir '$REMOTE_DEPLOY_LOCK'");
    expect(deployScript).toContain("rmdir '$REMOTE_DEPLOY_LOCK'");
    expect(deployScript).toContain("scp");
    expect(deployScript).toContain("test -f");
    expect(deployScript).toContain("index.html");
    expect(deployScript).toContain("version.json");
    expect(deployScript).toContain("mv -Tf");
    expect(deployScript).toContain("retention_inventory=");
    expect(deployScript).toContain("retention_candidates=");
    expect(deployScript).not.toContain("tail -n +6 | cut");
    expect(deployScript).toContain("! -name '.staging-*'");
    expect(deployScript).toContain("systemctl reload caddy");
    expect(deployScript).toContain("CADDY_SMOKE_EXPECTED_COMMIT");
    expect(deployScript).toContain("npm run release:caddy:verify");

    const remoteCommands = [
      "mkdir -m 0755",
      "tar -xzf",
      "chown -R",
      "test -f",
      "mv -Tn '$REMOTE_STAGING' '$REMOTE_RELEASE'",
      "ln -s",
      "mv -Tf '$REMOTE_CURRENT_NEXT' '$REMOTE_CURRENT'",
      "rm -f '$REMOTE_ARCHIVE'",
      "retention_inventory=\\$(mktemp",
      "tail -n +6",
      "systemctl reload caddy",
    ];
    const remoteSection = deployScript.slice(
      deployScript.indexOf('ssh "$SSH_HOST" "set -eu'),
    );
    let previousIndex = -1;
    for (const command of remoteCommands) {
      const index = remoteSection.indexOf(command);
      expect(index, `missing remote command: ${command}`).toBeGreaterThan(-1);
      expect(index, `${command} is out of order`).toBeGreaterThan(
        previousIndex,
      );
      previousIndex = index;
    }
  });
});

describe.skipIf(posixShell === null)("VPS deployment POSIX execution", () => {
  it("rejects an unsafe SSH host before attempting deployment", () => {
    const result = spawnSync(
      posixShell ?? "sh",
      [scriptPath, "host with spaces"],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("SSH host contains unsupported characters");
  });

  it.each(["-salida-cyl-vps", "-", "--host"])(
    "rejects SSH hosts beginning with '-' (%s)",
    (host) => {
      const result = runWithValidationFakes([host]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("SSH host must not start with '-'");
    },
  );

  it.each([".", "..", "../release", "release/../current", "..\\release"])(
    "rejects traversal-like release IDs (%s)",
    (releaseId) => {
      const result = runWithValidationFakes(["salida-cyl-vps", releaseId]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "Release ID contains unsupported characters",
      );
    },
  );

  it.each([".staging-round-1", ".staging-"])(
    "rejects the reserved staging release prefix (%s)",
    (releaseId) => {
      const result = runWithValidationFakes(["salida-cyl-vps", releaseId]);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "Release ID contains unsupported characters",
      );
    },
  );

  it("reports release, expected commit and activation state when remote activation fails", () => {
    const { result, sshCommand } = runWithDeploymentFakes({ sshExit: 23 });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Remote activation failed for release round-1",
    );
    expect(result.stderr).toContain(
      "expected commit aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(result.stderr).toContain("observed SHA: unknown");
    expect(result.stderr).toContain("current activation state: unknown");
    expect(sshCommand).toContain("trap remote_cleanup EXIT");
    expect(sshCommand).toMatch(
      /rm -f -- '\/tmp\/salida-cyl-round-1\.tar\.gz\.[A-Za-z0-9]+'/,
    );
    expect(sshCommand).toContain(
      "salida-cyl-vps rm -f -- '/tmp/salida-cyl-round-1.tar.gz.",
    );
  });

  it("reports the active release when live verification fails", () => {
    const { result } = runWithDeploymentFakes({
      observedSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      observedTarget: "/srv/salida-cyl/releases/round-1",
      verifyExit: 31,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Live deployment verification failed for release round-1",
    );
    expect(result.stderr).toContain(
      "expected commit aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    expect(result.stderr).toContain(
      "observed SHA: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );
    expect(result.stderr).toContain(
      "current activation state: release round-1",
    );
  });

  it("refuses an existing remote release before extracting into staging", () => {
    const { result, sshCommand } = runWithDeploymentFakes({
      sshMode: "release-exists",
    });

    expect(result.status).toBe(1);
    const releaseGuard = sshCommand.indexOf(
      "test -e '/srv/salida-cyl/releases/round-1'",
    );
    const extraction = sshCommand.indexOf(
      "tar -xzf '/tmp/salida-cyl-round-1.tar.gz.",
    );
    expect(releaseGuard).toBeGreaterThan(-1);
    expect(sshCommand).toContain("test -L '/srv/salida-cyl/releases/round-1'");
    expect(sshCommand).toContain("/srv/salida-cyl/releases/.staging-round-1");
    expect(sshCommand).toContain(
      " -C '/srv/salida-cyl/releases/.staging-round-1'",
    );
    expect(sshCommand).toContain(
      "test -e '/srv/salida-cyl/releases/.staging-round-1'",
    );
    expect(extraction).toBeGreaterThan(releaseGuard);
  });

  it("attempts only bounded remote archive cleanup when scp fails", () => {
    const { result, sshCommand } = runWithDeploymentFakes({
      scpExit: 19,
      sshExit: 31,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Archive upload failed for release round-1",
    );
    expect(sshCommand).toMatch(
      /rm -f -- '\/tmp\/salida-cyl-round-1\.tar\.gz\.[A-Za-z0-9]+'/,
    );
    expect(sshCommand).not.toContain("REMOTE_STAGING");
  });

  it("preserves preexisting staging and current.next paths during remote failure", () => {
    const capture = runWithDeploymentFakes({ preserveSandbox: true });
    try {
      const staging = runRemotePayloadInIsolation(capture.remotePayload, {
        existingCurrentNext: "directory",
        existingStaging: true,
        tarExit: 41,
      });

      expect(staging.result.status).not.toBe(0);
      expect(staging.state.stagingExists).toBe(true);
      expect(staging.state.currentNextExists).toBe(true);
      expect(staging.state.archiveExists).toBe(false);
    } finally {
      rmSync(capture.sandbox, { force: true, recursive: true });
    }
  });

  it("removes owned staging and archive after extraction failure", () => {
    const capture = runWithDeploymentFakes({ preserveSandbox: true });
    try {
      const failed = runRemotePayloadInIsolation(capture.remotePayload, {
        tarExit: 41,
      });

      expect(failed.result.status).not.toBe(0);
      expect(failed.state.stagingExists).toBe(false);
      expect(failed.state.archiveExists).toBe(false);
    } finally {
      rmSync(capture.sandbox, { force: true, recursive: true });
    }
  });

  it("fails closed when release retention inventory cannot be produced", () => {
    const capture = runWithDeploymentFakes({ preserveSandbox: true });
    try {
      const failed = runRemotePayloadInIsolation(capture.remotePayload, {
        findExit: 42,
      });

      expect(failed.result.status).not.toBe(0);
      expect(failed.result.stderr).toContain(
        "Could not inventory releases for retention.",
      );
    } finally {
      rmSync(capture.sandbox, { force: true, recursive: true });
    }
  });

  it("refuses concurrent activation while preserving the existing deploy lock", () => {
    const capture = runWithDeploymentFakes({ preserveSandbox: true });
    try {
      const failed = runRemotePayloadInIsolation(capture.remotePayload, {
        existingDeployLock: true,
      });

      expect(failed.result.status).not.toBe(0);
      expect(failed.result.stderr).toContain(
        "Another VPS deployment is already active.",
      );
      expect(failed.state.deployLockExists).toBe(true);
      expect(failed.state.finalExists).toBe(false);
    } finally {
      rmSync(capture.sandbox, { force: true, recursive: true });
    }
  });

  it.each(["directory", "symlink"] as const)(
    "preserves a preexisting current.next %s",
    (existingCurrentNext) => {
      const capture = runWithDeploymentFakes({ preserveSandbox: true });
      try {
        const failed = runRemotePayloadInIsolation(capture.remotePayload, {
          existingCurrentNext,
        });

        expect(failed.result.status).not.toBe(0);
        expect(failed.state.currentNextExists).toBe(true);
      } finally {
        rmSync(capture.sandbox, { force: true, recursive: true });
      }
    },
  );

  it.each(["directory", "file", "symlink"] as const)(
    "refuses a preexisting final release without overwriting the %s",
    (existingFinal) => {
      const capture = runWithDeploymentFakes({ preserveSandbox: true });
      try {
        const final = runRemotePayloadInIsolation(capture.remotePayload, {
          existingFinal,
        });

        expect(final.result.status).not.toBe(0);
        expect(final.state.finalExists).toBe(true);
        expect(final.state.stagingExists).toBe(false);
      } finally {
        rmSync(capture.sandbox, { force: true, recursive: true });
      }
    },
  );

  it("uses a no-clobber final rename before switching current", () => {
    const capture = runWithDeploymentFakes({ preserveSandbox: true });
    try {
      expect(capture.remotePayload).toContain(
        "mv -Tn '/srv/salida-cyl/releases/.staging-round-1' '/srv/salida-cyl/releases/round-1'",
      );
    } finally {
      rmSync(capture.sandbox, { force: true, recursive: true });
    }
  });
});
