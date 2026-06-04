import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Branch, CreateBranchInput, UpdateBranchInput } from "./schemas";

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

export async function getActiveBranchBySlug(
  client: Client,
  slug: string,
): Promise<Branch | null> {
  const { data, error } = await client
    .from("branches")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Branch;
}

export async function getActiveBranchById(
  client: Client,
  branchId: string,
): Promise<Branch | null> {
  const { data, error } = await client
    .from("branches")
    .select("*")
    .eq("id", branchId)
    .eq("is_active", true)
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
  const payload: Database["public"]["Tables"]["branches"]["Insert"] = {
    organization_id: organizationId,
    name: input.name,
    slug,
    address: input.address ?? null,
  };
  const { data, error } = await client
    .from("branches")
    .insert(payload as never)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create branch: ${error?.message}`);
  return data as Branch;
}

export async function updateBranch(
  client: Client,
  organizationId: string,
  input: UpdateBranchInput,
): Promise<Branch> {
  const payload: Database["public"]["Tables"]["branches"]["Update"] = {
    name: input.name,
    slug: toSlug(input.name),
    address: input.address ?? null,
    is_active: input.is_active,
  };
  const { data, error } = await client
    .from("branches")
    .update(payload as never)
    .eq("organization_id", organizationId)
    .eq("id", input.id)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to update branch: ${error?.message}`);
  return data as Branch;
}
