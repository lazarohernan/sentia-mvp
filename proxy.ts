import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/colaborador",
    "/colaborador/:path*",
    "/inicio",
    "/escucha",
    "/escucha/:path*",
    "/auth/:path*",
    "/api/:path*",
  ],
};
