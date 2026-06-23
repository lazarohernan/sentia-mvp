"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type ActivateAccountSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export function ActivateAccountSubmitButton({
  label,
  pendingLabel,
}: ActivateAccountSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#56b298] px-4 text-base font-bold text-white transition hover:bg-[#62c2a7] disabled:cursor-not-allowed disabled:opacity-75"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
