# Supabase Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Escucha to a real Supabase multi-tenant database — schema, RLS, server-side client with service role, sign-up org creation, feedback persistence, and typed domain repositories.

**Architecture:** Multi-tenant via `organizations` table as the root tenant. All data (branches, feedback, analyses) belongs to an org. RLS enforces isolation. Repositories are plain async functions that accept a Supabase client — no framework coupling. The feedback API uses the service role key server-side; the dashboard uses the anon key with RLS.

**Tech Stack:** Next.js 16 App Router, Supabase (`@supabase/ssr` + `@supabase/supabase-js`), PostgreSQL (via Supabase dashboard SQL editor), Zod, Vitest.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/001_initial_schema.sql` | Create | Full schema + RLS + helper function + RPC |
| `src/lib/supabase/service.ts` | Create | Server-only client using service role key |
| `src/lib/supabase/env.ts` | Modify | Add `getSupabaseServiceEnv()` |
| `src/lib/supabase/database.types.ts` | Create | Generated types (manual for now, replaced by CLI later) |
| `src/domain/organizations/schemas.ts` | Create | Zod schemas for org + member |
| `src/domain/organizations/repository.ts` | Create | `getOrganizationByUser`, `createUserOrganization` |
| `src/domain/branches/schemas.ts` | Create | Zod schemas for branch |
| `src/domain/branches/repository.ts` | Create | `getBranchesByOrganization`, `createBranch`, `getBranchBySlug` |
| `src/domain/feedback/repository.ts` | Create | `insertFeedbackSubmission`, `insertAiAnalysis`, `getFeedbackByOrganization` |
| `src/app/auth/actions.ts` | Modify | Call `create_user_organization` RPC after sign-up |
| `src/app/api/feedback/route.ts` | Modify | Persist feedback + analysis to DB |

---

## Task 1: SQL migration — schema, RLS, helper function, RPC

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create the migrations directory and SQL file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial_schema.sql` with the full content below. This file is applied manually via the Supabase dashboard SQL editor (Project → SQL Editor → paste and run).

