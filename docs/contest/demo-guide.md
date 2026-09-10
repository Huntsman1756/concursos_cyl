# Demostración narrada de SALIDA CyL

[Vídeo MP4](demo-salidacyl-20260910.mp4) · [Subtítulos](demo-salidacyl-20260910.vtt) · [Guion de voz](demo-voiceover.json) · [Procedencia y tiempos](demo-salidacyl-20260910.json)

Duración: aproximadamente 1 minuto y 55 segundos. Voz sintética en español, generada con Kokoro (`ef_dora`) en NaN. Incluye audio AAC y una pista de subtítulos en español dentro del MP4; se adjuntan también VTT y SRT.

| Tiempo    | Escena                                                                   |
| --------- | ------------------------------------------------------------------------ |
| 0:00–0:17 | Problema: conectar estudios, profesiones, centros y ofertas.             |
| 0:17–0:33 | Administración y Finanzas: cuatro profesiones relacionadas y 45 centros. |
| 0:33–0:49 | Ofertas de una descarga fechada y consulta de la fuente oficial.         |
| 0:49–1:05 | Centros donde estudiar el ciclo, en las nueve provincias.                |
| 1:05–1:21 | Comparación de ingresos observados, manteniendo ámbito y cohorte.        |
| 1:21–1:37 | Datos abiertos: 320 relaciones y descarga JSON/CSV.                      |
| 1:37–1:55 | Cierre con `salidacyl.es` y acceso a la memoria.                         |

## Procedencia

El recorrido visual reutiliza la grabación pública de candidate.21, commit `ca8289ebe12c888af7765a212ce44b3754f838ca`, cuya instantánea de datos se conserva. Se eliminan las transiciones de carga, se añade una banda con el nuevo dominio y se sustituye la escena de la memoria anterior por el cierre actual. El vídeo es una demostración explicativa, no una comprobación del despliegue actual.

La voz se generó con el script `gen-voice.mjs` de [launch-video-kit](https://github.com/borjaperfra/launch-video-kit), revisión MIT `6c5c08821a6400c2067a0518f2ca23fe2fb8f5a5`, apuntando a `https://api.nan.builders/v1`. Se usan una toma por escena, silencios recortados y normalización. La credencial no forma parte de los archivos publicados.

## Reproducción del montaje

Generar las siete tomas usando `demo-voiceover.json` con el script citado. Después ejecutar `scripts/release/buildNarratedDemo.py` con `--source` (grabación original), `--voice-dir` (tomas WAV), `--font` (fuente TrueType), `--work-dir` y `--output`. Requiere Python con Pillow, FFmpeg y FFprobe. El guion no añade contenido a la memoria de solicitud.
