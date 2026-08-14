# Propuesta INA01M: Matchings directos CNO-11

**Fuente:** TodoFP ÔÇö _T├®cnico en Panader├¡a, Reposter├¡a y Confiter├¡a_  
**URL:** https://www.todofp.es/que-estudiar/familias-profesionales/industrias-alimentarias/panaderia-reposteria-confiteria.html  
**Data:** `data/curated/occupations.json` ÔÇö filtrado `reviewStatus == "approved"`

---

## Salidas TodoFP (fuente oficial)

1. Churrera / churrero
2. Confitera / confitero
3. Elaborador / elaboradora de boller├¡a, masas y bases de pizza
4. Elaborador / elaboradora de caramelos y dulces y de productos de cacao y chocolate
5. Elaborador / elaboradora y decorador / decoradora de pasteles
6. Galletera / galletero
7. Panadera / panadero
8. Pastelera / pastelero
9. Repostera / repostero
10. Turronera / turronero

---

## Resultado: sin coincidencia directa en CNO-11 approved

**Filtro aplicado:** `reviewStatus == "approved"` sobre `data/curated/occupations.json` (95 ocupaciones approved out of 68 entries revisados).

**An├ílisis:**  
Ninguna ocupaci├│n del cat├ílogo CNO-11 approved (`preferredLabel`) contiene un t├®rmino expl├¡cito de panader├¡a, reposter├¡a, confiter├¡a, churrer├¡a, boller├¡a, galleter├¡a o turroner├¡a. No existe matching directo.

### Ocupaciones CNO-11 approved excluidas (sin cobro literal)

| occupationId            | preferredLabel        | Causa de exclusi├│n                                                                         |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `occupation:cno11:3734` | Chefs                 | `reviewStatus: rejected` (no approved)                                                      |
| `occupation:cno11:5110` | Cocineros asalariados | No implica labor de panader├¡a/reposter├¡a; no hay superposici├│n literal de etiquetas      |
| `occupation:cno11:9310` | Ayudantes de cocina   | No clasifica funciones de panader├¡a/reposter├¡a/confiter├¡a; no hay superposici├│n literal |

> La **similitud de industria** (agroalimentaria / hosteler├¡a) no se usa como evidencia de match.

---

## Conclusi├│n

- **Occupations propuestas:** 0 (ninguna ocupaci├│n del cat├ílogo approved cubre directamente las salidas de panader├¡a/reposter├¡a/confiter├¡a).
- **Bloqueo:** Las salidas espec├¡ficas de TodoFP (churrera, confitera, pastelera, panadera, reposter├¡a, turroneraÔÇª) no tienen un `preferredLabel` equivalente en el cat├ílogo CNO-11 approved.
- **Recomendaci├│n:** Se requiere agregar al cat├ílogo aprobaciones para oficios de panader├¡a/reposter├¡a/confiter├¡a antes de que haya cobertura.

---

_Informe generado mec├ínicamente a partir de INA01M.txt y `data/curated/occupations.json` (filtrado approved). Sin inferencia de similitud de industria._
