import { Building2, ShieldCheck } from "lucide-react";

type FeedbackTrustHeaderProps = {
  organizationName: string;
  branchName: string;
  logoUrl?: string | null;
  tagline?: string | null;
  siteHost?: string | null;
};

export function FeedbackTrustHeader({
  organizationName,
  branchName,
  logoUrl,
  tagline,
  siteHost,
}: FeedbackTrustHeaderProps) {
  return (
    <header className="mb-6 text-center">
      <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`Logo de ${organizationName}`}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <Building2 className="h-10 w-10 text-emerald-800/35" aria-hidden="true" />
        )}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Canal oficial de feedback
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
        {organizationName}
      </h1>
      {tagline ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{tagline}</p>
      ) : null}
      <p className="mt-3 text-sm font-medium text-slate-700">{branchName}</p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-slate-950">
              Verifica que estas en el lugar correcto
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Este formulario pertenece a {organizationName}. Si el nombre, logo o sitio no
              coinciden con el local, no envies tu comentario.
            </p>
            {siteHost ? (
              <p className="mt-2 text-xs font-semibold text-slate-700">
                Sitio oficial: {siteHost}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
