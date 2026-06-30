import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, Play } from "lucide-react";
import { LandingProblemSection } from "@/components/landing/landing-problem-section";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf3e4] text-[#0d2b25]">
      <section className="relative min-h-screen overflow-hidden bg-[#fbf3e4]">
        <div className="absolute inset-x-0 top-0 h-[34vh] overflow-hidden sm:h-full">
          <Image
            src="/images/perks-hero-latam-service-clean-v1.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[66%_center] sm:object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,243,228,0.02)_0%,rgba(251,243,228,0.92)_88%),linear-gradient(90deg,rgba(251,243,228,0.98)_0%,rgba(251,243,228,0.92)_30%,rgba(251,243,228,0.48)_55%,rgba(251,243,228,0.1)_100%)] sm:bg-[linear-gradient(90deg,rgba(251,243,228,0.99)_0%,rgba(251,243,228,0.95)_33%,rgba(251,243,228,0.5)_52%,rgba(251,243,228,0.04)_76%)]"
          />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-6 py-5 sm:px-10 lg:px-14">
          <nav className="hero-enter-soft flex h-16 items-center justify-between gap-5 rounded-[8px] border border-white/70 bg-white/64 px-4 shadow-[0_16px_45px_rgba(64,45,18,0.08)] backdrop-blur-md sm:h-20 sm:px-6">
            <Link href="/" aria-label="Perks inicio" className="shrink-0">
              <Image
                src="/brand/perks-logo.png"
                alt="Perks"
                width={180}
                height={58}
                priority
                className="h-10 w-auto sm:h-12"
              />
            </Link>

            <div className="hidden items-center gap-8 text-sm font-semibold text-[#23453d] lg:flex">
              <a href="#producto" className="transition hover:text-[#00634f]">
                Producto
              </a>
              <a href="#sectores" className="transition hover:text-[#00634f]">
                Sectores
              </a>
              <a href="#seguridad" className="transition hover:text-[#00634f]">
                Seguridad
              </a>
              <a href="#recursos" className="transition hover:text-[#00634f]">
                Recursos
              </a>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/login"
                className="hidden h-11 items-center justify-center rounded-[8px] border border-[#b9c5bd] bg-white/72 px-5 text-sm font-bold text-[#103a32] shadow-[0_10px_24px_rgba(51,40,17,0.08)] transition hover:-translate-y-0.5 hover:bg-white sm:inline-flex"
              >
                Ver demo
              </Link>
              <Link
                href="/feedback/demo-cafe"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#005542] px-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(0,85,66,0.24)] transition hover:-translate-y-0.5 hover:bg-[#004434] sm:px-5"
              >
                Solicitar diagnóstico
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                aria-label="Abrir menú"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-[#b9c5bd] bg-white/72 text-[#103a32] shadow-[0_10px_24px_rgba(51,40,17,0.08)] lg:hidden"
              >
                <Menu size={22} aria-hidden="true" />
              </button>
            </div>
          </nav>

          <div className="grid flex-1 items-end pb-8 pt-[31vh] sm:items-center sm:pb-8 sm:pt-8 lg:grid-cols-[minmax(0,0.47fr)_minmax(0,0.53fr)]">
            <div className="max-w-[650px]">
              <h1
                className="hero-enter max-w-[12ch] font-[var(--font-display)] text-[clamp(2.65rem,6.25vw,5.7rem)] font-bold leading-[0.94] tracking-normal text-[#062f28]"
                style={{ animationDelay: "190ms" }}
              >
                Escucha lo que tu operación aún no ve
              </h1>

              <p
                className="hero-enter mt-4 max-w-[520px] text-base leading-7 text-[#36574d] sm:mt-5 sm:text-xl sm:leading-8"
                style={{ animationDelay: "260ms" }}
              >
                Convierte comentarios, alertas y niveles de escucha en decisiones claras para tu negocio y tu equipo.
              </p>

              <div
                className="hero-enter mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row"
                style={{ animationDelay: "330ms" }}
              >
                <Link
                  href="/feedback/demo-cafe"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#005542] px-7 text-base font-bold text-white shadow-[0_18px_36px_rgba(0,85,66,0.26)] transition hover:-translate-y-0.5 hover:bg-[#004434] sm:h-14"
                >
                  Solicitar diagnóstico
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-[#b8c4bc] bg-white/76 px-7 text-base font-bold text-[#143f35] shadow-[0_14px_30px_rgba(51,40,17,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white sm:h-14"
                >
                  <Play size={18} aria-hidden="true" />
                  Ver demo
                </Link>
              </div>
            </div>

            <div className="hidden justify-end self-end lg:flex">
              <div
                className="hero-enter-soft mb-4 grid w-full max-w-[520px] grid-cols-3 gap-3"
                style={{ animationDelay: "470ms" }}
              >
                {[
                  ["Comentario", "Cliente reporta fricción"],
                  ["Señal", "Riesgo por sucursal"],
                  ["Decisión", "Acción asignada"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[8px] border border-white/70 bg-white/70 p-4 shadow-[0_14px_34px_rgba(25,35,28,0.1)] backdrop-blur-md"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0f6c56]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-[#163c33]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingProblemSection />
    </main>
  );
}
