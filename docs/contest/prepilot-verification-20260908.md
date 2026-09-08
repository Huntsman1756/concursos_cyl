# Cierre técnico previo al piloto · 8 de septiembre de 2026

El VPS publica `v2026.09.08-candidate.19`, producto `4a76e5962d1628c4dbcaa4cb6a2b3922d906dd36`. La preparación está verificada; el piloto humano y la solicitud oficial no se han ejecutado. El resultado final de GitHub Pages, su commit y sus controles externos se adjuntan a la [release pública](https://github.com/Huntsman1756/concursos_cyl/releases/tag/v2026.09.08-candidate.19), por separado del VPS.

## Presentación y documentación

- El pie identifica la candidatura al X Concurso de Datos Abiertos de Castilla y León de 2026 y enlaza la memoria. No afirma que la solicitud oficial se haya enviado.
- La memoria tiene 688 palabras y dos páginas. Explica utilidad, límites y una hipótesis económica de adaptación, integración y mantenimiento para entidades. No acredita contratos, ingresos o impacto laboral medido.
- HTML, CSS y PDF coinciden byte a byte con los archivos comprobados en el VPS. El PDF tiene SHA-256 `e9b2a1ec78bf8643e7f8b27b79f35f28abc5d12d0b7a066d376118890737e88a`. Dos regeneraciones produjeron los mismos bytes y ambas páginas se revisaron visualmente.
- `contest:content:check` detecta cambios pendientes de regenerar en la memoria, el renderizador o la configuración de publicación. La compilación y la CI ejecutan este control.
- Se renovaron las 13 capturas contra el producto publicado. La [demo actual](evidence/demo-candidate19-20260908.webm) es una explicación con rótulos, no una sesión del piloto ni una prueba de seguridad.

## Interfaz, SEO y rendimiento

Se corrigieron las rutas de imágenes para respetar el prefijo de GitHub Pages y un valor de `sizes` inválido. El SEO básico distingue URL canónicas, títulos y descripciones por sección; las consultas llevan `noindex,follow`. El sitemap contiene 330 URL sin parámetros ni fechas de actualización inventadas. Los metadatos de la aplicación se actualizan mediante JavaScript; no se presenta esta solución como renderizado en servidor ni se garantiza posicionamiento.

Las comprobaciones públicas de portada, ficha de FP y memoria, a 1280 y 360 píxeles, verifican imágenes decodificadas, ausencia de desbordamiento, errores de página y resultados de Axe. No equivalen a una auditoría completa de accesibilidad. Véase el [registro del VPS](../qa/prepilot-vps-qa.json).

Se realizaron tres ejecuciones por versión en Chromium, móvil de 390 × 844, caché fría, CPU limitada a 4×, 1,6 Mbps de bajada y 150 ms de latencia:

| Mediana             | Candidate 17 | Candidate 19 |
| ------------------- | -----------: | -----------: |
| Buscador habilitado |     4.110 ms |     3.484 ms |
| LCP                 |     2.052 ms |     2.020 ms |
| CLS                 |       0,0463 |       0,0454 |

Se pospuso la carga de evidencia de ofertas hasta que los datos de búsqueda estuvieran listos. La reducción de transferencia medida en ese instante refleja una descarga diferida; no una eliminación del recurso. La primera ejecución de cada grupo fue más lenta: LCP 4.748/4.728 ms y buscador 6.858/6.205 ms. Por tanto, no se afirma que todas las cargas cumplan un umbral de rendimiento. Son aproximaciones de laboratorio, no Core Web Vitals de usuarios; el tiempo de respuesta del guion no es INP. Se conservan los registros [antes](../qa/prepilot-performance-before.json) y [después](../qa/prepilot-performance-after.json).

## Ingeniería y operación

La arquitectura sigue siendo una aplicación estática con datos versionados: no necesita una base de datos mutable, cuentas de usuario ni un servidor de negocio para estos recorridos. La revisión y reconstrucción de fuentes siguen siendo responsabilidades de mantenimiento.

La suite completa superó 1.367 pruebas, con 178 omitidas; Chromium superó 296 y omitió 6; Firefox/WebKit superaron 32. La suite completa se ejecutó en `a209bbc43e2d9320846c3316597e7d0fb3d5337b`; la única diferencia del producto publicado respecto a ese commit es la conservación de una variable de entorno en el adaptador PowerShell de despliegue. Se comprobaron de nuevo sus 28 pruebas de despliegue y se publicó desde una instalación y compilación limpias. El registro de release conserva el commit de ejecución de cada control; la CI de integración comprueba además el árbol integrado.

PowerShell usa ahora el mismo procedimiento POSIX que Linux, con bloqueo de despliegue, reserva de staging, activación atómica, cinco releases y verificación pública. La primera tentativa se detuvo durante la compilación porque Git Bash traducía una ruta URL; se corrigió antes de activar ningún producto. El tag candidate.18 conserva ese punto anterior y no identifica una publicación verificada.

La configuración de Caddy activada tiene SHA-256 `a8ec2cac4f8c25f3d9bb19fd7792941969cf91358d2c88ffa10a9c671aa22263`. Una petición sintética produjo únicamente claves operativas: estado, duración, tamaño, bytes leídos, fecha, nivel y mensaje técnico. Se eliminaron el objeto de petición, cabeceras e identificador de usuario. No se borraron registros históricos ni se cambió la política global de otros servicios.

El seguimiento `comprobar-disponibilidad-de-salida-cyl` revisa cada seis horas los dos hosts y avisa ante incidencia confirmada o recuperación. Depende de la disponibilidad del entorno Codex. El [procedimiento operativo](../operations.md) detalla límites, actualización y recuperación; el README ofrece el enlace alternativo.

## Piloto y límites pendientes

El [control previo](../qa/prepilot-preflight-20260908.json) verificó el commit público, la instantánea y los hashes del protocolo y del guion. Las 16 pruebas del validador pasaron. El estado permanece `HUMAN_PILOT_NOT_RUN`; no se han fabricado observaciones.

La instantánea sigue siendo `20260908044344059-f92da75832e9`, con las fuentes y fechas ya [revisadas](verification-20260908.md). Este pulido no vuelve a fechar datos nacionales ni altera sus relaciones.

Faltan las sesiones con personas, la identidad y el contacto para la solicitud, y las declaraciones sobre premios previos. El dominio propio requiere concretar nombre, cuenta y presupuesto. No se ha enviado la solicitud ni comprado un dominio.
