type PlatformFooterProps = {
  className?: string;
};

export function getPlatformFooterYear(referenceDate: Date = new Date()) {
  return referenceDate.getFullYear();
}

export function PlatformFooter({ className = "" }: PlatformFooterProps) {
  const year = getPlatformFooterYear();

  return (
    <footer
      className={["mt-auto shrink-0 py-6 text-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-sm font-medium text-slate-500">
        {year} · Desarrollado en Honduras
      </p>
    </footer>
  );
}
