export const locales = ["en", "zh", "es", "fr", "de", "ja", "ko"] as const;
export const defaultLocale = "en";
export const localeCookieName = "preferred-locale";

export type Locale = (typeof locales)[number];

const baseEn = {
  siteTitle: "Bing Wallpapers Archive",
  siteDescription: "Browse locally archived Bing wallpapers.",
  archiveLabel: "Bing Wallpapers Archive",
  archived: "Archived",
  latest: "Last Updated",
  filterSearch: "Search wallpapers",
  filterSearchPlaceholder:
    "For example: Spain, turtle, lake... Press ? for search help",
  filterSearchHelpHint: "Press ? for search help",
  filterYear: "Year",
  filterMonth: "Month",
  filterAllYears: "All years",
  filterAllMonths: "All months",
  filterArchiveTime: "Archive time",
  filterAllTime: "All time",
  filterBackToYears: "Back to years",
  filterReset: "Clear",
  filterCollapse: "Hide filters",
  filterExpand: "Show filters",
  filterSummaryAll: "No filters applied",
  filterHelpTitle: "Advanced search",
  filterHelpPhrase: "`bird fish` matches the full phrase.",
  filterHelpOr: "`bird, fish` matches any comma-separated clause.",
  filterHelpExclude: "`lake -night` excludes results containing `night`.",
  filterHelpFields:
    "Field search: `title:bird`, `desc:turtle`, `copyright:spain`, `date:2024`, `ssd:20241229`.",
  resultSummaryPrefix: "Found",
  resultSummaryMiddle: "results, page",
  resultSummaryPageJoin: "of",
  resultSummarySuffix: "",
  activeQuery: "Query",
  activeYear: "Year",
  activeMonth: "Month",
  notAvailable: "N/A",
  emptyTitle: "No wallpapers matched",
  emptyDescriptionPrefix: "Try another keyword, or run",
  emptyDescriptionSuffix: "to refresh local data.",
  untitled: "Untitled Bing wallpaper",
  noDescription: "No description available.",
  unknownCopyright: "Unknown copyright",
  noPreviewImage: "No preview image",
  paginationPageSize: "12 wallpapers per page",
  paginationPrev: "Previous",
  paginationNext: "Next",
  viewWaterfall: "Waterfall view",
  waterfallTitle: "All Wallpapers",
  waterfallDescription: "Browse every archived wallpaper in a flowing grid.",
  waterfallBack: "Back to archive",
  waterfallShowMeta: "Show info",
  waterfallHideMeta: "Hide info",
  waterfallExpandDescription: "Read more",
  waterfallCollapseDescription: "Show less",
  backToTop: "Back to top",
  detailBack: "Back to archive",
  detailBackToWaterfall: "Back to waterfall",
  detailLabel: "Wallpaper Detail",
  detailDate: "Date",
  detailArchiveId: "Archive ID",
  detailDescription: "Description",
  detailInfo: "Wallpaper Info",
  detailTitle: "Title",
  detailCopyright: "Copyright",
  detailOpenFull: "Open full image",
  detailOpenPreview: "Open preview",
  detailOlder: "Older wallpaper",
  detailNewer: "Newer wallpaper",
  detailOlderShort: "Older",
  detailNewerShort: "Newer",
  detailMore: "Keep browsing",
  detailViewAll: "View all",
  metadataNotFound: "Wallpaper Not Found",
  metadataFallbackDescription: "Bing wallpaper details.",
  footerDisclaimerLine1:
    "Images are sourced from Microsoft Bing and are used for display purposes only.",
  footerDisclaimerLine2: "All copyrights belong to their respective owners.",
  footerDisclaimerLine3:
    "This project does not store or redistribute any images.",
  footerDisclaimerLine4:
    "If there is any infringement, please contact for removal.",
  footerGithub: "View on GitHub",
} as const

