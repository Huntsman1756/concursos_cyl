export function EvidenceDisclosure({
  sourceUrl,
  sourceDate,
  mappingVersion,
  parserRule,
}: {
  sourceUrl: string;
  sourceDate: string;
  mappingVersion?: string;
  parserRule?: string;
}) {
  return (
    <details>
      <summary>Ver fuente y método</summary>
      <p>
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          Fuente oficial
        </a>
        {` · Fecha: ${sourceDate}`}
        {mappingVersion ? ` · Versión de relación: ${mappingVersion}` : null}
        {parserRule ? ` · Regla: ${parserRule}` : null}
      </p>
    </details>
  );
}
