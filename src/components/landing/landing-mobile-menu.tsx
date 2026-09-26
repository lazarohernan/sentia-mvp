"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { isGuidedDemoEnabled, landingLoginCtaLabel } from "@/lib/app/guided-demo";

const navItems = [
  { href: "#producto", label: "Producto" },
  { href: "#prueba", label: "Cómo funciona" },
  { href: "#sectores", label: "Sectores" },
  { href: "#planes", label: "Opciones" },
  { href: "#preguntas", label: "Preguntas" },
];

export function LandingMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const showGuidedDemo = isGuidedDemoEnabled();

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative xl:hidden">
      <button
        type="button"
        ref={menuButtonRef}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex size-10 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {isOpen ? (
        <div id={menuId} className="absolute right-0 top-[calc(100%+10px)] z-30 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl bg-[#0d2b25] p-3">
          <nav aria-label="Navegación móvil" className="grid gap-1">
            <p className="px-3 pb-1 pt-1 text-xs font-semibold text-white/65">Explorar Perks</p>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {item.label}
              </a>
            ))}
            {showGuidedDemo ? (
              <Link
                href="/demo-guiada"
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#0d2b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Probar experiencia
              </Link>
            ) : null}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className={
                showGuidedDemo
                  ? "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  : "mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#0d2b25] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              }
            >
              {landingLoginCtaLabel()}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
