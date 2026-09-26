"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Building2, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { markDashboardWelcomeSeen } from "@/lib/app/welcome-modal";

type OwnerOnboardingProps = {
  email: string;
  initialName: string;
  businessCreated: boolean;
};

export function OwnerOnboarding({ email, initialName, businessCreated }: OwnerOnboardingProps) {
  const [step, setStep] = useState(businessCreated ? 3 : 1);
  const [fullName, setFullName] = useState(initialName);
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  async function finish() {
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

  return (
    <section className="mt-10 overflow-hidden rounded-3xl bg-white sm:mt-16">
      <div className="bg-[#dceee1] px-7 py-5 text-sm font-semibold text-[#28584d] sm:px-12">
        Paso {step} de 3 · {step === 1 ? "Bienvenida" : step === 2 ? "Tu negocio" : "Conoce Perks"}
      </div>
      <div className="px-7 py-10 sm:px-12 sm:py-12">
        {step === 1 && (
          <div className="grid items-center gap-8 md:grid-cols-[1fr_0.8fr]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bienvenido a Perks</h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#40594f]">
                Vamos a preparar tu espacio para escuchar a tus clientes y acompañar a tu equipo.
              </p>
              <p className="mt-4 text-sm text-[#587067]">Tu acceso: {email}</p>
              <button type="button" onClick={() => setStep(2)} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#06483d] px-6 font-semibold text-white hover:bg-[#0b6252]">
                Comenzar <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
            <ImagePanel />
          </div>
        )}

        {step === 2 && (
          <form onSubmit={createBusiness} className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tu nombre y tu negocio</h1>
            <p className="mt-4 text-lg leading-8 text-[#40594f]">Estos nombres identificarán tu cuenta y el espacio que administrarás.</p>
            <label className="mt-8 block text-sm font-semibold" htmlFor="owner-full-name">Nombre completo</label>
            <div className="mt-2 flex h-13 items-center gap-3 rounded-xl bg-[#f2f7f3] px-4 focus-within:outline-2 focus-within:outline-[#06483d]">
              <UserRound size={20} aria-hidden="true" />
              <input id="owner-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required autoComplete="name" className="h-full w-full bg-transparent outline-none" />
            </div>
            <label className="mt-6 block text-sm font-semibold" htmlFor="owner-business-name">Nombre del negocio</label>
            <div className="mt-2 flex h-13 items-center gap-3 rounded-xl bg-[#f2f7f3] px-4 focus-within:outline-2 focus-within:outline-[#06483d]">
              <Building2 size={20} aria-hidden="true" />
              <input id="owner-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} minLength={2} maxLength={160} required autoComplete="organization" placeholder="Como lo conocen tus clientes" className="h-full w-full bg-transparent outline-none" />
            </div>
            {error && <p role="alert" className="mt-5 text-sm text-[#9d3e32]">{error}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <button type="submit" disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#06483d] px-6 font-semibold text-white disabled:opacity-60">
                {busy ? "Creando..." : "Crear mi negocio"} <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 font-semibold text-[#28584d]"><ArrowLeft size={18} aria-hidden="true" /> Volver</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="max-w-xl">
            <BookOpen size={40} strokeWidth={1.6} aria-hidden="true" className="text-[#0b6252]" />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Conoce cómo usar Perks</h1>
            <p className="mt-4 text-lg leading-8 text-[#40594f]">
              La guía explica qué encontrarás en cada sección y cómo dar tus primeros pasos. Puedes mantenerla abierta mientras exploras el panel.
            </p>
            <Link href="/guia" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 font-semibold text-[#06483d] underline underline-offset-4">
              Abrir la guía en otra pestaña <ArrowRight size={18} aria-hidden="true" />
            </Link>
            {error && <p role="alert" className="mt-5 text-sm text-[#9d3e32]">{error}</p>}
            <div className="mt-9">
              <button type="button" onClick={finish} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#06483d] px-6 font-semibold text-white disabled:opacity-60">
                {busy ? "Entrando..." : "Ir a Inicio"} <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ImagePanel() {
  return <img src="/images/perks-welcome-flow-v1.svg" alt="" className="w-full rounded-2xl object-cover" />;
}
