import * as THREE from '../../vendor/three.module.js';
import geometry from '../../utils/geometry.js';

const { box, roundedBox } = geometry;

const P = {
  floor: 0xE9E2D9,
  rug: 0xDCE5E7,
  desk: 0xE8BE96,
  bed: 0xE6BFA0,
  blue: 0x4E83B5,
  blueLight: 0x83B8D4,
  white: 0xF4F1EB,
  metal: 0x929BA7,
  dark: 0x29323A,
  skin: 0xDDA77F,
  green: 0x629B67
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

function cylinderBetween(start, end, radius, limbMaterial) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.04, direction.length(), 9),
    limbMaterial
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function createFace(group, y, skin, hair) {
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), skin);
  head.position.y = y;
  group.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.119, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hair
  );
  hairCap.position.y = y + 0.01;
  group.add(hairCap);
  [-0.04, 0.04].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 7, 5), mat(0x211D1C));
    eye.position.set(x, y + 0.01, -0.105);
    group.add(eye);
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 12, Math.PI), mat(0x74473D));
  smile.position.set(0, y - 0.035, -0.108);
  smile.rotation.z = Math.PI;
  group.add(smile);
}

function createOfficeChair(name, color = P.blueLight) {
  const chair = new THREE.Group();
  chair.name = name;
  const seat = roundedBox(0.3, 0.07, 0.28, color, { radius: 0.07, edges: false, roughness: 0.9 });
  seat.position.y = 0.31;
  chair.add(seat);
  const back = roundedBox(0.31, 0.34, 0.075, color, { radius: 0.07, edges: false, roughness: 0.9 });
  back.position.set(0, 0.5, 0.13);
  chair.add(back);
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.028, 0.24, 8),
    mat(P.metal, { roughness: 0.42, metalness: 0.4 })
  );
  column.position.y = 0.17;
  chair.add(column);
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5;
    const arm = box(0.18, 0.02, 0.032, P.metal, { edges: false, metalness: 0.35 });
    arm.position.set(Math.sin(angle) * 0.08, 0.055, Math.cos(angle) * 0.08);
    arm.rotation.y = angle;
    chair.add(arm);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), mat(P.dark));
    wheel.position.set(Math.sin(angle) * 0.17, 0.035, Math.cos(angle) * 0.17);
    chair.add(wheel);
  }
  return chair;
}

function createSeatedDoctor() {
  const doctor = new THREE.Group();
  doctor.name = 'seatedDoctor';
  const skin = mat(P.skin, { roughness: 0.88 });
  const coat = mat(P.white, { roughness: 0.9 });
  const shirt = mat(0x376B96, { roughness: 0.88 });
  const hair = mat(0x4B342B, { roughness: 0.92 });
  const trousers = mat(0x40536B, { roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.145, 0.3, 12), coat);
  torso.position.y = 0.54;
  doctor.add(torso);
  const shirtPanel = roundedBox(0.08, 0.22, 0.025, 0x376B96, { radius: 0.015, edges: false });
  shirtPanel.position.set(0, 0.55, -0.13);
  doctor.add(shirtPanel);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.07, 9), skin);
  neck.position.y = 0.71;
  doctor.add(neck);
  createFace(doctor, 0.8, skin, hair);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(side * 0.115, 0.62, -0.02);
    const elbow = new THREE.Vector3(side * 0.17, 0.54, -0.11);
    const wrist = new THREE.Vector3(side * 0.14, 0.56, -0.25);
    doctor.add(cylinderBetween(shoulder, elbow, 0.038, coat));
    doctor.add(cylinderBetween(elbow, wrist, 0.03, skin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), skin);
    hand.position.copy(wrist);
    hand.scale.set(1.15, 0.65, 1.25);
    doctor.add(hand);

    const hip = new THREE.Vector3(side * 0.07, 0.4, 0.02);
    const knee = new THREE.Vector3(side * 0.075, 0.26, -0.12);
    const ankle = new THREE.Vector3(side * 0.075, 0.1, -0.16);
    doctor.add(cylinderBetween(hip, knee, 0.045, trousers));
    doctor.add(cylinderBetween(knee, ankle, 0.04, trousers));
    const shoe = roundedBox(0.08, 0.045, 0.14, 0x5B4238, { radius: 0.025, edges: false });
    shoe.position.set(side * 0.075, 0.06, -0.205);
    doctor.add(shoe);
  });

  const badge = roundedBox(0.04, 0.055, 0.01, 0xC7E7F1, { radius: 0.008, edges: false });
  badge.position.set(0.075, 0.61, -0.14);
  doctor.add(badge);
  return doctor;
}

