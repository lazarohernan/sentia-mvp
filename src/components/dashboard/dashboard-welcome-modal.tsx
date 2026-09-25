"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import {
  hasSeenDashboardWelcome,
  markDashboardWelcomeSeen,
} from "@/lib/app/welcome-modal";

type DashboardWelcomeModalProps = {
  organizationName?: string;
};

export function DashboardWelcomeModal({
  organizationName: _organizationName,
}: DashboardWelcomeModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOpen(!hasSeenDashboardWelcome());
  }, []);

  function dismiss() {
    markDashboardWelcomeSeen();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface "
      >
        <div className="relative aspect-video overflow-hidden bg-surface-muted">
          <img
            src="/images/perks-welcome-flow-v1.svg"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="px-5 pt-5 pb-6">
          <h2
            id={titleId}
            className="text-xl font-semibold tracking-normal text-text-primary"
          >
            Qué bueno tenerte en Perks
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-6 text-text-secondary"
          >
            Cada voz cuenta. Aquí puedes escuchar a tus clientes, acompañar a tu
            equipo y descubrir pequeñas acciones que hacen mejor tu negocio.
            Vamos paso a paso.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-text-inverse transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 active:translate-y-px"
          >
            Vamos a empezar
          </button>
          <Link
            href="/guia"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-center text-sm font-semibold text-brand-muted underline-offset-4 hover:underline"
          >
            Conoce Perks en una nueva pestaña
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
