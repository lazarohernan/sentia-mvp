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
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import type { DashboardNotification } from "@/domain/dashboard/schemas";
import { dashboardMockNotifications } from "./dashboard.mock-data";

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
  notifications?: DashboardNotification[];
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
  notifications = dashboardMockNotifications,
}: DashboardFloatingNavProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | globalThis.MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

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
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              className={[
                "relative flex size-10 items-center justify-center rounded-full transition",
                isNotificationsOpen
                  ? "bg-emerald-50 text-emerald-950"
                  : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-950",
              ].join(" ")}
              aria-label="Notificaciones"
              aria-expanded={isNotificationsOpen}
              aria-haspopup="dialog"
              onClick={() => setIsNotificationsOpen((current) => !current)}
            >
              <BellRing size={18} aria-hidden="true" />
              {unreadCount > 0 ? (
                <>
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-emerald-700 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white"
                    aria-hidden="true"
                  >
                    {unreadCount}
                  </span>
                  <span className="sr-only">
                    {unreadCount} notificaciones sin leer
                  </span>
                </>
              ) : null}
            </button>

            {isNotificationsOpen ? (
              <div
                role="dialog"
                aria-label="Panel de notificaciones"
                className="absolute right-0 top-12 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-xl"
              >
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Notificaciones
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Señales recientes para seguimiento operativo.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-bold leading-none text-white">
                        {unreadCount}
                      </span>
                      Nuevas
                    </span>
                  </div>
                </div>

                <div className="max-h-[26rem] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm font-semibold text-slate-900">
                        Sin novedades para gerencia
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Cuando entren nuevas señales resumidas aparecerán aquí.
                      </p>
                    </div>
                  ) : notifications.map((notification) => {
                    const toneClass =
                      notification.tone === "danger"
                        ? "bg-red-500"
                        : notification.tone === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500";

                    return (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50"
                      >
                        <span
                          className={`mt-1 size-2.5 shrink-0 rounded-full ${toneClass}`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-5 text-slate-950">
                              {notification.title}
                            </p>
                            {notification.unread ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-800">
                                Nueva
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-5 text-slate-600">
                            {notification.detail}
                          </p>
                          <p className="mt-2 text-xs font-medium text-slate-400">
                            {notification.time}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

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
