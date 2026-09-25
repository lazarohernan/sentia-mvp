"use client";

import { BellRing, Loader2, Smartphone, SmartphoneNfc } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { requiresStandaloneForWebPush } from "@/lib/app/push-device";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushState =
  | "checking"
  | "unsupported"
  | "ready"
  | "enabled"
  | "busy"
  | "blocked"
  | "error";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(normalized);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
}

function toUint8Array(value: ArrayBuffer | ArrayBufferView) {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

export function hasMatchingApplicationServerKey(
  subscription: PushSubscription,
  applicationServerKey: Uint8Array,
) {
  const existingKey = subscription.options.applicationServerKey;

  if (!existingKey) {
    return false;
  }

  const existingBytes = toUint8Array(existingKey);

  if (existingBytes.byteLength !== applicationServerKey.byteLength) {
    return false;
  }

  return existingBytes.every((byte, index) => byte === applicationServerKey[index]);
}

function isLocalOrigin() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function waitForActiveWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) {
    return registration;
  }

  const pending = registration.installing ?? registration.waiting;
  if (!pending) {
    return withTimeout(navigator.serviceWorker.ready, 6000, "push_sw_ready_timeout");
  }

  await withTimeout(
    new Promise<void>((resolve, reject) => {
      const onStateChange = () => {
        if (pending.state === "activated" || registration.active) {
          pending.removeEventListener("statechange", onStateChange);
          resolve();
          return;
        }

        if (pending.state === "redundant") {
          pending.removeEventListener("statechange", onStateChange);
          reject(new Error("push_sw_redundant"));
        }
      };

      pending.addEventListener("statechange", onStateChange);
      onStateChange();
    }),
    6000,
    "push_sw_activate_timeout",
  );

  return registration.active ? registration : navigator.serviceWorker.ready;
}

async function ensurePushRegistration() {
  const registration = await withTimeout(
    navigator.serviceWorker.register("/push-sw.js", { scope: "/" }),
    8000,
    "push_sw_register_timeout",
  );
  return waitForActiveWorker(registration);
}

async function removeServerSubscription(endpoint: string) {
  await fetch("/api/push/subscriptions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ endpoint }),
  });
}

export type PushNotificationsToggleProps = {
  allowDisable?: boolean;
  hideWhenEnabled?: boolean;
  flat?: boolean;
  layout?: "card" | "prompt";
  onStateChange?: (state: PushState) => void;
  onEnabled?: () => void;
};

