# Propuesta de correspondencias HOT04S → CNO-11

**Fuente oficial:** TodoFP, Ministerio de Educación, Formación Profesional y Deportes.  
**Título:** Técnico Superior en Dirección de Cocina.  
**URL:** https://www.todofp.es/que-estudiar/familias-profesionales/hosteleria-turismo/direccion-cocina.html  
**Consulta:** 2026-08-13  
**Modelo CNO:** CNO-11 (INE, catálogo curado en `data/curated/occupations.json`)  
**Fecha de la propuesta:** 2026-08-13

---

## 1. Salidas profesionales de HOT04S

Según la ficha oficial de TodoFP, las salidas profesionales del título son:

> _"director de alimentos y bebidas; director de cocina; jefe de producción en cocina; jefe de cocina; segundo jefe de cocina; jefe de operaciones de catering; jefe de partida; cocinero; encargado de economato y bodega."_

Ámbito: empresas del sector de hostelería, especialmente restauración; en establecimientos pequeños puede actuar como propietario y responsable de cocina.

---

## 2. Candidatos propuestos (con código CNO-11 existente en el catálogo)

### 2.1 Jefe de cocina / Director de cocina / Chefs

| Campo | Valor |
|---|---|
| **CNO-11 Code** | 3734 |
| **Occupation ID** | `occupation:cno11:3734` |
| **Etiqueta exacta en el catálogo** | `Chefs` |
| **Confirmation Label** | `Dirección de cocina` |
| **Cita literal de TodoFP** | _"director de cocina; jefe de cocina; segundo jefe de cocina"_ |
| **Justificación** | La clasificación CNO-11 3734 "Chefs" agrupa a los profesionales que dirigen, organizan y supervisamos la producción de una cocina. El título Superior en Dirección de Cocina tiene como función principal la dirección de cocina, lo que se corresponde semánticamente con el rol de "chef" según la nomenclatura CNO-11. La etiqueta de confirmación "Dirección de cocina" refuerza este vínculo. |
| **Nivel de confianza** | **ALTA** |
| **Observación crítica** | En el catálogo curado, este occupation tiene `reviewStatus: "rejected"` (revisado 2026-08-08). La propuesta se basa en que el código 3734 existe y es semánticamente correcto, pero el status "rejected" del catálogo debe considerarse antes de establecer la relación final. |

### 2.2 Cocinero / Cocineros asalariados

| Campo | Valor |
|---|---|
| **CNO-11 Code** | 5110 |
| **Occupation ID** | `occupation:cno11:5110` |
| **Etiqueta exacta en el catálogo** | `Cocineros asalariados` |
| **Confirmation Label** | `Cocina profesional` |
| **Cita literal de TodoFP** | _"cocinero"_ |
| **Justificación** | TodoFP nombra explícitamente "cocinero" como una de las salidas profesionales del título. El código CNO-11 5110 "Cocineros asalariados" corresponde al nivel CNO 5 (oficios cualificados no técnicos), que es coherente con la ocupación de cocinero. La etiqueta "confirmacionLabel" = "Cocina profesional" confirma la equivalencia temática. Este code está `approved` en el catálogo. |
| **Nivel de confianza** | **ALTA** |

### 2.3 Jefe de partida / Ayudantes de cocina

| Campo | Valor |
|---|---|
| **CNO-11 Code** | 9310 |
| **Occupation ID** | `occupation:cno11:9310` |
| **Etiqueta exacta en el catálogo** | `Ayudantes de cocina` |
| **Confirmation Label** | `Ayuda de cocina` |
| **Cita literal de TodoFP** | _"jefe de partida"_ |
| **Justificación** | Un "jefe de partida" (o chef de partida / chef de garde) supervisa una sección concreta de la cocina y dirige a los ayudantes de esa línea de producción. CNO-11 9310 "Ayudantes de cocina" es el código CNO para trabajadores de apoyo en cocina, nivel CNO 9. La relación es parcialmente correcta: el título HOT04S forma a profesionales que pueden ejercer como supervisores de partida, lo que va más allá de un simple "ayudante", pero no existe en el catálogo curado una entrada CNO explícita para "chef de partida" o "supervisor de cocina". |
| **Nivel de confianza** | **MEDIA-BAJA** (coincidencia temática pero divergencia jerárquica) |
| **Observación crítica** | Este es un mapping de conveniencia en ausencia de un código "supervisor de cocina" o "chef de partida" en el catálogo curado. |

