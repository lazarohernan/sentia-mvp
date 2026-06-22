export type CollaboratorPortalView = "inicio" | "evaluacion" | "perfil";

export function normalizeCollaboratorView(
  value?: string | null,
): CollaboratorPortalView {
  if (value === "evaluacion" || value === "perfil") {
    return value;
  }

  return "inicio";
}

export function buildCollaboratorViewPath(view: CollaboratorPortalView) {
  if (view === "inicio") {
    return "/colaborador";
  }

  return `/colaborador?view=${view}`;
}

export function readCollaboratorViewFromLocation(): CollaboratorPortalView {
  if (typeof window === "undefined") {
    return "inicio";
  }

  return normalizeCollaboratorView(
    new URLSearchParams(window.location.search).get("view"),
  );
}
