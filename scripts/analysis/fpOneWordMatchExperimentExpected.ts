import type { OneWordOffer } from "./fpOneWordMatchExperimentContract";

export const EXPECTED_MATCH_COUNTS = {
  "cocinero-s": 41,
  "albanil-es": 24,
  encofradores: 2,
  union: 67,
} as const;

export const EXPECTED_COCINERO_MATCHES = [
  { id: "1285614233577", title: "COCINEROS, EN GENERAL" },
  { id: "1285626761329", title: "COCINEROS, EN GENERAL" },
  { id: "1285627823296", title: "COCINEROS, EN GENERAL" },
  { id: "1285637347955", title: "COCINEROS, EN GENERAL" },
  { id: "1285639495437", title: "COCINEROS, EN GENERAL" },
  { id: "1285640091376", title: "COCINEROS, EN GENERAL" },
  { id: "1285640170324", title: "COCINEROS, EN GENERAL" },
  { id: "1285645512831", title: "COCINEROS, EN GENERAL" },
  { id: "1285655155784", title: "COCINEROS, EN GENERAL" },
  { id: "1285659376390", title: "COCINEROS, EN GENERAL" },
  { id: "1285659956971", title: "COCINEROS, EN GENERAL" },
  { id: "1285660807038", title: "COCINEROS, EN GENERAL" },
  { id: "1285662378630", title: "COCINEROS, EN GENERAL" },
  { id: "1285663812475", title: "COCINEROS, EN GENERAL" },
  { id: "1285664451544", title: "COCINEROS, EN GENERAL" },
  { id: "1285665562689", title: "COCINEROS, EN GENERAL" },
  { id: "1285665634431", title: "COCINEROS, EN GENERAL" },
  { id: "1285665790208", title: "COCINEROS, EN GENERAL" },
  { id: "1285666442607", title: "COCINEROS, EN GENERAL" },
  { id: "1285666499205", title: "COCINEROS, EN GENERAL" },
  { id: "1285666617717", title: "COCINEROS, EN GENERAL" },
  { id: "1285666617827", title: "COCINEROS, EN GENERAL" },
  { id: "1285666878773", title: "COCINEROS, EN GENERAL" },
  { id: "1285666909272", title: "COCINEROS, EN GENERAL" },
  { id: "1285666909300", title: "COCINEROS, EN GENERAL" },
  { id: "1285666999271", title: "COCINEROS, EN GENERAL" },
  { id: "1285667211184", title: "COCINEROS, EN GENERAL" },
  { id: "1285667333359", title: "COCINEROS, EN GENERAL" },
  { id: "1285667333387", title: "COCINEROS, EN GENERAL" },
  { id: "1285667926910", title: "COCINEROS, EN GENERAL" },
  { id: "1285667926938", title: "COCINEROS, EN GENERAL" },
  { id: "1285667926966", title: "COCINEROS, EN GENERAL" },
  { id: "1285668256453", title: "COCINEROS, EN GENERAL" },
  { id: "1285668323029", title: "COCINEROS, EN GENERAL" },
  { id: "1285668911911", title: "COCINEROS, EN GENERAL" },
  { id: "1285669059164", title: "COCINEROS, EN GENERAL" },
  { id: "1285669380024", title: "COCINEROS, EN GENERAL" },
  { id: "1285669380068", title: "COCINEROS, EN GENERAL" },
  { id: "1285669482753", title: "COCINEROS, EN GENERAL" },
  {
    id: "1285669506800",
    title:
      "Oficial de Oficios/Cocinero/a Pinche de cocina para Residencia Universitaria Duques de Soria (Soria)",
  },
  { id: "1285669719137", title: "COCINEROS, EN GENERAL" },
] as const satisfies readonly OneWordOffer[];

export const EXPECTED_ALBANIL_MATCHES = [
  { id: "1285613685343", title: "ALBAÑILES" },
  { id: "1285614585114", title: "ALBAÑILES" },
  { id: "1285658958752", title: "ALBAÑILES" },
  { id: "1285662949857", title: "ALBAÑILES" },
  { id: "1285663783370", title: "ALBAÑILES" },
  { id: "1285663974168", title: "ALBAÑILES" },
  { id: "1285664082111", title: "ALBAÑILES" },
  {
    id: "1285664848132",
    title:
      "3 Oficial/a Segunda Oficios (Especialidad Albañil-Conductor/a) para Ayto. de Palencia",
  },
  { id: "1285664861533", title: "ALBAÑILES" },
  { id: "1285665269105", title: "ALBAÑILES" },
  { id: "1285665380724", title: "ALBAÑILES" },
  { id: "1285665380790", title: "ALBAÑILES" },
  { id: "1285665634810", title: "ALBAÑILES" },
  { id: "1285667539516", title: "ALBAÑILES" },
  { id: "1285667539544", title: "ALBAÑILES" },
  { id: "1285667590834", title: "ALBAÑILES" },
  { id: "1285667964750", title: "ALBAÑILES" },
  { id: "1285668256677", title: "ALBAÑILES" },
  { id: "1285668256705", title: "ALBAÑILES" },
  { id: "1285668323262", title: "ALBAÑILES" },
  { id: "1285668412750", title: "ALBAÑILES" },
  { id: "1285668877598", title: "ALBAÑILES" },
  { id: "1285669061589", title: "Albañil para reformas en Valladolid" },
  { id: "1285669638729", title: "ALBAÑILES" },
] as const satisfies readonly OneWordOffer[];

export const EXPECTED_ENCOFRADORES_MATCHES = [
  { id: "1285667539377", title: "ENCOFRADORES" },
  { id: "1285668256621", title: "ENCOFRADORES" },
] as const satisfies readonly OneWordOffer[];

export const EXPECTED_MATCHES_BY_CANDIDATE = {
  "cocinero-s": EXPECTED_COCINERO_MATCHES,
  "albanil-es": EXPECTED_ALBANIL_MATCHES,
  encofradores: EXPECTED_ENCOFRADORES_MATCHES,
} as const;

export const EXPECTED_UNION_OFFER_IDS = [
  ...new Set(
    Object.values(EXPECTED_MATCHES_BY_CANDIDATE).flatMap((matches) =>
      matches.map(({ id }) => id),
    ),
  ),
].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
