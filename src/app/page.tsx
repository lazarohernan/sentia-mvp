import Link from "next/link";
import { ArrowRight, LogIn, QrCode, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f4] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <p className="text-sm font-semibold text-slate-500">
            Producto en construcción
          </p>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
            >
              <LogIn size={16} aria-hidden="true" />
              Login
            </Link>
          </div>
        </nav>

        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900">
              <ShieldCheck size={16} aria-hidden="true" />
              En desarrollo
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              Plataforma en construcción
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-700">
              Herramienta para capturar comentarios y convertirlos en señales
              accionables.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Acceder
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/feedback/demo-cafe"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
              >
                <QrCode size={18} aria-hidden="true" />
                Probar QR
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
