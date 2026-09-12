# SALIDA CyL

**Explora qué ocupaciones están relacionadas con una FP, dónde estudiarla y qué ofertas se conectan mediante evidencia revisada.**

Aplicación independiente y gratuita para personas que eligen formación profesional, buscan empleo o acompañan decisiones de orientación en Castilla y León. No requiere registro.

[Abrir la aplicación](https://salidacyl.es/) · [Memoria PDF de esta versión](public/candidatura.pdf) · [Metodología](https://salidacyl.es/metodologia) · [Datos abiertos](https://salidacyl.es/datos-abiertos) · [Respaldo](https://huntsman1756.github.io/concursos_cyl/)

## Qué puedes hacer

- **Partir de una FP:** consultar ocupaciones relacionadas, ofertas de una instantánea fechada y centros donde se imparte.
- **Partir de una profesión o una oferta:** explorar las formaciones relacionadas y la fuente que justifica cada vínculo.
- **Comparar estudios:** consultar referencias oficiales de bases de cotización de titulados, manteniendo separados sus ámbitos estadísticos. No son salarios prometidos ni predicciones individuales.

Por ejemplo, la ficha de [Cuidados Auxiliares de Enfermería](https://salidacyl.es/desde-fp/SAN21) permite explorar sus relaciones ocupacionales y contrastarlas con las fuentes. La matrícula o solicitud se realiza en los canales oficiales correspondientes.

## Alcance de los datos

La instantánea del **8 de septiembre de 2026** contiene **187 claves de programa, incluidas modalidades**, y **320 relaciones ocupacionales revisadas**. **185 claves tienen alguna relación aprobada (98,9 %)**; no son 185 titulaciones distintas.

**301 de las 1.032 ofertas de la instantánea tienen relación FP revisada (29,2 %)**. Son ofertas distintas, no un porcentaje de todo el mercado laboral. Una formación sin oferta relacionada no significa que carezca de oportunidades.

Integra ocho conjuntos del Portal de Datos Abiertos de la Junta: oferta de FP, ofertas de empleo, formación del ECYL, certificados de profesionalidad, convocatorias de empleo público, contratos provinciales, municipios y centros docentes. Se complementan con CNO-11, TodoFP, SEPE y EDUCAbase. El [inventario de fuentes](docs/contest/source-ledger.md) identifica sus funciones; las [condiciones de los datos](DATA_LICENSE.md) distinguen las licencias aplicables.

Las fuentes JCyL se descargaron el 8 de septiembre; las ofertas incluyen publicaciones hasta el 4 de septiembre. Las fuentes nacionales conservan sus propias fechas. La vigencia de cada oferta se comprueba en su enlace oficial. No se afirman equivalencias profesionales, empleabilidad ni impacto social medido.

## Candidatura

Categoría **Productos y Servicios** del [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html).

- [Memoria](docs/contest/jury-memo.md) y [PDF de esta versión](public/candidatura.pdf).
- [Guía de entrega](docs/contest/submission-guide.md): solicitud, adjuntos y comprobaciones antes de registrar.
- [Índice documental](docs/contest/README.md): fuentes, límites, evidencia técnica y registros históricos.
- [Demostración narrada](https://github.com/Huntsman1756/concursos_cyl/releases/download/v2026.09.10-candidate.23/demo-salidacyl-ximena-20260910.mp4): recorrido grabado con la instantánea del 8 de septiembre, voz sintética y subtítulos en español.

El PDF enlazado pertenece a esta rama o versión del repositorio. La web y las releases tienen su propio ciclo de publicación y pueden conservar una memoria anterior. Las comprobaciones fechadas acreditan la versión observada, no el estado actual de todos los accesos.

## Desarrollo y comprobaciones

Requiere Node.js 24.

```sh
npm ci
npm run dev
```

```sh
npm run license:check
npm run lint
npm test
npm run build
npm run test:e2e
npm run contest:submission:check
npm run contest:content:check
```

Las pruebas cubren datos, interfaz y recorridos, incluyendo comprobaciones automatizadas de accesibilidad; no acreditan una certificación integral. La aplicación no requiere cuentas, cookies ni analítica. Los términos presentes en la URL pueden permanecer en el historial del navegador.

Los datos se reconstruyen con `npm run data:build`, con revisión previa a su publicación. La [operativa](docs/operations.md) y el [despliegue](docs/deployment.md) describen mantenimiento, recuperación y verificación.

## Ayuda y licencia

El mantenimiento corresponde a la persona mantenedora de este repositorio. Para comunicar un error reproducible o proponer una mejora, utiliza [GitHub Issues](https://github.com/Huntsman1756/concursos_cyl/issues), sin incluir datos personales, credenciales ni documentos de la solicitud.

Código bajo [licencia MIT](LICENSE). Los datos conservan las [condiciones de sus editores](DATA_LICENSE.md); los componentes y recursos de terceros se detallan en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
