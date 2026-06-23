import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import {
  disablePushSubscription,
  upsertPushSubscription,
} from "@/domain/push/repository";
import { sanitizeOptionalTextInput } from "@/lib/security/input";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const subscribeBodySchema = z.object({
  subscription: subscriptionSchema,
  deviceLabel: z
    .string()
    .optional()
    .transform(sanitizeOptionalTextInput)
    .refine((value) => value === undefined || value.length <= 120),
});

const unsubscribeBodySchema = z.object({
  endpoint: z.url(),
});

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    supabase,
    user,
    membership,
  };
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  if ("error" in auth) {
    return auth.error;
  }

  const body = subscribeBodySchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json({ error: "Invalid push subscription payload" }, { status: 400 });
  }

  await upsertPushSubscription(auth.supabase, {
    organizationId: auth.membership.organizationId,
    userId: auth.user.id,
    endpoint: body.data.subscription.endpoint,
    subscription: body.data.subscription,
    deviceLabel: body.data.deviceLabel,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();

  if ("error" in auth) {
    return auth.error;
  }

  const body = unsubscribeBodySchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json({ error: "Invalid push endpoint payload" }, { status: 400 });
  }

  await disablePushSubscription(auth.supabase, {
    organizationId: auth.membership.organizationId,
    userId: auth.user.id,
    endpoint: body.data.endpoint,
  });

  return NextResponse.json({ ok: true });
}
