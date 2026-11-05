import { locales, type Locale } from "@/lib/i18n";

export const filterLabelWidths: Record<Locale, string> = {
  en: "4.75rem",
  zh: "1.75rem",
  es: "4.75rem",
  fr: "4.75rem",
  de: "5rem",
  ja: "3.5rem",
  ko: "1.75rem",
};

const labels = {
  expand: ["Expand", "展开", "Mostrar más", "Développer", "Aufklappen", "展開", "펼치기"],
  collapse: ["Collapse", "收起", "Mostrar menos", "Réduire", "Einklappen", "折りたたむ", "접기"],
  remove: ["Remove", "移除", "Quitar", "Retirer", "Entfernen", "解除", "해제"],
  years: ["Year", "年份", "Año", "Année", "Jahr", "年", "연도"],
  categories: ["Categories", "分类", "Categorías", "Catégories", "Kategorien", "カテゴリ", "분류"],
  countries: ["Countries", "国家", "Países", "Pays", "Länder", "国", "국가"],
  tags: ["Tags", "标签", "Etiquetas", "Étiquettes", "Tags", "タグ", "태그"],
  all: ["All", "全部", "Todos", "Tous", "Alle", "すべて", "전체"],
};

export function taxonomyUiLabel(id: keyof typeof labels, locale: Locale) {
  return labels[id][locales.indexOf(locale)];
}