```sql
-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own row select"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: own row update"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- 2. ORGANIZATIONS
-- ============================================================
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- 3. ORGANIZATION MEMBERS
-- ============================================================
create table public.organization_members (
  user_id         uuid not null references public.profiles on delete cascade,
  organization_id uuid not null references public.organizations on delete cascade,
  role            text not null check (role in ('owner', 'manager', 'collaborator')),
  created_at      timestamptz not null default now(),
  primary key (user_id, organization_id)
);

alter table public.organization_members enable row level security;

create policy "org_members: own rows select"
  on public.organization_members for select
  using (user_id = auth.uid());

-- ============================================================
-- 4. HELPER FUNCTION (used by RLS policies)
-- ============================================================
create or replace function public.user_organization_ids()
returns setof uuid language sql stable security definer as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
$$;

-- ============================================================
-- 5. ORGANIZATIONS RLS (needs helper function)
-- ============================================================
create policy "organizations: member select"
  on public.organizations for select
  using (id in (select public.user_organization_ids()));

-- ============================================================
-- 6. BRANCHES
-- ============================================================
create table public.branches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  name            text not null,
  slug            text not null,
  address         text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, slug)
);

alter table public.branches enable row level security;

create policy "branches: member select"
  on public.branches for select
  using (organization_id in (select public.user_organization_ids()));

create policy "branches: owner/manager insert"
  on public.branches for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

create policy "branches: owner/manager update"
  on public.branches for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

create policy "branches: owner/manager delete"
  on public.branches for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

-- ============================================================
-- 7. FEEDBACK SUBMISSIONS
-- ============================================================
create table public.feedback_submissions (
  id               uuid primary key default gen_random_uuid(),
  branch_id        uuid not null references public.branches on delete cascade,
  type             text not null check (type in ('complaint', 'suggestion', 'compliment', 'recommendation')),
  emotion_score    smallint not null check (emotion_score between 1 and 5),
  csat_score       smallint check (csat_score between 1 and 5),
  nps_score        smallint check (nps_score between 0 and 10),
  free_text        text not null,
  contact_name     text,
  contact_phone    text,
  contact_email    text,
  consent_accepted boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.feedback_submissions enable row level security;

-- Anonymous INSERT: anyone with anon key can submit feedback
create policy "feedback_submissions: anon insert"
  on public.feedback_submissions for insert
  with check (consent_accepted = true);

-- SELECT: only members of the org that owns the branch
create policy "feedback_submissions: member select"
  on public.feedback_submissions for select
  using (
    branch_id in (
      select id from public.branches
      where organization_id in (select public.user_organization_ids())
    )
  );

-- ============================================================
-- 8. AI ANALYSES
-- ============================================================
create table public.ai_analyses (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null unique references public.feedback_submissions on delete cascade,
  status             text not null check (status in ('completed', 'disabled', 'unavailable')),
  sentiment          text check (sentiment in ('positive', 'neutral', 'negative')),
  polarity           numeric(5, 3),
  urgency            text check (urgency in ('low', 'medium', 'high', 'critical')),
  category           text,
  summary            text,
  recommended_action text,
  keywords           text[] not null default '{}',
  entities           text[] not null default '{}',
  model_used         text,
  confidence         numeric(5, 4),
  created_at         timestamptz not null default now()
);

alter table public.ai_analyses enable row level security;

create policy "ai_analyses: member select"
  on public.ai_analyses for select
  using (
    submission_id in (
      select id from public.feedback_submissions
      where branch_id in (
        select id from public.branches
        where organization_id in (select public.user_organization_ids())
      )
    )
  );

-- ============================================================
-- 9. LISTENING EVENTS
-- ============================================================
create table public.listening_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  branch_id       uuid references public.branches on delete set null,
  user_id         uuid not null references public.profiles on delete cascade,
  level           text not null check (level in ('download', 'debate', 'empathetic_listening', 'generative_dialogue')),
  note            text check (char_length(note) <= 500),
  created_at      timestamptz not null default now()
);

alter table public.listening_events enable row level security;

create policy "listening_events: member select"
  on public.listening_events for select
  using (organization_id in (select public.user_organization_ids()));

create policy "listening_events: member insert"
  on public.listening_events for insert
  with check (
    organization_id in (select public.user_organization_ids())
    and user_id = auth.uid()
  );

-- ============================================================
-- 10. RPC: create_user_organization (atomic sign-up)
-- Runs as SECURITY DEFINER to bypass RLS during onboarding.
-- ============================================================
create or replace function public.create_user_organization(
  p_user_id     uuid,
  p_full_name   text,
  p_org_name    text,
  p_org_slug    text
)
returns uuid language plpgsql security definer as $$
declare
  v_org_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (p_user_id, p_full_name);

  insert into public.organizations (name, slug)
  values (p_org_name, p_org_slug)
  returning id into v_org_id;

  insert into public.organization_members (user_id, organization_id, role)
  values (p_user_id, v_org_id, 'owner');

  return v_org_id;
end;
$$;
```

- [ ] **Step 2: Apply the migration**

Open the Supabase dashboard → your project → SQL Editor. Paste the full content of `supabase/migrations/001_initial_schema.sql` and click **Run**. Verify no errors appear.

- [ ] **Step 3: Verify tables exist**

In the Supabase dashboard → Table Editor, confirm these tables appear: `profiles`, `organizations`, `organization_members`, `branches`, `feedback_submissions`, `ai_analyses`, `listening_events`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add initial database schema with RLS and sign-up RPC"
```

---

## Task 2: Service role client + env helper

**Files:**
- Modify: `src/lib/supabase/env.ts`
- Create: `src/lib/supabase/service.ts`

- [ ] **Step 1: Add `getSupabaseServiceEnv` to env.ts**

Open `src/lib/supabase/env.ts`. The current file has `getSupabasePublicEnv`. Add the new function at the bottom:

```ts
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}

