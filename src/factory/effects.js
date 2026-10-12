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
    cooling: i % 8 === 3,
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
  const frustum = new THREE.Frustum(),
    view = new THREE.Matrix4();
  const bounds = new THREE.Box3(
    new THREE.Vector3(-2.9, 1.3, -2.4),
    new THREE.Vector3(3.4, 9.5, 1.3),
  );
  return {
    group,
    dispose() {
      mist.dispose();
    },
    update(time, camera) {
      frustum.setFromProjectionMatrix(
        view.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse,
        ),
      );
      group.visible = frustum.intersectsBox(bounds);
      if (!group.visible) return;
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
        else if (s.cooling)
          dummy.position.set(
            2.0 + s.phase * 0.85 + life * 0.14,
            1.9 + life * 0.63,
            (s.phase - 0.5) * 1.1,
          );
        else
          dummy.position.set(
            s.x + s.drift * life + Math.sin(life * 6 + s.phase) * 0.025,
            1.67 + life * 0.95,
            s.z * (1 - life * 0.72) - life * 0.2,
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
        opacity.setX(
          i,
          envelope * (s.chimney ? 0.34 : s.cooling ? 0.13 : 0.26),
        );
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

// Bounded, instanced accents follow the actual fluid/waste/product paths. No
// full-screen effects or extra shadow-casting lights are needed for these.
export function addProcessEffects(scene, random, mobile = false) {
  const group = new THREE.Group();
  group.name = "wash, peel, rinse and packing process accents";
  scene.add(group);
  const jobs = [],
    dummy = new THREE.Object3D();
  const frustum = new THREE.Frustum(),
    view = new THREE.Matrix4();
  const bind = (mesh, low, high, animate) => {
    mesh.castShadow = mesh.receiveShadow = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);
    jobs.push({
      mesh,
      bounds: new THREE.Box3(
        new THREE.Vector3(...low),
        new THREE.Vector3(...high),
      ),
      animate,
    });
  };
  const jetSeeds = [];
  for (const x of [-11.17, -10.69, -10.21, -9.73, -9.25, -8.61, -8.03, -7.45])
    for (const z of [-0.42, 0, 0.42])
      jetSeeds.push({ x, y: x < -9 ? 2.12 : 2.2, z });
  for (const z of [-0.36, 0, 0.36]) jetSeeds.push({ x: -3.85, y: 1.82, z });
  const jets = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 6),
    new THREE.MeshBasicMaterial({
      color: "#bfece6",
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
    jetSeeds.length,
  );
  bind(jets, [-11.5, 1.2, -0.6], [-3.4, 2.4, 0.6], (time) => {
    jetSeeds.forEach((s, i) => {
      const length = s.x < -7 ? 0.46 : 0.38;
      dummy.position.set(s.x, s.y - length / 2, s.z);
      dummy.rotation.set(0, 0, Math.sin(time * Math.PI + i) * 0.006);
      const width = 0.0045 + 0.001 * Math.sin(time * Math.PI * 2 + i);
      dummy.scale.set(width, length, width);
      dummy.updateMatrix();
      jets.setMatrixAt(i, dummy.matrix);
    });
  });
  const rippleSeeds = Array.from({ length: mobile ? 16 : 32 }, () => ({
    x: -11.25 + random() * 2.06,
    z: (random() - 0.5) * 1.15,
    phase: random(),
  }));
  const ripples = new THREE.InstancedMesh(
    new THREE.RingGeometry(0.026, 0.029, 16),
    new THREE.MeshBasicMaterial({
      color: "#c8e7dc",
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    rippleSeeds.length,
  );
  bind(ripples, [-11.4, 1.55, -0.7], [-9, 1.7, 0.7], (time) => {
    rippleSeeds.forEach((s, i) => {
      const age = (time / 2 + s.phase) % 1;
      dummy.position.set(s.x, 1.586, s.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      const size = Math.sin(age * Math.PI) * (1 + age * 1.5);
      dummy.scale.set(size, size, 1);
      dummy.updateMatrix();
      ripples.setMatrixAt(i, dummy.matrix);
    });
  });
  const peel = new THREE.BufferGeometry();
  peel.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.025, 0, -0.009, 0.019, 0, -0.008, -0.02, 0.003, 0.012, 0.019, 0,
        -0.008, 0.026, 0.006, 0.008, -0.02, 0.003, 0.012,
      ],
      3,
    ),
  );
  peel.computeVertexNormals();
  const flakes = new THREE.InstancedMesh(
    peel,
    new THREE.MeshStandardMaterial({
      color: "#ac8655",
      roughness: 0.95,
      side: THREE.DoubleSide,
    }),
    mobile ? 20 : 40,
  );
  bind(flakes, [-8.95, 0.7, -1.55], [-7.85, 1.01, -0.95], (time) => {
    for (let i = 0; i < flakes.count; i++) {
      const age = (time / 2 + i * 0.618) % 1;
      dummy.position.set(
        -8.02 - age * 0.8,
        0.99 - 0.18 * age * age,
        -1.08 - age * 0.2 + Math.sin(i * 2.9) * 0.09,
      );
      dummy.rotation.set(age * 2, i * 2.3, age * 3 + i);
      dummy.scale.setScalar(0.7 + (i % 5) * 0.12);
      dummy.updateMatrix();
      flakes.setMatrixAt(i, dummy.matrix);
    }
  });
  const checkpoints = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.022, 8, 6),
    new THREE.MeshBasicMaterial({ color: "#73e8bb", toneMapped: false }),
    3,
  );
  bind(checkpoints, [11.7, 1.1, -2.6], [12.5, 1.6, 2.6], (time) => {
    for (let i = 0; i < 3; i++) {
      const phase = (time / 2 + i / 3) % 1;
      dummy.position.set(12.1, 1.25, (i - 1) * 2.25 + 0.44);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(phase < 0.22 ? 1 : 0.35);
      dummy.updateMatrix();
      checkpoints.setMatrixAt(i, dummy.matrix);
    }
  });
  return {
    group,
    dispose() {},
    update(time, camera) {
      frustum.setFromProjectionMatrix(
        view.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse,
        ),
      );
      for (const job of jobs) {
        job.mesh.visible = frustum.intersectsBox(job.bounds);
        if (!job.mesh.visible) continue;
        job.animate(time);
        job.mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
