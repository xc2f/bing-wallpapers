import assert from "node:assert/strict";
import test from "node:test";
import { createEarthInertia } from "../lib/earth-inertia";

function fling() {
  const inertia = createEarthInertia();
  for (let i = 1; i <= 12; i++) inertia.record(1.5, 0, 1000 / 60, i * 1000 / 60);
  inertia.release(200);
  return inertia;
}

test("release continues in the drag direction and decelerates to rest", () => {
  const inertia = fling();
  let previous = Infinity;
  let stopped = false;
  for (let i = 0; i < 240; i++) {
    const step = inertia.step(1 / 60, 20);
    assert.ok(step.longitude >= 0 && step.longitude <= previous);
    assert.equal(step.latitude, 20);
    previous = step.longitude;
    if (!step.active) { stopped = true; break; }
  }
  assert.ok(stopped);
});

test("inertial distance stays consistent across frame rates", () => {
  const distances = [30, 60, 120].map(fps => {
    const inertia = fling();
    let distance = 0;
    for (let i = 0; i < fps; i++) distance += inertia.step(1 / fps, 0).longitude;
    return distance;
  });
  assert.ok(Math.max(...distances) - Math.min(...distances) < 1e-9);
});

test("holding still before release and cancelling a drag do not fling", () => {
  const held = createEarthInertia();
  held.record(5, 0, 16, 16);
  held.release(200);
  assert.equal(held.step(1 / 60, 0).active, false);
  const cancelled = fling();
  cancelled.reset();
  assert.equal(cancelled.step(1 / 60, 0).active, false);
});

test("latitude stops at the pole limit without reversing or persisting", () => {
  const inertia = createEarthInertia();
  inertia.record(0, 10, 16, 16);
  inertia.release(20);
  assert.equal(inertia.step(1 / 60, 84.99).latitude, 85);
  assert.equal(inertia.step(1 / 60, 85).active, false);
});


test("a fast flick retains a smooth tail after release", () => {
  const inertia = createEarthInertia();
  inertia.record(12, 0, 8, 8);
  inertia.release(12);
  const first = inertia.step(1 / 60, 0).longitude;
  assert.ok(first > 1);
  let next = first;
  for (let i = 0; i < 60; i++) next = inertia.step(1 / 60, 0).longitude;
  assert.ok(next > .01 && next < first);
});

test("launch speed decays continuously across the previous 100ms cutoff", () => {
  function releasedAfter(delay: number) {
    const inertia = createEarthInertia();
    inertia.record(8, 0, 16, 16);
    inertia.release(16 + delay);
    return inertia.step(1 / 60, 0).longitude;
  }
  const before = releasedAfter(99);
  const after = releasedAfter(101);
  assert.ok(after > 0);
  assert.ok(after < before && after / before > .9);
});

test("a final stationary pointer event does not abruptly erase the flick", () => {
  const inertia = createEarthInertia();
  inertia.record(8, 0, 16, 16);
  inertia.record(0, 0, 16, 32);
  inertia.release(33);
  assert.ok(inertia.step(1 / 60, 0).longitude > 1);
});
