import assert from "node:assert/strict";
import test from "node:test";
import { resetWaterfallFilterScroll } from "../lib/waterfall-filter-navigation";

test("changing waterfall filters clears destination restoration without losing other filters or display preferences", () => {
  const storage = new Map([
    ["scroll-position:/zh?q=lake", "2400"],
    ["scroll-anchor-ssd:/zh?q=lake", "20261001"],
    ["scroll-anchor-offset:/zh?q=lake", "60"],
    ["scroll-anchor:/zh", "old-anchor"],
    ["scroll-position:/zh", "1800"],
    ["scroll-position:/zh?country=US", "900"],
    ["scroll-position:/zh?q=forest", "1200"],
    ["waterfall-display-preference", "grid"],
  ]);
  const scrolls: ScrollToOptions[] = [];
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: { removeItem: (key: string) => storage.delete(key) }, scrollTo: (options: ScrollToOptions) => scrolls.push(options) },
  });
  try {
    resetWaterfallFilterScroll("/zh?q=lake");
    assert.deepEqual([...storage], [
      ["scroll-position:/zh?country=US", "900"],
      ["scroll-position:/zh?q=forest", "1200"],
      ["waterfall-display-preference", "grid"],
    ]);
    assert.deepEqual(scrolls, [{ top: 0, behavior: "instant" }]);
    storage.set("scroll-position:/zh", "200");
    resetWaterfallFilterScroll("/zh");
    assert.equal(storage.has("scroll-position:/zh"), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
