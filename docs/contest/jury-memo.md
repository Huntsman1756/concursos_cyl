# Memoria de candidatura: SALIDA CyL

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**.

## Resumen

SALIDA CyL conecta Formación Profesional y ocupaciones en los dos sentidos. Una persona puede partir de un título para ver sus salidas y ofertas relacionadas, o partir de una ocupación para encontrar la FP que conduce a ella. Cada relación publicada conserva la fuente, la fecha y sus límites; no hay cuentas, cookies, analítica ni perfiles de usuario.

## 1. Utilidad

El producto responde a dos preguntas concretas: «¿en qué puedo trabajar con mi FP?» y «¿qué FP me lleva a esta ocupación?». El catálogo permite consultar 187 ciclos oficiales y 502 grupos primarios CNO-11. La ficha decisiva reúne salidas oficiales, relaciones revisadas, ofertas actuales, centros, modalidades y contexto territorial sin mezclar evidencia formativa con demanda laboral.

## 2. Valor económico

SALIDA CyL reduce el coste de buscar y contrastar información dispersa entre formación, empleo y estadísticas públicas. Permite comparar rutas antes de invertir tiempo en una formación y dirige siempre al centro, oferta o fuente oficial para completar la decisión. Las referencias de cotización se presentan por su ámbito estadístico real; no se convierten en promesas salariales ni predicciones individuales.

La sección «Para centros y administraciones» explica cómo reutilizar el producto en orientación, jornadas informativas y servicios locales sin inventar acuerdos, ahorros ni resultados no medidos.

## 3. Valor público y social

La orientación es pública, gratuita y usable sin registro, también desde un móvil. Esto facilita el acceso donde no hay orientación presencial continua, especialmente en municipios pequeños. La interfaz muestra dónde estudiar, la distribución territorial de los centros, población municipal, modalidades y contexto provincial, pero distingue ese contexto de la demanda de una ocupación concreta. La finalidad es que una persona pueda valorar opciones formativas y laborales en Castilla y León con la misma evidencia, viva donde viva.

## 4. Originalidad e innovación

El núcleo es una relación bidireccional FP ↔ ocupación con evidencia trazable y cobertura explícita. Las relaciones no revisadas quedan pendientes; el sistema no las completa por similitud ni con texto generado. La interfaz convierte varios catálogos públicos en una decisión explicable y devuelve el grafo revisado a la comunidad en JSON y CSV bajo licencia abierta.

## 5. Variedad de datasets del Portal de Datos Abiertos de la Junta de Castilla y León

Los ocho conjuntos regionales tienen un uso visible en la interfaz y una copia normalizada dentro del snapshot `20260821101126579-c4561721ca32`.

| Dataset JCyL                       | Dónde se usa                                 | Registros usados | Fecha usada           | Licencia     |
| ---------------------------------- | -------------------------------------------- | ---------------: | --------------------- | ------------ |
| Oferta de estudios de FP           | Selectores, ciclos, centros y modalidades    |            1.294 | Copia del 21/08/2026  | CC BY 4.0 ES |
| Ofertas de empleo                  | Ofertas relacionadas y requisitos publicados |            1.055 | Fuente del 19/08/2026 | CC BY 4.0 ES |
| Formación del ECYL                 | Alternativas de formación complementaria     |              778 | Copia del 21/08/2026  | CC BY 4.0 ES |
| Certificados de profesionalidad    | Rutas formativas complementarias             |              583 | Copia del 21/08/2026  | CC BY 4.0 ES |
| Convocatorias de Empleo Público    | Procesos públicos con plazo abierto          |              307 | Copia del 21/08/2026  | CC BY 4.0 ES |
| Contratos realizados por provincia | Contexto laboral territorial en resultados   |            2.331 | Copia del 21/08/2026  | CC BY 4.0 ES |
| Registro de municipios             | Población del municipio donde se estudia     |            2.248 | Copia del 21/08/2026  | CC BY 4.0 ES |
| Directorio de Centros Docentes     | Coordenadas de la distribución territorial   |            1.741 | Copia del 21/08/2026  | CC BY 4.0 ES |

Se combinan con fuentes estatales oficiales: CNO-11, TodoFP, BOE y las tablas de inserción de EducaBase. La interfaz identifica el ámbito de cada fuente para impedir conclusiones que los datos no sostienen.

## 6. Facilidad de uso y accesibilidad

La portada pide primero el punto de partida y muestra un solo formulario y un solo botón principal. El selector de modo funciona con teclado y recuerda únicamente esa preferencia local. El buscador de ocupaciones ofrece sugerencias accesibles, los estados deshabilitados explican qué falta y todos los controles conservan foco visible. Los recorridos se verifican en escritorio y móvil. Axe no detecta incidencias serias o críticas en las rutas automatizadas. La declaración de accesibilidad distingue expresamente estas comprobaciones de una auditoría o certificación formal y publica los límites conocidos.

## 7. Calidad técnica

La ingesta descarga las fuentes, valida esquemas y genera recursos inmutables bajo `/data/v1/`. El manifiesto publica recuentos, fechas, hashes SHA-256 y estado de calidad. El grafo derivado añade descargas JSON y CSV con integridad verificable. Una actualización parcial o inválida no sustituye la última copia válida. El corte de candidatura queda ligado a un commit y a un snapshot reproducible.

## Límites declarados

- Las 172 relaciones FP-ocupación publicadas cubren 68 cualificaciones distintas y 84 claves de modalidad; son cobertura revisada, no el universo completo de relaciones posibles.
- Las 39 ofertas alcanzadas pertenecen a una copia fechada de 1.055 ofertas; no representan todo el mercado laboral.
- Los contratos provinciales aportan contexto territorial agregado, no demanda por ocupación.
- La población municipal describe el lugar de estudio, no la residencia del alumnado.
- Las coordenadas del Directorio sitúan los centros publicados; la visualización no calcula distancias ni tiempos de desplazamiento.
- Las estadísticas de cotización no predicen salario, empleo ni residencia de una persona.

## Acceso y verificabilidad

- Producto público: <https://salida-cyl.157-90-22-40.sslip.io/>
- Fuentes y metodología: <https://salida-cyl.157-90-22-40.sslip.io/metodologia>
- Accesibilidad: <https://salida-cyl.157-90-22-40.sslip.io/accesibilidad>
- Para centros y administraciones: <https://salida-cyl.157-90-22-40.sslip.io/para-organizaciones>
- Manifiesto de datos: <https://salida-cyl.157-90-22-40.sslip.io/data/v1/manifest.json>
- Dataset derivado: <https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos>
- Evidencia técnica: [technical-evidence.md](technical-evidence.md)
- Límites completos: [limitations.md](limitations.md)
