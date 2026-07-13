import * as THREE from '../../vendor/three.module.js';
import geometry from '../../utils/geometry.js';
import { createSeatedPerson } from '../people/seatedPerson.js';

const { roundedBox } = geometry;

const P = {
  floor: 0xE7DCCD,
  wall: 0xF8F4ED,
  rug: 0xDCC9B6,
  sofa: 0xC46F4A,
  sofaLight: 0xE4B58E,
  wood: 0x9D6C4F,
  woodDark: 0x6E4836,
  navy: 0x32445E,
  cream: 0xFBF7F1,
  brass: 0xC4A26C,
  plant: 0x5A8B5B,
  screen: 0xE7F6FF,
  skinA: 0xD9A47E,
  skinB: 0x8C5B3D,
  denim: 0x5D7596,
  coral: 0xD37A61,
  yellow: 0xE2B458
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.84,
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

function cylinderBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const limb = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.04, direction.length(), 10),
    material
  );
  limb.position.copy(start).add(end).multiplyScalar(0.5);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return limb;
}

function createPlant(name, scale = 1) {
  const plant = new THREE.Group();
  plant.name = name;

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.15, 10), mat(P.wood));
  pot.position.y = 0.075;
  plant.add(pot);

  [
    [0, 0.2, 0, 0.12],
    [0.08, 0.28, 0.02, 0.09],
    [-0.07, 0.27, -0.03, 0.09],
    [0.03, 0.35, -0.05, 0.08],
    [-0.02, 0.34, 0.06, 0.08]
  ].forEach(([x, y, z, radius], index) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat(P.plant));
    leaf.name = `${name}Leaf${index}`;
    leaf.position.set(x, y, z);
    plant.add(leaf);
  });

  plant.scale.setScalar(scale);
  return plant;
}

function createArrivingMan() {
  const person = new THREE.Group();
  person.name = 'familyArrivingMan';
  person.userData.role = 'provider';
  person.userData.pose = 'standing-upright';

  const skin = mat(P.skinB, { roughness: 0.84 });
  const jacket = mat(P.denim);
  const shirt = mat(P.cream, { roughness: 0.92 });
  const pants = mat(0x33414E, { roughness: 0.9 });
  const hairMat = mat(0x2E221D, { roughness: 0.92 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.31, 12), jacket);
  torso.name = 'familyArrivingManTorso';
  torso.position.y = 0.57;
  person.add(torso);

  const shirtFront = roundedBox(0.075, 0.2, 0.02, P.cream, { radius: 0.014, edges: false });
  shirtFront.position.set(0, 0.58, 0.11);
  person.add(shirtFront);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 12), skin);
  head.position.y = 0.86;
  person.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hair.position.set(0, 0.875, 0.005);
  person.add(hair);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(side * 0.11, 0.65, 0.02);
    const elbow = side < 0
      ? new THREE.Vector3(-0.19, 0.52, 0.07)
      : new THREE.Vector3(0.18, 0.58, 0.14);
    const wrist = side < 0
      ? new THREE.Vector3(-0.11, 0.42, 0.14)
      : new THREE.Vector3(0.1, 0.49, 0.22);
    person.add(cylinderBetween(shoulder, elbow, 0.034, jacket));
    person.add(cylinderBetween(elbow, wrist, 0.028, skin));

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), skin);
    hand.name = `familyArrivingManHand${side < 0 ? 'Left' : 'Right'}`;
    hand.position.copy(wrist);
    person.add(hand);

    const label = side < 0 ? 'Left' : 'Right';
    const hip = new THREE.Vector3(side * 0.065, 0.4, 0.02);
    const knee = new THREE.Vector3(side * 0.068, 0.22, side < 0 ? 0.035 : 0.06);
    const ankle = new THREE.Vector3(side * 0.068, 0.055, side < 0 ? 0.05 : 0.08);
    const thigh = cylinderBetween(hip, knee, 0.045, pants);
    thigh.name = `familyArrivingManThigh${label}`;
    person.add(thigh);
    const lowerLeg = cylinderBetween(knee, ankle, 0.038, pants);
    lowerLeg.name = `familyArrivingManLowerLeg${label}`;
    person.add(lowerLeg);
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.041, 9, 7), pants);
    kneeJoint.name = `familyArrivingManKnee${label}`;
    kneeJoint.position.copy(knee);
    person.add(kneeJoint);
    const shoe = roundedBox(0.09, 0.04, 0.14, 0x5D4337, { radius: 0.025, edges: false });
    shoe.name = `familyArrivingManShoe${label}`;
    shoe.position.set(side * 0.068, 0.03, side < 0 ? 0.1 : 0.13);
    person.add(shoe);
  });

  const bag = roundedBox(0.14, 0.18, 0.08, P.woodDark, { radius: 0.03, edges: false });
  bag.name = 'familyArrivingManBag';
  bag.position.set(-0.16, 0.33, 0.13);
  person.add(bag);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 4, 10, Math.PI), mat(P.brass, { metalness: 0.2 }));
  handle.position.set(-0.16, 0.42, 0.17);
  handle.rotation.y = Math.PI / 2;
  person.add(handle);

  return person;
}

