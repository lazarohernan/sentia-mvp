# AI Operational Roadmap - SayIt

**Date:** 2026-06-04
**Status:** Draft

## Objetivo

Integrar IA como una capa operativa dentro de SayIt, no como un chat generico. La IA debe reducir trabajo manual, detectar problemas antes, priorizar acciones y convertir valoraciones en decisiones concretas para duenos, gerentes y equipos de sucursal.

La referencia de mercado apunta a flujos repetibles y agentes con contexto, permisos y trazabilidad. OpenAI reporta crecimiento fuerte en workflows estructurados dentro de empresas, Zendesk usa agentes para resolver procesos de soporte, y OpenAI describe agentes internos que consultan datos, razonan y publican reportes. Fuentes:

- OpenAI enterprise AI report: https://openai.com/index/the-state-of-enterprise-ai-2025-report/
- Zendesk adaptive service agents: https://openai.com/index/zendesk/
- OpenAI in-house data agent: https://openai.com/index/inside-our-in-house-data-agent/
- OpenAI Agents SDK: https://openai.github.io/openai-agents-js/guides/quickstart/
- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs

## Principio de producto

No construir un chat como pantalla principal. El usuario operativo no tiene tiempo de conversar con la plataforma. La IA debe aparecer en:

- Alertas priorizadas.
- Resumen ejecutivo.
- Follow-up sugerido.
- Checklist de mejora.
- Explicaciones cortas de causa probable.
- Automatizacion de reportes.
- Preparacion de acciones, no solo texto.

## Principio de lenguaje

La salida visible para el usuario debe leerse como una explicacion natural, breve y comprensible, no como un checklist tecnico ni como JSON. La estructura es para el sistema: validar, guardar, filtrar, ordenar y medir. La interfaz debe convertir esa estructura en lenguaje humano.

Ejemplo de salida interna:

```json
{
  "severity": "high",
  "category": "wait_time",
  "probableCause": "espera en hora pico",
  "recommendedAction": "reforzar caja entre 5pm y 8pm",
  "confidence": 0.82
}
```

Ejemplo de salida visible:

```text
En Mall Norte se esta repitiendo un problema de espera durante horas pico. La causa mas probable es falta de apoyo en caja entre 5pm y 8pm. Conviene reforzar ese turno esta semana y revisar si los comentarios por espera bajan en los proximos 14 dias.
```

Regla: las tarjetas y resumenes pueden mostrar datos compactos, pero el analisis principal debe explicar el problema y la siguiente accion en lenguaje natural.

