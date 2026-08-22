# Resultados del piloto de cobertura FP

## Resultado observado

- 4/5 programas completados; 1/5 diferido; 0/5 descartado.
- 68 minutos de trabajo activo modelado en los cinco intentos. Es una suma declarada de investigación, implementación, pruebas y revisión; no representa minutos literales de revisión independiente ni todo el tiempo de los bucles de corrección.
- El intervalo de reloj de extremo a extremo es 157.9–176.8 minutos (2.6–2.9 horas). Para cada intento empieza en `startedAt`, su límite inferior de terminación es la marca Git del commit final revisado y su límite superior es el inicio del siguiente intento (o la agregación para COM01M). Las cinco marcas Git están validadas contra los SHA guardados.
- El rango 157.9–176.8 minutos mide solo las cinco ventanas de intento hasta la agregación de la Tarea 7; excluye este endurecimiento integral posterior a la agregación, iniciado el 2026-08-08T21:17:46.2354891Z. No se inventa una duración exacta para ese trabajo ni se presenta el intervalo como coste total de lanzamiento.
- Coste por programa completado: 17.0 minutos activos modelados; 39.5–44.2 minutos de reloj. Las magnitudes de reloj son rangos, no minutos de revisión inventados.
- 43 ofertas marginales alcanzadas. La tasa es 37.9 ofertas/hora activa modelada y 14.6–16.3 ofertas/hora de reloj.

No se infiere una tasa estable para todo el catálogo a partir de cinco intentos.

## Cobertura publicada y límites

La cobertura revisada pública incluye ADG01B, ADG01M, ADG01MD, ADG01S, ADG02S, ADG02SD, AFD01S, AFD01SD, AFD02M, AFD02S, AFD02SD, AGA01B, AGA01M, AGA01S, AGA02M, AGA03B, AGA03M, AGA03S, AGA04M, ARG01M, COM01B, COM01M, COM02E, COM02M, COM02S, COM02SD, COM03S, COM04S, COM04SD, ELE01B, ELE01M, ELE01S, ELE02B, ELE02M, ELE02S, ELE03S, ELE04S, ELE05S, ENA02S, ENA03S, ENA04S, EOC01M, EOC02S, FME01B, FME01M, FME01S, FME02B, FME02M, FME02S, FME03S, HOT01B, HOT01M, HOT01S, HOT02M, HOT02S, HOT03S, HOT04S, HOT05S, IFC01B, IFC01MD, IFC01S, IFC01SD, IFC02B, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA01M, IMA02M, IMA03M, IMA03S, IMP01B, IMP01M, IMP01S, IMP02M, IMP02MD, IMP02S, IMS01E, INA01S, INA02M, INA02S, INA03M, MAM01B, MAM01M, MAM02M, QUI01E, QUI01M, QUI01S, QUI02M, SAN01S, SAN01SD, SAN02M, SAN02S, SAN04S, SAN07S, SAN07SD, SAN08S, SAN08SD, SAN09S, SAN09SD, SAN21, SEA01M, SEA01MD, SEA03S, SSC01M, SSC01S, SSC01SD, SSC02S, SSC03S, SSC03SD, SSC04S, SSC05S, SSC06S, TCP02B, TMV01B, TMV01M, TMV01S, TMV02M, TMV03E, TMV03M, TMV05M. La interfaz la deriva de `mapping-coverage.json` direccionado por el manifiesto; no mantiene una lista paralela. El piloto histórico conservó COM01M diferido; la publicación posterior se revisa aparte y aparece en la cobertura pública actual.

SAN21 es el único ciclo del piloto con alcance marginal en la instantánea: 43 ofertas mediante la unión de relaciones aceptadas. En la instantánea histórica del piloto, HOT01M, SSC01M, EOC01M tuvieron 0 ofertas marginales porque todavía no se habían admitido alias. Cero no equivale a ausencia de empleo fuera de la instantánea.

## No finalización y siguiente tramo

COM01M se difirió en este piloto: las salidas de ventas, comercio, almacén, logística y atención remota no tenían una correspondencia primaria, exacta y de cuatro dígitos con CNO-11; ampliar por similitud habría sido especulativo. Una revisión posterior de publicación queda separada del resultado histórico.

El siguiente trabajo recomendado no es abrir más ciclos de forma ciega. Primero, una pasada acotada de evidencia oficial de alias para HOT01M, SSC01M y EOC01M, manteniendo el cierre por defecto, puede resolver el cuello de botella medido de tres ciclos completos sin ofertas alcanzadas. Solo después, y si esa pasada sigue sin admitir alias, se deben priorizar nuevos ciclos de mayor demanda con el mismo contrato de evidencia.
