# Reevaluación cerrada de CARTERA PAU

**Fecha:** 3 de agosto de 2026  
**Alcance:** evidencia del informe previo más la nueva prueba de fuente e ingesta; sin búsqueda adicional.

## Veredicto

**PASS CONDICIONAL FUERTE.** Queda autorizado un prototipo técnico de extremo a extremo; ya no procede mantener el `NO-GO` anterior. Todavía no es un `GO` de producto completo hasta cerrar las ambigüedades y las reglas de actualización.

El descarte se apoyaba en dos premisas: que el dato JCyL vigente no era causal y que convertir las ponderaciones exigiría revisar manualmente más de 10.000 cruces. La nueva evidencia debilita ambas:

- las resoluciones y rectificaciones vigentes del BOCYL están en el portal de análisis de JCyL, determinan directamente la recomendación y pueden monitorizarse;
- `pdfplumber` detecta las seis tablas vigentes: UBU `38 × 31`; ULE, dos páginas con 32 columnas `x` estables; USAL, 33 columnas `x` estables y cinco tokens sospechosos; el alta de Veterinaria de USAL; UVa `70 × 37` y `27 × 37`; y el alta de Biotecnología de UVa `4 × 37`;
- el feed API del BOCYL devuelve exactamente las cuatro resoluciones basales y las dos altas vigentes, con URL y fecha, por lo que descubrimiento, descarga y monitorización pueden automatizarse;
- por tanto, el volumen de la matriz deja de equivaler automáticamente a volumen de transcripción manual si el proceso incorpora invariantes y se detiene ante anomalías.

También queda acreditada una diferencia funcional defendible: las aplicaciones próximas calculan resultados una vez elegidas las materias o cruzan una nota con titulaciones; **CARTERA PAU elige antes un conjunto limitado de dos o tres exámenes para varios grados, bajo rangos de nota, optimización `maximin` y sensibilidad**. Es un problema de decisión distinto tanto de esas calculadoras como del antecedente informativo *Elige tu Universidad* de 2022.

La puntuación orientativa subiría de **22/35 a 27/35**: originalidad `3→4`, centralidad del dato `1→4` y calidad técnica `3→4`. La cobertura documental y la ausencia de transcripción ya están probadas; la nota sigue condicionada a exactitud semántica, versionado y comportamiento `fail-closed`.

## Puertas que aún debe superar

1. **Exactitud completa.** Normalizar las seis tablas ya detectadas. Cada fila debe quedar asociada inequívocamente a curso, universidad, centro/campus, grado, materia y ponderación; los cinco tokens sospechosos de USAL deben resolverse antes de publicar.
2. **Validación sin revisión masiva.** Comprobar encabezados y posiciones de columna, dominios permitidos (`0,1`, `0,2` o vacío), unicidad de claves, número esperado de columnas y ausencia de tokens sin resolver. Cualquier anomalía debe bloquear la publicación, no convertirse silenciosamente en cero.
3. **Versionado normativo.** Guardar URL, fecha, identificador y huella de cada una de las cuatro resoluciones basales y dos altas que ya descubre el feed; aplicar la precedencia de las altas y bloquear una nueva versión hasta validarla. Sigue pendiente resolver la discrepancia documental entre la etiqueta 2026-2027 y la URL que menciona 2025-2026.
4. **Catálogo vigente.** El CSV de grados que termina en 2023-2024 no puede actuar como autoridad actual. La aplicación debe derivar el universo operativo de las resoluciones vigentes o reconciliarlo con otra fuente JCyL actual, dejando fuera cualquier fila ambigua.
5. **Objetivo verificable del optimizador.** “Maximizar opciones” debe formularse sin depender de notas de corte ausentes: por ejemplo, maximizar el peor resultado normalizado entre los grados elegidos y mostrar el frente de sensibilidad. La salida debe ser reproducible y presentarse como simulación, nunca como garantía de admisión.
6. **Diferencia visible.** La primera demostración debe comenzar con varios grados y terminar recomendando las dos o tres materias; si el flujo empieza introduciendo materias ya escogidas y solo calcula una nota, la propuesta vuelve a colisionar con los productos existentes.

## Regla de decisión

**Se autoriza ya el prototipo técnico**, porque las seis fuentes y su descubrimiento automático están probados. Solo se autoriza convertirlo en producto si la canalización produce **cero celdas o encabezados sin resolver**, integra correctamente las dos altas vigentes y genera el mismo resultado desde una instantánea versionada. Si una actualización futura no puede detectarse o validarse, o si el solver necesita notas de corte no disponibles para sostener su promesa, el veredicto vuelve a **NO-GO**.

En síntesis: la nueva prueba convierte el antiguo obstáculo de datos en una canalización viable. **CARTERA PAU merece prototipo técnico inmediato; interfaz y cobertura pública quedan condicionadas a cerrar los cinco tokens sospechosos, aplicar las altas y superar los invariantes sin excepciones.**
