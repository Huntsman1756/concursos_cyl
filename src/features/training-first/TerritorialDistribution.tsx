import {
  buildTerritorialDistributionModel,
  type TerritorialCenterRecord,
} from "./territorialDistributionModel";
import { ExternalLink } from "../../components/ExternalLink";

interface TerritorialDistributionProps {
  centers: readonly TerritorialCenterRecord[];
  sourceUrl: string;
  academicYear: string | null;
  sourceUpdatedAt: string | null;
  snapshotFetchedAt: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function countLabel(value: number, singular: string, plural: string): string {
  return value + " " + (value === 1 ? singular : plural);
}

export function TerritorialDistribution({
  centers,
  sourceUrl,
  academicYear,
  sourceUpdatedAt,
  snapshotFetchedAt,
}: TerritorialDistributionProps) {
  const model = buildTerritorialDistributionModel(centers);
  const completeCenters = centers.filter(
    (center) => center.latitude !== null && center.longitude !== null,
  );

  return (
    <section
      className="territorial-distribution"
      aria-labelledby="territorial-distribution-title"
    >
      <div className="territorial-distribution__heading">
        <p>Dónde se imparte</p>
        <h2 id="territorial-distribution-title">Distribución de centros</h2>
      </div>
      <div className="territorial-distribution__meta">
        <span>Curso académico: {academicYear ?? "no indicado"}</span>
        <span>
          Fuente actualizada:{" "}
          {sourceUpdatedAt === null ? (
            "no indicada"
          ) : (
            <time dateTime={sourceUpdatedAt}>
              {formatDate(sourceUpdatedAt)}
            </time>
          )}
        </span>
        <span>
          Copia consultada:{" "}
          <time dateTime={snapshotFetchedAt}>
            {formatDate(snapshotFetchedAt)}
          </time>
        </span>
      </div>
      <ExternalLink
        className="territorial-distribution__source"
        href={sourceUrl}
      >
        Fuente: Directorio de Centros Docentes JCyL
      </ExternalLink>
      {model.totalCenters === 0 ? (
        <p className="territorial-distribution__empty">
          No hay centros publicados para este ciclo en la copia actual.
        </p>
      ) : (
        <>
          <p className="territorial-distribution__summary">
            {countLabel(model.totalCenters, "centro", "centros")} en{" "}
            {countLabel(model.provinces.length, "provincia", "provincias")} ·{" "}
            <span>
              {countLabel(
                model.centersWithoutCoordinates,
                "centro sin coordenadas oficiales",
                "centros sin coordenadas oficiales",
              )}
            </span>
          </p>
          <table className="territorial-distribution__table">
            <caption>Centros por provincia</caption>
            <thead>
              <tr>
                <th scope="col">Provincia</th>
                <th scope="col">Centros publicados</th>
                <th scope="col">Coordenadas oficiales</th>
              </tr>
            </thead>
            <tbody>
              {model.provinces.map((province) => (
                <tr key={province.province}>
                  <th scope="row">{province.province}</th>
                  <td>{province.centerCount}</td>
                  <td>
                    {province.centersWithCoordinates} completas ·{" "}
                    {province.centersWithoutCoordinates} sin publicar
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="territorial-distribution__groups">
            <h3>Centros agrupados por localidad</h3>
            {model.provinces.map((province) => (
              <div
                className="territorial-distribution__province"
                key={province.province}
              >
                <h4>{province.province}</h4>
                <ul
                  aria-label={"Centros en " + province.province}
                  className="territorial-distribution__localities"
                >
                  {province.localities.map((locality) => (
                    <li key={locality.locality}>
                      <strong>{locality.locality}</strong>
                      <ul
                        aria-label={
                          "Centros en " +
                          locality.locality +
                          ", " +
                          province.province
                        }
                      >
                        {locality.centers.map((center) => (
                          <li key={center.centerCode}>
                            <span>{center.centerName}</span>
                            <small>{center.centerCode}</small>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <details
            className="territorial-distribution__coordinates"
            data-print-hidden="true"
          >
            <summary>Ver coordenadas oficiales publicadas</summary>
            <p>
              Información técnica complementaria. No es un mapa y no calcula
              distancias, rutas ni tiempos de desplazamiento.
            </p>
            {completeCenters.length === 0 ? (
              <p>No hay coordenadas oficiales completas en esta copia.</p>
            ) : (
              <ul>
                {completeCenters.map((center) => (
                  <li key={center.centerCode}>
                    <span>
                      {center.centerName} · {center.locality}, {center.province}
                    </span>
                    <small>
                      Latitud {center.latitude}; longitud {center.longitude}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </>
      )}
    </section>
  );
}
