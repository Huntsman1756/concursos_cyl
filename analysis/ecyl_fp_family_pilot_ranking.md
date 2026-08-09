# Ranking ECYL para priorizar el piloto de cobertura FP

## Resumen ejecutivo

- La exportación ingerida contiene **1.077 ofertas únicas**, publicadas entre el 10 de febrero y el 7 de agosto de 2026. El 93,4 % (1.006) se publicó en los últimos tres meses de la captura; por tanto, el documento no interpreta el conjunto como una tendencia semestral.
- La fuente no publica CNO ni familia profesional. Por ello, este análisis clasifica de forma conservadora los títulos como **señales de investigación**, nunca como relaciones ciclo–ocupación aprobadas.
- Las mayores señales candidatas de FP son Servicios Socioculturales y a la Comunidad (127), Sanidad (88), Hostelería y Turismo (69), Edificación y Obra Civil (36) y Comercio y Marketing (35).
- La revisión elimina de forma reproducible un título universitario que reentraba por `ayuda a domicilio` y tres falsos positivos de Edificación ligados a maquinaria, estructuras metálicas/buques y rótulos.
- El piloto recomendado mantiene dos casos fáciles, dos medios de familias distintas y uno ambiguo: SAN21, HOT01M, SSC01M, EOC01M y COM01M.

## Ranking conservador por familia candidata

| Posición | Familia candidata                          | Ventana capturada | Tramo reciente de 3 meses | Lectura                                                                                                         |
| -------: | ------------------------------------------ | ----------------: | ------------------------: | --------------------------------------------------------------------------------------------------------------- |
|        1 | Servicios Socioculturales y a la Comunidad |               127 |                       113 | Concentración clara en asistencia domiciliaria y cuidados de dependencia.                                       |
|        2 | Sanidad                                    |                88 |                        83 | Dominada por auxiliares de enfermería; se excluyen profesiones universitarias y sanitarias no atribuibles a FP. |
|        3 | Hostelería y Turismo                       |                69 |                        64 | Cocineros, camareros y pinches; requiere separar ciclos de cocina y restauración.                               |
|        4 | Edificación y Obra Civil                   |                36 |                        34 | Albañilería y oficios de obra; probable reparto entre varios ciclos.                                            |
|        5 | Comercio y Marketing                       |                35 |                        34 | Puestos heterogéneos de almacén, comercio y venta; buen caso ambiguo.                                           |
|        6 | Agraria                                    |                27 |                        24 | Señal fragmentada entre agricultura, ganadería, jardinería y forestal.                                          |
|        7 | Transporte y Mantenimiento de Vehículos    |                18 |                        17 | Se excluyen conductores porque el título no demuestra una ruta FP.                                              |
|        8 | Administración y Gestión                   |                17 |                        16 | Volumen menor y ambigüedad ya observada en Gestión Administrativa.                                              |

Quedan fuera del ranking **392 ofertas** por ser no FP o no permitir una relación suficiente desde el título, y **192** sin asignación segura. Solo 409 de 1.077 ofertas (38,0 %) superan este primer filtro conservador.

## Piloto de cinco ciclos

| Estrato | Clave  | Ciclo                                           | Familia                                    | Señal de títulos relacionada |
| ------- | ------ | ----------------------------------------------- | ------------------------------------------ | ---------------------------: |
| Fácil   | SAN21  | Cuidados Auxiliares de Enfermería               | Sanidad                                    |                           86 |
| Fácil   | HOT01M | Cocina y Gastronomía                            | Hostelería y Turismo                       |                           46 |
| Medio   | SSC01M | Atención a Personas en Situación de Dependencia | Servicios Socioculturales y a la Comunidad |                          121 |
| Medio   | EOC01M | Construcción                                    | Edificación y Obra Civil                   |                           32 |
| Ambiguo | COM01M | Actividades Comerciales                         | Comercio y Marketing                       |                           25 |

Las cifras de la última columna son señales de títulos para priorizar investigación. No equivalen a ofertas ya cubiertas por el ciclo y pueden solaparse con otros ciclos. Cada relación deberá superar la curación oficial antes de entrar en producción.

Cada señal del piloto se calcula ahora dentro de las ofertas ya clasificadas en su familia candidata. Una aserción ejecutable exige que `señal del ciclo <= total de la familia`, evitando que reglas de clasificación distintas vuelvan a producir una contradicción.

SSC01M se mantiene provisionalmente como **medio** pese a concentrar 121 de las 127 señales de su familia. El motivo no es el volumen: el perfil oficial auditado publica once salidas profesionales distintas para este título —atención domiciliaria, institucional, educación especial, asistencia personal y teleasistencia, entre otras—, por lo que la curación debe resolver varias ocupaciones oficiales y no una única equivalencia directa. El piloto determinará si esa complejidad real lo acerca finalmente al estrato fácil.

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

La exportación no contiene CNO, familia profesional ni una marca fiable de vigencia. El recuento representa registros publicados en la ventana de captura disponible, no vacantes únicas activas ni puestos cubiertos. Dado que el 93,4 % de los registros se concentra en sus últimos tres meses y 563 aparecen solo en julio, los cortes se usan para describir composición y cobertura del pipeline, no para afirmar estabilidad o tendencia de mercado.

## Fuentes

- `public/data/v1/manifest.json`, generado el 9 de agosto de 2026.
- Snapshot manifest-addressed de `jobOffers`, actualizado en origen el 7 de agosto de 2026.
- Catálogo oficial ingerido de programas FP para claves, niveles y nombres de ciclos.
- Notebook: `analysis/ecyl_fp_family_pilot_ranking.ipynb`.
