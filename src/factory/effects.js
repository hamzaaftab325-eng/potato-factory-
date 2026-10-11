import * as THREE from "three";

// Code-built moisture vapour: soft translucent billboards fade before reaching
// the hood. Particle lifetimes divide the sixteen-second machine loop.
export function addFryingEffects(scene, random, mobile = false) {
  const group = new THREE.Group();
  group.name = "fryer vapour and oil convection";
  scene.add(group);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const paint = canvas.getContext("2d");
  for (let i = 0; i < 90; i++) {
    const x = 64 + random() * 128,
      y = 64 + random() * 128,
      r = 20 + random() * 54;
    const gradient = paint.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "rgba(255,255,255,.045)");
    gradient.addColorStop(0.4, "rgba(255,255,255,.025)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    paint.fillStyle = gradient;
    paint.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const mist = new THREE.CanvasTexture(canvas);
  const count = mobile ? 40 : 80;
  const opacity = new THREE.InstancedBufferAttribute(
    new Float32Array(count),
    1,
  );
  opacity.setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.setAttribute("vapourOpacity", opacity);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      mist: { value: mist },
      tint: { value: new THREE.Color("#e5e9dc") },
    },
    vertexShader: `attribute float vapourOpacity; varying vec2 vUv; varying float vOpacity;
      void main(){vUv=uv;vOpacity=vapourOpacity;
      gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D mist;uniform vec3 tint;varying vec2 vUv;varying float vOpacity;
      void main(){float a=texture2D(mist,vUv).a*vOpacity;if(a<.001)discard;
      gl_FragColor=vec4(tint,a);}`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const steam = new THREE.InstancedMesh(geometry, material, count);
  steam.frustumCulled = false;
  steam.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  steam.renderOrder = 4;
  group.add(steam);
  const seeds = Array.from({ length: count }, (_, i) => ({
    phase: random(),
    x: -2.25 + random() * 3.55,
    z: 0.35 + random() * 0.45,
    drift: (random() - 0.5) * 0.23,
    size: 0.22 + random() * 0.3,
    chimney: i % 8 === 0,
    period: i % 2 ? 8 : 4,
  }));
  const rings = new THREE.InstancedMesh(
    new THREE.RingGeometry(0.009, 0.012, 16),
    new THREE.MeshBasicMaterial({
      color: "#f3d99b",
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    mobile ? 36 : 72,
  );
  rings.frustumCulled = false;
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(rings);
  const ringSeeds = Array.from({ length: rings.count }, () => ({
    x: -2.45 + random() * 3.95,
    z: (random() - 0.5) * 1.7,
    phase: random(),
  }));
  const glow = new THREE.PointLight("#ffd28a", 0.36, 3.0, 2);
  glow.position.set(-0.5, 2.18, 0.2);
  group.add(glow);
  const dummy = new THREE.Object3D(),
    spin = new THREE.Quaternion();
  const normal = new THREE.Vector3(0, 0, 1);
  return {
    group,
    dispose() {
      mist.dispose();
    },
    update(time, camera) {
      for (let i = 0; i < count; i++) {
        const s = seeds[i],
          life = (time / s.period + s.phase) % 1;
        const envelope = Math.sin(life * Math.PI) ** 2;
        if (s.chimney)
          dummy.position.set(
            -0.5 + life * 0.28 + Math.sin(life * 5 + s.phase) * 0.08,
            7.28 + life * 1.65,
            -2 + life * 0.16,
          );
        else
          dummy.position.set(
            s.x + s.drift * life + Math.sin(life * 6 + s.phase) * 0.025,
            1.67 + life * 0.95,
            s.z + life * 0.16,
          );
        dummy.quaternion
          .copy(camera.quaternion)
          .multiply(
            spin.setFromAxisAngle(normal, s.phase * 6.28 + life * 0.22),
          );
        const size = s.size * (0.65 + life * 1.5) * (s.chimney ? 1.5 : 1);
        dummy.scale.set(size, size * (1.1 + life * 0.25), 1);
        dummy.updateMatrix();
        steam.setMatrixAt(i, dummy.matrix);
        opacity.setX(i, envelope * (s.chimney ? 0.34 : 0.26));
      }
      steam.instanceMatrix.needsUpdate = true;
      opacity.needsUpdate = true;
      for (let i = 0; i < rings.count; i++) {
        const s = ringSeeds[i],
          age = (time / 2 + s.phase) % 1;
        dummy.position.set(s.x, 1.542, s.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        const size = Math.sin(age * Math.PI) * (1 + age * 1.8);
        dummy.scale.set(size, size, 1);
        dummy.updateMatrix();
        rings.setMatrixAt(i, dummy.matrix);
      }
      rings.instanceMatrix.needsUpdate = true;
      glow.intensity = 0.36 + 0.02 * Math.sin((time * Math.PI) / 2);
    },
  };
}
