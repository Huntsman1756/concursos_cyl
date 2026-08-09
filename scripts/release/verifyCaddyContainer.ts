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
    "object-src 'none'",
    "frame-ancestors 'none'",
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
  for (const policy of ["camera=()", "microphone=()", "geolocation=()"]) {
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
): Promise<void> {
  const base = requiredOrigin(baseUrl);
  const home = await requiredResponse(request, base, "text/html");
  verifyCaddyHeaders(home);

  for (const path of ["comparar", "metodologia"]) {
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
    resourceSnapshots?: { outcomeIndicators?: { resourcePath?: unknown } };
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
}
