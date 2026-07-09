import { Clock3, MessageCircleMore, TrendingDown } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const problems = [
  {
    number: "01",
    title: "Clientes se van sin decir por qué",
    description: "No sabes qué está fallando hasta que ya es tarde.",
    icon: TrendingDown,
  },
  {
    number: "02",
    title: "Tu equipo responde, pero no siempre escucha",
    description: "Las interacciones suceden, pero el aprendizaje no queda.",
    icon: MessageCircleMore,
  },
  {
    number: "03",
    title: "Los problemas aparecen cuando ya cuestan dinero",
    description: "Sin seguimiento, los mismos errores se repiten.",
    icon: Clock3,
  },
];

export function LandingProblemSection() {
  return (
    <section className="bg-[#fbf3e4] px-6 py-12 text-[#0d2b25] sm:px-10 lg:px-14 lg:py-16">
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="max-w-3xl text-left">
          <h2
            className="text-[clamp(2rem,3.5vw,3.5rem)] font-bold leading-[1.02] tracking-normal text-[#062f28]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lo que muchos negocios enfrentan a diario
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-[#4f6b61]">
            La mayoría de reclamos importantes no llegan como reportes ordenados. Llegan como comentarios sueltos, respuestas tardías y señales que nadie consolida.
          </p>
        </LandingReveal>

        <div className="mt-8 border-t border-[#dccfba] md:grid md:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problem.icon;

            return (
              <LandingReveal
                key={problem.title}
                delayMs={80 + index * 90}
                soft
                className={`border-b border-[#dccfba] py-6 md:border-b-0 md:px-6 md:py-7 ${
                  index === 0 ? "md:pl-0" : "md:border-l"
                } ${index === problems.length - 1 ? "md:pr-0" : ""}`}
              >
                <div className="flex items-center gap-3 text-[#00634f]">
                  <Icon size={18} strokeWidth={1.35} aria-hidden="true" />
                  <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7a8f86]">
                    {problem.number}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold leading-7 text-[#123d34]">{problem.title}</h3>
                <p className="mt-2 text-base leading-7 text-[#5c7469]">{problem.description}</p>
              </LandingReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
