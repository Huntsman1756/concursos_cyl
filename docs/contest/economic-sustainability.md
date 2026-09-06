# Valor económico y continuidad de SALIDA

Propuesta de operación para evaluar; no es un presupuesto contratado ni una previsión de ventas. Base técnica: C15 público, con instantánea congelada del 30 de agosto de 2026. No se ha medido demanda, ahorro económico o disposición a pagar.

## Beneficio económico que se quiere contrastar

Para personas usuarias, una consulta guiada podría reducir tiempo de búsqueda y ayudar a descartar interpretaciones erróneas antes de decidir formación. Para orientación, una vista común y trazable podría reducir la preparación de consultas. Son hipótesis: el piloto de cinco personas detectará problemas de comprensión, pero no demostrará por sí solo ahorro causal ni rentabilidad.

Si posteriormente se compara una tarea equivalente con y sin SALIDA, se podrá calcular `horas potencialmente ahorradas = consultas × diferencia de minutos / 60`. Sin comparación equivalente y muestra suficiente no se publicará esa cifra como impacto. El valor del tiempo será una hipótesis explícita, nunca un salario atribuido a participantes.

## Modelo de continuidad propuesto

Mantener el acceso público básico y los datos derivados reutilizables. Explorar, solo si una entidad expresa una necesidad concreta, un servicio de mantenimiento, instalación o adaptación para orientación. Se cobraría trabajo de soporte y adaptación, no exclusividad sobre datos abiertos. La licencia del código y las de cada fuente siguen siendo aplicables.

No hay ingresos ni contratos acreditados. Antes de invertir en funciones para organizaciones: contrastar la necesidad con orientadores, delimitar una prestación y medir su coste. No se contactará con entidades ni se enviarán propuestas sin una instrucción específica.

## Presupuesto trazable

| Componente            | Base para presupuestar                                                    | Evidencia pendiente                                   |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Alojamiento y dominio | Coste incremental atribuible a SALIDA                                     | Factura y criterio de reparto si el VPS es compartido |
| Revisión de datos     | Horas de captura, diferencias y revisión semántica × coste por hora       | Registro de un ciclo real de actualización            |
| Mantenimiento técnico | Horas de dependencias, incidencias, build y verificación × coste por hora | Registro real de trabajo                              |
| Soporte y orientación | Horas necesarias para el servicio acordado                                | Necesidad y alcance confirmados por una entidad       |
| Contingencia          | Importe decidido por el responsable según riesgos                         | Decisión pendiente; no se presupone financiación      |

`Coste anual = 12 × infraestructura mensual + horas anuales × coste por hora + gastos extraordinarios`.

`Margen anual = ingresos contratados − coste anual atribuible`. Sin contratos e importes reales no puede afirmarse margen positivo. El primer premio de 2.500 €, si se obtuviera, sería una aportación puntual; no sostiene por sí solo un compromiso de servicio indefinido.

La ausencia de backend transaccional y de llamadas de IA por visita simplifica la operación, pero no demuestra coste cero ni capacidad ilimitada. El trabajo inicial de desarrollo tampoco se elimina del análisis económico.

## Operación propuesta después de la entrega

| Actividad                  | Cadencia propuesta, no automatización ya activa                          | Criterio de publicación                                                     |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Revisar cambios de fuentes | Comprobación semanal para ofertas/convocatorias y mensual para catálogos | Mostrar siempre fecha de copia; no prometer actualidad continua             |
| Revisar relaciones         | Cuando cambie una fuente o se detecte un error material                  | Evidencia oficial para el vínculo exacto y revisión de diferencias          |
| Actualizar dependencias    | Revisión mensual y ante incidencias relevantes                           | Pruebas proporcionales y sin alterar datos incidentalmente                  |
| Publicar una copia nueva   | Solo después de validarla                                                | Esquemas, hashes, diferencias de cobertura, build y smoke del SHA publicado |
| Recuperar servicio         | Ante fallo verificado                                                    | Volver a una release conservada y comprobar identidad/rutas                 |

Debe designarse quién mantiene, quién revisa los datos y qué tiempo puede dedicar. Una misma persona puede asumir varios papeles, pero el proyecto no promete una revisión independiente si no existe. No hay SLA ni disponibilidad 24/7 acreditados.

Si no hay capacidad para actualizar, conservar una versión identificada con fecha visible es más honesto que anunciar ofertas vigentes. Antes de ampliar cobertura o contratar servicios, revisar capacidad, coste y evidencia de utilidad. Durante la candidatura se mantiene C15 salvo error material.

## Evidencia necesaria para pasar de hipótesis a viabilidad

1. Completar el piloto y distinguir comprensión de satisfacción o intención de uso.
2. Registrar tiempo y coste de una actualización real, sin publicar datos personales ni facturas sensibles.
3. Confirmar una necesidad de orientación y un responsable de continuidad.
4. Completar el presupuesto con importes documentados y decidir si puede mantenerse sin premio.

Estado: propuesta preparada; costes reales, demanda e ingresos pendientes de evidencia.
