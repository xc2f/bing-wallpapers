import assert from "node:assert/strict";
import test from "node:test";
import { resetWaterfallFilterScroll } from "../lib/waterfall-filter-navigation";

test("changing waterfall filters clears stale restoration while preserving the current viewport and display preferences", () => {
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
    value: {
      scrollY: 480,
      sessionStorage: {
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
      scrollTo: (options: ScrollToOptions) => scrolls.push(options),
    },
  });
  try {
    resetWaterfallFilterScroll("/zh?q=lake");
    assert.deepEqual([...storage], [
      ["scroll-position:/zh?country=US", "900"],
      ["scroll-position:/zh?q=forest", "1200"],
      ["waterfall-display-preference", "grid"],
      ["scroll-position:/zh?q=lake", "480"],
    ]);
    assert.deepEqual(scrolls, []);
    storage.set("scroll-position:/zh", "200");
    resetWaterfallFilterScroll("/zh");
    assert.equal(storage.get("scroll-position:/zh"), "480");
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
