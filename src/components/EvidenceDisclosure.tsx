interface EvidenceDisclosureProps {
  quote: string;
  sourceUrl?: string;
}

export function EvidenceDisclosure({
  quote,
  sourceUrl,
}: EvidenceDisclosureProps) {
  return (
    <details className="evidence-disclosure">
      <summary>Ver cita exacta</summary>
      <blockquote>{quote}</blockquote>
      {sourceUrl !== undefined && (
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          Abrir fuente oficial{" "}
          <span className="sr-only">(abre en una pestaña nueva)</span>
        </a>
      )}
    </details>
  );
}
