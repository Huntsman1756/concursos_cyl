import { describe, expect, it } from "vitest";

import {
  liveOfferSourceRecord,
  liveTrainingSourceRecord,
} from "../../tests/fixtures/sourceRecords";
import { OfferSourceRecordSchema } from "./offerSource";
import { TrainingSourceRecordSchema } from "./trainingSource";

const CURRENT_TRAINING_FIELDS = [
  "centro_educativo",
  "ciclo_formativo_curso_de_especializacion",
  "clave_ciclo",
  "codigo_centro",
  "codigo_familia",
  "codigo_postal",
  "direccion_centro",
  "e_mail",
  "familia_profesional",
  "grupos_1o",
  "grupos_2o",
  "grupos_3o",
  "localidad",
  "localizacion",
  "modalidad",
  "nivel_educativo",
  "provincia",
  "telefono",
  "tipo_ensenanza",
  "titularidad_centro",
  "web",
] as const;

const CURRENT_OFFER_FIELDS = [
  "actualizacionmetadatos",
  "codigo_localidad",
  "descripcion",
  "enlace_al_contenido",
  "fecha_publicacion",
  "fuentecontenido",
  "identificador",
  "idlocalidad",
  "latitud",
  "localidad",
  "longitud",
  "posicion",
  "provincia",
  "provinciaalternativa",
  "titulo",
] as const;

describe("official source field signatures", () => {
  it("accepts exactly the current 21-field vocational-training signature", () => {
    expect(Object.keys(liveTrainingSourceRecord).sort()).toEqual(
      CURRENT_TRAINING_FIELDS,
    );
    expect(
      TrainingSourceRecordSchema.safeParse(liveTrainingSourceRecord).success,
    ).toBe(true);
    expect(
      TrainingSourceRecordSchema.safeParse({
        ...liveTrainingSourceRecord,
        renamed_upstream_field: "drift",
      }).success,
    ).toBe(false);
    const { tipo_ensenanza: _removed, ...missingField } =
      liveTrainingSourceRecord;
    void _removed;
    expect(TrainingSourceRecordSchema.safeParse(missingField).success).toBe(
      false,
    );
  });

  it("accepts exactly the current 15-field employment-offer signature", () => {
    expect(Object.keys(liveOfferSourceRecord).sort()).toEqual(
      CURRENT_OFFER_FIELDS,
    );
    expect(
      OfferSourceRecordSchema.safeParse(liveOfferSourceRecord).success,
    ).toBe(true);
    expect(
      OfferSourceRecordSchema.safeParse({
        ...liveOfferSourceRecord,
        unexpected_upstream_field: "drift",
      }).success,
    ).toBe(false);
    const { codigo_localidad: _removed, ...missingField } =
      liveOfferSourceRecord;
    void _removed;
    expect(OfferSourceRecordSchema.safeParse(missingField).success).toBe(false);
  });
});
