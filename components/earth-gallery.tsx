"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { localizePath, type Locale } from "@/lib/i18n";
import type { EarthInitialView } from "@/lib/earth-initial-view";
import { resizeBingImage } from "@/lib/bing-image";
import { createEarthZoomNavigation, EARTH_MIN_DISTANCE, EARTH_MAX_DISTANCE, type EarthZoomAnchor } from "@/lib/earth-navigation";
import { earthRenderQuality } from "@/lib/earth-render-quality";
import { createEarthInertia } from "@/lib/earth-inertia";
import { createStarfield } from "@/lib/starfield";
import { loadEarthSurface } from "@/lib/earth-surface";
import { spaceOrbitLayout } from "@/lib/space-orbit-layout";
import "./earth-gallery.css";

type Album = {
  id: string;
  label: string;
  coordinates: number[] | null;
  count: number;
  images: { id: string; title: string; image: string; href: string }[];
  href: string;
};

function location(longitude: number, latitude: number) {
  const lon = THREE.MathUtils.degToRad(longitude);
  const lat = THREE.MathUtils.degToRad(latitude);
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
}

type EarthFlight = {
  kind: "entering" | "leaving";
  from: EarthInitialView;
  to: EarthInitialView;
  startedAt: number | null;
  duration: number;
  href?: string;
  back?: boolean;
  navigated?: boolean;
};

