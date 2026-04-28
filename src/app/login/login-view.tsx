import {
  ArrowRight,
  KeyRound,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { signInAction } from "@/app/auth/actions";

type LoginViewProps = {
  redirectTo?: string;
};

export function LoginView({ redirectTo }: LoginViewProps) {
  return (
    <main className="min-h-screen bg-[#f5f6f1] px-5 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
        <aside className="relative flex min-h-[560px] overflow-hidden bg-emerald-950 bg-[url('/images/auth-network-bg.svg')] bg-cover bg-center p-6 text-white sm:p-8 lg:min-h-0">
          <div className="absolute inset-0 bg-emerald-950/35" />

          <div className="relative z-10 flex w-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-white/10">
                  <MessageSquareText size={23} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Escucha
                  </p>
                  <p className="text-sm text-emerald-100/80">Panel de acceso</p>
                </div>
              </div>

              <h1 className="mt-12 max-w-xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Escucha mejor. Actua a tiempo.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-8 text-emerald-50/85">
                Gestiona comentarios, alertas y oportunidades de mejora desde un
                solo lugar.
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {[
                ["Comentarios claros", "La voz del cliente ordenada."],
                ["Alertas oportunas", "Lo urgente llega rapido."],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-md border border-white/10 bg-white/[0.06] p-4"
                >
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-50/75">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <form
          action={signInAction}
          className="flex min-h-[560px] flex-col justify-center bg-white p-6 sm:p-10 lg:min-h-0"
        >
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold">Bienvenido</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ingresa para continuar.
                </p>
              </div>
              <div className="hidden size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:flex">
                <ShieldCheck size={20} aria-hidden="true" />
              </div>
            </div>

            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Correo
                </span>
                <div className="mt-1 flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15">
                  <Mail size={16} className="text-slate-400" aria-hidden="true" />
                  <input
                    className="h-full w-full bg-transparent text-sm outline-none"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@empresa.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Contrasena
                </span>
                <div className="mt-1 flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15">
                  <KeyRound
                    size={16}
                    className="text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-full w-full bg-transparent text-sm outline-none"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Tu contrasena"
                    minLength={8}
                    required
                  />
                </div>
              </label>
            </div>

            <button
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Iniciar sesion
            </button>

            <Link
              href="/dashboard"
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Continuar al dashboard
            </Link>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-600">Aun no tienes cuenta?</p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-700"
              >
                Crear cuenta
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
