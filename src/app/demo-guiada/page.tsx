import type { Metadata } from "next";
import { DemoGuiadaView } from "@/components/demo-guiada/demo-guiada-view";

export const metadata: Metadata = {
  title: "Demo guiada | Perks",
  description: "Recorre Perks paso a paso: captura, alertas, acciones y seguimiento operativo.",
};

export default function DemoGuiadaPage() {
  return <DemoGuiadaView />;
}
