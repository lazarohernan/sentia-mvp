import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { allGuideSections, getGuideSection } from "../guide-content";

type GuidePageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return allGuideSections.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = getGuideSection(slug);

  return section
    ? { title: `${section.title} | Guía de Perks`, description: section.summary }
    : { title: "Guía de Perks" };
}

function GuideSteps({ steps }: { steps: readonly { title: string; body: string }[] }) {
  return (
    <ol className={`grid gap-4 md:grid-cols-2 ${steps.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-2xl border border-[#d6e5da] bg-white p-6 sm:p-7">
          <span className="text-sm font-semibold tracking-widest text-brand-muted">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-[#073c34]">{step.title}</h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export default async function GuideSectionPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const section = getGuideSection(slug);
  if (!section) notFound();

  const Icon = section.icon;
  const sectionIndex = allGuideSections.findIndex((item) => item.slug === slug);
  const nextSection = allGuideSections[(sectionIndex + 1) % allGuideSections.length];

  return (
    <main className="min-h-[100dvh] bg-background pb-20 text-text-primary">
      <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-14">
        <Link href="/guia" aria-label="Volver a la guía de Perks">
          <Image src="/brand/perks-logo.png" alt="Perks" width={160} height={52} className="h-9 w-auto" priority />
        </Link>
        <Link href="/guia" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-muted">
          <ArrowLeft aria-hidden="true" size={18} /> Todas las guías
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8">
        <nav aria-label="Ruta de navegación" className="mb-5 flex items-center gap-2 text-sm text-text-secondary">
          <Link href="/guia" className="underline-offset-4 hover:underline">Guía de Perks</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-[#073c34]">{section.title}</span>
        </nav>

        <section className="relative grid min-h-[330px] overflow-hidden rounded-2xl bg-[#d5eadb] lg:grid-cols-[1.12fr_0.88fr]">
          <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-16">
            <span className="flex items-center gap-3 text-sm font-semibold text-[#28584d]">
              <Icon aria-hidden="true" size={26} strokeWidth={1.8} /> Guía práctica
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#073c34] sm:text-5xl lg:text-[64px] lg:leading-[1.05]">{section.title}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#28584d] sm:text-lg">{section.summary}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={section.panelHref} className="inline-flex items-center gap-2 rounded-lg bg-[#06483d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b6252] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-muted">
                {slug === "notificaciones" ? "Ir al panel" : `Abrir ${section.title} en Perks`} <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link href="/guia" className="text-sm font-semibold text-[#073c34] underline-offset-4 hover:underline">Volver al índice</Link>
            </div>
          </div>

          {slug === "valoraciones" ? (
            <div className="relative hidden min-h-[330px] lg:block">
              <Image src="/images/guide/perks-guide-valoraciones-manager-v1.png" alt="" fill sizes="40vw" className="object-contain object-right-bottom" priority />
            </div>
          ) : (
            <div className="hidden items-center justify-center p-10 lg:flex">
              <div className="w-full max-w-sm rounded-2xl border border-[#b4d2bf] bg-white/80 p-7">
                <p className="text-sm font-semibold text-[#28584d]">En esta guía</p>
                <ol className="mt-5 space-y-4">
                  {section.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-4 border-t border-[#dceadf] pt-4 text-sm font-medium text-[#073c34]">
                      <span className="text-brand-muted">{String(index + 1).padStart(2, "0")}</span>
                      <span>{step.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="que-hacer" className="mt-14">
          <div className="mb-6">
            <p className="text-sm font-semibold text-brand-muted">Paso a paso</p>
            <h2 id="que-hacer" className="mt-2 text-3xl font-semibold tracking-tight text-[#073c34]">Qué puedes hacer aquí</h2>
          </div>
          <GuideSteps steps={section.steps} />
        </section>

        <aside className="mt-6 flex items-start gap-4 rounded-2xl bg-[#e8f1e9] p-6 sm:p-8">
          <Info aria-hidden="true" size={24} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand-muted" />
          <div>
            <h2 className="font-semibold text-[#073c34]">Ten en cuenta</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-text-secondary">{section.note}</p>
          </div>
        </aside>

        {slug === "escucha" && (
          <aside className="mt-8 rounded-2xl border border-[#c7dacd] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#073c34]">Después de Escucha: Coaching</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Las evaluaciones de escucha ayudan a preparar conversaciones de acompañamiento con cada colaborador.</p>
            <Link href="/guia/coaching" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-muted underline-offset-4 hover:underline">
              Ver la guía de Coaching <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </aside>
        )}

        <nav aria-label="Seguir explorando" className="mt-16 grid gap-4 border-t border-[#c7dacd] pt-8 sm:grid-cols-2">
          <Link href="/guia" className="group flex items-center gap-3 rounded-xl border border-[#d6e5da] bg-white p-5 text-sm font-semibold text-[#073c34] hover:bg-[#edf7ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted">
            <ArrowLeft aria-hidden="true" size={20} /> Todas las guías
          </Link>
          <Link href={`/guia/${nextSection.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-[#d6e5da] bg-white p-5 text-sm font-semibold text-[#073c34] hover:bg-[#edf7ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-muted">
            Siguiente: {nextSection.title} <ArrowRight aria-hidden="true" size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </nav>
      </div>
    </main>
  );
}
