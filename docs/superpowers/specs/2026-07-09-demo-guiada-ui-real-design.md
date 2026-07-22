# Demo guiada con UI real — Diseño

## Objetivo
Que el recorrido `/demo-guiada` use los mismos componentes del producto (`FeedbackScreen`/`FeedbackForm`, `DashboardAlertCard`, detalle de valoración, resumen multi-sucursal), no pantallas de texto alternativas.

## Enfoque A
- `FeedbackForm` acepta `demoMode` + callback: misma UI y lógica de aclaración; no llama API.
- El envío del usuario genera un caso en sesión (comentario + alerta + acción).
- Pasos internos montan componentes reales del dashboard con ese caso + fixtures de contexto.
- Follow-up de alerta/comentario en demo actualiza estado local (sin API).
- Lead sigue en `localStorage`; migración Supabase diferida.

## Flujo
1. Lead
2. Captura: `FeedbackScreen` real (demo)
3. Señal: aclaración dentro del mismo formulario si aplica
4. Alerta: `DashboardAlertCard` con el caso generado
5. Acción: detalle de valoración real (`DashboardCommentsTable` abierto)
6. Seguimiento: guardar estado/responsable en modo demo
7. Multi-sucursal: `DashboardSummaryView` con fixtures + caso del usuario
8. Cierre: CTA a experiencia real / login

## Fuera de alcance
Migración BD, auth real, emails de escalamiento.
