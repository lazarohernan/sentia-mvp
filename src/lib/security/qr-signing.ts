export function getQrSigningSecret() {
  const secret =
    process.env.QR_SIGNING_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error("QR signing secret is not configured.");
  }

  return secret;
}

export function hasQrSigningSecret() {
  return Boolean(
    process.env.QR_SIGNING_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
