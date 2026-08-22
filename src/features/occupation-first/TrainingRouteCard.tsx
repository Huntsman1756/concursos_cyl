import { Link } from "react-router-dom";
import type {
  LegacyTrainingOffering,
  TrainingOffering,
  TrainingProgram,
} from "../../../data/schemas/generated";
import type { TrainingOccupationLink } from "../../../data/schemas/curatedMappings";
import { EvidenceDisclosure } from "../../components/EvidenceDisclosure";
import { trainingLevelLabel } from "../../domain/trainingPresentation";

type Offering = LegacyTrainingOffering | TrainingOffering;

interface TrainingRouteCardProps {
  link: TrainingOccupationLink;
  program: TrainingProgram;
  offerings: Offering[];
}

const modalityLabels: Record<Offering["modality"], string> = {
  on_site: "Presencial",
  distance: "A distancia",
  mixed: "Mixta",
  unknown: "Modalidad no publicada",
};

function joined(values: string[]): string {
  return new Intl.ListFormat("es-ES", {
    style: "long",
    type: "conjunction",
  }).format(values);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

export function TrainingRouteCard({
  link,
  program,
  offerings,
}: TrainingRouteCardProps) {
  const officialOutput = link.relationshipType === "official_output";
  const provinces = uniqueSorted(
    offerings.map((offering) => offering.province),
  );
  const modalities = uniqueSorted(
    offerings.map((offering) => modalityLabels[offering.modality]),
  );
  return (
    <article className="training-route-card" data-testid="training-route-card">
      <header>
        <p className="relationship-label">
          {officialOutput ? "Salida profesional oficial" : "Relación revisada"}
        </p>
        <h3>{program.programTitle}</h3>
        <p>
          {trainingLevelLabel(program.level)} · {program.programKey}
        </p>
      </header>
      <div className="training-route-card__body">
        <EvidenceDisclosure
          quote={link.sourceQuote}
          sourceUrl={link.sourceUrl}
          reviewedAt={link.reviewedAt}
          mappingVersion={link.mappingVersion}
        />
        <div className="route-availability">
          <h3>Oferta formativa en Castilla y León</h3>
          {offerings.length === 0 ? (
            <p>
              No hay centros publicados para este ciclo en esta instantánea.
            </p>
          ) : (
            <>
              <p>
                {offerings.length}{" "}
                {offerings.length === 1
                  ? "opción de centro y modalidad publicada"
                  : "opciones de centro y modalidad publicadas"}
              </p>
              <dl>
                <div>
                  <dt>Provincias</dt>
                  <dd>{joined(provinces)}</dd>
                </div>
                <div>
                  <dt>Modalidades</dt>
                  <dd>{joined(modalities)}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
        <Link
          className="primary-button route-card-link"
          to={`/formacion/${encodeURIComponent(program.programKey)}`}
        >
          Ver dónde estudiarlo
        </Link>
      </div>
    </article>
  );
}
