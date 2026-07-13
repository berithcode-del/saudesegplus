import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';

const { SKIN, box } = geometry;

function cornerRoom(building, cx, cy, cz, faceAngle, color, deskColor){
  const g = new THREE.Group();
  const floorPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.05, 20),
    new THREE.MeshStandardMaterial({ color: 0xF6F4EE, roughness: 0.9 })
  );
  floorPad.position.y = 0.025;
  g.add(floorPad);

  const desk = box(0.5, 0.28, 0.3, deskColor, { edges: false, roughness: 0.55 });
  desk.position.set(0.02, 0.16, -0.08);
  g.add(desk);

  const monitor = box(0.26, 0.19, 0.025, 0x22233A, { edges: false, metalness: 0.2 });
  monitor.position.set(0.02, 0.38, -0.2);
  g.add(monitor);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.13),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9 })
  );
  screen.position.set(0.02, 0.38, -0.188);
  g.add(screen);

  const chair = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.1, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0x3A3A4A, roughness: 0.7 })
  );
  chair.position.set(0.02, 0.11, 0.26);
  g.add(chair);

  const shelf = box(0.4, 0.04, 0.12, 0xB0B0C0, { edges: false, roughness: 0.7 });
  shelf.position.set(0, 0.55, -0.32);
  g.add(shelf);

  const itemColors = [color, 0xDDDDD0, 0xCCCCCC];
  itemColors.forEach((c, i) => {
    const item = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.08 + i * 0.01, 0.1),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })
    );
    item.position.set(-0.12 + i * 0.08, 0.61, -0.32);
    g.add(item);
  });

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.02, 0.035, 8),
    new THREE.MeshStandardMaterial({ color: 0xE8D8C8, roughness: 0.5 })
  );
  mug.position.set(0.18, 0.31, -0.05);
  g.add(mug);

  g.add((function(){
    const p = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 0.24, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    body.position.y = 0.26;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7 })
    );
    head.position.y = 0.44;
    p.add(body, head);
    p.position.set(0.02, 0, 0.24);
    return p;
  })());

  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.08, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFFFEE, emissive: 0xFFFFAA, emissiveIntensity: 0.6 })
  );
  lamp.position.set(0, 1.0, 0);
  g.add(lamp);

  const glow = new THREE.PointLight(color, 1.0, 2.6);
  glow.position.set(0, 0.5, 0);
  g.add(glow);

  g.position.set(cx, cy, cz);
  g.rotation.y = faceAngle;
  g.scale.setScalar(0.0001);
  building.add(g);
  return g;
}

function createCornerRooms(building){
  const roomEmpresa = cornerRoom(building, 1.4, 0.05, 1.4, -Math.PI * 0.75, 0x4F46E5, 0xDCE0FA);
  const roomMedico = cornerRoom(building, -1.15, 2.55, 1.15, Math.PI * 0.75, 0x16A34A, 0xDDF3E4);
  const roomClinica = cornerRoom(building, -1.0, 4.99, -1.0, Math.PI * 0.25, 0xF59E0B, 0xFBEBD2);

  return [
    { mesh: roomEmpresa, idx: 1 },
    { mesh: roomMedico, idx: 2 },
    { mesh: roomClinica, idx: 3 }
  ];
}

export default createCornerRooms;
