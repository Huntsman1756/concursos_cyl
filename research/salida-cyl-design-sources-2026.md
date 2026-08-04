# SALIDA CyL: fuentes de diseño y arquitectura evaluadas

**Fecha de revisión:** 4 de agosto de 2026  
**Alcance:** repositorios y documentación primaria de SBB, Emil Kowalski, Taste Skill y UI UX Pro Max.  
**Objetivo:** decidir qué materiales pueden incorporarse al desarrollo web de SALIDA CyL como dependencia y cuáles deben utilizarse únicamente como referencia.

## Conclusión ejecutiva

SALIDA CyL no debería adoptar directamente ningún sistema visual de SBB. Los paquetes SwiftUI y Flutter son móviles, mientras que `sbb-angular` exige Angular y lleva consigo una identidad diseñada para productos SBB. La aplicación debe construir una identidad propia, sobria y accesible, tomando de SBB sus principios de reducción, coherencia, inclusión, lenguaje autoexplicativo y orientación a tareas.

Sí conviene adoptar una parte verificable de **SBB API Principles** como estándar técnico: contrato OpenAPI versionado junto al código, semántica HTTP correcta, identificadores estables, filtros y paginación, compatibilidad hacia atrás y documentación consumible. Las tres colecciones de skills analizadas tampoco son dependencias de ejecución: son instrucciones para agentes. `emil-design-eng` resulta útil para revisar microinteracciones; `ui-ux-pro-max`, como lista de comprobación secundaria; y `design-taste-frontend`, solo para la portada o una revisión antiestética genérica, pues su alcance excluye expresamente dashboards, tablas de datos y productos multipaso.

## Matriz de decisión

| Fuente | Licencia | Alcance oficial | ¿Dependencia directa? | Uso recomendado en SALIDA CyL |
| --- | --- | --- | --- | --- |
| SBB API Principles | Apache-2.0 | Estándares organizativos, generales, REST y eventos | No es una librería | Adoptar selectivamente como contrato técnico |
| SBB SwiftUI Mobile | MIT | Componentes nativos iOS/SwiftUI, iOS 15+ | No | Extraer patrones de accesibilidad y adaptación |
| SBB Design System Flutter | MIT | Componentes móviles para Android e iOS | No | Extraer principios de tokens, temas y variantes |
| `sbb-angular` | Apache-2.0 | Componentes web Angular para productos SBB | No, salvo un proyecto Angular con identidad SBB | Estudiar accesibilidad y disciplina de componentes |
| `emilkowalski/skills` | MIT | Instrucciones de diseño y animación para agentes | No es runtime | Auditoría de microinteracciones y movimiento reducido |
| `design-taste-frontend` | MIT | Landing pages, portfolios y rediseños | No es runtime | Revisión de portada; no gobernar el producto |
| `ui-ux-pro-max` | MIT | Base de conocimiento y skills UI/UX multistack | No es runtime | Checklist de accesibilidad, responsive y formularios |

## 1. SBB API Principles

