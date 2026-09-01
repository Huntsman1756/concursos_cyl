import { ExternalLink } from "./ExternalLink";
import { InfoDisclosure } from "./InfoDisclosure";

interface EvidenceDisclosureProps {
  quote: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceDate?: string;
  reviewedAt?: string;
  mappingVersion?: string;
  parserRule?: string;
  parserVersion?: string;
  label?: string;
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
  label = "Ver información de origen y revisión",
}: EvidenceDisclosureProps) {
  return (
    <InfoDisclosure className="evidence-disclosure" label={label}>
      <div className="evidence-disclosure__body">
        <blockquote className="evidence-disclosure__quote">{quote}</blockquote>
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
          <ExternalLink href={sourceUrl}>{sourceLabel}</ExternalLink>
        )}
      </div>
    </InfoDisclosure>
  );
}
