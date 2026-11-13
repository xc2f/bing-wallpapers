import { siteUrl } from "@/lib/seo";
import { apiCatalog, apiDescription, apiDocumentation } from "@/lib/api-discovery";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    linkset: [{
      anchor: siteUrl("/api/waterfall"),
      "service-desc": [{ href: siteUrl(apiDescription.path), type: apiDescription.type }],
      "service-doc": [{ href: siteUrl(apiDocumentation.path), type: apiDocumentation.type }],
    }],
  }, {
    headers: { "Content-Type": apiCatalog.type },
  });
}
