# Nuevas rutas de aplicación desde el corpus internacional

Fecha de corte: 2 de agosto de 2026.

## Corrección de enfoque

La vía didáctica queda excluida. También se descartan como núcleo del producto la predicción presentada en un panel, los mapas, los directorios, los chatbots, los buscadores de ayudas y cualquier MVP que necesite datos privados o un convenio.

La nueva pregunta no es “¿qué podemos predecir?”, sino:

> ¿Qué decisión completa puede reconstruir, comparar o documentar una aplicación utilizando exclusivamente evidencia pública?

## Ruta 1 — Proyecto Espejo Ambiental (recomendada)

### Aplicación

Una pyme, cooperativa, ayuntamiento o técnico describe un proyecto todavía configurable: sector, municipio, tamaño aproximado y dos o tres alternativas de diseño. La aplicación recupera expedientes ambientales comparables, analiza las resoluciones completas publicadas en BOCYL y genera un informe de precedentes y cuestiones críticas.

No decide si el proyecto será autorizado ni sustituye la evaluación ambiental. Permite decidir **qué alternativa merece desarrollarse y qué estudios o afecciones deben aclararse antes de gastar en el proyecto técnico completo**.

### Mecanismos del corpus

- Configuración → consecuencia → recomendación, como CEREAL.
- Priorización explicable de factores.
- Informe técnico descargable, como Astro Sweepers.
- Expediente público → evidencia auditable.

### Evidencia disponible

| Fuente | Registros comprobados | Contenido útil |
|---|---:|---|
| EIA ordinaria | 5.388 | Tipo, proyecto, municipio, provincia y publicación BOCYL |
| EIA simplificada | 1.318 | Mismos campos para el procedimiento simplificado |
| EAE simplificada | 1.457 | Planeamiento y actuaciones territoriales |
| EAE ordinaria | 118 | Evaluaciones estratégicas ordinarias |
| BOCYL | 63.186 | Título, organismo, fecha y resolución completa en XML/PDF |
| **Total de expedientes ambientales** | **8.281** | Cohorte histórica enlazable con su documento oficial |

Se comprobó manualmente el enlace para resoluciones recientes de plantas de biometano, explotaciones porcinas y residuos. El XML de una resolución real contiene más de 60.000 caracteres y secciones sobre afecciones, medidas protectoras y correctoras, vigilancia ambiental y condiciones de la declaración.

### Resultado principal

Un PDF reproducible con:

1. configuración introducida y supuestos;
2. expedientes realmente comparables y criterio de selección;
3. afecciones y condiciones recurrentes, con cita al BOCYL;
4. diferencias entre las alternativas A/B;
5. incógnitas que requieren estudio profesional;
6. trazabilidad completa de fuentes y fecha de consulta.

### Límites

- No predecir autorización ni calificar cumplimiento legal.
- No denominar “riesgo ambiental” a la mera frecuencia de una condición.
- La comparación debe separar tipo de procedimiento, época y sector.
- El municipio sirve para contextualizar y no convierte la aplicación en un mapa.

### Colisión histórica

No se encontró una candidatura anterior centrada en precedentes de evaluación ambiental y configuración previa de proyectos. La colisión temática es menor que en sanidad, movilidad, turismo, agricultura genérica o BOCYL.

## Ruta 2 — Norma con Huella

### Aplicación

Reconstruye el recorrido de una norma desde la consulta previa o participación ciudadana hasta su publicación definitiva. Compara los documentos de inicio y final, muestra qué cambió, cuánto tardó y qué participación pública consta, y genera un expediente descargable.

Para consultas todavía abiertas, la acción es participar antes del cierre con conocimiento del texto y de precedentes semejantes. Para consultas cerradas, la acción es verificar el resultado final.

### Mecanismos del corpus

- Expediente vivo, como Shipping Note.
- Verificación antes/después.
- Informe auditable y reproducible.

### Evidencia disponible

- 1.523 foros oficiales con identificador, título, enlace, tipo, fechas, propuestas, votos y comentarios.
- 63.186 publicaciones BOCYL con documentos XML/PDF.
- Los portales de participación conservan descripción y, cuando existe, documentación inicial descargable.
- Se verificaron enlaces reales:
  - consulta de marzo de 2024 sobre formación en bienestar animal → Orden AGR/85/2025;
  - consulta de mayo de 2024 sobre currículo DAM → Orden EDU/1310/2024;
  - propuesta de gestión del jabalí de 2023 → Orden MAV/534/2024.

