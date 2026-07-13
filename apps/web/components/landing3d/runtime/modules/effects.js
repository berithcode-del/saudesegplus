import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';

const { COL } = geometry;

function createEffects(building){
  const ringGroup = new THREE.Group();
  building.add(ringGroup);
  const ringDefs = [
    { r: 7.6, tilt: 0.15, color: COL.accent },
    { r: 8.6, tilt: -0.22, color: COL.accentSoft },
    { r: 9.6, tilt: 0.30, color: COL.warm }
  ];
  const rings = ringDefs.map(d => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, 0.035, 8, 80),
      new THREE.MeshStandardMaterial({
        color: d.color,
        emissive: d.color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0
      })
    );
    ring.rotation.x = Math.PI / 2 + d.tilt;
    ring.position.y = 3.6;
    ringGroup.add(ring);
    return ring;
  });

  return { rings };
}

export default createEffects;

