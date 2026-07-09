"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "#producto", label: "Producto" },
  { href: "#prueba", label: "Cómo funciona" },
  { href: "#sectores", label: "Sectores" },
  { href: "#planes", label: "Opciones" },
  { href: "#preguntas", label: "Preguntas" },
];

export function LandingMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative xl:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/18"
      >
        {isOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-60 overflow-hidden rounded-[22px] bg-[#0d2b25]/95 p-2 shadow-[0_22px_55px_rgba(8,28,22,0.35)] backdrop-blur-xl">
          <nav aria-label="Navegación móvil" className="grid">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mt-1 inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-sm font-bold text-[#0d2b25]"
            >
              Entrar a la demo
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
