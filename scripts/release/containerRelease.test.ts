import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("release container", () => {
  it("pins both official base images by exact multi-platform digest", async () => {
    const dockerfile = await readFile(resolve("Dockerfile"), "utf8");
    expect(dockerfile).toContain(
      "FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS build",
    );
    expect(dockerfile).toContain(
      "FROM caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648",
    );
    expect(dockerfile).not.toMatch(/^FROM [^\n@]+$/gmu);
  });
});
