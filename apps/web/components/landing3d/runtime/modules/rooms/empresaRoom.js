import * as THREE from '../../vendor/three.module.js';
import geometry from '../../utils/geometry.js';
import { createSeatedPerson } from '../people/seatedPerson.js';

const { box, roundedBox } = geometry;

const P = {
  floor: 0xEEE9E2, rug: 0xD7E0E8, wood: 0xD8A170, woodDark: 0x9A6547,
  table: 0xF0C9A7, blue: 0x78B9D7, metal: 0x727A86, screen: 0xEAF6FA,
  green: 0x5C9A62, dark: 0x27313B, paper: 0xFAF7F0, skin: 0xDFAE86
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0
  });
}

function applyShadows(group) {
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function createOfficeChair(name) {
  const chair = new THREE.Group();
  chair.name = name;

  const seat = roundedBox(0.31, 0.07, 0.29, P.blue, { radius: 0.07, edges: false, roughness: 0.9 });
  seat.position.y = 0.29;
  chair.add(seat);

  const back = roundedBox(0.32, 0.34, 0.075, P.blue, { radius: 0.07, edges: false, roughness: 0.9 });
  back.position.set(0, 0.48, 0.13);
  back.rotation.x = -0.08;
  chair.add(back);

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.028, 0.22, 8),
    mat(P.metal, { roughness: 0.45, metalness: 0.35 })
  );
  column.position.y = 0.15;
  chair.add(column);

  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5;
    const arm = box(0.19, 0.022, 0.035, P.metal, { edges: false, roughness: 0.45, metalness: 0.35 });
    arm.position.set(Math.sin(angle) * 0.085, 0.045, Math.cos(angle) * 0.085);
    arm.rotation.y = angle;
    chair.add(arm);

    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(P.dark));
    wheel.position.set(Math.sin(angle) * 0.18, 0.025, Math.cos(angle) * 0.18);
    chair.add(wheel);
  }

  [-1, 1].forEach((side) => {
    const support = box(0.025, 0.18, 0.025, P.dark, { edges: false });
    support.position.set(side * 0.16, 0.39, 0.01);
    chair.add(support);
    const rest = roundedBox(0.055, 0.025, 0.22, P.dark, { radius: 0.02, edges: false });
    rest.position.set(side * 0.16, 0.48, -0.03);
    chair.add(rest);
  });

  return chair;
}

function faceCenter(group, x, z) {
  const directionX = -0.08 - x;
  const directionZ = 0.03 - z;
  group.rotation.y = Math.atan2(-directionX, -directionZ);
}

function createDevice(type, name) {
  const prop = new THREE.Group();
  prop.name = name;
  if (type === 'monitor') {
    const housing = roundedBox(0.29, 0.2, 0.025, 0xDFE5EA, { radius: 0.025, edges: false, roughness: 0.5 });
    housing.position.y = 0.13;
    prop.add(housing);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.245, 0.155), mat(P.screen, { roughness: 0.2 }));
    display.position.set(0, 0.13, -0.014);
    display.rotation.y = Math.PI;
    prop.add(display);
    const stand = box(0.035, 0.13, 0.03, 0x9AA1AA, { edges: false, metalness: 0.25 });
    stand.position.y = 0.02;
    prop.add(stand);
  } else if (type === 'laptop') {
    prop.add(roundedBox(0.25, 0.018, 0.17, 0xD5D9DE, { radius: 0.025, edges: false, roughness: 0.45 }));
    const screen = roundedBox(0.25, 0.16, 0.018, 0xE6EAEE, { radius: 0.022, edges: false, roughness: 0.45 });
    screen.position.set(0, 0.09, -0.075);
    screen.rotation.x = -0.18;
    prop.add(screen);
  } else {
    prop.add(roundedBox(0.2, 0.018, 0.15, P.dark, { radius: 0.025, edges: false, roughness: 0.35 }));
    const display = roundedBox(0.17, 0.006, 0.12, 0xC7E6ED, { radius: 0.018, edges: false, roughness: 0.25 });
    display.position.y = 0.012;
    prop.add(display);
  }
  return prop;
}

function createTableLamp(name) {
  const lamp = new THREE.Group();
  lamp.name = name;
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.025, 12), mat(0x78C9B6)));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.23, 8), mat(0xB3875E, { metalness: 0.25 }));
  stem.position.set(0.025, 0.11, 0);
  stem.rotation.z = -0.2;
  lamp.add(stem);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xE6A05D));
  shade.position.set(0.06, 0.22, 0);
  shade.rotation.z = -0.35;
  lamp.add(shade);
  return lamp;
}

