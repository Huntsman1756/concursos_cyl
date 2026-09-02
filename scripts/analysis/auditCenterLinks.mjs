#!/usr/bin/env node
/**
 * Center website link audit for SALIDA CyL (design-phase evidence).
 *
 * Policy (J1) — network:
 *  - ONE initial request per published URL (shared URLs requested once).
 *  - Follows up to 5 redirects manually, records the chain.
 *  - One extra HTTPS-upgrade probe for http:// URLs (J5). Never used to
 *    rewrite the source URL.
 *  - Timeout 15 s per request, no retries, no crawling, no asset fetches,
 *    no robots/WAF/CAPTCHA/auth bypass, no proxies.
 *
 * Read-only over the active snapshot; writes analysis/centers-link-audit.json
 * and analysis/centers-link-audit.md only.
 *
 * Usage: node scripts/analysis/auditCenterLinks.mjs [--limit=N] [--concurrency=N]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const argValue = (name) => {
  const eq = args.find((a) => a.startsWith("--" + name + "="));
  if (eq) return Number(eq.split("=")[1]);
  const i = args.indexOf("--" + name);
  return i >= 0 ? Number(args[i + 1]) : undefined;
};
const LIMIT = argValue("limit");
const CONCURRENCY = argValue("concurrency") ?? 8;
const TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const UA =
  "SALIDA-CyL-LinkAudit/1.0 (design-phase data integrity audit; one request per published URL)";

const manifest = JSON.parse(
  readFileSync(join(ROOT, "public", "data", "v1", "manifest.json"), "utf8"),
);
const snapshotId = manifest.snapshotId;
const centers = JSON.parse(
  readFileSync(
    join(
      ROOT,
      "public",
      manifest.resourceSnapshots.centers.resourcePath.replace(/^\//, ""),
    ),
    "utf8",
  ),
);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const GENERIC_TOKENS = new Set([
  "ies", "cifp", "cp", "colegio", "centro", "ntra", "sra", "san", "santa",
  "sto", "sta", "santo", "de", "del", "la", "el", "los", "las", "y", "e",
  "sl", "sa", "slu", "scp", "fundacion", "s", "l", "ii", "iii", "es",
  "educacion", "formacion", "instituto", "escuela", "seminario", "nm", "ns",
  "cc", "sscc", "virgen", "cristo", "cristo", "sagrado", "corazon", "maria",
  "san jose", "santa maria",
]);

function distinctiveTokens(centerName) {
  return norm(centerName)
    .split(" ")
    .filter((t) => t.length >= 4 && !GENERIC_TOKENS.has(t));
}

const PARKED_MARKERS = [
  "dominio en venta", "domain for sale", "buy this domain",
  "compra este dominio", "está en venta", "parking crew", "sedo parking",
  "domain parking", "parked domain", "future home of", "sitio en construccion",
];

// obvious content hijack / unrelated-domain markers (checked in title first)
const SPAM_TITLE_MARKERS = [
  "casino", "apuestas", "apostar", "slots", "viagra", "cialis",
  "criptomoneda", "cripto moneda", "cripto ", "bitcoin",
  "prestamos rapidos", "préstamos rápidos", "comprar seguidores",
  "cosmética para ayudarte",
];

function fetchWithTimeout(url, redirectMode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, {
    redirect: redirectMode,
    signal: controller.signal,
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,*/*;q=0.5",
    },
  }).finally(() => clearTimeout(timer));
}

async function probe(initialUrl) {
  const chain = [];
  let url = initialUrl;
  let status = null;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const res = await fetchWithTimeout(url, "manual");
      if (chain.length === 0) status = res.status;
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get("location");
        if (chain.length === 0) status = res.status;
        if (!location || hop === MAX_REDIRECTS) {
          return {
            status: res.status,
            chain,
            finalUrl: url,
            html: "",
            errorKind: null,
            live: false,
            note: !location ? "no_location" : "too_many_redirects",
          };
        }
        chain.push({ status: res.status, location, from: url });
        url = new URL(location, url).toString();
        continue;
      }
      const body = await res.text();
      return {
        status: res.status,
        chain,
        finalUrl: url,
        html: body.slice(0, 150000),
        errorKind: null,
        live: res.status >= 200 && res.status < 400,
      };
    }
  } catch (e) {
    return { status, chain, finalUrl: url, html: "", errorKind: classifyError(e, initialUrl), live: false };
  }
}

