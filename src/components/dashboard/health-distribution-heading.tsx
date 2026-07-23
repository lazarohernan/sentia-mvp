"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  HEALTH_DISTRIBUTION_HELP,
  HEALTH_DISTRIBUTION_TITLE,
} from "./csat-health-distribution";

type HealthDistributionHeadingProps = {
  titleClassName?: string;
};

export function HealthDistributionHeading({
  titleClassName = "text-xs font-semibold uppercase tracking-widest text-slate-400",
}: HealthDistributionHeadingProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1">
      <span className={titleClassName}>{HEALTH_DISTRIBUTION_TITLE}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Información sobre cómo leer esta gráfica"
        title="Información"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <Info className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className="absolute top-full left-0 z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl bg-white p-3 text-xs leading-5 text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          <p className="font-semibold text-slate-800">¿Cómo leer esto?</p>
          <p className="mt-1.5">{HEALTH_DISTRIBUTION_HELP}</p>
        </div>
      ) : null}
    </div>
  );
}
