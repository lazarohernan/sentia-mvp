"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const journey = [
  {
    title: "Prepara una sucursal",
    body: "Comprueba sus datos y encuentra el QR que usarás para pedir opiniones.",
    href: "/guia/gestion",
    link: "Ver Gestión",
  },
  {
    title: "Comparte el QR",
    body: "Tus clientes podrán contar cómo les fue desde su teléfono.",
    href: "/guia/inicio",
    link: "Ver Inicio",
  },
  {
    title: "Atiende las señales",
    body: "Lee las valoraciones y da seguimiento a los asuntos importantes.",
    href: "/guia/valoraciones",
    link: "Ver Valoraciones",
  },
  {
    title: "Aprende del periodo",
    body: "Usa los informes y las mejoras para decidir qué conviene cambiar.",
    href: "/guia/informes",
    link: "Ver Informes",
  },
] as const;

export function GuideJourney() {
  const [active, setActive] = useState(0);
  const current = journey[active];

  return (
    <section aria-labelledby="primeros-pasos" className="mt-11">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="primeros-pasos" className="text-3xl font-semibold tracking-tight text-[#073c34] sm:text-4xl">Cómo empezar</h2>
          <p className="mt-2 text-base text-text-secondary">Pulsa un paso para ver qué hacer.</p>
        </div>
        <span className="text-sm font-medium text-text-secondary">{active + 1} de {journey.length}</span>
      </div>

      <div className="mt-6 grid overflow-hidden rounded-2xl border border-[#bbd1c6] bg-white lg:grid-cols-[1.2fr_1fr]">
        <div className="grid grid-cols-2 gap-px bg-[#d8e7dd] sm:grid-cols-4 lg:grid-cols-2">
          {journey.map((step, index) => (
            <button
              key={step.title}
              type="button"
              aria-pressed={active === index}
              onClick={() => setActive(index)}
              className={`min-h-24 p-4 text-left transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#06483d] sm:p-5 ${active === index ? "bg-[#e4f1e7] text-[#073c34]" : "bg-white text-[#42655a] hover:bg-[#f4f8f4]"}`}
            >
              <span className="block text-xs font-semibold tracking-widest">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-2 block text-sm font-semibold leading-snug sm:text-base">{step.title}</span>
            </button>
          ))}
        </div>
        <div className="flex min-h-48 flex-col justify-center bg-[#f2f7f1] p-6 sm:p-8">
          <span className="text-xs font-semibold tracking-widest text-[#54766a]">PASO {String(active + 1).padStart(2, "0")}</span>
          <h3 className="mt-3 text-xl font-semibold text-[#073c34] sm:text-2xl">{current.title}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#42655a] sm:text-base">{current.body}</p>
          <Link href={current.href} className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#06483d] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06483d]">
            {current.link} <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
