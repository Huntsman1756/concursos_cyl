import { describe, expect, it } from "vitest";

import {
  buildTerritorialDistributionModel,
  mergeTerritorialCenterCoordinates,
  type TerritorialCenterRecord,
} from "./territorialDistributionModel";

const centers: TerritorialCenterRecord[] = [
  {
    centerCode: "AV-02",
    centerName: "Centro Zeta",
    locality: "Ávila",
    province: "Ávila",
    latitude: 40.65,
    longitude: -4.7,
  },
  {
    centerCode: "AV-01",
    centerName: "Centro Alfa",
    locality: "Ávila",
    province: "Ávila",
    latitude: 40.64,
    longitude: -4.7,
  },
  {
    centerCode: "ZA-01",
    centerName: "Centro Zamora",
    locality: "Zamora",
    province: "Ávila",
    latitude: null,
    longitude: null,
  },
  {
    centerCode: "BU-01",
    centerName: "Centro Burgos",
    locality: "Burgos",
    province: "Burgos",
    latitude: null,
    longitude: null,
  },
  {
    centerCode: "LE-01",
    centerName: "Centro León",
    locality: "León",
    province: "León",
    latitude: 42.6,
    longitude: -5.57,
  },
];

describe("buildTerritorialDistributionModel", () => {
  it("orders provinces, localities, and centers using Spanish collation", () => {
    const model = buildTerritorialDistributionModel(centers);

    expect(model.provinces.map((province) => province.province)).toEqual([
      "Ávila",
      "Burgos",
      "León",
    ]);
    expect(
      model.provinces[0]?.localities.map((locality) => locality.locality),
    ).toEqual(["Ávila", "Zamora"]);
    expect(
      model.provinces[0]?.localities[0]?.centers.map(
        (center) => center.centerName,
      ),
    ).toEqual(["Centro Alfa", "Centro Zeta"]);
  });

  it("counts every center and separates complete from incomplete coordinates", () => {
    const model = buildTerritorialDistributionModel(centers);

    expect(model.totalCenters).toBe(5);
    expect(model.centersWithCoordinates).toBe(3);
    expect(model.centersWithoutCoordinates).toBe(2);
    expect(model.provinces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          province: "Ávila",
          centerCount: 3,
          centersWithCoordinates: 2,
          centersWithoutCoordinates: 1,
        }),
        expect.objectContaining({
          province: "Burgos",
          centerCount: 1,
          centersWithCoordinates: 0,
          centersWithoutCoordinates: 1,
        }),
      ]),
    );
  });
});

describe("mergeTerritorialCenterCoordinates", () => {
  it("preserves centers without a matching directory record", () => {
    const merged = mergeTerritorialCenterCoordinates(
      centers.map(({ centerCode, centerName, locality, province }) => ({
        centerCode,
        centerName,
        locality,
        province,
      })),
      [
        {
          centerCode: "AV-01",
          latitude: 40.64,
          longitude: -4.7,
        },
        {
          centerCode: "ZA-01",
          latitude: null,
          longitude: null,
        },
      ],
    );

    expect(merged).toHaveLength(5);
    expect(merged.find((center) => center.centerCode === "AV-01")).toEqual(
      expect.objectContaining({ latitude: 40.64, longitude: -4.7 }),
    );
    expect(merged.find((center) => center.centerCode === "ZA-01")).toEqual(
      expect.objectContaining({ latitude: null, longitude: null }),
    );
    expect(merged.find((center) => center.centerCode === "AV-02")).toEqual(
      expect.objectContaining({ latitude: null, longitude: null }),
    );
  });
});
