import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ActivarCuentaView } from "./activar-cuenta-view";

export const dynamic = "force-dynamic";

type ActivarCuentaPageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
  }>;
};

export default async function ActivarCuentaPage({ searchParams }: ActivarCuentaPageProps) {
  const params = await searchParams;
  const mode = params.mode === "reset" ? "reset" : "invite";

  if (!hasSupabasePublicEnv()) {
    return (
      <ActivarCuentaView
        email=""
        fullName=""
        errorCode="supabase_not_configured"
        mode={mode}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/auth/activar-cuenta");
  }

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user.email?.split("@")[0] ||
    "Colaborador";

  return (
    <ActivarCuentaView
      email={user.email ?? ""}
      fullName={fullName}
      errorCode={params.error}
      mode={mode}
    />
  );
}
