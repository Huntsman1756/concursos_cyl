import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  TrainingOccupationLinksSchema,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

const REVIEWED_SOURCE_COMMIT = "b1d25a8a427a0f9949b9c9dea169478de640efdb";
const LINKS_PATH = "data/curated/training-occupation-links.json";

export const ACCEPTED_RELATION_KEYS = [
  "ADG01B|4411",
  "ADG01M|4113",
  "ADG01MD|4113",
  "ADG01S|4223",
  "ADG02S|4111",
  "ADG02S|4113",
  "ADG02S|4123",
  "ADG02S|4223",
  "ADG02SD|4111",
  "ADG02SD|4113",
  "ADG02SD|4123",
  "ADG02SD|4223",
  "AFD02M|3723",
  "AFD02M|3724",
  "AFD01S|3722",
  "AFD01S|3723",
  "AFD01S|3724",
  "AFD01S|5992",
  "AFD01SD|3722",
  "AFD01SD|3723",
  "AFD01SD|3724",
  "AFD01SD|5992",
  "AFD02S|3723",
  "AFD02SD|3723",
  "AGA01B|5220",
  "AGA01M|6110",
  "AGA01M|6120",
  "AGA01M|6204",
  "AGA01M|6205",
  "AGA01M|6300",
  "AGA01M|8321",
  "AGA01S|5993",
  "AGA02M|6110",
  "AGA02M|6120",
  "AGA02M|6204",
  "AGA02M|6205",
  "AGA02M|6300",
  "AGA02M|8321",
  "AGA03B|9511",
  "AGA03B|9512",
  "AGA03B|9530",
  "AGA03B|9543",
  "AGA03S|2640",
  "AGA04M|6120",
  "AGA04M|8321",
  "COM01M|1432",
  "COM01M|3510",
  "COM01M|4424",
  "COM01M|5420",
  "COM01M|5492",
  "COM01M|5500",
  "COM01M|9820",
  "COM01B|4121",
  "COM01B|4123",
  "COM01B|5220",
  "COM01B|5492",
  "COM01B|5500",
  "COM01B|8333",
  "COM01B|9820",
  "COM02S|3510",
  "COM02S|3523",
  "COM02S|4123",
  "COM02S|5210",
  "COM02SD|3510",
  "COM02SD|3523",
  "COM02SD|4123",
  "COM02SD|5210",
  "COM03S|3510",
  "COM03S|5210",
  "COM04S|3522",
  "COM04S|3523",
  "COM04S|4123",
  "COM04SD|3522",
  "COM04SD|3523",
  "COM04SD|4123",
  "ELE01B|7510",
  "ELE01S|3123",
  "ELE01S|7510",
  "ELE02M|7533",
  "ELE02S|3124",
  "ELE02S|3811",
  "ELE02S|3813",
  "ELE02S|7533",
  "ELE03S|7531",
  "ELE04S|3123",
  "ELE04S|3124",
  "ELE04S|3129",
  "ELE04S|3139",
  "ELE04S|3209",
  "ELE04S|7521",
  "ENA03S|3123",
  "ENA03S|7294",
  "EOC02S|3129",
  "FME01S|3126",
  "FME02B|7132",
  "FME01B|7221",
  "FME01B|9700",
  "FME01M|7322",
  "FME01M|7323",
  "FME01M|7324",
  "FME02B|7312",
  "FME02B|8202",
  "FME02B|9700",
  "FME02M|7132",
  "FME02M|7312",
  "FME02M|7313",
  "FME02M|7314",
  "FME02S|7314",
  "HOT01B|9310",
  "HOT01S|3510",
  "HOT04S|5110",
  "HOT02M|4121",
  "HOT02M|5120",
  "HOT03S|4123",
  "HOT03S|4411",
  "HOT05S|3522",
  "IFC01B|7533",
  "IFC01B|8202",
  "IFC02B|7533",
  "IFC01S|2721",
  "IFC01S|2722",
  "IFC01S|3812",
  "IFC01S|3813",
  "IFC01S|3814",
  "IFC01SD|2721",
  "IFC01SD|2722",
  "IFC01SD|3812",
  "IFC01SD|3813",
  "IFC01SD|3814",
  "IFC02S|2713",
  "IFC02S|3820",
  "IFC02SD|2713",
  "IFC02SD|3820",
  "IMA02M|7250",
  "IMA03M|8202",
  "IMA03S|3126",
  "IMP01B|5811",
  "IMP01B|5812",
  "IMP02M|5811",
  "IMP02M|5812",
  "IMP02MD|5811",
  "IMP02MD|5812",
  "IMP01M|3510",
  "IMP01M|4412",
  "IMP01M|5220",
  "IMP01M|5492",
  "IMP01M|5812",
  "IMP01S|5812",
  "INA02S|3160",
  "INA02S|3209",
  "INA02S|3510",
  "INA01S|7709",
  "MAM01B|7812",
  "MAM01B|8209",
  "MAM01B|9700",
  "MAM01M|7812",
  "MAM01M|8209",
  "QUI01S|3129",
  "QUI01S|3160",
  "QUI02M|3160",
  "SAN04S|3314",
  "SAN07S|2640",
  "SAN07SD|2640",
  "SAN09S|2640",
  "SAN09SD|2640",
  "SEA03S|2640",
  "SEA03S|3129",
  "SSC01S|2252",
  "SSC01SD|2252",
  "SSC03S|2312",
  "SSC03S|3713",
  "SSC03SD|2312",
  "SSC03SD|3713",
  "SSC05S|3713",
  "COM02E|1221",
  "COM02E|2651",
  "ELE02B|7510",
  "ELE02B|7533",
  "ELE02B|9700",
  "IMA01M|7221",
  "IMA01M|7222",
  "IMA01M|7250",
  "IMA01M|7294",
  "IMS01E|2921",
  "IMS01E|2923",
  "INA02M|3510",
  "INA02M|7705",
  "INA02M|7707",
  "INA02M|8193",
  "TMV01B|7401",
  "TMV01S|3160",
  "TMV01S|3405",
  "TMV01S|4412",
  "TMV02M|7401",
  "TMV03E|3405",
  "QUI01E|3141",
  "SAN01S|3317",
  "SAN01SD|3317",
  "SAN02S|3316",
  "SAN02S|2640",
  "SEA01M|5931",
  "SEA01MD|5931",
  "SEA01M|5932",
  "SEA01MD|5932",
  "SEA01M|5993",
  "SEA01MD|5993",
  "TMV03M|7403",
  "MAM02M|7812",
  "SSC06S|5894",
  "AGA03M|6120",
  "INA03M|8160",
  "TMV05M|7404",
  "ARG01M|7621",
  "SSC04S|3714",
  "ELE05S|3125",
  "ELE05S|7532",
  "ENA02S|3131",
  "ENA04S|3132",
  "TCP02B|7835",
  "QUI01M|8131",
  "IMS01S|2484",
  "IMS01S|2713",
  "AGA02S|6120",
  "COM01E|2651",
  "ELE01E|2729",
  "EOC01B|7121",
  "EOC01B|7191",
  "EOC01B|7211",
  "EOC01B|7231",
  "EOC01B|7240",
  "EOC01B|9602",
  "EOC02M|7211",
  "EOC02M|7231",
  "EOC02M|7240",
  "FME01E|2482",
  "IMA02S|7250",
  "IMS04S|3831",
] as const;