function createCabinets() {
  const storage = new THREE.Group();
  storage.name = 'officeStorageWall';
  const openShelf = new THREE.Group();
  openShelf.name = 'officeOpenShelf';
  const back = roundedBox(0.62, 0.95, 0.12, P.wood, { radius: 0.07, edges: false, roughness: 0.9 });
  back.position.y = 0.475;
  openShelf.add(back);
  [-0.27, 0.27].forEach((x) => {
    const side = box(0.055, 0.88, 0.22, P.wood, { edges: false, roughness: 0.9 });
    side.position.set(x, 0.48, -0.07);
    openShelf.add(side);
  });
  [0.22, 0.5, 0.76].forEach((y) => {
    const shelf = box(0.56, 0.04, 0.22, P.woodDark, { edges: false, roughness: 0.88 });
    shelf.position.set(0, y, -0.07);
    openShelf.add(shelf);
  });
  [-0.18, -0.08, 0.09].forEach((x, index) => {
    const binder = roundedBox(0.07, 0.22, 0.14, [0x8CA0B4, 0x6F8A65, 0x9AA5B8][index], { radius: 0.015, edges: false });
    binder.position.set(x, 0.36, -0.17);
    openShelf.add(binder);
  });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.11, 16), mat(0x4F8059));
  bowl.position.set(0.08, 0.84, -0.15);
  openShelf.add(bowl);
  openShelf.position.set(0.55, 0, -0.62);
  storage.add(openShelf);

  const closed = new THREE.Group();
  closed.name = 'officeClosedCabinet';
  const body = roundedBox(0.48, 0.72, 0.3, 0xC78D62, { radius: 0.05, edges: false, roughness: 0.9 });
  body.position.y = 0.36;
  closed.add(body);
  [-0.115, 0.115].forEach((x, index) => {
    const door = roundedBox(0.215, 0.62, 0.025, 0xD7A477, { radius: 0.025, edges: false, roughness: 0.88 });
    door.position.set(x, 0.37, -0.165);
    closed.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(P.dark));
    knob.position.set(index === 0 ? -0.04 : 0.04, 0.37, -0.185);
    closed.add(knob);
  });
  closed.position.set(-0.05, 0, -0.72);
  storage.add(closed);
  return storage;
}

function createLargePlant() {
  const plant = new THREE.Group();
  plant.name = 'officeLargePlant';
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 14), mat(0xB88A66));
  pot.position.y = 0.15;
  plant.add(pot);
  for (let index = 0; index < 9; index += 1) {
    const angle = index * Math.PI * 2 / 9;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), mat(index % 2 ? 0x79AA72 : P.green));
    leaf.scale.set(0.58, 1.5, 0.42);
    leaf.rotation.z = Math.sin(angle) * 0.55;
    leaf.rotation.x = Math.cos(angle) * 0.55;
    leaf.position.set(Math.sin(angle) * 0.18, 0.43 + (index % 3) * 0.05, Math.cos(angle) * 0.18);
    plant.add(leaf);
  }
  return plant;
}

