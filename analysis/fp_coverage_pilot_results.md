# Resultados del piloto de cobertura FP

## Resultado observado

- 4/5 programas completados; 1/5 diferido; 0/5 descartado.
- 68 minutos de trabajo activo modelado en los cinco intentos. Es una suma declarada de investigación, implementación, pruebas y revisión; no representa minutos literales de revisión independiente ni todo el tiempo de los bucles de corrección.
- El intervalo de reloj de extremo a extremo es 157.9–176.8 minutos (2.6–2.9 horas). Para cada intento empieza en `startedAt`, su límite inferior de terminación es la marca Git del commit final revisado y su límite superior es el inicio del siguiente intento (o la agregación para COM01M). Las cinco marcas Git están validadas contra los SHA guardados.
- Coste por programa completado: 17.0 minutos activos modelados; 39.5–44.2 minutos de reloj. Las magnitudes de reloj son rangos, no minutos de revisión inventados.
- 43 ofertas marginales alcanzadas. La tasa es 37.9 ofertas/hora activa modelada y 14.6–16.3 ofertas/hora de reloj.

No se infiere una tasa estable para todo el catálogo a partir de cinco intentos.

## Cobertura publicada y límites

La cobertura revisada pública incluye EOC01M, HOT01M, IFC03S, IFC03SD, SAN21, SSC01M. La interfaz la deriva de `mapping-coverage.json` direccionado por el manifiesto; no mantiene una lista paralela. COM01M permanece diferido y se muestra como cobertura no disponible, sin relación, alias, ocupación ni afirmación pública revisada.

SAN21 es el único ciclo del piloto con alcance marginal en la instantánea: 43 ofertas mediante la unión de relaciones aceptadas. HOT01M, SSC01M y EOC01M tienen relaciones oficiales aprobadas, pero 0 ofertas marginales cada uno porque no se admitieron alias sin evidencia oficial suficiente. Cero no equivale a ausencia de empleo fuera de la instantánea.

## No finalización y siguiente tramo

COM01M se difiere: las salidas de ventas, comercio, almacén, logística y atención remota no tienen una correspondencia primaria, exacta y de cuatro dígitos con CNO-11; ampliar por similitud sería especulativo.

El siguiente trabajo recomendado no es abrir más ciclos de forma ciega. Primero, una pasada acotada de evidencia oficial de alias para HOT01M, SSC01M y EOC01M, manteniendo el cierre por defecto, puede resolver el cuello de botella medido de tres ciclos completos sin ofertas alcanzadas. Solo después, y si esa pasada sigue sin admitir alias, se deben priorizar nuevos ciclos de mayor demanda con el mismo contrato de evidencia.
