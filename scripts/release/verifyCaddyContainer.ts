import { createHash } from "node:crypto";

type Request = (input: string | URL) => Promise<Response>;

function requiredOrigin(baseUrl: string): URL {
  const errorMessage =
    "CADDY_SMOKE_BASE_URL must be an HTTP(S) origin without credentials, query, or fragment.";
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(errorMessage);
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error(errorMessage);
  }
  url.pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  return url;
}

async function requiredResponse(
  request: Request,
  url: URL,
  expectedContentType: string,
): Promise<Response> {
  const response = await request(url);
  if (!response.ok) {
    throw new Error(
      `Caddy container returned HTTP ${response.status} for ${url.pathname}.`,
    );
  }
  if (!response.headers.get("content-type")?.includes(expectedContentType)) {
    throw new Error(
      `Caddy container returned an unexpected content type for ${url.pathname}.`,
    );
  }
  return response;
}

function verifyCaddyHeaders(response: Response): void {
  const csp = response.headers.get("content-security-policy") ?? "";
  for (const directive of [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ]) {
    if (!csp.includes(directive)) {
      throw new Error(
        `Missing Caddy Content-Security-Policy directive: ${directive}.`,
      );
    }
  }
  if (response.headers.get("x-content-type-options") !== "nosniff") {
    throw new Error("Missing Caddy X-Content-Type-Options header.");
  }
  if (
    response.headers.get("referrer-policy") !==
    "strict-origin-when-cross-origin"
  ) {
    throw new Error("Missing Caddy Referrer-Policy header.");
  }
  const permissions = response.headers.get("permissions-policy") ?? "";
  for (const policy of [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
  ]) {
    if (!permissions.includes(policy)) {
      throw new Error(
        `Missing Caddy Permissions-Policy restriction: ${policy}.`,
      );
    }
  }
  if (response.headers.has("set-cookie")) {
    throw new Error("The Caddy container must not set cookies.");
  }
}

/** Verifies guarantees supplied specifically by the Caddy release container. */
export async function verifyCaddyContainer(
  baseUrl: string,
  request: Request = fetch,
  expectedCommit?: string,
): Promise<void> {
  const base = requiredOrigin(baseUrl);
  const home = await requiredResponse(request, base, "text/html");
  verifyCaddyHeaders(home);

  const commitRegex = /^[0-9a-f]{40}$/;

  if (expectedCommit) {
    if (!commitRegex.test(expectedCommit)) {
      throw new Error(`Invalid expectedCommit SHA format: ${expectedCommit}`);
    }

    const versionResponse = await requiredResponse(
      request,
      new URL("version.json", base),
      "application/json",
    );
    const version = (await versionResponse.json()) as {
      schemaVersion: string;
      commit: string;
    };

    if (version.schemaVersion !== "1.0.0") {
      throw new Error(
        "version.json has an invalid 'schemaVersion'. Expected '1.0.0'.",
      );
    }

    if (!version.commit) {
      throw new Error("version.json is missing the 'commit' field.");
    }

    if (!commitRegex.test(version.commit)) {
      throw new Error(
        `version.json commit is not a 40-hex SHA: ${version.commit}`,
      );
    }

    if (version.commit !== expectedCommit) {
      throw new Error(
        `Version mismatch: expected ${expectedCommit}, but found ${version.commit}.`,
      );
    }
  }

  for (const path of [
    "comparar",
    "datos-abiertos",
    "accesibilidad",
    "para-organizaciones",
    "metodologia",
  ]) {
    const response = await requiredResponse(
      request,
      new URL(path, base),
      "text/html",
    );
    if (!(await response.text()).includes('id="root"')) {
      throw new Error(`Caddy SPA fallback is missing for /${path}.`);
    }
  }

  const manifestResponse = await requiredResponse(
    request,
    new URL("data/v1/manifest.json", base),
    "application/json",
  );
  const manifest = (await manifestResponse.json()) as {
    resourceSnapshots?: Record<
      string,
      { resourcePath?: unknown; recordCount?: unknown }
    >;
  };
  const resourcePath =
    manifest.resourceSnapshots?.outcomeIndicators?.resourcePath;
  if (
    typeof resourcePath !== "string" ||
    !/^\/data\/v1\/snapshots\/[^/]+\/outcome-indicators\.json$/u.test(
      resourcePath,
    )
  ) {
    throw new Error(
      "Caddy manifest does not address the immutable outcome resource.",
    );
  }
  const outcomeUrl = new URL(resourcePath, base);
  if (outcomeUrl.origin !== base.origin) {
    throw new Error("Caddy manifest outcome resource must remain same-origin.");
  }
  await requiredResponse(request, outcomeUrl, "application/json");

  const graphSnapshot = manifest.resourceSnapshots?.derivedFpOccupationGraph;
  const catalogSnapshot = manifest.resourceSnapshots?.openDataCatalog;
  if (
    typeof graphSnapshot?.resourcePath !== "string" ||
    typeof graphSnapshot.recordCount !== "number" ||
    !/^\/data\/v1\/snapshots\/[^/]+\/derived-fp-occupation-graph\.json$/u.test(
      graphSnapshot.resourcePath,
    ) ||
    typeof catalogSnapshot?.resourcePath !== "string" ||
    !/^\/data\/v1\/snapshots\/[^/]+\/open-data-catalog\.json$/u.test(
      catalogSnapshot.resourcePath,
    )
  ) {
    throw new Error(
      "Caddy manifest does not address the derived open-data release.",
    );
  }
  const graphUrl = new URL(graphSnapshot.resourcePath, base);
  const catalogUrl = new URL(catalogSnapshot.resourcePath, base);
  if (graphUrl.origin !== base.origin || catalogUrl.origin !== base.origin) {
    throw new Error("Caddy open-data resources must remain same-origin.");
  }
  const graphResponse = await requiredResponse(
    request,
    graphUrl,
    "application/json",
  );
  const graph = (await graphResponse.json()) as unknown[];
  if (graph.length !== graphSnapshot.recordCount) {
    throw new Error("Caddy derived graph count does not match the manifest.");
  }
  const catalogResponse = await requiredResponse(
    request,
    catalogUrl,
    "application/json",
  );
  const [catalog] = (await catalogResponse.json()) as Array<{
    csvResourcePath?: unknown;
    csvSha256?: unknown;
    recordCount?: unknown;
  }>;
  if (
    typeof catalog?.csvResourcePath !== "string" ||
    typeof catalog.csvSha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(catalog.csvSha256) ||
    catalog.recordCount !== graphSnapshot.recordCount ||
    !/^\/data\/v1\/snapshots\/[^/]+\/derived-fp-occupation-graph\.csv$/u.test(
      catalog.csvResourcePath,
    )
  ) {
    throw new Error("Caddy open-data catalog is inconsistent.");
  }
  const csvUrl = new URL(catalog.csvResourcePath, base);
  if (csvUrl.origin !== base.origin) {
    throw new Error("Caddy open-data CSV must remain same-origin.");
  }
  const csvResponse = await requiredResponse(request, csvUrl, "text/csv");
  const csvHash = createHash("sha256")
    .update(Buffer.from(await csvResponse.arrayBuffer()))
    .digest("hex");
  if (csvHash !== catalog.csvSha256) {
    throw new Error("Caddy open-data CSV hash does not match the catalog.");
  }
}
