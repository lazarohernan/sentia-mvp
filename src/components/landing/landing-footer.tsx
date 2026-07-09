import Image from "next/image";
import Link from "next/link";
import { LandingReveal } from "@/components/landing/landing-reveal";

const productLinks = [
  { href: "#producto", label: "Producto" },
  { href: "#prueba", label: "Cómo funciona" },
  { href: "#planes", label: "Opciones" },
  { href: "#preguntas", label: "Preguntas" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[#062f28] px-6 pb-5 pt-8 text-white sm:px-10 lg:px-14">
      <LandingReveal soft className="mx-auto max-w-[1240px]">
        <div className="grid gap-6 border-b border-white/16 pb-6 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <Image src="/brand/perks-logo-white.png" alt="Perks" width={160} height={52} className="h-8 w-auto" />
            <p className="mt-3 max-w-sm leading-7 text-[#bcd2c9]">
              Plataforma de escucha operativa para convertir comentarios en decisiones claras por negocio y sucursal.
            </p>
          </div>

          <nav aria-label="Producto">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#89cbb4]">Producto</p>
            <div className="mt-2.5 grid gap-2">
              {productLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-sm font-semibold text-[#d7e7e0] hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <nav aria-label="Acceso">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#89cbb4]">Acceso</p>
            <div className="mt-2.5 grid gap-2">
              <Link href="/feedback/demo-cafe" className="text-sm font-semibold text-[#d7e7e0] hover:text-white">Probar experiencia</Link>
              <Link href="/login" className="text-sm font-semibold text-[#d7e7e0] hover:text-white">Entrar a la demo</Link>
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4 text-sm text-[#91aca1] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Perks. Todos los derechos reservados.</p>
          <p>Desarrollado en Honduras.</p>
        </div>
      </LandingReveal>
    </footer>
  );
}
