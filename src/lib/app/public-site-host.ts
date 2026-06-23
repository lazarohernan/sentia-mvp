export function getPublicSiteHost(requestHost?: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    try {
      return new URL(appUrl).host;
    } catch {
      // Fall back to request host below.
    }
  }

  return requestHost ?? null;
}
