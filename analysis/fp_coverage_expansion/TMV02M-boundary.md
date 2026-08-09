# TMV02M — Electromecánica de Vehículos Automóviles

## Decisión

`deferred`. El seed congelado `Electromecánico de vehículos` no se reconcilia literalmente con el inventario exhaustivo del BOE: la fuente normativa usa `Electromecánico de automóviles`. Además, el inventario mezcla mantenimiento mecánico, electricidad/electrónica, ITV, accesorios, fabricación de recambios y venta/distribución; la evidencia CNO-11 exacta disponible para 7401 cubre mecánicos y ajustadores de vehículos de motor, pero no demuestra una relación única para todas esas salidas.

No se añaden ocupaciones, aliases, enlaces ni cambios a `data/curated` o `public`. El expediente conserva la auditoría completa y publica cero relaciones.

## Fuentes oficiales

- [TodoFP — Técnico en Electromecánica de Vehículos Automóviles](https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/electromecanica-vehiculos-automoviles.html): título y salidas profesionales.
- [BOE — Real Decreto 453/2010](https://www.boe.es/eli/es/rd/453/2010): identificación del título y lista normativa exhaustiva de ocupaciones.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): 7401, `Mecánicos y ajustadores de vehículos de motor`, incluyendo mecánica y mecatrónica de vehículos.
- [SEPE — ficha anual de la titulación](https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-titulaciones/buscador-titulaciones/titulacion-detalle-anual~__titulaciones-fp__2025_335250023204-T-cnico-en-electromec-nica-de-veh-culos-autom-viles~.html): evidencia de mercado y ocupaciones observadas; no sustituye la clasificación CNO exacta.

## Inventario BOE y frontera CNO

| Orden | Output BOE                                                                   | Frontera revisada                                                                                                                                       | Decisión |
| ----: | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
|     1 | Electronicista de vehículos.                                                 | 7401 no prueba el componente electrónico; 7531 se consideró como frontera electrónica general, pero no se adopta como relación específica de vehículos. | rejected |
|     2 | Electricista electrónico de mantenimiento y reparación en automoción.        | 7401 no prueba por sí solo el componente eléctrico-electrónico.                                                                                         | rejected |
|     3 | Mecánico de automóviles.                                                     | 7401 describe mecánicos y ajustadores de vehículos de motor.                                                                                            | rejected |
|     4 | Electricista de automóviles.                                                 | La evidencia CNO revisada no aporta una frontera vehicular exacta separada.                                                                             | rejected |
|     5 | Electromecánico de automóviles.                                              | 7401 cubre mecánica y mecatrónica, pero el seed no coincide literalmente y el inventario es heterogéneo.                                                | rejected |
|     6 | Mecánico de motores y sus sistemas auxiliares de automóviles y motocicletas. | Compatible materialmente con 7401, sin cerrar el seed exhaustivo.                                                                                       | rejected |
|     7 | Reparador sistemas neumáticos e hidráulicos.                                 | La fuente CNO revisada no separa esta especialidad vehicular como relación exacta.                                                                      | rejected |
|     8 | Reparador sistemas de transmisión y frenos.                                  | 7401 enumera tareas mecánicas afines, pero no una relación normativa título-output-CNO individual.                                                      | rejected |
|     9 | Reparador sistemas de dirección y suspensión.                                | 7401 enumera tareas mecánicas afines, pero no una relación normativa título-output-CNO individual.                                                      | rejected |
|    10 | Operario de ITV.                                                             | La actividad de inspección no queda clasificada exactamente por 7401.                                                                                   | rejected |
|    11 | Instalador de accesorios en vehículos.                                       | No hay evidencia CNO exacta vehicular en la revisión.                                                                                                   | rejected |
|    12 | Operario de empresas dedicadas a la fabricación de recambios.                | Fabricación de componentes no equivale literalmente a mantenimiento de vehículos 7401.                                                                  | rejected |
|    13 | Electromecánico de motocicletas.                                             | 7401 incluye mecánicos de motocicletas, pero no resuelve la frontera exhaustiva del programa.                                                           | rejected |
|    14 | Vendedor/distribuidor de recambios y equipos de diagnosis.                   | Venta y distribución quedan fuera de la frontera 7401.                                                                                                  | rejected |

La relación `TMV02M|occupation:cno11:7401` queda registrada como candidato rechazado para preservar la frontera auditada, nunca como relación pública. El delta determinista es vacío y el snapshot no se regenera.
