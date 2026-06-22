import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perks",
  description: "Plataforma de feedback, analitica IA y fidelizacion.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Perks",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
