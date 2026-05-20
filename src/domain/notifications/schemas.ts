import type { Database } from "@/lib/supabase/database.types";

export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationDraft = {
  dedupeKey: string;
  organizationId: string;
  branchId?: string | null;
  audienceType: NotificationInsert["audience_type"];
  audienceRole?: NotificationInsert["audience_role"];
  category: NotificationInsert["category"];
  tone: NotificationInsert["tone"];
  title: string;
  detail: string;
  href: string;
  sourceTable?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
};
