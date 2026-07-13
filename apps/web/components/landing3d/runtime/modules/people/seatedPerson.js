import * as THREE from '../../vendor/three.module.js';
import geometry from '../../utils/geometry.js';

const { roundedBox } = geometry;

function mat(color, roughness = 0.88) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function cylinderBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const limb = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.04, direction.length(), 9),
    material
  );
  limb.position.copy(start).add(end).multiplyScalar(0.5);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return limb;
}

export function createSeatedPerson({
  name,
  shirtColor,
  hairColor,
  skinColor = 0xDFAE86,
  trouserColor = 0x3B4D64,
  shoeColor = 0x5F4335,
  role = 'seated-person',
  partPrefix = name,
  lowerLegDrop = 0
}) {
  const person = new THREE.Group();
  person.name = name;
  person.userData.role = role;
  person.userData.pose = 'seated';
  person.userData.model = 'shared-seated-person';
  person.userData.lowerLegDrop = lowerLegDrop;

  const skin = mat(skinColor);
  const shirt = mat(shirtColor, 0.9);
  const hair = mat(hairColor, 0.92);
  const trousers = mat(trouserColor, 0.9);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.145, 0.3, 12), shirt);
  torso.name = `${partPrefix}Torso`;
  torso.position.y = 0.53;
  person.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.07, 9), skin);
  neck.name = `${partPrefix}Neck`;
  neck.position.y = 0.7;
  person.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), skin);
  head.name = `${partPrefix}Head`;
  head.position.y = 0.79;
  person.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.119, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hair
  );
  hairCap.name = `${partPrefix}Hair`;
  hairCap.position.y = 0.8;
  person.add(hairCap);

  [-0.04, 0.04].forEach((x, index) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 7, 5), mat(0x2A211E));
    eye.name = `${partPrefix}Eye${index === 0 ? 'Left' : 'Right'}`;
    eye.position.set(x, 0.8, -0.105);
    person.add(eye);
  });

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 6, 12, Math.PI), mat(0x6F3E35));
  smile.name = `${partPrefix}Smile`;
  smile.position.set(0, 0.755, -0.108);
  smile.rotation.z = Math.PI;
  person.add(smile);

  [-1, 1].forEach((side) => {
    const label = side < 0 ? 'Left' : 'Right';
    const shoulder = new THREE.Vector3(side * 0.115, 0.61, -0.02);
    const elbow = new THREE.Vector3(side * 0.17, 0.53, -0.11);
    const wrist = new THREE.Vector3(side * 0.15, 0.555, -0.255);

    const upperArm = cylinderBetween(shoulder, elbow, 0.037, shirt);
    upperArm.name = `${partPrefix}UpperArm${label}`;
    person.add(upperArm);
    const forearm = cylinderBetween(elbow, wrist, 0.03, skin);
    forearm.name = `${partPrefix}Forearm${label}`;
    person.add(forearm);
    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.033, 9, 7), skin);
    elbowJoint.name = `${partPrefix}Elbow${label}`;
    elbowJoint.position.copy(elbow);
    person.add(elbowJoint);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), skin);
    hand.name = `${partPrefix}Hand${label}`;
    hand.position.copy(wrist);
    hand.scale.set(1.15, 0.65, 1.25);
    person.add(hand);

    const hip = new THREE.Vector3(side * 0.07, 0.4, 0.015);
    const knee = new THREE.Vector3(side * 0.075, 0.265, -0.12);
    const ankle = new THREE.Vector3(side * 0.075, 0.105 - lowerLegDrop, -0.16);
    const thigh = cylinderBetween(hip, knee, 0.045, trousers);
    thigh.name = `${partPrefix}Thigh${label}`;
    person.add(thigh);
    const lowerLeg = cylinderBetween(knee, ankle, 0.04, trousers);
    lowerLeg.name = `${partPrefix}LowerLeg${label}`;
    person.add(lowerLeg);
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.043, 9, 7), trousers);
    kneeJoint.name = `${partPrefix}Knee${label}`;
    kneeJoint.position.copy(knee);
    person.add(kneeJoint);
    const shoe = roundedBox(0.08, 0.045, 0.14, shoeColor, {
      radius: 0.025,
      edges: false,
      roughness: 0.92
    });
    shoe.name = `${partPrefix}Shoe${label}`;
    shoe.position.set(side * 0.075, 0.065 - lowerLegDrop, -0.205);
    person.add(shoe);
  });

  return person;
}

export default createSeatedPerson;

