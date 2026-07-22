import { DEMO_LEAD_STORAGE_KEY, type DemoLead } from "@/lib/demo-guiada/steps";

export function readDemoLead(): DemoLead | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DEMO_LEAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoLead;
    if (!parsed?.name || !parsed?.email || !parsed?.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDemoLead(lead: Omit<DemoLead, "createdAt">): DemoLead {
  const payload: DemoLead = {
    ...lead,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(DEMO_LEAD_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearDemoLead() {
  window.localStorage.removeItem(DEMO_LEAD_STORAGE_KEY);
}
