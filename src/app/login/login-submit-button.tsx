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
      className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0b332a] px-4 text-sm font-semibold text-white transition hover:bg-[#14513f] focus:outline-none focus:ring-2 focus:ring-[#3d9e7e] disabled:cursor-not-allowed disabled:opacity-75"
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
