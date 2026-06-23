import {
  Building2,
  Mail,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { signInAction, signUpAction } from "@/app/auth/actions";
import { REGISTRATION_ENABLED } from "@/domain/auth/config";

import { LoginSubmitButton } from "./login-submit-button";
import { LoginPasswordField } from "./login-password-field";

type LoginViewProps = {
  mode?: "login" | "registro";
  redirectTo?: string;
  errorCode?: string;
};

const errorMessages: Record<string, string> = {
  auth_failed: "Correo o contrasena incorrectos.",
  invalid_credentials: "Revisa tu correo y contrasena.",
  auth_callback_failed: "El enlace expiro o ya fue usado. Solicita uno nuevo.",
  rate_limited: "Demasiados intentos. Espera unos minutos.",
  supabase_not_configured: "Autenticacion no configurada.",
  registration_disabled: "El registro publico esta desactivado.",
};

export function LoginView({
  mode = "login",
  redirectTo,
  errorCode,
}: LoginViewProps) {
  const isRegisterMode = REGISTRATION_ENABLED && mode === "registro";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#06100d_0%,#091612_100%)] text-white">
      <section className="grid min-h-screen overflow-hidden bg-[url('/images/auth-rustic-business.webp')] bg-cover bg-center lg:grid-cols-[1fr_1.02fr]">
        <form
          action={isRegisterMode ? signUpAction : signInAction}
          className="flex min-h-[660px] flex-col bg-[#06100d]/82 px-6 py-7 shadow-[24px_0_80px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:px-10 lg:min-h-0 lg:px-16"
        >
          <div className="mx-auto flex h-full w-full max-w-xl flex-col">
            <h1 className="sr-only">Perks. Escucha mejor y actua a tiempo.</h1>
            <div className="flex justify-start">
              <img
                src="/brand/perks-logo-white.png"
                alt="Perks"
                className="h-11 w-auto sm:h-12"
              />
            </div>

            <div className="my-auto py-10">
              <div className="text-left">
                <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                  {isRegisterMode ? "Crea tu cuenta" : "Bienvenido de nuevo"}
                </h2>
                <p className="mt-4 max-w-sm text-base leading-7 text-white/55">
                  {isRegisterMode
                    ? "Configura tu empresa y empieza a organizar la experiencia de tus clientes."
                    : "Accede a tu espacio de trabajo y continua gestionando tu experiencia en Perks."}
                </p>
              </div>

              {errorCode ? (
                <p className="mt-6 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {errorMessages[errorCode] ?? "No se pudo iniciar sesion."}
                </p>
              ) : null}

              {REGISTRATION_ENABLED ? (
                <div className="mt-7 grid h-12 grid-cols-2 rounded-lg border border-white/10 bg-white/15 p-1">
                  <Link
                    href="/login"
                    className={`inline-flex items-center justify-center rounded-md text-sm font-semibold transition ${
                      isRegisterMode
                        ? "text-white/55 hover:text-white"
                        : "bg-[#07100d] text-white shadow-sm"
                    }`}
                  >
                    Iniciar sesion
                  </Link>
                  <Link
                    href="/login?mode=registro"
                    className={`inline-flex items-center justify-center rounded-md text-sm font-semibold transition ${
                      isRegisterMode
                        ? "bg-[#07100d] text-white shadow-sm"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    Registrarse
                  </Link>
                </div>
              ) : null}

              {!isRegisterMode ? (
                <input type="hidden" name="redirectTo" value={redirectTo} />
              ) : null}

              <div className="mt-8 space-y-5">
                {isRegisterMode ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-white/75">
                        Nombre completo
                      </span>
                      <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
                        <UserRound
                          size={21}
                          className="shrink-0 text-white/55"
                          aria-hidden="true"
                        />
                        <input
                          className="h-full w-full bg-transparent text-base text-white outline-none placeholder:text-white/45"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-white/75">
                        Empresa
                      </span>
                      <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
                        <Building2
                          size={21}
                          className="shrink-0 text-white/55"
                          aria-hidden="true"
                        />
                        <input
                          className="h-full w-full bg-transparent text-base text-white outline-none placeholder:text-white/45"
                          name="companyName"
                          type="text"
                          placeholder="Nombre de empresa"
                          required
                        />
                      </div>
                    </label>
                  </>
                ) : null}

                <label className="block">
                  <span className="text-sm font-semibold text-white/75">
                    Correo electronico
                  </span>
                  <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
                    <Mail
                      size={21}
                      className="shrink-0 text-white/55"
                      aria-hidden="true"
                    />
                    <input
                      className="h-full w-full bg-transparent text-base text-white outline-none placeholder:text-white/45"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@empresa.com"
                      required
                    />
                  </div>
                </label>

                <LoginPasswordField
                  autoComplete={
                    isRegisterMode ? "new-password" : "current-password"
                  }
                  placeholder={
                    isRegisterMode ? "Minimo 8 caracteres" : "Tu contrasena"
                  }
                />
              </div>

              {!isRegisterMode ? (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-3 text-sm font-semibold text-white/85">
                    <input
                      type="checkbox"
                      name="remember"
                      className="size-5 rounded border-white/10 bg-[#2b3732] accent-emerald-400"
                    />
                    Recordarme
                  </label>
                  {REGISTRATION_ENABLED ? (
                    <Link
                      href="/login?mode=registro"
                      className="text-sm font-semibold text-emerald-300 underline-offset-4 transition hover:text-emerald-200 hover:underline"
                    >
                      Crear cuenta
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <LoginSubmitButton
                label={isRegisterMode ? "Crear cuenta" : "Iniciar sesion"}
                pendingLabel={isRegisterMode ? "Creando cuenta..." : "Ingresando..."}
              />

              {!isRegisterMode ? (
                <p className="mt-5 text-left text-sm text-white/50">
                  ¿Olvidaste tu contrasena? Pide ayuda a tu gerente.
                </p>
              ) : null}

              <p className="mt-5 text-left text-xs leading-5 text-white/45">
                Al continuar aceptas nuestros{" "}
                <span className="font-semibold text-white/70">Términos de uso</span>
                {" "}y{" "}
                <span className="font-semibold text-white/70">
                  Política de Privacidad
                </span>
                .
              </p>
            </div>
          </div>
        </form>

        <aside className="hidden min-h-[660px] text-white lg:block">
          <div className="relative h-full overflow-hidden bg-[#0a1b16]">
            <div className="absolute inset-0 bg-[url('/images/auth-rustic-business.webp')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(3,14,11,0.88)_0%,rgba(6,22,18,0.34)_24%,rgba(8,28,23,0.18)_44%,rgba(10,38,34,0.36)_62%,rgba(12,53,52,0.88)_100%)]" />
          </div>
        </aside>
      </section>
    </main>
  );
}