export function getSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}
```

- [ ] **Step 2: Create `src/lib/supabase/service.ts`**

```ts
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseServiceEnv } from "./env";

export function createServiceClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
```

- [ ] **Step 3: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local`**

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard
```

Find it in Supabase → Project Settings → API → `service_role` key. **Never prefix with `NEXT_PUBLIC_`.**

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/env.ts src/lib/supabase/service.ts
git commit -m "feat: add service role client for trusted server-side operations"
```

---

## Task 3: Database types

**Files:**
- Create: `src/lib/supabase/database.types.ts`

The ideal flow is `npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts`. For now we define a minimal hand-written version that matches the schema. **Replace this with the generated file once you install the Supabase CLI.**

- [ ] **Step 1: Create `src/lib/supabase/database.types.ts`**

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      organization_members: {
        Row: {
          user_id: string;
          organization_id: string;
          role: "owner" | "manager" | "collaborator";
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          role: "owner" | "manager" | "collaborator";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "manager" | "collaborator";
        };
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          address?: string | null;
          is_active?: boolean;
        };
      };
      feedback_submissions: {
        Row: {
          id: string;
          branch_id: string;
          type: "complaint" | "suggestion" | "compliment" | "recommendation";
          emotion_score: number;
          csat_score: number | null;
          nps_score: number | null;
          free_text: string;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          consent_accepted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          type: "complaint" | "suggestion" | "compliment" | "recommendation";
          emotion_score: number;
          csat_score?: number | null;
          nps_score?: number | null;
          free_text: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          consent_accepted: boolean;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      ai_analyses: {
        Row: {
          id: string;
          submission_id: string;
          status: "completed" | "disabled" | "unavailable";
          sentiment: "positive" | "neutral" | "negative" | null;
          polarity: number | null;
          urgency: "low" | "medium" | "high" | "critical" | null;
          category: string | null;
          summary: string | null;
          recommended_action: string | null;
          keywords: string[];
          entities: string[];
          model_used: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          status: "completed" | "disabled" | "unavailable";
          sentiment?: "positive" | "neutral" | "negative" | null;
          polarity?: number | null;
          urgency?: "low" | "medium" | "high" | "critical" | null;
          category?: string | null;
          summary?: string | null;
          recommended_action?: string | null;
          keywords?: string[];
          entities?: string[];
          model_used?: string | null;
          confidence?: number | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      listening_events: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          user_id: string;
          level: "download" | "debate" | "empathetic_listening" | "generative_dialogue";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          user_id: string;
          level: "download" | "debate" | "empathetic_listening" | "generative_dialogue";
          note?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Functions: {
      user_organization_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      create_user_organization: {
        Args: {
          p_user_id: string;
          p_full_name: string;
          p_org_name: string;
          p_org_slug: string;
        };
        Returns: string;
      };
    };
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "feat: add hand-written database types (replace with generated once CLI is set up)"
```

---

## Task 4: Organizations domain — schemas + repository

**Files:**
- Create: `src/domain/organizations/schemas.ts`
- Create: `src/domain/organizations/repository.ts`

- [ ] **Step 1: Write the failing test for `getOrganizationByUser`**

Create `src/domain/organizations/repository.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { getOrganizationByUser } from "./repository";

function makeClient(data: unknown, error: unknown = null) {
  const selectMock = vi.fn().mockResolvedValue({ data, error });
  const eqMock = vi.fn().mockReturnValue({ select: () => selectMock });
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    }),
    rpc: vi.fn(),
  } as unknown as Parameters<typeof getOrganizationByUser>[0];
}

describe("getOrganizationByUser", () => {
  it("returns the first organization for the user", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ organizations: { id: "org-1", name: "Cafe Central", slug: "cafe-central", created_at: "2026-01-01" } }],
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getOrganizationByUser>[0];

    const result = await getOrganizationByUser(client, "user-1");
    expect(result).toMatchObject({ id: "org-1", name: "Cafe Central" });
  });

  it("returns null when user has no organization", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getOrganizationByUser>[0];

    const result = await getOrganizationByUser(client, "user-1");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/domain/organizations/repository.test.ts
```

Expected: FAIL — "Cannot find module './repository'"

- [ ] **Step 3: Create `src/domain/organizations/schemas.ts`**

```ts
import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160),
  created_at: z.string(),
});

