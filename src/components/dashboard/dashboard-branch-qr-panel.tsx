"use client";

import { ArrowLeft, Copy, ExternalLink, Loader2, Printer, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

import type { Branch } from "@/domain/branches/schemas";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import { DashboardQrPreview } from "./dashboard-qr-preview";

type DashboardBranchQrPanelProps = {
  branch: Branch;
  organizationName?: string;
  organizationLogoUrl?: string | null;
  dashboardData?: DashboardSummaryData;
  onBack: () => void;
};

type SignedQrLink = {
  path: string;
  url: string;
  feedbackPath: string;
};

function getBranchCommentCount(branch: Branch, dashboardData?: DashboardSummaryData) {
  const health = dashboardData?.branchHealth.find(
    (item) => item.branchId === branch.id || item.branch === branch.name,
  );
  return health?.comments ?? "0 comentarios";
}

export function DashboardBranchQrPanel({
  branch,
  organizationName,
  organizationLogoUrl,
  dashboardData,
  onBack,
}: DashboardBranchQrPanelProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingLink, setIsLoadingLink] = useState(true);
  const [signedLink, setSignedLink] = useState<SignedQrLink | null>(null);
  const scans = dashboardData?.qrScanCounts?.[branch.id] ?? 0;
  const comments = getBranchCommentCount(branch, dashboardData);
  const publicHost = signedLink?.url ? new URL(signedLink.url).hostname : "perksay.com";

  useEffect(() => {
    let cancelled = false;

    async function loadSignedLink() {
      setIsLoadingLink(true);
      setError("");

      try {
        const response = await fetch(`/api/branches/${branch.id}/qr-link`, {
          credentials: "same-origin",
        });
        const body = (await response.json()) as SignedQrLink & { error?: string };

        if (!response.ok || !body.url || !body.path) {
          if (!cancelled) {
            setSignedLink(null);
            setError(body.error ?? "No se pudo generar el QR firmado.");
          }
          return;
        }

        if (!cancelled) {
          setSignedLink({
            path: body.path,
            url: body.url,
            feedbackPath: body.feedbackPath ?? `/feedback/${branch.slug}`,
          });
        }
      } catch {
        if (!cancelled) {
          setSignedLink(null);
          setError("No se pudo conectar con el servidor.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLink(false);
        }
      }
    }

    void loadSignedLink();

    return () => {
      cancelled = true;
    };
  }, [branch.id, branch.slug]);

  async function handleCopy() {
    if (!signedLink?.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(signedLink.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-[1.25rem] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      {signedLink ? (
        <div className="qr-print-sheet">
          <div className="qr-print-card">
            <header className="qr-print-header">
              {organizationLogoUrl ? (
                <img
                  src={organizationLogoUrl}
                  alt={organizationName ?? "Logo del negocio"}
                  className="qr-print-business-logo"
                />
              ) : (
                <div className="qr-print-business-fallback">
                  {organizationName ?? "Negocio"}
                </div>
              )}
            </header>

            <section className="qr-print-message">
              <p className="qr-print-kicker">Tu opinión nos ayuda a mejorar</p>
              <h1>Escanea el código para darnos tu opinión</h1>
              <p>
                Cuéntanos cómo fue tu experiencia en {branch.name}. Tu respuesta llega
                directamente al equipo de {organizationName ?? "este negocio"}.
              </p>
            </section>

            <div className="qr-print-code">
              <DashboardQrPreview value={signedLink.url} />
            </div>

            <section className="qr-print-branch">
              <p>{organizationName ?? "Negocio"}</p>
              <strong>{branch.name}</strong>
            </section>

            <footer className="qr-print-footer">
              <span>{publicHost}</span>
            </footer>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-50"
          aria-label="Volver a sucursales"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Codigo QR</p>
          <h2 className="text-xl font-semibold text-slate-950">{branch.name}</h2>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[1.25rem] bg-[#eef3ec] p-5">
          <div className="flex flex-col items-center text-center">
            {isLoadingLink ? (
              <div className="flex aspect-square w-full max-w-72 items-center justify-center rounded-[1.5rem] bg-white ring-1 ring-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-800" aria-hidden="true" />
              </div>
            ) : signedLink ? (
              <DashboardQrPreview value={signedLink.url} />
            ) : (
              <div className="flex aspect-square w-full max-w-72 items-center justify-center rounded-[1.5rem] bg-white px-6 ring-1 ring-slate-200">
                <p className="text-sm leading-6 text-slate-600">
                  No se pudo generar el codigo QR firmado.
                </p>
              </div>
            )}

            <h3 className="mt-5 text-lg font-semibold text-slate-950">
              {organizationName ?? "Negocio"}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-600">{branch.name}</p>
            <p className="mt-2 text-sm text-slate-500">
              {scans} escaneos · {comments}
            </p>
            {error ? (
              <p className="mt-3 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="mt-4 flex w-full max-w-md items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-slate-600">
              <span className="min-w-0 flex-1 truncate">{signedLink?.url ?? "Generando enlace..."}</span>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!signedLink?.url}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!signedLink}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir
            </button>
            <a
              href={signedLink?.path ?? "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!signedLink}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-emerald-900/20 transition hover:bg-emerald-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir formulario
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-[#f7f8f4] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Estado
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {branch.is_active ? "Activa" : "Inactiva"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f7f8f4] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Direccion
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {branch.address || "Sin direccion registrada"}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">
            <QrCode className="mb-2 h-5 w-5 text-slate-700" aria-hidden="true" />
            Este QR usa un enlace firmado. Si alguien lo reemplaza con otro codigo, la app lo
            rechazara antes de abrir el formulario.
          </div>
        </div>
      </div>
    </section>
  );
}
