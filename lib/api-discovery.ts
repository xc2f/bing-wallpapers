export const apiCatalog = { path: "/.well-known/api-catalog", type: "application/linkset+json" };
export const apiDescription = { path: "/openapi.json", type: "application/json" };
export const apiDocumentation = { path: "/api-guide.txt", type: "text/plain" };

export const apiDiscoveryLinks = [
  `<${apiCatalog.path}>; rel="api-catalog"; type="${apiCatalog.type}"`,
  `<${apiDescription.path}>; rel="service-desc describedby"; type="${apiDescription.type}"`,
  `<${apiDocumentation.path}>; rel="service-doc"; type="${apiDocumentation.type}"`,
].join(", ");
