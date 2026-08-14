export const EDUCABASE_SOURCES = {
  intermediateProgramEmployment: {
    id: "educabase-fp-intermediate-program-employment",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_2_02.px",
    scope: "spain_program_group",
  },
  higherProgramEmployment: {
    id: "educabase-fp-higher-program-employment",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_3_02.px",
    scope: "spain_program_group",
  },
  intermediateRegionalFamilyEmployment: {
    id: "educabase-fp-intermediate-regional-family-employment",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_2_12.px",
    scope: "castilla_leon_professional_family",
  },
  higherRegionalFamilyEmployment: {
    id: "educabase-fp-higher-regional-family-employment",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_3_12.px",
    scope: "castilla_leon_professional_family",
  },
  intermediateProgramIncome: {
    id: "educabase-fp-intermediate-program-income",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_2_08.px",
    scope: "spain_program_group",
  },
  higherProgramIncome: {
    id: "educabase-fp-higher-program-income",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/famprof/l0/famprof_3_08.px",
    scope: "spain_program_group",
  },
  intermediateRegionalIncome: {
    id: "educabase-fp-intermediate-regional-income",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_2_07.px",
    scope: "castilla_leon_training_level",
  },
  higherRegionalIncome: {
    id: "educabase-fp-higher-regional-income",
    apiUrl:
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/api/v1/es/laborales/insercion/ccaa/l0/ccaa_3_07.px",
    scope: "castilla_leon_training_level",
  },
} as const;