export const organizationMemberSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.enum(["owner", "manager", "collaborator"]),
  created_at: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type MemberRole = OrganizationMember["role"];
```

- [ ] **Step 4: Create `src/domain/organizations/repository.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Organization } from "./schemas";

type Client = SupabaseClient<Database>;

export async function getOrganizationByUser(
  client: Client,
  userId: string,
): Promise<Organization | null> {
  const { data, error } = await client
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) return null;

  const first = data[0] as { organizations: Organization };
  return first.organizations ?? null;
}

export async function createUserOrganization(
  client: Client,
  params: {
    userId: string;
    fullName: string;
    orgName: string;
    orgSlug: string;
  },
): Promise<string> {
  const { data, error } = await client.rpc("create_user_organization", {
    p_user_id: params.userId,
    p_full_name: params.fullName,
    p_org_name: params.orgName,
    p_org_slug: params.orgSlug,
  });

  if (error) throw new Error(`Failed to create organization: ${error.message}`);

  return data as string;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/domain/organizations/repository.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/domain/organizations/
git commit -m "feat: add organizations domain schemas and repository"
```

---

## Task 5: Branches domain — schemas + repository

**Files:**
- Create: `src/domain/branches/schemas.ts`
- Create: `src/domain/branches/repository.ts`
- Create: `src/domain/branches/repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/domain/branches/repository.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { getBranchesByOrganization, getBranchBySlug } from "./repository";

function makeSelectChain(data: unknown, error: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  } as unknown as Parameters<typeof getBranchesByOrganization>[0];
}

describe("getBranchesByOrganization", () => {
  it("returns branches for the organization", async () => {
    const client = makeSelectChain([
      { id: "b-1", organization_id: "org-1", name: "Mall Norte", slug: "mall-norte", address: null, is_active: true, created_at: "2026-01-01" },
    ]);

    const result = await getBranchesByOrganization(client, "org-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "b-1", name: "Mall Norte" });
  });

  it("returns empty array when org has no branches", async () => {
    const client = makeSelectChain([]);
    const result = await getBranchesByOrganization(client, "org-1");
    expect(result).toEqual([]);
  });
});

describe("getBranchBySlug", () => {
  it("returns the branch matching slug within an org", async () => {
    const branchData = { id: "b-1", organization_id: "org-1", name: "Mall Norte", slug: "mall-norte", address: null, is_active: true, created_at: "2026-01-01" };
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: branchData, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getBranchBySlug>[0];

    const result = await getBranchBySlug(client, "org-1", "mall-norte");
    expect(result).toMatchObject({ id: "b-1", slug: "mall-norte" });
  });

  it("returns null when slug is not found", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getBranchBySlug>[0];

    const result = await getBranchBySlug(client, "org-1", "nonexistent");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/domain/branches/repository.test.ts
```

Expected: FAIL — "Cannot find module './repository'"

- [ ] **Step 3: Create `src/domain/branches/schemas.ts`**

```ts
import { z } from "zod";

export const branchSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160),
  address: z.string().max(320).nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const createBranchInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().max(320).optional(),
});

export type Branch = z.infer<typeof branchSchema>;
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;
```

- [ ] **Step 4: Create `src/domain/branches/repository.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Branch, CreateBranchInput } from "./schemas";

