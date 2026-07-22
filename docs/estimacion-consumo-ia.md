# Estimacion real de consumo de IA por cliente

Fecha base de precios: 2026-07-03.

Fuentes oficiales consultadas:
- Precios OpenAI API: https://developers.openai.com/api/docs/pricing
- Conteo previo de tokens: https://developers.openai.com/api/docs/guides/token-counting
- Guia de modelo actual: https://developers.openai.com/api/docs/guides/latest-model

## Decision actual de modelo

Usar `gpt-5.4-mini` como modelo base para:
- Analisis de comentarios (`feedback_triage`).
- Reportes operativos (`operational_report`).

Razones:
- Tiene precio oficial vigente en la tabla actual.
- Es suficientemente fuerte para JSON estructurado, clasificacion, resumen y accion recomendada.
- Evita usar `gpt-5.5` como default, que debe reservarse para flujos donde una evaluacion demuestre que la mejora justifica el costo.

Posible optimizacion posterior:
- Evaluar `gpt-5.4-nano` para clasificacion rapida de comentarios si una prueba con comentarios reales mantiene precision aceptable.
- Mantener `gpt-5.4-mini` para reportes ejecutivos porque combinan contexto, priorizacion y redaccion.

## Formula

Costo por evento:

```text
((input_tokens - cached_input_tokens) / 1,000,000 * precio_input)
+ (cached_input_tokens / 1,000,000 * precio_cached_input)
+ (output_tokens / 1,000,000 * precio_output)
```

Con `gpt-5.4-mini` en modo estandar, contexto corto:
- Input: USD 0.75 por 1M tokens.
- Cached input: USD 0.075 por 1M tokens.
- Output: USD 4.50 por 1M tokens.

## Escenarios iniciales

Estos son escenarios de planeacion. La tabla `ai_usage_events` debe ser la fuente real despues de operar con clientes.

| Situacion | Supuesto por evento | Costo aprox. `gpt-5.4-mini` |
| --- | ---: | ---: |
| Analisis de comentario corto | 900 input + 250 output | USD 0.0018 |
| 1,000 comentarios/mes | 1,000 eventos cortos | USD 1.80 |
| 10,000 comentarios/mes | 10,000 eventos cortos | USD 18.00 |
| Reporte operativo 30 dias | 12,000 input + 900 output | USD 0.0131 |
| 100 clientes, 4 reportes/mes | 400 reportes | USD 5.22 |

## Como medir real

Cada llamada OpenAI que devuelve `usage` debe registrar:
- `organization_id`
- `branch_id` si aplica
- `submission_id` si viene de un comentario
- `use_case`
- `provider`
- `model`
- `operation`
- `input_tokens`
- `cached_input_tokens`
- `output_tokens`
- `reasoning_output_tokens`
- `total_tokens`
- `estimated_cost_usd`
- `pricing_source`
- `pricing_effective_date`
- `raw_usage`

La migracion `20260703000000_ai_usage_events.sql` crea esta tabla.

## Reglas de decision

1. Si el flujo es masivo y repetitivo, como comentarios, optimizar primero costo por evento.
2. Si el flujo produce una decision gerencial o reporte externo, priorizar calidad antes que minimo costo.
3. Si un modelo no tiene precio vigente configurado, guardar tokens con `estimated_cost_usd = null` y no usarlo para proyecciones comerciales.
4. Si el flujo no es urgente, evaluar Batch API porque la tabla oficial muestra menor precio por token.
5. Revisar precios antes de cerrar cotizaciones, porque las tarifas de modelos cambian.

## Consulta base para consumo mensual

```sql
select
  organization_id,
  date_trunc('month', occurred_at) as month,
  use_case,
  model,
  count(*) as events,
  sum(input_tokens) as input_tokens,
  sum(cached_input_tokens) as cached_input_tokens,
  sum(output_tokens) as output_tokens,
  sum(total_tokens) as total_tokens,
  sum(estimated_cost_usd) as estimated_cost_usd
from public.ai_usage_events
group by organization_id, month, use_case, model
order by month desc, estimated_cost_usd desc;
```