### Riesgos

- No todas las consultas terminan en una publicación claramente enlazable.
- La comparación semántica de documentos debe mostrar pasajes originales, no resumirlos de forma opaca.
- Existe colisión parcial con “BOCYL Accesible” de 2025, aunque aquella propuesta buscaba hacer el boletín comprensible y esta reconstruye un ciclo normativo completo.

## Ruta 3 — Plan a Prueba

### Aplicación

Transforma un plan o programa público en una ficha verificable de objetivos, medios, calendario, evaluación y resultados. Detecta compromisos sin indicador, evaluaciones vencidas y campos de resultado ausentes; cuando exista correspondencia defendible, añade ejecución presupuestaria y subvenciones concedidas.

La salida no es un panel presupuestario, sino un informe de seguimiento que indica qué afirmaciones pueden comprobarse y cuáles todavía no.

### Evidencia disponible

- 254 planes y programas con 19 campos estructurados.
- 192 contienen objetivos; 120 medios; 141 evaluación; 90 resultados; 109 líneas de actuación.
- Solo 117 informan fecha final y 28 tienen finalización igual o posterior a la fecha de corte.
- 41.508 partidas de ejecución presupuestaria con crédito inicial/definitivo, autorizado, comprometido y obligado desde 2018.
- 364.704 concesiones de subvenciones.

### Riesgos

- No existen identificadores comunes entre planes, presupuesto y subvenciones.
- El enlace semántico podría ser insuficiente para una aplicación general.
- Colisión con la visualización presupuestaria presentada en 2025.
- Puede degenerar en un panel de transparencia si no mantiene el informe verificable como producto central.

## Comparación adversarial

| Criterio | Proyecto Espejo Ambiental | Norma con Huella | Plan a Prueba |
|---|---|---|---|
| Decisión concreta | Elegir alternativa y estudios previos | Participar o verificar resultado normativo | Elegir qué compromiso revisar |
| Dato abierto suficiente | **Alto** | Medio-alto | Medio |
| Producto descargable | **Informe de precedentes** | Expediente antes/después | Informe de cumplimiento observable |
| Dependencia externa | Ninguna para MVP | Ninguna; documentos públicos | Ninguna, pero enlaces débiles |
| Colisión histórica | **Baja** | Media | Media-alta |
| Riesgo principal | Parecer asesoría legal/técnica | Emparejamiento y colisión BOCYL | Convertirse en dashboard |
| Potencial competitivo | **Alto** | Alto si el emparejamiento funciona | Reserva |

## Recomendación

Desarrollar conceptualmente **Proyecto Espejo Ambiental**. Es la transferencia más completa del corpus:

`configuración → comparación con expedientes reales → consecuencias observadas → alternativa → informe auditable`

Antes de diseñar debe superar una prueba de concepto de datos en un solo sector —por ejemplo explotaciones ganaderas o plantas de biometano— con 30–50 resoluciones. La prueba debe medir si las condiciones pueden clasificarse y citarse con suficiente consistencia. Si falla, la siguiente ruta es Norma con Huella.

## Fuentes oficiales

- [EIA simplificada](https://analisis.datosabiertos.jcyl.es/explore/dataset/proyectos-eia-simplificada/)
- [EIA ordinaria](https://analisis.datosabiertos.jcyl.es/explore/dataset/proyectos-eia-ordinaria/)
- [Foros de participación ciudadana](https://analisis.datosabiertos.jcyl.es/explore/dataset/foros-de-participacion-ciudadana/)
- [Planes y programas](https://analisis.datosabiertos.jcyl.es/explore/dataset/planes-y-programas/)
- [Ejecución presupuestaria de gastos](https://analisis.datosabiertos.jcyl.es/explore/dataset/ejecucion-del-presupuesto-de-la-administracion-de-la-comunidad-gastos/)
- [BOCYL](https://analisis.datosabiertos.jcyl.es/explore/dataset/bocyl/)

