# Plan: App production blockers

**Goal:** Cerrar fail-open auth, feedback sin QR firmado y abuso de IA.

## Done
1. `proxy.ts` + `updateSession`: auth gate en `/dashboard`, `/colaborador`, `/inicio`, `/escucha`, `/auth/activar-cuenta`; sin env → login
2. Pages privadas: ya no renderizan shell público sin Supabase
3. `POST /api/feedback`: exige `branchId` + `branchToken` firmado
4. Página `/feedback/[slug]`: emite token firmado server-side para el form
5. `/api/agent/report` y `/api/improvements/generate`: solo owner/manager + rate limit 10/h

## Manual follow-up
- Activar leaked password protection en Supabase Auth
- Configurar Upstash en prod para rate limit distribuido