export function createEmpresaRoom() {
  const room = new THREE.Group();
  room.name = 'EmpresaRoom';
  const floor = roundedBox(1.9, 0.055, 1.9, P.floor, { radius: 0.14, edges: false, roughness: 0.96 });
  floor.name = 'officeFloor';
  floor.position.y = 0.025;
  room.add(floor);
  const rug = roundedBox(1.4, 0.012, 1.2, P.rug, { radius: 0.16, edges: false, roughness: 0.98 });
  rug.name = 'officeRug';
  rug.position.set(-0.05, 0.062, 0.06);
  room.add(rug, createCabinets());

  const servicePanel = roundedBox(0.72, 0.9, 0.08, P.blue, { radius: 0.1, edges: false, roughness: 0.88 });
  servicePanel.name = 'officeServicePanel';
  servicePanel.position.set(0.82, 0.52, 0.05);
  servicePanel.rotation.y = -Math.PI / 2;
  room.add(servicePanel);
  [-0.18, 0.18].forEach((z, index) => {
    const clock = new THREE.Group();
    clock.name = `officeWallClock${index}`;
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 18), mat(0xF5F2EC));
    face.rotation.z = Math.PI / 2;
    clock.add(face);
    const hand = box(0.008, 0.06, 0.008, P.dark, { edges: false });
    hand.rotation.x = index ? 0.6 : -0.4;
    clock.add(hand);
    clock.position.set(0.77, 0.73, z + 0.05);
    room.add(clock);
  });

  const table = new THREE.Group();
  table.name = 'officeCollaborationTable';
  const top = roundedBox(1.14, 0.075, 0.9, P.table, { radius: 0.12, edges: false, roughness: 0.78 });
  top.name = 'officeDeskMain';
  top.position.y = 0.51;
  table.add(top);
  [-0.43, 0.43].forEach((x) => [-0.32, 0.32].forEach((z) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.48, 10), mat(0xB68B71));
    leg.position.set(x, 0.25, z);
    table.add(leg);
  }));
  const seamX = box(0.012, 0.007, 0.8, 0xC89470, { edges: false });
  seamX.position.y = 0.553;
  const seamZ = box(1.04, 0.007, 0.012, 0xC89470, { edges: false });
  seamZ.position.y = 0.553;
  table.add(seamX, seamZ);
  table.position.set(-0.08, 0, 0.03);
  room.add(table);

  [
    ['monitor', 'officeMonitorMain', -0.35, -0.1, Math.PI],
    ['laptop', 'officeLaptop', 0.2, 0.18, 0],
    ['tablet', 'officeTablet', -0.43, 0.23, -0.2]
  ].forEach(([type, name, x, z, rotation]) => {
    const device = createDevice(type, name);
    device.position.set(x, 0.56, z);
    device.rotation.y = rotation;
    room.add(device);
  });

  const keyboard = roundedBox(0.26, 0.018, 0.1, 0xE5E3DF, { radius: 0.02, edges: false, roughness: 0.65 });
  keyboard.name = 'officeKeyboard';
  keyboard.position.set(-0.08, 0.565, 0.35);
  room.add(keyboard);
  const paper = roundedBox(0.23, 0.009, 0.17, P.paper, { radius: 0.012, edges: false, roughness: 0.95 });
  paper.name = 'officeDocuments';
  paper.position.set(0.11, 0.566, -0.25);
  paper.rotation.y = 0.15;
  room.add(paper);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.075, 10), mat(0xC18A58));
  mug.name = 'officeMug';
  mug.position.set(-0.39, 0.6, -0.26);
  room.add(mug);

  const deskPlant = new THREE.Group();
  deskPlant.name = 'officeDeskPlant';
  const deskPot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.08, 10), mat(0xE17843));
  deskPot.position.y = 0.04;
  deskPlant.add(deskPot);
  [-0.05, 0, 0.05].forEach((x, index) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(P.green));
    leaf.scale.y = 1.7;
    leaf.position.set(x, 0.11 + index * 0.012, 0);
    leaf.rotation.z = x * 7;
    deskPlant.add(leaf);
  });
  deskPlant.position.set(0.01, 0.56, 0.04);
  room.add(deskPlant);
  const lampLeft = createTableLamp('officeTableLampLeft');
  lampLeft.position.set(-0.46, 0.56, -0.06);
  lampLeft.scale.setScalar(0.72);
  room.add(lampLeft);
  const lampRight = createTableLamp('officeTableLampRight');
  lampRight.position.set(0.34, 0.56, 0.31);
  lampRight.rotation.y = Math.PI;
  lampRight.scale.setScalar(0.72);
  room.add(lampRight);

  const seating = [
    { x: -0.12, z: 0.72, shirt: 0x3E78B4, hair: 0x1E2933 },
    { x: -0.68, z: -0.03, shirt: 0x4E9A6E, hair: 0x4A3025 },
    { x: 0.42, z: -0.62, shirt: 0xE88646, hair: 0xA84F35 }
  ];
  seating.forEach((item, index) => {
    const chair = createOfficeChair(`officeChair${index}`);
    chair.position.set(item.x, 0.06, item.z);
    faceCenter(chair, item.x, item.z);
    chair.scale.setScalar(0.9);
    room.add(chair);
    const employee = createSeatedPerson({
      name: `officeEmployee${index}`,
      shirtColor: item.shirt,
      hairColor: item.hair,
      skinColor: item.skin ?? P.skin,
      role: 'employee'
    });
    employee.position.set(item.x, 0.035, item.z);
    faceCenter(employee, item.x, item.z);
    employee.scale.setScalar(0.96);
    room.add(employee);
  });

  const largePlant = createLargePlant();
  largePlant.position.set(-0.75, 0, -0.72);
  largePlant.scale.setScalar(0.82);
  room.add(largePlant);
  applyShadows(room);
  return room;
}

