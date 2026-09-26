"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import {
  hasSeenDashboardWelcome,
  markDashboardWelcomeSeen,
} from "@/lib/app/welcome-modal";

type DashboardWelcomeModalProps = {
  organizationName?: string;
  reopenSignal?: number;
  existingAccount?: {
    fullName: string;
  };
  ownerSetup?: {
    initialName: string;
    businessCreated: boolean;
  };
};

export function DashboardWelcomeModal({
  organizationName,
  reopenSignal = 0,
  existingAccount,
  ownerSetup,
}: DashboardWelcomeModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(ownerSetup?.businessCreated ? 3 : 1);
  const [fullName, setFullName] = useState(ownerSetup?.initialName ?? "");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const forceOpen = Boolean(ownerSetup);
  const guidedWelcome = Boolean(ownerSetup || existingAccount);

  useEffect(() => {
    setMounted(true);
    setOpen(forceOpen || !hasSeenDashboardWelcome());
  }, [forceOpen]);

  useEffect(() => {
    if (reopenSignal > 0) {
      setStep(1);
      setOpen(true);
    }
  }, [reopenSignal]);

  function dismiss() {
    markDashboardWelcomeSeen();
    setOpen(false);
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/owner-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, businessName }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "No se pudo crear el negocio.");
        return;
      }
      setStep(3);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function finishOwnerSetup() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/owner-onboarding", { method: "PATCH" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "No se pudo completar la bienvenida.");
        return;
      }
      markDashboardWelcomeSeen();
      window.location.assign("/dashboard");
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-step-focus]")?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, step]);

  function keepFocusInside(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const heading = dialogRef.current?.querySelector<HTMLElement>("[data-step-focus]");
    if (event.shiftKey && (document.activeElement === first || document.activeElement === heading)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand/55"
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={keepFocusInside}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-surface"
      >
        {(!guidedWelcome || step === 1) && <div className="relative aspect-video overflow-hidden bg-surface-muted">
          <img
            src="/images/perks-welcome-flow-v1.svg"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>}

        <div className="px-5 pt-5 pb-6">
          {guidedWelcome && <nav aria-label="Progreso de bienvenida" className="mb-5 grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            {(["Bienvenida", "Negocio", "Términos", "Guía"] as const).map((label, index) => (
              <span key={label} aria-current={step === index + 1 ? "step" : undefined} className={`border-b-2 pb-2 ${step === index + 1 ? "border-brand text-brand" : "border-surface-muted text-text-secondary"}`}>{label}</span>
            ))}
          </nav>}
          {step === 1 && (
            <>
              <h2 id={titleId} tabIndex={-1} data-step-focus className="text-xl font-semibold text-text-primary outline-none">Qué bueno tenerte en Perks</h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-text-secondary">
                Cada voz cuenta. Aquí puedes escuchar a tus clientes, acompañar a tu equipo y descubrir pequeñas acciones que hacen mejor tu negocio. Vamos paso a paso.
              </p>
              <button type="button" onClick={guidedWelcome ? () => setStep(2) : dismiss} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-text-inverse transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 active:translate-y-px">
                Vamos a empezar
              </button>
              {!guidedWelcome && <Link href="/guia" target="_blank" rel="noopener noreferrer" className="mt-4 block text-center text-sm font-semibold text-brand-muted underline-offset-4 hover:underline">Conoce Perks en una nueva pestaña</Link>}
            </>
          )}
          {existingAccount && step === 2 && (
            <>
              <h2 id={titleId} tabIndex={-1} data-step-focus className="text-xl font-semibold text-text-primary outline-none">Tu cuenta y tu negocio</h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-text-secondary">Este es el espacio que ya tienes en Perks. No se crearán cuentas ni negocios nuevos.</p>
              <dl className="mt-5 rounded-xl bg-surface-muted px-4 text-sm">
                <div className="py-3"><dt className="text-text-secondary">Tu nombre</dt><dd className="mt-1 font-semibold text-text-primary">{existingAccount.fullName}</dd></div>
                <div className="border-t border-text-secondary/15 py-3"><dt className="text-text-secondary">Negocio</dt><dd className="mt-1 font-semibold text-text-primary">{organizationName ?? "Sin negocio vinculado"}</dd></div>
              </dl>
              <button type="button" onClick={() => setStep(3)} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-text-inverse">Continuar</button>
              <button type="button" onClick={() => setStep(1)} className="mt-3 w-full text-sm font-semibold text-brand-muted">Volver</button>
            </>
          )}
          {ownerSetup && step === 2 && (
            <form onSubmit={createBusiness}>
              <h2 id={titleId} tabIndex={-1} data-step-focus className="text-xl font-semibold text-text-primary outline-none">Tu nombre y tu negocio</h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-text-secondary">Así aparecerán tu cuenta y el negocio que administrarás.</p>
              <label htmlFor="owner-full-name" className="mt-5 block text-sm font-semibold text-text-primary">Nombre completo</label>
              <input id="owner-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required autoComplete="name" className="mt-2 h-11 w-full rounded-xl border border-text-secondary/20 bg-white px-3 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring" />
              <label htmlFor="owner-business-name" className="mt-4 block text-sm font-semibold text-text-primary">Nombre del negocio</label>
              <input id="owner-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} minLength={2} maxLength={160} required autoComplete="organization" placeholder="Como lo conocen tus clientes" className="mt-2 h-11 w-full rounded-xl border border-text-secondary/20 bg-white px-3 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-focus-ring" />
              {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-text-inverse disabled:opacity-60">{busy ? "Guardando..." : "Guardar y continuar"}</button>
              <button type="button" onClick={() => setStep(1)} className="mt-3 w-full text-sm font-semibold text-brand-muted">Volver</button>
            </form>
          )}
          {guidedWelcome && step === 3 && (
            <>
              <h2 id={titleId} tabIndex={-1} data-step-focus className="text-xl font-semibold text-text-primary outline-none">Términos y privacidad</h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-text-secondary">
                Antes de aceptarlos, podrás leer aquí los Términos de uso y la Política de privacidad. Todavía no están publicados.
              </p>
              <div className="mt-5 divide-y divide-text-secondary/15 rounded-xl bg-surface-muted px-4">
                <div className="flex items-center justify-between gap-3 py-3 text-sm text-text-primary"><span>Términos de uso</span><span className="shrink-0 text-xs text-text-secondary">Por publicar</span></div>
                <div className="flex items-center justify-between gap-3 py-3 text-sm text-text-primary"><span>Política de privacidad</span><span className="shrink-0 text-xs text-text-secondary">Por publicar</span></div>
              </div>
              <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-text-secondary">
                <input type="checkbox" disabled className="mt-1 h-4 w-4 shrink-0" />
                He leído y acepto los Términos de uso y la Política de privacidad.
              </label>
              <p className="mt-2 text-xs leading-5 text-text-secondary">La aceptación se habilitará cuando estén disponibles los documentos. Por ahora no se registra ninguna firma.</p>
              <button type="button" onClick={() => setStep(4)} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-text-inverse">Continuar sin firmar</button>
              {existingAccount && <button type="button" onClick={() => setStep(2)} className="mt-3 w-full text-sm font-semibold text-brand-muted">Volver</button>}
            </>
          )}
          {guidedWelcome && step === 4 && (
            <>
              <h2 id={titleId} tabIndex={-1} data-step-focus className="text-xl font-semibold text-text-primary outline-none">Conoce cómo usar Perks</h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-text-secondary">La guía explica cada sección y cómo dar tus primeros pasos. Puedes dejarla abierta mientras exploras el panel.</p>
              <Link href="/guia" target="_blank" rel="noopener noreferrer" className="mt-5 block text-center text-sm font-semibold text-brand-muted underline-offset-4 hover:underline">Abrir la guía en otra pestaña</Link>
              {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
              <button type="button" onClick={ownerSetup ? finishOwnerSetup : dismiss} disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-text-inverse disabled:opacity-60">{busy ? "Entrando..." : "Ir a Inicio"}</button>
              <button type="button" onClick={() => setStep(3)} disabled={busy} className="mt-3 w-full text-sm font-semibold text-brand-muted disabled:opacity-60">Volver</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
