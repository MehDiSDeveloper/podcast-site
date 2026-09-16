import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: siteConfig.htmlLang,
    dir: siteConfig.direction,
    start_url: "/",
    display: "standalone",
    background_color: "#fdfcfa",
    theme_color: "#0f7c86",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/podcast-artwork.png", sizes: "3000x3000", type: "image/png", purpose: "any" },
    ],
  };
}
