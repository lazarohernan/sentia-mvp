"use client";

import { ChevronDown, LogOut } from "lucide-react";
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
};

function SignOutMenuButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saliendo..." : "Cerrar sesion"}
    </button>
  );
}

export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = getUserInitials(user.fullName);

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
          "inline-flex max-w-[12rem] items-center gap-2 rounded-full border px-1.5 py-1.5 text-left transition sm:max-w-[14rem]",
          isOpen
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-transparent text-slate-600 hover:border-emerald-100 hover:bg-emerald-50/80 hover:text-emerald-950",
        ].join(" ")}
        aria-label={`Cuenta de ${user.fullName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white shadow-sm shadow-emerald-900/20">
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
          className="absolute right-0 top-12 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 backdrop-blur-xl"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white shadow-sm shadow-emerald-900/20">
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
            <form action={signOutAction}>
              <SignOutMenuButton />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
