import { useState } from "react";
import type {
  EducationCenter,
  TrainingOffering,
  TrainingProgram,
} from "../../../data/schemas/generated";
import type { TrainingOccupationLink } from "../../../data/schemas/curatedMappings";
import { EvidenceDisclosure } from "../../components/EvidenceDisclosure";

export function TrainingRouteCard({
  program,
  link,
  offerings,
  centers,
}: {
  program: TrainingProgram;
  link: TrainingOccupationLink;
  offerings: TrainingOffering[];
  centers: EducationCenter[];
}) {
  const [showCenters, setShowCenters] = useState(false);
  const programOfferings = offerings.filter(
    (offering) => offering.programKey === program.programKey,
  );
  const centerByCode = new Map(
    centers.map((center) => [center.centerCode, center]),
  );

  return (
    <article className="route-card">
      <h2>{program.programTitle}</h2>
      <p>
        {link.relationshipType === "official_output"
          ? "Salida oficial"
          : "Relación revisada"}
        {` · ${program.level}`}
      </p>
      <EvidenceDisclosure
        sourceUrl={link.sourceUrl}
        sourceDate={link.reviewedAt}
        mappingVersion={link.mappingVersion}
      />
      <button
        type="button"
        onClick={() => setShowCenters((current) => !current)}
      >
        {showCenters ? "Ocultar dónde estudiarlo" : "Ver dónde estudiarlo"}
      </button>
      {showCenters ? (
        <ul>
          {programOfferings.map((offering) => {
            const center = centerByCode.get(offering.centerCode);
            return (
              <li key={`${offering.centerCode}-${offering.modality}`}>
                {center?.centerName ?? offering.centerCode} —{" "}
                {offering.province} — {offering.modality}
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