## Variables de entorno probables

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_ALERTS_MODEL=
OPENAI_SUMMARY_MODEL=
OPENAI_GUIDANCE_MODEL=
```

`OPENAI_MODEL` puede ser el default general. Los modelos especificos permiten controlar costo/calidad por tarea.

## Fase 1 - Alert Triage operativo

**Problema:** Hoy una alerta puede decir que algo esta mal, pero no necesariamente explica prioridad, causa y siguiente accion.

**Implementacion:**

- Usar OpenAI con output estructurado para clasificar cada feedback relevante.
- Guardar la clasificacion estructurada para filtros, metricas y auditoria.
- Mostrar al usuario una explicacion natural basada en esa clasificacion.
- Generar:
  - severidad: `low | medium | high | critical`
  - causa probable
  - area operativa: espera, limpieza, precio, calidad, facturacion, servicio, ambiente
  - accion recomendada
  - plazo sugerido
  - si requiere contacto con cliente
  - confianza

**Salida esperada:** una alerta accionable, no un comentario decorado.

**Formato visible:** parrafo corto con problema, causa probable y accion sugerida. Evitar listas largas salvo que el usuario abra un detalle operativo.

**Pantallas afectadas:**

- Dashboard resumen.
- Alertas.
- Detalle de valoracion.
- Follow-up.

**Valor:** mayor velocidad para decidir que atender primero.

### Implementado: triage operativo estructurado

La plataforma ya genera una lectura estructurada por comentario con estos campos operativos:

- severidad
- categoria operativa
- resumen natural
- causa probable
- accion recomendada
- responsable sugerido
- SLA sugerido
- si conviene contactar al cliente
- confianza

**Donde ya se usa:**

- persistencia en `ai_analyses`
- detalle de valoracion
- construccion de alertas y seguimiento
- reglas de prioridad abiertas en dashboard

**Criterio actual:**

El triage no intenta adivinar de mas. La causa probable debe ser prudente, el responsable debe sonar como rol operativo y el SLA debe ser entendible por gerencia.

## Fase 2 - Guias de mejora por sucursal

**Problema:** Los gerentes ven sintomas, pero no siempre saben que cambio operativo aplicar.

**Implementacion:**

- Agregar una seccion "Plan de mejora" por sucursal.
- La IA analiza patrones de los ultimos 7/30 dias.
- Internamente genera 3 a 5 acciones concretas:
  - accion
  - responsable sugerido
  - metrica a observar
  - plazo
  - senal de exito
- Visiblemente presenta una narrativa breve del patron y las acciones prioritarias en lenguaje natural.

**Ejemplo:**

```text
Mall Norte esta acumulando comentarios sobre espera los viernes entre 5pm y 8pm. La primera accion recomendada es reforzar caja y recepcion durante esa franja. Si la medida funciona, deberiamos ver menos comentarios de espera en las proximas dos semanas.
```

**Valor:** convierte feedback en gestion diaria.

## Fase 3 - Resumen ejecutivo automatico

**Problema:** El dueno no deberia revisar comentario por comentario.

**Implementacion:**

- Generar resumen diario/semanal por organizacion.
- Incluir:
  - riesgos nuevos
  - sucursales que mejoran/empeoran
  - temas repetidos
  - alertas sin resolver
  - recomendacion ejecutiva

**Entrega:**

- Dashboard.
- Email opcional.
- Notificacion interna.

**Valor:** lectura en 2 minutos con decisiones claras.

### Implementado: preparacion del informe mensual

Se agrego una vista `Informes` en el dashboard para medir si la organizacion ya tiene suficiente informacion para entregar un informe mensual mas util. Esta capa no inventa causas: mide la calidad real de las valoraciones recibidas y muestra cuanto falta para una mejor lectura.

**Algoritmo actual:**

- Cada valoracion se clasifica por calidad de informacion:
  - `suficiente`: explica motivo, categoria o detalle accionable.
  - `parcial`: tiene senal util, pero le falta especificidad.
  - `insuficiente`: es demasiado generica para explicar causa.
- Peso por valoracion:
  - suficiente = `1`
  - parcial = `0.5`
  - insuficiente = `0`
- Meta mensual por sucursal: `8` respuestas utiles.
- Meta minima global: `12` respuestas utiles.
- Preparacion global combina:
  - volumen de respuestas utiles: `70%`
  - claridad de informacion suficiente: `30%`

**Salida visible:**

- Barra de `Preparacion del informe mensual`.
- Porcentaje global de avance.
- Total de respuestas utiles actuales contra meta.
- Cuantas valoraciones utiles faltan.
- Claridad actual del periodo.
- Barra por sucursal con avance mensual.
- Recomendacion concreta por establecimiento.

**Ejemplo visible:**

```text
Preparacion del informe mensual: 36%
10.0 de 24 respuestas utiles.
Faltan 14 valoraciones utiles: respuestas con motivo claro, categoria especifica o detalle accionable.
```

**Criterio de producto:**

La plataforma debe distinguir entre analizar comentarios y tener suficiente base para reportar. Un comentario como "hay mucho que mejorar" puede ser analizado correctamente, pero no debe contarse como evidencia completa para explicar la causa. Esa brecha se muestra como informacion faltante para mejorar captura e informes.

## Fase 4 - Follow-up inteligente

**Problema:** El equipo puede dejar valoraciones criticas sin seguimiento o responder de forma inconsistente.

### Implementado: captura adaptativa de contexto

Se agrego una capa de captura inteligente antes de guardar una valoracion. El objetivo no es hacer un chat, sino pedir una sola precision cuando el comentario abierto no explica bien la causa.

**Como funciona:**

- El formulario evalua el comentario en el momento.
- Si el texto ya tiene motivo claro, se envia sin pasos extra.
- Si el texto es breve o ambiguo, se muestra una pregunta corta.
- El cliente puede elegir el motivo principal: atencion, espera, producto, limpieza, precio, ambiente, pago u otro.
- Puede agregar un detalle opcional.
- La API vuelve a validar la informacion y OpenAI recibe el comentario junto con esa precision.
- El analisis guarda `information_quality`, `follow_up_question` y `follow_up_answer` en `ai_analyses`.

**Ejemplo:**

```text
Comentario: "Estuvo bien, pero hay mucho que mejorar."
Pregunta: "Que fue lo principal que podria mejorar?"
Respuesta: "Espera. La fila se sintio lenta al pagar."
```

Con esa precision, el informe mensual ya no cuenta el comentario como una opinion vaga. Lo puede sumar como senal util de tiempo de espera para esa sucursal.

**Criterio de producto:**

La captura adaptativa debe aparecer solo cuando aporta valor. Una pregunta extra tiene costo para el cliente, por eso el limite inicial es una sola pregunta. Si el cliente no responde la precision, el comentario se acepta igual, pero se clasifica como informacion parcial o insuficiente para informes.

**Implementacion:**

- Para feedback critico, sugerir:
  - respuesta al cliente
  - tipo de compensacion si aplica
  - responsable
  - SLA
  - proxima accion
- Mantener aprobacion humana antes de enviar mensajes externos.

**Valor:** mejora recuperacion de clientes y disciplina operativa.

## Fase 5 - Deteccion de anomalias

**Problema:** Las metricas promedio esconden cambios bruscos.

**Implementacion:**

- Comparar ventanas historicas por sucursal.
- Detectar:
  - aumento brusco de comentarios negativos
  - caida de CSAT
  - tema nuevo recurrente
  - sucursal fuera de patron
- Usar reglas estadisticas primero; IA explica el hallazgo en lenguaje operativo.

**Valor:** alertas tempranas, menos reaccion tardia.

### Implementado: deteccion inicial de anomalias en Informes

La vista `Informes` ya compara dos ventanas recientes por sucursal para detectar cambios que un promedio mensual puede esconder.

**Reglas actuales:**

- salto de riesgo cuando una sucursal acumula al menos `3` senales de riesgo recientes y al menos duplica la ventana anterior
- caida de CSAT cuando el promedio reciente baja `1` punto o mas frente a la ventana anterior
- ambiguedad recurrente cuando `75%` o mas de los comentarios recientes llegan con contexto parcial o insuficiente

**Como se prioriza:**

- primero se ordenan las anomalias `danger`
- luego las `warning`
- dentro de cada grupo se muestran las mas intensas segun volumen o caida detectada

**Salida visible:**

- tarjeta breve por sucursal
- titulo corto del hallazgo
- explicacion natural de que cambio entre una ventana y otra

Esto deja lista la base para que el agente no solo describa el periodo, sino que detecte desbalances operativos antes de cerrar el informe semanal o mensual.

## Fase 6 - Knowledge base operativa

**Problema:** Las recomendaciones deben parecer del negocio, no genericas.

**Implementacion:**

- Crear una base de conocimiento por organizacion:
  - politicas de atencion
  - protocolos de compensacion
  - horarios pico
  - roles y responsables
  - tono de marca
- Usar esa informacion como contexto para alertas, respuestas y guias.

**Valor:** recomendaciones adaptadas a cada negocio.

### Implementado: knowledge operativa por tenant

La configuracion del negocio ahora tambien funciona como base de contexto para el agente. No es un chat ni una memoria abierta: son campos concretos que orientan el analisis y las sugerencias.

**Campos actuales:**

- horarios pico
- prioridades de servicio
- politica de compensacion
- tono esperado de follow-up
- notas operativas para IA

**Como se usa:**

- se guarda por organizacion dentro de `organizations`
- viaja en el `AgentContextSnapshot`
- entra al prompt del agente antes del resumen ejecutivo
- queda visible en configuracion como `Knowledge operativa para el agente`
- si `horarios pico` esta vacio, el agente intenta detectarlo automaticamente a partir de volumen y friccion por dia y hora

**Impacto:**

- el agente ya no recomienda igual para todos los negocios
- las sugerencias de seguimiento pueden respetar politica y tono local
- los informes salen mas alineados con la operacion real del tenant

## Estado actual del agente

Ya existe un scaffold local del agente en:

`agents/perks-ops-agent/`

### Stack actual del agente

- `@openai/agents` para razonamiento y salida ejecutiva
- `agents` de Cloudflare para runtime durable
- `Supabase` como fuente de contexto
- `TypeScript` como lenguaje comun con la app principal

### Capacidades ya montadas en local

- cargar comentarios recientes desde Supabase
- calcular preparacion del informe mensual con la misma logica del dashboard
- detectar sucursal prioritaria y patrones principales
- generar una lectura operativa en lenguaje natural con OpenAI
- exponer una base de runtime para Cloudflare Workers
- ejecutar un smoke local por CLI antes de desplegar

### Smoke command actual

```bash
cd agents/perks-ops-agent
npm run smoke -- --organization <uuid-organizacion> --period 30d
```

### Siguiente paso del agente

1. conectar este agente al dashboard
2. programar ejecucion semanal y mensual
3. persistir memoria e historial del agente en base de datos
4. mover la entrega de informes a ejecucion automatica real

### Estado de producto actual

La base tecnica del agente se conserva, pero su superficie principal en UI quedo pausada de forma intencional para terminar primero el roadmap operativo visible del producto.

Esto significa:

- el codigo del agente sigue disponible
- el contexto, prompt y persistencia no se pierden
- la UI prioriza `Informes`, `Mejoras`, anomalias y seguimiento operativo
- la reactivacion del agente puede hacerse despues sin reconstruir la base

## Criterio sobre si el agente era necesario

El agente no era estrictamente necesario en la primera etapa del producto.

La plataforma podia avanzar bastante con:

- analisis por comentario
- reglas operativas
- resumenes programados
- reportes normales

Eso ya resolvia una parte importante del valor inicial.

### Cuando deja de ser suficiente

Un agente empieza a tener sentido cuando la plataforma necesita hacer estas cuatro cosas juntas:

1. mantener memoria por periodo y por sucursal
2. priorizar con contexto, no solo clasificar comentarios
3. encadenar acciones: analizar, resumir, sugerir, entregar y seguir
4. automatizar decisiones operativas sin dispersar logica por toda la app

### Beneficios puntuales del agente

- contexto acumulado por negocio y sucursal
- lectura ejecutiva del periodo, no solo comentario aislado
- menos logica repartida entre frontend, APIs y procesos sueltos
- base mas clara para automatizar informes, planes de mejora y seguimiento
- mejor escalabilidad hacia memoria, trazabilidad y workflows

### Lo que el agente no resuelve por si solo

- no reemplaza buen diseno de datos
- no reemplaza reglas criticas del negocio
- no sustituye validacion humana en decisiones sensibles
- no mejora el producto solo por existir como capa "inteligente"

### Conclusion de arquitectura

- para un MVP temprano, el agente no era obligatorio
- para la plataforma operativa que se quiere vender, si tiene sentido
- el valor real no es "tener un agente"
- el valor real es que el sistema pueda recordar, interpretar, priorizar y ejecutar un flujo completo

La secuencia correcta fue:

1. construir captura, analisis, dashboard e informes
2. validar la logica operativa
3. luego montar el agente

Esa secuencia evita meter complejidad antes de tener claro el problema real que la IA debe resolver.

## Fase 7 - Agentes con herramientas internas

**Problema:** La IA no debe solo responder; debe preparar trabajo.

**Implementacion:**

- Crear agente interno con herramientas seguras:
  - consultar feedback por sucursal
  - leer metricas
  - crear follow-up
  - preparar resumen
  - proponer alerta
- Acciones sensibles requieren confirmacion humana.

**Valor:** flujos completos, no solo clasificacion.

## Orden recomendado

1. Alert Triage operativo.
2. Guias de mejora por sucursal.
3. Resumen ejecutivo automatico.
4. Follow-up inteligente.
5. Deteccion de anomalias.
6. Knowledge base operativa.
7. Agentes con herramientas internas.

## Criterios de calidad

- Toda salida IA debe ser estructurada y validada con schema.
- La salida visible debe ser lenguaje natural claro, no checklist ni datos crudos.
- Guardar modelo, version de prompt, confianza y fecha.
- Mantener fallback cuando OpenAI no responda.
- No bloquear captura de feedback por fallos de IA.
- No enviar mensajes externos sin aprobacion humana.
- Medir impacto: tiempo de respuesta, alertas resueltas, CSAT, repeticion de problemas.

## Primer entregable sugerido

Implementar `AI Alert Triage` como extension del analisis actual:

- Nueva funcion de analisis con OpenAI.
- Schema estricto.
- Persistencia en `ai_analyses` o tabla nueva si hace falta versionar.
- Mostrar severidad, causa probable y accion recomendada en dashboard.
- Tests para fallback, schema invalido y feedback critico.
