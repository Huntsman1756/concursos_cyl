interface EvidenceDisclosureProps {
  quote: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceDate?: string;
  reviewedAt?: string;
  mappingVersion?: string;
  parserRule?: string;
  parserVersion?: string;
}

function spanishDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function EvidenceDisclosure({
  quote,
  sourceUrl,
  sourceLabel = "Abrir fuente oficial",
  sourceDate,
  reviewedAt,
  mappingVersion,
  parserRule,
  parserVersion,
}: EvidenceDisclosureProps) {
  return (
    <div className="evidence-disclosure">
      <blockquote className="evidence-disclosure__quote">{quote}</blockquote>
      <details className="evidence-disclosure__provenance">
        <summary>Ver cita exacta</summary>
        <div className="evidence-metadata">
          {sourceDate !== undefined && (
            <p>Fecha de la fuente: {spanishDate(sourceDate)}</p>
          )}
          {reviewedAt !== undefined && (
            <p>Revisión de la relación: {spanishDate(reviewedAt)}</p>
          )}
          {mappingVersion !== undefined && (
            <p>Versión de la relación: {mappingVersion}</p>
          )}
          {parserRule !== undefined && (
            <p>Regla técnica de extracción: {parserRule}</p>
          )}
          {parserVersion !== undefined && (
            <p>Versión de la extracción: {parserVersion}</p>
          )}
        </div>
        {sourceUrl !== undefined && (
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            {sourceLabel}{" "}
            <span className="sr-only">(abre en una pestaña nueva)</span>
          </a>
        )}
      </details>
    </div>
  );
}
