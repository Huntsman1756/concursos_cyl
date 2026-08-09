import type { ReactNode } from "react";

interface SourceTableLink {
  tableId: string;
  label: string;
  catalogUrl: string;
  csvUrl: string;
  pxUrl: string;
}

interface SourceMethodCardProps {
  title: string;
  contributes: ReactNode;
  limitations: ReactNode;
  provenance: ReactNode;
  tables: readonly SourceTableLink[];
}

/** Keeps one official statistical scope and its limitations together. */
export function SourceMethodCard({
  title,
  contributes,
  limitations,
  provenance,
  tables,
}: SourceMethodCardProps) {
  const headingId = `source-${tables[0]?.tableId ?? "unknown"}`;
  return (
    <article className="source-method-card" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>

      <section>
        <h3>Qué aporta</h3>
        {contributes}
      </section>

      <section>
        <h3>Qué no permite afirmar</h3>
        {limitations}
      </section>

      <section>
        <h3>Actualización y huella</h3>
        {provenance}
      </section>

      <section>
        <h3>Fuente original</h3>
        <div className="source-table-list">
          {tables.map((table) => (
            <details key={table.tableId}>
              <summary>
                <code>{table.tableId}</code> · {table.label}
              </summary>
              <ul>
                <li>
                  <a href={table.catalogUrl}>Ficha oficial del catálogo</a>
                </li>
                <li>
                  <a href={table.csvUrl}>Descarga CSV oficial</a>
                </li>
                <li>
                  <a href={table.pxUrl}>Descarga PC-Axis oficial</a>
                </li>
              </ul>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
