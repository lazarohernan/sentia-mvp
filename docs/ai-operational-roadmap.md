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

## Fase 4 - Follow-up inteligente

**Problema:** El equipo puede dejar valoraciones criticas sin seguimiento o responder de forma inconsistente.

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
