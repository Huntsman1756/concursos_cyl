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

const SEPE_OCCUPATION_MARKET_DETAIL_PATH =
  /^\/HomeSepe\/que-es-observatorio\/informacion-mt-por-ocupacion\/informacion-mercado-trabajo-por-ocupacion~_mensuales_(\d{4})_(0[1-9]|1[0-2])_(\d{4})-[^/]+~\.html$/u;

export const SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT =
  "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/main/04/content/resultados";

export function isCanonicalSepeOccupationMarketUrl(
  value: string,
  expected?: { cnoCode: string; period: string },
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLocaleLowerCase("en-US") !== "www.sepe.es" ||
    parsed.port !== "" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    return false;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return false;
  }
  const match = SEPE_OCCUPATION_MARKET_DETAIL_PATH.exec(pathname);
  if (match === null || expected === undefined) return match !== null;
  const [, year, month, cnoCode] = match;
  return `${year}-${month}` === expected.period && cnoCode === expected.cnoCode;
}

export const SepeOccupationMetricSchema = z
  .object({
    total: NonNegativeInteger,
    monthlyVariationPercent: Percentage,
    annualVariationPercent: Percentage.optional(),
  })
  .strict();

export const SepeOccupationNationalMetricSchema = z
  .object({
    total: NonNegativeInteger,
    monthlyVariationPercent: Percentage,
    annualVariationPercent: Percentage,
  })
  .strict();

export const SepeRegisteredContractsSchema =
  SepeOccupationNationalMetricSchema.extend({
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
  .refine(
    (value) => isCanonicalSepeOccupationMarketUrl(value),
    "Source URL must be a canonical HTTPS SEPE occupation-market detail URL.",
  );

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
        registeredUnemployment: SepeOccupationNationalMetricSchema,
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
  .strict()
  .superRefine((record, context) => {
    if (
      !isCanonicalSepeOccupationMarketUrl(record.source.url, {
        cnoCode: record.cno.code,
        period: record.period,
      })
    ) {
      context.addIssue({
        code: "custom",
        path: ["source", "url"],
        message:
          "Source URL must identify the same CNO code and period as the record.",
      });
    }
  });

export const SepeOccupationMarketRecordsSchema = z.array(
  SepeOccupationMarketSchema,
);

const SortedUniqueCnoCodesSchema = z
  .array(CnoCode)
  .superRefine((codes, context) => {
    const unique = new Set(codes);
    if (unique.size !== codes.length) {
      context.addIssue({
        code: "custom",
        message: "CNO coverage lists must contain unique codes.",
      });
    }
    for (let index = 1; index < codes.length; index += 1) {
      if ((codes[index - 1] as string) >= (codes[index] as string)) {
        context.addIssue({
          code: "custom",
          message: "CNO coverage lists must be sorted in ascending order.",
        });
        break;
      }
    }
  });

const ResolverEndpointSchema = z.literal(
  SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT,
);

export const SepeOccupationMarketCoverageSchema = z
  .object({
    requestedCnoCodes: SortedUniqueCnoCodesSchema,
    publishedCnoCodes: SortedUniqueCnoCodesSchema,
    notPublishedCnoCodes: SortedUniqueCnoCodesSchema,
    resolverEndpoint: ResolverEndpointSchema,
    capturedAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .superRefine((coverage, context) => {
    const requested = new Set(coverage.requestedCnoCodes);
    const published = new Set(coverage.publishedCnoCodes);
    const notPublished = new Set(coverage.notPublishedCnoCodes);
    for (const code of published) {
      if (!requested.has(code)) {
        context.addIssue({
          code: "custom",
          path: ["publishedCnoCodes"],
          message: `Published CNO ${code} is not requested.`,
        });
      }
    }
    for (const code of notPublished) {
      if (!requested.has(code)) {
        context.addIssue({
          code: "custom",
          path: ["notPublishedCnoCodes"],
          message: `Missing CNO ${code} is not requested.`,
        });
      }
      if (published.has(code)) {
        context.addIssue({
          code: "custom",
          path: ["notPublishedCnoCodes"],
          message: `CNO ${code} cannot be both published and missing.`,
        });
      }
    }
    if (
      requested.size !== published.size + notPublished.size ||
      [...requested].some(
        (code) => !published.has(code) && !notPublished.has(code),
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["requestedCnoCodes"],
        message:
          "Requested CNO coverage must equal the union of published and not-published codes.",
      });
    }
  });

export const SepeOccupationMarketResourceSchema = z
  .object({
    schemaVersion: z.literal("1.1.0"),
    period: Period,
    records: SepeOccupationMarketRecordsSchema,
    coverage: SepeOccupationMarketCoverageSchema,
  })
  .strict()
  .superRefine((resource, context) => {
    const published = new Set(resource.coverage.publishedCnoCodes);
    const recordCodes = new Set<string>();
    resource.records.forEach((record, index) => {
      const code = record.cno.code;
      if (record.period !== resource.period) {
        context.addIssue({
          code: "custom",
          path: ["records", index, "period"],
          message: `Record period ${record.period} does not match resource period ${resource.period}.`,
        });
      }
      if (!published.has(code)) {
        context.addIssue({
          code: "custom",
          path: ["records", index, "cno", "code"],
          message: `Record CNO ${code} is not in published coverage.`,
        });
      }
      if (recordCodes.has(code)) {
        context.addIssue({
          code: "custom",
          path: ["records", index, "cno", "code"],
          message: `Duplicate published CNO ${code}.`,
        });
      }
      recordCodes.add(code);
    });
    if (resource.records.length !== published.size) {
      context.addIssue({
        code: "custom",
        path: ["records"],
        message:
          "The number of records must equal the number of published CNO codes.",
      });
    }
  });

export type SepeOccupationMarketResource = z.infer<
  typeof SepeOccupationMarketResourceSchema
>;

/** Adapts historical records-only captures to the current resource envelope. */
export function adaptSepeOccupationMarketResource(
  value: unknown,
): SepeOccupationMarketResource {
  if (!Array.isArray(value)) {
    return SepeOccupationMarketResourceSchema.parse(value);
  }
  const records = SepeOccupationMarketRecordsSchema.parse(value).sort(
    (left, right) => left.cno.code.localeCompare(right.cno.code),
  );
  const codes = records.map((record) => record.cno.code);
  const capturedAt = records
    .map((record) => record.source.retrievedAt)
    .sort()
    .at(-1);
  if (capturedAt === undefined) {
    throw new Error(
      "Historical SEPE occupation market arrays cannot be adapted without records.",
    );
  }
  return SepeOccupationMarketResourceSchema.parse({
    schemaVersion: "1.1.0",
    period: records[0]?.period,
    records,
    coverage: {
      requestedCnoCodes: codes,
      publishedCnoCodes: codes,
      notPublishedCnoCodes: [],
      resolverEndpoint: SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT,
      capturedAt,
    },
  });
}

export type SepeOccupationMetric = z.infer<typeof SepeOccupationMetricSchema>;
export type SepeOccupationNationalMetric = z.infer<
  typeof SepeOccupationNationalMetricSchema
>;
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
