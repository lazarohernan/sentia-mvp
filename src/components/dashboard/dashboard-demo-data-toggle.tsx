type DashboardDemoDataToggleProps = {
  pressed: boolean;
  onPressedChange: () => void;
};

export function DashboardDemoDataToggle({
  pressed,
  onPressedChange,
}: DashboardDemoDataToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPressedChange}
      className={[
        "inline-flex h-10 w-fit items-center gap-3 rounded-full border px-4 text-sm font-semibold transition",
        pressed
          ? "border-emerald-800 bg-emerald-800 text-white shadow-sm shadow-emerald-900/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900",
      ].join(" ")}
    >
      <span
        className={[
          "relative inline-flex h-5 w-9 rounded-full transition",
          pressed ? "bg-white/25" : "bg-slate-200",
        ].join(" ")}
        aria-hidden="true"
      >
        <span
          className={[
            "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition",
            pressed ? "left-4" : "left-0.5",
          ].join(" ")}
        />
      </span>
      Vista con datos
    </button>
  );
}
