import * as THREE from "three";

// One product pose serves both Pick your pack and the opening experience.
export function createProductPacket({ geometry, materials, scale = 1 }) {
  const packet = new THREE.Mesh(geometry, materials);
  packet.scale.setScalar(scale);
  packet.rotation.set(-0.03, -0.14, -0.07);
  packet.castShadow = true;
  packet.receiveShadow = true;
  return packet;
}
