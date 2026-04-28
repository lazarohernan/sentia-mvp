import Link from "next/link";
import { BarChart3, MessageSquareText, QrCode, UsersRound } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f4] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-950 text-white">
              <MessageSquareText size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Escucha MVP
              </p>
              <p className="text-sm text-slate-600">Feedback + IA + lealtad</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Ver dashboard
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              Escucha MVP
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-700">
              Plataforma web para capturar comentarios por QR, convertir texto
              libre en analitica con IA y dar seguimiento a quejas, sugerencias,
              felicitaciones y niveles de escucha por sucursal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/feedback/demo-cafe"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <QrCode size={18} aria-hidden="true" />
                Probar formulario QR
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
              >
                <BarChart3 size={18} aria-hidden="true" />
                Ver dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Vista MVP</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Salud de experiencia
                </h2>
              </div>
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                Piloto
              </div>
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-3">
              {[
                ["Comentarios", "128"],
                ["NPS", "62"],
                ["Alertas", "7"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                "Quejas criticas por atencion al cliente",
                "Tendencia positiva en limpieza",
                "Equipo reporta mayor escucha empatica",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-slate-100 p-3"
                >
                  <UsersRound
                    className="text-emerald-800"
                    size={18}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
