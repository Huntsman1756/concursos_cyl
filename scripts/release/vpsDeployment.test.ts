import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const scriptPath = resolve(root, "scripts/release/deployVps.sh");

function writeExecutable(path: string, contents: string): void {
  writeFileSync(path, contents, "utf8");
  chmodSync(path, 0o755);
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
    return spawnSync("sh", [scriptPath, ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
      },
    });
  } finally {
    rmSync(fakeBin, { force: true, recursive: true });
  }
}

function runWithDeploymentFakes(options: {
  observedSha?: string;
  observedTarget?: string;
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

  const result = spawnSync("sh", [scriptPath, "salida-cyl-vps", "round-1"], {
    encoding: "utf8",
    env: {
      ...process.env,
      CADDY_VERIFY_EXIT: String(options.verifyExit ?? 0),
      FIXTURE_ROOT: fixtureRoot,
      PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
      OBSERVED_SHA: options.observedSha ?? "",
      OBSERVED_TARGET: options.observedTarget ?? "",
      SSH_COMMAND_FILE: sshCommandFile,
      SSH_EXIT: String(options.sshExit ?? 0),
      SSH_MODE: options.sshMode ?? "",
      SCP_EXIT: String(options.scpExit ?? 0),
      TRACE_FILE: traceFile,
    },
  });
  const sshCommand = readFileSync(sshCommandFile, "utf8");
  rmSync(sandbox, { force: true, recursive: true });
  return { result, sshCommand };
}

describe("VPS deployment", () => {
  it("serves the root build with HTTPS, SPA fallback and hardened headers", () => {
    const caddyfile = readFileSync(
      resolve(root, "deploy/vps/Caddyfile"),
      "utf8",
    );

    expect(caddyfile).toContain("salida-cyl.157-90-22-40.sslip.io {");
    expect(caddyfile).toContain("root * /srv/salida-cyl/current");
    expect(caddyfile).toContain("try_files {path} /index.html");
    expect(caddyfile).toContain("Strict-Transport-Security");
    expect(caddyfile).toContain("Content-Security-Policy");
    expect(caddyfile).toContain('?Cache-Control "no-cache"');
    expect(caddyfile).toContain(
      'Cache-Control "public, max-age=31536000, immutable"',
    );
  });

  it("builds from scratch, activates atomically and verifies production", () => {
    const deployScript = readFileSync(
      resolve(root, "scripts/release/deployVps.ps1"),
      "utf8",
    );

    expect(deployScript).toContain("git status --porcelain");
    expect(deployScript).toContain(
      'if ($LASTEXITCODE -ne 0) { throw "git status failed." }',
    );
    expect(deployScript).toContain("npm ci");
    expect(deployScript).toContain("mv -Tf");
    expect(deployScript).toContain("tail -n +6");
    expect(deployScript).toContain("CADDY_SMOKE_BASE_URL");
    expect(deployScript).toContain("npm run release:caddy:verify");
    // scriptRelPath must not exist; scriptFullPath built directly from root
    expect(deployScript).not.toContain("scriptRelPath");
    expect(deployScript).toContain(
      "Join-Path $root 'scripts\\release\\writeVersionMetadata.ts'",
    );
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
    expect(deployScript).toContain("trap cleanup EXIT");
    expect(deployScript).toContain("trap remote_cleanup EXIT");
    expect(deployScript).toContain("scp");
    expect(deployScript).toContain("test -f");
    expect(deployScript).toContain("index.html");
    expect(deployScript).toContain("version.json");
    expect(deployScript).toContain("mv -Tf");
    expect(deployScript).toContain("tail -n +6");
    expect(deployScript).toContain("systemctl reload caddy");
    expect(deployScript).toContain("CADDY_SMOKE_EXPECTED_COMMIT");
    expect(deployScript).toContain("npm run release:caddy:verify");

    const remoteCommands = [
      "install -d",
      "tar -xzf",
      "chown -R",
      "test -f",
      "mv -Tf '$REMOTE_STAGING' '$REMOTE_RELEASE'",
      "ln -sfn",
      "mv -Tf '/srv/salida-cyl/current.next' '/srv/salida-cyl/current'",
      "rm -f '$REMOTE_ARCHIVE'",
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

  it("rejects an unsafe SSH host before attempting deployment", () => {
    const result = spawnSync("sh", [scriptPath, "host with spaces"], {
      encoding: "utf8",
    });

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
    expect(sshCommand).toContain("rm -f -- '/tmp/salida-cyl-round-1.tar.gz'");
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
      "tar -xzf '/tmp/salida-cyl-round-1.tar.gz'",
    );
    expect(releaseGuard).toBeGreaterThan(-1);
    expect(sshCommand).toContain("test -L '/srv/salida-cyl/releases/round-1'");
    expect(sshCommand).toContain("/srv/salida-cyl/releases/.staging-round-1");
    expect(sshCommand).toContain(
      "tar -xzf '/tmp/salida-cyl-round-1.tar.gz' -C '/srv/salida-cyl/releases/.staging-round-1'",
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
    expect(sshCommand).toContain("rm -f -- '/tmp/salida-cyl-round-1.tar.gz'");
    expect(sshCommand).not.toContain("REMOTE_STAGING");
  });
});
