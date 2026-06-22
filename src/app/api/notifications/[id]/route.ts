import { NextResponse } from "next/server";

import {
  deleteNotification,
  getNotificationById,
  isListeningSurveyNotification,
} from "@/domain/notifications/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
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

  const notification = await getNotificationById(supabase, id);

  if (!notification) {
    return NextResponse.json({ error: "Notificacion no encontrada." }, { status: 404 });
  }

  if (isListeningSurveyNotification(notification)) {
    return NextResponse.json(
      {
        error:
          "Esta evaluacion de escucha no se puede eliminar. Desaparecera cuando el colaborador la complete.",
      },
      { status: 403 },
    );
  }

  const deleted = await deleteNotification(supabase, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "No se pudo eliminar la notificacion." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok" });
}
