# Plan: Demo guiada Perks

## Goal
Página aparte `/demo-guiada` con lead (nombre, correo, teléfono) y recorrido guiado por pasos, controles Siguiente/Repetir, look de la landing. Sin migración BD por ahora (localStorage).

## Files
- `src/app/demo-guiada/page.tsx` — ruta
- `src/components/demo-guiada/demo-guiada-view.tsx` — orquesta lead ↔ tour
- `src/components/demo-guiada/demo-lead-form.tsx` — formulario
- `src/components/demo-guiada/demo-tour.tsx` — pasos + Framer Motion + audio TTS
- `src/lib/demo-guiada/steps.ts` — contenido de pasos
- `src/lib/demo-guiada/storage.ts` — persistencia local temporal
- Enlaces landing: CTAs “Probar experiencia” → `/demo-guiada`

## Steps
1. Captura QR
2. Comentario → señal
3. Alerta priorizada
4. Acción sugerida
5. Seguimiento
6. Multi-sucursal
7. CTA final (probar feedback real + contacto)

## Out of scope now
Supabase migration, email/SMS, autoplay forzado
