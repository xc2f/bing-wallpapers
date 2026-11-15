const genericHeadlines = new Set([
  "info",
  "图片故事",
  "la historia de la imagen",
  "l'histoire de l'image",
  "die geschichte zum bild",
  "今日の一枚",
  "오늘의 사진",
]);

export function getBingHeadline(value?: string) {
  const headline = value?.trim();
  if (headline && !genericHeadlines.has(headline.replaceAll("’", "'").toLowerCase())) {
    return headline;
  }
}
