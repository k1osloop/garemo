import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    host: "https://www.garemo.online",
    rules: [
      {
        allow: ["/", "/businesses", "/map", "/login", "/signup"],
        disallow: ["/admin", "/account", "/dashboard", "/api"],
        userAgent: "*",
      },
    ],
    sitemap: "https://www.garemo.online/sitemap.xml",
  };
}
