import { Link } from "react-router-dom";
import type { TrainingOccupationLink } from "../../../data/schemas/curatedMappings";
import { TrainingRouteCard } from "./TrainingRouteCard";
import type { TrainingFeatureData } from "../training-first/trainingData";

export function OccupationResultsPage({
  occupationId,
  data,
}: {
  occupationId: string;
  data: TrainingFeatureData;
}) {
  const occupation = data.occupations.find(
    (item) => item.occupationId === occupationId,
  );
  const links = data.links
    .filter(
      (link) =>
        link.occupationId === occupationId && link.reviewStatus === "approved",
    )
    .sort((left, right) => {
      const relationshipOrder =
        Number(right.relationshipType !== "official_output") -
        Number(left.relationshipType !== "official_output");
      if (relationshipOrder !== 0) return relationshipOrder;
      const leftTitle = data.programs.find(
        (program) => program.programKey === left.trainingProgramKey,
      )?.programTitle;
      const rightTitle = data.programs.find(
        (program) => program.programKey === right.trainingProgramKey,
      )?.programTitle;
      return (leftTitle ?? "").localeCompare(rightTitle ?? "", "es");
    });

  if (!occupation) {
    return (
      <div className="journey-page">
        <h1>Ocupación no encontrada</h1>
        <Link to="/desde-ocupacion">Volver a buscar</Link>
      </div>
    );
  }

  return (
    <div className="journey-page">
      <Link to="/desde-ocupacion">Cambiar ocupación</Link>
      <p className="eyebrow">Ruta confirmada</p>
      <h1>{occupation.preferredLabel}</h1>
      <p>{occupation.description}</p>
      {links.length === 0 ? (
        <p>
          No encontramos una ruta revisada para esta ocupación.{" "}
          <Link to="/desde-ocupacion">Nueva búsqueda</Link>
        </p>
      ) : (
        <div className="route-list">
          {links.map((link: TrainingOccupationLink) => {
            const program = data.programs.find(
              (item) => item.programKey === link.trainingProgramKey,
            );
            return program ? (
              <TrainingRouteCard
                key={`${link.trainingProgramKey}-${link.occupationId}`}
                program={program}
                link={link}
                offerings={data.offerings}
                centers={data.centers}
              />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
