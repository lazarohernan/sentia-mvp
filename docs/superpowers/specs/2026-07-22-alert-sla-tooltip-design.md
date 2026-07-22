# Alert SLA tooltip — design

## Goal

Explicar la nomenclatura **SLA vencido** en el panel de Alertas sin saturar la UI.

## Approach

Tooltip nativo (`title` + `aria-label`) en un ícono `ⓘ` junto al label.

## Copy

> SLA (Service Level Agreement): plazo máximo para dar primera respuesta según urgencia — crítica 4 h, alta 24 h, media 48 h, baja 72 h. Vencido = sigue abierto sin respuesta.

## Surfaces

1. Métrica del panel de alertas
2. Badge en cada tarjeta con SLA incumplido

## Out of scope

Tooltips para Abiertos / En revisión / Escalados / Respuesta prom. (mismo patrón después).
