import type { Locale } from "@/lib/i18n";

export const favoriteLabels = {
  en: { page: "My favorites", localStorageNote: "Favorites are saved in this browser only and don’t sync across devices or browsers.", toggle: "Favorite", remove: "Remove from favorites", emptyTitle: "No favorites yet", empty: "Select Favorite in a wallpaper preview or on its detail page.", unavailable: "Favorites could not be saved in this browser.", backToFavorites: "Back to favorites" },
  zh: { page: "我的收藏", localStorageNote: "收藏仅保存在此浏览器，换设备或浏览器时不会同步。", toggle: "收藏", remove: "取消收藏", emptyTitle: "还没有收藏", empty: "在壁纸预览或详情页点击「收藏」即可添加。", unavailable: "当前浏览器无法保存收藏。", backToFavorites: "返回收藏" },
  es: { page: "Mis favoritos", localStorageNote: "Los favoritos se guardan solo en este navegador y no se sincronizan con otros dispositivos o navegadores.", toggle: "Favorito", remove: "Quitar de favoritos", emptyTitle: "Aún no tienes favoritos", empty: "Selecciona «Favorito» en la vista previa o en la página de detalles de un fondo.", unavailable: "No se pudieron guardar los favoritos en este navegador.", backToFavorites: "Volver a favoritos" },
  fr: { page: "Mes favoris", localStorageNote: "Les favoris sont enregistrés dans ce navigateur uniquement et ne sont pas synchronisés avec d’autres appareils ou navigateurs.", toggle: "Favori", remove: "Retirer des favoris", emptyTitle: "Aucun favori pour le moment", empty: "Sélectionnez « Favori » dans l’aperçu ou sur la page de détails d’un fond d’écran.", unavailable: "Impossible d’enregistrer les favoris dans ce navigateur.", backToFavorites: "Retour aux favoris" },
  de: { page: "Meine Favoriten", localStorageNote: "Favoriten werden nur in diesem Browser gespeichert und nicht mit anderen Geräten oder Browsern synchronisiert.", toggle: "Favorit", remove: "Aus Favoriten entfernen", emptyTitle: "Noch keine Favoriten", empty: "Wähle in der Vorschau oder auf der Detailseite eines Hintergrundbilds „Favorit“ aus.", unavailable: "Favoriten konnten in diesem Browser nicht gespeichert werden.", backToFavorites: "Zurück zu den Favoriten" },
  ja: { page: "お気に入り", localStorageNote: "お気に入りはこのブラウザーにのみ保存され、別の端末やブラウザーには同期されません。", toggle: "お気に入り", remove: "お気に入りから削除", emptyTitle: "お気に入りはまだありません", empty: "壁紙のプレビューや詳細ページで「お気に入り」を選ぶと追加できます。", unavailable: "このブラウザーではお気に入りを保存できませんでした。", backToFavorites: "お気に入りに戻る" },
  ko: { page: "내 즐겨찾기", localStorageNote: "즐겨찾기는 이 브라우저에만 저장되며 다른 기기나 브라우저와 동기화되지 않아요.", toggle: "즐겨찾기", remove: "즐겨찾기에서 삭제", emptyTitle: "아직 즐겨찾기가 없어요", empty: "배경화면 미리보기나 상세 페이지에서 ‘즐겨찾기’를 누르면 추가돼요.", unavailable: "이 브라우저에서 즐겨찾기를 저장할 수 없습니다.", backToFavorites: "즐겨찾기로 돌아가기" },
} satisfies Record<Locale, Record<"page" | "localStorageNote" | "toggle" | "remove" | "emptyTitle" | "empty" | "unavailable" | "backToFavorites", string>>;

export const favoriteBackupLabels = {
  en: {
    import: "Import favorites", export: "Export favorites", importing: "Importing favorites…",
    invalid: "Choose a valid Bing Wallpapers favorites backup.",
    failed: "Could not import favorites. Try again.",
    result: (added, skipped) => `Added: ${added}. Skipped: ${skipped}.`,
  },
  zh: {
    import: "导入收藏", export: "导出收藏", importing: "正在导入收藏…",
    invalid: "请选择有效的 Bing 壁纸收藏备份文件。",
    failed: "无法导入收藏，请重试。",
    result: (added, skipped) => `新增 ${added} 张，跳过 ${skipped} 张。`,
  },
  es: {
    import: "Importar favoritos", export: "Exportar favoritos", importing: "Importando favoritos…",
    invalid: "Selecciona una copia de seguridad válida de Bing Wallpapers.",
    failed: "No se pudieron importar los favoritos. Inténtalo de nuevo.",
    result: (added, skipped) => `Añadidos: ${added}. Omitidos: ${skipped}.`,
  },
  fr: {
    import: "Importer les favoris", export: "Exporter les favoris", importing: "Importation des favoris…",
    invalid: "Choisissez une sauvegarde valide des favoris de Bing Wallpapers.",
    failed: "Impossible d’importer les favoris. Réessayez.",
    result: (added, skipped) => `Ajoutés : ${added}. Ignorés : ${skipped}.`,
  },
  de: {
    import: "Favoriten importieren", export: "Favoriten exportieren", importing: "Favoriten werden importiert…",
    invalid: "Wähle eine gültige Sicherungsdatei für Bing-Wallpapers-Favoriten.",
    failed: "Die Favoriten konnten nicht importiert werden. Versuche es erneut.",
    result: (added, skipped) => `Hinzugefügt: ${added}. Übersprungen: ${skipped}.`,
  },
  ja: {
    import: "お気に入りをインポート", export: "お気に入りをエクスポート", importing: "お気に入りをインポート中…",
    invalid: "Bing 壁紙のお気に入りのバックアップファイルを選んでください。",
    failed: "お気に入りをインポートできませんでした。もう一度お試しください。",
    result: (added, skipped) => `${added} 枚を追加し、${skipped} 枚をスキップしました。`,
  },
  ko: {
    import: "즐겨찾기 가져오기", export: "즐겨찾기 내보내기", importing: "즐겨찾기를 가져오는 중…",
    invalid: "유효한 Bing 배경화면 즐겨찾기 백업 파일을 선택해 주세요.",
    failed: "즐겨찾기를 가져오지 못했어요. 다시 시도해 주세요.",
    result: (added, skipped) => `${added}장을 추가하고 ${skipped}장을 건너뛰었어요.`,
  },
} satisfies Record<Locale, {
  import: string;
  export: string;
  importing: string;
  invalid: string;
  failed: string;
  result: (added: number, skipped: number) => string;
}>;
