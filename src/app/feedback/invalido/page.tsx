import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function InvalidFeedbackQrPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-950">Codigo QR no valido</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Este codigo no pertenece al canal oficial de feedback. No envies comentarios ni datos
            personales.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Si ves un sticker encima del QR original, avisale al personal del local.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
