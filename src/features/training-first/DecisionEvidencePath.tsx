interface DecisionEvidencePathProps {
  programTitle: string;
  professionalOutputCount: number;
  reviewedOccupationCount: number;
  currentOfferCount: number;
  studyCenterCount: number;
  offerEvidenceDate: string | null;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function DecisionEvidencePath({
  programTitle,
  professionalOutputCount,
  reviewedOccupationCount,
  currentOfferCount,
  studyCenterCount,
  offerEvidenceDate,
}: DecisionEvidencePathProps) {
  return (
    <section className="decision-path" aria-labelledby="decision-path-title">
      <div className="decision-path__heading">
        <p>Así se construye el resultado</p>
        <h2 id="decision-path-title">Del título a la evidencia disponible</h2>
      </div>
      <ol>
        <li>
          <span className="decision-path__step">Título oficial</span>
          <strong>{programTitle}</strong>
          <small>Catálogo de FP de Castilla y León</small>
        </li>
        <li>
          <span className="decision-path__step">Salidas profesionales</span>
          <strong>
            {countLabel(
              professionalOutputCount,
              "perfil oficial",
              "perfiles oficiales",
            )}
          </strong>
          <small>Publicadas por TodoFP para este título</small>
        </li>
        <li>
          <span className="decision-path__step">Ocupaciones contrastadas</span>
          <strong>
            {countLabel(
              reviewedOccupationCount,
              "grupo CNO-11 revisado",
              "grupos CNO-11 revisados",
            )}
          </strong>
          <small>
            {reviewedOccupationCount === 0
              ? "Relación todavía no publicada como revisada"
              : "Relación trazable usada para buscar ofertas"}
          </small>
        </li>
        <li>
          <span className="decision-path__step">Evidencia actual</span>
          <strong>
            {countLabel(
              currentOfferCount,
              "oferta relacionada",
              "ofertas relacionadas",
            )}
          </strong>
          <small>
            En la copia de ofertas ECYL
            {offerEvidenceDate !== null && (
              <>
                {" "}
                del{" "}
                <time dateTime={offerEvidenceDate}>
                  {dateLabel(offerEvidenceDate)}
                </time>
              </>
            )}
            ; no representa todo el mercado laboral
          </small>
        </li>
      </ol>
      <p className="decision-path__study">
        {countLabel(
          studyCenterCount,
          "centro publicado donde estudiarlo",
          "centros publicados donde estudiarlo",
        )}
        .
      </p>
    </section>
  );
}
