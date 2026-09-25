type EnvLike = {
  NODE_ENV?: string;
};

export function isGuidedDemoEnabled(env: EnvLike = process.env) {
  return env.NODE_ENV !== "production";
}

export function landingLoginCtaLabel(env: EnvLike = process.env) {
  return isGuidedDemoEnabled(env) ? "Entrar a la demo" : "Iniciar sesión";
}
