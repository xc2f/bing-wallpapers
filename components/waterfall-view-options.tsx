"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import ResponsivePanel from "@/components/responsive-panel";

export const manualColumnChoices = [2, 3, 4, 5, 6] as const;

export interface WaterfallView {
  info: number;
  grid: boolean;
  columns: 0 | (typeof manualColumnChoices)[number];
  wide: boolean;
  appearance: 0 | 1 | 2;
}

export const viewDefaults: WaterfallView = { info: 3, grid: false, columns: 0, wide: false, appearance: 1 };

const labels = {
  en: ["View", "Information", "Images", "Title", "Title + date", "Details", "Layout", "Masonry", "Grid", "Columns", "Auto", "Page width"],
  zh: ["视图", "信息", "纯图", "标题", "标题+日期", "含描述", "布局", "瀑布流", "网格", "列数", "自动", "页面宽度"],
  es: ["Vista", "Información", "Sin texto", "Título", "Título + fecha", "Detalles", "Diseño", "Mosaico", "Cuadrícula", "Columnas", "Auto", "Ancho"],
  fr: ["Affichage", "Informations", "Images seules", "Titre", "Titre et date", "Détails", "Disposition", "Mosaïque", "Grille", "Colonnes", "Auto", "Largeur"],
  de: ["Ansicht", "Informationen", "Nur Bilder", "Titel", "Titel und Datum", "Details", "Layout", "Mosaik", "Raster", "Spalten", "Automatisch", "Seitenbreite"],
  ja: ["表示", "情報", "画像のみ", "タイトル", "タイトルと日付", "詳細", "レイアウト", "メイソンリー", "グリッド", "列数", "自動", "ページ幅"],
  ko: ["보기", "정보", "이미지만", "제목", "제목과 날짜", "상세 정보", "레이아웃", "벽돌형", "격자", "열 수", "자동", "페이지 너비"],
} as const satisfies Record<Locale, readonly string[]>;

