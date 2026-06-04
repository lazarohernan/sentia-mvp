"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type LoginSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export function LoginSubmitButton({ label, pendingLabel }: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#56b298] px-4 text-base font-bold text-white transition hover:bg-[#62c2a7] focus:outline-none focus:ring-2 focus:ring-emerald-200/50 disabled:cursor-not-allowed disabled:opacity-75"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
