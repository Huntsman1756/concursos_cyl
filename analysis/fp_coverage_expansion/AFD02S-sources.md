# AFD02S/AFD02SD occupation boundary review

Slot: `AFD02S` — Técnico Superior en Acondicionamiento Físico.

## BOE authoritative output inventory

Source: https://www.boe.es/boe/dias/2017/07/08/pdfs/BOE-A-2017-7981.pdf

RD 651/2017, Article 7. PDF pages 5-6.

SHA-256: 51C85C1DC8B8CC63D3C9557D1973B41CBDB8499C99A6D560A03A91C601BA0FA

## INE CNO-11 boundaries

Source: https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf

PDF page 172.

SHA-256: 24DC15F91F5F5A8EA04F41017250E508E9681F794E3451903EEB52D20F1592C4

INE CNO-11 page 172 lists CNO 3723 "Entrenadores personal, gimnasios" as an explicit example occupation, directly supporting the BOE output "Entrenador/a personal."

## Accepted table

| BOE output             | CNO-11 code           | Evidence classification                                                                                           | Page |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- | ---- |
| Entrenador/a personal. | occupation:cno11:3723 | Direct: INE CNO-11 page 172 explicitly lists "Entrenadores personal, gimnasios" as a CNO 3723 example occupation. | 172  |

## Deferred outputs

| BOE output                                                                                                                                     | Disposition | Boundary reason                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Animador de actividades de acondicionamiento físico.                                                                                           | Deferred    | CNO 3724 covers leisure and entertainment animators; the AFD02S physical conditioning context does not justify this broader leisure identity.                                        |
| Coordinador/a de actividades de acondicionamiento físico y de hidrocinesia.                                                                    | Deferred    | No CNO heading independently covers coordination of physical conditioning and water-based activity; the reviewed notes do not establish a distinct four-digit boundary.              |
| Entrenador/a de acondicionamiento físico en las salas de entrenamiento polivalente de gimnasios o polideportivos y en instalaciones acuáticas. | Deferred    | Could relate to 3723 but does not add a distinct relationship identity beyond the accepted "Entrenador/a personal." output; CNO 3722 covers competitive sport, not gym conditioning. |
| Entrenador/a de acondicionamiento físico para grupos con soporte musical en gimnasios, instalaciones acuáticas o en polideportivos.            | Deferred    | Could relate to 3723 but does not add a distinct relationship identity; the group/music dimension does not establish a separate CNO boundary.                                        |
| Instructor/a de las actividades de acondicionamiento físico para colectivos especiales.                                                        | Deferred    | Its instructional function is compatible with 3723, but it does not add a distinct relationship identity beyond the accepted mapping.                                                |
| Instructor/a de grupos de hidrocinesia y cuidado corporal.                                                                                     | Deferred    | Its instructional function is compatible with 3723, but the reviewed notes do not establish a different four-digit boundary.                                                         |
| Monitor/a de aeróbic, de step, de ciclo indoor, de fitness acuático y actividades afines.                                                      | Deferred    | INE lists "Instructores de aeróbic" under 3723; this output supports the same accepted relationship and does not add a distinct identity.                                            |
| Promotor/a de actividades de acondicionamiento físico.                                                                                         | Deferred    | No CNO heading covers physical conditioning promotion as a distinct occupation; the reviewed notes do not establish a distinct four-digit boundary for promotional activity.         |

## Boundary analysis: CNO 3722 and CNO 3724

CNO 3722 covers coaches and referees who work with amateur or professional athletes on performance, competitions and matches. The AFD02S programme trains physical conditioning specialists for gym and fitness contexts. None of the nine BOE outputs justify mapping to the competitive-sport boundary of 3722.

CNO 3724 covers leisure and entertainment animators (animadores de ocio y entretenimiento). While some BOE outputs use the word "animador" or "monitor", the AFD02S programme context is specifically physical conditioning (acondicionamiento físico), not entertainment or leisure activity. The reviewed CNO-11 notes do not support extending 3724 to gym-based physical conditioning outputs.

## Summary

Nine BOE outputs were reviewed. The sole accepted CNO relationship is `occupation:cno11:3723` for the BOE output "Entrenador/a personal.", supported by the INE CNO-11 example "Entrenadores personal, gimnasios" on page 172. The remaining eight BOE outputs are deferred from additional publication because they do not justify a different CNO or add a distinct relationship identity beyond the accepted 3723 mapping. The conservative boundary preserves the distinction between gym-based personal training (3723), competitive sport (3722), and leisure entertainment (3724).
