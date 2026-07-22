# Demo guiada UI real — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Recorrido guiado con la misma UI del producto en modo demo, alimentada por lo que el usuario prueba.

**Architecture:** Extender `FeedbackForm` y follow-up de alertas/comentarios con `demoMode`. Sesión en memoria construye `DashboardCommentRow` + `DashboardAlertItem` desde el envío. `DemoTour` monta componentes reales por etapa.

**Tech Stack:** Next.js, React, Framer Motion, Vitest, componentes existentes de feedback/dashboard.

## Global Constraints
- Sin pasteles / estética IA; look Perks existente.
- Sin migración Supabase ahora.
- No clonar UI: reutilizar componentes.

---

### Task 1: Sesión y builder del caso
- [ ] `src/lib/demo-guiada/session.ts` — tipos + `buildDemoCaseFromFeedback`
- [ ] Test del builder
- [ ] Actualizar `steps.ts` para etapas con narración

### Task 2: Modo demo en formularios reales
- [ ] `FeedbackForm`: `demoMode`, `onDemoComplete`, skip scan/API
- [ ] `DashboardAlertCard`: `demoMode` guarda local
- [ ] `DashboardCommentsTable`: `demoMode` skip fetch follow-up / persist local
- [ ] Tests

### Task 3: DemoTour con UI real
- [ ] Reescribir `demo-tour.tsx` por etapas
- [ ] Marco guía (progreso + audio + siguiente) sin reemplazar producto
- [ ] Verificar en `/demo-guiada`