export function createClinicaRoom() {
  const room = new THREE.Group();
  room.name = 'clinicaRoom';

  const floor = roundedBox(1.92, 0.055, 1.92, P.floor, { radius: 0.14, edges: false, roughness: 0.97 });
  floor.name = 'homeLivingRoomFloor';
  floor.position.y = 0.0275;
  room.add(floor);

  const rug = roundedBox(1.1, 0.02, 0.74, P.rug, { radius: 0.12, edges: false, roughness: 0.95 });
  rug.name = 'homeAreaRug';
  rug.position.set(0.02, 0.04, 0.18);
  room.add(rug);

  const sofa = roundedBox(0.82, 0.14, 0.34, P.sofa, { radius: 0.065, edges: false });
  sofa.name = 'homeSofa';
  sofa.position.set(0.22, 0.31, 0.1);
  room.add(sofa);

  const sofaBack = roundedBox(0.9, 0.24, 0.1, P.sofa, { radius: 0.06, edges: false });
  sofaBack.name = 'homeSofaBack';
  sofaBack.position.set(0.22, 0.49, 0.26);
  room.add(sofaBack);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'Left' : 'Right';
    const arm = roundedBox(0.1, 0.18, 0.34, P.sofa, { radius: 0.045, edges: false });
    arm.name = `homeSofaArm${label}`;
    arm.position.set(0.22 + side * 0.4, 0.43, 0.1);
    room.add(arm);
  });

  [-0.32, 0.32].forEach((x, xIndex) => [-0.12, 0.12].forEach((z, zIndex) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.18, 8),
      mat(P.woodDark, { roughness: 0.82 })
    );
    leg.name = `homeSofaLeg${xIndex * 2 + zIndex}`;
    leg.position.set(0.22 + x, 0.15, 0.1 + z);
    room.add(leg);
  }));

  [-0.28, 0.28].forEach((x, index) => {
    const cushion = roundedBox(0.26, 0.08, 0.22, index === 0 ? P.sofaLight : P.cream, { radius: 0.05, edges: false });
    cushion.name = `homeSofaCushion${index}`;
    cushion.position.set(x + 0.22, 0.42, 0.1);
    room.add(cushion);
  });

  const plant = createPlant('homeCornerPlant', 1.05);
  plant.position.set(-0.86, 0.02, 0.24);
  room.add(plant);

  const child = createSeatedPerson({
    name: 'familyChild',
    shirtColor: P.yellow,
    hairColor: 0x4B342A,
    skinColor: P.skinA,
    trouserColor: P.denim,
    role: 'child',
    lowerLegDrop: 0.1
  });
  child.position.set(0.04, 0.23, 0);
  child.rotation.y = -0.04;
  child.scale.setScalar(0.78);
  room.add(child);

  const woman = createSeatedPerson({
    name: 'familyWoman',
    shirtColor: P.cream,
    hairColor: 0x5A3A2D,
    skinColor: P.skinA,
    trouserColor: P.navy,
    shoeColor: 0x6A4B3F,
    role: 'caregiver',
    lowerLegDrop: 0.18
  });
  woman.position.set(0.4, 0.18, 0);
  woman.rotation.y = -0.08;
  woman.scale.setScalar(0.96);
  room.add(woman);

  const arrivingMan = createArrivingMan();
  arrivingMan.position.set(0.68, 0.03, -0.5);
  arrivingMan.rotation.y = -0.55;
  room.add(arrivingMan);

  const roomLight = new THREE.PointLight(0xFFE7B5, 0.58, 3.2);
  roomLight.name = 'clinicInteriorLight';
  roomLight.position.set(0.25, 1.35, 0.28);
  room.add(roomLight);

  applyShadows(room);
  return room;
}

export default createClinicaRoom;

