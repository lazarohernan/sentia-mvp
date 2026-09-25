/**
 * Layout compartido de drawers laterales.
 *
 * En pantallas bajas el flex no recorta por defecto (`min-height: auto`),
 * así que el pie con acciones queda fuera del viewport. Estos tokens
 * fijan el panel a la altura visible, dejan scroll solo en el cuerpo
 * y mantienen header/footer a la vista.
 */
export const dashboardDrawerPanelClass =
  "absolute inset-y-0 right-0 flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-white";

export const dashboardDrawerHeaderClass = "shrink-0";

export const dashboardDrawerFormClass =
  "flex min-h-0 flex-1 flex-col overflow-hidden";

export const dashboardDrawerBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

export const dashboardDrawerFooterClass =
  "shrink-0 bg-brand-muted pb-[max(1.25rem,env(safe-area-inset-bottom))]";

export const dashboardDrawerCancelButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white/90 transition hover:bg-white/12";

export const dashboardDrawerPrimaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-brand-muted transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-70";
