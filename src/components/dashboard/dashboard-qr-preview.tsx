import { QRCodeSVG } from "qrcode.react";

type DashboardQrPreviewProps = {
  value: string;
};

export function DashboardQrPreview({ value }: DashboardQrPreviewProps) {
  return (
    <div
      className="flex aspect-square w-full max-w-72 items-center justify-center rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-200"
      aria-label={`QR para ${value}`}
    >
      <QRCodeSVG
        value={value}
        size={256}
        level="M"
        marginSize={4}
        bgColor="#ffffff"
        fgColor="#020617"
        title={`QR para ${value}`}
        className="h-full w-full"
      />
    </div>
  );
}