function classifyError(e, scheme) {
  const code = String(e?.cause?.code ?? e?.code ?? "");
  const message = String(e?.message ?? e ?? "");
  if (e?.name === "AbortError" || message.includes("aborted")) return "TIMEOUT";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_NONAME"].includes(code)) return "DNS_FAILURE";
  if (
    code.includes("CERT") ||
    ["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "DEPTH_ZERO_SELF_SIGNED_CERT", "ERR_TLS_CERT_ALTNAME_INVALID", "EXPIRED_CERTIFICATE", "EPROTO"].includes(code)
  ) {
    return "TLS_FAILURE";
  }
  if (["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code)) return "BROKEN_HTTP";
  if (message.includes("fetch failed")) return scheme === "https:" ? "TLS_FAILURE" : "BROKEN_HTTP";
  return "UNVERIFIED";
}

function pageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/giu, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function extractMeta(html) {
  const titleMatch = /<title[^>]*>([^<]{0,300})<\/title>/iu.exec(html);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
  const h1s = [];
  const h1Re = /<h1[^>]*>([\s\S]{0,400}?)<\/h1>/giu;
  let m;
  while ((m = h1Re.exec(html)) && h1s.length < 5) {
    h1s.push(m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  }
  return { title, h1: h1s[0] ?? null };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
const withWebsite = centers.filter(
  (c) => typeof c.website === "string" && c.website.trim() !== "",
);
const withoutWebsite = centers.filter(
  (c) => !(typeof c.website === "string" && c.website.trim() !== ""),
);
const uniqueUrls = [...new Set(withWebsite.map((c) => c.website))];

console.log(
  `auditing ${uniqueUrls.length} unique website URLs (concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS} ms)…`,
);
const startedAt = new Date().toISOString();

const urlResults = await mapLimit(
  LIMIT ? uniqueUrls.slice(0, LIMIT) : uniqueUrls,
  CONCURRENCY,
  async (url) => {
    const initial = new URL(url);
    const scheme = initial.protocol.replace(":", "");
    const main = await probe(url);
    let classification;
    if (main.errorKind) {
      classification = main.errorKind;
    } else if (main.live !== true) {
      classification = "BROKEN_HTTP";
    } else if (main.chain.length > 0) {
      classification = "SOURCE_PUBLISHED_REDIRECTED";
    } else {
      classification = "SOURCE_PUBLISHED_LIVE";
    }

    let httpsAvailable = null;
    let tlsStatus = null;
    if (scheme === "http:") {
      try {
        const upgraded = url.replace(/^http:\/\//iu, "https://");
        const p = await probe(upgraded);
        httpsAvailable = p.errorKind == null && p.live === true;
        tlsStatus = p.errorKind ?? (httpsAvailable ? "ok" : "http_status_" + p.status);
      } catch {
        httpsAvailable = false;
        tlsStatus = "failed";
      }
    } else {
      httpsAvailable = main.errorKind == null && main.live === true;
      tlsStatus = main.errorKind == null ? "ok" : main.errorKind;
    }
    if (
      ["SOURCE_PUBLISHED_LIVE", "SOURCE_PUBLISHED_REDIRECTED"].includes(classification) &&
      scheme === "http:" &&
      httpsAvailable === false
    ) {
      classification = "SOURCE_PUBLISHED_HTTP_ONLY";
    }

    // parked check
    const text = pageText(main.html);
    const isParked = PARKED_MARKERS.some((m) => text.includes(m));
    if (isParked) classification = "DOMAIN_PARKED";

    return {
      sourceUrl: url,
      initialScheme: scheme,
      initialHost: initial.host,
      httpStatus: main.status,
      redirectChain: main.chain,
      finalUrl: main.finalUrl,
      finalHost: (() => {
        try {
          return new URL(main.finalUrl).host;
        } catch {
          return null;
        }
      })(),
      httpsAvailable,
      tlsStatus,
      classification,
      documentTitle: extractMeta(main.html).title || null,
      h1: extractMeta(main.html).h1,
      pageTextSample: text.slice(0, 1200),
      errorKind: main.errorKind ?? null,
      note: main.note ?? null,
    };
  },
);

const byUrl = new Map(urlResults.map((r) => [r.sourceUrl, r]));

// other centers' distinctive names for mismatch detection
const otherNames = centers.map((c) => ({
  code: c.centerCode,
  name: c.centerName,
  tokens: distinctiveTokens(c.centerName),
}));

// ---------------------------------------------------------------------------
// per-center rows with identity
// ---------------------------------------------------------------------------
function nameMatches(name, title, h1, host, bodySample) {
  const n = norm(name);
  if (n.length === 0) return false;
  return (
    norm(title ?? "").includes(n) ||
    norm(h1 ?? "").includes(n) ||
    norm(host ?? "").includes(n) ||
    (bodySample ?? "").includes(n)
  );
}

const rows = [];
for (const c of withWebsite) {
  const url = c.website;
  const res = byUrl.get(url);
  const tokens = distinctiveTokens(c.centerName);
  const row = {
    centerCode: c.centerCode,
    centerName: c.centerName,
    province: c.province,
    locality: c.locality,
    sourceUrl: url,
    initialScheme: res?.initialScheme ?? null,
    initialHost: res?.initialHost ?? null,
    httpStatus: res?.httpStatus ?? null,
    redirectChain: res?.redirectChain ?? [],
    finalUrl: res?.finalUrl ?? null,
    finalHost: res?.finalHost ?? null,
    httpsAvailable: res?.httpsAvailable ?? null,
    tlsStatus: res?.tlsStatus ?? null,
    classification: res?.classification ?? "UNVERIFIED",
    documentTitle: res?.documentTitle ?? null,
    h1: res?.h1 ?? null,
    sharedWith: withWebsite.filter((x) => x.website === url).map((x) => x.centerCode).filter((code) => code !== c.centerCode),
  };
  // identity
  let level = "IDENTITY_NOT_CONFIRMED";
  let matchedIn = null;
  if (res && res.classification.startsWith("SOURCE_PUBLISHED")) {
    const titleN = norm(res.documentTitle ?? "");
    const h1N = norm(res.h1 ?? "");
    const hostN = norm(res.finalHost ?? "");
    const bodyN = res.pageTextSample ?? "";
    const localityN = norm(c.locality ?? "");
    const ownTokenHit = tokens.some((t) => titleN.includes(t) || h1N.includes(t) || hostN.includes(t) || bodyN.includes(t));
    const full = nameMatches(c.centerName, res.documentTitle, res.h1, res.finalHost, bodyN);
    const allTokens =
      tokens.length > 0 &&
      tokens.every((t) => titleN.includes(t) || h1N.includes(t) || hostN.includes(t) || bodyN.includes(t));
    const localityHit =
      localityN.length >= 4 &&
      (titleN.includes(localityN) || h1N.includes(localityN) || bodyN.includes(localityN));
    const spamHit = SPAM_TITLE_MARKERS.some((m) => (res.documentTitle ?? "").toLowerCase().includes(m));
    // mismatch requires: NO own-name evidence AND another center's full distinctive name present
    const otherMatch = otherNames.find(
      (o) =>
        o.code !== c.centerCode &&
        o.tokens.length >= 2 &&
        o.tokens.every((t) => titleN.includes(t) || h1N.includes(t) || hostN.includes(t) || bodyN.includes(t)),
    );
    if (spamHit) {
      level = "IDENTITY_MISMATCH";
      matchedIn = "título con contenido no escolar (spam/hijack)";
    } else if (full || allTokens) {
      level = "IDENTITY_CONFIRMED";
      matchedIn = "title/h1/body/hostname";
    } else if (ownTokenHit) {
      level = "IDENTITY_PLAUSIBLE";
      matchedIn = "token de marca del centro";
    } else if (otherMatch) {
      level = "IDENTITY_MISMATCH";
      matchedIn = "contiene nombre de otro centro: " + otherMatch.name;
    } else if (localityHit) {
      level = "IDENTITY_PLAUSIBLE";
      matchedIn = "localidad";
    }
  }
  row.identity = { level, matchedIn };
  if (level === "IDENTITY_MISMATCH" && matchedIn.includes("no escolar")) {
    row.classification = "CONTENT_MISMATCH";
  }
  row.safeWebsiteCta =
    ["SOURCE_PUBLISHED_LIVE", "SOURCE_PUBLISHED_REDIRECTED", "SOURCE_PUBLISHED_HTTP_ONLY"].includes(row.classification) &&
    ["IDENTITY_CONFIRMED", "IDENTITY_PLAUSIBLE", "IDENTITY_NOT_CONFIRMED"].includes(level);
  row.ctaLabel = !row.safeWebsiteCta
    ? null
    : level === "IDENTITY_NOT_CONFIRMED"
      ? "Web publicada en la fuente"
      : "Web del centro";
  rows.push(row);
}

// ---------------------------------------------------------------------------
// counts
// ---------------------------------------------------------------------------
function countBy(list, fn) {
  const t = {};
  for (const item of list) {
    const k = fn(item);
    t[k] = (t[k] ?? 0) + 1;
  }
  return t;
}
const classificationCounts = countBy(rows, (r) => r.classification);
const identityCounts = countBy(rows, (r) => r.identity.level);

const summary = {
  auditedAt: startedAt,
  finishedAt: new Date().toISOString(),
  snapshotId,
  TOTAL_CENTERS: centers.length,
  WITH_WEBSITE_SOURCE_FIELD: withWebsite.length,
  WITHOUT_WEBSITE: withoutWebsite.map((c) => ({ centerCode: c.centerCode, centerName: c.centerName })),
  counts: {
    LIVE: classificationCounts.SOURCE_PUBLISHED_LIVE ?? 0,
    REDIRECTED: classificationCounts.SOURCE_PUBLISHED_REDIRECTED ?? 0,
    HTTP_ONLY: classificationCounts.SOURCE_PUBLISHED_HTTP_ONLY ?? 0,
    BROKEN_HTTP: classificationCounts.BROKEN_HTTP ?? 0,
    DNS_FAILURE: classificationCounts.DNS_FAILURE ?? 0,
    TLS_FAILURE: classificationCounts.TLS_FAILURE ?? 0,
    TIMEOUT: classificationCounts.TIMEOUT ?? 0,
    DOMAIN_PARKED: classificationCounts.DOMAIN_PARKED ?? 0,
    CONTENT_MISMATCH: classificationCounts.CONTENT_MISMATCH ?? 0,
    UNVERIFIED: classificationCounts.UNVERIFIED ?? 0,
  },
  identityCounts: {
    IDENTITY_CONFIRMED: identityCounts.IDENTITY_CONFIRMED ?? 0,
    IDENTITY_PLAUSIBLE: identityCounts.IDENTITY_PLAUSIBLE ?? 0,
    IDENTITY_NOT_CONFIRMED: identityCounts.IDENTITY_NOT_CONFIRMED ?? 0,
    IDENTITY_MISMATCH: identityCounts.IDENTITY_MISMATCH ?? 0,
  },
  CENTERS_WITH_SAFE_WEBSITE_CTA: rows.filter((r) => r.safeWebsiteCta).length,
  policy: {
    network: "1 petición inicial por URL publicada; redirects manuales (máx 5); 1 sonda HTTPS extra para http://; timeout 15 s; 0 reintentos; sin crawling; sin bypass de robots/WAF/CAPTCHA/auth.",
    cta: {
      live_or_redirected_identity_ok: "«Web del centro»",
      identity_not_confirmed: "«Web publicada en la fuente»",
      broken_dns_tls_timeout_parked_mismatch: "sin CTA web (se mantiene «Cómo llegar»)",
      httpOnly: "se muestra tal cual la fuente lo publica; prohibido elevar a https o reescribir silenciosamente",
    },
    howToArrive: "«Cómo llegar» se mantiene para todos los centros (centerName + localidad/provincia permiten construir el destino sin inventar datos).",
  },
};

// ---------------------------------------------------------------------------
// write outputs
// ---------------------------------------------------------------------------
mkdirSync(join(ROOT, "analysis"), { recursive: true });
writeFileSync(
  join(ROOT, "analysis", "centers-link-audit.json"),
  JSON.stringify({ ...summary, centers: rows }, null, 2) + "\n",
);

const md = [];
md.push("# Centers link audit — SALIDA CyL");
md.push("");
md.push(`- Auditado: ${summary.auditedAt} (UTC)`);
md.push(`- Snapshot activo: \`${snapshotId}\``);
md.push(`- Universo: ${summary.TOTAL_CENTERS} centros · ${summary.WITH_WEBSITE_SOURCE_FIELD} con \`website\` en la fuente · ${summary.WITHOUT_WEBSITE.length} sin web`);
md.push(`- Política de red: 1 petición inicial por URL · redirects ≤ 5 · timeout 15 s · 0 reintentos · sin crawling · sin bypass de robots/WAF/CAPTCHA/auth`);
md.push("");
md.push("## Link health");
md.push("");
md.push("| Clasificación | Centros |");
md.push("| --- | --- |");
for (const [k, v] of Object.entries(summary.counts)) md.push(`| ${k} | ${v} |`);
md.push("");
md.push("## Identidad (dimensión separada del link health)");
md.push("");
md.push("| Nivel | Centros |");
md.push("| --- | --- |");
for (const [k, v] of Object.entries(summary.identityCounts)) md.push(`| ${k} | ${v} |`);
md.push("");
md.push(`## CTA seguro`);
md.push("");
md.push(`**CENTERS_WITH_SAFE_WEBSITE_CTA = ${summary.CENTERS_WITH_SAFE_WEBSITE_CTA}**`);
md.push("");
md.push("- LIVE/REDIRECTED/HTTP_ONLY + identidad confirmada o plausible → «Web del centro».");
md.push("- LIVE/REDIRECTED + identidad no confirmada → «Web publicada en la fuente».");
md.push("- BROKEN_HTTP / DNS_FAILURE / TLS_FAILURE / TIMEOUT / DOMAIN_PARKED / IDENTITY_MISMATCH → sin CTA web. «Cómo llegar» se mantiene (se construye con nombre + localidad + provincia publicados).");
md.push("- HTTP-only: la URL se muestra tal como la publica la fuente; prohibido elevar a HTTPS silenciosamente.");
md.push("");
md.push("## Detalle por centro");
md.push("");
md.push("| Centro | Provincia | URL publicada | Estado | HTTPS | Identidad | CTA |");
md.push("| --- | --- | --- | --- | --- | --- | --- |");
for (const r of rows) {
  const chain = r.redirectChain.length ? " →" + r.redirectChain.length + " redirects" : "";
  md.push(
    `| ${r.centerName} (${r.centerCode}) | ${r.province} | \`${r.sourceUrl}\` | ${r.classification}${chain} | ${r.httpsAvailable === null ? "n/a" : r.httpsAvailable ? "sí" : "no"} | ${r.identity.level}${r.identity.matchedIn ? " (" + r.identity.matchedIn + ")" : ""} | ${r.ctaLabel ?? "—"} |`,
  );
}
md.push("");
writeFileSync(join(ROOT, "analysis", "centers-link-audit.md"), md.join("\n") + "\n");

console.log("written analysis/centers-link-audit.json + .md");
console.log(JSON.stringify(summary.counts));
console.log(JSON.stringify(summary.identityCounts));
console.log("SAFE_WEBSITE_CTA:", summary.CENTERS_WITH_SAFE_WEBSITE_CTA);
