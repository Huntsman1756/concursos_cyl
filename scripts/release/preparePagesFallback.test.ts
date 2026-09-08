import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { expect, it } from "vitest";
const require = createRequire(import.meta.url);
it("materializes known Pages deep links while retaining a true unknown-route fallback", async () => {
  const root = await mkdtemp(join(tmpdir(), "salida-pages-"));
  try {
    const snapshot = "/data/v1/snapshots/20260908-abcdef/";
    await mkdir(join(root, "dist", snapshot.slice(1)), { recursive: true });
    await writeFile(join(root, "dist/index.html"), '<main id="root"></main>');
    await writeFile(
      join(root, "dist/data/v1/manifest.json"),
      JSON.stringify({
        resourceSnapshots: {
          programs: { resourcePath: snapshot + "programs.json" },
          occupations: { resourcePath: snapshot + "occupations.json" },
        },
      }),
    );
    await writeFile(
      join(root, "dist", snapshot.slice(1), "programs.json"),
      JSON.stringify([{ programKey: "ADG02S" }]),
    );
    await writeFile(
      join(root, "dist", snapshot.slice(1), "occupations.json"),
      JSON.stringify([{ occupationId: "cno-4111" }]),
    );
    execFileSync(
      process.execPath,
      [
        require.resolve("tsx/cli"),
        resolve("scripts/release/preparePagesFallback.ts"),
      ],
      { cwd: root, timeout: 20000 },
    );
    for (const path of [
      "desde-fp/ADG02S/index.html",
      "desde-fp/ADG02S/ofertas/index.html",
      "desde-ocupacion/cno-4111/index.html",
      "404.html",
    ])
      expect(await readFile(join(root, "dist", path), "utf8")).toContain(
        'id="root"',
      );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
