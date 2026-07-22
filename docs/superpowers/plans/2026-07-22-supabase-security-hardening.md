# Plan: Ajustes BD Supabase (hardening)

**Goal:** Aplicar migraciones pendientes y endurecer grants/RPC/storage sin borrar datos.

**Architecture:** Migraciones SQL vía MCP `apply_migration` + archivos espejo en `supabase/migrations/`.

## Tasks
1. Aplicar `ai_usage_events` (+ revoke anon)
2. Aplicar harden: revoke anon tables, RPC create_user_organization solo service_role, quitar listing policy de logos
3. Verificar advisors + tablas
4. (Auth HaveIBeenPwned) — manual en Dashboard; no hay API MCP

## Fuera de alcance ahora
Blockers de app (proxy fail-closed, feedback token, rate limit IA) — siguiente bloque.
