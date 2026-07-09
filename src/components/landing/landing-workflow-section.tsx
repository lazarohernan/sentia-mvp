"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CircleHelp, QrCode, Workflow } from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const STEP_DURATION_MS = 6000;

const steps = [
  {
    number: "01",
    title: "Recoge la voz del cliente",
    description:
      "Cada sucursal comparte su QR o enlace. El cliente valora la experiencia y deja un comentario breve.",
    icon: QrCode,
    image: "/images/perks-workflow-feedback-v1.webp",
    imageAlt: "Una farmacéutica conversa con una clienta que comparte su opinión desde el celular",
    caption: "Primero recoge una señal real de la experiencia.",
  },
  {
    number: "02",
    title: "Aclara lo que falta",
    description:
      "Si el comentario es ambiguo, Perks hace una sola pregunta para obtener el motivo sin convertirlo en una encuesta larga.",
    icon: CircleHelp,
    image: "/images/perks-workflow-clarify-v1.webp",
    imageAlt: "Dos responsables de una cooperativa revisan juntos un caso en una tableta",
    caption: "Después, aclara lo que el cliente quiso decir.",
  },
  {
    number: "03",
    title: "Prioriza y da seguimiento",
    description:
      "El sistema organiza severidad, causa probable y acción recomendada para que el equipo sepa qué atender primero.",
    icon: Workflow,
    image: "/images/perks-workflow-action-v1.webp",
    imageAlt: "Dos responsables de un salón revisan una nota y acuerdan una acción de seguimiento",
    caption: "Por último, convierte la señal en una acción concreta.",
  },
];

export function LandingWorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const currentStep = steps[activeStep];

  const goToStep = useCallback((index: number) => {
    setActiveStep(index);
    progressRef.current = 0;
    setProgress(0);
    lastTickRef.current = null;
  }, []);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduceMotion(prefersReducedMotion);

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !isInView || isPaused) {
      lastTickRef.current = null;
      return;
    }

    let frameId = 0;

    const tick = (timestamp: number) => {
      if (lastTickRef.current == null) {
        lastTickRef.current = timestamp;
      }

      const delta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;

      const nextProgress = progressRef.current + (delta / STEP_DURATION_MS) * 100;

      if (nextProgress >= 100) {
        progressRef.current = 0;
        setProgress(0);
        setActiveStep((current) => (current + 1) % steps.length);
        lastTickRef.current = timestamp;
      } else {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isInView, isPaused, reduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="producto"
      className="bg-[#f6faf4] px-6 py-12 text-[#0d2b25] sm:px-10 lg:px-14 lg:py-16"
    >
      <div className="mx-auto max-w-[1240px]">
        <LandingReveal className="text-left">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#08775f]">Cómo funciona</p>
          <h2
            className="mt-2.5 max-w-[18ch] text-[clamp(2.2rem,3.9vw,4rem)] font-bold leading-[1] text-[#062f28]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            De una opinión suelta a una acción clara
          </h2>
          <p className="mt-4 max-w-[570px] text-lg leading-8 text-[#536e64]">
            Perks acompaña el recorrido completo sin añadir trabajo innecesario al cliente ni obligar al gerente a leer cada comentario.
          </p>
        </LandingReveal>

        <div className="mt-6 grid items-center gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:gap-10">
          <LandingReveal delayMs={80} className="relative min-h-[340px] overflow-hidden rounded-[8px] bg-[#dce9df] sm:min-h-[440px]">
            {steps.map((step, index) => (
              <div
                key={step.image}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  index === activeStep ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover object-[68%_center]"
                  priority={index === 0}
                />
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(4,41,33,0.78))] px-5 pb-4 pt-16 text-white sm:px-6 sm:pb-6">
              <p
                key={currentStep.caption}
                className="max-w-[520px] text-base font-semibold leading-7 transition-opacity duration-500 sm:text-lg"
              >
                {currentStep.caption}
              </p>
            </div>
          </LandingReveal>

          <LandingReveal delayMs={160}>
            <div
              className="divide-y divide-[#d7e3da] border-y border-[#d7e3da]"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocusCapture={() => setIsPaused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsPaused(false);
                }
              }}
            >
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;

                return (
                  <button
                    key={step.number}
                    type="button"
                    className={`grid w-full grid-cols-[48px_1fr] gap-3 py-3.5 text-left transition-colors duration-300 ${isActive ? "bg-[#edf7f0]" : "hover:bg-[#f3f8f3]"}`}
                    onClick={() => goToStep(index)}
                    aria-pressed={isActive}
                  >
                    <span className={`ml-2 flex h-10 w-10 items-center justify-center rounded-[8px] text-[#00634f] transition-colors duration-300 ${isActive ? "bg-[#cdebd9]" : "bg-[#e2f1e7]"}`}>
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7a8f86]">Paso {step.number}</p>
                      <h3 className="mt-0.5 text-xl font-bold text-[#143e34]">{step.title}</h3>
                      <p className="mt-1 leading-7 text-[#60766d]">{step.description}</p>

                      <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-[#d7e3da]" aria-hidden="true">
                        <div
                          className="h-full rounded-full bg-[#0c8668]"
                          style={{
                            width: isActive ? `${reduceMotion ? 100 : progress}%` : "0%",
                            transition: isActive ? "none" : "width 300ms ease",
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <a href="#prueba" className="mt-5 inline-flex items-center gap-2 text-base font-extrabold text-[#00634f] hover:text-[#004c3c]">
              Probar un caso guiado
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}
