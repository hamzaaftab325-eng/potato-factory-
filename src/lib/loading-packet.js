import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { bagGeometry, chipGeometry } from "../factory/geometry.js";
import { createBagMaterials } from "../factory/packaging.js";
import { createProductPacket } from "../factory/product-packet.js";
import { FrameClock } from "../factory/frame-clock.js";
import chipNormal from "../factory/generated/chip-normal.png";
import chipRoughness from "../factory/generated/chip-roughness.png";

export function createPacketLoader(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(2.5, Math.max(2, window.devicePixelRatio || 1)),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
  camera.position.set(0.12, 0.18, 2.95);
  camera.lookAt(0, -0.01, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.05);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.8;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#fff3db", "#173936", 0.85));
  const key = new THREE.DirectionalLight("#fff0d5", 2.8);
  key.position.set(-2, 3, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    near: 0.1,
    far: 8,
  });
  key.shadow.normalBias = 0.012;
  key.shadow.bias = -0.0002;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#d4e9e6", 1.15);
  fill.position.set(2, 1, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight("#ffe3a2", 0.65);
  rim.position.set(1, 2, -2);
  scene.add(rim);

  const materials = createBagMaterials(
    0,
    Math.min(8, renderer.capabilities.getMaxAnisotropy()),
  );
  const packet = createProductPacket({ geometry: bagGeometry(), materials });
  packet.position.y = 0.025;
  scene.add(packet);

  const chipMaterial = new THREE.MeshStandardMaterial({
    color: "#efd08a",
    vertexColors: true,
    metalness: 0,
    roughness: 0.6,
  });
  const textures = new THREE.TextureLoader();
  let paused = reducedMotion,
    disposed = false,
    raf = 0;
  const frameClock = new FrameClock();
  let lastShadow = -Infinity;
  const draw = () => {
    if (disposed) return;
    const now = performance.now();
    if (now - lastShadow >= 1000 / 30) {
      renderer.shadowMap.needsUpdate = true;
      lastShadow = now;
    }
    renderer.render(scene, camera);
  };
  chipMaterial.normalMap = textures.load(chipNormal, draw);
  chipMaterial.normalScale = new THREE.Vector2(0.32, 0.32);
  chipMaterial.roughnessMap = textures.load(chipRoughness, draw);
  const chips = [];
  const motionClock = new THREE.Clock();
  for (let i = 0; i < 3; i++) {
    const chip = new THREE.Mesh(chipGeometry(i + 1), chipMaterial);
    chip.scale.setScalar(0.55);
    chip.position.set(
      ...[
        [-0.43, -0.18, 0.18],
        [0.43, -0.32, 0.25],
        [0.36, 0.41, 0.12],
      ][i],
    );
    chip.rotation.set(-1.1 + i * 0.15, 0.12, -0.42 + i * 0.38);
    chip.castShadow = true;
    scene.add(chip);
    chips.push({
      chip,
      x: chip.position.x,
      y: chip.position.y,
      z: chip.position.z,
      angle: chip.rotation.z,
    });
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.ShadowMaterial({ opacity: 0.23 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.525;
  floor.receiveShadow = true;
  scene.add(floor);
  function resize() {
    if (disposed) return;
    const width = Math.max(1, canvas.clientWidth || 360);
    const height = Math.max(1, canvas.clientHeight || 360);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  canvas.classList.add("is-ready");
  function frame(time) {
    if (disposed || paused) return;
    raf = requestAnimationFrame(frame);
    if (!frameClock.due(time / 1000, 60)) return;
    const t = motionClock.getElapsedTime();
    packet.position.y = 0.025 + 0.018 * Math.sin(t * 1.3);
    packet.rotation.y = -0.14 + 0.18 * Math.sin(t * 0.9);
    packet.rotation.x = -0.03 + 0.035 * Math.sin(t * 0.8);
    packet.rotation.z = -0.07 + 0.022 * Math.sin(t * 1.1);
    chips.forEach(({ chip, x, y, z, angle }, i) => {
      const phase = t * 0.85 + i * 2.1;
      chip.position.set(
        x + 0.035 * Math.sin(phase),
        y + 0.025 * Math.cos(phase),
        z + 0.02 * Math.sin(phase),
      );
      chip.rotation.z = angle + 0.16 * Math.sin(phase);
      chip.rotation.y = 0.12 + 0.13 * Math.cos(phase);
    });
    draw();
  }
  if (!paused) raf = requestAnimationFrame(frame);
  return {
    pause() {
      paused = true;
      cancelAnimationFrame(raf);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      const geometries = new Set(),
        ownedMaterials = new Set(),
        ownedTextures = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        for (const material of [o.material].flat().filter(Boolean)) {
          ownedMaterials.add(material);
          for (const value of Object.values(material))
            if (value?.isTexture) ownedTextures.add(value);
        }
      });
      geometries.forEach((g) => g.dispose());
      ownedMaterials.forEach((m) => m.dispose());
      ownedTextures.forEach((t) => t.dispose());
      key.shadow.map?.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
