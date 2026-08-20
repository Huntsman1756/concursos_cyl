interface DecisionEvidencePathProps {
  programTitle: string;
  professionalOutputCount: number;
  professionalOutputSourceUrl: string | undefined;
  professionalOutputEvidenceDate: string | null;
  reviewedOccupationCount: number;
  reviewedOccupationSourceUrl: string | undefined;
  reviewedOccupationEvidenceDate: string | null;
  reviewedOccupationEvidencePrefix: "Copia" | "Revisada";
  currentOfferCount: number;
  currentOfferSourceUrl: string;
  currentOfferEvidenceDate: string | null;
  studyCenterCount: number;
  studyCenterSourceUrl: string;
  studyCenterEvidenceDate: string | null;
}

interface EvidenceSourceProps {
  sourceUrl: string | undefined;
  sourceLabel: string;
  evidenceDate: string | null;
  evidencePrefix: "Copia" | "Revisada";
  note?: string;
}

function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function EvidenceSource({
  sourceUrl,
  sourceLabel,
  evidenceDate,
  evidencePrefix,
  note,
}: EvidenceSourceProps) {
  return (
    <span className="decision-path__source">
      {sourceUrl !== undefined && (
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          {sourceLabel}
        </a>
      )}
      {evidenceDate !== null && (
        <time dateTime={evidenceDate}>
          {evidencePrefix} del {dateLabel(evidenceDate)}
        </time>
      )}
      {note !== undefined && (
        <span className="decision-path__note">{note}</span>
      )}
    </span>
  );
}

export function DecisionEvidencePath({
  programTitle,
  professionalOutputCount,
  professionalOutputSourceUrl,
  professionalOutputEvidenceDate,
  reviewedOccupationCount,
  reviewedOccupationSourceUrl,
  reviewedOccupationEvidenceDate,
  reviewedOccupationEvidencePrefix,
  currentOfferCount,
  currentOfferSourceUrl,
  currentOfferEvidenceDate,
  studyCenterCount,
  studyCenterSourceUrl,
  studyCenterEvidenceDate,
}: DecisionEvidencePathProps) {
  return (
    <section className="decision-path" aria-labelledby="decision-path-title">
      <div className="decision-path__heading">
        <p>Base para decidir</p>
        <h2 id="decision-path-title">Qué sabemos de este título</h2>
        <p className="decision-path__context">
          <span>Título oficial</span>
          <strong>{programTitle}</strong>
          <span>Catálogo de FP de Castilla y León</span>
        </p>
      </div>

      <dl className="decision-path__metrics" aria-label="Resumen con fuentes">
        <div>
          <dt>Salidas profesionales</dt>
          <dd>
            <strong>{professionalOutputCount}</strong>
            <span className="decision-path__unit">
              {countLabel(
                professionalOutputCount,
                "perfil oficial",
                "perfiles oficiales",
              )}
            </span>
            <EvidenceSource
              sourceUrl={professionalOutputSourceUrl}
              sourceLabel="Fuente: TodoFP"
              evidenceDate={professionalOutputEvidenceDate}
              evidencePrefix="Copia"
              note="Publicadas por TodoFP para este título"
            />
          </dd>
        </div>

        <div>
          <dt>Ocupaciones vinculadas</dt>
          <dd>
            <strong>{reviewedOccupationCount}</strong>
            <span className="decision-path__unit">
              {countLabel(
                reviewedOccupationCount,
                "grupo CNO-11 revisado",
                "grupos CNO-11 revisados",
              )}
            </span>
            <EvidenceSource
              sourceUrl={reviewedOccupationSourceUrl}
              sourceLabel="Fuente: relación revisada"
              evidenceDate={reviewedOccupationEvidenceDate}
              evidencePrefix={reviewedOccupationEvidencePrefix}
              note={
                reviewedOccupationCount === 0
                  ? "Relación todavía no publicada como revisada"
                  : "Relación trazable usada para buscar ofertas"
              }
            />
          </dd>
        </div>

        <div>
          <dt>Ofertas relacionadas</dt>
          <dd>
            <strong>{currentOfferCount}</strong>
            <span className="decision-path__unit">en la copia actual</span>
            <EvidenceSource
              sourceUrl={currentOfferSourceUrl}
              sourceLabel="Fuente: ofertas ECYL"
              evidenceDate={currentOfferEvidenceDate}
              evidencePrefix="Copia"
              note="No representa todo el mercado laboral"
            />
          </dd>
        </div>

        <div>
          <dt>Dónde estudiarlo</dt>
          <dd>
            <strong>{studyCenterCount}</strong>
            <span className="decision-path__unit">
              {countLabel(
                studyCenterCount,
                "centro publicado",
                "centros publicados",
              )}
            </span>
            <EvidenceSource
              sourceUrl={studyCenterSourceUrl}
              sourceLabel="Fuente: oferta FP JCyL"
              evidenceDate={studyCenterEvidenceDate}
              evidencePrefix="Copia"
            />
          </dd>
        </div>
      </dl>
    </section>
  );
}
