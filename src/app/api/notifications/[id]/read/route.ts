import { NextResponse } from "next/server";

import { markNotificationAsRead } from "@/domain/notifications/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado." },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Notificacion invalida." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const updated = await markNotificationAsRead(supabase, id);

  if (!updated) {
    return NextResponse.json(
      { error: "No se pudo marcar la notificacion como leida." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok" });
}
