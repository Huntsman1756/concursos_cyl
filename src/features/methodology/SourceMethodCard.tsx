import type { ReactNode } from "react";

export function SourceMethodCard({
  title,
  sourceUrl,
  updatedAt,
  contributes,
  cannotAssert,
  children,
}: {
  title: string;
  sourceUrl: string;
  updatedAt: string | null;
  contributes: string;
  cannotAssert: string;
  children: ReactNode;
}) {
  return (
    <article className="source-method-card">
      <h2>{title}</h2>
      <p>
        <strong>Qué aporta:</strong> {contributes}
      </p>
      <p>
        <strong>Qué no permite afirmar:</strong> {cannotAssert}
      </p>
      <p>
        <strong>Última referencia del snapshot:</strong>{" "}
        {updatedAt
          ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
              new Date(updatedAt),
            )
          : "No publicada"}
      </p>
      <p>
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          Abrir fuente original
        </a>
      </p>
      <details>
        <summary>Ver método y contrato técnico</summary>
        <div>{children}</div>
      </details>
    </article>
  );
}
