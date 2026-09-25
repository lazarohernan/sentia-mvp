import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoGuiadaView } from "@/components/demo-guiada/demo-guiada-view";
import { isGuidedDemoEnabled } from "@/lib/app/guided-demo";

export const metadata: Metadata = {
  title: "Demo guiada | Perks",
  description: "Recorre Perks paso a paso: captura, alertas, acciones y seguimiento operativo.",
};

export default function DemoGuiadaPage() {
  if (!isGuidedDemoEnabled()) {
    notFound();
  }

  return <DemoGuiadaView />;
}
