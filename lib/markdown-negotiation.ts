export function acceptsMarkdown(accept: string | null) {
  return (accept ?? "").split(",").some((range) => {
    const [type, ...parameters] = range.split(";");
    if (type.trim().toLowerCase() !== "text/markdown") return false;
    const quality = parameters.find((parameter) => /^\s*q\s*=/i.test(parameter));
    if (!quality) return true;
    const weight = quality.slice(quality.indexOf("=") + 1).trim();
    return /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(weight) && Number(weight) > 0;
  });
}
