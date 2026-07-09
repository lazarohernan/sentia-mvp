import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const plans = [
  {
    name: "Piloto",
    scale: "1 sucursal",
    description: "Para validar el flujo completo en un establecimiento antes de expandirlo.",
    features: ["Hasta 750 comentarios al mes", "2 usuarios", "4 informes por periodo", "QR y alertas operativas"],
  },
  {
    name: "Esencial",
    scale: "Hasta 3 sucursales",
    description: "Para una operación pequeña que necesita seguimiento continuo y una vista consolidada.",
    features: ["Hasta 3,000 comentarios al mes", "5 usuarios", "4 informes por periodo", "Comparación entre sucursales"],
  },
  {
    name: "Pro",
    scale: "Hasta 8 sucursales",
    description: "Para cadenas en crecimiento con más responsables y revisiones semanales.",
    features: ["Hasta 10,000 comentarios al mes", "15 usuarios", "8 informes por periodo", "Seguimiento y anomalías"],
  },
  {
    name: "Empresa",
    scale: "Hasta 25 sucursales",
    description: "Para operaciones multi-sucursal con mayor volumen, permisos y acompañamiento.",
    features: ["Hasta 35,000 comentarios al mes", "40 usuarios", "16 informes por periodo", "Alcance y soporte acordados"],
  },
];

export function LandingPlansSection() {
  return (
    <section id="planes" className="bg-[#f7f1e5] px-6 py-12 text-[#0d2b25] sm:px-10 lg:px-14 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <LandingReveal className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#08775f]">Opciones propuestas</p>
            <h2
              className="mt-2.5 text-[clamp(2.15rem,3.8vw,3.9rem)] font-bold leading-[1] text-[#062f28]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Elige por tamaño de operación, no por una lista interminable
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#566f65] lg:justify-self-end">
            No publicamos precios todavía. Estas configuraciones sirven para ordenar el alcance inicial; los cupos y el acompañamiento se confirman durante el diagnóstico.
          </p>
        </LandingReveal>

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => (
            <LandingReveal
              key={plan.name}
              delayMs={70 + index * 70}
              soft
              className={`flex min-h-[360px] flex-col rounded-[8px] border p-4 ${
                index === 1
                  ? "border-[#0d725b] bg-[#eef7f1] shadow-[0_22px_55px_rgba(16,91,72,0.13)]"
                  : "border-[#e1d7c3] bg-white/78"
              }`}
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#08775f]">{plan.name}</p>
              <h3 className="mt-2.5 text-3xl font-bold leading-tight text-[#123d34]">{plan.scale}</h3>
              <p className="mt-2.5 min-h-[64px] leading-7 text-[#60766d]">{plan.description}</p>
              <ul className="mt-4 space-y-2.5 border-t border-[#dce4dc] pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-[#3e5e54]">
                    <Check size={17} className="mt-1 shrink-0 text-[#0c8668]" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/feedback/demo-cafe"
                className={`mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-extrabold transition hover:-translate-y-0.5 ${
                  index === 1
                    ? "bg-[#005542] text-white hover:bg-[#004434]"
                    : "border border-[#b8c7bd] bg-white text-[#124437] hover:border-[#0c735a]"
                }`}
              >
                Probar esta experiencia
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </LandingReveal>
          ))}
        </div>

        <LandingReveal delayMs={120} soft>
          <p className="mt-3 text-sm leading-6 text-[#71847c]">
            Configuración comercial de referencia. No representa una tarifa final ni uso ilimitado.
          </p>
        </LandingReveal>
      </div>
    </section>
  );
}
