import type { MetadataRoute } from "next";

const baseUrl = "https://www.garemo.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    "",
    "/businesses",
    "/map",
    "/login",
    "/signup",
    "/forgot-password",
  ].map((path) => ({
    changeFrequency: path === "" ? "daily" : "weekly",
    lastModified: now,
    priority: path === "" ? 1 : 0.7,
    url: `${baseUrl}${path}`,
  }));
}
