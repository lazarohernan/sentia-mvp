"use client";

import {
  Bell,
  BellRing,
  Building2,
  ChartNoAxesCombined,
  Home,
  LogOut,
  MessageSquareText,
  QrCode,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";

export type DashboardNavView =
  | "resumen"
  | "comentarios"
  | "qr"
  | "alertas"
  | "sucursales"
  | "equipo";

const navItems = [
  { label: "Resumen", href: "/dashboard", view: "resumen", icon: Home },
  {
    label: "Comentarios",
    href: "/dashboard#comentarios",
    view: "comentarios",
    icon: MessageSquareText,
  },
  {
    label: "QR",
    href: "/dashboard#qr",
    view: "qr",
    icon: QrCode,
  },
  {
    label: "Alertas",
    href: "/dashboard#alertas",
    view: "alertas",
    icon: Bell,
  },
  {
    label: "Sucursales",
    href: "/dashboard#sucursales",
    view: "sucursales",
    icon: Building2,
  },
  {
    label: "Equipo",
    href: "/dashboard#equipo",
    view: "equipo",
    icon: UsersRound,
  },
] satisfies Array<{
  label: string;
  href: string;
  view: DashboardNavView;
  icon: LucideIcon;
}>;

type DashboardFloatingNavProps = {
  activeView: DashboardNavView;
  onViewChange: (view: DashboardNavView) => void;
};

function shouldUseClientNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function DashboardFloatingNav({
  activeView,
  onViewChange,
}: DashboardFloatingNavProps) {
  function handleNavClick(
    event: MouseEvent<HTMLAnchorElement>,
    view: DashboardNavView,
    href: string,
  ) {
    if (!shouldUseClientNavigation(event)) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", href);
    onViewChange(view);
  }

  return (
    <nav
      aria-label="Navegacion principal"
      className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl rounded-full border border-white/75 bg-[rgb(255_255_255_/_0.78)] px-2.5 py-2 shadow-[var(--shadow-float)] ring-1 ring-[rgb(2_44_34_/_0.06)] backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          onClick={(event) => handleNavClick(event, "resumen", "/dashboard")}
          className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5 text-emerald-900"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white shadow-sm shadow-emerald-900/20">
            <ChartNoAxesCombined size={18} aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-semibold tracking-normal sm:inline">
            Escucha
          </span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-[rgb(2_44_34_/_0.055)] p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(event) =>
                  handleNavClick(event, item.view, item.href)
                }
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition",
                  isActive
                    ? "bg-emerald-800 text-white shadow-sm shadow-emerald-900/20"
                    : "text-slate-600 hover:bg-white hover:text-emerald-900 hover:shadow-sm",
                ].join(" ")}
              >
                <Icon size={17} aria-hidden="true" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-950"
            aria-label="Notificaciones"
          >
            <BellRing size={18} aria-hidden="true" />
            <span
              className="absolute right-2.5 top-2.5 size-2 rounded-full bg-emerald-700 ring-2 ring-white"
              aria-hidden="true"
            />
          </button>

          <Link
            href="/login"
            className="flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-950"
            aria-label="Salir"
          >
            <LogOut size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
