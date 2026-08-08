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
    <details className="evidence-disclosure">
      <summary>Ver cita exacta</summary>
      <blockquote>{quote}</blockquote>
      <div className="evidence-metadata">
        {sourceDate !== undefined && (
          <p>Fecha de la fuente: {spanishDate(sourceDate)}</p>
        )}
        {reviewedAt !== undefined && (
          <p>Revisión del mapeo: {spanishDate(reviewedAt)}</p>
        )}
        {mappingVersion !== undefined && (
          <p>Versión del mapeo: {mappingVersion}</p>
        )}
        {parserRule !== undefined && <p>Regla de extracción: {parserRule}</p>}
        {parserVersion !== undefined && (
          <p>Versión del parser: {parserVersion}</p>
        )}
      </div>
      {sourceUrl !== undefined && (
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          {sourceLabel}{" "}
          <span className="sr-only">(abre en una pestaña nueva)</span>
        </a>
      )}
    </details>
  );
}
