"use client";

import {
  Copy,
  ExternalLink,
  Printer,
  QrCode,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import type { Branch } from "@/domain/branches/schemas";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import { dashboardMockQrRecords } from "./dashboard.mock-data";
import { DashboardDemoDataToggle } from "./dashboard-demo-data-toggle";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardQrPreview } from "./dashboard-qr-preview";
import { DashboardSection } from "./dashboard-section";

type DashboardQrViewProps = {
  showDemoData: boolean;
  onToggleDemoData: () => void;
  organizationName?: string;
  branches?: Branch[];
  dashboardData?: DashboardSummaryData;
};

type QrRecord = (typeof dashboardMockQrRecords)[number];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildQrRecord(business: string, branch: string): QrRecord {
  const baseSlug = slugify(`${business}-${branch}`) || "nuevo-qr";

  return {
    id: `qr-local-${Date.now()}`,
    business,
    branch,
    slug: baseSlug,
    status: "Activo",
    createdAt: new Date().toISOString().slice(0, 10),
    scans: 0,
    comments: 0,
  };
}

function getBranchCommentCount(
  branchName: string,
  dashboardData?: DashboardSummaryData,
) {
  const health = dashboardData?.branchHealth.find((item) => item.branch === branchName);

  return health?.comments ?? "Sin comentarios";
}

export function DashboardQrView({
  showDemoData,
  onToggleDemoData,
  organizationName,
  branches = [],
  dashboardData,
}: DashboardQrViewProps) {
  const [business, setBusiness] = useState("");
  const [branch, setBranch] = useState("");
  const [query, setQuery] = useState("");
  const [createdRecords, setCreatedRecords] = useState<QrRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const liveRecords = useMemo(
    () =>
      branches.map((item) => ({
        id: item.id,
        business: organizationName ?? "Negocio",
        branch: item.name,
        slug: item.slug,
        status: item.is_active ? "Activo" : "Inactivo",
        createdAt: item.created_at.slice(0, 10),
        scans: 0,
        comments: Number.parseInt(
          getBranchCommentCount(item.name, dashboardData).replace(/\D+/g, ""),
          10,
        ) || 0,
      })),
    [branches, dashboardData, organizationName],
  );
  const records = useMemo(
    () => [
      ...(showDemoData ? dashboardMockQrRecords : liveRecords),
      ...(showDemoData ? createdRecords : []),
    ],
    [createdRecords, liveRecords, showDemoData],
  );
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) =>
      [record.business, record.branch, record.slug, record.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, records]);
  const selectedRecord =
    records.find((record) => record.id === selectedId) ?? filteredRecords[0];
  const feedbackUrl = selectedRecord ? `/feedback/${selectedRecord.slug}` : "";

  function handleCreateQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBusiness = business.trim();
    const trimmedBranch = branch.trim();

    if (!trimmedBusiness || !trimmedBranch) {
      return;
    }

    const nextRecord = buildQrRecord(trimmedBusiness, trimmedBranch);
    setCreatedRecords((current) => [nextRecord, ...current]);
    setSelectedId(nextRecord.id);
    setBusiness("");
    setBranch("");
    setIsCreateModalOpen(false);
  }

  return (
    <DashboardSection
      id="qr"
      title="QR"
      description="Crea y administra los codigos QR por negocio o sucursal."
      action={
        <div className="flex flex-wrap gap-2">
          <DashboardDemoDataToggle
            pressed={showDemoData}
            onPressedChange={onToggleDemoData}
          />
          {showDemoData ? (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900"
            >
              <QrCode size={16} aria-hidden="true" />
              Nuevo QR
            </button>
          ) : (
            <Link
              href="/dashboard#sucursales"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
            >
              Gestionar sucursales
            </Link>
          )}
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  QRs creados
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Lista de enlaces de captura disponibles.
                </p>
              </div>
              <label className="relative block w-full md:max-w-xs">
                <span className="sr-only">Buscar QR</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-full border border-slate-200 bg-[#f7f8f4] pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Buscar QR"
                />
              </label>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#f7f8f4]">
                      {[
                        "Negocio",
                        "Sucursal",
                        "Estado",
                        "Creado",
                        "Actividad",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const isSelected = selectedRecord?.id === record.id;

                      return (
                        <tr
                          key={record.id}
                          className={[
                            "cursor-pointer border-b border-slate-100 last:border-b-0",
                            isSelected ? "bg-emerald-50/60" : "bg-white",
                          ].join(" ")}
                          onClick={() => setSelectedId(record.id)}
                        >
                          <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                            {record.business}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {record.branch}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              {record.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {record.createdAt}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {showDemoData
                              ? `${record.scans} escaneos - ${record.comments} comentarios`
                              : `${record.comments} comentarios`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <DashboardEmptyState
                  icon={QrCode}
                  title="Sin QRs creados"
                  description="Genera el primer QR para empezar a capturar comentarios."
                />
              </div>
            )}
          </section>
        </div>

        <aside className="rounded-[1.25rem] border border-slate-200 bg-[#eef3ec] p-5">
          {selectedRecord ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <DashboardQrPreview value={feedbackUrl} />
                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  {selectedRecord.business}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {selectedRecord.branch}
                </p>
                {!showDemoData ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedRecord.comments} comentarios vinculados
                  </p>
                ) : null}
                <div className="mt-4 flex w-full max-w-sm items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                  <span className="min-w-0 flex-1 truncate">{feedbackUrl}</span>
                  <Copy size={16} aria-hidden="true" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  <Printer size={16} aria-hidden="true" />
                  Imprimir
                </button>
                <a
                  href={feedbackUrl}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Abrir
                </a>
              </div>
            </div>
          ) : (
            <DashboardEmptyState
              icon={QrCode}
              title="Selecciona o genera un QR"
              description="El detalle del QR aparecera en este panel."
            />
          )}
        </aside>
      </div>

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
          role="presentation"
        >
          <form
            onSubmit={handleCreateQr}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-qr-title"
            className="w-full max-w-xl rounded-[1.5rem] border border-white/80 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                  <QrCode size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3
                    id="create-qr-title"
                    className="text-lg font-semibold text-slate-950"
                  >
                    Nuevo QR
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Define el negocio y la sucursal para generar su enlace de
                    captura.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Negocio
                </span>
                <input
                  value={business}
                  onChange={(event) => setBusiness(event.target.value)}
                  className="mt-2 h-11 w-full rounded-full border border-slate-200 bg-[#f7f8f4] px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Ej. Cafeteria"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Sucursal
                </span>
                <input
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                  className="mt-2 h-11 w-full rounded-full border border-slate-200 bg-[#f7f8f4] px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="Ej. Centro"
                />
              </label>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900"
              >
                <QrCode size={16} aria-hidden="true" />
                Generar QR
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </DashboardSection>
  );
}
