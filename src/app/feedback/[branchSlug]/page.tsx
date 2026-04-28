import {
  Angry,
  Frown,
  Laugh,
  Meh,
  MessageSquareText,
  Send,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FeedbackPageProps = {
  params: Promise<{
    branchSlug: string;
  }>;
};

const csatOptions: Array<{
  score: number;
  label: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    score: 1,
    label: "Muy mal",
    icon: Angry,
    tone:
      "text-rose-700 bg-rose-50 border-rose-100 has-checked:border-rose-500 has-checked:bg-rose-100",
  },
  {
    score: 2,
    label: "Mal",
    icon: Frown,
    tone:
      "text-orange-700 bg-orange-50 border-orange-100 has-checked:border-orange-500 has-checked:bg-orange-100",
  },
  {
    score: 3,
    label: "Normal",
    icon: Meh,
    tone:
      "text-slate-600 bg-slate-50 border-slate-200 has-checked:border-slate-400 has-checked:bg-slate-100",
  },
  {
    score: 4,
    label: "Bien",
    icon: Smile,
    tone:
      "text-emerald-700 bg-emerald-50 border-emerald-100 has-checked:border-emerald-600 has-checked:bg-emerald-100",
  },
  {
    score: 5,
    label: "Excelente",
    icon: Laugh,
    tone:
      "text-emerald-900 bg-emerald-50 border-emerald-200 has-checked:border-emerald-800 has-checked:bg-emerald-100",
  },
];

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { branchSlug } = await params;

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-normal text-emerald-900">
            Logo negocio
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-950 text-white">
              <MessageSquareText size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Sucursal</p>
              <h1 className="text-xl font-semibold capitalize">
                {branchSlug.replaceAll("-", " ")}
              </h1>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-700">
              Que tan satisfecho quedaste con esta experiencia?
            </p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {csatOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <label
                    key={option.score}
                    className={[
                      "flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition has-checked:ring-4 has-checked:ring-emerald-100",
                      option.tone,
                    ].join(" ")}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="csatScore"
                      value={option.score}
                      required
                    />
                    <span className="flex size-9 items-center justify-center rounded-full bg-white/70">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="mt-2 text-[11px] font-semibold leading-tight">
                      {option.label}
                    </span>
                    <span className="sr-only">{option.score} de 5</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-slate-700">
              Contanos que paso
            </span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              placeholder="Escribi una queja, sugerencia o felicitacion."
            />
          </label>

          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white"
            type="button"
          >
            <Send size={16} aria-hidden="true" />
            Enviar comentario
          </button>
        </div>
      </section>
    </main>
  );
}
