# Memoria de candidatura: SALIDA CyL

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**.

## Resumen

SALIDA CyL convierte datos públicos dispersos en una decisión formativa y laboral. Responde «¿en qué puedo trabajar con mi FP?» y «¿qué FP me lleva a esta ocupación?». La persona puede empezar en un ciclo o en una ocupación, consultar relaciones revisadas, contrastar ofertas de una instantánea y localizar centros, modalidades y contexto territorial. Cuando la evidencia no basta, la aplicación deja la relación pendiente y lo explica en lugar de inventarla.

La candidatura expandida se encuentra en estado documental pendiente y todavía no tiene tag, release, despliegue ni A4 nuevos. Su evidencia enlaza el límite de cobertura `032426013a88c35bad348f3c443dae7d9a1639a3`, el snapshot `20260822085631889-fc9bf2ba23f9` y el manifest `b41189db5e116bb83f2ec07e865909e6114c31622324e5c5f0f268161f2381e1`; cualquier publicación posterior requiere volver a ejecutar y registrar los gates correspondientes.

La referencia funcional certificada anterior es `v2026.08.27-candidate.4`, commit `a59a788a39bc8d300c66fee39ea2f2469f588112`, con snapshot `20260822085631889-7bbe69380f6d` y su manifest histórico. Ese estado permanece intacto como fallback; sus observaciones live y A4 no se presentan como evidencia actual de la candidatura expandida.

## 1. Utilidad

SALIDA CyL ordena una decisión que normalmente obliga a saltar entre FP, ocupaciones, empleo y centros. Permite consultar 187 ciclos oficiales y 502 grupos primarios CNO-11. La ficha separa salidas oficiales, relaciones FP-ocupación aprobadas, ofertas alcanzadas, centros y fuentes.

Dos recorridos muestran el valor en pocos segundos. Desde FP: [Cuidados Auxiliares de Enfermería (SAN21)](https://salida-cyl.157-90-22-40.sslip.io/desde-fp/SAN21) lleva a ocupaciones revisadas y a ofertas de la instantánea con correspondencia validada. Desde ocupación: [Auxiliares de enfermería hospitalaria (CNO 5611)](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A5611) devuelve la FP relacionada. La cobertura congelada contiene 264 relaciones FP-ocupación, 35 alias aprobados, 113 cualificaciones distintas y 130 claves de modalidad. El SEPE aporta 116 de 116 páginas de ocupación consultadas para `2026-07`.

## 2. Valor económico

El valor económico está en reducir el tiempo y la incertidumbre antes de elegir una matrícula, desplazamiento o ruta profesional. La aplicación reúne en una misma decisión la formación disponible, el vínculo ocupacional que ha pasado revisión, la oferta publicada que puede alcanzarse con seguridad y el centro donde continuar. Las referencias de EDUCAbase ayudan a comparar información oficial antes de invertir recursos, pero conservan su ámbito estadístico y no se presentan como resultado individual.

Ese límite protege la decisión: SALIDA CyL no convierte una tabla agregada en una promesa de ingresos ni atribuye ahorros, contratación o impacto que todavía no hayan sido medidos.

## 3. Valor público y social

Es gratuito, no requiere cuenta y funciona en móvil y escritorio. Cualquier persona puede explorar opciones de Castilla y León, comparar centros por provincia y localidad y abrir las fuentes públicas. La aplicación no crea perfiles: no guarda búsquedas, respuestas ni resultados. Distingue el lugar del centro, la población municipal y los contratos provinciales para no convertir contexto territorial en una afirmación sobre la residencia o el futuro de una persona.

## 4. Originalidad e innovación

La unidad de valor es un grafo bidireccional FP ↔ ocupación revisado relación por relación. Cada vínculo conserva fuente, fecha, estado y límites; los vínculos no revisados permanecen fuera de las afirmaciones. El sistema aplica un criterio fail-closed: una coincidencia débil no se publica por similitud ni por texto generado. El resultado se devuelve como datos abiertos derivados en JSON y CSV, con integridad verificable. La innovación está en convertir un catálogo disperso en una relación navegable y auditable, manteniendo visible la incertidumbre.

## 5. Variedad de datasets

Los ocho conjuntos regionales de la Junta tienen un uso visible: oferta de estudios de FP, ofertas de empleo, formación del ECYL, certificados de profesionalidad, convocatorias de empleo público, contratos por provincia, registro de municipios y directorio de centros docentes. Se combinan con CNO-11, TodoFP, BOE, SEPE y EDUCAbase. La metodología conserva el ámbito de cada fuente y la [página de datos abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos) permite descargar el grafo revisado.

## 6. Facilidad de uso y accesibilidad

La portada ofrece un único punto de partida y mantiene el recorrido principal corto. Los selectores funcionan con teclado, el foco es visible y los estados vacíos explican qué está disponible, qué falta revisar y qué acción puede realizarse. Los recorridos de escritorio y móvil comprobaron overflow, red, consola y Axe. El paquete A4 de candidate.4 es evidencia histórica; la captura A4 de la candidatura expandida permanece pendiente. La declaración de accesibilidad diferencia estas comprobaciones de una certificación formal.

## 7. Calidad técnica

La candidatura expandida usa el snapshot inmutable `20260822085631889-fc9bf2ba23f9`, manifest SHA-256 `b41189db5e116bb83f2ec07e865909e6114c31622324e5c5f0f268161f2381e1`, 21 recursos, 264 relaciones FP-ocupación, 35 alias aprobados y 133 ofertas alcanzadas de 1.058. Una actualización inválida no sustituye la copia válida. La nueva candidatura aún no afirma publicación, despliegue, A4 ni verificación live; esos estados permanecen pendientes.

## Recorrido para el jurado

1. Abrir [SAN21](https://salida-cyl.157-90-22-40.sslip.io/desde-fp/SAN21) y seguir una salida revisada con ofertas de la copia fechada.
2. Abrir [CNO 5611](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A5611) para ver el recorrido inverso, o [CNO 7111](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A7111) para ver el valor desde la ocupación (Encofradores).
3. Abrir [Programadores informáticos, CNO 3820](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A3820) para ver cómo se explica un caso sin ofertas en esta copia (fail-closed) sin ocultarlo.
4. Abrir [Datos abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos) y comprobar la descarga, las fuentes y la trazabilidad.

Las 133 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas y no representan todo el mercado. Los contratos provinciales son contexto agregado; las tablas de ingresos no predicen una situación individual; no se afirma adopción o impacto sin evidencia humana. La identidad, el consentimiento y la autorización de presentación permanecen fuera del repositorio y requieren aprobación humana explícita.
