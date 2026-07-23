"use client";

import { CheckSquare, Square, Trash2, X } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import type { DashboardNotification } from "@/domain/dashboard/schemas";
import {
  addHondurasDays,
  toHondurasDateString,
} from "@/domain/dashboard/honduras-time";

const PAGE_SIZE = 15;

/**
 * Overlays fullscreen (drawers/modals) SIEMPRE van a document.body vía portal.
 * Si se montan dentro del nav flotante (backdrop-blur / filter / transform),
 * `position: fixed` deja de anclarse al viewport y el panel queda atrapado
 * en la pastilla del menú.
 */

type NotificationsPageResponse = {
  items: DashboardNotification[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type DashboardNotificationsDrawerProps = {
  open: boolean;
  onClose: () => void;
  onNotificationNavigate?: (href: string) => void;
  onDeleted?: (deletedIds: string[]) => void;
};

function formatDayLabel(iso?: string) {
  if (!iso) return "Sin fecha";

  const day = toHondurasDateString(iso);
  const today = toHondurasDateString(new Date());
  const yesterday = addHondurasDays(today, -1);

  if (day === today) return "Hoy";
  if (yesterday && day === yesterday) return "Ayer";

  return new Intl.DateTimeFormat("es-HN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function groupByDate(items: DashboardNotification[]) {
  const groups = new Map<string, DashboardNotification[]>();

  for (const item of items) {
    const key = item.createdAtIso
      ? toHondurasDateString(item.createdAtIso)
      : "sin-fecha";
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([key, notifications]) => ({
    key,
    label: formatDayLabel(notifications[0]?.createdAtIso),
    notifications,
  }));
}

async function markNotificationAsRead(notificationId: string) {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function DashboardNotificationsDrawer({
  open,
  onClose,
  onNotificationNavigate,
  onDeleted,
}: DashboardNotificationsDrawerProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadPage = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/notifications?page=${nextPage}&pageSize=${PAGE_SIZE}`,
      );

      if (!response.ok) {
        throw new Error("load_failed");
      }

      const data = (await response.json()) as NotificationsPageResponse;
      setItems(data.items);
      setPage(data.page);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setSelectedIds(new Set());
    } catch {
      setError("No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadPage(1);
  }, [open, loadPage]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const groups = useMemo(() => groupByDate(items), [items]);
  const selectableIds = useMemo(
    () =>
      items
        .filter((item) => !item.isListeningSurvey)
        .map((item) => item.id),
    [items],
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableIds));
  }

  async function handleDelete(ids: string[] | "all") {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids === "all" ? { all: true } : { ids }),
      });

      if (!response.ok) {
        throw new Error("delete_failed");
      }

      const result = (await response.json()) as { deletedIds?: string[] };
      const deletedIds = result.deletedIds ?? (ids === "all" ? [] : ids);
      onDeleted?.(deletedIds);
      await loadPage(ids === "all" ? 1 : page);
    } catch {
      setError("No se pudieron eliminar las notificaciones.");
    } finally {
      setDeleting(false);
    }
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar notificaciones"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-drawer-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Bandeja</p>
            <h2
              id="notifications-drawer-title"
              className="mt-1 text-xl font-semibold text-slate-950"
            >
              Todas las notificaciones
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Historial paginado por fecha. Puedes borrar las elegidas o todas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={selectableIds.length === 0 || deleting}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-emerald-900 disabled:opacity-40"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Square className="h-4 w-4" aria-hidden="true" />
            )}
            {allSelected ? "Quitar selección" : "Elegir página"}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.size === 0 || deleting}
              onClick={() => void handleDelete(Array.from(selectedIds))}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Elegidas ({selectedIds.size})
            </button>
            <button
              type="button"
              disabled={total === 0 || deleting}
              onClick={() => {
                if (
                  window.confirm(
                    "¿Eliminar todas las notificaciones? Esta acción no se puede deshacer.",
                  )
                ) {
                  void handleDelete("all");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
            >
              Eliminar todas
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {error ? (
            <p className="px-2 py-4 text-sm text-red-600">{error}</p>
          ) : null}

          {loading ? (
            <p className="px-2 py-10 text-center text-sm text-slate-500">
              Cargando notificaciones…
            </p>
          ) : items.length === 0 ? (
            <div className="px-3 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Sin notificaciones
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cuando lleguen nuevas señales aparecerán aquí.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.key} className="mb-4">
                <h3 className="sticky top-0 z-10 bg-white/95 px-2 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 backdrop-blur">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.notifications.map((notification) => {
                    const toneClass =
                      notification.tone === "danger"
                        ? "bg-red-500"
                        : notification.tone === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500";
                    const selected = selectedIds.has(notification.id);

                    return (
                      <li
                        key={notification.id}
                        className="rounded-2xl transition hover:bg-slate-50"
                      >
                        <div className="flex gap-2 px-2 py-2">
                          {notification.isListeningSurvey ? (
                            <span className="mt-1 size-5 shrink-0" />
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSelected(notification.id)}
                              className="mt-1 inline-flex size-5 shrink-0 items-center justify-center text-slate-400 transition hover:text-emerald-800"
                              aria-label={
                                selected
                                  ? `Quitar ${notification.title}`
                                  : `Elegir ${notification.title}`
                              }
                              aria-pressed={selected}
                            >
                              {selected ? (
                                <CheckSquare className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Square className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                          <Link
                            href={notification.href}
                            onClick={() => {
                              if (notification.unread) {
                                void markNotificationAsRead(notification.id);
                              }
                              onNotificationNavigate?.(notification.href);
                              onClose();
                            }}
                            className="min-w-0 flex-1"
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${toneClass}`}
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
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
                                <p className="mt-1 text-xs font-medium text-slate-400">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-medium text-slate-500">
            Página {page} de {totalPages}
            {total > 0 ? ` · ${total} en total` : null}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading || deleting}
              onClick={() => void loadPage(page - 1)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!hasMore || loading || deleting}
              onClick={() => void loadPage(page + 1)}
              className="rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
