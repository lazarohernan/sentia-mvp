export type DemoLead = {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

export type DemoStageId =
  | "captura"
  | "alerta"
  | "accion"
  | "seguimiento"
  | "sucursales"
  | "cierre";

export type DemoStage = {
  id: DemoStageId;
  eyebrow: string;
  title: string;
  body: string;
  narration: string;
  requiresCase?: boolean;
};

export const DEMO_LEAD_STORAGE_KEY = "perks-demo-guiada-lead-v1";

export const DEMO_STAGES: DemoStage[] = [
  {
    id: "captura",
    eyebrow: "Paso 1",
    title: "Prueba el canal del cliente",
    body: "Esta es la misma pantalla de feedback. Califica, comenta y, si hace falta, aclara el motivo.",
    narration:
      "Empieza como cliente. Usa el mismo formulario de Perks: califica la experiencia, escribe un comentario y responde la aclaración si aparece.",
  },
  {
    id: "alerta",
    eyebrow: "Paso 2",
    title: "Tu caso ya es una alerta",
    body: "Lo que enviaste genera una alerta operativa con prioridad, causa probable y contexto de sucursal.",
    narration:
      "Ahora ves la alerta real del tablero. Tu comentario ya aparece priorizado para el equipo.",
    requiresCase: true,
  },
  {
    id: "accion",
    eyebrow: "Paso 3",
    title: "Lectura y acción sugerida",
    body: "Abre el detalle de la valoración: resumen operativo, responsable y siguiente acción.",
    narration:
      "Este es el detalle interno de la valoración. Aquí el equipo ve la lectura operativa y la acción sugerida.",
    requiresCase: true,
  },
  {
    id: "seguimiento",
    eyebrow: "Paso 4",
    title: "Haz el seguimiento",
    body: "Cambia estado, asigna responsable y deja una nota. En demo se guarda en esta sesión.",
    narration:
      "Prueba el seguimiento: cambia el estado, asigna un responsable y guarda. Así queda el aprendizaje en la operación.",
    requiresCase: true,
  },
  {
    id: "sucursales",
    eyebrow: "Paso 5",
    title: "Vista multi-sucursal",
    body: "Compara establecimientos con el mismo resumen del dashboard, incluyendo tu caso.",
    narration:
      "Por último, la vista multi-sucursal. Compara salud por establecimiento y enfoca la atención donde más duele.",
    requiresCase: true,
  },
  {
    id: "cierre",
    eyebrow: "Cierre",
    title: "Siguiente paso",
    body: "Puedes repetir la prueba o continuar hacia la experiencia comercial.",
    narration:
      "Listo. Ya probaste el flujo real. Puedes volver a enviar un comentario o continuar con un diagnóstico para tu operación.",
  },
];

/** @deprecated Prefer DEMO_STAGES — kept for older imports during migration */
export const DEMO_STEPS = DEMO_STAGES;
