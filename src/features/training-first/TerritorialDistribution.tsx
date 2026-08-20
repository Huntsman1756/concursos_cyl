export interface TerritorialCenterPoint {
  centerCode: string;
  centerName: string;
  locality: string;
  province: string;
  latitude: number;
  longitude: number;
}

interface TerritorialDistributionProps {
  points: readonly TerritorialCenterPoint[];
  sourceUrl: string;
  academicYear: string | null;
}

const BOUNDS = {
  minLongitude: -7.2,
  maxLongitude: -1.7,
  minLatitude: 39.7,
  maxLatitude: 43.3,
} as const;

function position(point: TerritorialCenterPoint) {
  const x =
    32 +
    ((Math.min(
      BOUNDS.maxLongitude,
      Math.max(BOUNDS.minLongitude, point.longitude),
    ) -
      BOUNDS.minLongitude) /
      (BOUNDS.maxLongitude - BOUNDS.minLongitude)) *
      696;
  const y =
    24 +
    (1 -
      (Math.min(
        BOUNDS.maxLatitude,
        Math.max(BOUNDS.minLatitude, point.latitude),
      ) -
        BOUNDS.minLatitude) /
        (BOUNDS.maxLatitude - BOUNDS.minLatitude)) *
      322;
  return { x, y };
}

export function TerritorialDistribution({
  points,
  sourceUrl,
  academicYear,
}: TerritorialDistributionProps) {
  const provinces = [...new Set(points.map((point) => point.province))].sort(
    (left, right) => left.localeCompare(right, "es"),
  );

  if (points.length === 0) {
    return (
      <section className="territorial-distribution">
        <h2>Distribución territorial</h2>
        <p>
          No hay coordenadas oficiales publicadas para los centros de este ciclo
          en la copia actual.
        </p>
      </section>
    );
  }

  return (
    <figure className="territorial-distribution">
      <figcaption>
        <div>
          <p>Dónde se imparte</p>
          <h2 id="territorial-title">
            Distribución territorial de los centros
          </h2>
        </div>
        <strong>
          {points.length} {points.length === 1 ? "centro" : "centros"} ·{" "}
          {provinces.length}{" "}
          {provinces.length === 1 ? "provincia" : "provincias"}
        </strong>
      </figcaption>
      <svg
        className="territorial-distribution__plot"
        viewBox="0 0 760 370"
        role="img"
        aria-labelledby="territorial-title"
        aria-describedby="territorial-description"
      >
        <desc id="territorial-description">
          Posición de los centros que imparten este título según las coordenadas
          del Directorio de Centros Docentes de Castilla y León.
        </desc>
        <rect x="1" y="1" width="758" height="368" rx="14" />
        <path d="M32 104H728M32 185H728M32 266H728" />
        <path d="M206 24V346M380 24V346M554 24V346" />
        {points.map((point) => {
          const { x, y } = position(point);
          return (
            <circle key={point.centerCode} cx={x} cy={y} r="7">
              <title>
                {point.centerName}, {point.locality}, {point.province}
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="territorial-distribution__legend">
        <p>
          Provincias: <strong>{provinces.join(", ")}</strong>
        </p>
        <p>
          Cada punto usa la coordenada publicada del centro. Sirve para ver la
          distribución, no para calcular distancias ni desplazamientos.
        </p>
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          Fuente: Directorio de Centros Docentes JCyL
          {academicYear === null ? "" : ` · curso ${academicYear}`}
        </a>
      </div>
    </figure>
  );
}