function createPatient() {
  const patient = new THREE.Group();
  patient.name = 'examPatient';
  const skin = mat(0xC98F6B, { roughness: 0.88 });
  const shirt = mat(0x3977B5, { roughness: 0.9 });
  const trousers = mat(0xAEB5BE, { roughness: 0.92 });
  const hair = mat(0x2D3035, { roughness: 0.92 });

  const torso = roundedBox(0.38, 0.15, 0.25, 0x3977B5, { radius: 0.07, edges: false, roughness: 0.9 });
  torso.position.set(-0.07, 0.55, 0);
  patient.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 15, 11), skin);
  head.position.set(-0.34, 0.57, 0);
  patient.add(head);
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.109, 14, 8, Math.PI / 2, Math.PI, 0, Math.PI / 1.7),
    hair
  );
  hairCap.position.set(-0.35, 0.59, 0);
  hairCap.rotation.z = -Math.PI / 2;
  patient.add(hairCap);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(-0.18, 0.55, side * 0.13);
    const elbow = new THREE.Vector3(-0.02, 0.52, side * 0.18);
    const wrist = new THREE.Vector3(0.11, 0.5, side * 0.18);
    patient.add(cylinderBetween(shoulder, elbow, 0.035, shirt));
    patient.add(cylinderBetween(elbow, wrist, 0.028, skin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), skin);
    hand.position.copy(wrist);
    patient.add(hand);

    const hip = new THREE.Vector3(0.11, 0.54, side * 0.07);
    const knee = new THREE.Vector3(0.31, 0.51, side * 0.07);
    const ankle = new THREE.Vector3(0.48, 0.49, side * 0.07);
    patient.add(cylinderBetween(hip, knee, 0.05, trousers));
    patient.add(cylinderBetween(knee, ankle, 0.043, trousers));
    const shoe = roundedBox(0.11, 0.07, 0.09, 0xD8D6D2, { radius: 0.03, edges: false });
    shoe.position.set(0.52, 0.49, side * 0.07);
    patient.add(shoe);
  });
  return patient;
}

function createMedicineCabinet() {
  const cabinet = new THREE.Group();
  cabinet.name = 'medicineCabinet';
  const body = roundedBox(0.5, 0.92, 0.2, 0xC99A72, { radius: 0.06, edges: false, roughness: 0.9 });
  body.position.y = 0.46;
  cabinet.add(body);
  [-0.115, 0.115].forEach((x, index) => {
    const door = roundedBox(0.21, 0.78, 0.025, 0xDCB088, { radius: 0.025, edges: false, roughness: 0.88 });
    door.position.set(x, 0.48, 0.115);
    cabinet.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), mat(P.dark));
    knob.position.set(index ? 0.04 : -0.04, 0.47, 0.135);
    cabinet.add(knob);
  });
  [0xE9C46A, 0x8EC5E8, 0x75AD72, 0xB8C0D4].forEach((color, index) => {
    const bottle = roundedBox(0.04, 0.09, 0.04, color, { radius: 0.01, edges: false });
    bottle.name = `medicineBottle${index}`;
    bottle.position.set(-0.16 + index * 0.1, 0.87, 0.03);
    cabinet.add(bottle);
  });
  return cabinet;
}

function createSupplyCart() {
  const cart = new THREE.Group();
  cart.name = 'supplyCart';
  [0.2, 0.5].forEach((y) => {
    const tray = roundedBox(0.28, 0.035, 0.2, 0xE2E6E8, { radius: 0.03, edges: false, roughness: 0.8 });
    tray.position.y = y;
    cart.add(tray);
  });
  [-0.11, 0.11].forEach((x) => [-0.07, 0.07].forEach((z) => {
    const post = box(0.018, 0.46, 0.018, P.metal, { edges: false, metalness: 0.35 });
    post.position.set(x, 0.26, z);
    cart.add(post);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat(P.dark));
    wheel.position.set(x, 0.035, z);
    cart.add(wheel);
  }));
  [0xF28B66, 0x82C6E8, 0xE9C85D].forEach((color, index) => {
    const vial = roundedBox(0.03, 0.08, 0.03, color, { radius: 0.008, edges: false });
    vial.name = `supplyVial${index}`;
    vial.position.set(-0.07 + index * 0.07, 0.56, 0);
    cart.add(vial);
  });
  return cart;
}

