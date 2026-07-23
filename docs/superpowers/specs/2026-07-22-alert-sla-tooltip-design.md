# Alert SLA tooltip — design

## Goal

Explicar la nomenclatura **Fuera de plazo** (antes “SLA vencido”) en el panel de Alertas sin saturar la UI.

## Approach

Tooltip nativo (`title` + `aria-label`) en un ícono `ⓘ` junto al label.

## Copy

> Etiqueta visible: **Fuera de plazo**. Tooltip: caso abierto sin primera respuesta a tiempo; plazos por urgencia; mención breve a SLA.

## Surfaces

1. Métrica del panel de alertas
2. Badge en cada tarjeta con SLA incumplido

## Out of scope

Tooltips para Abiertos / En revisión / Escalados / Respuesta prom. (mismo patrón después).
