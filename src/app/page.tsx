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
          <img
            src="/brand/perks-logo.png"
            alt="Perks"
            className="hero-enter-soft h-12 w-auto sm:h-14"
            style={{ animationDelay: "80ms" }}
          />

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

        <div className="relative flex flex-1 items-center justify-center py-14 lg:py-10" />
      </section>
    </main>
  );
}
