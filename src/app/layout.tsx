import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perks | Convierte comentarios en decisiones claras",
  description:
    "Plataforma de escucha operativa para recoger feedback, priorizar alertas y dar seguimiento por sucursal.",
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
