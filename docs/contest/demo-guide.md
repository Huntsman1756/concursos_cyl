# Demostración narrada de SALIDA CyL

[Vídeo MP4 con Ximena](demo-salidacyl-ximena-20260910.mp4) · [Subtítulos](demo-salidacyl-ximena-20260910.vtt) · [Guion de voz](demo-voiceover.json) · [Procedencia y tiempos](demo-salidacyl-ximena-20260910.json)

Duración: 1 minuto y 56 segundos. Voz sintética Ximena en castellano de España (`es-ES-XimenaNeural`), generada mediante Microsoft Edge TTS a velocidad natural (`+0%`). Incluye audio AAC y una pista de subtítulos en español dentro del MP4; se adjuntan también VTT y SRT. Los tiempos exactos de cada escena constan en el archivo de procedencia.

| Tiempo    | Escena                                                                   |
| --------- | ------------------------------------------------------------------------ |
| 0:00–0:17 | Problema: conectar estudios, profesiones, centros y ofertas.             |
| 0:17–0:33 | Administración y Finanzas: cuatro profesiones relacionadas y 45 centros. |
| 0:33–0:49 | Ofertas de una descarga fechada y consulta de la fuente oficial.         |
| 0:49–1:05 | Centros donde estudiar el ciclo, en las nueve provincias.                |
| 1:05–1:22 | Comparación de ingresos observados, manteniendo ámbito y cohorte.        |
| 1:22–1:38 | Datos abiertos: 320 relaciones y descarga JSON/CSV.                      |
| 1:38–1:56 | Cierre con `salidacyl.es` y acceso a la memoria.                         |

## Procedencia

El recorrido visual reutiliza la grabación pública de candidate.21, commit `ca8289ebe12c888af7765a212ce44b3754f838ca`, cuya instantánea de datos se conserva. Se eliminan las transiciones de carga, se añade una banda con el nuevo dominio y se sustituye la escena de la memoria anterior por el cierre actual. El vídeo es una demostración explicativa, no una comprobación del despliegue actual.

La voz se genera con [edge-tts](https://github.com/rany2/edge-tts), versión `7.2.8`, que utiliza el servicio en línea de Microsoft Edge sin clave de API. Se produce una toma por escena y se normaliza con FFmpeg a −16 LUFS y techo de −1,5 dBTP antes del montaje. Los subtítulos se sincronizan con los tiempos de palabras que devuelve el servicio. Los planos se prolongan cuando hace falta para dejar terminar cada frase sin acelerar la voz.

Esta revisión sustituye la locución Kokoro/NaN como vídeo recomendado. La [primera versión narrada](demo-salidacyl-20260910.json) y sus archivos se conservan como históricos; su guion original está en el commit `d511de973c0cc07efded8d930c950eeda590fc9c`.

## Reproducción del montaje

Requiere Python, Pillow, FFmpeg y FFprobe. En un entorno virtual, instalar `edge-tts==7.2.8` y Pillow. Desde la raíz del repositorio:

```powershell
python scripts/release/generateEdgeNarration.py --output-dir .tmp/ximena-20260910/voice
python scripts/release/buildNarratedDemo.py --source .tmp/feedback-20260908/artifacts/demo-candidate21-20260908.webm --voice-dir .tmp/ximena-20260910/voice --font C:/Windows/Fonts/arial.ttf --work-dir .tmp/ximena-20260910/render --output docs/contest/demo-salidacyl-ximena-20260910.mp4
```

El primer paso necesita conexión a Internet; el montaje es local. La grabación original está disponible entre los archivos de la [release candidate.21](https://github.com/Huntsman1756/concursos_cyl/releases/tag/v2026.09.08-candidate.21); si se descarga en otra carpeta, ajustar `--source`. Las tomas WAV conservan sus archivos MP3 originales y tiempos de palabras en JSONL. La salida incluye MP4, SRT, VTT y un JSON con voz, versión del cliente, tiempos y huellas SHA-256. El guion no añade contenido a la memoria de solicitud.
