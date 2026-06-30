import { Clock3, MessageCircleMore, TrendingDown } from "lucide-react";

const problems = [
  {
    title: "Clientes se van sin decir por qué",
    description: "No sabes qué está fallando hasta que ya es tarde.",
    icon: TrendingDown,
  },
  {
    title: "Tu equipo responde, pero no siempre escucha",
    description: "Las interacciones suceden, pero el aprendizaje no queda.",
    icon: MessageCircleMore,
  },
  {
    title: "Los problemas aparecen cuando ya cuestan dinero",
    description: "Sin seguimiento, los mismos errores se repiten.",
    icon: Clock3,
  },
];

export function LandingProblemSection() {
  return (
    <section className="bg-[#fbf3e4] px-6 py-20 text-[#0d2b25] sm:px-10 lg:px-14 lg:py-24">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[var(--font-display)] text-[clamp(2.2rem,4vw,4.1rem)] font-bold leading-[0.98] tracking-normal text-[#062f28]">
            Lo que muchos negocios enfrentan a diario
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#4f6b61]">
            La mayoría de reclamos importantes no llegan como reportes ordenados. Llegan como comentarios sueltos, respuestas tardías y señales que nadie consolida.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {problems.map((problem) => {
            const Icon = problem.icon;

            return (
              <article
                key={problem.title}
                className="rounded-[8px] border border-[#eadfc9] bg-white/72 p-7 shadow-[0_18px_46px_rgba(55,43,19,0.08)] backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#e9f6ef] text-[#00634f]">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h3 className="mt-7 text-xl font-bold leading-7 text-[#123d34]">{problem.title}</h3>
                <p className="mt-4 text-base leading-7 text-[#5c7469]">{problem.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
