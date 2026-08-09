export type EducabaseIncomeTableId =
  "famprof_2_08" | "famprof_3_08" | "ccaa_2_07" | "ccaa_3_07";

export type EducabaseIncomeFormat = "csv" | "px";

export interface EducabaseIncomeSource {
  tableId: EducabaseIncomeTableId;
  trainingLevel: "intermediate" | "higher";
  scope: "spain_cycle_group" | "autonomous_community_training_level";
  catalogUrl: string;
  termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html";
  csvUrl: string;
  pxUrl: string;
  expectedCsvHeader: readonly string[];
  expectedCellCount: 8160 | 14880 | 13680;
  expectedGroupCount: 34 | 62 | null;
}

export const EDUCABASE_INCOME_TABLE_IDS = [
  "famprof_2_08",
  "famprof_3_08",
  "ccaa_2_07",
  "ccaa_3_07",
] as const satisfies readonly EducabaseIncomeTableId[];

export const EDUCABASE_INCOME_SOURCES = {
  famprof_2_08: {
    tableId: "famprof_2_08",
    trainingLevel: "intermediate",
    scope: "spain_cycle_group",
    catalogUrl:
      "https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080",
    termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
    csvUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_2_08.csv_bdsc?nocab=1",
    pxUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_2_08.px?nocab=1",
    expectedCsvHeader: [
      "Cohorte",
      "Periodo de análisis",
      "Medida (2)",
      "Ciclo-grupo (3)",
      "Total",
    ],
    expectedCellCount: 8160,
    expectedGroupCount: 34,
  },
  famprof_3_08: {
    tableId: "famprof_3_08",
    trainingLevel: "higher",
    scope: "spain_cycle_group",
    catalogUrl:
      "https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094",
    termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
    csvUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/famprof/l0/famprof_3_08.csv_bdsc?nocab=1",
    pxUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/famprof/l0/famprof_3_08.px?nocab=1",
    expectedCsvHeader: [
      "Cohorte",
      "Periodo de análisis",
      "Medida (2)",
      "Ciclo-grupo",
      "Total",
    ],
    expectedCellCount: 14880,
    expectedGroupCount: 62,
  },
  ccaa_2_07: {
    tableId: "ccaa_2_07",
    trainingLevel: "intermediate",
    scope: "autonomous_community_training_level",
    catalogUrl:
      "https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090044",
    termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
    csvUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_2_07.csv_bdsc?nocab=1",
    pxUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_2_07.px?nocab=1",
    expectedCsvHeader: [
      "Cohorte",
      "Comunidad autónoma",
      "Sexo",
      "Periodo de análisis",
      "Medida (2)",
      "Total",
    ],
    expectedCellCount: 13680,
    expectedGroupCount: null,
  },
  ccaa_3_07: {
    tableId: "ccaa_3_07",
    trainingLevel: "higher",
    scope: "autonomous_community_training_level",
    catalogUrl:
      "https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090057",
    termsUrl: "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
    csvUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/csv_bdsc/laborales/insercion/ccaa/l0/ccaa_3_07.csv_bdsc?nocab=1",
    pxUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/files/_px/es/px/laborales/insercion/ccaa/l0/ccaa_3_07.px?nocab=1",
    expectedCsvHeader: [
      "Cohorte",
      "Comunidad autónoma",
      "Sexo",
      "Periodo de análisis",
      "Medida (2)",
      "Total",
    ],
    expectedCellCount: 13680,
    expectedGroupCount: null,
  },
} as const satisfies Record<EducabaseIncomeTableId, EducabaseIncomeSource>;
