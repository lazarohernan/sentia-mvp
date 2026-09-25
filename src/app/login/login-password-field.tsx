"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

import styles from "./login-input.module.css";

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
      <span className="text-sm font-semibold text-[#29483d]">Contrasena</span>
      <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#d7e3d9] bg-white px-4 text-[#12362d] transition focus-within:ring-2 focus-within:ring-[#3d9e7e]">
        <KeyRound
          size={21}
          className="shrink-0 text-[#7a9386]"
          aria-hidden="true"
        />
        <input
          className={`${styles.input} h-full min-w-0 flex-1 bg-white text-sm text-[#12362d] outline-none placeholder:text-[#718a7d]`}
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
          className="shrink-0 rounded-md p-1 text-[#7a9386] transition hover:text-[#12362d] focus:outline-none focus:ring-2 focus:ring-[#3d9e7e]"
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
