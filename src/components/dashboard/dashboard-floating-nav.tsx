"use client";

import {
  BarChart3,
  Bell,
  BellRing,
  ChartNoAxesCombined,
  ChevronDown,
  Ear,
  FileText,
  Home,
  MessageSquareText,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { createPortal } from "react-dom";

import { signOutAction } from "@/app/auth/actions";
import type { DashboardNotification } from "@/domain/dashboard/schemas";
import {
  DashboardUserMenu,
  type DashboardCurrentUser,
} from "./dashboard-user-menu";

export type DashboardNavView =
  | "resumen"
  | "comentarios"
  | "alertas"
  | "informes"
  | "gestion"
  | "escucha";

const navItems = [
  { label: "Resumen", href: "/dashboard", view: "resumen", icon: Home },
  {
    label: "Escucha",
    href: "/dashboard/escucha",
    view: "escucha",
    icon: Ear,
  },
  {
    label: "Valoraciones",
    href: "/dashboard#comentarios",
    view: "comentarios",
    icon: MessageSquareText,
  },
  {
    label: "Alertas",
    href: "/dashboard#alertas",
    view: "alertas",
    icon: Bell,
  },
  {
    label: "Informes",
    href: "/dashboard#informes",
    view: "informes",
    icon: FileText,
  },
  {
    label: "Gestión",
    href: "/dashboard#equipo",
    view: "gestion",
    icon: SlidersHorizontal,
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
  currentUser?: DashboardCurrentUser;
  listeningSubNav?: {
    activeTab: "analytics" | "coaching";
    analyticsHref: string;
    coachingHref: string;
  };
};

async function markNotificationAsRead(notificationId: string) {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

function shouldUseClientNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

// Retraso al cerrar: da tiempo al cursor de llegar al panel flotante
const SUBMENU_CLOSE_DELAY_MS = 180;

export function DashboardFloatingNav({
  activeView,
  onViewChange,
  notifications = [],
  currentUser,
  listeningSubNav,
}: DashboardFloatingNavProps) {
  const resolvedNotifications = notifications;

  // ── Notificaciones ────────────────────────────────────────────────────────
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  // ── Submenú Escucha ───────────────────────────────────────────────────────
  const [isListeningOpen, setIsListeningOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const listeningTriggerRef = useRef<HTMLButtonElement | null>(null);
  const listeningMenuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningMenuId = useId();

  // Renderizar portal solo en cliente (SSR-safe)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const unreadCount = resolvedNotifications.filter(
    (n) => n.unread,
  ).length;

  // ── Helpers para abrir/cerrar el submenú ─────────────────────────────────
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setIsListeningOpen(false);
    }, SUBMENU_CLOSE_DELAY_MS);
  }, [cancelClose]);

  const openListening = useCallback(() => {
    cancelClose();
    const trigger = listeningTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 208; // w-52 = 13rem = 208px
    const left = Math.max(
      8,
      Math.min(
        rect.left + rect.width / 2 - menuWidth / 2,
        window.innerWidth - menuWidth - 8,
      ),
    );
    setMenuPos({ top: rect.bottom + 8, left });
    setIsListeningOpen(true);
  }, [cancelClose]);

  const closeListeningImmediate = useCallback(() => {
    cancelClose();
    setIsListeningOpen(false);
    listeningTriggerRef.current?.focus();
  }, [cancelClose]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Actualizar posición si la ventana cambia de tamaño mientras está abierto
  useEffect(() => {
    if (!isListeningOpen) return;

    function updatePosition() {
      const trigger = listeningTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 208;
      const left = Math.max(
        8,
        Math.min(
          rect.left + rect.width / 2 - menuWidth / 2,
          window.innerWidth - menuWidth - 8,
        ),
      );
      setMenuPos({ top: rect.bottom + 8, left });
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isListeningOpen]);

  // Cerrar al hacer clic fuera y con Escape
  useEffect(() => {
    function handlePointerDown(event: globalThis.MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        isListeningOpen &&
        !listeningTriggerRef.current?.contains(event.target as Node) &&
        !listeningMenuRef.current?.contains(event.target as Node)
      ) {
        setIsListeningOpen(false);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        if (isListeningOpen) closeListeningImmediate();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isListeningOpen, closeListeningImmediate]);

  // Teclado en el trigger: ↓, Enter, Space abren el menú y mueven foco
  function handleListeningTriggerKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
  ) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openListening();
      setTimeout(() => {
        const firstItem = listeningMenuRef.current?.querySelector<HTMLAnchorElement>(
          "[role='menuitem']",
        );
        firstItem?.focus();
      }, 0);
    }
  }

  function handleNavClick(
    event: MouseEvent<HTMLAnchorElement>,
    view: DashboardNavView,
    href: string,
  ) {
    if (!shouldUseClientNavigation(event)) return;

    const targetUrl = new URL(href, window.location.origin);
    if (targetUrl.pathname !== window.location.pathname) return;

    event.preventDefault();
    window.history.pushState({}, "", href);
    onViewChange(view);
  }

  return (
    <nav
      aria-label="Navegacion principal"
      className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl rounded-full border border-white/75 bg-[rgb(255_255_255/0.78)] px-2.5 py-2 shadow-float ring-1 ring-[rgb(2_44_34/0.06)] backdrop-blur-2xl"
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
            Perks
          </span>
        </Link>

        {/* ── Barra de navegación central ── */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-[rgb(2_44_34/0.055)] p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            // ── Ítem Escucha: submenú siempre disponible al hover ──
            if (item.view === "escucha") {
              const listeningOptions = [
                {
                  id: "analytics",
                  label: "Analítica",
                  href: listeningSubNav?.analyticsHref ?? "/dashboard/escucha",
                  icon: BarChart3,
                },
                {
                  id: "coaching",
                  label: "Coaching",
                  href: listeningSubNav?.coachingHref ?? "/dashboard/escucha/coaching",
                  icon: MessageSquareText,
                },
              ] as const;

              return (
                <div
                  key={item.label}
                  className="shrink-0"
                  onMouseEnter={openListening}
                  onMouseLeave={scheduleClose}
                >
                  {/*
                   * Trigger: <button> (no <a>) según WAI-ARIA para elementos
                   * que abren un menú. aria-expanded comunica el estado.
                   * El clic navega a la sección activa como fallback.
                   */}
                  <button
                    type="button"
                    ref={listeningTriggerRef}
                    aria-haspopup="menu"
                    aria-expanded={isListeningOpen}
                    aria-controls={listeningMenuId}
                    onFocus={openListening}
                    onBlur={scheduleClose}
                    onKeyDown={handleListeningTriggerKeyDown}
                    onClick={() => {
                      const activeHref =
                        listeningSubNav?.activeTab === "coaching"
                          ? (listeningSubNav.coachingHref ?? "/dashboard/escucha/coaching")
                          : (listeningSubNav?.analyticsHref ?? "/dashboard/escucha");
                      window.location.href = activeHref;
                    }}
                    className={[
                      "flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium transition",
                      isActive
                        ? "bg-emerald-800 text-white shadow-sm shadow-emerald-900/20"
                        : "text-slate-600 hover:bg-white hover:text-emerald-900 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="hidden md:inline">{item.label}</span>
                    <ChevronDown
                      size={13}
                      aria-hidden="true"
                      className={[
                        "transition-transform duration-150",
                        isListeningOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {/*
                   * Portal a document.body para escapar del overflow-x-auto
                   * del contenedor padre. Posición calculada con getBoundingClientRect.
                   */}
                  {isListeningOpen && mounted
                    ? createPortal(
                        <div
                          id={listeningMenuId}
                          ref={listeningMenuRef}
                          role="menu"
                          aria-label="Opciones de Escucha"
                          style={{ top: menuPos.top, left: menuPos.left }}
                          onMouseEnter={cancelClose}
                          onMouseLeave={scheduleClose}
                          className="fixed z-60 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] ring-1 ring-black/5 backdrop-blur-xl"
                        >
                          {listeningOptions.map((subItem, idx) => {
                            const SubIcon = subItem.icon;
                            const isSubActive =
                              listeningSubNav?.activeTab === subItem.id;

                            return (
                              <Link
                                key={subItem.id}
                                href={subItem.href}
                                role="menuitem"
                                tabIndex={0}
                                aria-current={isSubActive ? "page" : undefined}
                                onFocus={cancelClose}
                                onBlur={scheduleClose}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    closeListeningImmediate();
                                  }
                                  if (e.key === "ArrowDown") {
                                    e.preventDefault();
                                    const items =
                                      listeningMenuRef.current?.querySelectorAll<HTMLAnchorElement>(
                                        "[role='menuitem']",
                                      );
                                    if (items)
                                      items[
                                        (idx + 1) % items.length
                                      ]?.focus();
                                  }
                                  if (e.key === "ArrowUp") {
                                    e.preventDefault();
                                    const items =
                                      listeningMenuRef.current?.querySelectorAll<HTMLAnchorElement>(
                                        "[role='menuitem']",
                                      );
                                    if (items)
                                      items[
                                        (idx - 1 + items.length) % items.length
                                      ]?.focus();
                                  }
                                }}
                                className={[
                                  "flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition",
                                  isSubActive
                                    ? "bg-emerald-800 text-white"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-emerald-900",
                                ].join(" ")}
                              >
                                <SubIcon size={16} aria-hidden="true" />
                                {subItem.label}
                              </Link>
                            );
                          })}
                        </div>,
                        document.body,
                      )
                    : null}
                </div>
              );
            }

            // ── Ítems normales ──
            return (
              <div key={item.label} className="relative shrink-0">
                <Link
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
              </div>
            );
          })}
        </div>

        {/* ── Zona derecha: notificaciones + usuario ── */}
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
              onClick={() => setIsNotificationsOpen((c) => !c)}
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
                className="absolute right-0 top-12 w-88 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-xl"
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

                <div className="max-h-104 overflow-y-auto p-2">
                  {resolvedNotifications.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm font-semibold text-slate-900">
                        Sin novedades para gerencia
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Cuando entren nuevas señales resumidas aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    resolvedNotifications.map((notification) => {
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
                          onClick={() => {
                            if (notification.unread) {
                              void markNotificationAsRead(notification.id);
                            }
                            setIsNotificationsOpen(false);
                          }}
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
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {currentUser ? (
            <DashboardUserMenu user={currentUser} />
          ) : (
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex size-10 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white"
                aria-label="Salir"
              >
                U
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}
