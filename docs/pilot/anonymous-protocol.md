# Protocolo de piloto anónimo

Este protocolo prepara una revisión humana pequeña de los flujos públicos de
SALIDA CyL. El repositorio solo puede recibir, después de ejecutar y revisar el
piloto, un agregado de conteos validado. Este kit no crea resultados ni afirma
que el piloto ya se haya realizado.

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

Por cada tarea se consolidan únicamente conteos de `attempted`, `completed`,
`blocked`, `abandoned`, `misinterpretations`, bandas de tiempo e incidencias
mediante enumeraciones cerradas. No existen notas ni resúmenes de texto libre.

El agregado debe conservar esta forma conceptual:

```text
five exact task IDs and aggregate task counts
adultOnly=true, minorsIncluded=false, recording=none
learner/counsellor role counts without participant rows
closed issue/action/blocker codes
pending/approved human and no-PII review gates
```

La validación estructural y de invariantes se ejecuta sin imprimir el valor de
entrada:

```bash
rtk npm run pilot:anonymous:test
rtk npm run pilot:anonymous:validate
```

Antes del piloto no se crea `analysis/pilot/anonymous/results-aggregate.json`.
Después, solo ese agregado puede proponerse para revisión; consentimientos,
hojas locales, capturas, transcripciones y cualquier material individual se
mantienen fuera del repositorio.

## Cierre y revisión

El piloto solo se considera completo con al menos cinco sesiones analizables,
al menos una persona de cada rol (`learner` y `counsellor`), consentimiento
completo, las cinco tareas contabilizadas y las revisiones humana y anti-PII
aprobadas con marca temporal. Un estado `blocked` requiere un código de bloqueo.
