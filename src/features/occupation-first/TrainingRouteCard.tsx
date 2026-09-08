import { Link } from "react-router-dom";
import type {
  LegacyTrainingOffering,
  TrainingOffering,
  TrainingProgram,
} from "../../../data/schemas/generated";
import type { TrainingOccupationLink } from "../../../data/schemas/curatedMappings";
import { EvidenceDisclosure } from "../../components/EvidenceDisclosure";
import { contextualCentersPath } from "../../app/routePaths";
import {
  formatProgramTitle,
  trainingLevelLabel,
} from "../../domain/trainingPresentation";

type Offering = LegacyTrainingOffering | TrainingOffering;

interface TrainingRouteCardProps {
  link: TrainingOccupationLink;
  program: TrainingProgram;
  offerings: Offering[];
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
  const centerCodes = new Set(offerings.map((offering) => offering.centerCode));
  const programTitle = formatProgramTitle(program.programTitle);
  return (
    <article
      className="route-card"
      data-testid="training-route-card"
      aria-label={programTitle}
    >
      <div className="route-card__info">
        <h3 className="route-card__title">
          <Link to={`/desde-fp/${encodeURIComponent(program.programKey)}`}>
            {programTitle}
          </Link>
        </h3>
        <p className="route-card__meta">
          {trainingLevelLabel(program.level)}
          <span className="route-card__code"> · {program.programKey}</span>
        </p>
        <p className="route-card__relationship">
          {officialOutput
            ? "El perfil oficial del ciclo incluye esta salida profesional."
            : "Relación comprobada por competencias compartidas antes de publicarse."}
        </p>
      </div>
      <div className="route-card__side">
        <p className="route-card__availability">
          {centerCodes.size === 0
            ? "Sin centros publicados en esta copia"
            : `${centerCodes.size} ${centerCodes.size === 1 ? "centro" : "centros"} · ${provinces.length} ${provinces.length === 1 ? "provincia" : "provincias"}`}
        </p>
        <Link
          className="route-card__cta"
          to={contextualCentersPath(program.programKey)}
        >
          Ver dónde estudiarlo
        </Link>
        <EvidenceDisclosure
          quote={link.sourceQuote}
          sourceUrl={link.sourceUrl}
          reviewedAt={link.reviewedAt}
          mappingVersion={link.mappingVersion}
          label={`Fuente y revisión de la relación con ${program.programTitle}`}
          trigger="Fuente y revisión"
        />
      </div>
    </article>
  );
}
