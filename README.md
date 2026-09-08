# SALIDA CyL

**Explora qué ocupaciones están relacionadas con una FP, dónde estudiarla y qué ofertas se conectan mediante evidencia revisada.**

SALIDA CyL es una aplicación independiente con código bajo licencia MIT para personas que están eligiendo formación profesional, buscando empleo o acompañando decisiones de orientación en Castilla y León.

[Abrir la aplicación](https://salida-cyl.157-90-22-40.sslip.io/) · [Respaldo alternativo](https://huntsman1756.github.io/concursos_cyl/) · [Memoria de candidatura](docs/contest/jury-memo.md) · [Metodología](https://salida-cyl.157-90-22-40.sslip.io/metodologia) · [Datos abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos)

## Qué puedes hacer

- **Partir de una FP:** consultar ocupaciones relacionadas, ofertas de una instantánea fechada y centros donde se imparte.
- **Partir de una profesión o una oferta:** explorar las formaciones relacionadas y consultar la fuente que justifica cada vínculo.
- **Comparar estudios:** consultar referencias oficiales de ingresos de titulados, manteniendo separados sus ámbitos estadísticos. No son salarios prometidos ni predicciones individuales.

Por ejemplo, la ficha de [Cuidados Auxiliares de Enfermería](https://salida-cyl.157-90-22-40.sslip.io/desde-fp/SAN21) permite pasar de la formación a sus relaciones ocupacionales y contrastarlas con las fuentes. La decisión final de matrícula o solicitud se realiza en los canales oficiales correspondientes.

## Alcance y límites

El catálogo contiene **187 claves de programa, incluidas modalidades**. **130 tienen al menos una relación ocupacional aprobada (69,5 %)** y corresponden a **113 cualificaciones distintas**. El grafo publica 264 relaciones revisadas.

**128 de las 1.032 ofertas de la instantánea (12,4 %) tienen una relación FP revisada.** Son ofertas distintas, no número de vínculos ni porcentaje de todo el mercado laboral. Una formación sin oferta relacionada no significa que carezca de oportunidades.

Las ocho fuentes JCyL se descargaron el **8 de septiembre de 2026**; las fechas de publicación de las ofertas llegan hasta el **4 de septiembre**. El recurso derivado de evidencia se generó el **8 de septiembre**. Las revisiones TodoFP, SEPE y EDUCAbase conservan sus propias fechas y no se presentan como actualizadas por esta descarga. Regenerar ese recurso no actualiza las fuentes. La vigencia de cada oferta debe comprobarse en su enlace oficial. Véase la [revisión de fuentes y despliegue](docs/contest/verification-20260908.md).

Solo se publican relaciones justificadas por fuentes identificadas. No se completan vacíos por semejanza textual ni se afirman equivalencias profesionales, empleabilidad o impacto social medido.

## Datos públicos reutilizados

Integra ocho conjuntos del Portal de Datos Abiertos de la Junta:

| Conjunto                               | Utilidad                             |
| -------------------------------------- | ------------------------------------ |
| Oferta de formación profesional        | Estudios, modalidades y centros      |
| Ofertas de empleo                      | Ofertas en una instantánea fechada   |
| Formación del ECYL                     | Opciones de formación complementaria |
| Certificados de profesionalidad        | Contexto de cualificaciones          |
| Convocatorias de empleo público        | Acceso a convocatorias y sus fuentes |
| Contratos realizados en las provincias | Contexto territorial agregado        |
| Registro de municipios                 | Referencias territoriales            |
| Directorio de centros docentes         | Información de centros               |

Se combinan con CNO-11, TodoFP, SEPE y EDUCAbase. El [inventario de fuentes](docs/contest/source-ledger.md) explica su función y sus condiciones. El grafo FP–ocupación se ofrece en JSON y CSV con fuente por relación, licencia e integridad verificable.

## Candidatura y estado público

Categoría **Productos y Servicios** del [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html). La [comprobación de las bases](docs/contest/rules-2026.md) recoge fuentes oficiales, criterios y el límite de 1.000 palabras de la memoria.

El estado público observado y las limitaciones de verificación están en [verification-20260908.md](docs/contest/verification-20260908.md). Los registros de releases anteriores son evidencia histórica, no una garantía del estado actual. El estado del respaldo GitHub Pages se registra por separado en ese informe. El repositorio y el canal de incidencias son públicos, verificados sin autenticación el 8 de septiembre. La memoria también se ofrece en la propia aplicación.

## Desarrollo y calidad

Requiere Node.js 24.

```sh
npm ci
npm run dev
```

Comprobaciones del proyecto:

```sh
npm run license:check
npm run lint
npm test
npm run build
npm run test:e2e
npm run contest:submission:check
```

Las pruebas cubren lógica de datos, interfaz, recorridos y comprobaciones automatizadas de accesibilidad. Su resultado corresponde al árbol y fecha de ejecución registrados; no acredita por sí solo conformidad completa de accesibilidad. La aplicación no requiere cuentas, cookies ni analítica. Los términos presentes en la URL pueden permanecer en el historial del navegador.

Los datos se reconstruyen mediante `npm run data:build`, con revisión previa a su publicación. El [procedimiento de despliegue](docs/deployment.md) describe VPS, respaldo y verificación de versión.

Código bajo licencia MIT. Los datos conservan las condiciones de cada editor: [DATA_LICENSE.md](DATA_LICENSE.md).

La versión VPS publicada es `v2026.09.08-candidate.17`. [Memoria PDF](https://salida-cyl.157-90-22-40.sslip.io/candidatura.pdf) · [Demo guiada de dos minutos](docs/contest/evidence/demo-20260908.webm).

La [operativa](docs/operations.md) recoge mantenimiento, recuperación y comprobaciones públicas. La [preparación del piloto](docs/pilot/readiness.md) distingue la versión técnica preparada de las observaciones humanas aún no realizadas.
