import { CircleHelp } from "lucide-react";

import { SLA_DEFINITION, SLA_VENCIDO_LABEL } from "@/domain/dashboard/alert-glossary";

type SlaTermProps = {
  className?: string;
  /** Estilo del chip/badge vs label de métrica */
  variant?: "badge" | "metric";
};

export function SlaTerm({ className, variant = "badge" }: SlaTermProps) {
  const isBadge = variant === "badge";

  return (
    <span
      className={[
        "inline-flex items-center gap-1",
        isBadge
          ? "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700"
          : "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {SLA_VENCIDO_LABEL}
      <span
        className={
          isBadge
            ? "inline-flex text-red-600/80"
            : "inline-flex text-slate-400"
        }
        title={SLA_DEFINITION}
        aria-label={SLA_DEFINITION}
        tabIndex={0}
      >
        <CircleHelp size={isBadge ? 11 : 12} aria-hidden="true" strokeWidth={2.25} />
      </span>
    </span>
  );
}
