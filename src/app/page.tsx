import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowRight, CheckCircle2, MessageCircle, Play } from "lucide-react";
import { LandingCapabilitiesSection } from "@/components/landing/landing-capabilities-section";
import { LandingDemoSection } from "@/components/landing/landing-demo-section";
import { LandingFaqSection } from "@/components/landing/landing-faq-section";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeroMedia } from "@/components/landing/landing-hero-media";
import { LandingMobileMenu } from "@/components/landing/landing-mobile-menu";
import { LandingPlansSection } from "@/components/landing/landing-plans-section";
import { LandingProblemSection } from "@/components/landing/landing-problem-section";
import { LandingScrollReset } from "@/components/landing/landing-scroll-reset";
import { LandingWorkflowSection } from "@/components/landing/landing-workflow-section";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf3e4] text-[#0d2b25]">
      <LandingScrollReset />

      <div className="sticky top-3 z-40 px-4 sm:top-4 sm:px-10 lg:px-14">
        <nav className="hero-enter-soft mx-auto flex h-12 w-full max-w-[980px] items-center justify-between gap-3 rounded-full bg-[#0d2b25]/82 px-2.5 pl-3.5 shadow-[0_18px_50px_rgba(8,28,22,0.28)] backdrop-blur-xl sm:h-14 sm:gap-4 sm:px-3 sm:pl-5">
          <Link href="/" aria-label="Perks inicio" className="shrink-0">
            <Image
              src="/brand/perks-logo-white.png"
              alt="Perks"
              width={140}
              height={46}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="hidden items-center gap-1 text-[13px] font-semibold text-white/78 xl:flex">
            <a href="#producto" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Producto
            </a>
            <a href="#prueba" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Cómo funciona
            </a>
            <a href="#sectores" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Sectores
            </a>
            <a href="#planes" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Opciones
            </a>
            <a href="#preguntas" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
              Preguntas
            </a>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <Link
              href="/login"
              className="hidden h-9 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white xl:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/feedback/demo-cafe"
              className="hidden h-9 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-bold text-[#0d2b25] shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition hover:bg-[#edf7f1] xl:inline-flex"
            >
              Probar
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <LandingMobileMenu />
          </div>
        </nav>
      </div>

      <section className="relative -mt-16 overflow-hidden bg-[#fbf3e4] pt-16 sm:min-h-[640px] lg:min-h-[700px]">
        <LandingHeroMedia />

        <div className="relative mx-auto flex w-full max-w-[1500px] flex-col px-5 pb-8 sm:min-h-[640px] sm:px-10 sm:pb-5 lg:min-h-[700px] lg:px-14">
          <div className="grid flex-1 items-start pt-[46svh] sm:items-center sm:min-h-[640px] sm:pt-8 lg:min-h-[700px] lg:grid-cols-[minmax(0,0.47fr)_minmax(0,0.53fr)]">
            <div className="w-full max-w-[650px]">
              <h1
                className="hero-enter text-[clamp(2rem,7.2vw,2.65rem)] font-bold leading-[1.08] tracking-normal text-[#062f28] sm:max-w-[12ch] sm:text-[clamp(2.35rem,5.4vw,4.75rem)] sm:leading-[0.96]"
                style={{ animationDelay: "190ms", fontFamily: "var(--font-display)" }}
              >
                Escucha lo que tu operación aún no ve
              </h1>

              <p
                className="hero-enter mt-3 text-[0.98rem] leading-7 text-[#36574d] sm:mt-3.5 sm:max-w-[520px] sm:text-xl sm:leading-8"
                style={{ animationDelay: "260ms" }}
              >
                Convierte comentarios, alertas y niveles de escucha en decisiones claras para tu negocio y tu equipo.
              </p>

              <div
                className="hero-enter mt-5 flex w-full flex-col gap-2.5 sm:mt-4 sm:w-auto sm:flex-row sm:gap-3"
                style={{ animationDelay: "330ms" }}
              >
                <Link
                  href="/feedback/demo-cafe"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#005542] px-6 text-[0.95rem] font-bold text-white shadow-[0_18px_36px_rgba(0,85,66,0.26)] transition hover:-translate-y-0.5 hover:bg-[#004434] sm:h-12 sm:w-auto sm:px-7 sm:text-base"
                >
                  Probar experiencia
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[#b8c4bc] bg-white px-6 text-[0.95rem] font-bold text-[#143f35] shadow-[0_14px_30px_rgba(51,40,17,0.08)] transition hover:-translate-y-0.5 hover:bg-white sm:h-12 sm:w-auto sm:bg-white/76 sm:px-7 sm:text-base"
                >
                  <Play size={17} aria-hidden="true" />
                  Entrar a la demo
                </Link>
              </div>
            </div>

            <div className="relative hidden min-h-[420px] xl:block">
              <article
                className="hero-enter-soft absolute left-[8%] top-[10%] w-[200px] rounded-[8px] border border-white/90 bg-white/95 p-2.5 shadow-[0_14px_36px_rgba(29,31,24,0.14)] backdrop-blur-md"
                style={{ animationDelay: "430ms" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e7f4ee] text-[#00634f]">
                      <MessageCircle size={13} aria-hidden="true" />
                    </span>
                    <p className="text-xs font-bold text-[#173b33]">Cliente</p>
                  </div>
                  <p className="text-[11px] font-semibold text-[#6d8178]">Hace 15 min</p>
                </div>
                <p className="mt-2 text-sm font-semibold leading-5 text-[#1c3d34]">La atención fue lenta y nadie me dio solución.</p>
                <p className="mt-2 text-[11px] font-bold text-[#38675b]">Sucursal Centro · QR</p>
              </article>

              <article
                className="hero-enter-soft absolute right-[4%] top-[22%] w-[196px] rounded-[8px] border border-white/90 bg-white/95 p-2.5 shadow-[0_14px_36px_rgba(29,31,24,0.14)] backdrop-blur-md"
                style={{ animationDelay: "500ms" }}
              >
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#fff1df] text-[#f08a18]">
                    <AlertTriangle size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-4 text-[#173b33]">Alerta generada</p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#d94d43]">Prioridad alta</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs font-semibold leading-4 text-[#4f665d]">Tiempo de respuesta alto</p>
              </article>

              <article
                className="hero-enter-soft absolute bottom-[22%] left-[34%] w-[210px] rounded-[8px] border border-white/90 bg-white/95 p-2.5 shadow-[0_14px_36px_rgba(29,31,24,0.14)] backdrop-blur-md"
                style={{ animationDelay: "570ms" }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f8a68] text-white">
                    <CheckCircle2 size={14} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-bold leading-4 text-[#173b33]">Acción recomendada</p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-4 text-[#4f665d]">Asignar responsable y revisar proceso.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <LandingProblemSection />
      <LandingWorkflowSection />
      <LandingDemoSection />
      <LandingCapabilitiesSection />
      <LandingPlansSection />
      <LandingFaqSection />
      <LandingFinalCta />
      <LandingFooter />
    </main>
  );
}
