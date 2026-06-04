# SayIt / Escucha MVP

Aplicacion Next.js para capturar valoraciones por sucursal, validar enlaces QR firmados, interpretar feedback operativo y mostrar seguimiento ejecutivo en dashboard.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Variables de entorno

Usar `.env.example` como base:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
QR_SIGNING_SECRET=
HUGGINGFACE_API_TOKEN=
HUGGINGFACE_SENTIMENT_MODEL=finiteautomata/beto-sentiment-analysis
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_ALERTS_MODEL=
OPENAI_SUMMARY_MODEL=
OPENAI_GUIDANCE_MODEL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`SUPABASE_SERVICE_ROLE_KEY` es requerido para persistir feedback y operaciones server-side. Si falta, el API de feedback responde error en vez de aceptar una valoracion que no se puede guardar.

`QR_SIGNING_SECRET` firma y valida los QR por sucursal. Debe mantenerse estable en produccion para que los QR impresos sigan funcionando.

`OPENAI_API_KEY` activa el triage operativo de alertas con salida estructurada interna y lenguaje natural visible para gerentes. Si no esta configurado, la app conserva el analisis anterior con Hugging Face cuando `HUGGINGFACE_API_TOKEN` existe.

`OPENAI_ALERTS_MODEL` permite controlar el modelo usado para clasificar feedback, severidad, causa probable y accion recomendada. Si queda vacio, se usa el default de la aplicacion.

## Rate limiting con Upstash

Upstash Redis es opcional. Se usa solo para rate limiting distribuido cuando existen estas dos variables:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Si no estan configuradas, la app usa rate limiting local en memoria. Eso sirve en desarrollo y como fallback, pero en produccion serverless cada instancia tendria su propio contador.

Beneficios de activarlo en produccion:

- Bloqueo consistente por IP/ruta aunque Vercel/Next ejecute varias instancias.
- Menos riesgo de abuso contra endpoints publicos como feedback, QR scan, login, invitaciones y administracion.
- Evita usar Supabase como contador de requests en caliente.
- Si Upstash falla temporalmente, el codigo cae al limitador local para no romper el flujo.

Costo esperado:

- El plan Free de Upstash Redis cubre 500K comandos/mes y 256 MB.
- El modo pay-as-you-go cobra por comandos; la implementacion actual usa aproximadamente 3 comandos por request limitado.
- Con trafico inicial normal deberia entrar en el free tier. Para produccion con tarjeta, configurar budget cap en Upstash para evitar sorpresas.

## Verificacion antes de deploy

```bash
npm test
npm run lint
npm run build
```

## Notas de produccion

- Configurar variables de Supabase, QR y modelo de sentimiento antes del deploy.
- Activar Upstash cuando haya trafico real o cuando el despliegue tenga multiples instancias.
- Mantener `QR_SIGNING_SECRET` fuera del repositorio y no rotarlo sin plan de regenerar QR impresos.
