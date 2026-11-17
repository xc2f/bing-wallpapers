import assert from "node:assert/strict";
import test from "node:test";
import detailIndexManifest from "../db/detail-index-manifest.json";
import { importFavorites } from "../lib/favorites";

test("import restores a matching image from another language when the saved language no longer has it", async (t) => {
  const storage = new Map<string, string>();
  const browser = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  t.after(() => Reflect.deleteProperty(globalThis, "window"));
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url === detailIndexManifest.zh.navigation) {
      return Response.json([{ Ssd: "20251116", imageId: "different-image" }]);
    }
    if (url === detailIndexManifest.en.navigation) {
      return Response.json([{
        Ssd: "20251115",
        imageId: "saved-image",
        ImageContent: { Title: "English title", Image: { Url: "https://www.bing.com/matching-image" } },
      }]);
    }
    return Response.json([]);
  });

  const saved = {
    ssd: "20251116",
    locale: "zh" as const,
    imageId: "saved-image",
    title: "Original title",
    previewUrl: "https://www.bing.com/old-image",
  };

  assert.deepEqual(await importFavorites([saved]), { added: 1, skipped: 0 });
  assert.deepEqual(await importFavorites([saved]), { added: 0, skipped: 1 });
  assert.deepEqual(JSON.parse(storage.get("bing-wallpapers:favorites") ?? "[]"), [{
    ...saved,
    ssd: "20251115",
    locale: "en",
    title: "English title",
    previewUrl: "https://www.bing.com/matching-image",
  }]);
});
