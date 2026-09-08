# Protocolo canónico de piloto humano anónimo V2

Versión del protocolo: `2.0.0`  
Versión del catálogo de tareas: `2.0.0`  
Estado actual: `HUMAN_PILOT_NOT_RUN`

Producto que se probará antes de la primera sesión:

- URL pública: `https://huntsman1756.github.io/concursos_cyl/`
- SHA desplegado: `886bbf433df7db1e99acf78786286ceee8bc1a06`
- Snapshot activo: `20260830120000000-8c6c79fbd2a1`

No se inicia ninguna sesión hasta que el protocolo V2 esté fusionado y la URL
pública confirme exactamente ese SHA. Si el producto publicado cambia, se
detiene la preparación y se revisa de nuevo la identidad del release.

## Propósito y límites de interpretación

El piloto aporta evidencia exploratoria de usabilidad y comprensión. No es
validación estadística, prueba de adopción, prueba de impacto, prueba de
resultados de empleo ni investigación de mercado representativa de Castilla y
León.

Las preguntas primarias son:

1. ¿Puede una persona entender la relación FP → ocupación?
2. ¿Puede entender ocupación → FP sin leer causalidad o equivalencia?
3. ¿Puede partir de una oferta real e identificar lo que la oferta publica
   como requisito?
4. ¿Puede distinguir evidencia, incertidumbre y límites?
5. ¿Puede encontrar la fuente oficial y entender las limitaciones de la
   instantánea?

## Participantes

Se mantiene el objetivo exploratorio de un mínimo de `5` sesiones analizables
y un rango preferido de `5–10`. Todas las personas deben ser adultas y
confirmarlo verbalmente antes de comenzar.

El agregado debe incluir, como mínimo, una persona que se acerque al producto
como aprendiz o persona que busca empleo (`learner`) y una que pueda abordarlo
desde orientación o asesoramiento (`counsellor`). Estos roles no hacen que la
muestra sea representativa y no se recoge la identidad profesional.

## Preparación y briefing del moderador

Antes de la primera sesión:

1. Verificar el SHA público indicado arriba y leer el [guion de tareas](./anonymous-task-script.md).
2. Abrir el producto en una ventana nueva o anónima, sin cuenta, cookies de
   piloto, analítica, historial conservado ni grabador.
3. Presentar la [plantilla de consentimiento](./anonymous-consent-template.md)
   sin pedir firma, contacto ni datos personales.
4. Confirmar verbalmente mayoría de edad, voluntariedad y consentimiento para
   las cinco tareas sin grabación.

Durante cada tarea, el moderador:

- no enseña la interfaz antes de la tarea;
- no indica la oferta, filtro, ruta, control ni CTA correctos;
- usa exactamente el mismo texto para todas las personas;
- no explica la semántica de SALIDA hasta que la persona complete o abandone;
- no improvisa pistas específicas ni convierte la tarea en una explicación;
- anota únicamente campos agregados y códigos cerrados.

Las cinco tareas se ejecutan en el orden del guion. Si se revela un dato
personal, se detiene la sesión, se descarta la nota local sin copiarla y se
informa del incidente al responsable del piloto.

## Privacidad estricta

No se registra nombre, correo, teléfono, dirección, empleador, centro,
localización identificable, CV, respuesta libre, cita, audio, vídeo,
grabación de pantalla, captura con información de la persona, cuenta ni
identificador de sesión. No se requieren analytics.

El consentimiento se mantiene fuera de Git según el modelo aprobado. No se
crea una fila por participante ni se guarda material individual en el
repositorio.

## Agregado permitido

El repositorio solo puede recibir un agregado de campos cerrados: intentos,
finalizaciones, bloqueos, abandonos, malinterpretaciones, bandas de tiempo,
roles agregados y códigos predefinidos de incidencia/acción. No se almacenan
notas de moderador, respuestas textuales ni citas.

Antes del piloto no se crea:

`analysis/pilot/anonymous/results-aggregate.json`

No se crean cinco sesiones ficticias para satisfacer un validador. Tras el
piloto, solo ese agregado puede proponerse para revisión.

## Taxonomía estable de incidencias

Cada incidencia usa un código cerrado, una tarea, una severidad y una acción.

| Código                                                 | Significado                                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `cannot_find_offer_first_entry`                        | No encuentra la entrada desde oferta.                                   |
| `cannot_distinguish_offer_title_requirement`           | Confunde el título de la oferta con un requisito publicado.             |
| `interprets_snapshot_as_currently_open_guarantee`      | Interpreta la instantánea como garantía de que la oferta sigue abierta. |
| `interprets_reviewed_fp_relationship_as_equivalence`   | Interpreta una relación FP revisada como equivalencia o derecho.        |
| `interprets_university_boundary_incorrectly`           | Interpreta incorrectamente el límite universitario/regulado.            |
| `interprets_certificate_alternative_as_fp_equivalence` | Interpreta una alternativa de certificado como equivalencia FP.         |
| `interprets_accreditation_as_confirmed_eligibility`    | Interpreta la consulta de acreditación como elegibilidad confirmada.    |
| `cannot_identify_next_official_action`                 | No identifica la siguiente acción oficial respaldada.                   |
| `cannot_find_original_source`                          | No encuentra la fuente original o pública.                              |
| `cannot_identify_uncertainty`                          | No identifica la incertidumbre o el límite mostrado.                    |

No se guarda prosa del participante para explicar una incidencia.

## Severidad y acción

- `P0`: seguridad, legalidad, privacidad o comportamiento fundamentalmente
  falso.
- `P1`: malentendido grave que afecta a la decisión central.
- `P2`: fricción material de usabilidad.
- `P3`: incidencia cosmética o menor.

Solo una incidencia P0/P1 reabre automáticamente la implementación antes de
la finalización. Una P2 recurrente puede justificar una corrección UX acotada
si su valor para el concurso y las personas usuarias está claro.

## Validación antes de cualquier sesión

Ejecutar:

```text
rtk npm run pilot:anonymous:test
rtk npm run pilot:anonymous:validate:not-run
```

Estas comprobaciones validan el esquema V2, los cinco IDs, los códigos
cerrados, las invariantes de conteo y el estado explícito
`HUMAN_PILOT_NOT_RUN`. No leen ni crean un agregado de resultados.

Después de las sesiones, el agregado real se valida, con sus aprobaciones,
mediante:

```text
rtk npm run pilot:anonymous:validate
```

## Checklist breve de cierre del moderador

- [ ] Se confirmó mayoría de edad y consentimiento antes de empezar.
- [ ] No hubo audio, vídeo, pantalla, capturas, cuentas ni analytics.
- [ ] Se usó el texto idéntico y el orden fijo de las cinco tareas.
- [ ] No se dieron pistas específicas ni se explicó SALIDA antes de tiempo.
- [ ] Solo se marcaron conteos y códigos cerrados.
- [ ] No se trasladó ningún dato personal, cita, respuesta ni nota libre a Git.
- [ ] Cada tarea tiene conteos coherentes y cada incidencia tiene código,
      severidad y acción.
- [ ] El agregado cumple el mínimo de cinco sesiones analizables y ambos roles
      antes de solicitar revisión humana y anti-PII.

## Condición de piloto completo

El piloto solo puede declararse completo con al menos cinco sesiones
analizables, al menos una persona de cada rol, consentimiento en todas las
sesiones, las cinco tareas contabilizadas y las revisiones humana y anti-PII
aprobadas con marca temporal. Un estado bloqueado requiere un código de
bloqueo.
