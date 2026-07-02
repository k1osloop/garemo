import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#FFF4E2",
    description:
      "Compra talento universitario. Descubre negocios, productos y servicios cerca de tu campus.",
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/brand/garemo-icon.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/brand/garemo-icon.png",
        type: "image/png",
      },
    ],
    name: "Garemo",
    orientation: "portrait",
    scope: "/",
    short_name: "Garemo",
    start_url: "/",
    theme_color: "#1BA463",
  };
}