export default function EarthGallery({ albums, spaceAlbums, locale, initialView }: { albums: Album[]; spaceAlbums: Album[]; locale: Locale; initialView: EarthInitialView }) {
  const zh = locale === "zh";
  const router = useRouter();
  const canReturn = useRef(false);
  const orbitCards = useRef(new Map<string, HTMLButtonElement>());
  const spaceLabel = { zh: "太空图集", en: "Space collections", es: "Colecciones del espacio", fr: "Collections spatiales", de: "Weltraumgalerien", ja: "宇宙の写真集", ko: "우주 사진집" }[locale];
  const stage = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const view = useRef({ ...initialView });
  const renderedView = useRef({ ...initialView });
  const flight = useRef<EarthFlight | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<"entering" | "ready" | "leaving">("entering");
  const selectedId = useRef<string | null>(null);
  const zoomAnchor = useRef<EarthZoomAnchor | null>(null);
  const lastActivity = useRef(0);
  const hoveringCollection = useRef(false);
  const focusingCollection = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number; time: number }>());
  const inertia = useRef(createEarthInertia());
  const [selected, setSelected] = useState<Album | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    try {
      const source = sessionStorage.getItem("earth-return-path");
      sessionStorage.removeItem("earth-return-path");
      if (source) canReturn.current = new URL(source).origin === window.location.origin && window.history.length > 1;
    } catch { /* Direct visits and disabled storage fall back to the home page. */ }
  }, []);

  useEffect(() => {
    const rotationInertia = inertia.current;
    const container = stage.current;
    if (!container || !canvas.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true });
    } catch {
      setError(true);
      setTransitionPhase("ready");
      return;
    }
    container.removeAttribute("data-render-ready");
    container.removeAttribute("data-surface-quality");
    container.removeAttribute("data-clouds-ready");
    container.removeAttribute("data-sky-ready");
    container.style.removeProperty("--earth-flight-opacity");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!reducedMotion.matches) {
      setTransitionPhase("entering");
      const portraitScale = Math.max(1, container.clientHeight / Math.max(container.clientWidth, 1));
      flight.current = {
        kind: "entering", from: { ...view.current, distance: 1.8 / portraitScale },
        to: { ...view.current }, startedAt: null, duration: 650,
      };
    } else {
      flight.current = null;
      setTransitionPhase("ready");
    }
    let surfaceReady = false;
    let disposed = false;
    let contextLost = false;
    let frame = 0;
    let dirty = true;
    let width = 1;
    let height = 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 100);
    const zoomNavigation = createEarthZoomNavigation(camera);
    const initialQuality = earthRenderQuality(container.clientWidth, container.clientHeight, window.devicePixelRatio);
    let restingPixelRatio = initialQuality.resting;
    let interactionPixelRatio = initialQuality.interacting;
    renderer.setPixelRatio(restingPixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.setClearColor(0x020408, 1);

    // Distant stars surround the camera, so zooming keeps them in the background.
    const { positions: starPositions, colors: starColors, sizes: starSizes } = createStarfield();
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute("pointSize", new THREE.BufferAttribute(starSizes, 1));
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: { pixelRatio: { value: restingPixelRatio }, starOpacity: { value: 1 } },
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `uniform float pixelRatio; attribute float pointSize; varying vec3 starColor;
        void main() {
          starColor = color;
          gl_PointSize = pointSize * pixelRatio;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `uniform float starOpacity; varying vec3 starColor;
        void main() {
          vec2 point = (gl_PointCoord - 0.5) * 2.0;
          float radiusSquared = dot(point, point);
          float core = exp(-radiusSquared * 7.0);
          float halo = exp(-radiusSquared * 2.5) * 0.08;
          float edge = 1.0 - smoothstep(0.65, 1.0, radiusSquared);
          gl_FragColor = vec4(starColor, (core + halo) * edge * starOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    const previousSkyView = { lon: view.current.lon, lat: view.current.lat };
    const skyEuler = new THREE.Euler(-.3, .3, -.25);
    const skyRotation = new THREE.Quaternion();
    const skyGeometry = new THREE.SphereGeometry(44, 48, 24);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: { skyMap: { value: null }, skyOpacity: { value: 0 } },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      vertexShader: `varying vec2 skyUv;
        void main() {
          skyUv = uv;
          vec4 projected = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          // Widen only the sky projection so stars appear smaller behind the globe.
          projected.xy *= 0.55;
          gl_Position = projected;
        }`,
      fragmentShader: `uniform sampler2D skyMap; uniform float skyOpacity; varying vec2 skyUv;
        void main() {
          // NASA's complete 2:1 celestial map wraps seamlessly around the viewer.
          vec3 starlight = texture2D(skyMap, skyUv).rgb;
          gl_FragColor = vec4(starlight * 0.22 * pow(skyOpacity, 2.2), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.visible = false;
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    scene.add(sky);
    let skyTexture: THREE.Texture | null = null;
    let skyFadeStarted: number | null = null;
    const geometry = new THREE.SphereGeometry(1, 192, 128);
    // Keep ocean glints faint and contained instead of a broad white hotspot.
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 80, specular: 0x111820 });
    scene.add(new THREE.Mesh(geometry, material));
    scene.add(new THREE.AmbientLight(0xb6c7e0, 0.14));
    const sunlight = new THREE.DirectionalLight(0xfff8ee, 2.5);
    sunlight.position.copy(location(view.current.lon, view.current.lat)).multiplyScalar(12);
    scene.add(sunlight);

    // Integrate density along the view ray through a thin spherical atmosphere.
    // Rayleigh scattering gives the blue limb; aerosols add subtle forward haze.
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: new THREE.Vector3() },
        viewSamples: { value: 12 },
        sunSamples: { value: 4 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
      vertexShader: `varying vec3 worldPosition;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          worldPosition = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform int viewSamples;
        uniform int sunSamples;
        varying vec3 worldPosition;
        const float planetRadius = 1.0;
        const float atmosphereRadius = 1.025;
        const vec3 rayleigh = vec3(17.4, 40.5, 99.3);
        const vec3 mie = vec3(3.0);

        vec2 sphereHit(vec3 origin, vec3 direction, float radius) {
          float b = dot(origin, direction);
          float d = b * b - dot(origin, origin) + radius * radius;
          if (d < 0.0) return vec2(1e5, -1e5);
          float root = sqrt(d);
          return vec2(-b - root, -b + root);
        }
        vec2 density(vec3 point) {
          float altitude = max(length(point) - planetRadius, 0.0);
          return exp(-altitude / vec2(0.0015, 0.00065));
        }
        void main() {
          vec3 ray = normalize(worldPosition - cameraPosition);
          vec2 air = sphereHit(cameraPosition, ray, atmosphereRadius);
          float start = max(air.x, 0.0);
          float finish = air.y;
          vec2 ground = sphereHit(cameraPosition, ray, planetRadius);
          if (ground.x > 0.0 && ground.x < finish) finish = ground.x;
          if (finish <= start) discard;

          float stepSize = (finish - start) / float(viewSamples);
          vec2 opticalDepth = vec2(0.0);
          vec3 scatteringR = vec3(0.0);
          vec3 scatteringM = vec3(0.0);
          for (int i = 0; i < 12; i++) {
            if (i >= viewSamples) break;
            vec3 point = cameraPosition + ray * (start + (float(i) + 0.5) * stepSize);
            vec2 localDensity = density(point);
            vec2 halfDepth = opticalDepth + localDensity * stepSize * 0.5;
            opticalDepth += localDensity * stepSize;
            vec2 sunGround = sphereHit(point, sunDirection, planetRadius);
            if (sunGround.x > 0.0 && sunGround.y > 0.0) continue;
            float sunStep = sphereHit(point, sunDirection, atmosphereRadius).y / float(sunSamples);
            vec2 sunDepth = vec2(0.0);
            for (int j = 0; j < 4; j++) {
              if (j >= sunSamples) break;
              sunDepth += density(point + sunDirection * (float(j) + 0.5) * sunStep) * sunStep;
            }
            vec2 totalDepth = halfDepth + sunDepth;
            vec3 transmission = exp(-(rayleigh * totalDepth.x + mie * totalDepth.y));
            scatteringR += transmission * localDensity.x * stepSize;
            scatteringM += transmission * localDensity.y * stepSize;
          }
          float mu = dot(ray, sunDirection);
          float phaseR = 0.0596831 * (1.0 + mu * mu);
          float g = 0.76;
          float phaseM = (1.0 - g * g) / (12.56637 * pow(1.0 + g * g - 2.0 * g * mu, 1.5));
          vec3 scattered = 12.0 * (scatteringR * rayleigh * phaseR + scatteringM * mie * phaseM);
          float alpha = clamp(1.0 - exp(-opticalDepth.x * 40.5 - opticalDepth.y * 3.0), 0.0, 0.72);
          gl_FragColor = vec4(scattered / max(alpha, 0.001), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const atmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.025);
    atmosphere.renderOrder = 2;
    scene.add(atmosphere);
    const texturePath = renderer.capabilities.maxTextureSize >= 8192 && window.innerWidth >= 768
      ? "/maps/earth-day-8k.jpg"
      : "/maps/earth-day-4k.jpg";
    const detailTextures: THREE.Texture[] = [];
    const detailTasks: (() => void)[] = [];
    const detailLoader = new THREE.TextureLoader().setPriority("low");
    const prepareSurface = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      material.map = texture;
      material.needsUpdate = true;
      dirty = true;
    };
    const surfaceLoader = new THREE.TextureLoader().setPriority("high");
    const surface = loadEarthSurface(surfaceLoader, texturePath, {
      onSurface: texture => {
        prepareSurface(texture);
        surfaceReady = true;
        container.dataset.surfaceQuality = texture.image instanceof HTMLImageElement && texture.image.naturalWidth >= 4096 ? "full" : "preview";
        surfaceLoader.setPriority("low");
        container.setAttribute("data-render-ready", "true");
        setError(false);
      },
      onUpgrade: texture => { prepareSurface(texture); container.dataset.surfaceQuality = "full"; },
      onEnhance: () => {
        for (const task of detailTasks) task();
        skyTexture = new THREE.TextureLoader().setPriority("low").load(window.innerWidth >= 768 ? "/maps/nasa-starmap-4k.webp" : "/maps/nasa-starmap-2k.webp", loaded => {
          if (disposed) { loaded.dispose(); return; }
          loaded.colorSpace = THREE.SRGBColorSpace;
          loaded.wrapS = THREE.RepeatWrapping;
          loaded.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
          skyMaterial.uniforms.skyMap.value = loaded;
          sky.visible = true;
          skyFadeStarted = performance.now();
          container.dataset.skyReady = "true";
          dirty = true;
        }, undefined, () => { /* Keep the generated stars if the sky map is unavailable. */ });
      },
      onError: () => {
        flight.current = null;
        setTransitionPhase("ready");
        setError(true);
      },
    });
    surface.texture.colorSpace = THREE.SRGBColorSpace;
    material.map = surface.texture;

    const loadDetail = (path: string, onLoad?: () => void) => {
      // Neutral texels keep shaders stable while detail downloads are deferred.
      const pixel = document.createElement("canvas");
      pixel.width = pixel.height = 1;
      const context = pixel.getContext("2d");
      if (context) {
        context.fillStyle = path.includes("normal") ? "rgb(128,128,255)" : "#000";
        context.fillRect(0, 0, 1, 1);
      }
      const detail = new THREE.Texture<HTMLImageElement | HTMLCanvasElement>(pixel);
      detail.needsUpdate = true;
      detail.anisotropy = renderer.capabilities.getMaxAnisotropy();
      detailTextures.push(detail);
      detailTasks.push(() => {
        detailLoader.load(path, loaded => {
          if (!disposed) {
            // Reallocate GPU storage when replacing the 1px neutral texture.
            detail.dispose();
            detail.image = loaded.image;
            detail.needsUpdate = true;
            onLoad?.();
            dirty = true;
          }
          loaded.dispose();
        }, undefined, () => { /* Optional details never block browsing. */ });
      });
      return detail;
    };
    material.normalMap = loadDetail("/maps/earth-normal.jpg");
    material.normalScale.set(.45, .45);
    material.specularMap = loadDetail("/maps/earth-specular.jpg");

    const cloudRadius = 1.004;
    const cloudReady = { value: 0 };
    const cloudTexture = loadDetail("/maps/earth-clouds.webp", () => {
      clouds.visible = true;
      cloudReady.value = 1;
      container.dataset.cloudsReady = "true";
    });
    cloudTexture.wrapS = THREE.RepeatWrapping;
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      alphaMap: cloudTexture,
      opacity: .92,
      transparent: true,
      depthWrite: false,
      shininess: 0,
      specular: 0x000000,
    });
    const clouds = new THREE.Mesh(geometry, cloudMaterial);
    clouds.visible = false;
    clouds.scale.setScalar(cloudRadius);
    clouds.renderOrder = 1;
    scene.add(clouds);

    // Sample the same drifting cloud mask along the sun ray to cast cloud shadows.
    const cloudUniforms = {
      cloudMap: { value: cloudTexture },
      cloudReady,
      cloudOffset: { value: 0 },
      cloudSun: { value: sunlight.position.clone().normalize() },
    };
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, cloudUniforms);
      shader.vertexShader = `varying vec3 earthWorldPosition;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", `
        #include <worldpos_vertex>
        earthWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `);
      shader.fragmentShader = `
        uniform sampler2D cloudMap;
        uniform float cloudReady;
        uniform float cloudOffset;
        uniform vec3 cloudSun;
        varying vec3 earthWorldPosition;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_end>", `
        #include <lights_fragment_end>
        vec3 surfacePoint = normalize(earthWorldPosition);
        float sunHeight = dot(surfacePoint, cloudSun);
        if (sunHeight > 0.0) {
          float travel = -sunHeight + sqrt(sunHeight * sunHeight + ${cloudRadius * cloudRadius - 1});
          vec3 cloudPoint = normalize(surfacePoint + cloudSun * travel);
          vec2 cloudUv = vec2(
            fract(0.5 + atan(-cloudPoint.z, cloudPoint.x) / 6.2831853 - cloudOffset),
            0.5 + asin(clamp(cloudPoint.y, -1.0, 1.0)) / 3.14159265
          );
          float shadow = texture2D(cloudMap, cloudUv).g * cloudReady;
          float transmission = 1.0 - smoothstep(0.06, 0.85, shadow) * 0.42;
          reflectedLight.directDiffuse *= transmission;
          reflectedLight.directSpecular *= transmission;
        }
      `);
    };
    material.customProgramCacheKey = () => "earth-cloud-shadows-v1";
    let lastCloudFrame = performance.now();

    const points = albums.filter(a => a.coordinates).map(album => ({
      album,
      point: location(album.coordinates![0], album.coordinates![1]),
    })).sort((a, b) => b.album.count - a.album.count);
    const actual = { ...(flight.current?.from ?? view.current) };
    const projected = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let previousFrame = performance.now();
    lastActivity.current = previousFrame;
    let lastAutoRotation = previousFrame;
    let lastMotion = previousFrame;
    let lastMarkerSelection: string | null = null;
    let sortedPoints = points;
    let coverIds = new Set<string>();
    const orderPoints = () => [...points].sort((a, b) =>
      Number(b.album.id === selectedId.current) - Number(a.album.id === selectedId.current)
      || Number(coverIds.has(b.album.id)) - Number(coverIds.has(a.album.id))
      || b.album.count - a.album.count);
    let interacting = false;
    let lastSkyReport = -Infinity;
    let hiddenAt: number | null = null;
    let lastWheelTime = -Infinity;
    const wheelPointer = new THREE.Vector2();
    const lastWheelPointer = new THREE.Vector2(Infinity, Infinity);
    const resize = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      zoomAnchor.current = null;
      const quality = earthRenderQuality(width, height, window.devicePixelRatio);
      restingPixelRatio = quality.resting;
      interactionPixelRatio = quality.interacting;
      const pixelRatio = interacting ? interactionPixelRatio : restingPixelRatio;
      renderer.setPixelRatio(pixelRatio);
      starMaterial.uniforms.pixelRatio.value = pixelRatio;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      dirty = true;
    });
    resize.observe(container);

    function draw(time: number) {
      frame = 0;
      if (disposed || contextLost || document.hidden) return;
      const deltaSeconds = Math.min((time - previousFrame) / 1000, .05);
      previousFrame = time;
      const target = view.current;
      const currentFlight = flight.current;
      if (currentFlight && surfaceReady) {
        currentFlight.startedAt ??= time;
        const progress = reducedMotion.matches ? 1 : Math.min(1, (time - currentFlight.startedAt) / currentFlight.duration);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        const lonTravel = (((currentFlight.to.lon - currentFlight.from.lon) % 360 + 540) % 360) - 180;
        actual.lon = target.lon = currentFlight.from.lon + lonTravel * eased;
        actual.lat = target.lat = THREE.MathUtils.lerp(currentFlight.from.lat, currentFlight.to.lat, eased);
        actual.distance = target.distance = Math.exp(THREE.MathUtils.lerp(Math.log(currentFlight.from.distance), Math.log(currentFlight.to.distance), eased));
        if (currentFlight.kind === "leaving") {
          // Fade before the global texture becomes a visibly enlarged close-up.
          const opacity = 1 - THREE.MathUtils.smoothstep(progress, .2, 1);
          container?.style.setProperty("--earth-flight-opacity", String(opacity));
        }
        dirty = true;
        if (progress === 1) {
          lastActivity.current = time;
          if (currentFlight.kind === "entering") {
            flight.current = null;
            setTransitionPhase("ready");
          } else if (currentFlight.href && !currentFlight.navigated) {
            currentFlight.navigated = true;
            if (currentFlight.back) router.back();
            else router.push(currentFlight.href);
          }
        }
      }
      if (flight.current || selectedId.current || reducedMotion.matches || document.hidden) rotationInertia.reset();
      else if (pointers.current.size === 0) {
        const coast = rotationInertia.step(deltaSeconds, target.lat);
        if (coast.active) {
          zoomAnchor.current = null;
          target.lon += coast.longitude;
          target.lat = coast.latitude;
        }
      }
      const lonDelta = (((target.lon - actual.lon) % 360 + 540) % 360) - 180;
      const moving = Math.abs(lonDelta) + Math.abs(target.lat - actual.lat) > .001 || Math.abs(target.distance - actual.distance) > .0001;
      if (moving || pointers.current.size > 0) {
        lastMotion = time;
        lastActivity.current = time;
      }
      const canAutoRotate = !flight.current && !reducedMotion.matches && !document.hidden
        && !selectedId.current && !hoveringCollection.current && !focusingCollection.current
        && pointers.current.size === 0 && !moving && time - lastActivity.current >= 5000;
      if (!canAutoRotate) lastAutoRotation = time;
      const autoRotating = canAutoRotate && time - lastAutoRotation >= 50;
      if (autoRotating) {
        // About 7.5 minutes per revolution, without forcing interaction quality.
        const rotation = Math.min((time - lastAutoRotation) / 1000, .1) * .8;
        zoomAnchor.current = null;
        target.lon -= rotation;
        actual.lon -= rotation;
        // Advance the sky directly on idle ticks, independently of camera cancellation.
        // One sky revolution takes roughly 37.5 minutes (five times slower than Earth).
        skyEuler.y -= THREE.MathUtils.degToRad(rotation * .2);
        lastAutoRotation = time;
      }
      const nextInteracting = Boolean(flight.current) || time - lastMotion < 180;
      if (nextInteracting !== interacting) {
        interacting = nextInteracting;
        container?.setAttribute("data-interacting", String(interacting));
        // Resize only at interaction boundaries; keep the 8K surface texture intact.
        const pixelRatio = interacting ? interactionPixelRatio : restingPixelRatio;
        renderer.setPixelRatio(pixelRatio);
        starMaterial.uniforms.pixelRatio.value = pixelRatio;
        atmosphereMaterial.uniforms.viewSamples.value = interacting ? 8 : 12;
        atmosphereMaterial.uniforms.sunSamples.value = interacting ? 2 : 4;
        dirty = true;
      }
      const selectionChanged = lastMarkerSelection !== selectedId.current;
      if (selectionChanged) {
        lastMarkerSelection = selectedId.current;
        sortedPoints = orderPoints();
      }
      // Screen-space markers must follow every rendered camera frame to avoid judder.
      const updateMarkers = moving || autoRotating || dirty || selectionChanged;
      const animateClouds = !reducedMotion.matches && !document.hidden && time - lastCloudFrame >= 100;
      if (animateClouds) {
        clouds.rotation.y += Math.min((time - lastCloudFrame) / 1000, .2) * .0005;
        cloudUniforms.cloudOffset.value = clouds.rotation.y / (Math.PI * 2);
        lastCloudFrame = time;
      }
      const skyFading = skyFadeStarted !== null && skyMaterial.uniforms.skyOpacity.value < 1;
      if (skyFading) {
        const progress = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (time - skyFadeStarted!) / 1000));
        const opacity = progress * progress * (3 - 2 * progress);
        skyMaterial.uniforms.skyOpacity.value = opacity;
        starMaterial.uniforms.starOpacity.value = 1 - opacity;
        if (progress === 1) stars.visible = false;
      }
      if (moving || autoRotating || dirty || animateClouds || selectionChanged || skyFading || updateMarkers) {
        // Time-based damping gives the same response at different display refresh rates.
        const damping = 1 - Math.exp(-22 * deltaSeconds);
        const zoomDamping = 1 - Math.exp(-12 * deltaSeconds);
        if (moving) {
          actual.lon += lonDelta * damping;
          actual.lat += (target.lat - actual.lat) * damping;
          actual.distance = Math.exp(THREE.MathUtils.lerp(Math.log(actual.distance), Math.log(target.distance), zoomDamping));
        } else {
          actual.lon = target.lon;
          actual.lat = target.lat;
          actual.distance = target.distance;
        }
        // Pull back on portrait screens so the whole globe initially fits.
        const distance = actual.distance * Math.max(1, 1 / camera.aspect);
        if (zoomAnchor.current) {
          const orientation = zoomNavigation.orient(zoomAnchor.current, distance, actual.lon, actual.lat);
          actual.lon = target.lon = orientation.lon;
          actual.lat = target.lat = orientation.lat;
        }
        renderedView.current.lon = actual.lon;
        renderedView.current.lat = actual.lat;
        renderedView.current.distance = actual.distance;
        direction.copy(location(actual.lon, actual.lat));
        camera.position.copy(direction).multiplyScalar(distance);
        stars.position.copy(camera.position);
        sky.position.copy(camera.position);
        // Manual movement stays subtle; idle sky motion is advanced by time above.
        const skyLonTravel = (((actual.lon - previousSkyView.lon) % 360 + 540) % 360) - 180;
        if (!autoRotating) skyEuler.y += THREE.MathUtils.degToRad(skyLonTravel) * .008;
        skyEuler.x += THREE.MathUtils.degToRad(actual.lat - previousSkyView.lat) * .006;
        previousSkyView.lon = actual.lon;
        previousSkyView.lat = actual.lat;
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        skyRotation.setFromEuler(skyEuler);
        sky.quaternion.copy(camera.quaternion).multiply(skyRotation);
        if (time - lastSkyReport >= 250) {
          container?.setAttribute("data-sky-rotation", skyEuler.y.toFixed(6));
          lastSkyReport = time;
        }
        // Side lighting leaves a shaded crescent at screen lower-right.
        // Keep this direction relative to the camera throughout globe rotation.
        sunlight.position.set(-.7, .8, 1).normalize()
          .applyQuaternion(camera.quaternion).multiplyScalar(12);
        cloudUniforms.cloudSun.value.copy(sunlight.position).normalize();
        atmosphereMaterial.uniforms.sunDirection.value.copy(cloudUniforms.cloudSun.value);
        renderer.render(scene, camera);
        if (updateMarkers) {
          const orbitLayout = spaceOrbitLayout(width, height, actual.distance);
          const visibleOrbitBounds: { x: number; y: number; width: number; height: number }[] = [];
          spaceAlbums.forEach((album, index) => {
            const card = orbitCards.current.get(album.id);
            const layout = orbitLayout[index];
            if (!card || !layout) return;
            const panelOverlap = selectedId.current && width > 640 && layout.x + layout.width > width - 408;
            const bottomOverlap = selectedId.current && width <= 640 && layout.y + layout.height > height * .45 - 24;
            const opacity = panelOverlap || bottomOverlap || flight.current?.kind === "entering" ? 0 : layout.opacity;
            if (card.hidden !== (opacity <= .01)) card.hidden = opacity <= .01;
            if (card.inert !== (opacity < .25)) card.inert = opacity < .25;
            const alpha = String(Math.round(opacity * 1000) / 1000);
            const hitTarget = opacity >= .25 ? "auto" : "none";
            const transform = `translate(${Math.round(layout.x * 10) / 10}px, ${Math.round(layout.y * 10) / 10}px)`;
            if (card.style.opacity !== alpha) card.style.opacity = alpha;
            if (card.style.pointerEvents !== hitTarget) card.style.pointerEvents = hitTarget;
            if (card.style.transform !== transform) card.style.transform = transform;
            if (opacity >= .25) visibleOrbitBounds.push(layout);
          });
          const covers: { x: number; y: number }[] = [];
          const nextCoverIds = new Set<string>();
          for (const { album, point } of sortedPoints) {
            const marker = markers.current.get(album.id);
            if (!marker) continue;
            projected.copy(point).multiplyScalar(1.008).project(camera);
            const x = (projected.x + 1) * width / 2;
            const y = (1 - projected.y) * height / 2;
            const horizonDepth = point.dot(direction) - 1 / distance;
            const screenMargin = Math.min(x, width - x, y, height - y);
            // Enter and exit at different thresholds, fading out before occlusion.
            const visible = horizonDepth > (marker.hidden ? .05 : .025)
              && screenMargin > (marker.hidden ? 20 : 8);
            if (marker.hidden === visible) marker.hidden = !visible;
            if (!visible) continue;
            const transform = `translate(${Math.round(x * 10) / 10}px, ${Math.round(y * 10) / 10}px)`;
            if (marker.style.transform !== transform) marker.style.transform = transform;
            const opacity = THREE.MathUtils.smoothstep(horizonDepth, .06, .15)
              * THREE.MathUtils.smoothstep(screenMargin, 24, 48);
            const alpha = String(Math.round(opacity * 1000) / 1000);
            const hitTarget = opacity > .1 ? "auto" : "none";
            if (marker.style.opacity !== alpha) marker.style.opacity = alpha;
            if (marker.style.pointerEvents !== hitTarget) marker.style.pointerEvents = hitTarget;
            if (marker.inert !== (opacity <= .1)) marker.inert = opacity <= .1;
            const compact = width <= 640;
            const coverWidth = compact ? 80 : 96;
            const coverTop = y - 31 - (compact ? 60 : 68) - 12;
            const spaceBlocked = visibleOrbitBounds.some(rect => x + coverWidth / 2 + 16 > rect.x && x - coverWidth / 2 - 6 < rect.x + rect.width && y - 25 > rect.y && coverTop < rect.y + rect.height);
            if (marker.dataset.spaceBlocked !== String(spaceBlocked)) marker.dataset.spaceBlocked = String(spaceBlocked);
            const spacing = compact ? 104 : 124;
            const panelOverlap = selectedId.current && !compact && x > width - 420;
            const incumbent = coverIds.has(album.id);
            const edgeMargin = incumbent ? 56 : 68;
            const cover = !spaceBlocked && !panelOverlap && y > (incumbent ? 104 : 120)
              && x > edgeMargin && x < width - edgeMargin
              && covers.length < (compact ? 5 : 8)
              && covers.every(p => Math.hypot(p.x - x, p.y - y) > spacing + (incumbent ? 0 : 14));
            if (marker.dataset.cover !== String(cover)) marker.dataset.cover = String(cover);
            const zIndex = album.id === selectedId.current ? "4" : cover ? "3" : "2";
            if (marker.style.zIndex !== zIndex) marker.style.zIndex = zIndex;
            if (cover) {
              covers.push({ x, y });
              nextCoverIds.add(album.id);
            }
          }
          if ((coverIds.size !== nextCoverIds.size || [...coverIds].some(id => !nextCoverIds.has(id)))) {
            coverIds = nextCoverIds;
            sortedPoints = orderPoints();
          }
        }
        dirty = false;
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    const wheel = (event: WheelEvent) => {
      lastActivity.current = performance.now();
      if (flight.current || (event.target as Element).closest("aside")) return;
      event.preventDefault();
      rotationInertia.reset();
      // Normalize mouse-wheel lines/pages and trackpad pixels before applying zoom.
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? height : 1;
      const delta = THREE.MathUtils.clamp(event.deltaY * unit, -120, 120);
      const now = performance.now();
      const sameGesture = zoomAnchor.current && now - lastWheelTime < 280
        && Math.hypot(event.clientX - lastWheelPointer.x, event.clientY - lastWheelPointer.y) < 8;
      if (!sameGesture) {
        zoomAnchor.current = zoomNavigation.capture(wheelPointer.set(
          event.clientX / width * 2 - 1,
          1 - event.clientY / height * 2,
        ));
        lastWheelPointer.set(event.clientX, event.clientY);
      }
      lastWheelTime = now;
      view.current.distance = THREE.MathUtils.clamp(view.current.distance * Math.exp(delta * .0012), EARTH_MIN_DISTANCE, EARTH_MAX_DISTANCE);
      lastMotion = performance.now();
    };
    const resetIdle = () => { lastActivity.current = performance.now(); };
    const visibilityChanged = () => {
      const now = performance.now();
      rotationInertia.reset();
      pointers.current.clear();
      container.removeAttribute("data-dragging");
      if (document.hidden) {
        hiddenAt = now;
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        const paused = hiddenAt === null ? 0 : now - hiddenAt;
        if (flight.current?.startedAt != null) flight.current.startedAt += paused;
        if (skyFadeStarted !== null) skyFadeStarted += paused;
        hiddenAt = null;
        previousFrame = lastAutoRotation = lastCloudFrame = now;
        resetIdle();
        dirty = true;
        if (!frame && !disposed) frame = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    reducedMotion.addEventListener("change", resetIdle);
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      rotationInertia.reset();
      cancelAnimationFrame(frame);
      frame = 0;
      flight.current = null;
      setTransitionPhase("ready");
      setError(true);
    };
    container.addEventListener("wheel", wheel, { passive: false });
    const canvasElement = canvas.current;
    canvasElement.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      rotationInertia.reset();
      zoomAnchor.current = null;
      flight.current = null;
      cancelAnimationFrame(frame);
      resize.disconnect();
      container.removeEventListener("wheel", wheel);
      document.removeEventListener("visibilitychange", visibilityChanged);
      reducedMotion.removeEventListener("change", resetIdle);
      canvasElement.removeEventListener("webglcontextlost", lost);
      surface.dispose();
      geometry.dispose();
      material.dispose();
      atmosphereMaterial.dispose();
      cloudMaterial.dispose();
      for (const detail of detailTextures) detail.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      skyTexture?.dispose();
      skyGeometry.dispose();
      skyMaterial.dispose();
      renderer.dispose();
    };
  }, [albums, spaceAlbums, retry, router]);

  function closeCollection(restoreFocus = true) {
    lastActivity.current = performance.now();
    const id = selectedId.current;
    selectedId.current = null;
    setSelected(null);
    if (restoreFocus && id) {
      const source = markers.current.get(id) ?? orbitCards.current.get(id);
      requestAnimationFrame(() => source?.focus({ preventScroll: true }));
    }
  }

  function choose(album: Album) {
    inertia.current.reset();
    lastActivity.current = performance.now();
    zoomAnchor.current = null;
    selectedId.current = album.id;
    setSelected(album);
    if (album.coordinates) {
      view.current.lon = album.coordinates[0];
      view.current.lat = album.coordinates[1];
    }
  }


  function movePointer(pointerId: number, x: number, y: number, time: number) {
    const old = pointers.current.get(pointerId);
    if (!old) return;
    const next = { x, y, time };
    const other = [...pointers.current].find(([id]) => id !== pointerId)?.[1];
    if (other) {
      inertia.current.reset();
      const before = Math.hypot(old.x - other.x, old.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      if (after > 0) view.current.distance = THREE.MathUtils.clamp(view.current.distance * before / after, EARTH_MIN_DISTANCE, EARTH_MAX_DISTANCE);
    } else {
      const sensitivity = .16 * view.current.distance / 3;
      const longitude = -(next.x - old.x) * sensitivity;
      const latitude = THREE.MathUtils.clamp(view.current.lat + (next.y - old.y) * sensitivity, -85, 85);
      inertia.current.record(longitude, latitude - view.current.lat, next.time - old.time, next.time);
      view.current.lon += longitude;
      view.current.lat = latitude;
    }
    pointers.current.set(pointerId, next);
  }

  return <main ref={stage} className="earth-page" data-transition={transitionPhase} onClickCapture={event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || link.target === "_blank" || link.hasAttribute("download")) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || error) return;
    event.preventDefault();
    if (flight.current?.kind === "leaving") return;
    const bounds = stage.current!.getBoundingClientRect();
    const portraitScale = Math.max(1, bounds.height / bounds.width);
    const destinationView = selected?.coordinates;
    const isSpaceCollection = Boolean(selected && !selected.coordinates);
    zoomAnchor.current = null;
    pointers.current.clear();
    router.prefetch(destination.pathname + destination.search);
    flight.current = {
      kind: "leaving", from: { ...renderedView.current },
      to: isSpaceCollection ? { ...renderedView.current } : { lon: destinationView?.[0] ?? renderedView.current.lon, lat: destinationView?.[1] ?? renderedView.current.lat, distance: 1.6 / portraitScale },
      startedAt: performance.now(), duration: isSpaceCollection ? 360 : 700, href: destination.pathname + destination.search + destination.hash,
    };
    setTransitionPhase("leaving");
  }} data-collection-open={selected ? "true" : undefined} tabIndex={0}
    aria-label={zh ? "地球图集：拖动旋转，滚轮或双指缩放，点击图集查看壁纸" : "Wallpaper Earth: drag to rotate, scroll or pinch to zoom, select a collection"}
    onFocusCapture={event => {
      focusingCollection.current = Boolean((event.target as Element).closest(".earth-location"));
      lastActivity.current = performance.now();
    }}
    onBlurCapture={() => { focusingCollection.current = false; lastActivity.current = performance.now(); }}
    onPointerOver={event => {
      if (event.pointerType === "mouse") hoveringCollection.current = Boolean((event.target as Element).closest(".earth-location"));
    }}
    onPointerOut={event => {
      if (event.pointerType === "mouse") {
        hoveringCollection.current = event.relatedTarget instanceof Element && Boolean(event.relatedTarget.closest(".earth-location"));
        lastActivity.current = performance.now();
      }
    }}
    onPointerLeave={() => { hoveringCollection.current = false; lastActivity.current = performance.now(); }}
    onKeyDown={event => {
      if ((event.target as Element).closest(".earth-back")) return;
      if (flight.current) { event.preventDefault(); return; }
      lastActivity.current = performance.now();
      inertia.current.reset();
      if (event.key === "Escape" && selected) {
        event.preventDefault();
        closeCollection();
        return;
      }
      if ((event.target as Element).closest("button, a")) return;
      const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[event.key];
      if (delta) {
        event.preventDefault();
        zoomAnchor.current = null;
        view.current.lon += delta[0];
        view.current.lat = THREE.MathUtils.clamp(view.current.lat + delta[1], -85, 85);
      }
      if (event.key === "+" || event.key === "-") {
        event.preventDefault();
        zoomAnchor.current = null;
        view.current.distance = THREE.MathUtils.clamp(view.current.distance * (event.key === "+" ? .85 : 1.15), EARTH_MIN_DISTANCE, EARTH_MAX_DISTANCE);
      }
    }}
    onPointerDown={event => {
      if (flight.current) return;
      lastActivity.current = performance.now();
      if ((event.target as Element).closest("button, a, aside")) return;
      inertia.current.reset();
      if (pointers.current.size === 0) Object.assign(view.current, renderedView.current);
      zoomAnchor.current = null;
      event.currentTarget.setAttribute("data-dragging", "true");
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY, time: event.timeStamp });
      setSelected(null);
      selectedId.current = null;
    }}
    onPointerMove={event => {
      lastActivity.current = performance.now();
      movePointer(event.pointerId, event.clientX, event.clientY, event.timeStamp);
    }}
    onPointerUp={event => {
      if (!pointers.current.has(event.pointerId)) return;
      if (pointers.current.size === 1) movePointer(event.pointerId, event.clientX, event.clientY, event.timeStamp);
      pointers.current.delete(event.pointerId);
      if (pointers.current.size === 0) {
        event.currentTarget.removeAttribute("data-dragging");
        inertia.current.release(event.timeStamp);
      } else inertia.current.reset();
    }}
    onPointerCancel={event => {
      if (pointers.current.delete(event.pointerId)) inertia.current.reset();
      if (!pointers.current.size) event.currentTarget.removeAttribute("data-dragging");
    }}
    onLostPointerCapture={event => {
      if (pointers.current.delete(event.pointerId)) inertia.current.reset();
      if (!pointers.current.size) event.currentTarget.removeAttribute("data-dragging");
    }}>
    <canvas ref={canvas} className="earth-canvas" aria-hidden="true" />
    <button type="button" className="earth-back" onClick={() => {
      if (flight.current?.kind === "leaving") return;
      const home = localizePath(locale, "");
      if (error || !stage.current?.hasAttribute("data-render-ready") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (canReturn.current) router.back();
        else router.push(home);
        return;
      }
      pointers.current.clear();
      zoomAnchor.current = null;
      flight.current = {
        kind: "leaving", from: { ...renderedView.current }, to: { ...renderedView.current },
        startedAt: performance.now(), duration: 360, href: home, back: canReturn.current,
      };
      setTransitionPhase("leaving");
    }}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m5-5-5 5 5 5" /></svg>
      {{ zh: "返回", en: "Back", es: "Volver", fr: "Retour", de: "Zurück", ja: "戻る", ko: "뒤로" }[locale]}
    </button>
    <div className="earth-orbit" aria-label={spaceLabel}>
      {spaceAlbums.map(album => <button type="button" hidden key={album.id} className="earth-orbit-card"
        ref={element => { if (element) orbitCards.current.set(album.id, element); else orbitCards.current.delete(album.id); }}
        aria-label={`${album.label} · ${album.count} ${zh ? "张壁纸" : "wallpapers"}`} aria-pressed={selected?.id === album.id}
        aria-controls={selected?.id === album.id ? "earth-collection" : undefined} onClick={() => choose(album)}>
        <span className="earth-orbit-cover"><Image src={album.images[0].image} alt="" width={256} height={176} sizes="(max-width:640px) 64px, 88px" draggable={false} /></span>
        <span className="earth-orbit-caption"><span>{album.label}</span><span>{album.count}</span></span>
      </button>)}
    </div>
    <div className="earth-locations">{albums.filter(a => a.coordinates).map(album => <button
      key={album.id} hidden ref={element => { if (element) markers.current.set(album.id, element); else markers.current.delete(album.id); }}
      className="earth-location" aria-label={`${album.label} · ${album.count} ${zh ? "张壁纸" : "wallpapers"}`}
      aria-pressed={selected?.id === album.id}
      aria-controls={selected?.id === album.id ? "earth-collection" : undefined}
      onClick={() => choose(album)}>
      <span className="earth-location-dot" />
      <span className="earth-location-cover" data-depth={album.count === 1 ? "single" : album.count < 10 ? "double" : "triple"}>
        {album.count >= 10 && album.images[2] && <span className="earth-location-stack earth-location-stack-back" aria-hidden="true">
          <Image src={resizeBingImage(album.images[2].image, 192, 136)} alt="" width={192} height={136} sizes="(max-width:640px) 80px, 96px" draggable={false} loading="lazy" />
        </span>}
        {album.count > 1 && album.images[1] && <span className="earth-location-stack earth-location-stack-middle" aria-hidden="true">
          <Image src={resizeBingImage(album.images[1].image, 192, 136)} alt="" width={192} height={136} sizes="(max-width:640px) 80px, 96px" draggable={false} loading="lazy" />
        </span>}
        <Image src={resizeBingImage(album.images[0].image, 192, 136)} alt="" width={192} height={136} sizes="(max-width:640px) 80px, 96px" draggable={false} />
        <span className="earth-location-count"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="2" width="9" height="9" rx="2"/>{album.count > 1 && <path d="M11 14H4a2 2 0 0 1-2-2V5"/>}</svg>{album.count}</span>
        <span className="earth-location-label">{album.label}</span>
      </span>
    </button>)}</div>
    {error && <button className="earth-retry" onClick={() => { setError(false); setRetry(n => n + 1); }}>{zh ? "地球加载失败，点击重试" : "Unable to load Earth. Retry"}</button>}
    {selected && <aside id="earth-collection" className="earth-album" aria-label={selected.label} key={selected.id}>
      <div className="earth-album-topbar">
        <span>{zh ? (!selected.coordinates ? "太空图集" : "地区图集") : "COLLECTION"}{selected.coordinates && <span className="earth-album-code">/ {selected.id}</span>}</span>
        <button className="earth-album-close" aria-label={zh ? "关闭图集" : "Close collection"} onClick={() => closeCollection()}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>
        </button>
      </div>
      <div className="earth-album-scroll">
        <Link className="earth-album-hero" href={selected.images[0].href}>
          <Image src={selected.images[0].image} alt={selected.images[0].title} width={720} height={480} sizes="(max-width: 640px) 90vw, 360px" />
          <span className="earth-album-hero-title">{selected.images[0].title}</span>
        </Link>
        <div className="earth-album-body">
          <div className="earth-album-heading"><h2>{selected.label}</h2><span>{selected.count.toLocaleString(locale)} {zh ? "张壁纸" : "wallpapers"}</span></div>
          {selected.images.length > 1 && <>
            <div className="earth-album-section-label"><span>{zh ? "近期收录" : "RECENT IMAGES"}</span></div>
            <div className="earth-album-images">{selected.images.slice(1).map((image, index) => <Link key={image.id} href={image.href} className="earth-album-tile">
              <span className="earth-album-tile-image"><Image src={image.image} alt="" width={320} height={210} sizes="(max-width: 640px) 44vw, 160px" loading="lazy" /><span aria-hidden="true">{String(index + 2).padStart(2, "0")}</span></span>
              <span className="earth-album-tile-title">{image.title}</span>
            </Link>)}</div>
          </>}
        </div>
      </div>
      <div className="earth-album-footer"><Link href={selected.href}>{zh ? `查看全部 ${selected.count.toLocaleString(locale)} 张` : `View all ${selected.count.toLocaleString(locale)} wallpapers`}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg></Link></div>
    </aside>}
  </main>;
}
