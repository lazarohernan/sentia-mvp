import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, MessageCircle, Star, UsersRound } from "lucide-react";
import { additionalGuideSections, primaryGuideSections } from "./guide-content";
import { GuideJourney } from "./guide-journey";
import styles from "./guide.module.css";

export const metadata: Metadata = {
  title: "Guía de Perks | Qué hace cada sección",
  description:
    "Una guía sencilla para recibir opiniones, atender alertas y usar los informes y la escucha de equipo en Perks.",
};

export default function PerksGuidePage() {
  return (
    <main className="min-h-[100dvh] bg-background pb-20 text-text-primary">
      <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-14">
        <Link href="/dashboard" aria-label="Ir al inicio de Perks">
          <Image src="/brand/perks-logo.png" alt="Perks" width={160} height={52} className="h-9 w-auto" priority />
        </Link>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-muted">
          Ir al panel <ArrowRight aria-hidden="true" size={18} strokeWidth={2} />
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8">
        <section className="relative grid min-h-[330px] overflow-hidden rounded-2xl bg-[#c9e5d6] md:grid-cols-[1.12fr_0.88fr]">
          <div aria-hidden="true" className={styles.heroHalftone} />
          <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 md:py-14 lg:px-16">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-[#073c34] sm:text-5xl lg:text-[72px] lg:leading-[1.05]">Conoce Perks</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#214f46] sm:text-lg">
              Una guía sencilla para escuchar a tus clientes, atender lo importante y acompañar a tu equipo.
            </p>
          </div>
          <div className="relative z-10 h-64 min-w-0 md:h-full md:min-h-[330px]">
            <Image src="/images/guide/perks-guide-hero-people-v3.png" alt="Dos personas conversan sobre una opinión recibida" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-contain object-bottom md:object-right-bottom" priority />
          </div>
        </section>

        <GuideJourney />

        <nav aria-label="Secciones de la guía" className="mt-11">
          <h2 className="text-3xl font-semibold tracking-tight text-[#073c34] sm:text-4xl">Elige una sección</h2>
          <p className="mt-2 text-base text-text-secondary">Estas secciones tratan la experiencia de tus clientes. Pulsa una tarjeta para abrir su guía.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {primaryGuideSections.filter(({ slug }) => slug !== "escucha").map(({ slug, title, icon: Icon }, index) => (
              <Link key={slug} href={`/guia/${slug}`} className={`group flex min-h-[84px] items-center gap-5 rounded-xl border border-[#b8d3c7] bg-white px-6 py-4 text-[#073c34] transition-colors hover:bg-[#edf7ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"}`}>
                <Icon aria-hidden="true" size={36} strokeWidth={1.9} className="shrink-0" />
                <span className="flex-1 text-xl font-semibold">{title}</span>
                <ArrowRight aria-hidden="true" size={24} strokeWidth={2} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
          <div className="mt-6 border-t border-[#bbd1c6] pt-5">
            <h3 className="text-lg font-semibold text-[#073c34]">Más guías para tu trabajo</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {additionalGuideSections.map(({ slug, title, summary, icon: Icon }) => (
                <Link key={slug} href={`/guia/${slug}`} className="group flex items-center gap-4 rounded-xl border border-[#d9e6dd] bg-white px-5 py-4 text-[#073c34] transition-colors hover:bg-[#edf7ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted">
                  <Icon aria-hidden="true" size={26} strokeWidth={1.8} className="shrink-0" />
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-5 text-text-secondary">{summary}</span></span>
                  <ArrowRight aria-hidden="true" size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <section aria-label="Secciones destacadas" className="mt-7 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
          <Link href="/guia/valoraciones" className="group relative min-h-[440px] overflow-hidden rounded-2xl border border-[#b8d3c7] bg-white p-7 transition-colors hover:bg-[#fcfefd] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-muted sm:min-h-[325px] sm:p-8">
            <div aria-hidden="true" className={styles.cardHalftone} />
            <div className="relative z-10 max-w-full sm:max-w-[65%]">
              <div className="flex items-center gap-4 text-[#073c34]">
                <Star aria-hidden="true" size={36} strokeWidth={1.8} className="shrink-0" />
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Valoraciones</h2>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary sm:text-base">
                Conoce lo que piensan tus clientes y da seguimiento a cada experiencia.
              </p>
              <span className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#06483d] px-5 py-3 text-sm font-semibold text-white group-hover:bg-[#0b6252]">
                Ver guía de Valoraciones <ArrowRight aria-hidden="true" size={18} />
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-0 right-0 z-10 h-48 w-40 sm:h-full sm:w-[35%] xl:w-[38%]">
              <Image src="/images/guide/perks-guide-valoraciones-manager-v1.png" alt="" fill sizes="(max-width: 640px) 160px, (max-width: 1024px) 35vw, 23vw" className="object-contain object-right-bottom" />
            </div>
          </Link>
          <Link href="/guia/informes" className="group flex min-h-[325px] flex-col rounded-2xl border border-[#b8d3c7] bg-white p-7 transition-colors hover:bg-[#fcfefd] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-muted sm:p-8">
            <div className="flex items-center gap-4 text-[#073c34]">
              <BarChart3 aria-hidden="true" size={36} strokeWidth={1.8} className="shrink-0" />
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Informes</h2>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary sm:text-base">
              Lee los patrones del periodo y encuentra información útil para decidir qué mejorar.
            </p>
            <span className="mt-auto inline-flex w-fit items-center gap-3 rounded-lg bg-[#e9f2ec] px-5 py-3 text-sm font-semibold text-[#073c34] group-hover:bg-[#d5e7dc]">
              Ver guía de Informes <ArrowRight aria-hidden="true" size={18} />
            </span>
          </Link>
          <section aria-labelledby="palabras-clave" className="min-h-[325px] rounded-2xl border border-[#b8d3c7] bg-white p-7 sm:p-8">
            <h2 id="palabras-clave" className="text-2xl font-semibold tracking-tight text-[#073c34] sm:text-3xl">Términos útiles</h2>
            <dl className="mt-5 space-y-3 text-sm leading-5">
              <div><dt className="font-semibold text-[#073c34]">QR de sucursal</dt><dd className="text-text-secondary">Abre el formulario de opinión de esa sucursal.</dd></div>
              <div><dt className="font-semibold text-[#073c34]">CSAT</dt><dd className="text-text-secondary">Resume la satisfacción de los clientes.</dd></div>
              <div><dt className="font-semibold text-[#073c34]">SLA</dt><dd className="text-text-secondary">Plazo esperado para la primera respuesta.</dd></div>
              <div><dt className="font-semibold text-[#073c34]">IA</dt><dd className="text-text-secondary">Ayuda a ordenar patrones; revisa siempre las opiniones originales.</dd></div>
            </dl>
          </section>
        </section>

        <section aria-labelledby="entrenamiento" className="mt-14 border-t border-[#bbd1c6] pt-10">
          <p className="text-sm font-semibold text-[#54766a]">PARA TU EQUIPO</p>
          <h2 id="entrenamiento" className="mt-2 text-3xl font-semibold tracking-tight text-[#073c34] sm:text-4xl">Entrenamiento del equipo</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">Escucha y Coaching se basan en evaluaciones internas. No son opiniones de clientes.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link href="/guia/escucha" className="group flex gap-5 rounded-2xl border border-[#b8d3c7] bg-[#eaf3eb] p-6 text-[#073c34] transition-colors hover:bg-[#dcecdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted sm:p-8">
              <MessageCircle aria-hidden="true" size={32} strokeWidth={1.8} className="shrink-0" />
              <span className="min-w-0 flex-1"><span className="block text-xl font-semibold">Escucha</span><span className="mt-2 block text-sm leading-6 text-[#42655a]">Consulta las evaluaciones y observa cómo evoluciona la práctica de escucha.</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Ver guía <ArrowRight aria-hidden="true" size={17} className="transition-transform group-hover:translate-x-1" /></span></span>
            </Link>
            <Link href="/guia/coaching" className="group flex gap-5 rounded-2xl border border-[#b8d3c7] bg-[#eaf3eb] p-6 text-[#073c34] transition-colors hover:bg-[#dcecdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted sm:p-8">
              <UsersRound aria-hidden="true" size={32} strokeWidth={1.8} className="shrink-0" />
              <span className="min-w-0 flex-1"><span className="block text-xl font-semibold">Coaching</span><span className="mt-2 block text-sm leading-6 text-[#42655a]">Prepara conversaciones y acuerda acciones con cada colaborador.</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Ver guía <ArrowRight aria-hidden="true" size={17} className="transition-transform group-hover:translate-x-1" /></span></span>
            </Link>
          </div>
        </section>

        <p className="mt-10 max-w-3xl text-sm leading-6 text-text-secondary">
          Si alguna sección está vacía, prueba con otro periodo o sucursal. Algunas opciones dependen de tu rol y de la configuración de tu organización.
        </p>
      </div>
    </main>
  );
}
