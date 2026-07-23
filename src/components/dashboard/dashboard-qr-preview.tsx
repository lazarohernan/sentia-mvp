import { QRCodeSVG } from "qrcode.react";

type DashboardQrPreviewProps = {
  value: string;
};

export function DashboardQrPreview({ value }: DashboardQrPreviewProps) {
  return (
    <div
      className="relative flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[#f8fbf7] p-5 ring-1 ring-emerald-900/10"
      aria-label={`QR para ${value}`}
    >
      <div
        className="pointer-events-none absolute inset-2 rounded-[1.35rem] border-emerald-900/10"
        aria-hidden="true"
      />
      <QRCodeSVG
        value={value}
        size={256}
        level="H"
        marginSize={4}
        bgColor="#ffffff"
        fgColor="#022c22"
        title={`QR para ${value}`}
        className="h-full w-full rounded-[1.15rem] bg-white p-1 shadow-[0_12px_30px_rgba(2,44,34,0.10)]"
      />
      <div
        className="absolute left-1/2 top-1/2 flex h-11 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-emerald-900/10 bg-white px-3 shadow-[0_10px_24px_rgba(2,44,34,0.14)]"
        aria-hidden="true"
      >
        <img src="/brand/perks-logo.png" alt="" className="h-auto w-full" />
      </div>
    </div>
  );
}
