import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Control de Readaptació",
    short_name: "Readaptació",
    description: "Seguiment de jugadors lesionats",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f3",
    theme_color: "#0f766e",
    lang: "ca",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
