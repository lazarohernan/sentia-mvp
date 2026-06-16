# Perks Ops Agent

Agente operativo local para Perks usando:

- `@openai/agents` como capa de razonamiento
- `agents` de Cloudflare como runtime durable
- `Supabase` como fuente de contexto

## Qué hace esta primera base

- carga contexto desde una ruta interna segura del sistema
- calcula preparación del informe mensual
- genera una lectura operativa natural con OpenAI
- deja el resultado persistido en el estado del agente de Cloudflare
- permite prueba local por CLI antes del despliegue

## Variables

Copia `.env.example` a `.env` y completa:

- `OPENAI_API_KEY`
- `APP_BASE_URL`
- `AGENT_INTERNAL_TOKEN`
- `PERKS_ORGANIZATION_ID`
- opcional: `PERKS_BRANCH_IDS`
- opcional: `PERKS_PERIOD`

El agente ya no usa acceso directo a Supabase. Consume `POST /api/agent/context`, que devuelve solo lectura y solo el tenant solicitado.

## Comandos

Instalar:

```bash
cd agents/perks-ops-agent
npm install
```

Smoke local:

```bash
npm run smoke -- --organization <uuid-organizacion> --period 30d
```

Runtime local de Cloudflare:

```bash
npm run dev
```

## Siguiente paso

1. conectar este agente al dashboard
2. programar generación semanal/mensual
3. persistir historial/acciones del agente en base de datos
