"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const examples = [
  {
    id: "espera",
    label: "Espera",
    comment: "Esperé casi veinte minutos para pagar y nadie me explicó qué pasaba.",
    branch: "Sucursal Centro",
    score: "2 de 5",
    priority: "Alta",
    category: "Tiempo de espera",
    summary: "La demora al pagar está afectando el cierre de la experiencia.",
    probableCause: "Cobertura insuficiente en caja durante una franja de alta demanda.",
    action: "Revisar turnos de caja y medir el tiempo de cobro durante los próximos 7 días.",
    owner: "Gerencia de sucursal",
    deadline: "24 horas",
  },
  {
    id: "atencion",
    label: "Atención",
    comment: "La comida estuvo bien, pero sentí que el equipo quería terminar rápido conmigo.",
    branch: "Sucursal Norte",
    score: "3 de 5",
    priority: "Media",
    category: "Calidad de atención",
    summary: "El producto cumple, pero el trato reduce la percepción general del servicio.",
    probableCause: "Cierre de turno con señales de prisa en la atención.",
    action: "Revisar el protocolo de despedida y observar el cierre de turno esta semana.",
    owner: "Supervisor de turno",
    deadline: "3 días",
  },
  {
    id: "limpieza",
    label: "Limpieza",
    comment: "La mesa estaba pegajosa y tuve que pedir dos veces que la limpiaran.",
    branch: "Sucursal Sur",
    score: "1 de 5",
    priority: "Alta",
    category: "Limpieza",
    summary: "La preparación de mesas está fallando antes de recibir al siguiente cliente.",
    probableCause: "No hay una verificación clara entre salida de cliente y nueva asignación.",
    action: "Asignar responsable por zona y usar una revisión rápida antes de volver a ocupar la mesa.",
    owner: "Encargado de sala",
    deadline: "Hoy",
  },
];

export function LandingDemoSection() {
  const [activeId, setActiveId] = useState(examples[0].id);
  const activeExample = examples.find((example) => example.id === activeId) ?? examples[0];

  return (
    <section id="prueba" className="bg-[#fffdf7] px-6 py-12 text-[#0d2b25] sm:px-10 lg:px-14 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <LandingReveal className="max-w-4xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#08775f]">Ejemplo guiado</p>
          <h2
            className="mt-2.5 text-[clamp(2.15rem,3.9vw,4rem)] font-bold leading-[1] text-[#062f28]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Comprueba qué cambia cuando un comentario se vuelve accionable
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#536e64]">
            Selecciona un caso. Verás la clase de lectura operativa que Perks prepara para el equipo; no es una respuesta automática al cliente.
          </p>
        </LandingReveal>

        <LandingReveal delayMs={100} soft>
          <div className="mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-[8px] border border-[#d6e1d9] bg-[#edf4ee] p-1" aria-label="Casos de ejemplo">
            {examples.map((example) => (
              <button
                key={example.id}
                type="button"
                aria-pressed={activeExample.id === example.id}
                onClick={() => setActiveId(example.id)}
                className={`min-w-28 rounded-[6px] px-4 py-2 text-sm font-extrabold transition ${
                  activeExample.id === example.id
                    ? "bg-white text-[#005542] shadow-[0_6px_18px_rgba(25,54,43,0.12)]"
                    : "text-[#577067] hover:text-[#005542]"
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </LandingReveal>

        <LandingReveal delayMs={160}>
          <div className="mt-4 grid overflow-hidden rounded-[8px] border border-[#d9e2da] bg-white shadow-[0_22px_60px_rgba(45,54,39,0.09)] lg:grid-cols-[0.84fr_1.16fr]">
            <div className="border-b border-[#d9e2da] bg-[#f6f7f0] p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3 text-[#00634f]">
                <MessageSquareText size={22} aria-hidden="true" />
                <p className="text-sm font-extrabold uppercase tracking-[0.14em]">Lo que dijo el cliente</p>
              </div>
              <blockquote
                className="mt-5 text-3xl font-bold leading-[1.15] text-[#143e34] sm:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                “{activeExample.comment}”
              </blockquote>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[#d7e1d8] pt-4 text-sm">
                <div>
                  <dt className="font-semibold text-[#71847c]">Sucursal</dt>
                  <dd className="mt-1 font-extrabold text-[#274b41]">{activeExample.branch}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#71847c]">Valoración</dt>
                  <dd className="mt-1 font-extrabold text-[#274b41]">{activeExample.score}</dd>
                </div>
              </dl>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold tracking-wide text-[#5f746b]">
                <span className="inline-flex items-center gap-1.5 text-[#9a5a12]">
                  <AlertTriangle size={15} strokeWidth={1.5} aria-hidden="true" />
                  Prioridad {activeExample.priority.toLowerCase()}
                </span>
                <span aria-hidden="true" className="text-[#c5d0c8]">
                  ·
                </span>
                <span className="text-[#0b715a]">{activeExample.category}</span>
              </div>

              <p className="mt-4 text-xl font-bold leading-8 text-[#173f35]">{activeExample.summary}</p>

              <dl className="mt-4 divide-y divide-[#e0e7e1] border-y border-[#e0e7e1]">
                <div className="grid gap-2 py-3.5 sm:grid-cols-[170px_1fr]">
                  <dt className="font-bold text-[#385b51]">Causa probable</dt>
                  <dd className="leading-7 text-[#61786f]">{activeExample.probableCause}</dd>
                </div>
                <div className="grid gap-2 py-3.5 sm:grid-cols-[170px_1fr]">
                  <dt className="flex items-center gap-2 font-bold text-[#385b51]">
                    <CheckCircle2 size={18} className="text-[#0d8a68]" aria-hidden="true" />
                    Siguiente acción
                  </dt>
                  <dd className="leading-7 text-[#61786f]">{activeExample.action}</dd>
                </div>
                <div className="grid gap-4 py-3.5 sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-[#385b51]">Responsable sugerido</dt>
                    <dd className="mt-1 text-[#61786f]">{activeExample.owner}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-bold text-[#385b51]">
                      <Clock3 size={18} className="text-[#0d8a68]" aria-hidden="true" />
                      Plazo sugerido
                    </dt>
                    <dd className="mt-1 text-[#61786f]">{activeExample.deadline}</dd>
                  </div>
                </div>
              </dl>

              <a href="#planes" className="mt-4 inline-flex items-center gap-2 font-extrabold text-[#00634f] hover:text-[#004c3c]">
                Ver opciones por operación
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[#71847c]">
            Ejemplo ilustrativo. La lectura real depende del comentario, el historial disponible y la configuración de cada negocio.
          </p>
        </LandingReveal>
      </div>
    </section>
  );
}