type Client = SupabaseClient<Database>;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getBranchesByOrganization(
  client: Client,
  organizationId: string,
): Promise<Branch[]> {
  const { data, error } = await client
    .from("branches")
    .select("*")
    .eq("organization_id", organizationId);

  if (error || !data) return [];
  return data as Branch[];
}

export async function getBranchBySlug(
  client: Client,
  organizationId: string,
  slug: string,
): Promise<Branch | null> {
  const { data, error } = await client
    .from("branches")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as Branch;
}

export async function createBranch(
  client: Client,
  organizationId: string,
  input: CreateBranchInput,
): Promise<Branch> {
  const slug = toSlug(input.name);
  const { data, error } = await client
    .from("branches")
    .insert({
      organization_id: organizationId,
      name: input.name,
      slug,
      address: input.address ?? null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create branch: ${error?.message}`);
  return data as Branch;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/domain/branches/repository.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/domain/branches/
git commit -m "feat: add branches domain schemas and repository"
```

---

## Task 6: Feedback repository

**Files:**
- Create: `src/domain/feedback/repository.ts`
- Create: `src/domain/feedback/repository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/domain/feedback/repository.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

import { insertFeedbackSubmission } from "./repository";

describe("insertFeedbackSubmission", () => {
  it("inserts feedback and returns the new row id", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "fb-1" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof insertFeedbackSubmission>[0];

    const result = await insertFeedbackSubmission(client, {
      branch_id: "b-1",
      type: "suggestion",
      emotion_score: 4,
      csat_score: null,
      nps_score: null,
      free_text: "El servicio estuvo muy bien.",
      contact_name: null,
      contact_phone: null,
      contact_email: null,
      consent_accepted: true,
    });

    expect(result).toBe("fb-1");
  });

  it("throws when insert fails", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "DB error" },
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof insertFeedbackSubmission>[0];

    await expect(
      insertFeedbackSubmission(client, {
        branch_id: "b-1",
        type: "complaint",
        emotion_score: 1,
        csat_score: null,
        nps_score: null,
        free_text: "Muy mal servicio.",
        contact_name: null,
        contact_phone: null,
        contact_email: null,
        consent_accepted: true,
      }),
    ).rejects.toThrow("DB error");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/domain/feedback/repository.test.ts
```

Expected: FAIL — "Cannot find module './repository'"

- [ ] **Step 3: Create `src/domain/feedback/repository.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { AiAnalysis } from "./schemas";

type Client = SupabaseClient<Database>;

type FeedbackInsert = Database["public"]["Tables"]["feedback_submissions"]["Insert"];

export async function insertFeedbackSubmission(
  client: Client,
  payload: Omit<FeedbackInsert, "id" | "created_at">,
): Promise<string> {
  const { data, error } = await client
    .from("feedback_submissions")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to insert feedback");
  return data.id;
}

export async function insertAiAnalysis(
  client: Client,
  submissionId: string,
  result: {
    status: "completed" | "disabled" | "unavailable";
    model: string;
    analysis?: AiAnalysis;
    confidence?: number;
  },
): Promise<void> {
  const row = {
    submission_id: submissionId,
    status: result.status,
    model_used: result.model,
    sentiment: result.analysis?.sentiment ?? null,
    polarity: result.analysis?.polarity ?? null,
    urgency: result.analysis?.urgency ?? null,
    category: result.analysis?.category ?? null,
    summary: result.analysis?.summary ?? null,
    recommended_action: result.analysis?.recommendedAction ?? null,
    keywords: result.analysis?.keywords ?? [],
    entities: result.analysis?.entities ?? [],
    confidence: result.confidence ?? null,
  };

  const { error } = await client.from("ai_analyses").insert(row);
  if (error) throw new Error(`Failed to insert AI analysis: ${error.message}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/domain/feedback/repository.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/domain/feedback/repository.ts src/domain/feedback/repository.test.ts
git commit -m "feat: add feedback repository with submission and AI analysis persistence"
```

---

## Task 7: Wire sign-up to create organization

**Files:**
- Modify: `src/app/auth/actions.ts`

The `signUpAction` currently calls `supabase.auth.signUp()` and redirects. We need it to also call the `create_user_organization` RPC after a successful sign-up.

- [ ] **Step 1: Update `signUpAction` in `src/app/auth/actions.ts`**

Replace the entire file content:

```ts
"use server";

import { redirect } from "next/navigation";

import {
  getSafeRedirectPath,
  signInSchema,
  signUpSchema,
} from "@/domain/auth/schemas";
import { createUserOrganization } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error";
  message?: string;
};

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_credentials");
  }

  if (!hasSupabasePublicEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect("/login?error=auth_failed");
  }

  redirect(getSafeRedirectPath(formData.get("redirectTo")?.toString()));
}

