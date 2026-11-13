import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const robots = [
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(robots, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
