"use client";

import { ChevronDown, KeyRound, LogOut, Store, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/auth/actions";
import { getUserInitials } from "@/domain/auth/profile";

export type DashboardCurrentUser = {
  fullName: string;
  email: string | null;
};

type DashboardUserMenuProps = {
  user: DashboardCurrentUser;
  organizationName?: string;
  canManageBusinessProfile?: boolean;
  onOpenBusinessProfile?: () => void;
  onOpenUserProfile?: () => void;
  onRequestPasswordReset?: () => void;
  isPasswordResetting?: boolean;
  passwordResetMessage?: string;
  flat?: boolean;
};

function SignOutMenuButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}

export function DashboardUserMenu({
  user,
  organizationName,
  canManageBusinessProfile = false,
  onOpenBusinessProfile,
  onOpenUserProfile,
  onRequestPasswordReset,
  isPasswordResetting = false,
  passwordResetMessage,
  flat = false,
}: DashboardUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = getUserInitials(user.fullName);
  const menuItemClass = flat
    ? "mb-2 flex w-full items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 text-left transition hover:bg-emerald-50/80"
    : "mb-2 flex w-full items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/80";
  const menuIconClass = flat
    ? "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700"
    : "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700";
  const passwordResetMessageClass = flat
    ? "mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium leading-5 text-slate-600"
    : "mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium leading-5 text-slate-600";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | globalThis.MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={[
          "inline-flex max-w-48 items-center gap-2 rounded-full px-1.5 py-1.5 text-left transition sm:max-w-56",
          isOpen
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-transparent text-slate-600 hover:border-emerald-100 hover:bg-emerald-50/80 hover:text-emerald-950",
        ].join(" ")}
        aria-label={`Cuenta de ${user.fullName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white shadow-emerald-900/20">
          {initials}
        </span>
        <span className="hidden min-w-0 truncate text-sm font-semibold leading-5 text-slate-900 sm:inline">
          {user.fullName}
        </span>
        <ChevronDown
          className={[
            "hidden h-4 w-4 shrink-0 text-slate-400 transition sm:block",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Menu de cuenta"
          className={
            flat
              ? "absolute right-0 top-12 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-[0_10px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl"
              : "absolute right-0 top-12 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white backdrop-blur-xl"
          }
        >
          <div className={flat ? "px-5 py-4" : "border-b border-slate-100 px-5 py-4"}>
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white shadow-emerald-900/20">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{user.fullName}</p>
                {user.email ? (
                  <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-3">
            {onOpenUserProfile ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenUserProfile();
                }}
                className={menuItemClass}
              >
                <span className={menuIconClass}>
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">
                    Mi perfil
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Datos de tu cuenta
                  </span>
                </span>
              </button>
            ) : null}

            {onOpenBusinessProfile ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBusinessProfile();
                }}
                className={menuItemClass}
              >
                <span className={menuIconClass}>
                  <Store className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">
                    Perfil del negocio
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {organizationName ?? "Logo, contacto y datos publicos"}
                  </span>
                  {!canManageBusinessProfile ? (
                    <span className="mt-1 block text-xs text-slate-400">
                      Solo lectura
                    </span>
                  ) : null}
                </span>
              </button>
            ) : null}

            {onRequestPasswordReset ? (
              <div className="mb-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onRequestPasswordReset();
                  }}
                  disabled={isPasswordResetting}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 text-left transition hover:bg-emerald-50/80 disabled:cursor-not-allowed disabled:opacity-70 `}
                >
                  <span className={menuIconClass}>
                    <KeyRound className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950">
                      {isPasswordResetting ? "Enviando correo..." : "Reiniciar contraseña"}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Te enviaremos un enlace a tu correo
                    </span>
                  </span>
                </button>
                {passwordResetMessage ? (
                  <p className={passwordResetMessageClass}>
                    {passwordResetMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

            <form action={signOutAction}>
              <SignOutMenuButton />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
