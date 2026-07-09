import { ChevronDown } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const faqs = [
  {
    question: "¿Cómo recoge Perks los comentarios?",
    answer:
      "Cada sucursal puede compartir un QR o enlace propio. El cliente califica la experiencia, escribe su comentario y, si falta contexto, responde una sola pregunta adicional.",
  },
  {
    question: "¿La IA responde automáticamente al cliente?",
    answer:
      "No. Perks prepara la lectura, la prioridad y una acción sugerida para el equipo. Cualquier mensaje externo o decisión sensible debe ser revisado por una persona.",
  },
  {
    question: "¿Incluye WhatsApp, SMS o compensaciones automáticas?",
    answer:
      "No forman parte de la capacidad base actual. El sistema no envía mensajes por esos canales ni ejecuta compensaciones automáticamente. Una integración futura tendría alcance y costo propios.",
  },
  {
    question: "¿Puede trabajar con varias sucursales y equipos?",
    answer:
      "Sí. La plataforma organiza comentarios, alertas e informes por sucursal y permite administrar miembros, roles y permisos dentro de la organización.",
  },
  {
    question: "¿Detecta patrones aunque haya pocos comentarios?",
    answer:
      "Puede analizar cada comentario desde el inicio, pero los patrones y comparaciones necesitan volumen suficiente. Por eso los informes muestran cuándo la información todavía no alcanza para una conclusión firme.",
  },
  {
    question: "¿Perks reemplaza la supervisión del gerente?",
    answer:
      "No. Reduce el trabajo de lectura y priorización, pero las causas son probables y las acciones son recomendaciones. La validación operativa sigue siendo responsabilidad del equipo.",
  },
  {
    question: "¿Los planes ya tienen un precio final?",
    answer:
      "Todavía no se publican precios en esta página. La propuesta se ajusta por número de sucursales, volumen de comentarios, usuarios, informes y nivel de acompañamiento.",
  },
];

export function LandingFaqSection() {
  return (
    <section id="preguntas" className="bg-[#fffdf7] px-6 py-12 text-[#0d2b25] sm:px-10 lg:px-14 lg:py-16">
      <div className="mx-auto grid max-w-[1120px] gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-8">
        <LandingReveal>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#08775f]">Preguntas frecuentes</p>
          <h2
            className="mt-2.5 max-w-[11ch] text-[clamp(2.2rem,3.7vw,3.85rem)] font-bold leading-[1] text-[#062f28]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lo que Perks hace y lo que no
          </h2>
          <p className="mt-4 max-w-md text-lg leading-8 text-[#586f66]">
            Preferimos dejar claros los límites desde el inicio para que el diagnóstico parta de expectativas reales.
          </p>
        </LandingReveal>

        <LandingReveal delayMs={100} soft className="border-t border-[#dce4dc]">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-[#dce4dc]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-3.5 text-left text-lg font-bold text-[#173f35] marker:content-none">
                {faq.question}
                <ChevronDown size={21} className="shrink-0 text-[#08775f] transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="max-w-2xl pb-4 pr-10 leading-7 text-[#60766d]">{faq.answer}</p>
            </details>
          ))}
        </LandingReveal>
      </div>
    </section>
  );
}
