"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import type { DemoLead } from "@/lib/demo-guiada/steps";
import { saveDemoLead } from "@/lib/demo-guiada/storage";

type DemoLeadFormProps = {
  onSubmit: (lead: DemoLead) => void;
};

export function DemoLeadForm({ onSubmit }: DemoLeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError("Escribe tu nombre completo.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Revisa el correo electrónico.");
      return;
    }

    if (trimmedPhone.replace(/\D/g, "").length < 8) {
      setError("Ingresa un teléfono válido.");
      return;
    }

    setError(null);
    const lead = saveDemoLead({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
    });
    onSubmit(lead);
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-10 sm:px-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#08775f]">Demo guiada</p>
      <h1
        className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-bold leading-[1.05] text-[#062f28]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Empieza con tus datos y recorre Perks paso a paso
      </h1>
      <p className="mt-4 text-base leading-7 text-[#536e64] sm:text-lg sm:leading-8">
        Guardamos nombre, correo y teléfono para contactarte. Luego verás el recorrido guiado con controles de
        siguiente y repetir.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#173f35]">Nombre</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="h-12 w-full rounded-[8px] border border-[#c9d5cd] bg-white px-4 text-[#0d2b25] outline-none transition focus:border-[#0c8668]"
            placeholder="Tu nombre"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#173f35]">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="h-12 w-full rounded-[8px] border border-[#c9d5cd] bg-white px-4 text-[#0d2b25] outline-none transition focus:border-[#0c8668]"
            placeholder="tu@empresa.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-[#173f35]">Teléfono</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            className="h-12 w-full rounded-[8px] border border-[#c9d5cd] bg-white px-4 text-[#0d2b25] outline-none transition focus:border-[#0c8668]"
            placeholder="+504 9999-9999"
            required
          />
        </label>

        {error ? <p className="text-sm font-semibold text-[#b42318]">{error}</p> : null}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#005542] px-6 text-base font-bold text-white transition hover:bg-[#004434] sm:w-auto"
        >
          Continuar al recorrido
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      <p className="mt-5 text-sm leading-6 text-[#71847c]">
        Por ahora el lead se guarda en este dispositivo. Luego lo migraremos a Supabase.
      </p>
    </section>
  );
}
