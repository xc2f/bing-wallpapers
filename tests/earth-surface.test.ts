import assert from "node:assert/strict";
import test from "node:test";
import { Texture, type TextureLoader } from "three";
import { EARTH_PREVIEW_TEXTURE, loadEarthSurface } from "../lib/earth-surface";

function fixture() {
  const requests: { path: string; texture: Texture; success: (texture: Texture) => void; fail: () => void }[] = [];
  const events: string[] = [];
  const loader: Pick<TextureLoader, "load"> = { load(path, success, _progress, fail) {
    const texture = new Texture<HTMLImageElement>();
    requests.push({ path, texture, success: loaded => success?.(loaded as Texture<HTMLImageElement>), fail: () => fail?.(new Error("Failed to load")) });
    return texture;
  } };
  const surface = loadEarthSurface(loader, "/full.jpg", {
    onSurface: () => events.push("ready"), onUpgrade: () => events.push("upgrade"),
    onEnhance: () => events.push("details"), onError: () => events.push("error"),
  });
  return { requests, events, surface };
}

test("the globe becomes ready from the preview before high-resolution or detail requests", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { requests, events, surface } = fixture();
  assert.deepEqual(requests.map(r => r.path), [EARTH_PREVIEW_TEXTURE]);
  requests[0].success(requests[0].texture);
  assert.deepEqual(events, ["ready"]);
  t.mock.timers.tick(649);
  assert.equal(requests.length, 1);
  t.mock.timers.tick(1);
  assert.deepEqual(requests.map(r => r.path), [EARTH_PREVIEW_TEXTURE, "/full.jpg"]);
  assert.deepEqual(events, ["ready", "details"]);
  requests[1].success(requests[1].texture);
  assert.deepEqual(events, ["ready", "details", "upgrade"]);
  surface.dispose();
});

test("a failed upgrade keeps the preview usable", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { requests, events, surface } = fixture();
  requests[0].success(requests[0].texture);
  t.mock.timers.tick(650);
  requests[1].fail();
  assert.deepEqual(events, ["ready", "details"]);
  surface.dispose();
});

test("a failed preview falls back to the full surface and reports failure only if both fail", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { requests, events, surface } = fixture();
  requests[0].fail();
  assert.equal(requests[1].path, "/full.jpg");
  assert.deepEqual(events, []);
  requests[1].success(requests[1].texture);
  t.mock.timers.tick(650);
  assert.equal(requests.length, 2);
  assert.deepEqual(events, ["ready", "details"]);
  surface.dispose();
  const failed = fixture();
  failed.requests[0].fail();
  failed.requests[1].fail();
  assert.deepEqual(failed.events, ["error"]);
  failed.surface.dispose();
});

test("unmount cancels delayed enhancements and ignores late texture responses", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { requests, events, surface } = fixture();
  requests[0].success(requests[0].texture);
  surface.dispose();
  t.mock.timers.tick(1000);
  assert.equal(requests.length, 1);
  assert.deepEqual(events, ["ready"]);
  const pending = fixture();
  pending.surface.dispose();
  pending.requests[0].success(pending.requests[0].texture);
  t.mock.timers.tick(1000);
  assert.deepEqual(pending.events, []);
  assert.equal(pending.requests.length, 1);
});
