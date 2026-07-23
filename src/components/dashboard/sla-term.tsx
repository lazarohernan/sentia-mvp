"use client";

import { CircleHelp } from "lucide-react";
import { useId, useState } from "react";

import { SLA_DEFINITION, SLA_VENCIDO_LABEL } from "@/domain/dashboard/alert-glossary";

type SlaTermProps = {
  className?: string;
  /** Estilo del chip/badge vs label de métrica */
  variant?: "badge" | "metric";
};

export function SlaTerm({ className, variant = "badge" }: SlaTermProps) {
  const isBadge = variant === "badge";
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={[
        "relative inline-flex items-center gap-1",
        isBadge
          ? "text-[10px] font-bold uppercase tracking-[0.08em] text-red-700"
          : "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {SLA_VENCIDO_LABEL}
      <button
        type="button"
        className={[
          "inline-flex size-4 shrink-0 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30",
          isBadge
            ? "text-red-600/80 hover:text-red-800"
            : "text-slate-400 hover:text-slate-600",
        ].join(" ")}
        aria-label="Qué significa nivel de servicio vencido (SLA)"
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
      >
        <CircleHelp size={isBadge ? 12 : 13} aria-hidden="true" strokeWidth={2.25} />
      </button>

      {isOpen ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1.5 w-[min(18rem,calc(100vw-2rem))] rounded-xl bg-white px-3 py-2 text-left text-[11px] font-normal normal-case tracking-normal leading-5 text-slate-600"
        >
          {SLA_DEFINITION}
        </span>
      ) : null}
    </span>
  );
}
