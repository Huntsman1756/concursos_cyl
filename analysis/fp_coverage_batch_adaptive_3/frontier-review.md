# Frontier review — adaptive batch 3

Review date: 2026-08-13

NAN proposals are candidate-generation evidence only. Frontier checked every
candidate against the TodoFP output retained in the batch source and against an
approved entry in `data/curated/occupations.json`. Sector, adjacent tasks,
hierarchical similarity and residual categories are insufficient by themselves.

## Accepted for incorporation

| Program  | CNO-11 | Curated occupation                                                               | Evidence boundary                                                                                                  |
| -------- | -----: | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ELE02S` |   7533 | Instaladores y reparadores en tecnologías de la información y las comunicaciones | TodoFP explicitly lists installation and maintenance of telecommunications systems.                                |
| `ELE02S` |   3811 | Técnicos en operaciones de sistemas informáticos                                 | Limited to TodoFP's integration, installation and maintenance of computer systems.                                 |
| `ELE02S` |   3813 | Técnicos en redes                                                                | TodoFP explicitly lists local networks and telematic systems.                                                      |
| `ELE02S` |   3124 | Técnicos en electrónica (excepto electromedicina)                                | Limited to supervision and control of broadcasting, radio-link, security-electronics and audiovisual equipment.    |
| `IMP01S` |   5812 | Especialistas en tratamientos de estética, bienestar y afines                    | TodoFP lists esthetic treatment work and its named techniques directly.                                            |
| `IMP01S` |   2640 | Profesionales de ventas técnicas y médicas (excepto las TIC)                     | Limited to the explicitly listed technical-commercial role; it does not cover treatment work or center management. |
| `HOT02M` |   5120 | Camareros asalariados                                                            | TodoFP explicitly lists bar, café and restaurant waiter work.                                                      |
| `HOT02M` |   4121 | Empleados de control de abastecimientos e inventario                             | Limited to the explicitly listed food-and-beverage storeroom role.                                                 |
| `MAM01B` |   7812 | Ajustadores y operadores de máquinas para trabajar la madera                     | TodoFP explicitly lists operators of fixed woodworking machines, presses and finishing lines.                      |
| `MAM01B` |   9700 | Peones de las industrias manufactureras                                          | TodoFP explicitly lists a wood and cork industry labourer.                                                         |
| `MAM01B` |   8209 | Montadores y ensambladores no clasificados en otros epígrafes                    | Limited to the explicitly listed assembly of wooden furniture, joinery and packaging products.                     |
| `COM03S` |   3510 | Agentes y representantes comerciales                                             | TodoFP explicitly lists both commercial agent and commercial representative.                                       |
| `COM03S` |   5210 | Jefes de sección de tiendas y almacenes                                          | Limited to TodoFP's shop-section manager output; it does not cover general store management.                       |

## Rejected or unresolved

- `EOC01S`: the direct occupation is CNO-11 3122, delineantes, which is absent
  from the curated catalog. Residual engineering-technician codes do not replace
  it.
- `INA01M`: the catalog lacks the specific bread, pastry and confectionery
  occupations. Cooks and kitchen assistants are different occupations.
- `SAN32`: dietetics, nutrition and food-hygiene occupations are absent. Health
  care, social education, generic quality control and residual care codes are
  not substitutes.
- `ELE02S`: project assistance and telecommunications work-site management have
  no direct approved match. User support and system administration describe
  different functions or levels.
- `IMP01S`: management of esthetic centers is not retail management. CNO 2640 is
  not evidence for performing esthetic treatments.
- `HOT02M`: sommelier assistance, transport service assistance and head-waiter
  hierarchy lack direct entries. CNO 4121 is accepted only for the storeroom
  output, not restaurant work generally.
- `MAM01B`: parquet sanding/varnishing is not evidence of parquet installation;
  manual packaging alone does not add another program relationship to 9700.
  Furniture upholstery and specialist finishing remain catalog gaps.
- `COM03S`: commercial coordination, full-store management, sales management,
  space design, window dressing, promotion responsibility and telemarketing
  supervision must not be collapsed into worker-level or adjacent occupations.

The accepted set contains 13 distinct program–occupation relationships across
five programs. Three programs remain pending because the required exact CNO-11
occupation is not yet curated.
