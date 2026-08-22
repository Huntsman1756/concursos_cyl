# Frontier revalidation of prior no-match outcomes — wave 3

**Reviewed:** 2026-08-22  
**Previous curated occupation SHA-256:** `aef572d36bbb84b2eb5e426103c78e2241856f5b492770390f8c7240b2a0bb61`  
**New curated occupation SHA-256:** `0c3224887ccb75806a32186e671e8e1ea670e84e17b85b42e105f19e88751cef`

The eight new approved CNO identities (`2482`, `2484`, `2729`, `3831`, `7191`,
`7211`, `7231`, and `9602`) were checked against all existing
`reviewed-no-publishable-match` outcomes before carrying their state forward.
The outcome records keep their original review dates, source paths, proposal
paths, and review status; only their catalog hash is updated.

## IMS03S remains the single no-match

`IMS03S` describes audiovisual production, production assistance, company
management, and live-event production. The new `3831` identity is specifically
for audiovisual recording technicians and is used for `IMS04S`'s exact sound
recording output. It does not establish a production or event-management role
for `IMS03S`. The other seven new identities are unrelated. Therefore IMS03S
remains exactly one `reviewed-no-publishable-match` outcome; no duplicate or
new outcome is created.

## Fifteen preserved no-match outcomes

| Base program | Decision after comparison with all eight new codes                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SAN06S`     | Dental-hygiene work is not product/prenda design, multimedia design, database/network specialism, recording, building maintenance, construction finishing, or construction peonage. |
| `COM01S`     | Marketing and advertising remain distinct from the new technical, construction, design, and recording boundaries; its existing no-match decision stands.                            |
| `SAN01M`     | Emergency medical coordination and transport are not any of the eight new identities.                                                                                               |
| `SAN32`      | Dietetics and nutrition remain unrelated to all eight additions.                                                                                                                    |
| `EOC01S`     | Building-project drafting and BIM remain distinct from the reviewed maintenance/finishing outputs published for EOC01B/EOC02M.                                                      |
| `INA01M`     | Bakery, pastry, and confectionery work remain unrelated.                                                                                                                            |
| `IMS01M`     | Sound production and DJ/VJ work are not established by the new recording, design, or construction identities.                                                                       |
| `HOT01E`     | Artisanal bakery and sensory-tasting work remain unrelated.                                                                                                                         |
| `IFC01E`     | Cybersecurity audit, consulting, analysis, and testing remain without a publishable approved CNO identity; generic systems/network codes are not substituted.                       |
| `IMS02S`     | Audiovisual direction, production, and stage management remain distinct from IMS04S sound recording and IMS01S multimedia outputs.                                                  |
| `MSP34`      | Occupational-risk prevention and safety coordination remain unrelated.                                                                                                              |
| `IMS05S`     | Camera capture and image treatment remain distinct from multimedia design and sound recording.                                                                                      |
| `TCP01M`     | Tailoring, cutting, sewing, and fashion production remain unrelated.                                                                                                                |
| `ELE05E`     | Collaborative-robotics programming and integration remain unrelated to the new CNO identities.                                                                                      |
| `IMS03S`     | Audiovisual/event production remains distinct from CNO 3831 sound recording; the single no-match is preserved.                                                                      |

`IFC03E` is not one of these outcomes. It remains pending in the regenerated
research queue because the current outcome schema has no `insufficient` state;
it is not forced into `reviewed-no-publishable-match`.
