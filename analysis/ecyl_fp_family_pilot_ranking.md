# Ranking ECYL para priorizar el piloto de cobertura FP

## Resumen ejecutivo

- La exportación ingerida contiene **1.045 ofertas únicas**, publicadas entre el 4 de febrero y el 3 de agosto de 2026. El 94,5 % (988) se publicó en los últimos tres meses del periodo observado.
- La fuente no publica CNO ni familia profesional. Por ello, este análisis clasifica de forma conservadora los títulos como **señales de investigación**, nunca como relaciones ciclo–ocupación aprobadas.
- Las mayores señales candidatas de FP son Servicios Socioculturales y a la Comunidad (134), Sanidad (83), Hostelería y Turismo (72), Edificación y Obra Civil (42) y Comercio y Marketing (37).
- El piloto recomendado mantiene dos casos fáciles, dos medios de familias distintas y uno ambiguo: SAN21, HOT01M, SSC01M, EOC01M y COM01M.

## Ranking conservador por familia candidata

| Posición | Familia candidata | Ofertas, 6 meses | Ofertas, 3 meses | Lectura |
|---:|---|---:|---:|---|
| 1 | Servicios Socioculturales y a la Comunidad | 134 | 122 | Concentración clara en asistencia domiciliaria y cuidados de dependencia. |
| 2 | Sanidad | 83 | 80 | Dominada por auxiliares de enfermería; se excluyen profesiones universitarias y sanitarias no atribuibles a FP. |
| 3 | Hostelería y Turismo | 72 | 68 | Cocineros, camareros y pinches; requiere separar ciclos de cocina y restauración. |
| 4 | Edificación y Obra Civil | 42 | 39 | Albañilería y oficios de obra; probable reparto entre varios ciclos. |
| 5 | Comercio y Marketing | 37 | 35 | Puestos heterogéneos de almacén, comercio y venta; buen caso ambiguo. |
| 6 | Agraria | 23 | 20 | Señal fragmentada entre agricultura, ganadería, jardinería y forestal. |
| 7 | Administración y Gestión | 21 | 20 | Volumen menor y ambigüedad ya observada en Gestión Administrativa. |
| 8 | Transporte y Mantenimiento de Vehículos | 21 | 20 | Se excluyen conductores porque el título no demuestra una ruta FP. |

Quedan fuera del ranking **369 ofertas** por ser no FP o no permitir una relación suficiente desde el título, y **181** sin asignación segura. Solo 495 de 1.045 ofertas (47,4 %) superan este primer filtro conservador.

## Piloto de cinco ciclos

| Estrato | Clave | Ciclo | Familia | Señal de títulos relacionada |
|---|---|---|---|---:|
| Fácil | SAN21 | Cuidados Auxiliares de Enfermería | Sanidad | 82 |
| Fácil | HOT01M | Cocina y Gastronomía | Hostelería y Turismo | 47 |
| Medio | SSC01M | Atención a Personas en Situación de Dependencia | Servicios Socioculturales y a la Comunidad | 126 |
| Medio | EOC01M | Construcción | Edificación y Obra Civil | 46 |
| Ambiguo | COM01M | Actividades Comerciales | Comercio y Marketing | 28 |

Las cifras de la última columna son señales de títulos para priorizar investigación. No equivalen a ofertas ya cubiertas por el ciclo y pueden solaparse con otros ciclos. Cada relación deberá superar la curación oficial antes de entrar en producción.

## Qué debe medir cada intento

Registrar para cada ciclo:

1. Estado final: `completed`, `discarded` o `deferred`.
2. Horas totales, incluyendo investigación que no termina en cobertura.
3. Horas separadas de investigación, implementación, pruebas y revisión.
4. Número de relaciones ciclo–ocupación aceptadas y rechazadas.
5. Motivo codificado de descarte o aplazamiento.
6. Ofertas del snapshot potencialmente alcanzables después de la revisión.

Las métricas de decisión serán:

- **Tasa de finalización:** ciclos completados / ciclos intentados.
- **Tasa de descarte o aplazamiento:** (descartados + aplazados) / intentados.
- **Coste real por ciclo cubierto:** horas de todos los intentos / ciclos completados.
- **Cobertura marginal:** ofertas alcanzables nuevas / horas de todos los intentos.

Con cinco intentos, la tasa seguirá teniendo mucha incertidumbre. Debe informarse como resultado observado `x/5`, no como porcentaje estable del catálogo.

## Método y límites

El notebook reproducible carga la ruta de snapshot indicada por `public/data/v1/manifest.json`, normaliza los títulos y aplica reglas ordenadas y revisables. Las reglas separan una clasificación sectorial amplia de un filtro candidato de FP que excluye profesiones universitarias, licencias profesionales y títulos demasiado ambiguos.

La exportación no contiene CNO, familia profesional ni una marca fiable de vigencia. El recuento representa registros publicados en la ventana disponible, no vacantes únicas activas ni puestos cubiertos. La concentración de julio también impide interpretar los seis meses como una serie homogénea.

## Fuentes

- `public/data/v1/manifest.json`, generado el 5 de agosto de 2026.
- Snapshot manifest-addressed de `jobOffers`, actualizado en origen el 3 de agosto de 2026.
- Catálogo oficial ingerido de programas FP para claves, niveles y nombres de ciclos.
- Notebook: `analysis/ecyl_fp_family_pilot_ranking.ipynb`.
