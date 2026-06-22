"use client";

import {
  Bell,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  History,
  Loader2,
  Save,
  Shield,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PushNotificationsToggle } from "@/components/push/push-notifications-toggle";
import { PlatformFooter } from "@/components/platform-footer";
import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu";
import { getTimeOfDayGreetingInHonduras } from "@/domain/dashboard/honduras-time";
import { formatUserShortName, getUserInitials } from "@/domain/auth/profile";
import type { Branch } from "@/domain/branches/schemas";
import type { DashboardNotification } from "@/domain/dashboard/schemas";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import {
  listeningLevelDescriptions,
  listeningLevelLabels,
  listeningLevelReflectionPrompts,
} from "@/domain/listening/schemas";
import type {
  ListeningSettings,
  ListeningWeekday,
} from "@/domain/listening/settings";
import {
  buildCollaboratorViewPath,
  readCollaboratorViewFromLocation,
  type CollaboratorPortalView,
} from "@/domain/collaborator/portal-navigation";

const HISTORY_PAGE_SIZE = 8;

async function markNotificationAsRead(notificationId: string) {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

type CollaboratorPortalViewProps = {
  assignedBranch: Branch | null;
  currentUser: {
    fullName: string;
    email: string | null;
  };
  organizationName?: string;
  notifications: DashboardNotification[];
  listeningEvents: ListeningEventRow[];
  listeningSettings: ListeningSettings;
  hasActiveListeningSurvey: boolean;
  hasMoreListeningHistory?: boolean;
  initialView?: CollaboratorPortalView;
};

type LevelKey = ListeningEventRow["level"];

const levels: Array<{
  key: LevelKey;
  label: string;
  description: string;
}> = [
  {
    key: "download",
    label: listeningLevelLabels.download,
    description: listeningLevelDescriptions.download,
  },
  {
    key: "debate",
    label: listeningLevelLabels.debate,
    description: listeningLevelDescriptions.debate,
  },
  {
    key: "empathetic_listening",
    label: listeningLevelLabels.empathetic_listening,
    description: listeningLevelDescriptions.empathetic_listening,
  },
  {
    key: "generative_dialogue",
    label: listeningLevelLabels.generative_dialogue,
    description: listeningLevelDescriptions.generative_dialogue,
  },
];

const weekdayLabels: Record<ListeningWeekday, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

function formatSchedule(settings: ListeningSettings) {
  if (!settings.remindersEnabled || settings.reminderTimes.length === 0) {
    return "Aún no hay recordatorios programados";
  }

  const days = settings.reminderWeekdays.map((day) => weekdayLabels[day]).join(", ");
  return `${days} · ${settings.reminderTimes.join(", ")}`;
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CollaboratorPortalView({
  assignedBranch,
  currentUser,
  organizationName,
  notifications,
  listeningEvents,
  listeningSettings,
  hasActiveListeningSurvey,
  hasMoreListeningHistory = false,
  initialView = "inicio",
}: CollaboratorPortalViewProps) {
  const [activeView, setActiveView] = useState<CollaboratorPortalView>(initialView);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState(notifications);
  const [acknowledgedNotificationIds, setAcknowledgedNotificationIds] = useState<
    Set<string>
  >(() => new Set());
  const [historyEvents, setHistoryEvents] = useState(listeningEvents);
  const [hasMoreHistory, setHasMoreHistory] = useState(hasMoreListeningHistory);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [isEvaluationActive, setIsEvaluationActive] = useState(hasActiveListeningSurvey);
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | null>(null);
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = visibleNotifications.filter(
    (notification) =>
      notification.unread && !acknowledgedNotificationIds.has(notification.id),
  ).length;
  const scheduleLabel = useMemo(
    () => formatSchedule(listeningSettings),
    [listeningSettings],
  );
  const selectedReflectionPrompt = selectedLevel
    ? listeningLevelReflectionPrompts[selectedLevel]
    : "Elige un nivel y te proponemos una pregunta para guiar tu reflexión.";

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    setHistoryEvents(listeningEvents);
    setHasMoreHistory(hasMoreListeningHistory);
  }, [hasMoreListeningHistory, listeningEvents]);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    setIsEvaluationActive(hasActiveListeningSurvey);
  }, [hasActiveListeningSurvey]);

  useEffect(() => {
    function handlePopState() {
      setActiveView(readCollaboratorViewFromLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateToView(view: CollaboratorPortalView) {
    setActiveView(view);
    const nextPath = buildCollaboratorViewPath(view);

    if (window.location.pathname + window.location.search !== nextPath) {
      window.history.pushState({ view }, "", nextPath);
    }
  }

  function acknowledgeNotification(notification: DashboardNotification) {
    setAcknowledgedNotificationIds((current) => {
      const next = new Set(current);
      next.add(notification.id);
      return next;
    });

    if (!notification.isListeningSurvey && notification.unread) {
      void markNotificationAsRead(notification.id);
      setVisibleNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, unread: false } : item,
        ),
      );
    }
  }

  async function loadMoreHistory() {
    if (isLoadingMoreHistory || !hasMoreHistory) {
      return;
    }

    setIsLoadingMoreHistory(true);

    try {
      const response = await fetch(
        `/api/collaborator/listening-events?offset=${historyEvents.length}&limit=${HISTORY_PAGE_SIZE}`,
        { credentials: "same-origin" },
      );
      const body = (await response.json()) as {
        events?: ListeningEventRow[];
        hasMore?: boolean;
        error?: string;
      };

      if (!response.ok || !body.events) {
        return;
      }

      setHistoryEvents((current) => [...current, ...body.events!]);
      setHasMoreHistory(Boolean(body.hasMore));
    } finally {
      setIsLoadingMoreHistory(false);
    }
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function handleSubmit() {
    if (!selectedLevel || !assignedBranch || !isEvaluationActive) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/collaborator/listening-events", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: assignedBranch.id,
          level: selectedLevel,
          note: reflection.trim() || undefined,
        }),
      });
      const body = (await response.json()) as {
        event?: ListeningEventRow;
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "No se pudo guardar la evaluación.");
        return;
      }

      setIsSubmitted(true);
      setIsEvaluationActive(false);
      if (body.event) {
        setHistoryEvents((current) => [body.event!, ...current]);
      }
      setVisibleNotifications((current) =>
        current.filter((notification) => !notification.isListeningSurvey),
      );
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestPasswordReset() {
    setResetMessage("");
    setIsResettingPassword(true);

    try {
      const response = await fetch("/api/collaborator/password-reset", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await response.json()) as { error?: string };

      setResetMessage(
        response.ok
          ? "Te enviamos un correo para reiniciar tu contraseña."
          : body.error ?? "No se pudo enviar el correo de recuperación.",
      );
    } catch {
      setResetMessage("No se pudo conectar con el servidor.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  const navItems: Array<{
    key: Exclude<CollaboratorPortalView, "perfil">;
    label: string;
    icon: typeof ClipboardCheck;
  }> = [
    { key: "inicio", label: "Dashboard", icon: ClipboardCheck },
    { key: "evaluacion", label: "Evaluación", icon: BellRing },
  ];

  const userInitials = getUserInitials(currentUser.fullName);
  const userShortName = useMemo(
    () => formatUserShortName(currentUser.fullName),
    [currentUser.fullName],
  );
  const timeGreeting = useMemo(() => getTimeOfDayGreetingInHonduras(), []);

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f4f8f5_0%,#e9f0ed_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-368 flex-1 flex-col px-4 pb-4 pt-28 sm:px-6 lg:px-8">
        <header className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl rounded-full bg-[rgb(255_255_255/0.78)] px-2.5 py-2 shadow-[0_8px_28px_rgba(6,77,63,0.1)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center rounded-full px-3 py-1.5">
              <img src="/brand/perks-logo.png" alt="Perks" className="h-7 w-auto" />
            </div>

            <div className="flex min-w-0 items-center justify-end gap-1">
              <nav
                aria-label="Menu colaborador"
                className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-[rgb(2_44_34/0.055)] p-1"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => navigateToView(item.key)}
                      className={[
                        "relative inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition",
                        isActive
                          ? "bg-slate-950 text-white hover:bg-black"
                          : "text-slate-600 hover:bg-white hover:text-emerald-900",
                      ].join(" ")}
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span className="hidden sm:inline">{item.label}</span>
                      {item.key === "evaluacion" && isEvaluationActive ? (
                        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              <div className="relative shrink-0" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((value) => !value)}
                  className="relative inline-flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-emerald-900"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {isNotificationsOpen ? (
                  <div
                    role="dialog"
                    aria-label="Notificaciones de colaborador"
                    className="absolute right-0 top-12 z-20 w-88 overflow-hidden rounded-3xl bg-white/95 shadow-[0_10px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl"
                  >
                    <div className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Notificaciones
                      </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto p-2">
                      <PushNotificationsToggle hideWhenEnabled flat />

                      {visibleNotifications.length === 0 ? (
                        <div className="px-3 py-8 text-center">
                          <p className="text-sm font-semibold text-slate-950">
                            Sin notificaciones
                          </p>
                        </div>
                      ) : (
                        visibleNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              acknowledgeNotification(notification);
                              navigateToView("evaluacion");
                              setIsNotificationsOpen(false);
                            }}
                            className="block w-full rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold leading-5 text-slate-950">
                                {notification.title}
                              </p>
                              {notification.unread &&
                              !acknowledgedNotificationIds.has(notification.id) ? (
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
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="shrink-0">
                <DashboardUserMenu
                  user={currentUser}
                  flat
                  onOpenUserProfile={() => navigateToView("perfil")}
                />
              </div>
            </div>
          </div>
        </header>

        {activeView === "inicio" ? (
          <section className="py-6">
            <h1
              className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {timeGreeting}, {userShortName}
            </h1>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.35rem] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Estado actual
              </p>
              <h1
                className="mt-3 text-3xl font-semibold tracking-normal text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isEvaluationActive
                  ? "Hay una evaluación por completar"
                  : "No hay evaluaciones por realizar"}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Cuando tu equipo te envíe una evaluación de escucha, podrás
                responderla aquí. Al terminar, te avisaremos cuando llegue la
                siguiente.
              </p>
              <button
                type="button"
                onClick={() => navigateToView("evaluacion")}
                disabled={!isEvaluationActive}
                className={[
                  "mt-5 inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition",
                  isEvaluationActive
                    ? "bg-emerald-800 text-white hover:bg-emerald-900"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                ].join(" ")}
              >
                <BellRing className="h-4 w-4" aria-hidden="true" />
                Ir a evaluación
              </button>
            </div>

            <aside className="space-y-4">
              <section className="rounded-[1.15rem] bg-white p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Horario configurado
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {scheduleLabel}
                </p>
              </section>
              <section className="rounded-[1.15rem] bg-white p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Última evaluación
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {historyEvents[0]?.levelLabel ?? "Aún sin evaluaciones"}
                </p>
                {historyEvents[0] ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {formatEventDate(historyEvents[0].createdAt)}
                  </p>
                ) : null}
              </section>
            </aside>
            </div>
          </section>
        ) : null}

        {activeView === "evaluacion" ? (
          <section className="grid gap-6 py-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.35rem] bg-white p-6">
              <div className="flex items-start justify-between gap-4 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Evaluación de escucha
                  </p>
                  <h1
                    className="mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ¿Cómo escuchaste hoy?
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sucursal: {assignedBranch?.name ?? "—"}
                  </p>
                </div>
                {isEvaluationActive ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    Por completar
                  </span>
                ) : null}
              </div>

              {!isEvaluationActive ? (
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                  <ClipboardCheck className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    No hay evaluaciones por realizar
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Cuando llegue una nueva, te avisaremos en la campana de
                    notificaciones.
                  </p>
                </div>
              ) : isSubmitted ? (
                <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-700" aria-hidden="true" />
                  <p className="mt-3 text-lg font-semibold text-emerald-950">
                    Evaluación registrada
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-emerald-800">
                    Gracias por compartir tu reflexión. Te avisaremos cuando
                    haya una nueva evaluación.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5">
                  <div className="grid gap-3">
                    {levels.map((level) => (
                      <label
                        key={level.key}
                        className={[
                          "block cursor-pointer rounded-2xl p-4 transition",
                          selectedLevel === level.key
                            ? "bg-emerald-50"
                            : "bg-slate-50/70 hover:bg-white",
                        ].join(" ")}
                      >
                        <div className="flex gap-3">
                          <input
                            type="radio"
                            name="listening-level"
                            value={level.key}
                            checked={selectedLevel === level.key}
                            onChange={() => setSelectedLevel(level.key)}
                            className="mt-1 size-4 shrink-0 accent-emerald-800"
                          />
                          <div>
                            <p className="font-semibold text-slate-950">{level.label}</p>
                            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                              {level.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Reflexión del turno
                    </span>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {selectedReflectionPrompt}
                    </p>
                    <textarea
                      value={reflection}
                      onChange={(event) => setReflection(event.target.value)}
                      maxLength={500}
                      placeholder="Comparte el momento que te vino a la mente. Unas líneas bastan."
                      className="mt-2 min-h-32 w-full rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-700/15"
                    />
                  </label>

                  {error ? (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selectedLevel || !assignedBranch || isSubmitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isSubmitting ? "Guardando..." : "Guardar evaluación"}
                  </button>
                </div>
              )}
            </div>

            <aside className="rounded-[1.35rem] bg-white p-6">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-emerald-800" aria-hidden="true" />
                <h2
                  className="text-lg font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Historial reciente
                </h2>
              </div>
              <div className="mt-5 space-y-3">
                {historyEvents.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                    Aún no tienes evaluaciones anteriores.
                  </p>
                ) : (
                  historyEvents.map((event) => (
                    <article
                      key={event.id}
                      className="rounded-xl bg-slate-50/70 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {event.levelLabel}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {formatEventDate(event.createdAt)}
                      </p>
                      {event.note ? (
                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {event.note}
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
                {hasMoreHistory ? (
                  <button
                    type="button"
                    onClick={() => void loadMoreHistory()}
                    disabled={isLoadingMoreHistory}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingMoreHistory ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    {isLoadingMoreHistory ? "Cargando..." : "Ver más evaluaciones"}
                  </button>
                ) : null}
              </div>
            </aside>
          </section>
        ) : null}

        {activeView === "perfil" ? (
          <section className="grid gap-5 py-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.35rem] bg-white p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-base font-bold text-white">
                  {userInitials}
                </span>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-950">
                    {currentUser.fullName}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {currentUser.email ?? "Sin correo"}
                  </p>
                </div>
              </div>

              <dl className="mt-6 space-y-4 pt-6 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500">Negocio</dt>
                  <dd className="mt-1 text-slate-950">
                    {organizationName ?? "Tu negocio"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Sucursal</dt>
                  <dd className="mt-1 text-slate-950">
                    {assignedBranch?.name ?? "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-5">
              <section className="rounded-[1.35rem] bg-white p-6">
                <Shield className="h-7 w-7 text-emerald-800" aria-hidden="true" />
                <h2 className="mt-3 text-xl font-semibold text-slate-950">
                  Seguridad
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Si necesitas cambiar tu contraseña, enviaremos un correo de
                  recuperación a tu cuenta.
                </p>
                <button
                  type="button"
                  onClick={requestPasswordReset}
                  disabled={isResettingPassword}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Shield className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isResettingPassword ? "Enviando..." : "Reiniciar contraseña"}
                </button>
                {resetMessage ? (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                    {resetMessage}
                  </p>
                ) : null}
              </section>

              <section className="rounded-[1.35rem] bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-950">
                  Notificaciones push
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Recibe avisos en este dispositivo aunque no tengas la app abierta.
                </p>
                <div className="mt-4">
                  <PushNotificationsToggle allowDisable flat />
                </div>
              </section>
            </div>
          </section>
        ) : null}
        <PlatformFooter />
      </section>
    </main>
  );
}
