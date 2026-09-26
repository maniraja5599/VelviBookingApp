import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://velvi.date";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/contact", "/privacy", "/terms", "/refund"],
        disallow: ["/admin", "/admin/*", "/api/*", "/app/*"],
      },
      // Explicitly allow leading AI search engines and answer bots
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot",
          "Bingbot",
        ],
        allow: ["/", "/pricing", "/login", "/contact", "/privacy", "/terms", "/refund"],
        disallow: ["/admin/*", "/api/*", "/app/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
