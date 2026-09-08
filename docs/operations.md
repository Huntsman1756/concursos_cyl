# Operación y continuidad de SALIDA CyL

Responsable operativo: la persona mantenedora del repositorio público. No se ofrece un SLA ni se presupone un equipo de guardia.

## Comprobación pública

`npm run ops:check` comprueba VPS y Pages: portada, versión, manifiesto, memoria y una imagen editorial. Valida tipos de contenido para que una página HTML de error no cuente como datos disponibles. El resultado distingue los dos commits; una versión de Pages puede incluir documentación posterior al producto VPS.

El seguimiento del hilo de Codex comprueba periódicamente estas URL y avisa ante una incidencia confirmada o recuperación. Depende de que el entorno de automatización esté disponible; no equivale a un monitor externo con disponibilidad garantizada. La CI de GitHub aporta una comprobación externa después de cada publicación. El enlace alternativo está visible en el README.

Ante un fallo, repetir la comprobación; distinguir un bloqueo de la red de prueba de una caída del servicio. Si falla solo el VPS, usar el respaldo mientras se investiga. Si los dos manifiestos difieren fuera de una ventana de publicación, revisar versiones antes de promover nuevos datos. No regenerar datos automáticamente para ocultar una incidencia.

## Fuentes y publicación

Revisar las fuentes semanalmente y antes de fijar una versión para el piloto o presentar la candidatura. Mantener separadas fecha de descarga, publicación de los registros y modificación del catálogo. Una fuente sin novedades conserva su fecha real. Si falla una fuente o una validación, conservar la última instantánea válida y registrar la incidencia; no rellenar relaciones por semejanza.

Antes de publicar, ejecutar controles de datos, licencias, pruebas afectadas y compilación. Regenerar documentación de candidatura, HTML/PDF y manifiestos derivados cuando cambien sus fuentes. Después, verificar el commit público y renovar las capturas afectadas. El tag del producto y el de evidencias tienen funciones diferentes.

## Recuperación

El VPS conserva cinco releases y activa una mediante enlace simbólico. Para revertir, seleccionar una release anterior comprobada, validar su `version.json`, cambiar el enlace de forma atómica bajo el mismo bloqueo de despliegue y ejecutar el verificador público. Conservar los tags y el repositorio como fuente de reconstrucción; las cinco copias del mismo VPS no constituyen una copia externa independiente.

GitHub Pages se reconstruye mediante el workflow del repositorio. La aplicación no depende de una base de datos mutable de usuarios. La recuperación se comprueba mediante reconstrucción limpia en CI y verificación de ambos hosts; no se simula una caída destructiva en producción.

## Registros técnicos

La configuración propuesta del sitio elimina el objeto de petición, cabeceras de respuesta e identificador de usuario de los logs de acceso, conservando estado, duración y tamaño. Usa un archivo de hasta 10 MiB y hasta cinco rotaciones, con antigüedad configurada de 14 días para los archivos rotados. La limpieza de rotaciones se realiza al rotar; no se afirma un borrado diario exacto. La verificación de aplicación de esta configuración queda en el informe de cierre.

Los registros históricos existentes no se borran durante esta mejora ni se cambia la política global de journald de otros servicios. La aplicación no añade analítica ni registra las observaciones del piloto en el servidor.

## Alcance de mantenimiento

El dominio propio sigue pendiente de concretar nombre, cuenta y presupuesto. El coste de alojamiento, revisión de datos y adaptación debe contrastarse antes de ofrecer servicios a terceros. La hipótesis económica de la memoria no acredita contratos ni ingresos.
