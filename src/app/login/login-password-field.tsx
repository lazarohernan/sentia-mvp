"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

type LoginPasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  placeholder: string;
};

export function LoginPasswordField({
  autoComplete,
  placeholder,
}: LoginPasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-semibold text-white/75">Contrasena</span>
      <div className="mt-2 flex h-14 items-center gap-3 rounded-lg border border-white/8 bg-[#34413b] px-4 text-white transition focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20">
        <KeyRound
          size={21}
          className="shrink-0 text-white/55"
          aria-hidden="true"
        />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45"
          name="password"
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={8}
          required
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="shrink-0 rounded-md p-1 text-white/55 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
          aria-label={isVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
        >
          {isVisible ? (
            <EyeOff size={20} aria-hidden="true" />
          ) : (
            <Eye size={20} aria-hidden="true" />
          )}
        </button>
      </div>
    </label>
  );
}
