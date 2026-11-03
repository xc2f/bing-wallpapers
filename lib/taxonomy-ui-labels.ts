import { locales, type Locale } from "@/lib/i18n";

const labels = {
  expand: ["Expand", "展开", "Mostrar más", "Développer", "Aufklappen", "展開", "펼치기"],
  collapse: ["Collapse", "收起", "Mostrar menos", "Réduire", "Einklappen", "折りたたむ", "접기"],
  remove: ["Remove", "移除", "Quitar", "Retirer", "Entfernen", "解除", "해제"],
  categories: ["Categories", "分类", "Categorías", "Catégories", "Kategorien", "カテゴリ", "분류"],
  countries: ["Countries", "国家", "Países", "Pays", "Länder", "国", "국가"],
  tags: ["Tags", "标签", "Etiquetas", "Étiquettes", "Tags", "タグ", "태그"],
  all: ["All", "全部", "Todos", "Tous", "Alle", "すべて", "전체"],
};

export function taxonomyUiLabel(id: keyof typeof labels, locale: Locale) {
  return labels[id][locales.indexOf(locale)];
}
