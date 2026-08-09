export const SOURCE_CONFIG = {
  training: {
    id: "jcyl-vocational-training-offer",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records",
  },
  offers: {
    id: "jcyl-employment-offers",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records",
  },
  educabaseIncome: {
    id: "educabase-fp-income-four-table-bundle",
    recordsUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/",
  },
} as const;
