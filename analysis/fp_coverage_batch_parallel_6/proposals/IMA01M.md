# Propuesta de mapeo IMA01M → CNO-11

## Cabecera

| Campo                             | Valor                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Source Key**                    | `IMA01M`                                                                                                                |
| **Source Title**                  | Técnico en Instalaciones de Producción de Calor                                                                         |
| **Family Code**                   | `IMA` — Instalación y Mantenimiento                                                                                     |
| **Source System**                 | TodoFP                                                                                                                  |
| **Source URL**                    | https://www.todofp.es/que-estudiar/familias-profesionales/instalacion-mantenimiento/instalaciones-produccion-calor.html |
| **Level**                         | intermediate                                                                                                            |
| **Total de citas TodoFP**         | 5                                                                                                                       |
| **Con candidato CNO-11 approved** | 1                                                                                                                       |
| **Sin candidato CNO-11 approved** | 4                                                                                                                       |
| **Citas cubiertas**               | 1/5                                                                                                                     |

---

## Citas literales TodoFP (5)

| #   | Cita literal                                                                                    |
| --- | ----------------------------------------------------------------------------------------------- |
| 1   | Instalador-mantenedor / instaladora-mantenedora de equipos de producción de calor.              |
| 2   | Instalador-mantenedor / instaladora-mantenedora de instalaciones de agua.                       |
| 3   | Instalador-mantenedor / instaladora-mantenedora de instalaciones de calefacción y ACS.          |
| 4   | Instalador-mantenedor / instaladora-mantenedora de instalaciones de gas y combustibles líquidos |
| 5   | Instalador-mantenedor / instaladora-mantenedora de instalaciones solares térmicas.              |

---

## Candidatos CNO-11 approved — correspondencia funcional directa

### Candidato 1 — Instalador-mantenedor de instalaciones de agua

| Campo                 | Valor                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| occupationId          | `occupation:cno11:7221`                                                   |
| Código CNO-11         | 7221                                                                      |
| Etiqueta exacta       | Fontaneros                                                                |
| reviewStatus          | approved                                                                  |
| Cita literal cubierta | Instalador-mantenedor / instaladora-mantenedora de instalaciones de agua. |

**Justificación:** La cita 2 del programa IMA01M describe la función de «instalador-mantenedor de instalaciones de agua». El código CNO-11 7221 (Fontaneros) recoge específicamente a los profesionales que instalan y mantienen instalaciones de suministro de agua en edificios e infraestructuras. La correspondencia es directa: «instalaciones de agua» = instalaciones de fontanería. El ámbito de IMA01M (producción de calor) implica que estas instalaciones de agua forman parte de sistemas hidráulicos conectados a equipamiento térmico, pero la función técnica descrita — instalar y mantener conducciones de agua — es idéntica a la competencia nuclear de los fontaneros.

**Riesgo:** Medio. El código 7221 (Fontaneros) es un código amplio que cubre toda tipo de instalaciones de agua (sanitarias, potables, contra incendios, etc.), mientras que la cita de IMA01M se refiere específicamente a instalaciones de agua en el contexto de producción de calor (circuito de calefacción, depósitos, etc.). Existe riesgo de sobre-inclusión: 7221 cubre más funciones de las estrictamente térmicas. Sin embargo, la competencia técnica central (tuberías, conexiones, uniones, presión de fluidos) es la misma, por lo que la correspondencia se mantiene como directa con esta salvedad.

---

## Ausencias explícitas (sin candidato CNO-11 approved)

