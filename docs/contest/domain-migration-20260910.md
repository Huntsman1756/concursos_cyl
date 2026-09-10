# Publicación en salidacyl.es

La dirección principal de SALIDA CyL es [https://salidacyl.es/](https://salidacyl.es/). El respaldo sigue en [GitHub Pages](https://huntsman1756.github.io/concursos_cyl/).

## Dominio y servidor

- Registrador y DNS: DonDominio, `ns1.dondominio.com` y `ns2.dondominio.com`.
- Raíz: registro A a `157.90.22.40`, sustituyendo el ANAME de aparcamiento.
- `www.salidacyl.es`: CNAME a `salidacyl.es`.
- Servidor: el VPS existente; HTTPS administrado por Caddy.
- `www` redirige al dominio principal conservando ruta y parámetros. `salida-cyl.157-90-22-40.sslip.io` sigue sirviendo la aplicación durante la activación DNS, con metadatos canónicos al dominio nuevo.
- Los registros de correo y otros servicios no forman parte del cambio.

La configuración canónica, los metadatos sociales, el sitemap, los scripts de despliegue y comprobación y la memoria HTML/PDF usan la nueva raíz. La instantánea de datos se conserva: `20260908155911229-c72920ec4fed`.

## Evidencia de publicación

El registro `release-evidence.json` y las capturas del 8 de septiembre conservan la identidad y dirección que tenían cuando se comprobaron. Son evidencia histórica de candidate.21, no una certificación de esta migración. El registro original se conserva también como `release-evidence-candidate21-historical.json`.

La zona autoritativa de DonDominio ya responde con los registros nuevos. Durante la preparación, la consulta al registro `.es` y a resolutores públicos devolvía todavía dominio inexistente; la delegación pública del registro recién comprado está pendiente de propagación. El certificado se emitirá automáticamente mediante Caddy cuando el DNS sea resoluble públicamente. El enlace anterior y Pages permiten seguir usando el producto durante esa transición.

Los resultados finales, con la versión observada de cada host, se publican en la [release candidate.23](https://github.com/Huntsman1756/concursos_cyl/releases/tag/v2026.09.10-candidate.23).

## Demostración narrada

Se reutiliza el recorrido grabado de candidate.21, con las mismas cifras del catálogo. Se sustituye el cierre que mostraba una memoria anterior y se añade la dirección actual. La narración se genera en español con Kokoro (`ef_dora`) mediante la API de NaN, usando el guion de `demo-voiceover.json`.

El procedimiento de voz toma como referencia el script MIT de [launch-video-kit](https://github.com/borjaperfra/launch-video-kit), revisión `6c5c08821a6400c2067a0518f2ca23fe2fb8f5a5`: una toma por escena, silencios recortados y normalización. Se conserva el vídeo original como evidencia de su versión; el montaje narrado identifica por separado su procedencia y fecha.
