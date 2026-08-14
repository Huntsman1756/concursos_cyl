# Propuesta de correspondencias HOT05S → CNO-11

**Fuente oficial:** TodoFP, Ministerio de Educación, Formación Profesional y Deportes.  
**Título:** Técnico Superior en Dirección de Servicios de Restauración.  
**URL:** https://www.todofp.es/que-estudiar/familias-profesionales/hosteleria-turismo/direccion-servicios-restauracion.html  
**Modelo CNO:** CNO-11 (INE, catálogo curado en `data/curated/occupations.json`)  
**Alcance:** Dirección de servicios de restauración, maître, sumiller, banquetes y catering.  
**Excluye expresamente:** Elaboración de bollería y análisis organoléptico profesional.

---

## 1. Candidatos CNO-11 (solo `approved`)

### 1.1 Encargada / encargado de economato y bodega → 4121

| Campo               | Valor                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:4121`                                                                                                                                                                                                   |
| **Código CNO-11**   | 4121                                                                                                                                                                                                                      |
| **Etiqueta exacta** | `Empleados de control de abastecimientos e inventario`                                                                                                                                                                    |
| **Cita literal**    | _"Encargada / encargado de economato y bodega"_                                                                                                                                                                           |
| **Justificación**   | Correspondencia funcional directa del componente «economato»: gestión y control de abastecimientos e inventario del establecimiento de restauración.                                                                      |
| **Riesgo**          | **MEDIO-ALTO.** La ocupación CNO-11 es genérica (empleado administrativo de nivel 4), no captura la responsabilidad de dirección del cargo ni el componente «bodega» (gestión de vinos/bebidas). Correspondencia parcial. |

### 1.2 Responsable de compra de bebidas → 3522

| Campo               | Valor                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **occupationId**    | `occupation:cno11:3522`                                                                                                                                                                           |
| **Código CNO-11**   | 3522                                                                                                                                                                                              |
| **Etiqueta exacta** | `Agentes de compras`                                                                                                                                                                              |
| **Cita literal**    | _"Responsable de compra de bebidas"_                                                                                                                                                              |
| **Justificación**   | Correspondencia funcional directa sobre la función de compra: negociación, selección y adquisición de bebidas para el establecimiento.                                                            |
| **Riesgo**          | **MEDIO.** La ocupación CNO-11 es genérica de compras industriales/comerciales, sin especialización en bebidas ni en restauración. Función auxiliar dentro del título, no dirección de servicios. |

---

## 2. Salidas sin candidato

| #   | Cita literal                                          | Motivo                                                                                                                                   |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | _"Director / directora de alimentos y bebidas."_      | Sin candidato approved. El catálogo no contiene CNO-11 1412 (Directores de hostelería/restauración) ni equivalente para dirección F&B.   |
| 2   | _"Encargada / encargado de bar-cafetería."_           | Sin candidato approved. No existe ocupación de gestión de bar-cafetería en el catálogo. 5210 (Jefes de tienda) es retail, no hostelería. |
| 3   | _"Encargada / encargado de economato y bodega"_       | _Corresponde al candidato 1.1 (4121)._                                                                                                   |
| 4   | _"Jefa / jefe de banquetes."_                         | Sin candidato approved. No existe ocupación CNO-11 para gestión de banquetes.                                                            |
| 5   | _"Jefa / jefe de operaciones de catering."_           | Sin candidato approved. El catálogo no contiene código para catering.                                                                    |
| 6   | _"Jefa / jefe de Sala."_                              | Sin candidato approved. No existe ocupación de jefe de sala / maître en el catálogo.                                                     |
| 7   | _"Maître."_                                           | Sin candidato approved. No existe ocupación de maître en el catálogo.                                                                    |
| 8   | _"Responsable de compra de bebidas."_                 | _Corresponde al candidato 1.2 (3522)._                                                                                                   |
| 9   | _"Sumiller."_                                         | Sin candidato approved. No existe ocupación de sumiller en el catálogo.                                                                  |
| 10  | _"Supervisor / supervisora de restauración moderna."_ | Sin candidato approved. 5831 (Supervisores de mantenimiento/hoteles) está `rejected` y cubre limpieza, no restauración.                  |

---

## 3. Exclusiones explícitas (sustituciones rechazadas)

| Código | Ocupación                                                                             | Status     | Motivo de exclusión                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 3160   | Técnicos de control de calidad de las ciencias físicas, químicas y de las ingenierías | `approved` | **Rechazada.** Sustitución hacia análisis organoléptico profesional, expresamente excluido del alcance de HOT05S.                            |
| 3734   | Chefs                                                                                 | `rejected` | Dirección de cocina, no dirección de servicios de restauración. Además status `rejected`.                                                    |
| 5831   | Supervisores de mantenimiento y limpieza en oficinas, hoteles…                        | `rejected` | Supervisión de mantenimiento/limpieza, no de restauración. `rejected`.                                                                       |
| 5110   | Cocineros asalariados                                                                 | `approved` | Elaboración en cocina, ajena a la dirección de sala y servicio. No propuesto.                                                                |
| 9310   | Ayudantes de cocina                                                                   | `approved` | Apoyo en cocina, no dirección de restauración. No propuesto.                                                                                 |
| 5120   | Camareros asalariados                                                                 | `approved` | Servicio operativo de sala, no dirección. No propuesto.                                                                                      |
| 4309   | Empleados administrativos…                                                            | `draft`    | `draft`, no `approved`. Excluido.                                                                                                            |
| —      | Bollería/confitería                                                                   | —          | El catálogo no contiene ocupaciones de panadería, pastelería ni confitería. No se propone ninguna sustitución hacia elaboración de bollería. |

---

## 4. Resumen

| #   | Salida HOT05S                                    | Código CNO-11 | Occupation ID           | Riesgo     |
| --- | ------------------------------------------------ | ------------- | ----------------------- | ---------- |
| 1   | Director / directora de alimentos y bebidas      | —             | Sin candidato           | —          |
| 2   | Encargada / encargado de bar-cafetería           | —             | Sin candidato           | —          |
| 3   | Encargada / encargado de economato y bodega      | 4121          | `occupation:cno11:4121` | Medio-Alto |
| 4   | Jefa / jefe de banquetes                         | —             | Sin candidato           | —          |
| 5   | Jefa / jefe de operaciones de catering           | —             | Sin candidato           | —          |
| 6   | Jefa / jefe de Sala                              | —             | Sin candidato           | —          |
| 7   | Maître                                           | —             | Sin candidato           | —          |
| 8   | Responsable de compra de bebidas                 | 3522          | `occupation:cno11:3522` | Medio      |
| 9   | Sumiller                                         | —             | Sin candidato           | —          |
| 10  | Supervisor / supervisora de restauración moderna | —             | Sin candidato           | —          |

**Observaciones globales:**

- El catálogo curado carece de ocupaciones CNO-11 para dirección de hostelería/restauración (1412), maître, sumiller, jefe de sala, banquetes o catering. La cobertura del ámbito «servicios de restauración» es muy baja.
- Los dos candidatos propuestos (4121 y 3522) son correspondencias funcionales parciales sobre subfunciones (economato y compras), no sobre las salidas nucleares de dirección.
- Se han rechazado explícitamente las sustituciones hacia análisis organoléptico (3160) y elaboración de bollería (sin ocupación en el catálogo).
- No se han modificado `data/curated/occupations.json` ni ningún otro archivo de datos ni código.