const TODO_FP_ASIR_URL =
  "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/admin-sist-informaticos-red.html";
const TODO_FP_INTEGRATION_URL =
  "https://www.todofp.es/que-estudiar/familias-profesionales/servicios-socioculturales-comunidad/integracion-social.html";
const TODO_FP_SOCIOCULTURAL_ANIMATION_URL =
  "https://www.todofp.es/que-estudiar/familias-profesionales/actividades-fisicas-deportivas/ensenanza-animacion-sociodeportiva.html";
const BOE_SOCIOCULTURAL_ANIMATION_URL =
  "https://www.boe.es/eli/es/rd/2017/06/23/653";

const CURRENT_SOURCE_OVERRIDES: Readonly<
  Record<string, Pick<TrainingOccupationLink, "sourceUrl" | "sourceQuote">>
> = {
  "AFD01S|3722": {
    sourceUrl: TODO_FP_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote:
      "Cronometrador / cronometradora, juez / jueza y árbitra / árbitro de competiciones deportivas no oficiales.",
  },
  "AFD01S|3723": {
    sourceUrl: BOE_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote: "Profesor/a de actividades físico-deportivas.",
  },
  "AFD01S|3724": {
    sourceUrl: TODO_FP_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote:
      "Animador / animadora de veladas, espectáculos y actividades recreativas en instalaciones turísticas.",
  },
  "AFD01S|5992": {
    sourceUrl: BOE_SOCIOCULTURAL_ANIMATION_URL,
    sourceQuote: "Socorrista en instalaciones acuáticas.",
  },
  "IFC01S|2721": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico en administración de base de datos.",
  },
  "IFC01S|2722": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico en administración de sistemas.",
  },
  "IFC01S|3812": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Personal de apoyo y soporte técnico.",
  },
  "IFC01S|3813": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico de redes.",
  },
  "IFC01S|3814": {
    sourceUrl: TODO_FP_ASIR_URL,
    sourceQuote: "Técnica / técnico en entornos web.",
  },
  "SSC03S|2312": {
    sourceUrl: TODO_FP_INTEGRATION_URL,
    sourceQuote: "Educador / educadora de educación especial.",
  },
  "SSC03S|3713": {
    sourceUrl: TODO_FP_INTEGRATION_URL,
    sourceQuote: "Técnica / técnico de integración social.",
  },
};

