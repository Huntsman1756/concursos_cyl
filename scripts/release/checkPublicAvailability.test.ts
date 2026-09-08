import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkPublicAvailability } from "./checkPublicAvailability";
const manifest = readFileSync("public/data/v1/manifest.json", "utf8");
function mockFetch(broken = ""): typeof fetch {
  return (async (input: string | URL | Request) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith(broken) && broken)
      return new Response('<div id="root"></div>', {
        headers: { "content-type": "text/html" },
      });
    if (path.endsWith("version.json"))
      return Response.json({ commit: "a".repeat(40) });
    if (path.endsWith("manifest.json"))
      return new Response(manifest, {
        headers: { "content-type": "application/json" },
      });
    if (path.endsWith(".avif"))
      return new Response("image-bytes", {
        headers: { "content-type": "image/avif" },
      });
    if (path.endsWith(".pdf"))
      return new Response("%PDF", {
        headers: { "content-type": "application/pdf" },
      });
    return new Response('<div id="root"></div>', {
      headers: { "content-type": "text/html" },
    });
  }) as typeof fetch;
}
describe("public availability", () => {
  it("checks resources beneath a Pages prefix", async () => {
    expect(
      await checkPublicAvailability(
        "https://example.test/concursos_cyl/",
        mockFetch(),
      ),
    ).toMatchObject({ status: "available", commit: "a".repeat(40) });
  });
  it.each(["manifest.json", "candidatura.pdf", ".avif"])(
    "rejects SPA fallback disguised as %s",
    async (broken) => {
      await expect(
        checkPublicAvailability("https://example.test/", mockFetch(broken)),
      ).rejects.toThrow("unexpected content type");
    },
  );
});
