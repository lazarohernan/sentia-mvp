import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { allGuideSections, getGuideSection } from "../guide-content";

type GuidePageProps = { params: Promise<{ slug: string }> };

const guideBody = "max-w-[70ch] text-lg leading-8 text-[#40594f] sm:text-xl sm:leading-9";

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
    <ol className="border-l border-[#b8d3c7]">
      {steps.map((step, index) => (
        <li key={step.title} className="relative border-b border-[#d6e5da] py-7 pl-8 last:border-b-0 sm:pl-12">
          <span className="absolute -left-4 top-7 flex h-8 w-8 items-center justify-center rounded-full bg-[#d5eadb] text-xs font-semibold text-[#06483d]">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="text-xl font-semibold tracking-tight text-[#073c34] sm:text-2xl">{step.title}</h3>
          <p className={`mt-3 ${guideBody}`}>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

const guideScreenshots: Record<(typeof allGuideSections)[number]["slug"], {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}> = {
  inicio: { src: "/images/guide/screenshots/inicio-ejemplo.jpg", width: 1112, height: 590, alt: "Inicio de Perks con indicadores de opiniones, satisfacción y pendientes", caption: "Inicio: cifras del periodo y acceso al resumen operativo." },
  valoraciones: { src: "/images/guide/screenshots/valoraciones-ejemplo.jpg", width: 1127, height: 910, alt: "Vista de gráficos de Valoraciones con distribución y salud de las opiniones", caption: "Valoraciones: la vista Gráficos reúne las respuestas del periodo." },
  alertas: { src: "/images/guide/screenshots/alertas-ejemplo.jpg", width: 1127, height: 715, alt: "Alertas nuevas con filtros y casos pendientes de asignación", caption: "Alertas: filtra los casos y abre uno para revisar su seguimiento." },
  informes: { src: "/images/guide/screenshots/informes-ejemplo.jpg", width: 1127, height: 655, alt: "Informes con estado de preparación y acceso a la vista previa", caption: "Informes: comprueba si el periodo está listo antes de compartirlo." },
  mejoras: { src: "/images/guide/screenshots/mejoras-ejemplo.jpg", width: 1127, height: 646, alt: "Pestaña Mejoras con una propuesta para una sucursal", caption: "Mejoras: una propuesta orienta la conversación, pero debe contrastarse con las opiniones." },
  escucha: { src: "/images/guide/screenshots/escucha-ejemplo.jpg", width: 1127, height: 515, alt: "Analítica de Escucha con evaluaciones y niveles del periodo", caption: "Escucha: las cifras resumen las evaluaciones del equipo en el periodo elegido." },
  gestion: { src: "/images/guide/screenshots/gestion-ejemplo.jpg", width: 1127, height: 648, alt: "Gestión en la pestaña Configuración con la frecuencia de los informes", caption: "Gestión: ejemplo de la pestaña Configuración; aquí se elige la frecuencia de informes." },
  notificaciones: { src: "/images/guide/screenshots/notificaciones-ejemplo.jpg", width: 352, height: 311, alt: "Panel de notificaciones con un aviso y el botón Ver todas", caption: "Notificaciones: la campana muestra avisos recientes y el acceso a Ver todas." },
  coaching: { src: "/images/guide/screenshots/coaching-ejemplo.jpg", width: 1248, height: 492, alt: "Coaching de escucha con dos colaboradores ficticios y sus motivos de prioridad", caption: "Coaching: prioridades y motivos para preparar una conversación. Los colaboradores y sus registros son ficticios." },
};

export default async function GuideSectionPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const section = getGuideSection(slug);
  if (!section) notFound();

  const Icon = section.icon;
  const screenshot = guideScreenshots[section.slug];
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
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#28584d] sm:text-xl">{section.summary}</p>
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
                <nav aria-label="Contenido de esta guía" className="mt-4 flex flex-col gap-1 text-sm font-medium text-[#073c34]">
                  <a href="#para-que-sirve" className="border-t border-[#dceadf] py-3 underline-offset-4 hover:underline">Para qué sirve</a>
                  <a href="#paso-a-paso" className="border-t border-[#dceadf] py-3 underline-offset-4 hover:underline">Cómo usarla</a>
                </nav>
              </div>
            </div>
          )}
        </section>

        <article className="mx-auto w-full max-w-7xl">
          <nav aria-label="Contenido de esta guía" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-[#c7dacd] pb-5 text-sm font-semibold text-[#06483d] lg:hidden">
            <a href="#para-que-sirve" className="underline-offset-4 hover:underline">Para qué sirve</a>
            <a href="#paso-a-paso" className="underline-offset-4 hover:underline">Cómo usarla</a>
          </nav>

          <section id="para-que-sirve" aria-labelledby="proposito" className="mt-10 scroll-mt-6 rounded-2xl bg-white p-6 sm:p-10">
            <h2 id="proposito" className="mt-3 text-3xl font-semibold tracking-tight text-[#073c34]">¿Para qué sirve esta sección?</h2>
            <p className={`mt-5 ${guideBody}`}>{section.purpose}</p>
            <p className="mt-5 text-base font-medium leading-7 text-[#28584d]">Dónde encontrarla: {section.location}</p>
            <h3 className="mt-8 text-xl font-semibold text-[#073c34] sm:text-2xl">Qué encontrarás al entrar</h3>
            <p className={`mt-3 ${guideBody}`}>{section.find}</p>
            {screenshot && (
              <figure className="mt-8">
                <a href={screenshot.src} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar captura de ${section.title} (abre otra pestaña)`} className="block w-fit max-w-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-muted">
                <Image
                  src={screenshot.src}
                  alt={screenshot.alt}
                  width={screenshot.width}
                  height={screenshot.height}
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="h-auto max-w-full rounded-xl"
                />
                </a>
                <figcaption className="mt-4 max-w-[80ch] text-base leading-7 text-[#40594f]">
                  {screenshot.caption} Imagen de ejemplo; tu vista puede variar según los datos y permisos.
                  <a href={screenshot.src} target="_blank" rel="noopener noreferrer" className="mt-2 block w-fit font-semibold text-brand-muted underline underline-offset-4">Ampliar captura en otra pestaña</a>
                </figcaption>
              </figure>
            )}
            <h3 className="mt-8 text-xl font-semibold text-[#073c34] sm:text-2xl">Cómo leer esta pantalla</h3>
            <dl className="mt-5 space-y-7">
              {section.reading.map((item) => (
                <div key={item.title}>
                  <dt className="text-lg font-semibold leading-7 text-[#073c34] sm:text-xl">{item.title}</dt>
                  <dd className={`mt-2 ${guideBody}`}>{item.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="paso-a-paso" aria-labelledby="que-hacer" className="mt-6 scroll-mt-6 rounded-2xl bg-white p-6 sm:p-10">
            <h2 id="que-hacer" className="mt-3 text-3xl font-semibold tracking-tight text-[#073c34]">Cómo usarla, paso a paso</h2>
            <div className="mt-8"><GuideSteps steps={section.steps} /></div>
          </section>

          {slug === "escucha" && (
            <aside className="mt-6 rounded-2xl bg-white p-6 sm:p-10">
              <h2 className="text-xl font-semibold text-[#073c34]">Después de Escucha: Coaching</h2>
              <p className={`mt-3 ${guideBody}`}>Las evaluaciones de escucha ayudan a preparar conversaciones de acompañamiento con cada colaborador.</p>
              <Link href="/guia/coaching" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-muted underline-offset-4 hover:underline">
                Ver la guía de Coaching <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </aside>
          )}

        </article>

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