export async function signUpAction(formData: FormData): Promise<void> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_signup");
  }

  if (!hasSupabasePublicEnv()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName,
      },
    },
  });

  if (authError || !authData.user) {
    redirect("/login?error=signup_failed");
  }

  const orgSlug = parsed.data.companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    await createUserOrganization(supabase, {
      userId: authData.user.id,
      fullName: parsed.data.fullName,
      orgName: parsed.data.companyName,
      orgSlug,
    });
  } catch {
    redirect("/login?error=org_creation_failed");
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (!hasSupabasePublicEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Run the full test suite to make sure nothing broke**

```bash
npx vitest run
```

Expected: all existing tests pass. The auth/actions file has no unit tests, but the route and login tests must remain green.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/actions.ts
git commit -m "feat: call create_user_organization RPC on sign-up"
```

---

## Task 8: Wire feedback API to persist to database

**Files:**
- Modify: `src/app/api/feedback/route.ts`

The route currently validates, runs sentiment analysis, and returns — nothing is saved. We add persistence using the service role client so it works without user auth.

The route needs to:
1. Find the branch by slug (requires knowing the org — but the feedback form only sends `branchSlug`, not `orgId`). Solution: query `branches` by `slug` alone using service role (which bypasses RLS). The slug is unique per org but not globally, so we return the first active match. In production this will be resolved by encoding `orgId` in the QR URL, but for MVP the slug is treated as globally unique by convention (owners choose unique slugs).
2. Insert `feedback_submissions`.
3. Insert `ai_analyses` if analysis completed.

- [ ] **Step 1: Update `src/app/api/feedback/route.ts`**

```ts
import { insertAiAnalysis, insertFeedbackSubmission } from "@/domain/feedback/repository";
import { analyzeFeedbackSentiment } from "@/domain/feedback/sentiment-analysis";
import { feedbackSubmissionSchema } from "@/domain/feedback/schemas";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { status: "error", message: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = feedbackSubmissionSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        status: "error",
        message: "Invalid feedback payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const sentimentAnalysis = await analyzeFeedbackSentiment(parsed.data);

  // Persist to database if service role key is configured
  const serviceKeyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (serviceKeyConfigured) {
    try {
      const db = createServiceClient();

      // Find branch by slug (service role bypasses RLS)
      const { data: branch } = await db
        .from("branches")
        .select("id")
        .eq("slug", parsed.data.branchSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (branch) {
        const submissionId = await insertFeedbackSubmission(db, {
          branch_id: branch.id,
          type: parsed.data.type,
          emotion_score: parsed.data.emotionScore,
          csat_score: parsed.data.csatScore ?? null,
          nps_score: parsed.data.npsScore ?? null,
          free_text: parsed.data.freeText,
          contact_name: parsed.data.contact?.name ?? null,
          contact_phone: parsed.data.contact?.phone ?? null,
          contact_email: parsed.data.contact?.email ?? null,
          consent_accepted: parsed.data.consentAccepted,
        });

        await insertAiAnalysis(db, submissionId, {
          status: sentimentAnalysis.status,
          model: sentimentAnalysis.model,
          analysis: sentimentAnalysis.status === "completed" ? sentimentAnalysis.analysis : undefined,
          confidence: sentimentAnalysis.status === "completed" ? sentimentAnalysis.confidence : undefined,
        });
      }
    } catch {
      // Persistence failure is non-blocking — we still return 202
    }
  }

  return Response.json(
    {
      status: "accepted",
      analysisStatus: sentimentAnalysis.status,
      sentimentAnalysis,
      feedback: {
        branchSlug: parsed.data.branchSlug,
        type: parsed.data.type,
        emotionScore: parsed.data.emotionScore,
        csatScore: parsed.data.csatScore,
      },
    },
    { status: 202 },
  );
}
```

- [ ] **Step 2: Run the feedback route tests**

```bash
npx vitest run src/app/api/feedback/route.test.ts
```

Expected: all 3 existing tests pass. The persistence code only runs when `SUPABASE_SERVICE_ROLE_KEY` is set, so the tests (which don't set it) are unaffected.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/feedback/route.ts
git commit -m "feat: persist feedback submissions and AI analyses to database"
```

---

## Task 9: Connect dashboard to real data

**Files:**
- Modify: `src/app/dashboard/page.tsx`

The dashboard currently renders `<DashboardShell />` with no data from the DB. We pass the user's organization and branches to the shell so it can display real data (or fall back to demo mode).

- [ ] **Step 1: Update `src/app/dashboard/page.tsx`**

```tsx
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getBranchesByOrganization } from "@/domain/branches/repository";
import { getOrganizationByUser } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabasePublicEnv()) {
    return <DashboardShell />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const branches = organization
    ? await getBranchesByOrganization(supabase, organization.id)
    : [];

  return (
    <DashboardShell
      organizationName={organization?.name}
      branches={branches}
    />
  );
}
```

- [ ] **Step 2: Update `DashboardShell` props in `src/components/dashboard/dashboard-shell.tsx`**

Add the new optional props to the component signature. The shell already works without them (demo mode), so this is additive. Find the `export function DashboardShell()` line and update it:

```tsx
import type { Branch } from "@/domain/branches/schemas";

type DashboardShellProps = {
  organizationName?: string;
  branches?: Branch[];
};

export function DashboardShell({
  organizationName,
  branches = [],
}: DashboardShellProps) {
```

The rest of the file stays identical. The `organizationName` and `branches` props are now available inside the shell for display — wiring them to specific UI sections is a follow-up task.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/dashboard/dashboard-shell.tsx
git commit -m "feat: pass organization and branches from DB to dashboard shell"
```

---

## Self-review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Schema: all 6 tables + RLS + helper fn + RPC | Task 1 |
| Service role client | Task 2 |
| Database types | Task 3 |
| Organizations repository | Task 4 |
| Branches repository | Task 5 |
| Feedback repository | Task 6 |
| Sign-up creates org atomically | Task 7 |
| Feedback API persists to DB | Task 8 |
| Dashboard connected to real data | Task 9 |
| `SUPABASE_SERVICE_ROLE_KEY` env var | Task 2 step 3 |

**Placeholder scan:** No TBDs or vague steps. All code shown in full. ✓

**Type consistency:**
- `insertFeedbackSubmission` uses `FeedbackInsert` from `database.types.ts` — consistent with `feedback_submissions.Insert`. ✓
- `getOrganizationByUser` returns `Organization` from `organizations/schemas.ts` — used in `dashboard/page.tsx`. ✓
- `getBranchesByOrganization` returns `Branch[]` from `branches/schemas.ts` — passed as `branches` prop to `DashboardShell`. ✓
- `createUserOrganization` params match the RPC args in `database.types.ts`. ✓
