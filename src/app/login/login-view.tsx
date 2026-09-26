import {
  Building2,
  Mail,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { signInAction, signUpAction } from "@/app/auth/actions";
import { REGISTRATION_ENABLED } from "@/domain/auth/config";

import { LoginSubmitButton } from "./login-submit-button";
import { LoginPasswordField } from "./login-password-field";
import styles from "./login-input.module.css";

type LoginViewProps = {
  mode?: "login" | "registro";
  redirectTo?: string;
  errorCode?: string;
  statusCode?: string;
};

const errorMessages: Record<string, string> = {
  auth_failed: "Correo o contrasena incorrectos.",
  invalid_credentials: "Revisa tu correo y contrasena.",
  auth_callback_failed: "El enlace expiro o ya fue usado. Solicita uno nuevo.",
  rate_limited: "Demasiados intentos. Espera unos minutos.",
  supabase_not_configured: "Autenticacion no configurada.",
  registration_disabled: "El registro publico esta desactivado.",
};

const statusMessages: Record<string, string> = {
  account_activated:
    "Tu contraseña quedó lista. Inicia sesión con tu correo y contraseña.",
};

export function LoginView({
  mode = "login",
  redirectTo,
  errorCode,
  statusCode,
}: LoginViewProps) {
  const isRegisterMode = REGISTRATION_ENABLED && mode === "registro";

  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-[#e8f0e8] text-[#12362d]">
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/auth/perks-login-background-v3.svg')] bg-cover bg-center" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[url('/images/auth-rustic-business.webp')] bg-cover bg-center opacity-[0.03] grayscale" aria-hidden="true" />
      <section className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1180px] items-center justify-center px-5 py-10 sm:px-8">
        <div className={`pointer-events-none absolute inset-0 hidden lg:block ${styles.decorEnter}`} aria-hidden="true">
          <Image src="/images/auth/qr-stand.webp" alt="" width={640} height={640} className="absolute left-[11%] top-[17%] h-auto w-[118px] -rotate-6 xl:left-[12%] xl:w-[132px]" />
          <Image src="/images/auth/opiniones.webp" alt="" width={640} height={640} className="absolute bottom-[16%] left-[10%] h-auto w-[118px] rotate-6 xl:left-[11%] xl:w-[132px]" />
          <Image src="/images/auth/escucha.webp" alt="" width={640} height={640} className="absolute right-[11%] top-[17%] h-auto w-[124px] rotate-6 xl:right-[12%] xl:w-[138px]" />
          <Image src="/images/auth/mejoras.webp" alt="" width={640} height={640} className="absolute bottom-[16%] right-[10%] h-auto w-[120px] -rotate-6 xl:right-[11%] xl:w-[134px]" />
        </div>
        <div className={`relative z-10 flex w-full max-w-[480px] flex-col items-center ${styles.sceneEnter}`}>
          <h1 className="sr-only">Perks. Escucha mejor y actua a tiempo.</h1>
          <Image src="/brand/perks-logo.png" alt="Perks" width={160} height={52} className="mb-6 h-10 w-auto" priority />
          <form
            action={isRegisterMode ? signUpAction : signInAction}
            className="w-full rounded-[28px] bg-[#fffdf8] px-7 py-8 sm:px-10 sm:py-9"
          >
          <div className="mx-auto flex w-full flex-col">
            <div>
              <div className="text-left">
                <h2 className="text-[1.8rem] font-semibold tracking-tight text-[#0b332a] sm:text-[2rem]">
                  {isRegisterMode ? "Crea tu cuenta" : "Bienvenido de nuevo"}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#60736a]">
                  {isRegisterMode
                    ? "Configura tu empresa y empieza a organizar la experiencia de tus clientes."
                    : "Accede a tu espacio de trabajo y continua gestionando tu experiencia en Perks."}
                </p>
              </div>

              {errorCode ? (
                <p className="mt-5 rounded-lg bg-[#f9e9e5] px-4 py-3 text-sm text-[#843e30]">
                  {errorMessages[errorCode] ?? "No se pudo iniciar sesion."}
                </p>
              ) : null}

              {statusCode ? (
                <p className="mt-5 rounded-lg bg-[#e0f0e8] px-4 py-3 text-sm text-[#205b48]">
                  {statusMessages[statusCode] ?? "Operación completada."}
                </p>
              ) : null}

              {REGISTRATION_ENABLED ? (
                <div className="mt-6 grid h-11 grid-cols-2 rounded-lg bg-[#edf3ec] p-1">
                  <Link
                    href="/login"
                    className={`inline-flex items-center justify-center rounded-md text-sm font-semibold transition ${
                      isRegisterMode
                        ? "text-[#60736a] hover:text-[#0b332a]"
                        : "bg-[#0b332a] text-white"
                    }`}
                  >
                    Iniciar sesion
                  </Link>
                  <Link
                    href="/login?mode=registro"
                    className={`inline-flex items-center justify-center rounded-md text-sm font-semibold transition ${
                      isRegisterMode
                        ? "bg-[#0b332a] text-white"
                        : "text-[#60736a] hover:text-[#0b332a]"
                    }`}
                  >
                    Registrarse
                  </Link>
                </div>
              ) : null}

              {!isRegisterMode ? (
                <input type="hidden" name="redirectTo" value={redirectTo} />
              ) : null}

              <div className="mt-7 space-y-4">
                {isRegisterMode ? (
                  <>
                    <label className="block">
                      <span className="text-sm font-semibold text-[#29483d]">
                        Nombre completo
                      </span>
                      <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#d7e3d9] bg-white px-4 text-[#12362d] transition focus-within:ring-2 focus-within:ring-[#3d9e7e]">
                        <UserRound
                          size={21}
                          className="shrink-0 text-[#7a9386]"
                          aria-hidden="true"
                        />
                        <input
                          className={`${styles.input} h-full w-full bg-white text-sm text-[#12362d] outline-none placeholder:text-[#718a7d]`}
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-[#29483d]">
                        Empresa
                      </span>
                      <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#d7e3d9] bg-white px-4 text-[#12362d] transition focus-within:ring-2 focus-within:ring-[#3d9e7e]">
                        <Building2
                          size={21}
                          className="shrink-0 text-[#7a9386]"
                          aria-hidden="true"
                        />
                        <input
                          className={`${styles.input} h-full w-full bg-white text-sm text-[#12362d] outline-none placeholder:text-[#718a7d]`}
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
                  <span className="text-sm font-semibold text-[#29483d]">
                    Correo electronico
                  </span>
                  <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#d7e3d9] bg-white px-4 text-[#12362d] transition focus-within:ring-2 focus-within:ring-[#3d9e7e]">
                    <Mail
                      size={21}
                      className="shrink-0 text-[#7a9386]"
                      aria-hidden="true"
                    />
                    <input
                      className={`${styles.input} h-full w-full bg-white text-sm text-[#12362d] outline-none placeholder:text-[#718a7d]`}
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
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-[#455f53]">
                    <input
                      type="checkbox"
                      name="remember"
                      className="size-4 rounded accent-[#0b6e58]"
                    />
                    Recordarme
                  </label>
                  {REGISTRATION_ENABLED ? (
                    <Link
                      href="/login?mode=registro"
                      className="text-sm font-semibold text-[#0b6e58] underline-offset-4 transition hover:underline"
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
                <p className="mt-5 text-center text-xs text-[#72877b]">
                  ¿Olvidaste tu contrasena? Pide ayuda a tu gerente.
                </p>
              ) : null}

            </div>
          </div>
          </form>
          <p className="mt-6 w-full text-center text-xs leading-5 text-[#4f695c]">
            Al continuar aceptas nuestros{" "}
            <span className="font-semibold text-[#315646]">Términos de uso</span>
            {" "}y{" "}
            <span className="font-semibold text-[#315646]">Política de Privacidad</span>.
          </p>
        </div>
      </section>
    </main>
  );
}
