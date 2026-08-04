# Alternativa ciudadana de baja preparación — 2026

Fecha de contraste: 3 de agosto de 2026.

## Veredicto

**PASS CONDICIONAL: HORAS A FAVOR.**

La aplicación responde una pregunta concreta:

> Con los módulos que ya tengo superados o acreditados, ¿qué certificado profesional puedo terminar con menos formación nueva?

SIETE se conserva como reserva. HORAS A FAVOR exige mucha menos preparación: el núcleo se genera automáticamente a partir del JSON de JCyL y dos catálogos nacionales en PDF con texto nativo. No requiere revisar manualmente cientos de celdas.

## Operación ciudadana

1. La persona selecciona los códigos de los módulos que ya ha superado o acreditado.
2. La aplicación cruza esos códigos con todos los certificados del conjunto abierto de JCyL.
3. Ordena los destinos por horas con coincidencia exacta y horas pendientes.
4. Separa siempre la formación práctica y cualquier módulo que requiera una decisión distinta.
5. Genera una hoja de contraste con códigos, horas y enlaces oficiales para llevarla al centro o a la Administración.

No afirmará «te lo convalidarán». La salida será «coincidencia exacta por código» o «horas potencialmente reconocibles». El artículo 127 del Real Decreto 659/2023 atribuye la resolución al centro o a la Administración tras la matrícula o inscripción.

## Evidencia de datos y masa útil

Fuente autonómica: <https://analisis.datosabiertos.jcyl.es/explore/dataset/certificados-profesionalidad/?flg=es-es>

- 583 certificados de JCyL.
- 1.905 códigos de módulos formativos `MF` distintos.
- 1.905/1.905 módulos obtuvieron automáticamente una duración desde el repertorio oficial de TodoFP.
- No apareció ningún conflicto de horas para un mismo código.
- 365 certificados comparten al menos un módulo con otro certificado.
- 1.058 pares de certificados tienen alguna coincidencia.
- 498 pares, que cubren 289 certificados, comparten al menos 80 horas.
- 210 pares, que cubren 177 certificados, comparten al menos 150 horas.
- 17 pares, que cubren 30 certificados, comparten al menos 300 horas.

Control de vigencia: 582 de los 583 códigos JCyL aparecen literalmente en el Catálogo Nacional de Grados C publicado por TodoFP; el restante, `AGAO0308M`, aparece al normalizar el sufijo autonómico a `AGAO0308`. El producto debe mostrar versión del catálogo y limitar claramente su cobertura, porque el conjunto autonómico no incorpora necesariamente todas las altas nacionales posteriores.

## Caso demostrable

Una persona con módulos de `ADGD0308 — Actividades de gestión administrativa` que valore `ADGG0208 — Actividades administrativas en la relación con el cliente` encuentra cuatro códigos idénticos:

- `MF0233`: 190 horas.
- `MF0973`: 90 horas.
- `MF0976`: 160 horas.
- `MF0978`: 60 horas.

Resultado: **500 horas coincidentes**. Sobre las 680 horas de módulos formativos del destino quedan 180 horas no coincidentes; las prácticas se muestran aparte. Es una orientación documental, no una resolución de convalidación.

## Colisiones comprobadas

- **SoyFP**, aplicación oficial en Google Play, descubre y compara ofertas A–E, centros, duración, acceso y salidas. Su ficha no describe partir de módulos parciales ni calcular el camino de menor formación restante: <https://play.google.com/store/apps/details?id=es.gob.soyfp>
- **Link Formación** ofrece en web una orientación de convalidaciones entre certificados completos/Grados C y títulos de FP. Es una colisión temática importante: <https://linkformacion.com/convalidaciones/>.
- Las búsquedas realizadas en Google Play y App Store con «convalidaciones FP», «certificados profesionales», «acreditación competencias profesionales», «ruta formativa FP» y «módulos FP» no localizaron una aplicación con la operación exacta módulo parcial → ranking de certificados por horas restantes. Este resultado es una fotografía de la fecha de contraste, no una garantía permanente.

La diferenciación obligatoria es partir de **módulos individuales y aprendizaje incompleto**, buscar rutas entre Grados C, ordenar por horas restantes, funcionar sin cuenta ni cesión de datos y entregar evidencia oficial versionada. Si se reduce a buscador de cursos o convalidador FP↔certificado, debe descartarse.

## Riesgos y límites

- Alcance menos universal que SIETE, aunque incluye estudiantes, personas trabajadoras, desempleadas, quienes abandonaron una formación y quienes acreditaron competencias por experiencia.
- Utilidad de alta intensidad pero baja frecuencia: se usa en una decisión formativa, no cada semana.
- La coincidencia de código no sustituye la comprobación del expediente ni la resolución oficial.
- La preparación debe incluir un control automático de cambios del catálogo y de sustituciones normativas.
- Las ofertas vigentes de ECYL pueden enlazarse como complemento, pero no deben ser el núcleo porque su cobertura y estado de matrícula no son suficientemente uniformes.

## Gate antes de desarrollar

**GO** si una prueba desechable permite introducir módulos parciales, obtiene correctamente el ranking, distingue prácticas y exporta el expediente de contraste en al menos 20 casos de varias familias profesionales.

**NO-GO** si para completar el catálogo hay que mantener equivalencias manuales, si la interfaz acaba pidiendo un certificado completo como punto de partida o si se presenta el resultado como convalidación garantizada.

## Comparación con SIETE

| Criterio | SIETE | HORAS A FAVOR |
|---|---:|---:|
| Utilidad potencial | Más amplia | Más especializada, pero ahorro alto |
| Preparación manual | Alta: unas 200 celdas a verificar | Baja: extracción y controles automáticos |
| Frecuencia | Estacional | Ocasional |
| Valor por decisión | Alto | Muy alto: decenas o cientos de horas |
| Riesgo jurídico | Bajo con simulación clara | Controlable con lenguaje orientativo |
| Colisión | Oferta escolar existente, optimización diferencial | SoyFP y Link; exige diferenciarse por módulos parciales |
| Estado | Reserva | Superviviente condicional |

## Fuentes oficiales principales

- JCyL, Certificados de profesionalidad: <https://analisis.datosabiertos.jcyl.es/explore/dataset/certificados-profesionalidad/?flg=es-es>
- TodoFP, información de Grados C: <https://www.todofp.es/que-estudiar/grados-c.html>
- TodoFP, repertorio oficial usado para extraer módulos y horas: <https://www.todofp.es/dam/jcr:8f2a81fd-baa8-4e46-b4c5-e92c08103c4f/repertoriocertificadoprofesionales.pdf>
- TodoFP, Catálogo Nacional de Grados C usado como control de vigencia: <https://www.todofp.es/dam/jcr:8b85fd78-c6d5-406f-ade8-891abd96613f/catalogo-grados-c.pdf>
- BOE, Real Decreto 659/2023, especialmente artículos 67, 81 y 127: <https://www.boe.es/eli/es/rd/2023/07/18/659/con>

