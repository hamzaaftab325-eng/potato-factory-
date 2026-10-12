import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { bagGeometry, chipGeometry } from "../factory/geometry.js";
import { createBagMaterials } from "../factory/packaging.js";
import { createProductPacket } from "../factory/product-packet.js";
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
  camera.position.set(0.12, 0.18, 2.95);
  camera.lookAt(0, -0.01, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.05);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#fff3db", "#173936", 0.85));
  const key = new THREE.DirectionalLight("#fff0d5", 2.8);
  key.position.set(-2, 3, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
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

  const paperCanvas = document.createElement("canvas");
  paperCanvas.width = paperCanvas.height = 128;
  const ctx = paperCanvas.getContext("2d");
  ctx.fillStyle = "#bdb6a4";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#d5cfbf";
  for (let y = 0; y < 128; y += 3)
    for (let x = (y % 2) * 2; x < 128; x += 5) ctx.fillRect(x, y, 1, 1);
  const paper = new THREE.CanvasTexture(paperCanvas);
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
  const materials = createBagMaterials(
    0,
    { paper },
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
    raf = 0,
    last = -Infinity;
  const draw = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  chipMaterial.normalMap = textures.load(chipNormal, draw);
  chipMaterial.normalScale = new THREE.Vector2(0.32, 0.32);
  chipMaterial.roughnessMap = textures.load(chipRoughness, draw);
  const chips = [];
  for (let i = 0; i < 3; i++) {
    const chip = new THREE.Mesh(chipGeometry(i + 1), chipMaterial);
    chip.scale.setScalar(0.55);
    chip.position.set(0.27 + i * 0.087, -0.475 + i * 0.045, 0.23 + i * 0.037);
    chip.rotation.set(-1.1 + i * 0.15, 0.12, -0.42 + i * 0.38);
    chip.castShadow = true;
    scene.add(chip);
    chips.push(chip);
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
    if (time - last < 1000 / 24) return;
    last = time;
    const t = time / 1000;
    packet.position.y = 0.025 + 0.006 * Math.sin(t * 1.1);
    packet.rotation.y = -0.14 + 0.055 * Math.sin(t * 0.7);
    packet.rotation.z = -0.07 + 0.008 * Math.sin(t * 0.9);
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
        ownedTextures = new Set([paper]);
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