function createPoster(name, color) {
  const poster = new THREE.Group();
  poster.name = name;
  const frame = roundedBox(0.28, 0.36, 0.025, 0xF5F1E9, { radius: 0.03, edges: false });
  frame.position.y = 0.18;
  poster.add(frame);
  const art = roundedBox(0.18, 0.2, 0.012, color, { radius: 0.03, edges: false });
  art.position.set(0, 0.2, 0.02);
  poster.add(art);
  return poster;
}

function createPlant() {
  const plant = new THREE.Group();
  plant.name = 'medicalPlantLarge';
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.23, 12), mat(0xB7825D));
  pot.position.y = 0.115;
  plant.add(pot);
  for (let index = 0; index < 7; index += 1) {
    const angle = index * Math.PI * 2 / 7;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 9, 7), mat(index % 2 ? 0x7BAD72 : P.green));
    leaf.scale.set(0.55, 1.45, 0.45);
    leaf.position.set(Math.sin(angle) * 0.13, 0.34 + (index % 2) * 0.05, Math.cos(angle) * 0.13);
    leaf.rotation.z = Math.sin(angle) * 0.5;
    plant.add(leaf);
  }
  return plant;
}

export function createMedicoRoom() {
  const room = new THREE.Group();
  room.name = 'MedicoRoom';

  const floor = roundedBox(1.9, 0.055, 1.9, P.floor, { radius: 0.14, edges: false, roughness: 0.96 });
  floor.name = 'medicalFloor';
  floor.position.y = 0.025;
  room.add(floor);
  const rug = roundedBox(0.9, 0.012, 0.72, P.rug, { radius: 0.12, edges: false, roughness: 0.98 });
  rug.name = 'medicalRug';
  rug.position.set(-0.28, 0.06, 0.28);
  room.add(rug);

  const desk = new THREE.Group();
  desk.name = 'doctorDesk';
  const deskTop = roundedBox(0.78, 0.07, 0.52, P.desk, { radius: 0.1, edges: false, roughness: 0.78 });
  deskTop.position.y = 0.54;
  desk.add(deskTop);
  [-0.3, 0.3].forEach((x) => [-0.18, 0.18].forEach((z) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.5, 9), mat(0xB98D71));
    leg.position.set(x, 0.27, z);
    desk.add(leg);
  }));
  desk.position.set(-0.25, 0, 0.33);
  room.add(desk);

  const monitor = new THREE.Group();
  monitor.name = 'doctorMonitor';
  const monitorBody = roundedBox(0.27, 0.19, 0.025, 0xD9DEE2, { radius: 0.025, edges: false, roughness: 0.5 });
  monitorBody.position.y = 0.13;
  monitor.add(monitorBody);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.15), mat(0xC8E8F0, { roughness: 0.25 }));
  screen.name = 'doctorMonitorScreen';
  screen.position.set(0, 0.13, -0.014);
  screen.rotation.y = Math.PI;
  monitor.add(screen);
  const stand = box(0.035, 0.13, 0.03, P.metal, { edges: false, metalness: 0.25 });
  stand.position.y = 0.02;
  monitor.add(stand);
  monitor.position.set(-0.18, 0.575, 0.29);
  monitor.rotation.y = -Math.PI / 4;
  room.add(monitor);

  const keyboard = roundedBox(0.22, 0.018, 0.09, 0xE4E2DE, { radius: 0.02, edges: false });
  keyboard.name = 'doctorKeyboard';
  keyboard.position.set(-0.15, 0.585, 0.48);
  keyboard.rotation.y = -Math.PI / 4;
  room.add(keyboard);
  const documents = roundedBox(0.2, 0.018, 0.15, 0xF7F4ED, { radius: 0.02, edges: false });
  documents.name = 'doctorDocuments';
  documents.position.set(-0.43, 0.585, 0.42);
  room.add(documents);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.07, 10), mat(0xB9784E));
  cup.name = 'doctorDeskCup';
  cup.position.set(-0.48, 0.62, 0.22);
  room.add(cup);

  const doctorChair = createOfficeChair('doctorChair');
  doctorChair.position.set(-0.52, 0.055, 0.02);
  doctorChair.rotation.y = -Math.PI * 0.75;
  room.add(doctorChair);
  const doctor = createSeatedDoctor();
  doctor.position.set(-0.52, 0.035, 0.02);
  doctor.rotation.y = -Math.PI * 0.75;
  room.add(doctor);

  const examBed = new THREE.Group();
  examBed.name = 'examBed';
  const bedBase = roundedBox(1.02, 0.17, 0.42, 0xD6D9DC, { radius: 0.07, edges: false, roughness: 0.86 });
  bedBase.position.y = 0.31;
  examBed.add(bedBase);
  const cushion = roundedBox(0.98, 0.08, 0.38, P.bed, { radius: 0.07, edges: false, roughness: 0.88 });
  cushion.position.y = 0.43;
  examBed.add(cushion);
  const pillow = roundedBox(0.22, 0.07, 0.25, P.white, { radius: 0.05, edges: false, roughness: 0.9 });
  pillow.name = 'examBedPillow';
  pillow.position.set(-0.38, 0.5, 0);
  examBed.add(pillow);
  [-0.17, 0.17].forEach((z) => {
    const rail = cylinderBetween(new THREE.Vector3(-0.35, 0.53, z), new THREE.Vector3(0.35, 0.53, z), 0.014, mat(P.metal, { metalness: 0.45 }));
    examBed.add(rail);
  });
  [-0.4, 0.4].forEach((x) => [-0.15, 0.15].forEach((z) => {
    const leg = box(0.035, 0.28, 0.035, P.metal, { edges: false, metalness: 0.35 });
    leg.position.set(x, 0.15, z);
    examBed.add(leg);
  }));
  examBed.position.set(0.34, 0, -0.34);
  const patient = createPatient();
  examBed.add(patient);
  room.add(examBed);

  const cabinet = createMedicineCabinet();
  cabinet.position.set(-0.52, 0, -0.76);
  room.add(cabinet);
  const cart = createSupplyCart();
  cart.position.set(0.72, 0, 0.34);
  room.add(cart);

  const lamp = new THREE.Group();
  lamp.name = 'examLamp';
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.025, 12), mat(0x75C4B1));
  lamp.add(lampBase);
  const lampStem = cylinderBetween(new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0.07, 0.28, 0), 0.012, mat(0xB98558, { metalness: 0.25 }));
  lamp.add(lampStem);
  const lampShade = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xE39A53));
  lampShade.position.set(0.09, 0.29, 0);
  lamp.add(lampShade);
  lamp.position.set(0.04, 0.585, 0.37);
  lamp.scale.setScalar(0.72);
  room.add(lamp);

  const stool = createOfficeChair('medicalStool', 0x91C0D0);
  stool.position.set(-0.78, 0.055, 0.62);
  stool.scale.setScalar(0.68);
  room.add(stool);
  const trash = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.16, 12), mat(0xD9D8D4));
  trash.name = 'medicalTrashBin';
  trash.position.set(0.72, 0.08, 0.68);
  room.add(trash);

  const healthPoster = createPoster('healthPoster', 0x72B993);
  healthPoster.position.set(-0.84, 0.75, -0.28);
  healthPoster.rotation.y = Math.PI / 2;
  room.add(healthPoster);
  const heartPoster = createPoster('heartPoster', 0xE78068);
  heartPoster.position.set(0.08, 0.82, -0.86);
  room.add(heartPoster);
  const certificate = roundedBox(0.2, 0.14, 0.02, 0xF3E8C9, { radius: 0.02, edges: false });
  certificate.name = 'medicalCertificate';
  certificate.position.set(0.42, 1.02, -0.86);
  room.add(certificate);

  const plant = createPlant();
  plant.position.set(-0.78, 0, -0.68);
  plant.scale.setScalar(0.8);
  room.add(plant);

  applyShadows(room);
  return room;
}