---

## 3. Salidas rechazadas o sin correspondencia

### 3.1 Director de alimentos y bebidas

| Campo | Valor |
|---|---|
| **Salida HOT04S** | Director de alimentos y bebidas |
| **Estado** | **SIN CORRESPONDENCIA** |
| **Justificación del rechazo** | No existe en el catálogo curado ningún código CNO-11 relacionado con gestión de alimentos y bebidas (F&B), director de sala, maitre, sommelier, director de banquete o gestión restauración integral. El catálogo no contiene entradas del ámbito F&B ni gestión de restaurantes. Un código cercano como `occupation:cno11:5300` ("Comerciantes propietarios de tiendas") o `occupation:cno11:1432` ("Directores y gerentes de empresas de comercio al por menor") no refleja con precisión el rol de director de alimentos y bebidas en hostelería. |

### 3.2 Jefe de operaciones de catering

| Campo | Valor |
|---|---|
| **Salida HOT04S** | Jefe de operaciones de catering |
| **Estado** | **SIN CORRESPONDENCIA** |
| **Justificación del rechazo** | No se localiza en el catálogo curado código alguno dedicado a catering o producción alimentaria a gran escala. Los códigos de cocina existentes (3734, 5110, 9310) se centran en restauración de hostelería (restaurante), no en catering externalizado. |

### 3.3 Encargado de economato y bodega

| Campo | Valor |
|---|---|
| **Salida HOT04S** | Encargado de economato y bodega |
| **Estado** | **SIN CORRESPONDENCIA** |
| **Justificación del rechazo** | Esta salida hace referencia a funciones de control de inventarios de alimentación, gestión de materia prima, control de costes de materia prima y gestión de bodega (bebidas). El único código aproximado en el catálogo es `occupation:cno11:4121` ("Empleados de control de abastecimientos e inventario"), pero se refiere a gestión genérica de inventario, no específicamente a economato de hostelería/bodega. `occupation:cno11:5210` ("Jefes de sección de tiendas y almacenes") tampoco se ajusta al ámbito restauración. No hay evidencia suficiente para afirmar una correspondencia directa. |

### 3.4 Jefe de producción en cocina

| Campo | Valor |
|---|---|
| **Salida HOT04S** | Jefe de producción en cocina |
| **Estado** | **SIN CORRESPONDENCIA CERTA** (se superpone parcialmente con 3734) |
| **Justificación** | Un "jefe de producción en cocina" es una variante del rol de dirección de cocina orientada a cocina de gran volumen (hospitales, residencias). Podría encuadrarse bajo 3734 "Chefs", ya que se trata de un chef que gestiona la producción. Sin embargo, al no existir una entrada separada en el catálogo para este sub-rol, y dado que HOT04S lo lista como salida distinta de "jefe de cocina", se marca como sin correspondencia certera para evitar falsos positivos. |

---

## 4. Resumen

| # | Salida HOT04S | CNO-11 Code | Occupation ID | Confianza |
|---|---|---|---|---|
| 1 | Jefe de cocina / Director de cocina | 3734 | `occupation:cno11:3734` `Chefs` | ⭐⭐⭐ Alta (ver nota 3734 rechazado) |
| 2 | Cocinero | 5110 | `occupation:cno11:5110` `Cocineros asalariados` | ⭐⭐⭐ Alta |
| 3 | Jefe de partida | 9310 | `occupation:cno11:9310` `Ayudantes de cocina` | ⭐☆ Baja-Media (superposición) |
| 4 | Director de alimentos y bebidas | — | Sin correspondencia | — |
| 5 | Jefe de operaciones de catering | — | Sin correspondencia | — |
| 6 | Encargado de economato y bodega | — | Sin correspondencia | — |
| 7 | Jefe de producción en cocina | — | Sin correspondencia certera (parcial overlap 3734) | — |

**Observaciones globales:**

- El catálogo curado contiene apenas 3 códigos de cocina (3734, 5110, 9310) de los ~110 entries totales, lo que indica una cobertura muy baja del ámbito hospitalidad/restauración.
- El código 3734 "Chefs" tiene `reviewStatus: "rejected"` en el catálogo; su uso como correspondencia debe validarse antes de consolidar el mapeo.
- Las salidas de gestión de F&B, catering y economato/bodega no tienen código CNO-11 equivalente en el catálogo actual.
- No se han modificado `data/curated/occupations.json` ni ningún otro archivo de datos ni código.