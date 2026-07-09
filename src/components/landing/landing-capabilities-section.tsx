import {
  BellRing,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileChartColumn,
  HeartPulse,
  QrCode,
  ScanSearch,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { LandingReveal } from "@/components/landing/landing-reveal";

const capabilities = [
  {
    title: "QR por sucursal",
    description: "Recoge valoraciones y comentarios desde un enlace propio para cada establecimiento.",
    icon: QrCode,
  },
  {
    title: "Contexto adaptativo",
    description: "Pide una sola precisión cuando el comentario no explica bien el motivo.",
    icon: ScanSearch,
  },
  {
    title: "Alertas priorizadas",
    description: "Organiza severidad, categoría, causa probable y plazo sugerido.",
    icon: BellRing,
  },
  {
    title: "Seguimiento visible",
    description: "Permite registrar responsables, estados y acciones tomadas sobre cada caso.",
    icon: ClipboardCheck,
  },
  {
    title: "Informes operativos",
    description: "Resume patrones, calidad de información y cambios relevantes por periodo.",
    icon: FileChartColumn,
  },
  {
    title: "Gestión multi-sucursal",
    description: "Compara establecimientos y administra equipo, permisos y alcance de acceso.",
    icon: Building2,
  },
];

const sectors = [
  { label: "Restaurantes y cafeterías", icon: UtensilsCrossed },
  { label: "Clínicas y consultorios", icon: HeartPulse },
  { label: "Tiendas y retail", icon: ShoppingBag },
  { label: "Servicios profesionales", icon: BriefcaseBusiness },
  { label: "Cadenas y franquicias", icon: Store },
];

export function LandingCapabilitiesSection() {
  return (
    <section id="sectores" className="bg-[#0b4d3f] px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:gap-8">
          <LandingReveal>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#9fdcc6]">Capacidades disponibles</p>
            <h2
              className="mt-2.5 max-w-[12ch] text-[clamp(2.1rem,3.5vw,3.7rem)] font-bold leading-[1.02]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Una plataforma para escuchar y actuar
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-[#c8ddd4]">
              El valor está en conectar captura, lectura y seguimiento dentro de una misma operación.
            </p>
          </LandingReveal>

          <div className="grid border-t border-white/20 sm:grid-cols-2">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;

              return (
                <LandingReveal
                  key={capability.title}
                  delayMs={60 + index * 50}
                  soft
                  className="border-b border-white/20 py-4 sm:px-4 sm:odd:border-r"
                >
                  <Icon size={22} strokeWidth={1.5} className="text-[#73d2b1]" aria-hidden="true" />
                  <h3 className="mt-2.5 text-lg font-bold">{capability.title}</h3>
                  <p className="mt-1 leading-7 text-[#bfd4cb]">{capability.description}</p>
                </LandingReveal>
              );
            })}
          </div>
        </div>

        <LandingReveal delayMs={120} soft className="mt-8 border-t border-white/20 pt-5">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#9fdcc6]">Pensado para negocios de servicio</p>
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3 text-base font-bold text-[#eef7f3]">
            {sectors.map((sector) => {
              const Icon = sector.icon;

              return (
                <span key={sector.label} className="inline-flex items-center gap-2.5">
                  <Icon size={18} strokeWidth={1.35} className="shrink-0 text-[#73d2b1]" aria-hidden="true" />
                  {sector.label}
                </span>
              );
            })}
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
