import * as THREE from "three";

// The same slice changes shape and colour while travelling through the oil.
// Cooking is an instance attribute, so hundreds of chips remain one draw call.
export function cookingMaterial(base) {
  const material = base.clone();
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 rawPosition;
      attribute vec3 rawNormal;
      attribute float cooking;
      varying float vCooking;
      ${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
       objectNormal = normalize(mix(rawNormal, objectNormal, cooking));`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
       transformed = mix(rawPosition, transformed, cooking);
       vCooking = cooking;`,
      );
    shader.fragmentShader = `varying float vCooking;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       diffuseColor.rgb = mix(vec3(0.88, 0.78, 0.56), diffuseColor.rgb, smoothstep(0.0, 0.85, vCooking));`,
    );
  };
  material.customProgramCacheKey = () => "crisp-python-chip-cooking-v1";
  return material;
}

export function cookingAttribute(geometry, count) {
  // Do not attach per-batch data to a shared geometry.
  const copy = geometry.clone();
  const cooking = new THREE.InstancedBufferAttribute(
    new Float32Array(count),
    1,
  );
  cooking.setUsage(THREE.DynamicDrawUsage);
  copy.setAttribute("cooking", cooking);
  return { geometry: copy, cooking };
}

export function peelingMaterial(skin) {
  const material = skin.clone();
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float cooking; varying float vPeeling;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvPeeling=cooking;",
    );
    shader.fragmentShader = `varying float vPeeling;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      "#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.85,.77,.59),vPeeling);",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      "#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.38,vPeeling);",
    );
  };
  material.customProgramCacheKey = () => "crisp-roller-peeling-v1";
  return material;
}
