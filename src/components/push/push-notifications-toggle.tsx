"use client";

import { BellRing, Loader2, Smartphone, SmartphoneNfc } from "lucide-react";
import { useEffect, useState } from "react";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type PushState =
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

function isIosLikeSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandaloneWebApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone))
  );
}

function isLocalOrigin() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

async function ensurePushRegistration() {
  const registration = await navigator.serviceWorker.register("/push-sw.js");
  await navigator.serviceWorker.ready;
  return registration;
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
};

export function PushNotificationsToggle({
  allowDisable = false,
  hideWhenEnabled = false,
  flat = false,
}: PushNotificationsToggleProps) {
  const [state, setState] = useState<PushState>("checking");
  const [detail, setDetail] = useState("Revisando compatibilidad de push.");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      if (isIosLikeSafari() && !isStandaloneWebApp()) {
        if (!active) return;
        setState("unsupported");
        setDetail("En iPhone, instala Perks en pantalla de inicio y abre la app desde ahi.");
        return;
      }

      if (
        !vapidPublicKey ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (!active) return;
        setState("unsupported");
        setDetail(
          isLocalOrigin()
            ? "Este navegador local no expone Web Push. Prueba Chrome en localhost o Safari como PWA instalada."
            : "Este dispositivo no soporta Web Push o falta configurar VAPID.",
        );
        return;
      }

      try {
        const registration = await ensurePushRegistration();
        const subscription = await registration.pushManager.getSubscription();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        const hasCurrentSubscription =
          subscription && hasMatchingApplicationServerKey(subscription, applicationServerKey);

        if (!active) return;

        if (Notification.permission === "denied") {
          setState("blocked");
          setDetail("Las notificaciones estan bloqueadas en el navegador.");
          return;
        }

        setState(hasCurrentSubscription ? "enabled" : "ready");
        setDetail(
          hasCurrentSubscription
            ? "Recibiras alertas y recordatorios en este dispositivo."
            : isLocalOrigin()
              ? "En local, toca Activar push y acepta el permiso del navegador."
              : "Activa push para recibir alertas operativas en iPhone y Android.",
        );
      } catch {
        if (!active) return;
        setState("error");
        setDetail("No se pudo inicializar el registro push.");
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function enablePush() {
    try {
      if (isIosLikeSafari() && !isStandaloneWebApp()) {
        setState("unsupported");
        setDetail("En iPhone, agrega Perks a pantalla de inicio y abre desde el icono.");
        return;
      }

      setState("busy");
      setDetail("Solicitando permiso de notificaciones.");

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "ready");
        setDetail(
          permission === "denied"
            ? "El navegador bloqueo las notificaciones."
            : "Permiso pendiente para activar push.",
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

      setState("enabled");
      setDetail("Push activo en este dispositivo.");
    } catch {
      setState("error");
      setDetail("No se pudo activar push en este dispositivo.");
    }
  }

  async function disablePush() {
    try {
      setState("busy");
      setDetail("Desactivando notificaciones push.");
      const registration = await ensurePushRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await removeServerSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setState("ready");
      setDetail("Push desactivado en este dispositivo.");
    } catch {
      setState("error");
      setDetail("No se pudo desactivar push.");
    }
  }

  const isBusy = state === "busy" || state === "checking";
  const enabled = state === "enabled";
  const canDisable = enabled && allowDisable;

  if (enabled && hideWhenEnabled) {
    return null;
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
          <p className="text-sm font-semibold text-slate-950">Notificaciones push</p>
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
            {canDisable ? "Desactivar push" : enabled ? "Push activo" : "Activar push"}
          </button>
        </div>
      </div>
    </section>
  );
}
