import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

export function LandingFinalCta() {
  return (
    <section id="empezar" className="bg-[#fffdf7] px-6 pb-5 sm:px-10 lg:px-14 lg:pb-8">
      <LandingReveal className="relative mx-auto min-h-[360px] max-w-[1320px] overflow-hidden rounded-[8px] bg-[#064b3d] text-white">
        <Image
          src="/images/perks-operators-review-feedback-v1.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover object-[74%_center] opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,54,44,0.98)_0%,rgba(3,54,44,0.88)_36%,rgba(3,54,44,0.28)_62%,rgba(3,54,44,0.04)_100%)]" />

        <div className="relative flex min-h-[360px] max-w-3xl flex-col justify-center px-5 py-10 sm:px-9 lg:px-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#9fe0c8]">Siguiente paso</p>
          <h2
            className="mt-2.5 max-w-[12ch] text-[clamp(2.3rem,4.3vw,4.2rem)] font-bold leading-[0.98]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Empieza escuchando una sucursal
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d6e8e0]">
            Prueba la experiencia del cliente y úsala para definir qué necesita tu operación antes de elegir una configuración.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[#eaf5f0]">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} aria-hidden="true" /> Captura por QR</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} aria-hidden="true" /> Lectura operativa</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} aria-hidden="true" /> Alcance por sucursales</span>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/feedback/demo-cafe" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-6 font-extrabold text-[#075143] transition hover:-translate-y-0.5 hover:bg-[#edf7f1]">
              Probar experiencia
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-white/55 bg-white/8 px-6 font-extrabold text-white backdrop-blur transition hover:bg-white/15">
              Entrar a la demo
            </Link>
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}
