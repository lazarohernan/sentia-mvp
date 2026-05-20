import Link from "next/link";
import { Menu, User } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbf3e4] text-[#0d2b25]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.94)_0%,rgba(255,250,241,0.86)_34%,rgba(246,235,210,0.42)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,187,75,0.2),transparent_25%),radial-gradient(circle_at_82%_21%,rgba(47,151,112,0.18),transparent_26%),linear-gradient(110deg,rgba(255,255,255,0.4),rgba(239,251,242,0.28))]"
      />

      <section className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-7 py-6 sm:px-10 lg:px-14">
        <nav className="flex items-center justify-between gap-4">
          <p
            className="hero-enter-soft text-4xl font-bold leading-none text-[#053f34] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)", animationDelay: "80ms" }}
          >
            Perks
          </p>

          <div className="flex items-center justify-end gap-4">
            <Link
              href="/login"
              aria-label="Login"
              className="hero-enter-soft inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#cbbd9f] bg-white/54 text-[#103a32] shadow-[0_14px_32px_rgba(51,40,17,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
              style={{ animationDelay: "140ms" }}
            >
              <User size={22} aria-hidden="true" />
            </Link>
            <button
              type="button"
              aria-label="Abrir menú"
              className="hero-enter-soft inline-flex h-12 w-16 items-center justify-center rounded-full bg-[#064d3f] text-white shadow-[0_16px_36px_rgba(6,77,63,0.24)] transition hover:-translate-y-0.5 hover:bg-[#053f34]"
              style={{ animationDelay: "190ms" }}
            >
              <Menu size={27} aria-hidden="true" />
            </button>
          </div>
        </nav>

        <div className="relative flex flex-1 items-center justify-center py-14 lg:py-10">
          <div className="relative z-10 mx-auto max-w-[700px] text-center">
            <h1
              aria-label="Escucha lo que tu negocio aun no ve"
              className="text-[4.15rem] font-bold leading-[0.91] tracking-normal text-[#102832] sm:text-[5.55rem] lg:text-[6.65rem]"
              style={{
                fontFamily: "var(--font-display)",
                WebkitTextStroke: "0.9px currentColor",
                textShadow: "0 0 0 currentColor",
              }}
            >
              <span className="hero-enter block" style={{ animationDelay: "180ms" }}>
                Escucha lo que
              </span>
              <span className="hero-enter block" style={{ animationDelay: "280ms" }}>
                tu negocio
              </span>
              <span className="hero-enter block text-[#07936c]" style={{ animationDelay: "380ms" }}>
                aun no ve
              </span>
            </h1>
            <p
              className="hero-enter mx-auto mt-7 max-w-xl text-[1.42rem] font-normal leading-[1.24] text-[#344340] sm:text-[1.62rem]"
              style={{ animationDelay: "500ms" }}
            >
              <span className="block">
                Convierte cada comentario en
              </span>
              <span className="block">
                señales, alertas y decisiones claras.
              </span>
            </p>
            <div
              className="hero-enter-soft mt-10 flex flex-col justify-center gap-5 sm:flex-row"
              style={{ animationDelay: "620ms" }}
            >
              <Link
                href="/login"
                className="inline-flex h-14 min-w-56 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#078161,#045946)] px-8 text-base font-semibold text-white shadow-[0_18px_34px_rgba(4,89,70,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(4,89,70,0.27)]"
              >
                Ver plataforma
              </Link>
              <Link
                href="/feedback/demo-cafe"
                className="inline-flex h-14 min-w-64 items-center justify-center rounded-[14px] border-2 border-[#075445] bg-white/58 px-8 text-base font-medium text-[#075445] shadow-[0_14px_28px_rgba(51,40,17,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
              >
                Probar experiencia
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
