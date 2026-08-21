import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

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
    expect(deployScript).toContain("trap cleanup EXIT");
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
      "ln -sfn",
      "mv -Tf",
      "rm -f",
      "tail -n +6",
      "systemctl reload caddy",
    ];
    const remoteSection = deployScript.slice(
      deployScript.indexOf('ssh "$SSH_HOST"'),
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
    const scriptPath = resolve(root, "scripts/release/deployVps.sh");
    const result = spawnSync("sh", [scriptPath, "host with spaces"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("SSH host contains unsupported characters");
  });
});