/**
 * Task 4's independently reviewed wave is kept in the restore primitive so
 * restoring from the historical reviewed commit remains deterministic even
 * though that commit predates this wave.
 */
export const TASK_4_WAVE_RELATIONSHIPS = [
  {
    trainingProgramKey: "MAM02M",
    occupationId: "occupation:cno11:7812",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/madera-mueble-corcho/instalacion-amueblamiento.html",
    sourceQuote:
      "Operador / operadora de máquinas fijas para fabricar productos de madera.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "SSC06S",
    occupationId: "occupation:cno11:5894",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/servicios-socioculturales-comunidad/formacion-movilidad-segura-sostenible.html",
    sourceQuote: "Profesor de formación vial.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "AGA03M",
    occupationId: "occupation:cno11:6120",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/agraria/jardineria-floristeria.html",
    sourceQuote: "Trabajador / trabajadora de huertas, viveros y jardines.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "INA03M",
    occupationId: "occupation:cno11:8160",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/industrias-alimentarias/elaboracion-productos-alimenticios.html",
    sourceQuote:
      "Operador / operadora de máquinas y equipos para el tratamiento y elaboración de productos alimentarios.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "TMV05M",
    occupationId: "occupation:cno11:7404",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/mnto-material-rodante-ferroviario.html",
    sourceQuote:
      "Técnica / técnico en mantenimiento de sistemas de tracción y motores.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "ARG01M",
    occupationId: "occupation:cno11:7621",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/artes-graficas/preimpresion-digital.html",
    sourceQuote: "Técnica / técnico en preimpresión.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "SSC04S",
    occupationId: "occupation:cno11:3714",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/servicios-socioculturales-comunidad/promocion-igualdad-genero.html",
    sourceQuote:
      "Promotor / promotora para la igualdad efectiva de mujeres y hombres.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "ELE05S",
    occupationId: "occupation:cno11:3125",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/electromedicina-clinica.html",
    sourceQuote:
      "Técnica / técnico en electrónica, especialidad en electromedicina.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "ELE05S",
    occupationId: "occupation:cno11:7532",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/electromedicina-clinica.html",
    sourceQuote:
      "Instalador-reparador / instaladora-reparadora en electromedicina.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "ENA02S",
    occupationId: "occupation:cno11:3131",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/energia-agua/centrales-electricas.html",
    sourceQuote:
      "Técnica / técnico de operación y mantenimiento de centrales hidroeléctricas.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "ENA04S",
    occupationId: "occupation:cno11:3132",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/energia-agua/gestion-agua.html",
    sourceQuote:
      "Operador / operadora de planta de tratamiento de agua de abastecimiento.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "TCP02B",
    occupationId: "occupation:cno11:7835",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/textil-confeccion-piel/tapiceria-cortinaje.html",
    sourceQuote: "Tapicera / tapicero de muebles.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "QUI01M",
    occupationId: "occupation:cno11:8131",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/quimica/planta-quimica.html",
    sourceQuote:
      "Operador / operadora principal en instalaciones de tratamiento químico.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
] as const satisfies readonly TrainingOccupationLink[];

/**
 * Task 5's independently reviewed wave is kept alongside Task 4 so restoring
 * from the historical reviewed commit remains deterministic after this wave.
 */
export const TASK_5_WAVE_RELATIONSHIPS = [
  {
    trainingProgramKey: "IMS01S",
    occupationId: "occupation:cno11:2484",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/animaciones3d-juegos-entornos-interactivos.html",
    sourceQuote: "Grafista digital.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "IMS01S",
    occupationId: "occupation:cno11:2713",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/animaciones3d-juegos-entornos-interactivos.html",
    sourceQuote:
      "Desarrollador / desarrolladora de aplicaciones y productos audiovisuales multimedia.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "AGA02S",
    occupationId: "occupation:cno11:6120",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/agraria/paisajismo-medio-rural.html",
    sourceQuote:
      "Encargada / encargado o capataz agrícola de huertas, viveros y jardines, en general.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "COM01E",
    occupationId: "occupation:cno11:2651",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/comercio-marketing/ce-posicionamiento-buscadores-comunicacion-rrss.html",
    sourceQuote:
      "Especialistas en captación y fidelización de clientes (Inbound Marketing Specialist).",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "ELE01E",
    occupationId: "occupation:cno11:2729",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/ce-ciberseguridad-tecnologias-operacion.html",
    sourceQuote: "Analista de ciberseguridad en entornos de la operación.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC01B",
    occupationId: "occupation:cno11:7121",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
    sourceQuote: "Ayudante de albañil.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC01B",
    occupationId: "occupation:cno11:7191",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
    sourceQuote: "Ayudante de mantenimiento básico de edificios.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC01B",
    occupationId: "occupation:cno11:7211",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
    sourceQuote: "Ayudante de escayolista.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC01B",
    occupationId: "occupation:cno11:7231",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
    sourceQuote: "Ayudante de pintor / pintora.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC01B",
    occupationId: "occupation:cno11:7240",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
    sourceQuote: "Ayudante en pavimentación para urbanización.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC01B",
    occupationId: "occupation:cno11:9602",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/reforma-mantenimiento-edificios.html",
    sourceQuote: "Peón especializado.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC02M",
    occupationId: "occupation:cno11:7211",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html",
    sourceQuote: "Juntera / juntero de placa de yeso laminado.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC02M",
    occupationId: "occupation:cno11:7231",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html",
    sourceQuote: "Pintor / pintora de obra.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "EOC02M",
    occupationId: "occupation:cno11:7240",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/edificacion-obra-civil/obras-interior-decoracion-rehabilitacion.html",
    sourceQuote: "Colocador / colocadora de pavimentos ligeros, en general.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "FME01E",
    occupationId: "occupation:cno11:2482",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/ce-fabricacion-aditiva.html",
    sourceQuote: "Diseñador 3D por escaneado.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "IMA02S",
    occupationId: "occupation:cno11:7250",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/instalacion-mantenimiento/mnto-inst-termicas-fluidos.html",
    sourceQuote: "Frigorista.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "IMS04S",
    occupationId: "occupation:cno11:3831",
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-sonido/sonido-audiovisuales-espectaculos.html",
    sourceQuote: "Técnica / técnico de grabación de sonido en estudio.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  },
] as const satisfies readonly TrainingOccupationLink[];

function currentSourceOverride(
  key: string,
): Pick<TrainingOccupationLink, "sourceUrl" | "sourceQuote"> | undefined {
  const baseKey = key
    .replace("AFD01SD|", "AFD01S|")
    .replace("IFC01SD|", "IFC01S|")
    .replace("SSC03SD|", "SSC03S|");
  return CURRENT_SOURCE_OVERRIDES[baseKey];
}

function relationKey(link: TrainingOccupationLink): string {
  return `${link.trainingProgramKey}|${link.occupationId.replace("occupation:cno11:", "")}`;
}

export function mergeFrontierReviewedCoverage(
  currentValue: unknown,
  reviewedValue: unknown,
): TrainingOccupationLink[] {
  const current = TrainingOccupationLinksSchema.parse(currentValue);
  const reviewed = TrainingOccupationLinksSchema.parse(reviewedValue);
  const reviewedByKey = new Map<string, TrainingOccupationLink[]>();

  for (const link of reviewed) {
    const key = relationKey(link);
    reviewedByKey.set(key, [...(reviewedByKey.get(key) ?? []), link]);
  }

  const merged = new Map(current.map((link) => [relationKey(link), link]));
  for (const key of ACCEPTED_RELATION_KEYS) {
    const candidates = (reviewedByKey.get(key) ?? []).filter(
      (link) => link.reviewStatus === "approved",
    );
    if (candidates.length !== 1) {
      throw new Error(
        `Expected one approved reviewed relationship for ${key}; found ${candidates.length}.`,
      );
    }
    const existing = merged.get(key);
    if (existing !== undefined) {
      if (existing.reviewStatus !== "approved") {
        throw new Error(`Current relationship ${key} is not approved.`);
      }
      continue;
    }
    merged.set(key, {
      ...candidates[0],
      ...currentSourceOverride(key),
    });
  }

  return TrainingOccupationLinksSchema.parse([...merged.values()]).sort(
    (left, right) =>
      relationKey(left).localeCompare(relationKey(right), "en") ||
      left.relationshipType.localeCompare(right.relationshipType, "en"),
  );
}

function restore(rootDirectory: string): void {
  const targetPath = resolve(rootDirectory, LINKS_PATH);
  const current = JSON.parse(readFileSync(targetPath, "utf8")) as unknown;
  const reviewed = JSON.parse(
    execFileSync(
      "git",
      ["-C", rootDirectory, "show", `${REVIEWED_SOURCE_COMMIT}:${LINKS_PATH}`],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    ),
  ) as unknown;
  const reviewedRelationships = TrainingOccupationLinksSchema.parse(reviewed);
  const reviewedKeys = new Set(reviewedRelationships.map(relationKey));
  const reviewedWithTask4Wave = [
    ...reviewedRelationships,
    ...TASK_4_WAVE_RELATIONSHIPS.filter(
      (relationship) => !reviewedKeys.has(relationKey(relationship)),
    ),
  ];
  const reviewedWithTask5Wave = [
    ...reviewedWithTask4Wave,
    ...TASK_5_WAVE_RELATIONSHIPS.filter(
      (relationship) => !reviewedKeys.has(relationKey(relationship)),
    ),
  ];
  const merged = mergeFrontierReviewedCoverage(current, reviewedWithTask5Wave);
  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(
    `Restored ${merged.length} reviewed FP↔occupation relationships.`,
  );
}

const isMainModule =
  import.meta.url === pathToFileURL(resolve(process.argv[1])).toString();

if (isMainModule) {
  restore(resolve(process.cwd()));
}