| #   | Cita literal                                                          | Causa de ausencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Instalador-mantenedor de equipos de producción de calor.              | No existe en el catálogo CNO-11 approved un código específico para instaladores o mantenedores de equipos de producción de calor (calderas, acumuladores, intercambiadores). El código 7250 (Mecánicos-instaladores de refrigeración y climatización) cubre refrigeración y climatización, no producción de calor. No se puede equiparar producción de calor con refrigeración sin evidencia directa. El código 7313 (Chapistas y caldereros) se refiere a fabricación de calderas, no a instalación ni mantenimiento de equipos de calor. |
| 3   | Instalador-mantenedor de instalaciones de calefacción y ACS.          | No existe en el catálogo CNO-11 approved un código específico para instaladores de calefacción ni de ACS (Agua Caliente Sanitaria). El código 7250 cubre climatización (refrigeración/aire acondicionado), no calefacción. El código 7221 (Fontaneros) cubre instalaciones de agua genéricas pero no incluye explícitamente la función de calefacción ni ACS como ámbito de competencia. No se puede equiparar calefacción con climatización/refrigeración sin evidencia directa.                                                          |
| 4   | Instalador-mantenedor de instalaciones de gas y combustibles líquidos | No existe en el catálogo CNO-11 approved un código específico para instaladores de gas ni de combustibles líquidos. No hay epígrafe de «instaladores de gas» ni de «instaladores de combustibles líquidos» en el catálogo aprobado. Los códigos de fontanería (7221) no cubren gas ni combustibles líquidos (son Fluidos diferentes con reglamentación y competencia técnica distinta).                                                                                                                                                    |
| 5   | Instalador-mantenedor de instalaciones solares térmicas.              | No existe en el catálogo CNO-11 approved un código específico para instaladores de solar térmica. El código 7294 (Montadores-instaladores de placas de energía solar) se refiere a placas fotovoltaicas (producción de electricidad), no a colectores solares térmicos (producción de calor para ACS y calefacción). Son tecnologías distintas: fotovoltaica convierte luz en electricidad; térmica convierte luz en calor. No se puede equiparar producción energética fotovoltaica con solar térmica sin evidencia directa.              |

---

## Resumen de cobertura

| Métrica                            | Valor                                                      |
| ---------------------------------- | ---------------------------------------------------------- |
| Total citas TodoFP                 | 5                                                          |
| Citas con candidato approved       | 1                                                          |
| Citas sin candidato                | 4                                                          |
| Códigos CNO-11 utilizados          | 7221                                                       |
| Rechazos por confusión tecnológica | 3 (7250≠calefacción, 7294≠solar térmica, 7313≠instalación) |
| Rechazos por ausencia de epígrafe  | 1 (gas y combustibles líquidos)                            |

### Nota sobre las cinco funciones térmicas y de fluidos

IMA01M define cinco funciones específicas del ámbito de instalaciones térmicas y de fluidos:

1. **Equipos de producción de calor** — calderas, acumuladores, intercambiadores
2. **Instalaciones de agua** — circuitos hidráulicos de suministro
3. **Calefacción y ACS** — sistemas de calefacción y agua caliente sanitaria
4. **Gas y combustibles líquidos** — instalaciones de gases y líquidos combustibles
5. **Solar térmica** — colectores solares para producción de calor

El catálogo CNO-11 approved solo contiene un código (7221 Fontaneros) que cubre directamente una de estas cinco funciones (instalaciones de agua). Las otras cuatro funciones carecen de epígrafe específico en el catálogo aprobado. Se ha evitado expresamente:

- **Equivalencia 7250 = calefacción:** 7250 es «refrigeración y climatización», no calefacción. Son subsistemas opuestos del HVAC.
- **Equivalencia 7294 = solar térmica:** 7294 es «placas de energía solar» (fotovoltaica), no colectores solares térmicos.
- **Equivalencia 7221 = calefacción/ACS:** 7221 cubre instalaciones de agua genéricas, no la función específica de calefacción ni ACS.
- **Equivalencia 7313 = equipos de calor:** 7313 es «Chapistas y caldereros» (fabricación), no instalación ni mantenimiento.

### Nota sobre nivel jerárquico

IMA01M es un programa de nivel «intermediate» (Técnico). El código 7221 (Fontaneros) pertenece al grupo 7 del CNO-11 (trabajadores cualificados de la construcción), que es coherente con el nivel intermedio del programa. No se ha rebajado a peonaje (grupo 9) ni forzado a códigos de nivel superior (grupo 3).

---

_Documento generado para mapeo IMA01M (TodoFP) → CNO-11 (approved)._
