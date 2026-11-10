import assert from "node:assert/strict";
import test from "node:test";
import { earthRenderQuality } from "../lib/earth-render-quality";

test("large Retina viewports stay within resting and interaction pixel budgets", () => {
  for (const [width, height] of [[1920, 1080], [2560, 1440], [3840, 2160], [390, 844]]) {
    const quality = earthRenderQuality(width, height, 3);
    assert.ok(width * height * quality.resting ** 2 <= 4_000_001);
    assert.ok(width * height * quality.interacting ** 2 <= 2_000_001);
    assert.ok(quality.interacting <= quality.resting);
    assert.ok(quality.resting <= 2 && quality.interacting <= 1.25);
  }
});

test("smaller screens retain native resolution without oversampling", () => {
  assert.deepEqual(earthRenderQuality(800, 600, 1), { resting: 1, interacting: 1 });
  assert.deepEqual(earthRenderQuality(800, 600, 2), { resting: 2, interacting: 1.25 });
  const empty = earthRenderQuality(0, 0, 0);
  assert.ok(Number.isFinite(empty.resting) && Number.isFinite(empty.interacting));
});
