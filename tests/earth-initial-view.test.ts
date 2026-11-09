import assert from "node:assert/strict";
import test from "node:test";
import { earthInitialView } from "../lib/earth-initial-view";

test("visitor country determines the opening hemisphere without changing zoom", () => {
  assert.ok(earthInitialView("US").lon < -90);
  assert.ok(earthInitialView("CN").lon > 100);
  assert.ok(earthInitialView("JP").lon > 130);
  assert.deepEqual(earthInitialView(" us "), earthInitialView("US"));
  assert.equal(earthInitialView("HK").lon, 114.16);
  assert.equal(earthInitialView("US").distance, 3.1);
});

test("missing, unknown and special geolocation codes use the default view", () => {
  for (const code of [undefined, null, "", "XX", "T1", "ZZ", "__proto__"]) {
    assert.deepEqual(earthInitialView(code), { lon: 105, lat: 22, distance: 3.1 });
  }
});
