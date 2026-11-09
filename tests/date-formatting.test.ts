import assert from "node:assert/strict";
import test from "node:test";
import { formatArchiveDate, formatMonthLabel, locales } from "../lib/i18n";

const intlLocaleMap = { en: "en-US", zh: "zh-CN", es: "es-ES", fr: "fr-FR", de: "de-DE", ja: "ja-JP", ko: "ko-KR" };

test("reused date formatters preserve language, UTC dates and fallback behavior", () => {
  for (let repeat = 0; repeat < 2; repeat++) {
    for (const locale of locales) {
      for (const [ssd, date] of [["20240229_0800", "2024-02-29"], ["20261101", "2026-11-01"]]) {
        const expected = new Intl.DateTimeFormat(intlLocaleMap[locale], {
          year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
        }).format(new Date(`${date}T00:00:00Z`));
        assert.equal(formatArchiveDate(locale, ssd), expected);
      }
      for (const month of ["01", "12"]) {
        assert.ok(formatMonthLabel(locale, month));
      }
      assert.equal(formatArchiveDate(locale, undefined, "fallback"), "fallback");
      assert.equal(formatArchiveDate(locale, "missing", "fallback"), "fallback");
    }
  }
});
