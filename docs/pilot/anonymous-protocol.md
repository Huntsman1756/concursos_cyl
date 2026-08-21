# Protocolo de piloto anónimo

Este protocolo prepara una revisión humana pequeña de los flujos públicos de
SALIDA CyL. El repositorio solo puede recibir un agregado de conteos; no se
crea ni se incorpora un fichero de resultados del piloto.

## Límites obligatorios

- Solo participan personas adultas (18 años o más) que lo confirmen antes de
  empezar. No se admiten menores ni se recopila su fecha de nacimiento.
- La participación es voluntaria y puede detenerse en cualquier momento.
- No se graba audio, vídeo, pantalla ni cámara. El navegador se usa en una
  ventana anónima y no se conserva historial de navegación del participante.
- No se piden nombre, correo, teléfono, dirección, identificadores, CV,
  transcripciones, capturas, citas ni otros datos personales.
- El operador anota únicamente conteos por tarea y códigos de bloqueador. No
  se asignan IDs de participante, seudónimos ni filas individuales.
- La plantilla de consentimiento es deliberadamente unsigned: se presenta a
  la persona, pero ninguna copia cumplimentada entra en Git ni en el agregado.

Si se revela un dato personal, se detiene la sesión, se descarta la nota local
sin copiarla y se informa del incidente al responsable del piloto. El dato no
se transcribe al repositorio.

## Preparación

1. Leer el [guion de tareas](./anonymous-task-script.md) y la [plantilla de
   consentimiento](./anonymous-consent-template.md).
2. Servir la versión revisada de la aplicación en un navegador nuevo. No usar
   una cuenta, sesión guardada, herramienta de analítica o grabador.
3. Presentar la plantilla sin pedir firma ni datos de contacto. Confirmar
   verbalmente la mayoría de edad y la decisión de continuar.
4. Ejecutar las cinco tareas fijas, en orden, con el mismo texto para todas las
   sesiones.

## Registro permitido

Por cada sesión se incrementan los contadores `started`, `completed` o
`blocked` de cada una de las cinco tareas. Un bloqueo se resume solo con uno de
los códigos `accessibility`, `comprehension`, `consent`, `technical`, `privacy`
u `other`; nunca se escribe una explicación que identifique a la persona.

El agregado debe conservar esta forma conceptual:

```text
five fixed task rows
aggregate session/task counts
adultOnly=true, recording=false, dataMode=aggregate-only
unsigned-template consent mode
open/resolved blocker codes
pending/approved review gate
```

La validación estructural y de invariantes se ejecuta sin imprimir el valor de
entrada:

```bash
rtk npm run pilot:anonymous:test
rtk npm run pilot:anonymous:validate -- --input /ruta/al/agregado.json --require-complete
```

El archivo de entrada es una preparación local y efímera. No se debe llamar
`results-aggregate.json`, añadirlo al repositorio ni distribuirlo.

## Cierre y revisión

El piloto solo se considera completo cuando todas las tareas tienen un conteo
por sesión, cada inicio termina como completado o bloqueado, no quedan
bloqueadores abiertos y la revisión está `approved` con marca temporal. La
revisión confirma de nuevo que se usó la plantilla sin firma, que solo hay
conteos agregados y que no hubo grabación ni datos personales.
