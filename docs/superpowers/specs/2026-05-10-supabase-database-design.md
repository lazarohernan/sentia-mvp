# Supabase Database Design — Escucha MVP

**Date:** 2026-05-10
**Status:** Approved

---

## Context

Escucha is a multi-tenant feedback platform for businesses with physical branches. Customers leave anonymous feedback via QR code. Owners and managers review feedback, sentiment analysis, and operational signals through a dashboard.

**Key constraints:**
- Anonymous feedback (no Auth required from the customer)
- Multi-tenant: each business is fully isolated from others
- Roles: owner (full access) → manager → collaborator (scoped, defined later)
- Self-service branch creation by the owner/manager
- Supabase Auth handles authentication; the app extends it with profiles and org membership

---

## Schema

### Entity map

```
auth.users (Supabase — unmodified)
    │
    └── profiles                   extended user data
         │
         └── organization_members  role of a user within an org
              │
              └── organizations    tenant (a business)
                   │
                   ├── branches    locations / branches of the business
                   │    │
                   │    └── feedback_submissions   anonymous customer feedback
                   │         │
                   │         └── ai_analyses       AI result linked to a submission
                   │
                   └── listening_events   listening-level events per branch/user
```

### Table definitions

#### `profiles`
Extends `auth.users`. Created automatically on sign-up via trigger or RPC.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → auth.users |
| `full_name` | text | |
| `avatar_url` | text | nullable |
| `created_at` | timestamptz | default now() |

#### `organizations`
The tenant. One per business.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default gen_random_uuid() |
| `name` | text | business display name |
| `slug` | text unique | URL-friendly identifier |
| `created_at` | timestamptz | default now() |

#### `organization_members`
Joins users to organizations with a role.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | FK → profiles, part of PK |
| `organization_id` | uuid | FK → organizations, part of PK |
| `role` | text | `owner \| manager \| collaborator` |
| `created_at` | timestamptz | default now() |

PK: (`user_id`, `organization_id`)

#### `branches`
A location or operational unit within an organization.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default gen_random_uuid() |
| `organization_id` | uuid | FK → organizations |
| `name` | text | |
| `slug` | text | unique per org (unique index on org_id + slug) |
| `address` | text | nullable |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | default now() |

#### `feedback_submissions`
Anonymous customer feedback submitted via QR form.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default gen_random_uuid() |
| `branch_id` | uuid | FK → branches |
| `type` | text | `complaint \| suggestion \| compliment \| recommendation` |
| `emotion_score` | int2 | 1–5, required |
| `csat_score` | int2 | 1–5, nullable |
| `nps_score` | int2 | 0–10, nullable |
| `free_text` | text | 8–2000 chars |
| `contact_name` | text | nullable |
| `contact_phone` | text | nullable |
| `contact_email` | text | nullable |
| `consent_accepted` | boolean | must be true |
| `created_at` | timestamptz | default now() |

#### `ai_analyses`
Sentiment analysis result linked 1:1 to a feedback submission.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default gen_random_uuid() |
| `submission_id` | uuid unique | FK → feedback_submissions |
| `status` | text | `completed \| disabled \| unavailable` |
| `sentiment` | text | `positive \| neutral \| negative` |
| `polarity` | numeric(5,3) | -1 to 1 |
| `urgency` | text | `low \| medium \| high \| critical` |
| `category` | text | see feedback domain schema |
| `summary` | text | |
| `recommended_action` | text | |
| `keywords` | text[] | |
| `entities` | text[] | |
| `model_used` | text | |
| `confidence` | numeric(5,4) | |
| `created_at` | timestamptz | default now() |

#### `listening_events`
Records a listening-level interaction by a user at a branch.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | default gen_random_uuid() |
| `organization_id` | uuid | FK → organizations |
| `branch_id` | uuid | FK → branches, nullable |
| `user_id` | uuid | FK → profiles |
| `level` | text | `download \| debate \| empathetic_listening \| generative_dialogue` |
| `note` | text | nullable, max 500 chars |
| `created_at` | timestamptz | default now() |

---

## Row Level Security (RLS)

All tables have RLS enabled. The core principle: **a user can only access data belonging to organizations they are a member of.**

A helper function is used throughout policies:

```sql
-- Returns organization IDs the current user belongs to
create or replace function auth.user_organization_ids()
returns setof uuid language sql stable security definer as $$
  select organization_id from public.organization_members
  where user_id = auth.uid()
$$;
```

### Policy summary

| Table | Operation | Who |
|---|---|---|
| `profiles` | SELECT | own row (`id = auth.uid()`) |
| `profiles` | UPDATE | own row |
| `organizations` | SELECT | members of that org |
| `organizations` | INSERT | authenticated (during sign-up RPC only) |
| `organization_members` | SELECT | own rows |
| `organization_members` | INSERT/DELETE | owner of that org |
| `branches` | SELECT | members of that org |
| `branches` | INSERT/UPDATE/DELETE | owner or manager of that org |
| `feedback_submissions` | INSERT | anyone (anon key, no auth required) |
| `feedback_submissions` | SELECT | members of the org that owns the branch |
| `ai_analyses` | SELECT | members of the org that owns the submission's branch |
| `ai_analyses` | INSERT | service role only (via API route) |
| `listening_events` | SELECT/INSERT | members of that org |

---

## Sign-up flow (atomic)

When a user registers, a Postgres RPC `create_user_organization` runs in a single transaction:

1. Insert into `profiles` (`id`, `full_name`)
2. Insert into `organizations` (`name` = company_name, `slug` = slugified company_name)
3. Insert into `organization_members` (`user_id`, `organization_id`, `role = 'owner'`)

This runs as `security definer` to bypass RLS during the initial setup. Called from `src/app/auth/actions.ts` after `supabase.auth.signUp()` succeeds.

---

## Feedback submission flow

The existing `/api/feedback` route is extended:

1. Validate payload (already done with Zod)
2. Look up `branch_id` by `branchSlug` — query `branches` table (no auth required, RLS allows SELECT on slug lookup via a specific policy or service role)
3. Insert into `feedback_submissions`
4. Run sentiment analysis (already done)
5. If analysis status is `completed`, insert into `ai_analyses`

The route uses the **service role key** (server-side only, never exposed to client) for steps 2–5, bypassing RLS safely from a trusted server context.

---

## Next.js data layer

### Generated types

```
src/lib/supabase/database.types.ts   generated via `supabase gen types typescript`
```

All repositories import from this file — no hand-written DB types.

### Repository structure

```
src/domain/
├── feedback/
│   ├── schemas.ts          (exists)
│   ├── sentiment-analysis.ts (exists)
│   └── repository.ts       (new — feedback_submissions + ai_analyses queries)
├── organizations/
│   ├── schemas.ts          (new — Zod types for org/member)
│   └── repository.ts       (new — org + member queries)
└── branches/
    ├── schemas.ts          (new — Zod types for branch)
    └── repository.ts       (new — branch CRUD queries)
```

Each repository exports plain async functions that accept a Supabase client instance. They do not create the client themselves — the caller (Server Component or API route) passes it in. This keeps repositories testable and framework-agnostic.

Example signature:
```ts
export async function getBranchesByOrganization(
  client: SupabaseClient,
  organizationId: string,
): Promise<Branch[]>
```

### Environment variables needed

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | already set | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | already set | Anon key for browser/server |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, never NEXT_PUBLIC | Bypasses RLS for trusted API routes |

---

## Out of scope (MVP)

- Collaborator branch-level scoping (roles defined, enforcement deferred)
- Email verification flow
- Real-time dashboard updates (websockets)
- File/image attachments on feedback
- Organization settings / billing
