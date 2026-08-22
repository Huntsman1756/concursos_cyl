export interface TerritorialCenterRecord {
  centerCode: string;
  centerName: string;
  locality: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
}

export interface TerritorialLocalityGroup {
  locality: string;
  centers: TerritorialCenterRecord[];
  centerCount: number;
}

export interface TerritorialProvinceGroup {
  province: string;
  localities: TerritorialLocalityGroup[];
  centerCount: number;
  centersWithCoordinates: number;
  centersWithoutCoordinates: number;
}

export interface TerritorialDistributionModel {
  totalCenters: number;
  centersWithCoordinates: number;
  centersWithoutCoordinates: number;
  provinces: TerritorialProvinceGroup[];
}

const spanishOrder = (left: string, right: string): number =>
  left.localeCompare(right, "es");

const centerOrder = (
  left: TerritorialCenterRecord,
  right: TerritorialCenterRecord,
): number =>
  spanishOrder(left.centerName, right.centerName) ||
  spanishOrder(left.centerCode, right.centerCode);

const hasCoordinates = (center: TerritorialCenterRecord): boolean =>
  center.latitude !== null && center.longitude !== null;

export function buildTerritorialDistributionModel(
  centers: readonly TerritorialCenterRecord[],
): TerritorialDistributionModel {
  const provinces = new Map<string, TerritorialCenterRecord[]>();
  for (const center of centers) {
    const provinceCenters = provinces.get(center.province);
    if (provinceCenters === undefined) {
      provinces.set(center.province, [center]);
    } else {
      provinceCenters.push(center);
    }
  }

  const provinceGroups = [...provinces.entries()]
    .sort(([left], [right]) => spanishOrder(left, right))
    .map(([province, provinceCenters]) => {
      const localities = new Map<string, TerritorialCenterRecord[]>();
      for (const center of provinceCenters) {
        const localityCenters = localities.get(center.locality);
        if (localityCenters === undefined) {
          localities.set(center.locality, [center]);
        } else {
          localityCenters.push(center);
        }
      }

      const localityGroups = [...localities.entries()]
        .sort(([left], [right]) => spanishOrder(left, right))
        .map(([locality, localityCenters]) => {
          const sortedCenters = [...localityCenters].sort(centerOrder);
          return {
            locality,
            centers: sortedCenters,
            centerCount: sortedCenters.length,
          };
        });
      const centersWithCoordinates =
        provinceCenters.filter(hasCoordinates).length;

      return {
        province,
        localities: localityGroups,
        centerCount: provinceCenters.length,
        centersWithCoordinates,
        centersWithoutCoordinates:
          provinceCenters.length - centersWithCoordinates,
      };
    });

  const centersWithCoordinates = centers.filter(hasCoordinates).length;
  return {
    totalCenters: centers.length,
    centersWithCoordinates,
    centersWithoutCoordinates: centers.length - centersWithCoordinates,
    provinces: provinceGroups,
  };
}

export function mergeTerritorialCenterCoordinates(
  centers: readonly Omit<TerritorialCenterRecord, "latitude" | "longitude">[],
  directory: readonly {
    centerCode: string;
    latitude: number | null;
    longitude: number | null;
  }[],
): TerritorialCenterRecord[] {
  const directoryByCode = new Map(
    directory.map((entry) => [entry.centerCode, entry]),
  );
  return centers.map((center) => {
    const directoryEntry = directoryByCode.get(center.centerCode);
    return {
      ...center,
      latitude: directoryEntry?.latitude ?? null,
      longitude: directoryEntry?.longitude ?? null,
    };
  });
}
