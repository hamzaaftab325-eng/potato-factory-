// Tangent-continuous paths with explicit turning radii and true distance.
// Vehicle headings and steering follow the same centreline as their wheels.
export function line(a, b) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    length = Math.hypot(dx, dz);
  return {
    length,
    pose(distance, point, tangent) {
      const u = distance / length;
      point.set(a[0] + dx * u, 0, a[1] + dz * u);
      tangent.set(dx / length, 0, dz / length);
      return 0;
    },
  };
}
export function arc(center, radius, start, end) {
  const direction = Math.sign(end - start),
    length = Math.abs(end - start) * radius;
  return {
    length,
    pose(distance, point, tangent) {
      const angle = start + (direction * distance) / radius;
      point.set(
        center[0] + radius * Math.cos(angle),
        0,
        center[1] + radius * Math.sin(angle),
      );
      tangent.set(-Math.sin(angle) * direction, 0, Math.cos(angle) * direction);
      return direction / radius;
    },
  };
}
export function path(...segments) {
  const length = segments.reduce((sum, segment) => sum + segment.length, 0);
  return {
    length,
    pose(u, point, tangent) {
      let distance = Math.max(0, Math.min(1, u)) * length;
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (distance <= segment.length || i === segments.length - 1)
          return segment.pose(
            Math.min(distance, segment.length),
            point,
            tangent,
          );
        distance -= segment.length;
      }
    },
  };
}
export function laneShift(startX, offsetZ, direction = 1, radius = 8) {
  const angle = Math.acos(1 - offsetZ / (2 * radius));
  const length = radius * angle * 2,
    shiftX = 2 * radius * Math.sin(angle);
  return {
    length,
    endX: startX + direction * shiftX,
    pose(distance, point, tangent) {
      const half = distance <= length / 2;
      const theta = half ? distance / radius : (length - distance) / radius;
      const dx = half
        ? radius * Math.sin(theta)
        : shiftX - radius * Math.sin(theta);
      const z = half
        ? radius * (1 - Math.cos(theta))
        : radius * (1 + Math.cos(theta) - 2 * Math.cos(angle));
      point.set(startX + direction * dx, 0, z);
      tangent.set(direction * Math.cos(theta), 0, Math.sin(theta));
      // Three.js positive yaw points +X towards -Z.
      return ((half ? 1 : -1) * direction) / radius;
    },
  };
}
