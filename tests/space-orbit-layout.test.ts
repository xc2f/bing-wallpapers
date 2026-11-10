import assert from "node:assert/strict";
import test from "node:test";
import { spaceOrbitLayout } from "../lib/space-orbit-layout";

test("space cards fade in on zoom out and remain the same size", () => {
  for (const [width, height] of [[320, 740], [390, 844], [1440, 900], [1920, 825]]) {
    const near = spaceOrbitLayout(width, height, 3.1);
    const far = spaceOrbitLayout(width, height, 5);
    assert.ok(near.every(card => card.opacity === 0));
    assert.ok(far.every(card => card.opacity === 1));
    assert.deepEqual(near.map(({width, height}) => [width, height]), far.map(({width, height}) => [width, height]));
    for (const card of far) {
      assert.ok(card.x >= 16 && card.x + card.width <= width - 16);
      assert.ok(card.y >= 92 && card.y + card.height <= height - 20);
      const distance = 5 * Math.max(1, height / width);
      const radius = height / (2 * Math.tan(19 * Math.PI / 180) * Math.sqrt(distance ** 2 - 1));
      const dx = Math.max(0, Math.abs(card.x + card.width / 2 - width / 2) - card.width / 2);
      const dy = Math.max(0, Math.abs(card.y + card.height / 2 - height / 2) - card.height / 2);
      assert.ok(Math.hypot(dx, dy) > radius + 12);
    }
    for (let i = 0; i < far.length; i++) for (let j = i + 1; j < far.length; j++) {
      const a = far[i], b = far[j];
      assert.ok(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
    }
  }
});

test("short viewports hide cards that would overlap the globe", () => {
  const cramped = spaceOrbitLayout(640, 390, 5);
  assert.ok(cramped.every(card => card.opacity === 0));
  const wider = spaceOrbitLayout(844, 390, 5);
  assert.ok(wider.some(card => card.opacity === 1));
});