export function PushNotificationsToggle({
  allowDisable = false,
  hideWhenEnabled = false,
  flat = false,
  layout = "card",
  onStateChange,
  onEnabled,
}: PushNotificationsToggleProps) {
  const [state, setState] = useState<PushState>("checking");
  const [detail, setDetail] = useState("Comprobando si este dispositivo puede recibir avisos.");
  const onStateChangeRef = useRef(onStateChange);
  const onEnabledRef = useRef(onEnabled);
  onStateChangeRef.current = onStateChange;
  onEnabledRef.current = onEnabled;

  function updateState(next: PushState) {
    setState(next);
    onStateChangeRef.current?.(next);
    if (next === "enabled") {
      onEnabledRef.current?.();
    }
  }

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      if (requiresStandaloneForWebPush()) {
        if (!active) return;
        updateState("unsupported");
        setDetail(
          "En este celular, agrega Perks a la pantalla de inicio y ábrela desde ese icono para poder recibir avisos.",
        );
        return;
      }

      if (
        !vapidPublicKey ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (!active) return;
        updateState("unsupported");
        setDetail(
          isLocalOrigin()
            ? "Este navegador local no puede recibir avisos. Prueba Chrome, Edge o la app instalada en el celular."
            : "Este navegador no puede recibir avisos en segundo plano.",
        );
        return;
      }

      try {
        if (Notification.permission === "denied") {
          if (!active) return;
          updateState("blocked");
          setDetail("Los avisos están bloqueados en este navegador. Habilítalos en su configuración.");
          return;
        }

        const registration = await ensurePushRegistration();
        const subscription = await registration.pushManager.getSubscription();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        const hasCurrentSubscription =
          subscription && hasMatchingApplicationServerKey(subscription, applicationServerKey);

        if (!active) return;

        updateState(hasCurrentSubscription ? "enabled" : "ready");
        setDetail(
          hasCurrentSubscription
            ? "Recibirás alertas y recordatorios en este dispositivo."
            : "Toca el botón y acepta el permiso de este navegador.",
        );
      } catch {
        if (!active) return;
        if (Notification.permission === "granted") {
          updateState("ready");
          setDetail("No se confirmó el registro. Puedes tocar el botón e intentarlo de nuevo.");
          return;
        }

        updateState("error");
        setDetail("No se pudieron preparar los avisos. Recarga e inténtalo de nuevo.");
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function enablePush() {
    try {
      if (requiresStandaloneForWebPush()) {
        updateState("unsupported");
        setDetail(
          "En este celular, agrega Perks a la pantalla de inicio y ábrela desde ese icono para poder recibir avisos.",
        );
        return;
      }

      updateState("busy");
      setDetail("Pidiendo permiso en este navegador.");

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        updateState(permission === "denied" ? "blocked" : "ready");
        setDetail(
          permission === "denied"
            ? "Este navegador bloqueó los avisos. Puedes habilitarlos en su configuración."
            : "Aún falta aceptar el permiso para activar los avisos.",
        );
        return;
      }

      const registration = await ensurePushRegistration();
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      let subscription = await registration.pushManager.getSubscription();

      if (subscription && !hasMatchingApplicationServerKey(subscription, applicationServerKey)) {
        await removeServerSubscription(subscription.endpoint);
        await subscription.unsubscribe();
        subscription = null;
      }

      subscription =
        subscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }));

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("subscription_failed");
      }

      updateState("enabled");
      setDetail("Los avisos están activos en este dispositivo.");
    } catch {
      updateState("error");
      setDetail("No se pudieron activar los avisos en este dispositivo.");
    }
  }

  async function disablePush() {
    try {
      updateState("busy");
      setDetail("Desactivando avisos en este dispositivo.");
      const registration = await ensurePushRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await removeServerSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }

      updateState("ready");
      setDetail("Los avisos quedaron desactivados en este dispositivo.");
    } catch {
      updateState("error");
      setDetail("No se pudieron desactivar los avisos.");
    }
  }

  const isBusy = state === "busy" || state === "checking";
  const enabled = state === "enabled";
  const canDisable = enabled && allowDisable;

  if (enabled && hideWhenEnabled) {
    return null;
  }

  if (layout === "prompt") {
    const canActivate =
      state === "ready" || state === "error" || state === "busy";

    return (
      <div>
        <p className="text-sm leading-6 text-text-secondary">{detail}</p>
        {canActivate ? (
          <button
            type="button"
            onClick={enablePush}
            disabled={isBusy}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-text-inverse transition hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Smartphone className="size-4" aria-hidden="true" />
            )}
            {isBusy ? "Activando…" : "Activar notificaciones"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section
      className={
        flat
          ? "mb-2 rounded-2xl bg-slate-50/80 px-4 py-3"
          : "mb-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            flat
              ? "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700"
              : "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm"
          }
        >
          {enabled ? (
            <BellRing className="h-5 w-5" aria-hidden="true" />
          ) : (
            <SmartphoneNfc className="h-5 w-5" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">Avisos en este dispositivo</p>
          <p className="mt-0.5 text-xs text-slate-500">{detail}</p>

          <button
            type="button"
            onClick={canDisable ? disablePush : enablePush}
            disabled={
              state === "unsupported" ||
              state === "blocked" ||
              isBusy ||
              (enabled && !allowDisable)
            }
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            )}
            {canDisable ? "Desactivar avisos" : enabled ? "Avisos activos" : "Activar avisos"}
          </button>
        </div>
      </div>
    </section>
  );
}
