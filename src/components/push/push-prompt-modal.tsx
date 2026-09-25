"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  PushNotificationsToggle,
  type PushState,
} from "@/components/push/push-notifications-toggle";
import {
  hasSkippedPushPrompt,
  markPushPromptDismissedForSession,
  markPushPromptSkipped,
  shouldPersistPushPromptSkip,
} from "@/lib/app/push-prompt";
import {
  DASHBOARD_WELCOME_DISMISSED_EVENT,
  hasSeenDashboardWelcome,
} from "@/lib/app/welcome-modal";

type PushPromptModalProps = {
  waitForWelcome?: boolean;
};

export function PushPromptModal({ waitForWelcome = false }: PushPromptModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState<PushState>("checking");
  const pushStateRef = useRef(pushState);
  pushStateRef.current = pushState;

  useEffect(() => {
    setMounted(true);

    if (hasSkippedPushPrompt()) {
      return;
    }

    if (!waitForWelcome || hasSeenDashboardWelcome()) {
      setOpen(true);
      return;
    }

    function handleWelcomeDismissed() {
      setOpen(true);
    }

    window.addEventListener(DASHBOARD_WELCOME_DISMISSED_EVENT, handleWelcomeDismissed);
    return () => {
      window.removeEventListener(
        DASHBOARD_WELCOME_DISMISSED_EVENT,
        handleWelcomeDismissed,
      );
    };
  }, [waitForWelcome]);

  function dismiss() {
    if (shouldPersistPushPromptSkip(pushStateRef.current)) {
      markPushPromptSkipped();
    } else {
      markPushPromptDismissedForSession();
    }
    setOpen(false);
  }

  const showDialog =
    mounted && open && pushState !== "checking" && pushState !== "enabled";

  useEffect(() => {
    if (!showDialog) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDialog]);

  const keepProbe = mounted && open && pushState !== "enabled";

  if (!keepProbe) {
    return null;
  }

  const secondaryLabel =
    pushState === "blocked" || pushState === "unsupported" ? "Entendido" : "Ahora no";

  return createPortal(
    <div
      className={
        showDialog
          ? "fixed inset-0 z-80 flex items-center justify-center p-4"
          : "hidden"
      }
    >
      {showDialog ? (
        <button
          type="button"
          className="absolute inset-0 bg-brand/55"
          aria-label="Cerrar activación de notificaciones"
          onClick={dismiss}
        />
      ) : null}
      <div
        role="dialog"
        aria-modal={showDialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-float"
      >
          <div className="relative flex aspect-5/2 items-center justify-center overflow-hidden bg-brand-soft">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-surface text-brand shadow-soft">
            <BellRing className="size-8" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-surface/90 text-text-secondary transition hover:bg-surface hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        <div className="px-5 pt-5 pb-6">
          <h2
            id={titleId}
            className="text-xl font-semibold tracking-normal text-text-primary"
          >
            Activa los avisos en este dispositivo
          </h2>
          <p
            id={descriptionId}
            className="mt-2 text-sm leading-6 text-text-secondary"
          >
            Recibe alertas y seguimientos en este celular, tablet o
            computadora, aunque no tengas Perks abierto.
          </p>

          <div className="mt-4">
            <PushNotificationsToggle
              layout="prompt"
              onStateChange={setPushState}
            />
          </div>

          {showDialog ? (
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
