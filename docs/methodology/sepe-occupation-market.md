# Mercado laboral por ocupación del SEPE

## Alcance de la evidencia

SALIDA CyL publica registros administrativos del mercado laboral por grupo
primario CNO-11. La copia validada actual corresponde al periodo `2026-07` y
consulta los 116 grupos CNO que tienen una relación FP-ocupación aprobada en
la curaduría del proyecto. Se publicaron 116 registros y no hubo respuestas
oficiales de «sin documento» en esta captura.

El recurso no es un censo de vacantes. «Contratos registrados» son
comunicaciones administrativas de contratos al SEPE; «paro registrado» son
personas inscritas como demandantes en paro registrado. Las cifras nacionales
y las nueve filas provinciales de Castilla y León describen esos registros en
el periodo indicado. No permiten inferir salario, residencia, probabilidad de
empleo, demanda futura ni una recomendación individual.

## Resolución canónica

Antes de descargar cada página, la captura envía un `POST` al endpoint oficial
del SEPE:

<https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/main/04/content/resultados>

El cuerpo es `application/x-www-form-urlencoded` y contiene exactamente:

```text
list-mode=detail
ocupacion-id=<CNO de cuatro dígitos>
year-busc=<YYYY>
month-busc=<mes sin cero inicial>
```

El resolver acepta únicamente el enlace de detalle que devuelve el SEPE, con
HTTPS y host `www.sepe.es`. Los enlaces relativos se resuelven contra el
origen oficial. El identificador de periodo y el CNO se comprueban en la URL y
la página descargada vuelve a comprobarlos en su encabezado. No se deriva un
slug a partir de la etiqueta de la ocupación: por ejemplo, el SEPE devuelve
los enlaces canónicos `T-cnicos-en-educaci-n-infantil` para 2252 y
`Dise-adores-y-administradores-de-bases-de-datos` para 2721.

Un HTTP 200 vacío, una carcasa sin enlace de detalle, un enlace no oficial,
una respuesta 429/5xx, un error de red o una página con CNO o periodo
incompatibles abortan la captura. Solo se registra `not-published` cuando la
respuesta contiene el estado explícito del SEPE que indica que no existe
ningún documento. Esa ausencia no se convierte en ceros.

La captura ejecuta como máximo cuatro resoluciones/descargas concurrentes y
escribe el candidato en un fichero temporal del mismo directorio. El fichero
solo sustituye a la copia anterior después de volver a leerlo y validar el
esquema; cualquier fallo conserva la copia previa.

## Cobertura y publicación

`data/curated/sepe-occupation-catalogue.json` se genera de las relaciones
aprobadas de `training-occupation-links.json`, deduplica los CNO y los ordena
por código, asociando cada uno con la etiqueta aprobada de `occupations.json`.
La captura versionada usa un sobre `schemaVersion: "1.1.0"` con:

- el periodo solicitado;
- los registros publicados;
- `requestedCnoCodes`, `publishedCnoCodes` y `notPublishedCnoCodes`;
- el endpoint del resolver; y
- la fecha UTC de captura.

Las listas de cobertura son únicas y ordenadas. Su unión es exactamente el
conjunto solicitado, no se solapan y el número de registros coincide con el
número de CNO publicados. Los snapshots históricos que todavía contienen un
array de registros se leen mediante un adaptador de compatibilidad; no se
interpretan como una cobertura completa nueva.

La captura vigente se realizó el `2026-08-22T06:42:54.238Z`:

| Periodo | CNO solicitados | Publicados | Sin documento |
| ------- | --------------: | ---------: | ------------: |
| 2026-07 |             116 |        116 |             0 |

## Atribución y límites

La fuente es el [Observatorio de las Ocupaciones del
SEPE](https://www.sepe.es/), a partir de los datos del SISPE. La atribución
publicada en cada registro es:

> Elaborado por el Observatorio de las Ocupaciones del SEPE a partir de los datos del SISPE.

La información representa el corte mensual que el SEPE publica para cada CNO;
no completa grupos no publicados, no mezcla CNAE con CNO y no transforma
contratos provinciales generales en demanda de una ocupación. Un cero dentro
de un registro es un cero observado por la fuente; un CNO ausente es una
ausencia de publicación y se muestra por separado.
