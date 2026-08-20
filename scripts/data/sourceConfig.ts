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
  ecylCourses: {
    id: "jcyl-ecyl-training",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/formacion-del-ecyl/records",
  },
  professionalCertificates: {
    id: "jcyl-professional-certificates",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/certificados-profesionalidad/records",
  },
  publicEmploymentCalls: {
    id: "jcyl-public-employment-calls",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/convocatorias-de-empleo-publico/records",
  },
  regionalContracts: {
    id: "jcyl-provincial-employment-contracts",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/contratos-realizados-en-las-provincias-de-castilla-y-leon/records?where=provincia%21%3D%27CYL%27",
  },
  municipalities: {
    id: "jcyl-municipal-registry",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/registro-de-municipios-de-castilla-y-leon/records?order_by=cod_ine",
  },
  educationCenterDirectory: {
    id: "jcyl-education-center-directory",
    recordsUrl:
      "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/directorio-de-centros-docentes/records?order_by=codigo",
  },
  educabaseIncome: {
    id: "educabase-fp-income-four-table-bundle",
    recordsUrl: "https://estadisticas.educacion.gob.es/EducaJaxiPx/",
  },
} as const;
