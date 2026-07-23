"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";

import { DashboardOrganizationProfilePanel } from "./dashboard-organization-profile-panel";

type DashboardBusinessProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
  initialSettings?: OrganizationSettings;
  canManage?: boolean;
  onSaved?: (settings: OrganizationSettings) => void;
};

/**
 * Overlay fullscreen: siempre a document.body vía portal.
 * Evita que backdrop-blur/transform de ancestros atrapen position:fixed.
 */
export function DashboardBusinessProfileDrawer({
  open,
  onClose,
  initialSettings,
  canManage = false,
  onSaved,
}: DashboardBusinessProfileDrawerProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
        aria-label="Cerrar perfil del negocio"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-profile-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Perfil del negocio</p>
            <h2 id="business-profile-title" className="mt-1 text-xl font-semibold text-slate-950">
              {initialSettings?.name ?? "Tu empresa"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Datos visibles de tu marca en Perks.
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <DashboardOrganizationProfilePanel
            initialSettings={initialSettings}
            canManage={canManage}
            onSaved={onSaved}
            showHeader={false}
          />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
