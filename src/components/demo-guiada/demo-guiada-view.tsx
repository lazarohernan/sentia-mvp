"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DemoLeadForm } from "@/components/demo-guiada/demo-lead-form";
import { DemoTour } from "@/components/demo-guiada/demo-tour";
import type { DemoLead } from "@/lib/demo-guiada/steps";
import { clearDemoLead, readDemoLead } from "@/lib/demo-guiada/storage";

export function DemoGuiadaView() {
  const [lead, setLead] = useState<DemoLead | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLead(readDemoLead());
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-[#fbf3e4]" />;
  }

  return (
    <main className="min-h-screen bg-[#fbf3e4] text-[#0d2b25]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Perks inicio">
          <Image src="/brand/perks-logo.png" alt="Perks" width={140} height={46} className="h-7 w-auto" />
        </Link>
        <Link href="/" className="text-sm font-bold text-[#08775f] transition hover:text-[#004c3c]">
          Volver al sitio
        </Link>
      </header>

      {lead ? (
        <DemoTour
          lead={lead}
          onRestartLead={() => {
            clearDemoLead();
            setLead(null);
          }}
        />
      ) : (
        <DemoLeadForm onSubmit={setLead} />
      )}
    </main>
  );
}
