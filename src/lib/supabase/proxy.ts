import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hasSupabasePublicEnv } from "./config";
import { getSupabasePublicEnv } from "./env";

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/colaborador",
  "/inicio",
  "/escucha",
  "/auth/activar-cuenta",
] as const;

function isProtectedPage(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildLoginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPage = isProtectedPage(pathname);

  if (!hasSupabasePublicEnv()) {
    if (protectedPage) {
      return buildLoginRedirect(request, pathname);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedPage && !user) {
    return buildLoginRedirect(request, pathname);
  }

  return response;
}
