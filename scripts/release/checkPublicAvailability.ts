import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadPublicationConfig } from "./releaseIdentity";
import { GeneratedManifestSchema } from "../../data/schemas/generated";

export async function checkPublicAvailability(
  rootUrl: string,
  fetchImpl: typeof fetch = fetch,
) {
  const get = async (path: string, mime: string) => {
    const response = await fetchImpl(new URL(path, rootUrl), {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok || !response.headers.get("content-type")?.includes(mime))
      throw new Error(
        `${path || "/"}: HTTP ${response.status} or unexpected content type`,
      );
    return response;
  };
  const [root, versionResponse, manifestResponse, , , image] =
    await Promise.all([
      get("", "text/html"),
      get("version.json", "application/json"),
      get("data/v1/manifest.json", "application/json"),
      get("candidatura.html", "text/html"),
      get("candidatura.pdf", "application/pdf"),
      get("images/editorial/hero-career-guidance-640.avif", "image/avif"),
    ]);
  if (!(await root.text()).includes('id="root"'))
    throw new Error("Application shell missing");
  if ((await image.arrayBuffer()).byteLength === 0)
    throw new Error("Empty editorial image");
  const version = await versionResponse.json();
  if (!/^[a-f0-9]{40}$/u.test(version.commit ?? ""))
    throw new Error("Invalid published commit");
  const bytes = await manifestResponse.text();
  const manifest = GeneratedManifestSchema.parse(JSON.parse(bytes));
  return {
    rootUrl,
    status: "available",
    commit: version.commit,
    snapshotId: manifest.snapshotId,
    generatedAt: manifest.generatedAt,
    qualityStatus: manifest.qualityStatus,
    manifestSha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
  const publication = loadPublicationConfig(process.cwd());
  const results = await Promise.all(
    [publication.canonicalRootUrl, publication.fallbackRootUrl].map(
      async (rootUrl) => {
        try {
          return await checkPublicAvailability(rootUrl);
        } catch (error) {
          return {
            rootUrl,
            status: "unavailable",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    ),
  );
  console.log(
    JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
  );
  if (results.some((r) => r.status !== "available")) process.exitCode = 1;
}
