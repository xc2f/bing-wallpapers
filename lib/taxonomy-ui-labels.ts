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
  galleryAll: ["All", "全部", "Todos", "Tous", "Alle", "すべて", "전체"],
  galleryMatched: ["Matched", "匹配", "Coincidencias", "Résultats", "Treffer", "一致", "검색 결과"],
  galleryCount: ["{count} wallpapers", "{count} 张", "{count} fondos", "{count} fonds", "{count} Hintergründe", "{count} 枚", "{count} 장"],
  galleryCountOne: ["{count} wallpaper", "{count} 张", "{count} fondo", "{count} fond", "{count} Hintergrund", "{count} 枚", "{count} 장"],
  searchCombineAnd: ["Both conditions must match.", "两侧条件必须同时满足。", "Deben cumplirse ambas condiciones.", "Les deux conditions doivent correspondre.", "Beide Bedingungen müssen zutreffen.", "両側の条件を両方満たします。", "양쪽 조건을 모두 만족해야 합니다."],
  searchCombineOr: ["Either condition may match. A comma also means OR.", "任意一侧满足即可，逗号也表示 OR。", "Basta una condición. La coma también significa OR.", "Une condition suffit. La virgule signifie aussi OR.", "Eine Bedingung reicht. Ein Komma bedeutet ebenfalls OR.", "どちらか一方を満たします。カンマも OR と同じです。", "한쪽 조건만 만족하면 됩니다. 쉼표도 OR와 같습니다."],
  searchCombineNot: ["Exclude the next condition. Use NOT (...) to exclude a group.", "排除后面的条件；排除整组时用 NOT (...)。", "Excluye la condición siguiente. Usa NOT (...) para un grupo.", "Exclut la condition suivante. Utilisez NOT (...) pour un groupe.", "Schließt die folgende Bedingung aus. NOT (...) schließt eine Gruppe aus.", "直後の条件を除外します。グループの除外には NOT (...) を使います。", "바로 뒤 조건을 제외합니다. 그룹을 제외하려면 NOT (...)을 사용하세요."],
  searchCombineGroup: ["Group conditions and evaluate them first.", "将多个条件分为一组，优先计算。", "Agrupa condiciones y evalúalas primero.", "Regroupe les conditions et les évalue en premier.", "Fasst Bedingungen zusammen und wertet sie zuerst aus.", "複数の条件をまとめ、先に判定します。", "여러 조건을 묶어 먼저 판단합니다."],
  searchCombineOrder: ["Use uppercase operators. Precedence: parentheses → NOT → AND → OR.", "运算符使用大写。计算顺序：括号 → NOT → AND → OR。", "Usa operadores en mayúsculas. Orden: paréntesis → NOT → AND → OR.", "Opérateurs en majuscules. Ordre : parenthèses → NOT → AND → OR.", "Operatoren großschreiben. Reihenfolge: Klammern → NOT → AND → OR.", "演算子は大文字で指定します。判定順：括弧 → NOT → AND → OR。", "연산자는 대문자로 입력하세요. 판단 순서: 괄호 → NOT → AND → OR."],
  searchDateRange: ["Date range: includes both endpoints. Either endpoint can be omitted.", "日期区间：包含起止两天，可省略一侧日期。", "Rango de fechas: incluye ambos extremos. Puedes omitir uno.", "Période : bornes incluses. Une borne peut être omise.", "Zeitraum: einschließlich beider Grenzen. Eine Grenze kann entfallen.", "期間指定：開始日と終了日を含みます。片方の日付は省略可能です。", "날짜 범위: 시작일과 종료일을 포함하며 한쪽 날짜는 생략할 수 있습니다."],
  searchCombined: ["Combined search: match either condition in parentheses, and restrict results to the date range.", "组合条件：括号内两项满足其一，同时日期在指定区间内。", "Búsqueda combinada: cumple una condición entre paréntesis y limita las fechas.", "Recherche combinée : une condition entre parenthèses et la période doivent correspondre.", "Kombination: Eine Bedingung in der Klammer und der Zeitraum müssen passen.", "組み合わせ：括弧内のいずれかを満たし、指定期間内の画像に絞ります。", "조합 검색: 괄호 안 조건 중 하나를 만족하고 지정 날짜 범위에 해당하는 결과입니다."],
  searchFields: ["Searchable fields", "可搜索字段", "Campos de búsqueda", "Champs de recherche", "Durchsuchbare Felder", "検索できる項目", "검색 가능한 필드"],
  searchFieldTitle: ["Title", "标题", "Título", "Titre", "Titel", "タイトル", "제목"],
  searchFieldDescription: ["Description", "描述", "Descripción", "Description", "Beschreibung", "説明", "설명"],
  searchFieldCopyright: ["Copyright / photographer", "版权信息／摄影师", "Derechos / fotógrafo", "Droits / photographe", "Copyright / Fotograf", "著作権・撮影者", "저작권 / 사진가"],
  searchFieldDate: ["Date", "日期", "Fecha", "Date", "Datum", "日付", "날짜"],
  searchFieldId: ["Archive ID", "归档编号", "ID de archivo", "Identifiant d’archive", "Archiv-ID", "アーカイブID", "아카이브 ID"],
  searchFieldHint: ["Use field:keyword. Put values containing spaces in double quotes.", "使用 字段名:关键词；包含空格时用双引号。", "Usa campo:palabra. Pon los valores con espacios entre comillas dobles.", "Utilisez champ:mot. Placez les valeurs avec espaces entre guillemets doubles.", "Nutze feld:suchwort. Werte mit Leerzeichen in doppelte Anführungszeichen setzen.", "フィールド名:キーワード の形式で指定。空白を含む値は二重引用符で囲みます。", "필드명:검색어 형식을 사용하세요. 공백이 있는 값은 큰따옴표로 감싸세요."],
  close: ["Close", "关闭", "Cerrar", "Fermer", "Schließen", "閉じる", "닫기"],
  explore: ["Find your next view", "发现下一处风景", "Encuentra tu próxima vista", "Trouvez votre prochain paysage", "Entdecke neue Aussichten", "次の景色を見つけよう", "새로운 풍경을 만나보세요"],
  exploreHint: ["Explore by mood, place and time.", "从一个主题出发，探索不同地点与时光。", "Explora por tema, lugar y fecha.", "Explorez par thème, lieu et date.", "Entdecke Motive, Orte und Zeiten.", "テーマ、場所、時から探す。", "주제, 장소, 시간으로 탐색하세요."],
  filters: ["Filters", "筛选", "Filtros", "Filtres", "Filter", "絞り込み", "필터"],
  search: ["Search wallpapers", "搜索壁纸", "Buscar fondos", "Rechercher des fonds", "Hintergründe suchen", "壁紙を検索", "배경 화면 검색"],
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