El [repositorio oficial](https://github.com/SchweizerischeBundesbahnen/api-principles) mantiene los principios de API de SBB como parte de su arquitectura de integración. Su README indica que se aplican a proyectos de software con independencia del modelo de adquisición, y que la rama principal contiene los principios vigentes. El contenido se publica como [sitio oficial versionado](https://schweizerischebundesbahnen.github.io/api-principles/), que mostraba la versión 2.4.0 durante esta revisión.

La sección REST establece como requisitos:

- proporcionar una especificación OpenAPI autocontenida y mantenerla bajo control de versiones junto a la implementación;
- usar correctamente los métodos HTTP;
- usar códigos de estado HTTP estándar;
- ofrecer filtros y paginación suficientes en recursos de colección.

Estas reglas están documentadas en [Principles for RESTful APIs](https://schweizerischebundesbahnen.github.io/api-principles/restful/principles/). La guía de [compatibilidad](https://schweizerischebundesbahnen.github.io/api-principles/general/compatibility/) trata la API como un contrato entre proveedor y consumidores: exige mantener compatibilidad hacia atrás o introducir una nueva versión mayor, y recomienda clientes tolerantes ante extensiones compatibles. El [modelo de madurez](https://schweizerischebundesbahnen.github.io/api-principles/organization/maturity/) añade propiedad, esquema gestionado, SLO, versionado, política de retirada, pruebas de interfaz y documentación como rasgos de una API gestionada o centrada en el consumidor.

### Aplicación propuesta

Se deben extraer estas reglas, sin importar el aparato de gobierno corporativo de SBB:

1. `openapi.yaml` como contrato versionado junto al código.
2. Recursos con identificadores estables y semántica de dominio, no nombres derivados de la forma original del dataset.
3. Filtros y paginación explícitos para títulos, ocupaciones, centros y ofertas.
4. Respuestas de error coherentes y códigos HTTP estándar.
5. Evolución compatible: campos nuevos opcionales y versiones mayores cuando cambie la semántica.
6. Trazabilidad de cada dato hasta su fuente y fecha de actualización.

El repositorio usa [Apache License 2.0](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/api-principles/master/LICENSE). Esta licencia permite reutilización y modificación con las condiciones de atribución y conservación de avisos que establece su texto; no concede derechos sobre marcas de SBB.

## 2. SBB Design System Mobile para SwiftUI

El [repositorio oficial SwiftUI](https://github.com/SchweizerischeBundesbahnen/mobile-ios-design-swiftui) contiene elementos de interfaz para aplicaciones iOS. Su [README](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/mobile-ios-design-swiftui/main/README.md) lo define como un Swift Package con iOS 15 como versión mínima y componentes optimizados para tamaños dinámicos de texto, VoiceOver, modos claro y oscuro y distintas clases de tamaño.

No es una dependencia web ni se puede reutilizar en React, Next.js o HTML. Sin embargo, confirma un conjunto de criterios trasladables:

- el texto debe soportar ampliación sin romper la jerarquía;
- las interacciones deben funcionar con tecnologías de asistencia;
- los temas claro y oscuro deben mantener legibilidad equivalente;
- los componentes deben adaptarse a diferentes tamaños de pantalla;
- el diseño debe conservar coherencia sin impedir temas propios.

El código está bajo [licencia MIT](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/mobile-ios-design-swiftui/main/LICENSE). No se propone copiar código, recursos visuales, logotipos ni marca SBB.

## 3. SBB Design System Mobile para Flutter

El [repositorio oficial Flutter](https://github.com/SchweizerischeBundesbahnen/design_system_flutter) contiene los componentes móviles oficiales de SBB. El [README](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/design_system_flutter/main/README.md) declara únicamente Android e iOS como plataformas soportadas. También documenta un tema global claro/oscuro, un esquema de color sustituible, extensiones de tema por componente y estilos locales para casos puntuales. Sus comprobaciones de integración ejecutan pruebas, golden tests y compilaciones para las versiones mínima y más reciente de Flutter soportadas en Android e iOS.

Por tanto, no debe introducirse en SALIDA CyL, incluso aunque Flutter pueda compilar otras aplicaciones para web: este paquete concreto se declara y prueba como sistema móvil Android/iOS. Sí merece conservarse como referencia de ingeniería:

- tokens semánticos en lugar de colores o medidas dispersas;
- valores globales con excepciones locales explícitas;
- paridad de jerarquía entre temas;
- catálogo de componentes probado visualmente;
- cambios registrados mediante changelog y pruebas de regresión.

El proyecto usa [licencia MIT](https://raw.githubusercontent.com/SchweizerischeBundesbahnen/design_system_flutter/main/LICENSE).

## 4. SBB Angular y el sistema web Lyne

El [repositorio `sbb-angular`](https://github.com/sbb-design-systems/sbb-angular) publica `@sbb-esta/angular`, una librería de componentes para sitios y aplicaciones SBB. El [README oficial](https://raw.githubusercontent.com/sbb-design-systems/sbb-angular/main/README.md) declara soporte para las dos versiones más recientes de Chrome, Firefox, Safari y Edge, y enumera pruebas con NVDA, JAWS, VoiceOver, Android Accessibility Suite y ChromeVox. Su [manifiesto de paquete](https://raw.githubusercontent.com/sbb-design-systems/sbb-angular/main/src/angular/package.json) muestra dependencias pares directas de Angular y Angular CDK.

Esto la convierte en una librería web real, pero no en una elección adecuada para SALIDA CyL si el proyecto no está construido con Angular. Introducir Angular para acceder a estos componentes sería una dependencia arquitectónica desproporcionada. Incluso dentro de Angular, su diseño está orientado a la presencia digital de SBB, no a una identidad pública de Castilla y León.

La propia guía oficial [Designing](https://digital.sbb.ch/de/design-system/getting-started/designing/) recomienda **Lyne** para nuevas aplicaciones web y micrositios. El repositorio actual de [Lyne Components](https://github.com/sbb-design-systems/lyne-components) implementa Web Components estándar sobre Lit y publica wrappers para React. Esta constatación refuerza que no conviene tomar `sbb-angular` como base de un producto nuevo ajeno a SBB.

La licencia de `sbb-angular` es [Apache-2.0](https://raw.githubusercontent.com/sbb-design-systems/sbb-angular/main/LICENSE). Aunque el código sea reutilizable bajo sus condiciones, la licencia Apache señala expresamente que no concede permiso de uso de nombres comerciales, marcas o nombres de producto salvo para atribución razonable.

## 5. Principios visuales SBB trasladables

La documentación oficial enumera ocho [principios de diseño](https://digital.sbb.ch/de/principles/ux-principles/overview/): centrado en usuarios reales, consistente entre canales, inclusivo, reducido, holístico, autoexplicativo, orientado a tareas y adecuado a las capacidades humanas. Su formulación de “reducido” es especialmente útil para SALIDA CyL: mostrar tan poco como sea posible y tanto como sea necesario.

Estos principios encajan con la ficha de evidencia vertical ya aprobada:

- **Reducido:** una progresión principal `encaje → requisito → brecha → acción`, sin mosaicos ornamentales.
- **Autoexplicativo:** etiquetas que describen estados reales y límites del dato, evitando porcentajes opacos.
- **Orientado a tareas:** cada brecha termina en una acción ejecutable o declara que no existe una acción fiable.
- **Inclusivo:** navegación por teclado, foco visible, contraste, zoom, lectores de pantalla y movimiento reducido.
- **Consistente:** el mismo lenguaje de estados en ambas entradas del producto.
- **Centrado en usuarios:** pruebas con titulados recientes y personas que exploran una profesión, no solo revisión interna.

La [guía de accesibilidad](https://digital.sbb.ch/de/accessibility/introduction/about-this-guide/) distribuye la responsabilidad entre producto, investigación, interacción, diseño visual, desarrollo, contenido y pruebas. Esta visión es más útil que copiar la apariencia de SBB: obliga a tratar accesibilidad como un requisito transversal.

## 6. `emilkowalski/skills`

El [repositorio oficial](https://github.com/emilkowalski/skills) contiene skills para agentes, no componentes de interfaz. Su [README](https://raw.githubusercontent.com/emilkowalski/skills/main/README.md) describe una colección centrada en decisiones de animación, revisión de movimiento, oportunidades legítimas de animación, principios trasladados a la web y selección de librerías.

La skill principal [`emil-design-eng`](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md) aporta reglas útiles y comprobables para SALIDA CyL:

- preguntar primero si una transición debe animarse y con qué propósito;
- evitar animar interacciones repetidas con alta frecuencia;
- usar movimiento para continuidad espacial, cambio de estado o feedback, no solo por decoración;
- mantener las animaciones habituales de UI por debajo de 300 ms;
- preferir `transform` y `opacity` para reducir costes de renderizado;
- aplicar `prefers-reduced-motion` y eliminar desplazamientos cuando el usuario solicita menos movimiento;
- limitar estados hover a dispositivos que realmente disponen de hover y puntero preciso.

### Aplicación propuesta

Usar esta colección como auditoría de microinteracciones después de implementar el flujo funcional. En SALIDA CyL el movimiento debe ser mínimo: feedback de pulsación, apertura de detalles, cambio de estado y carga. No debería haber entradas escalonadas, efectos de seguimiento del cursor ni animaciones que retrasen la lectura de evidencia.

La colección usa [licencia MIT](https://raw.githubusercontent.com/emilkowalski/skills/main/LICENSE). Si se instala para agentes, debe fijarse un commit o una versión conocida y conservarse la licencia; no añade código runtime por sí misma.

## 7. `design-taste-frontend`

La página de skills.sh remite al [repositorio oficial Taste Skill](https://github.com/Leonxlnx/taste-skill). Su [README](https://github.com/Leonxlnx/taste-skill/blob/main/README.md) identifica `design-taste-frontend` como la versión 2 experimental y ofrece una variante v1 conservada para compatibilidad. El [changelog](https://github.com/Leonxlnx/taste-skill/blob/main/CHANGELOG.md) confirma que v2 sigue iterando antes de una versión 2.0.0 estable.

La [skill v2](https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/SKILL.md) declara expresamente que está dirigida a landing pages, portfolios y rediseños, no a dashboards, tablas de datos ni interfaces de producto multipaso. Este límite impide convertirla en la autoridad principal para SALIDA CyL.

Puede aportar valor acotado en:

- inferir una dirección visual a partir del público y las restricciones antes de decorar;
- detectar patrones visuales genéricos producidos por IA;
- controlar densidad, movimiento y variación de composición;
- revisar la portada y la presentación del proyecto al jurado.

No debe imponer asimetrías, animación intensa ni estilos de landing sobre la ficha de evidencia. Si se incorpora, debe fijarse la revisión exacta por el carácter experimental de v2. El repositorio usa [licencia MIT](https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/LICENSE).

## 8. `ui-ux-pro-max`

La ficha de skills.sh remite al [repositorio oficial UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). El proyecto se presenta como una base de inteligencia de diseño para múltiples plataformas y frameworks, con reglas de accesibilidad, interacción, responsive, tipografía, gráficos y tipos de producto. Publica [releases versionadas](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/releases) y usa [licencia MIT](https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/LICENSE).

No es un sistema de componentes ni una dependencia runtime. Su amplitud lo hace apropiado como checklist secundario, pero peligroso como generador automático de la dirección visual: las recomendaciones por industria, estilos y paletas no conocen por sí solas los límites metodológicos del concurso ni la arquitectura de evidencia aprobada.

### Aplicación propuesta

Consultarlo únicamente para comprobaciones concretas:

- tamaños táctiles, foco, contraste y navegación por teclado;
- comportamiento responsive de formularios, listas y tarjetas;
- tablas o gráficos que necesiten alternativas accesibles;
- estados vacíos, error, carga y datos incompletos;
- consistencia de controles y formularios.

La jerarquía, el lenguaje y la paleta deben proceder del diseño propio de SALIDA CyL, no de una plantilla generada por categoría.

## 9. Decisión de desarrollo

La política recomendada para el proyecto es:

> SBB se utiliza como referencia de producto limpio y accesible; SBB API Principles, como estándar técnico selectivo; `emil-design-eng`, como control de movimiento; `ui-ux-pro-max`, como checklist; y `design-taste-frontend`, solo como revisión de portada. SALIDA CyL mantiene componentes propios, una identidad propia y ninguna dependencia visual o de marca SBB.

Consecuencias prácticas:

1. No instalar paquetes SwiftUI, Flutter ni `@sbb-esta/angular`.
2. No reutilizar logotipos, pictogramas, fuentes, nombres ni activos de marca SBB.
3. Crear tokens propios para color, tipografía, espaciado, radios, sombras, foco y movimiento.
4. Elegir componentes web accesibles y de código abierto compatibles con el stack definitivo, con la menor capa visual posible.
5. Mantener el texto de interfaz breve: título, evidencia, límite y acción; las explicaciones largas van en metodología o detalles desplegables.
6. Usar iconos solo cuando aporten reconocimiento o estado y acompañarlos de texto accesible; no como decoración ni sustituto ambiguo del lenguaje.
7. Fijar versiones o commits de cualquier skill de agente que se incorpore al repositorio y registrar su licencia.
8. Someter la UI a pruebas automáticas y manuales de teclado, lector de pantalla, zoom, contraste, ancho móvil y movimiento reducido.

## Fuentes primarias

- [SBB API Principles: repositorio](https://github.com/SchweizerischeBundesbahnen/api-principles)
- [SBB API Principles: documentación publicada](https://schweizerischebundesbahnen.github.io/api-principles/)
- [SBB API Principles: REST](https://schweizerischebundesbahnen.github.io/api-principles/restful/principles/)
- [SBB API Principles: compatibilidad](https://schweizerischebundesbahnen.github.io/api-principles/general/compatibility/)
- [SBB API Principles: madurez](https://schweizerischebundesbahnen.github.io/api-principles/organization/maturity/)
- [SBB SwiftUI Mobile](https://github.com/SchweizerischeBundesbahnen/mobile-ios-design-swiftui)
- [SBB Flutter Design System Mobile](https://github.com/SchweizerischeBundesbahnen/design_system_flutter)
- [SBB Angular](https://github.com/sbb-design-systems/sbb-angular)
- [SBB Lyne Components](https://github.com/sbb-design-systems/lyne-components)
- [SBB: principios UX](https://digital.sbb.ch/de/principles/ux-principles/overview/)
- [SBB: guía de accesibilidad](https://digital.sbb.ch/de/accessibility/introduction/about-this-guide/)
- [Emil Kowalski: skills](https://github.com/emilkowalski/skills)
- [Leonxlnx: Taste Skill](https://github.com/Leonxlnx/taste-skill)
- [Next Level Builder: UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

