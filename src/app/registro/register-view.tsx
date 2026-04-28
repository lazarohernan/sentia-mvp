import {
  ArrowLeft,
  Building2,
  KeyRound,
  Mail,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { signUpAction } from "@/app/auth/actions";

export function RegisterView() {
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
                  <p className="text-sm text-emerald-100/80">Nuevo acceso</p>
                </div>
              </div>

              <h1 className="mt-12 max-w-xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Crea tu cuenta principal.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-8 text-emerald-50/85">
                Configura tu empresa y empieza a organizar la experiencia de tus
                clientes.
              </p>
            </div>

            <div className="mt-10 rounded-md border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-semibold text-white">Primer paso</p>
              <p className="mt-1 text-sm leading-6 text-emerald-50/75">
                Despues podras sumar sucursales y usuarios.
              </p>
            </div>
          </div>
        </aside>

        <form
          action={signUpAction}
          className="flex min-h-[560px] flex-col justify-center bg-white p-6 sm:p-10 lg:min-h-0"
        >
          <div className="mx-auto w-full max-w-lg">
            <h2 className="text-3xl font-semibold">Crear cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ingresa los datos principales.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Nombre completo
                </span>
                <div className="mt-1 flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15">
                  <UserRound
                    size={16}
                    className="text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-full w-full bg-transparent text-sm outline-none"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Empresa
                </span>
                <div className="mt-1 flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 transition focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15">
                  <Building2
                    size={16}
                    className="text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    className="h-full w-full bg-transparent text-sm outline-none"
                    name="companyName"
                    type="text"
                    required
                  />
                </div>
              </label>

              <label className="block sm:col-span-2">
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

              <label className="block sm:col-span-2">
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
                    autoComplete="new-password"
                    placeholder="Minimo 8 caracteres"
                    minLength={8}
                    required
                  />
                </div>
              </label>
            </div>

            <button
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              type="submit"
            >
              Crear cuenta
            </button>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Volver a iniciar sesion
              </Link>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
