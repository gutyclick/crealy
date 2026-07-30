import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crealy",
    short_name: "Crealy",
    description:
      "Crea miniaturas, portadas y posts con una experiencia visual asistida.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    lang: "es",
    icons: [
      {
        src: "/brand/crealy-favicon.webp",
        sizes: "200x200",
        type: "image/webp",
      },
    ],
  };
}

