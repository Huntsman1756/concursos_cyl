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

    expect(deployScript).toContain('$env:VITE_PUBLIC_BASE_PATH = "/"');
    expect(deployScript).toContain("npm ci");
    expect(deployScript).toContain("mv -Tf");
    expect(deployScript).toContain("tail -n +6");
    expect(deployScript).toContain("CADDY_SMOKE_BASE_URL");
    expect(deployScript).toContain("npm run release:caddy:verify");
  });
});
