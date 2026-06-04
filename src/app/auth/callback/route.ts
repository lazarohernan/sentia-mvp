import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSafeRedirectPath } from "@/domain/auth/redirects";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function redirectToLogin(requestUrl: URL, error = "auth_callback_failed") {
  return NextResponse.redirect(new URL(`/login?error=${error}`, requestUrl.origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (!hasSupabasePublicEnv()) {
    return redirectToLogin(requestUrl, "supabase_not_configured");
  }

  if (!code && !(tokenHash && type)) {
    return redirectToLogin(requestUrl);
  }

  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();
  const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const authResult = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type!,
      });

  if (authResult.error) {
    return redirectToLogin(requestUrl);
  }

  return response;
}
