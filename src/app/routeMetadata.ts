import publication from "../../config/publication.json";
import { titleForPathname } from "./routeTitles";

const descriptions: Record<string, string> = {
  "/desde-fp":
    "Consulta profesiones relacionadas con una FP, ofertas de una instantánea fechada y centros donde estudiarla, con fuentes revisadas.",
  "/desde-ocupacion":
    "Explora las formaciones vinculadas a una ocupación mediante relaciones revisadas y consulta sus fuentes oficiales.",
  "/desde-oferta":
    "Consulta ofertas de empleo de Castilla y León y distingue sus requisitos publicados de las relaciones formativas revisadas.",
  "/comparar":
    "Compara referencias oficiales de ingresos de titulados manteniendo separados sus ámbitos, periodos y límites estadísticos.",
  "/datos-abiertos":
    "Descarga el grafo FP–ocupación de SALIDA CyL y consulta fuentes, licencias y fechas de sus datos abiertos.",
  "/metodologia":
    "Conoce cómo SALIDA CyL revisa las relaciones entre formación y empleo y qué límites tienen los datos.",
};

export function routeMetadata(pathname: string, search = "") {
  const path = pathname.replace(/\/+$/u, "") || "/";
  const title = titleForPathname(path);
  return {
    title,
    canonical: new URL(path.replace(/^\/+/u, ""), publication.canonicalRootUrl)
      .href,
    description:
      descriptions[`/${path.split("/")[1] ?? ""}`] ??
      "Orientación de formación profesional y empleo en Castilla y León con datos públicos, fuentes identificadas y límites visibles.",
    robots:
      search || title.startsWith("Página no encontrada")
        ? "noindex,follow"
        : "index,follow",
  };
}

export function updateRouteMetadata(pathname: string, search = ""): void {
  const metadata = routeMetadata(pathname, search);
  document.title = metadata.title;
  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = metadata.canonical;
  for (const [attribute, key, content] of [
    ["name", "description", metadata.description],
    ["name", "robots", metadata.robots],
    ["property", "og:title", metadata.title],
    ["property", "og:description", metadata.description],
    ["property", "og:url", metadata.canonical],
    ["name", "twitter:title", metadata.title],
    ["name", "twitter:description", metadata.description],
  ] as const) {
    let meta = document.head.querySelector<HTMLMetaElement>(
      `meta[${attribute}="${key}"]`,
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attribute, key);
      document.head.append(meta);
    }
    meta.content = content;
  }
}
