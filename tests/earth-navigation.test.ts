import assert from "node:assert/strict";
import test from "node:test";
import { MathUtils, PerspectiveCamera, Vector2, Vector3 } from "three";
import { createEarthZoomNavigation } from "../lib/earth-navigation";

function position(camera: PerspectiveCamera, distance: number, lon: number, lat: number) {
  const phi = MathUtils.degToRad(lon);
  const theta = MathUtils.degToRad(lat);
  camera.position.set(Math.cos(theta) * Math.cos(phi), Math.sin(theta), -Math.cos(theta) * Math.sin(phi)).multiplyScalar(distance);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
}

test("cursor stays over the same location throughout zoom, across hemispheres and viewports", () => {
  for (const aspect of [16 / 9, 9 / 16]) for (const [lon, lat] of [[105, 22], [-170, -35], [175, 72]]) {
    const camera = new PerspectiveCamera(38, aspect, .01, 100);
    position(camera, 3.1, lon, lat);
    const navigation = createEarthZoomNavigation(camera);
    for (const pointer of [new Vector2(.18, .22), new Vector2(-.22, -.16), new Vector2(0, 0)]) {
      position(camera, 3.1, lon, lat);
      const anchor = navigation.capture(pointer);
      assert.ok(anchor);
      let pose = { lon, lat };
      for (const distance of [3, 2.9, 2.7, 2.5, 2.7, 2.9, 3.1]) {
        pose = navigation.orient(anchor, distance, pose.lon, pose.lat);
        position(camera, distance, pose.lon, pose.lat);
        const result = anchor.point.clone().project(camera);
        assert.ok(Math.hypot(result.x - anchor.pointer.x, result.y - anchor.pointer.y) < 1e-4);
      }
    }
  }
});

test("space and limb zoom remain finite and never move the camera inside the globe", () => {
  const camera = new PerspectiveCamera(38, 16 / 9, .01, 100);
  position(camera, 3.1, 105, 22);
  const navigation = createEarthZoomNavigation(camera);
  const anchor = navigation.capture(new Vector2(.95, .95));
  assert.ok(anchor);
  const pose = navigation.orient(anchor, 5, 105, 22);
  assert.ok(Number.isFinite(pose.lon) && Number.isFinite(pose.lat));
  assert.ok(Math.abs(pose.lat) <= 85);
  position(camera, 5, pose.lon, pose.lat);
  assert.ok(anchor.point.dot(camera.position) > 1);
});

test("limb zoom stays continuous through reversals and the shrinking globe boundary", () => {
  const camera = new PerspectiveCamera(38, 16 / 9, .01, 100);
  for (const pointer of [new Vector2(.8, .6), new Vector2(-.8, -.6)]) {
    position(camera, 3.1, 105, 22);
    const navigation = createEarthZoomNavigation(camera);
    const anchor = navigation.capture(pointer);
    assert.ok(anchor);
    let pose = { lon: 105, lat: 22 };
    let lastDirection = camera.position.clone().normalize();
    let lastProjection = anchor.point.clone().project(camera);
    for (const [from, to] of [[3.1, 5], [5, 1.25], [1.25, 3.1]]) {
      const steps = 500;
      for (let i = 1; i <= steps; i++) {
        const distance = from + (to - from) * i / steps;
        pose = navigation.orient(anchor, distance, pose.lon, pose.lat);
        position(camera, distance, pose.lon, pose.lat);
        const direction = camera.position.clone().normalize();
        const projection = anchor.point.clone().project(camera);
        assert.ok(direction.angleTo(lastDirection) < MathUtils.degToRad(2), "camera must not jump at the limb");
        assert.ok(Math.hypot(projection.x - lastProjection.x, projection.y - lastProjection.y) < .025, "anchor must move continuously");
        lastDirection = direction;
        lastProjection = projection;
      }
    }
  }
});