export const dictionaries = {
  en: baseEn,
  zh: {
    ...baseEn,
    siteTitle: "Bing 壁纸档案馆",
    siteDescription: "浏览本地归档的 Bing 壁纸。",
    archived: "存档数",
    latest: "上次更新",
    filterSearch: "搜索壁纸",
    filterSearchPlaceholder: "例如: Spain, turtle, lake... 按 ? 显示高级搜索提示",
    filterSearchHelpHint: "按 ? 显示高级搜索提示",
    filterYear: "年份",
    filterMonth: "月份",
    filterAllYears: "全部年份",
    filterAllMonths: "全部月份",
    filterArchiveTime: "归档时间",
    filterAllTime: "全部时间",
    filterBackToYears: "返回年份",
    filterReset: "清空",
    filterCollapse: "收起筛选",
    filterExpand: "展开筛选",
    filterSummaryAll: "当前未启用筛选条件",
    filterHelpTitle: "高级搜索",
    filterHelpPhrase: "`bird fish` 按完整短语匹配。",
    filterHelpOr: "`bird, fish` 按逗号拆分，任一条件命中即可。",
    filterHelpExclude: "`lake -night` 会排除包含 `night` 的结果。",
    filterHelpFields:
      "字段搜索：`title:bird`、`desc:turtle`、`copyright:spain`、`date:2024`、`ssd:20241229`。",
    resultSummaryPrefix: "找到",
    resultSummaryMiddle: "条结果，当前第",
    resultSummaryPageJoin: "/",
    resultSummarySuffix: "页",
    activeQuery: "当前关键词",
    activeYear: "年份",
    activeMonth: "月份",
    notAvailable: "暂无",
    emptyTitle: "没有匹配的壁纸",
    emptyDescriptionPrefix: "可以换个关键词试试，或者先运行",
    emptyDescriptionSuffix: "更新本地数据。",
    untitled: "未命名 Bing 壁纸",
    noDescription: "暂无描述。",
    unknownCopyright: "版权信息未知",
    noPreviewImage: "暂无预览图",
    paginationPageSize: "每页展示 12 张",
    paginationPrev: "上一页",
    paginationNext: "下一页",
    viewWaterfall: "瀑布流查看",
    waterfallTitle: "全部壁纸",
    waterfallDescription: "以瀑布流方式浏览全部归档壁纸。",
    waterfallBack: "返回列表",
    waterfallShowMeta: "显示信息",
    waterfallHideMeta: "隐藏信息",
    waterfallExpandDescription: "展开全文",
    waterfallCollapseDescription: "收起",
    backToTop: "回到顶部",
    detailBack: "返回列表",
    detailBackToWaterfall: "返回瀑布流",
    detailDate: "日期",
    detailArchiveId: "档案编号",
    detailDescription: "描述",
    detailInfo: "壁纸信息",
    detailTitle: "标题",
    detailCopyright: "版权",
    detailOpenFull: "打开高清图",
    detailOpenPreview: "打开预览图",
    detailOlder: "更早的壁纸",
    detailNewer: "更新的壁纸",
    detailOlderShort: "更早",
    detailNewerShort: "更新",
    detailMore: "继续浏览",
    detailViewAll: "查看全部",
    metadataNotFound: "壁纸未找到",
    metadataFallbackDescription: "Bing 壁纸详情。",
    footerDisclaimerLine1: "图片资源来自 Microsoft Bing，仅用于展示用途。",
    footerDisclaimerLine2: "所有版权归各自权利人所有。",
    footerDisclaimerLine3: "本项目不存储或再分发任何图片。",
    footerDisclaimerLine4: "如有侵权，请联系删除。",
    footerGithub: "查看 GitHub 仓库",
  },
  es: {
    ...baseEn,
    siteTitle: "Archivo de Fondos de Bing",
    siteDescription:
      "Explora fondos de pantalla de Bing archivados localmente.",
    archived: "Archivados",
    latest: "Última actualización",
    filterSearch: "Buscar fondos",
    filterSearchPlaceholder:
      "Por ejemplo: Spain, turtle, lake... Pulsa ? para ver la ayuda de búsqueda",
    filterSearchHelpHint: "Pulsa ? para ver la ayuda de búsqueda",
    filterYear: "Año",
    filterMonth: "Mes",
    filterAllYears: "Todos los años",
    filterAllMonths: "Todos los meses",
    filterArchiveTime: "Archivo temporal",
    filterAllTime: "Todo el tiempo",
    filterBackToYears: "Volver a los años",
    filterReset: "Limpiar",
    filterCollapse: "Ocultar filtros",
    filterExpand: "Mostrar filtros",
    filterSummaryAll: "No hay filtros activos",
    filterHelpTitle: "Búsqueda avanzada",
    filterHelpPhrase: "`bird fish` busca la frase completa.",
    filterHelpOr:
      "`bird, fish` coincide con cualquiera de las cláusulas separadas por comas.",
    filterHelpExclude:
      "`lake -night` excluye resultados que contengan `night`.",
    filterHelpFields:
      "Búsqueda por campo: `title:bird`, `desc:turtle`, `copyright:spain`, `date:2024`, `ssd:20241229`.",
    resultSummaryPrefix: "Se encontraron",
    resultSummaryMiddle: "resultados, página",
    resultSummaryPageJoin: "de",
    activeQuery: "Búsqueda",
    activeYear: "Año",
    activeMonth: "Mes",
    notAvailable: "No disponible",
    emptyTitle: "No se encontraron fondos",
    emptyDescriptionPrefix: "Prueba otra palabra clave o ejecuta",
    emptyDescriptionSuffix: "para actualizar los datos locales.",
    untitled: "Fondo de Bing sin título",
    noDescription: "No hay descripción disponible.",
    unknownCopyright: "Derechos de autor desconocidos",
    noPreviewImage: "No hay imagen de vista previa",
    paginationPageSize: "12 fondos por página",
    paginationPrev: "Anterior",
    paginationNext: "Siguiente",
    viewWaterfall: "Vista en cascada",
    waterfallTitle: "Todos los fondos",
    waterfallDescription:
      "Explora todos los fondos archivados en una cuadrícula fluida.",
    waterfallBack: "Volver al archivo",
    waterfallShowMeta: "Mostrar información",
    waterfallHideMeta: "Ocultar información",
    backToTop: "Volver arriba",
    detailBack: "Volver al archivo",
    detailBackToWaterfall: "Volver a la cascada",
    detailDate: "Fecha",
    detailArchiveId: "ID de archivo",
    detailDescription: "Descripción",
    detailInfo: "Información",
    detailTitle: "Título",
    detailCopyright: "Copyright",
    detailOpenFull: "Abrir imagen completa",
    detailOpenPreview: "Abrir vista previa",
    detailOlder: "Fondo anterior",
    detailNewer: "Fondo más reciente",
    detailOlderShort: "Anterior",
    detailNewerShort: "Más reciente",
    detailMore: "Seguir explorando",
    detailViewAll: "Ver todo",
    metadataNotFound: "Fondo no encontrado",
    metadataFallbackDescription: "Detalles del fondo de Bing.",
    footerDisclaimerLine1:
      "Las imágenes provienen de Microsoft Bing y se utilizan solo con fines de visualización.",
    footerDisclaimerLine2:
      "Todos los derechos pertenecen a sus respectivos propietarios.",
    footerDisclaimerLine3:
      "Este proyecto no almacena ni redistribuye ninguna imagen.",
    footerDisclaimerLine4:
      "Si existe alguna infracción, póngase en contacto para su eliminación.",
    footerGithub: "Ver en GitHub",
  },
  fr: {
    ...baseEn,
    siteTitle: "Archive des Fonds Bing",
    siteDescription: "Parcourez les fonds d'écran Bing archivés localement.",
    archived: "Archives",
    latest: "Dernière mise à jour",
    filterSearch: "Rechercher des fonds",
    filterSearchPlaceholder:
      "Par exemple : Spain, turtle, lake... Appuyez sur ? pour afficher l'aide de recherche",
    filterSearchHelpHint: "Appuyez sur ? pour afficher l'aide de recherche",
    filterYear: "Année",
    filterMonth: "Mois",
    filterAllYears: "Toutes les années",
    filterAllMonths: "Tous les mois",
    filterArchiveTime: "Période d'archive",
    filterAllTime: "Toute la période",
    filterBackToYears: "Retour aux années",
    filterReset: "Effacer",
    filterCollapse: "Masquer les filtres",
    filterExpand: "Afficher les filtres",
    filterSummaryAll: "Aucun filtre actif",
    filterHelpTitle: "Recherche avancée",
    filterHelpPhrase: "`bird fish` recherche la phrase complète.",
    filterHelpOr:
      "`bird, fish` correspond à l'une des clauses séparées par des virgules.",
    filterHelpExclude: "`lake -night` exclut les résultats contenant `night`.",
    filterHelpFields:
      "Recherche par champ : `title:bird`, `desc:turtle`, `copyright:spain`, `date:2024`, `ssd:20241229`.",
    resultSummaryPrefix: "",
    resultSummaryMiddle: "résultats, page",
    resultSummaryPageJoin: "sur",
    activeQuery: "Recherche",
    activeYear: "Année",
    activeMonth: "Mois",
    notAvailable: "Indisponible",
    emptyTitle: "Aucun fond correspondant",
    emptyDescriptionPrefix: "Essayez un autre mot-clé ou exécutez",
    emptyDescriptionSuffix: "pour actualiser les données locales.",
    untitled: "Fond Bing sans titre",
    noDescription: "Aucune description disponible.",
    unknownCopyright: "Copyright inconnu",
    noPreviewImage: "Aucune image d'aperçu",
    paginationPageSize: "12 fonds par page",
    paginationPrev: "Précédent",
    paginationNext: "Suivant",
    viewWaterfall: "Vue en cascade",
    waterfallTitle: "Tous les fonds",
    waterfallDescription:
      "Parcourez tous les fonds archivés dans une grille fluide.",
    waterfallBack: "Retour à l'archive",
    waterfallShowMeta: "Afficher les infos",
    waterfallHideMeta: "Masquer les infos",
    backToTop: "Retour en haut",
    detailBack: "Retour à l'archive",
    detailBackToWaterfall: "Retour à la cascade",
    detailDate: "Date",
    detailArchiveId: "ID d'archive",
    detailDescription: "Description",
    detailInfo: "Informations",
    detailTitle: "Titre",
    detailCopyright: "Copyright",
    detailOpenFull: "Ouvrir l'image complète",
    detailOpenPreview: "Ouvrir l'aperçu",
    detailOlder: "Fond plus ancien",
    detailNewer: "Fond plus récent",
    detailOlderShort: "Plus ancien",
    detailNewerShort: "Plus récent",
    detailMore: "Continuer à parcourir",
    detailViewAll: "Voir tout",
    metadataNotFound: "Fond introuvable",
    metadataFallbackDescription: "Détails du fond Bing.",
    footerDisclaimerLine1:
      "Les images proviennent de Microsoft Bing et sont utilisées uniquement à des fins d'affichage.",
    footerDisclaimerLine2:
      "Tous les droits appartiennent à leurs propriétaires respectifs.",
    footerDisclaimerLine3:
      "Ce projet ne stocke ni ne redistribue aucune image.",
    footerDisclaimerLine4:
      "En cas d'atteinte aux droits, veuillez nous contacter pour suppression.",
    footerGithub: "Voir sur GitHub",
  },
  de: {
    ...baseEn,
    siteTitle: "Bing-Hintergrundarchiv",
    siteDescription: "Durchsuche lokal archivierte Bing-Hintergründe.",
    archived: "Archiviert",
    latest: "Zuletzt aktualisiert",
    filterSearch: "Hintergründe suchen",
    filterSearchPlaceholder:
      "Zum Beispiel: Spain, turtle, lake... ? zeigt die Suchhilfe",
    filterSearchHelpHint: "? zeigt die Suchhilfe",
    filterYear: "Jahr",
    filterMonth: "Monat",
    filterAllYears: "Alle Jahre",
    filterAllMonths: "Alle Monate",
    filterArchiveTime: "Archivzeit",
    filterAllTime: "Gesamte Zeit",
    filterBackToYears: "Zurück zu den Jahren",
    filterReset: "Zurücksetzen",
    filterCollapse: "Filter ausblenden",
    filterExpand: "Filter anzeigen",
    filterSummaryAll: "Keine aktiven Filter",
    filterHelpTitle: "Erweiterte Suche",
    filterHelpPhrase: "`bird fish` sucht nach der exakten Wortgruppe.",
    filterHelpOr:
      "`bird, fish` trifft auf jede durch Komma getrennte Klausel zu.",
    filterHelpExclude: "`lake -night` schließt Ergebnisse mit `night` aus.",
    filterHelpFields:
      "Feldsuche: `title:bird`, `desc:turtle`, `copyright:spain`, `date:2024`, `ssd:20241229`.",
    resultSummaryPrefix: "",
    resultSummaryMiddle: "Ergebnisse, Seite",
    resultSummaryPageJoin: "von",
    activeQuery: "Suche",
    activeYear: "Jahr",
    activeMonth: "Monat",
    notAvailable: "Nicht verfügbar",
    emptyTitle: "Keine passenden Hintergründe",
    emptyDescriptionPrefix: "Versuche ein anderes Stichwort oder führe",
    emptyDescriptionSuffix: "aus, um lokale Daten zu aktualisieren.",
    untitled: "Unbenannter Bing-Hintergrund",
    noDescription: "Keine Beschreibung verfügbar.",
    unknownCopyright: "Unbekanntes Copyright",
    noPreviewImage: "Kein Vorschaubild",
    paginationPageSize: "12 Hintergründe pro Seite",
    paginationPrev: "Zurück",
    paginationNext: "Weiter",
    viewWaterfall: "Wasserfallansicht",
    waterfallTitle: "Alle Hintergründe",
    waterfallDescription:
      "Durchsuche alle archivierten Hintergründe in einem fließenden Raster.",
    waterfallBack: "Zurück zum Archiv",
    waterfallShowMeta: "Infos anzeigen",
    waterfallHideMeta: "Infos ausblenden",
    backToTop: "Nach oben",
    detailBack: "Zurück zum Archiv",
    detailBackToWaterfall: "Zurück zum Wasserfall",
    detailDate: "Datum",
    detailArchiveId: "Archiv-ID",
    detailDescription: "Beschreibung",
    detailInfo: "Informationen",
    detailTitle: "Titel",
    detailCopyright: "Copyright",
    detailOpenFull: "Volles Bild öffnen",
    detailOpenPreview: "Vorschau öffnen",
    detailOlder: "Älteres Hintergrundbild",
    detailNewer: "Neueres Hintergrundbild",
    detailOlderShort: "Älter",
    detailNewerShort: "Neuer",
    detailMore: "Weiter stöbern",
    detailViewAll: "Alle anzeigen",
    metadataNotFound: "Hintergrund nicht gefunden",
    metadataFallbackDescription: "Details zum Bing-Hintergrund.",
    footerDisclaimerLine1:
      "Die Bilder stammen von Microsoft Bing und werden ausschließlich zu Anzeigezwecken verwendet.",
    footerDisclaimerLine2:
      "Alle Urheberrechte liegen bei ihren jeweiligen Eigentümern.",
    footerDisclaimerLine3:
      "Dieses Projekt speichert oder verbreitet keine Bilder weiter.",
    footerDisclaimerLine4:
      "Bei Rechtsverletzungen kontaktieren Sie uns bitte zur Entfernung.",
    footerGithub: "Auf GitHub ansehen",
  },
  ja: {
    ...baseEn,
    siteTitle: "Bing 壁紙アーカイブ",
    siteDescription: "ローカルに保存された Bing 壁紙を閲覧します。",
    archived: "アーカイブ数",
    latest: "最終更新",
    filterSearch: "壁紙を検索",
    filterSearchPlaceholder: "例: Spain, turtle, lake... ? で検索ヘルプを表示",
    filterSearchHelpHint: "? で検索ヘルプを表示",
    filterYear: "年",
    filterMonth: "月",
    filterAllYears: "すべての年",
    filterAllMonths: "すべての月",
    filterArchiveTime: "アーカイブ期間",
    filterAllTime: "全期間",
    filterBackToYears: "年に戻る",
    filterReset: "クリア",
    filterCollapse: "絞り込みを隠す",
    filterExpand: "絞り込みを表示",
    filterSummaryAll: "現在フィルターはありません",
    filterHelpTitle: "高度な検索",
    filterHelpPhrase: "`bird fish` は完全なフレーズとして一致します。",
    filterHelpOr: "`bird, fish` はカンマ区切りのいずれかの条件に一致します。",
    filterHelpExclude: "`lake -night` は `night` を含む結果を除外します。",
    filterHelpFields:
      "フィールド検索: `title:bird`、`desc:turtle`、`copyright:spain`、`date:2024`、`ssd:20241229`。",
    resultSummaryPrefix: "",
    resultSummaryMiddle: "件、ページ",
    resultSummaryPageJoin: "/",
    resultSummarySuffix: "",
    activeQuery: "キーワード",
    activeYear: "年",
    activeMonth: "月",
    notAvailable: "なし",
    emptyTitle: "一致する壁紙がありません",
    emptyDescriptionPrefix: "別のキーワードを試すか、",
    emptyDescriptionSuffix: "を実行してローカルデータを更新してください。",
    untitled: "無題の Bing 壁紙",
    noDescription: "説明はありません。",
    unknownCopyright: "著作権情報なし",
    noPreviewImage: "プレビュー画像なし",
    paginationPageSize: "1ページに12枚表示",
    paginationPrev: "前へ",
    paginationNext: "次へ",
    viewWaterfall: "ウォーターフォール表示",
    waterfallTitle: "すべての壁紙",
    waterfallDescription:
      "保存されたすべての壁紙を流れるようなグリッドで閲覧します。",
    waterfallBack: "一覧へ戻る",
    waterfallShowMeta: "情報を表示",
    waterfallHideMeta: "情報を隠す",
    backToTop: "トップへ戻る",
    detailBack: "一覧へ戻る",
    detailBackToWaterfall: "瀑布流へ戻る",
    detailDate: "日付",
    detailArchiveId: "アーカイブ ID",
    detailDescription: "説明",
    detailInfo: "壁紙情報",
    detailTitle: "タイトル",
    detailCopyright: "著作権",
    detailOpenFull: "高解像度画像を開く",
    detailOpenPreview: "プレビューを開く",
    detailOlder: "より古い壁紙",
    detailNewer: "より新しい壁紙",
    detailOlderShort: "より古い",
    detailNewerShort: "より新しい",
    detailMore: "さらに見る",
    detailViewAll: "すべて表示",
    metadataNotFound: "壁紙が見つかりません",
    metadataFallbackDescription: "Bing 壁紙の詳細。",
    footerDisclaimerLine1:
      "画像は Microsoft Bing から提供されており、表示目的でのみ使用されています。",
    footerDisclaimerLine2: "すべての著作権は各権利者に帰属します。",
    footerDisclaimerLine3: "このプロジェクトは画像を保存または再配布しません。",
    footerDisclaimerLine4: "権利侵害がある場合は、削除のためご連絡ください。",
    footerGithub: "GitHub で見る",
  },
  ko: {
    ...baseEn,
    siteTitle: "Bing 배경화면 아카이브",
    siteDescription: "로컬에 보관된 Bing 배경화면을 둘러보세요.",
    archived: "보관 수",
    latest: "마지막 업데이트",
    filterSearch: "배경화면 검색",
    filterSearchPlaceholder: "예: Spain, turtle, lake... ? 로 검색 도움말 표시",
    filterSearchHelpHint: "? 로 검색 도움말 표시",
    filterYear: "연도",
    filterMonth: "월",
    filterAllYears: "모든 연도",
    filterAllMonths: "모든 월",
    filterArchiveTime: "보관 기간",
    filterAllTime: "전체 기간",
    filterBackToYears: "연도로 돌아가기",
    filterReset: "초기화",
    filterCollapse: "필터 숨기기",
    filterExpand: "필터 표시",
    filterSummaryAll: "현재 적용된 필터가 없습니다",
    filterHelpTitle: "고급 검색",
    filterHelpPhrase: "`bird fish` 는 전체 구문과 일치합니다.",
    filterHelpOr: "`bird, fish` 는 쉼표로 구분된 조건 중 하나와 일치합니다.",
    filterHelpExclude: "`lake -night` 는 `night` 를 포함한 결과를 제외합니다.",
    filterHelpFields:
      "필드 검색: `title:bird`, `desc:turtle`, `copyright:spain`, `date:2024`, `ssd:20241229`.",
    resultSummaryPrefix: "",
    resultSummaryMiddle: "개의 결과, 페이지",
    resultSummaryPageJoin: "/",
    resultSummarySuffix: "",
    activeQuery: "검색어",
    activeYear: "연도",
    activeMonth: "월",
    notAvailable: "없음",
    emptyTitle: "일치하는 배경화면이 없습니다",
    emptyDescriptionPrefix: "다른 검색어를 시도하거나",
    emptyDescriptionSuffix: "를 실행해 로컬 데이터를 새로고침하세요.",
    untitled: "제목 없는 Bing 배경화면",
    noDescription: "설명이 없습니다.",
    unknownCopyright: "저작권 정보 없음",
    noPreviewImage: "미리보기 이미지 없음",
    paginationPageSize: "페이지당 12개",
    paginationPrev: "이전",
    paginationNext: "다음",
    viewWaterfall: "워터폴 보기",
    waterfallTitle: "전체 배경화면",
    waterfallDescription: "보관된 모든 배경화면을 워터폴 그리드로 둘러보세요.",
    waterfallBack: "목록으로 돌아가기",
    waterfallShowMeta: "정보 표시",
    waterfallHideMeta: "정보 숨기기",
    backToTop: "맨 위로",
    detailBack: "목록으로 돌아가기",
    detailBackToWaterfall: "워터폴로 돌아가기",
    detailDate: "날짜",
    detailArchiveId: "아카이브 ID",
    detailDescription: "설명",
    detailInfo: "배경화면 정보",
    detailTitle: "제목",
    detailCopyright: "저작권",
    detailOpenFull: "원본 이미지 열기",
    detailOpenPreview: "미리보기 열기",
    detailOlder: "이전 날짜의 배경화면",
    detailNewer: "더 최신 배경화면",
    detailOlderShort: "이전",
    detailNewerShort: "최신",
    detailMore: "계속 둘러보기",
    detailViewAll: "전체 보기",
    metadataNotFound: "배경화면을 찾을 수 없습니다",
    metadataFallbackDescription: "Bing 배경화면 상세 정보.",
    footerDisclaimerLine1:
      "이미지는 Microsoft Bing에서 제공되며, 표시 목적으로만 사용됩니다.",
    footerDisclaimerLine2: "모든 저작권은 각 권리자에게 있습니다.",
    footerDisclaimerLine3:
      "이 프로젝트는 어떤 이미지도 저장하거나 재배포하지 않습니다.",
    footerDisclaimerLine4: "침해 사항이 있다면 삭제를 위해 연락해 주세요.",
    footerGithub: "GitHub에서 보기",
  },
} as const

