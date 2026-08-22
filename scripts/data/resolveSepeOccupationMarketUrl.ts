import { decodeHTML } from "entities";

export { SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT } from "../../data/schemas/sepeOccupationMarket";

const OFFICIAL_ORIGIN = "https://www.sepe.es/";
const CNO_PATTERN = /^\d{4}$/u;
const PERIOD_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/u;

export type SepeOccupationMarketResolution =
  | { status: "published"; sourceUrl: string }
  | { status: "not-published"; reason: "no-document" };

export interface ResolveSepeOccupationMarketPageOptions {
  endpoint: string;
  fetchPage?: (input: string, init: RequestInit) => Promise<Response>;
}

function validateRequest(request: { cnoCode: string; period: string }): {
  year: string;
  month: string;
} {
  if (!CNO_PATTERN.test(request.cnoCode)) {
    throw new Error(
      `SEPE occupation market CNO code is invalid: ${request.cnoCode}.`,
    );
  }
  const match = PERIOD_PATTERN.exec(request.period);
  if (match === null) {
    throw new Error(
      `SEPE occupation market period is invalid: ${request.period}.`,
    );
  }
  return { year: match[1] as string, month: match[2] as string };
}

function anchors(html: string): string[] {
  const pattern =
    /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/giu;
  return [...html.matchAll(pattern)].map((match) =>
    decodeHTML(match[1] ?? match[2] ?? match[3] ?? "").trim(),
  );
}

function officialDetailUrl(
  href: string,
  request: { cnoCode: string; year: string; month: string },
): string | undefined {
  if (href === "" || href.startsWith("#") || /^javascript:/iu.test(href)) {
    return undefined;
  }
  let resolved: URL;
  try {
    resolved = new URL(href, OFFICIAL_ORIGIN);
  } catch {
    return undefined;
  }
  if (
    resolved.protocol !== "https:" ||
    resolved.hostname.toLocaleLowerCase("en-US") !== "www.sepe.es"
  ) {
    return undefined;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(resolved.pathname);
  } catch {
    return undefined;
  }
  const marker = `_mensuales_${request.year}_${request.month}_${request.cnoCode}`;
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const afterMarker = pathname[markerIndex + marker.length];
  if (
    afterMarker !== undefined &&
    !["-", "_", ".", "~", "/"].includes(afterMarker)
  ) {
    return undefined;
  }
  return resolved.href;
}

function pageText(html: string): string {
  return decodeHTML(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " "),
  ).replace(/\s+/gu, " ");
}

function explicitlyReportsNoDocument(html: string): boolean {
  const text = pageText(html);
  return /\bno\s+(?:se\s+ha\s+encontrado|se\s+encontraron|existen|hay)\s+(?:ning[uú]n\s+)?(?:documento|documentos|resultado|resultados|datos)\b/iu.test(
    text,
  );
}

export async function resolveSepeOccupationMarketPage(
  request: { cnoCode: string; period: string },
  options: ResolveSepeOccupationMarketPageOptions,
): Promise<SepeOccupationMarketResolution> {
  const { year, month } = validateRequest(request);
  if (options.endpoint.trim() === "") {
    throw new Error("SEPE occupation market resolver endpoint is required.");
  }
  const body = new URLSearchParams({
    "list-mode": "detail",
    "ocupacion-id": request.cnoCode,
    "year-busc": year,
    "month-busc": String(Number(month)),
  });
  const fetchPage = options.fetchPage ?? ((input, init) => fetch(input, init));
  let response: Response;
  try {
    response = await fetchPage(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } catch (error) {
    throw new Error(
      `SEPE occupation market resolver request failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new Error(
      `SEPE occupation market resolver failed: HTTP ${response.status}.`,
    );
  }
  const html = await response.text();
  const hrefs = anchors(html);
  const matchingUrls = hrefs
    .map((href) => officialDetailUrl(href, { ...request, year, month }))
    .filter((value): value is string => value !== undefined);
  if (matchingUrls.length > 0) {
    return { status: "published", sourceUrl: matchingUrls[0] as string };
  }
  if (hrefs.length === 0 && explicitlyReportsNoDocument(html)) {
    return { status: "not-published", reason: "no-document" };
  }
  throw new Error(
    "SEPE occupation market resolver returned no recognised detail document.",
  );
}