function ViewChoice({ label, value, values, onChange, disabled = false, preview = false, wrap = false }: {
  label: string;
  value: number;
  values: readonly string[];
  onChange: (value: number) => void;
  disabled?: boolean;
  preview?: boolean;
  wrap?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="waterfall-view-section min-w-0">
      <legend className="mb-2.5 text-xs font-medium text-stone-300">{label}</legend>
      <div
        className={`waterfall-view-choices ${preview ? "waterfall-view-layouts" : ""}`}
        style={{ gridTemplateColumns: `repeat(${wrap ? 2 : values.length}, minmax(0, 1fr))` }}
      >
        {values.map((text, index) => (
          <button
            key={text}
            type="button"
            disabled={disabled}
            aria-label={`${label}: ${text}`}
            aria-pressed={index === value}
            onClick={() => {
              if (index !== value) onChange(index);
            }}
            className="waterfall-view-choice"
          >
            {preview ? (
              <svg aria-hidden="true" viewBox="0 0 56 36" fill="currentColor" className="h-9 w-14">
                {index === 0 ? (
                  <>
                    <rect x="2" y="2" width="15" height="19" rx="2" />
                    <rect x="2" y="24" width="15" height="10" rx="2" />
                    <rect x="20" y="2" width="15" height="12" rx="2" />
                    <rect x="20" y="17" width="15" height="17" rx="2" />
                    <rect x="38" y="2" width="15" height="19" rx="2" />
                    <rect x="38" y="24" width="15" height="10" rx="2" />
                  </>
                ) : (
                  [2, 20, 38].flatMap((x) => [2, 19].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="15" height="15" rx="2" />))
                )}
              </svg>
            ) : null}
            <span>{text}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const extraLabels = {
  en: ["Standard", "Wide", "Reset to defaults", "Close"],
  zh: ["标准", "宽屏", "恢复默认", "关闭"],
  es: ["Estándar", "Amplia", "Restablecer", "Cerrar"],
  fr: ["Standard", "Large", "Réinitialiser", "Fermer"],
  de: ["Standard", "Breit", "Zurücksetzen", "Schließen"],
  ja: ["標準", "ワイド", "初期設定に戻す", "閉じる"],
  ko: ["표준", "넓게", "기본값으로 재설정", "닫기"],
} as const satisfies Record<Locale, readonly string[]>;

const appearanceLabels = {
  en: ["Image style", "Compact", "Default", "Spacious"],
  zh: ["图片外观", "紧凑", "默认", "宽松"],
  es: ["Estilo", "Compacto", "Normal", "Espaciado"],
  fr: ["Style", "Compact", "Standard", "Aéré"],
  de: ["Bildstil", "Kompakt", "Standard", "Großzügig"],
  ja: ["画像の外観", "コンパクト", "標準", "ゆったり"],
  ko: ["이미지 스타일", "촘촘하게", "기본", "넉넉하게"],
} as const satisfies Record<Locale, readonly [string, string, string, string]>;

const appearanceOptions = [0, 1, 2] as const;

const presets = [0, 1, 3, 7];

export default function WaterfallViewOptions({ locale, view, autoColumns, onChange, compact }: {
  locale: Locale;
  view: WaterfallView;
  autoColumns: number;
  compact: boolean;
  onChange: (view: WaterfallView) => void;
}) {
  const [heading, info, images, title, captions, details, layout, masonry, grid, columns, auto, wide] = labels[locale];
  const [standard, wideValue, reset, close] = extraLabels[locale];
  const [appearanceLabel, ...appearanceValues] = appearanceLabels[locale];
  const isDefault = view.info === viewDefaults.info && !view.grid && view.columns === 0 && !view.wide && view.appearance === viewDefaults.appearance;
  const preset = presets.indexOf(view.info);
  const columnChoices: WaterfallView["columns"][] = [0, ...manualColumnChoices.filter((count) => count <= autoColumns)];
  const activeColumns = columnChoices.indexOf(Math.min(view.columns, autoColumns) as WaterfallView["columns"]);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = `waterfall-view-${useId()}`;

  useEffect(() => {
    if (!open) return;

    function dismissOutside(event: PointerEvent) {
      if (rootRef.current && !event.composedPath().includes(rootRef.current)) {
        setOpen(false);
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
    }

    document.addEventListener("pointerdown", dismissOutside, true);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside, true);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  const controls = (
    <>
      <div className="waterfall-view-header flex items-center justify-between gap-3">
        <span id={`${panelId}-title`} className="text-sm font-semibold text-stone-100">{heading}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label={close} className="waterfall-view-close theme-button-hover inline-flex size-8 items-center justify-center rounded-lg text-stone-400">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </div>
      <div className="waterfall-view-controls">
      <ViewChoice preview label={layout} value={Number(view.grid)} values={[masonry, grid]} onChange={(value) => onChange({ ...view, grid: value === 1 })} />
      <ViewChoice
        wrap
        label={info}
        value={preset}
        values={[images, title, captions, details]}
        onChange={(index) => onChange({ ...view, info: presets[index] })}
      />
      <ViewChoice
        label={columns}
        value={Math.max(0, activeColumns)}
        values={columnChoices.map((count) => count ? String(count) : `${auto} · ${autoColumns}`)}
        disabled={autoColumns < 2}
        onChange={(index) => onChange({ ...view, columns: columnChoices[index] })}
      />
      <ViewChoice label={wide} value={Number(view.wide)} values={[standard, wideValue]} onChange={(value) => onChange({ ...view, wide: value === 1 })} />
      <ViewChoice
        label={appearanceLabel}
        value={view.appearance}
        values={appearanceValues}
        onChange={(index) => onChange({ ...view, appearance: appearanceOptions[index] })}
      />
      </div>
      <div className="waterfall-view-footer flex justify-start">
        <button
          type="button"
          disabled={isDefault}
          onClick={() => { if (!isDefault) onChange(viewDefaults); }}
          className="waterfall-view-reset theme-button-hover inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-stone-300 disabled:cursor-default disabled:opacity-40"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a5 5 0 1 1 .5 5M3 2.5V6h3.5" /></svg>
          {reset}
        </button>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className="pointer-events-auto relative z-10 shrink-0 text-sm">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-stone-100 transition-colors duration-200 ${
          compact
            ? "theme-waterfall-mode-switch bg-stone-950/78 backdrop-blur theme-floating-button-hover"
            : "bg-transparent theme-button-hover"
        }`}
      >
        {heading}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          className={`motion-safe:transition-transform motion-safe:duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      <ResponsivePanel open={open} onClose={() => setOpen(false)} id={panelId} label={heading} returnFocusRef={triggerRef}
        className="absolute right-0 top-full mt-3 w-[23rem] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] waterfall-view-panel overflow-y-auto rounded-2xl border border-white/10 text-stone-100 shadow-xl">
        {controls}
      </ResponsivePanel>
    </div>
  );
}
