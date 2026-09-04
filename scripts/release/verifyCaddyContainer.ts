import { createHash } from "node:crypto";

type Request = (input: string | URL) => Promise<Response>;
const EXPECTED_SEPE_RECORD_COUNT = 116;

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
      { resourcePath?: unknown; recordCount?: unknown; sha256?: unknown }
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

  const sepeSnapshot = manifest.resourceSnapshots?.sepeOccupationMarket;
  if (
    typeof sepeSnapshot?.resourcePath !== "string" ||
    typeof sepeSnapshot.recordCount !== "number" ||
    sepeSnapshot.recordCount !== EXPECTED_SEPE_RECORD_COUNT ||
    typeof sepeSnapshot.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(sepeSnapshot.sha256) ||
    !/^\/data\/v1\/snapshots\/[a-z0-9]+(?:-[a-z0-9]+)*\/sepe-occupation-market\.json$/u.test(
      sepeSnapshot.resourcePath,
    )
  ) {
    throw new Error(
      "Caddy manifest does not address the SEPE occupation-market resource.",
    );
  }
  const sepeUrl = new URL(sepeSnapshot.resourcePath, base);
  if (sepeUrl.origin !== base.origin) {
    throw new Error("Caddy SEPE resource must remain same-origin.");
  }
  const sepeResponse = await requiredResponse(
    request,
    sepeUrl,
    "application/json",
  );
  const sepeBytes = Buffer.from(await sepeResponse.arrayBuffer());
  const sepeHash = createHash("sha256").update(sepeBytes).digest("hex");
  if (sepeHash !== sepeSnapshot.sha256) {
    throw new Error("Caddy SEPE resource hash does not match the manifest.");
  }
  let sepe: { records?: unknown };
  try {
    sepe = JSON.parse(sepeBytes.toString("utf8")) as { records?: unknown };
  } catch {
    throw new Error("Caddy SEPE resource must be valid JSON.");
  }
  if (!Array.isArray(sepe.records)) {
    throw new Error("Caddy SEPE resource must expose a records array.");
  }
  if (sepe.records.length !== sepeSnapshot.recordCount) {
    throw new Error("Caddy SEPE record count does not match the manifest.");
  }

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

  // The offer-evidence sidecar is the resource behind the offers route and the
  // home reviewed-offer counter; a missing or HTML-served copy fails citizens
  // fail-closed while all other resources stay healthy, so it is verified
  // explicitly at deployment time.
  const evidenceSnapshot = manifest.resourceSnapshots?.offerEvidence;
  if (
    typeof evidenceSnapshot?.resourcePath !== "string" ||
    typeof evidenceSnapshot.sha256 !== "string" ||
    typeof evidenceSnapshot.recordCount !== "number" ||
    !/^\/data\/v1\/snapshots\/[^/]+\/offer-evidence\.json$/u.test(
      evidenceSnapshot.resourcePath,
    )
  ) {
    throw new Error("Caddy manifest does not address the offer evidence.");
  }
  const evidenceUrl = new URL(evidenceSnapshot.resourcePath, base);
  if (evidenceUrl.origin !== base.origin) {
    throw new Error("Caddy offer evidence must remain same-origin.");
  }
  const evidenceResponse = await requiredResponse(
    request,
    evidenceUrl,
    "application/json",
  );
  const evidenceBytes = Buffer.from(await evidenceResponse.arrayBuffer());
  const evidenceHash = createHash("sha256").update(evidenceBytes).digest("hex");
  if (evidenceHash !== evidenceSnapshot.sha256) {
    throw new Error("Caddy offer evidence hash does not match the manifest.");
  }
  let evidence: { records?: unknown; counts?: { offerCount?: unknown } };
  try {
    evidence = JSON.parse(evidenceBytes.toString("utf8")) as {
      records?: unknown;
      counts?: { offerCount?: unknown };
    };
  } catch {
    throw new Error("Caddy offer evidence must be valid JSON.");
  }
  if (!Array.isArray(evidence.records)) {
    throw new Error("Caddy offer evidence must expose a records array.");
  }
  if (
    evidence.records.length !== evidenceSnapshot.recordCount ||
    evidence.counts?.offerCount !== evidenceSnapshot.recordCount
  ) {
    throw new Error("Caddy offer evidence count does not match the manifest.");
  }

  // Guard the poisoning failure mode directly: a missing data resource must
  // answer 404 (never the SPA shell with 200 + text/html), and it must not be
  // cached.
  const missingDataUrl = new URL(
    "/data/v1/qa-cache-guard-does-not-exist.json",
    base,
  );
  const missingDataResponse = await request(missingDataUrl);
  if (missingDataResponse.status !== 404) {
    throw new Error(
      `Missing data resources must return 404, received HTTP ${missingDataResponse.status}.`,
    );
  }
  if (
    (missingDataResponse.headers.get("content-type") ?? "").includes(
      "text/html",
    )
  ) {
    throw new Error(
      "Missing data resources must not be served as HTML (SPA fallback leaked into /data/*).",
    );
  }
  const missingDataCacheControl =
    missingDataResponse.headers.get("cache-control");
  if (
    missingDataCacheControl === null ||
    /immutable|max-age\s*=\s*[1-9]/u.test(missingDataCacheControl)
  ) {
    throw new Error(
      "Missing data resources must not be cached (expected no-store).",
    );
  }
}
