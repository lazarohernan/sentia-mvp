"use client";

import { Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { useState } from "react";

import { activateAccountAction } from "@/app/auth/actions";

const errorMessages: Record<string, string> = {
  invalid_activation: "Revisa tu nombre y que las contrasenas coincidan.",
  activation_failed: "No se pudo activar la cuenta. Intenta de nuevo.",
  rate_limited: "Demasiados intentos. Espera unos minutos.",
  supabase_not_configured: "El servicio de autenticacion no esta configurado.",
};

type ActivarCuentaViewProps = {
  email: string;
  fullName: string;
  errorCode?: string;
  mode?: "invite" | "reset";
};

export function ActivarCuentaView({
  email,
  fullName,
  errorCode,
  mode = "invite",
}: ActivarCuentaViewProps) {
  const errorMessage = errorCode ? errorMessages[errorCode] ?? "No se pudo activar la cuenta." : null;
  const isResetMode = mode === "reset";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#06100d_0%,#091612_100%)] text-white">
      <section className="grid min-h-screen bg-[linear-gradient(180deg,rgba(7,17,14,0.96)_0%,rgba(8,19,16,0.94)_100%)]">
        <form
          action={activateAccountAction}
          className="flex flex-col px-6 py-7 sm:px-10 lg:px-16"
        >
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                {isResetMode ? "Actualización de acceso" : "Bienvenido al equipo"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                {isResetMode ? "Cambia tu contraseña" : "Crea tu contraseña"}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-white/55">
                {isResetMode
                  ? "Define una nueva contraseña para recuperar tu acceso a Perks."
                  : "Confirma tu nombre y crea tu contraseña para activar tu acceso a Perks."}
              </p>
              <p className="mt-3 text-sm font-medium text-white/70">{email}</p>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-white/75">
                  Nombre completo
                </span>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
                  <UserRound size={21} className="shrink-0 text-white/55" aria-hidden="true" />
                  <input
                    className="h-full w-full bg-transparent text-base text-white outline-none"
                    name="fullName"
                    type="text"
                    defaultValue={fullName}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-white/75">
                  Contrasena
                </span>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
                  <KeyRound size={21} className="shrink-0 text-white/55" aria-hidden="true" />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimo 8 caracteres"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="shrink-0 rounded-md p-1 text-white/55 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
                    aria-label={
                      isPasswordVisible ? "Ocultar contrasena" : "Mostrar contrasena"
                    }
                  >
                    {isPasswordVisible ? (
                      <EyeOff size={20} aria-hidden="true" />
                    ) : (
                      <Eye size={20} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-white/75">
                  Confirmar contrasena
                </span>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
                  <KeyRound size={21} className="shrink-0 text-white/55" aria-hidden="true" />
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45"
                    name="confirmPassword"
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repite tu contrasena"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible((current) => !current)}
                    className="shrink-0 rounded-md p-1 text-white/55 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
                    aria-label={
                      isConfirmPasswordVisible
                        ? "Ocultar confirmacion de contrasena"
                        : "Mostrar confirmacion de contrasena"
                    }
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff size={20} aria-hidden="true" />
                    ) : (
                      <Eye size={20} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>
            </div>

            {errorMessage ? (
              <p className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-lg bg-[#56b298] px-4 text-base font-bold text-white transition hover:bg-[#62c2a7]"
            >
              {isResetMode ? "Cambiar contraseña y continuar" : "Crear contraseña y continuar"}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-white/45">
              {isResetMode
                ? "Después podrás entrar nuevamente con tu correo y la contraseña actualizada."
                : "Después podrás entrar con tu correo y la contraseña que acabas de crear."}
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
