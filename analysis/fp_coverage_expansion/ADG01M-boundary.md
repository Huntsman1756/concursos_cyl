# ADG01M — Gestión Administrativa

## Decisión

`deferred`. El ranking congelado aporta el seed `Empleado administrativo`, pero el BOE no contiene ese literal: enumera diez salidas diferenciadas. El inventario completo se conserva en orden normativo y muestra fronteras CNO-11 incompatibles o no resueltas por el título corto: administración sin atención al público (4309), atención administrativa al público (4500), recepción (4412), información al usuario (4411), contabilidad (4111), nóminas (4112), servicios de personal (4223), servicios financieros (4113) y caja bancaria (4441).

No se añaden aliases, ocupaciones ni enlaces a `data/curated`. `public` y sus snapshots permanecen intactos; el delta de ofertas es vacío.

## Fuentes oficiales

- [TodoFP — Técnico en Gestión Administrativa](https://www.todofp.es/que-estudiar/familias-profesionales/administracion-gestion/gestion-administrativa.html): identidad del programa.
- [BOE — Real Decreto 1631/2009](https://www.boe.es/eli/es/rd/2009/10/30/1631): artículo 7, inventario normativo exhaustivo de ocupaciones y puestos.
- [INE — CNO-11, notas explicativas](https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf): encabezados y límites exactos 4111, 4112, 4113, 4223, 4309, 4411, 4412, 4441 y 4500.
- [SEPE — ficha anual de Técnico en gestión administrativa](https://www.sepe.es/HomeSepe/es/que-es-observatorio/informacion-titulaciones/buscador-titulaciones/titulacion-detalle-anual~__titulaciones-fp__2025_333450027101-T-cnico-gesti-n-administrativa~.html): corroboración de mercado; no sustituye la clasificación CNO exacta.

## Inventario BOE y revisión uno-a-uno

| Orden | Output BOE                                                | Frontera CNO-11 revisada                                                            | Decisión |
| ----: | --------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
|     1 | Auxiliar administrativo.                                  | 4309, administración sin atención al público; el output no fija ese límite.         | rejected |
|     2 | Ayudante de oficina.                                      | 4309, pero el término es más amplio y no reconcilia literalmente el seed.           | rejected |
|     3 | Auxiliar administrativo de cobros y pagos                 | 4111 contabilidad / 4441 caja bancaria; no hay selección única.                     | rejected |
|     4 | Administrativo comercial.                                 | 4309 o 4500 según atención al público; el BOE no lo resuelve.                       | rejected |
|     5 | Auxiliar administrativo de gestión de personal            | 4112 nóminas o 4223 servicios de personal; no hay selección única.                  | rejected |
|     6 | Auxiliar administrativo de las administraciones públicas. | 4309 o 4500; el sector no determina la frontera funcional.                          | rejected |
|     7 | Recepcionista.                                            | 4412, frontera exacta de recepción, pero no es el seed congelado.                   | rejected |
|     8 | Empleado de atención al cliente.                          | 4411 información al usuario o 4500 atención administrativa; no hay selección única. | rejected |
|     9 | Empleado de tesorería.                                    | 4113 servicios financieros y bancarios; el literal no fija tareas suficientes.      | rejected |
|    10 | Empleado de medios de pago.                               | 4113 o 4441 según back-office frente a transacción cara al público.                 | rejected |

La reconciliación literal falla antes de cualquier publicación: `Empleado administrativo` no es una salida BOE exacta. La ficha SEPE 2025 corrobora la amplitud del resultado laboral (incluye 4309 y 4500 entre las ocupaciones más contratadas), pero no convierte esa corroboración en una relación título-ocupación aprobable. El expediente, por tanto, queda deferred y fail-closed.
