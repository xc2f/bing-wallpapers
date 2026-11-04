"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

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

function ViewSlider({ label, value, values, onChange, disabled = false }: {
  label: string;
  value: number;
  values: readonly string[];
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const sliderId = useId();

  return (
    <div className="waterfall-slider-row grid grid-cols-subgrid items-center gap-y-0.5 py-1.5">
      <label htmlFor={sliderId} className="whitespace-nowrap text-xs font-medium leading-tight text-stone-300">{label}</label>
      <span className="relative block">
        <span aria-hidden="true" className="waterfall-slider-rail pointer-events-none absolute inset-x-[12.5%] top-1/2 h-0.5 -translate-y-1/2 rounded-full">
          <span className="waterfall-slider-fill absolute inset-y-0 left-0 rounded-full" style={{ width: `${values.length > 1 ? value / (values.length - 1) * 100 : 0}%` }} />
          {values.length > 1 && values.map((text, index) => (
            <span key={text} className="waterfall-slider-tick absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${index / (values.length - 1) * 100}%` }} />
          ))}
        </span>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={values.length - 1}
          step={1}
          value={value}
          disabled={disabled}
          aria-valuetext={values[value]}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
          className="waterfall-slider-input relative mx-auto block h-5 w-[calc(75%+10px)] cursor-pointer disabled:cursor-default"
        />
      </span>
      <div
        className={`col-start-2 flex w-full justify-self-center text-center text-[11px] leading-tight ${values.length === 1 ? "justify-center" : "justify-between"}`}
        style={values.length > 4 ? { width: `${75 + 75 / (values.length - 1)}%` } : undefined}
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
            className={`flex min-h-6 min-w-0 w-1/4 items-center justify-center rounded-md px-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-default ${index === value ? "waterfall-slider-current" : "text-stone-400 theme-button-hover"}`}
          >
            <span title={text} className="min-w-0 truncate px-0.5 py-0.5">{text}</span>
          </button>
        ))}
      </div>
    </div>
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
  const [mobile, setMobile] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = `waterfall-view-${useId()}`;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!mobile || !open || !sheet) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheet.showModal();
    return () => {
      sheet.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [mobile, open]);

  useEffect(() => {
    if (!open || mobile) return;

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
  }, [mobile, open]);

  const controls = (
    <>
      <ViewSlider label={layout} value={Number(view.grid)} values={[masonry, grid]} onChange={(value) => onChange({ ...view, grid: value === 1 })} />
      <ViewSlider
        label={info}
        value={preset}
        values={[images, title, captions, details]}
        onChange={(index) => onChange({ ...view, info: presets[index] })}
      />
      <ViewSlider
        label={columns}
        value={Math.max(0, activeColumns)}
        values={columnChoices.map((count) => count ? String(count) : `${auto} · ${autoColumns}`)}
        disabled={autoColumns < 2}
        onChange={(index) => onChange({ ...view, columns: columnChoices[index] })}
      />
      <ViewSlider label={wide} value={Number(view.wide)} values={[standard, wideValue]} onChange={(value) => onChange({ ...view, wide: value === 1 })} />
      <ViewSlider
        label={appearanceLabel}
        value={view.appearance}
        values={appearanceValues}
        onChange={(index) => onChange({ ...view, appearance: appearanceOptions[index] })}
      />
      <div className="waterfall-view-footer col-span-full mt-1 flex justify-end pt-1">
        <button
          type="button"
          aria-disabled={isDefault}
          onClick={() => { if (!isDefault) onChange(viewDefaults); }}
          className="rounded-md px-2 py-1.5 text-xs text-stone-300 theme-button-hover aria-disabled:text-stone-500"
        >
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
      {mobile ? (
        <dialog
          ref={sheetRef}
          id={panelId}
          aria-label={heading}
          onCancel={(event) => {
            event.preventDefault();
            setOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          className="waterfall-view-sheet fixed inset-x-0 bottom-0 top-auto m-0 max-h-[calc(100dvh-1rem)] w-full max-w-none overscroll-contain rounded-t-2xl border border-white/10 p-0 text-sm text-stone-100 shadow-xl backdrop:bg-black/50"
        >
          <div className="px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mb-1 flex items-center justify-between gap-3 border-b border-white/10 px-1 pb-1">
              <span className="font-semibold">{heading}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-stone-300 theme-button-hover">
                {close}
              </button>
            </div>
            <div className="waterfall-view-panel">{controls}</div>
          </div>
        </dialog>
      ) : (
        <div id={panelId} hidden={!open} className="absolute right-0 top-full mt-2 w-[26rem] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] waterfall-view-panel overflow-y-auto rounded-2xl border border-white/10 px-3 py-2 text-stone-100 shadow-xl">
          {controls}
        </div>
      )}
    </div>
  );
}
