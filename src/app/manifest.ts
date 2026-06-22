import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Perks",
    short_name: "Perks",
    description: "Feedback operativo, reportes IA y alertas push.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#065f46",
    lang: "es",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