export type Dictionary = (typeof dictionaries)[Locale];

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  es: "ES",
  fr: "FR",
  de: "DE",
  ja: "日本語",
  ko: "KO",
};

export const htmlLangMap: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  es: "es",
  fr: "fr",
  de: "de",
  ja: "ja",
  ko: "ko",
};

const intlLocaleMap: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getLocaleFromParam(locale?: string): Locale {
  return locale && isValidLocale(locale) ? locale : defaultLocale;
}

export function detectLocaleFromAcceptLanguage(header?: string | null): Locale {
  if (!header) return defaultLocale;

  const languages = header
    .split(",")
    .map((part) => {
      const [tagPart, ...params] = part.trim().toLowerCase().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const parsedQ = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        tag: tagPart,
        q: Number.isFinite(parsedQ) ? parsedQ : 0,
      };
    })
    .filter(Boolean);

  languages.sort((left, right) => right.q - left.q);

  for (const { tag } of languages) {
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("de")) return "de";
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("en")) return "en";
  }

  return defaultLocale;
}

export function localizePath(locale: Locale, path = "") {
  return `/${locale}${path}`;
}

export function formatMonthLabel(locale: Locale, month: string) {
  if (locale === "zh") return `${Number(month)}月`;
  if (locale === "ja") return `${Number(month)}月`;
  if (locale === "ko") return `${Number(month)}월`;

  return new Intl.DateTimeFormat(intlLocaleMap[locale], { month: "long" }).format(
    new Date(`2000-${month}-01`)
  );
}

export function formatArchiveDate(locale: Locale, ssd?: string, fallback?: string) {
  if (!ssd) {
    return fallback ?? "";
  }

  const match = ssd.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) {
    return fallback ?? ssd;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat(intlLocaleMap[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
