import { z } from "zod";

export const SEPE_CYL_PROVINCES = [
  "Ávila",
  "Burgos",
  "León",
  "Palencia",
  "Salamanca",
  "Segovia",
  "Soria",
  "Valladolid",
  "Zamora",
] as const;

export const SEPE_OCCUPATION_MARKET_ATTRIBUTION =
  "Elaborado por el Observatorio de las Ocupaciones del SEPE a partir de los datos del SISPE.";

const NonNegativeInteger = z.number().int().nonnegative();
const Percentage = z.number().finite();
const CnoCode = z.string().regex(/^\d{4}$/u);
const Period = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/u);

export const SepeOccupationMetricSchema = z
  .object({
    total: NonNegativeInteger,
    monthlyVariationPercent: Percentage,
    annualVariationPercent: Percentage.optional(),
  })
  .strict();

export const SepeRegisteredContractsSchema = SepeOccupationMetricSchema.extend({
  people: NonNegativeInteger.optional(),
}).strict();

export const SepeContractCharacteristicsSchema = z
  .object({
    lastTwelveMonthsTotal: NonNegativeInteger.optional(),
    indefinite: NonNegativeInteger.optional(),
    fullTime: NonNegativeInteger.optional(),
    partTime: NonNegativeInteger.optional(),
    rotationIndex: z.number().finite().nonnegative().optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Contract characteristics must contain at least one observed field.",
  );

export const SepeOccupationProvinceSchema = z
  .object({
    province: z.enum(SEPE_CYL_PROVINCES),
    registeredContracts: SepeOccupationMetricSchema.optional(),
    registeredUnemployment: SepeOccupationMetricSchema.optional(),
  })
  .strict()
  .superRefine((row, context) => {
    if (
      row.registeredContracts === undefined &&
      row.registeredUnemployment === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["province"],
        message:
          "A province must contain contracts or registered unemployment data.",
      });
    }
  });

const SourceUrl = z
  .string()
  .url()
  .refine((value) => {
    const hostname = new URL(value).hostname.toLocaleLowerCase("en-US");
    return hostname === "sepe.es" || hostname.endsWith(".sepe.es");
  }, "Source URL must be hosted by sepe.es.");

export const SepeOccupationMarketSchema = z
  .object({
    period: Period,
    cno: z
      .object({
        code: CnoCode,
        label: z.string().min(1),
      })
      .strict(),
    national: z
      .object({
        registeredContracts: SepeRegisteredContractsSchema,
        registeredUnemployment: SepeOccupationMetricSchema,
        contractCharacteristics: SepeContractCharacteristicsSchema.optional(),
      })
      .strict(),
    provinces: z
      .array(SepeOccupationProvinceSchema)
      .length(SEPE_CYL_PROVINCES.length)
      .superRefine((rows, context) => {
        const seen = new Set<string>();
        rows.forEach((row, index) => {
          if (seen.has(row.province)) {
            context.addIssue({
              code: "custom",
              path: [index, "province"],
              message: `Duplicate Castilla y León province: ${row.province}.`,
            });
          }
          seen.add(row.province);
        });
        if (seen.size !== SEPE_CYL_PROVINCES.length) {
          context.addIssue({
            code: "custom",
            path: ["provinces"],
            message:
              "The Castilla y León subset must contain all nine provinces.",
          });
        }
      }),
    source: z
      .object({
        url: SourceUrl,
        retrievedAt: z.string().datetime({ offset: true }),
        attribution: z.literal(SEPE_OCCUPATION_MARKET_ATTRIBUTION),
      })
      .strict(),
  })
  .strict();

export const SepeOccupationMarketResourceSchema = z.array(
  SepeOccupationMarketSchema,
);

export type SepeOccupationMetric = z.infer<typeof SepeOccupationMetricSchema>;
export type SepeRegisteredContracts = z.infer<
  typeof SepeRegisteredContractsSchema
>;
export type SepeContractCharacteristics = z.infer<
  typeof SepeContractCharacteristicsSchema
>;
export type SepeOccupationProvince = z.infer<
  typeof SepeOccupationProvinceSchema
>;
export type SepeOccupationMarket = z.infer<typeof SepeOccupationMarketSchema>;
