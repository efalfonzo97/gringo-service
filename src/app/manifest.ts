import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gringo Service",
    short_name: "Gringo",
    description: "Casos, clientes, stock y finanzas del servicio técnico.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5f1",
    theme_color: "#2f6b4f",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
