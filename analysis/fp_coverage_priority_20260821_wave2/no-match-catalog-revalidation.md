# Frontier revalidation of prior no-match outcomes

**Reviewed:** 2026-08-21  
**Trigger:** the approved occupation catalog added CNO-11 `3141`, `3316`,
`3317`, `5931`, `5932`, `5993`, and `7403`.  
**Catalog SHA-256:**
`d4e9a93f270dba6dd8507762bdc5161978317d75e19fe7f2c0bf0a5ec72e5b95`

The sixteen earlier `reviewed-no-publishable-match` decisions were checked
against every newly approved identity before carrying their catalog hash
forward. The review uses the existing TodoFP source/proposal paths recorded in
`analysis/fp_coverage_research_outcomes.json` and the CNO identity evidence in
this wave's `frontier-review.md`.

## Decision

`AGA01S` is no longer a no-match outcome. Its TodoFP output **“Agente forestal
o similar.”** directly supports `AGA01S|5993` (**Agentes forestales y
medioambientales**) as an `official_output`. The outcome must be removed and
the relation published.

The other fifteen outcomes remain no-match after explicit comparison:

| Base | Official scope previously reviewed | Newly added codes checked | Result |
| --- | --- | --- | --- |
| `SAN06S` | Higiene bucodental | `3141`, `3316`, `3317`, `5931`, `5932`, `5993`, `7403` | Dental-prosthesis and audioprosthesis technicians are not dental hygienists; the other five codes are unrelated. |
| `COM01S` | Marketing y Publicidad | all seven | None describes marketing, advertising, content or campaign work. |
| `SAN01M` | Emergencias Sanitarias | all seven | Firefighters and forest-fire roles are not emergency medical technicians or patient transport. |
| `SAN32` | Dietética | all seven | None describes dietetics, nutrition, food hygiene or health education. |
| `EOC01S` | Proyectos de Edificación | all seven | None describes building drafting, BIM, cost control or technical project documentation. |
| `INA01M` | Panadería, Repostería y Confitería | all seven | None describes bakery, pastry or confectionery production. |
| `IMS01M` | Vídeo Disc-jockey y Sonido | all seven | None describes sound, microphone, DJ/VJ, lighting or retouching work. |
| `HOT01E` | Panadería y bollería artesanales | all seven | None describes artisanal bakery, dough, pastry or sensory-tasting work. |
| `IFC01E` | Ciberseguridad TI | all seven | None describes cybersecurity audit, consulting, analysis or testing. |
| `IMS02S` | Realización audiovisual y espectáculos | all seven | None describes audiovisual direction, production or stage management. |
| `MSP34` | Prevención de Riesgos Profesionales | all seven | Fire response is not occupational-risk prevention or preventive coordination; the remaining codes are unrelated. |
| `IMS05S` | Iluminación, Captación y tratamiento de Imagen | all seven | None describes camera, photographic capture, lighting or image treatment. |
| `TCP01M` | Confección y Moda | all seven | None describes tailoring, cutting, sewing or fashion production. |
| `ELE05E` | Robótica Colaborativa | all seven | Machinery mechanics do not describe robotics programming, integration or supervision; the other codes are unrelated. |
| `IMS03S` | Producción de Audiovisuales y Espectáculos | all seven | None describes audiovisual/event production; adjacent direction or technical codes remain excluded. |

## Boundary

- Publish only `AGA01S|5993` from this revalidation.
- Do not create an alias or broaden offer matching.
- Preserve the original review dates on the fifteen unchanged outcomes; this
  document records only compatibility with the expanded catalog.
- Regenerate the queue, immutable snapshot, freeze and rendered documents so
  the public counts reflect 15 no-match bases rather than silently preserving
  16.
