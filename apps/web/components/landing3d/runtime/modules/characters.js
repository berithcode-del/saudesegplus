import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';
import { PATIENT_SCENE_LAYOUT } from './environment.js';

const { SKIN, roundedBox } = geometry;

function charHead(yOffset, skinColor = SKIN, hairColor = 0x4A3728) {
  const group = new THREE.Group();
  group.position.y = yOffset;

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 14),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.74 })
  );
  group.add(face);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.86 })
  );
  hair.position.y = 0.015;
  group.add(hair);

  const eyeGeo = new THREE.SphereGeometry(0.018, 6, 6);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1A1A2E });
  [-0.045, 0.045].forEach((xo) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(xo, 0.01, 0.12);
    group.add(eye);
  });

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.005, 4, 8, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xC4837A, roughness: 0.6 })
  );
  mouth.position.set(0, -0.035, 0.12);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  return group;
}

function cylinderBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.04, direction.length(), 9),
    material
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function buildMedica() {
  const group = new THREE.Group();
  group.name = 'medica';

  const coat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.44, 8),
    new THREE.MeshStandardMaterial({ color: 0xA7E0FF, roughness: 0.65 })
  );
  coat.position.y = 0.52;
  coat.castShadow = true;
  group.add(coat);

  const split = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.28, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x9AD4F5, roughness: 0.6 })
  );
  split.position.set(0, 0.42, 0.17);
  group.add(split);

  const armLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.05, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0xA7E0FF, roughness: 0.65 })
  );
  armLeft.position.set(-0.22, 0.55, 0.08);
  armLeft.rotation.z = 0.35;
  armLeft.rotation.x = -0.2;
  group.add(armLeft);

  const forearmLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.042, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0xA7E0FF, roughness: 0.65 })
  );
  forearmLeft.position.set(-0.3, 0.72, 0.12);
  forearmLeft.rotation.z = 0.6;
  group.add(forearmLeft);

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.04, 0.06, 10),
    new THREE.MeshStandardMaterial({ color: 0x5D8AA8, roughness: 0.4 })
  );
  cup.position.set(-0.35, 0.78, 0.14);
  group.add(cup);

  const armRight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.05, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: 0xA7E0FF, roughness: 0.65 })
  );
  armRight.position.set(0.22, 0.55, 0.08);
  armRight.rotation.z = -0.35;
  armRight.rotation.x = -0.15;
  group.add(armRight);

  const stetho = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.008, 4, 12, Math.PI * 1.2),
    new THREE.MeshStandardMaterial({ color: 0x6B7B8D, metalness: 0.7, roughness: 0.2 })
  );
  stetho.position.set(0, 0.72, 0.1);
  stetho.rotation.x = 0.3;
  group.add(stetho);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.008, 8),
    new THREE.MeshStandardMaterial({ color: 0xB0BEC5, metalness: 0.8, roughness: 0.15 })
  );
  disc.position.set(0, 0.55, 0.16);
  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.07, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xE9F6FF, roughness: 0.55 })
  );
  badge.position.set(0.08, 0.63, 0.17);
  group.add(badge);

  group.add(charHead(0.92));

  const bun = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.8 })
  );
  bun.position.set(0, 1.0, -0.08);
  group.add(bun);

  const legs = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.12, 0.36, 8),
    new THREE.MeshStandardMaterial({ color: 0x1E3A5F, roughness: 0.8 })
  );
  legs.position.y = 0.18;
  group.add(legs);

  return group;
}

function buildSecretaria() {
  const group = new THREE.Group();
  group.name = 'secretaria';
  group.userData.role = 'family-host';

  const skin = new THREE.MeshStandardMaterial({ color: 0xE0AE88, roughness: 0.82 });
  const cardigan = new THREE.MeshStandardMaterial({ color: 0xD97961, roughness: 0.82 });
  const blouse = new THREE.MeshStandardMaterial({ color: 0xF6EFE7, roughness: 0.92 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x354259, roughness: 0.88 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x5A382F, roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.155, 0.32, 12), cardigan);
  torso.name = 'clinicGuideTorso';
  torso.position.y = 0.65;
  group.add(torso);

  const blouseFront = roundedBox(0.075, 0.22, 0.022, 0xF6EFE7, { radius: 0.015, edges: false });
  blouseFront.position.set(0, 0.67, 0.125);
  group.add(blouseFront);

  const collar = roundedBox(0.14, 0.035, 0.075, 0xF6EFE7, { radius: 0.015, edges: false });
  collar.position.set(0, 0.81, 0.08);
  group.add(collar);

  const pelvis = roundedBox(0.24, 0.14, 0.19, 0x354259, { radius: 0.045, edges: false, roughness: 0.88 });
  pelvis.position.y = 0.44;
  group.add(pelvis);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(side * 0.12, 0.74, 0.02);
    const elbow = new THREE.Vector3(side * 0.17, 0.63, 0.09);
    const wrist = new THREE.Vector3(side * 0.12, 0.6, 0.2);
    const upperArm = cylinderBetween(shoulder, elbow, 0.038, cardigan);
    upperArm.name = `clinicGuideUpperArm${side < 0 ? 'Left' : 'Right'}`;
    group.add(upperArm);
    const forearm = cylinderBetween(elbow, wrist, 0.03, skin);
    forearm.name = `clinicGuideForearm${side < 0 ? 'Left' : 'Right'}`;
    group.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 9, 7), skin);
    hand.name = `clinicGuideHand${side < 0 ? 'Left' : 'Right'}`;
    hand.position.copy(wrist);
    hand.scale.set(1.1, 0.72, 1.2);
    group.add(hand);

    const hip = new THREE.Vector3(side * 0.07, 0.41, 0);
    const knee = new THREE.Vector3(side * 0.07, 0.235, 0.015);
    const ankle = new THREE.Vector3(side * 0.07, 0.08, 0.025);
    const thigh = cylinderBetween(hip, knee, 0.046, trousers);
    thigh.name = `clinicGuideThigh${side < 0 ? 'Left' : 'Right'}`;
    group.add(thigh);
    const calf = cylinderBetween(knee, ankle, 0.039, trousers);
    calf.name = `clinicGuideLeg${side < 0 ? 'Left' : 'Right'}`;
    group.add(calf);
    const shoe = roundedBox(0.085, 0.045, 0.14, 0x563C33, {
      radius: 0.025,
      edges: false,
      roughness: 0.92
    });
    shoe.name = `clinicGuideShoe${side < 0 ? 'Left' : 'Right'}`;
    shoe.position.set(side * 0.07, 0.045, 0.075);
    group.add(shoe);
  });

  const head = charHead(0.96, 0xE0AE88, 0x5A382F);
  head.name = 'clinicGuideHead';
  group.add(head);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), hairMat);
  hairBack.position.set(0, 0.97, -0.065);
  hairBack.scale.set(1.02, 1.08, 0.72);
  group.add(hairBack);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.065, 11, 9), hairMat);
  bun.position.set(0, 1.03, -0.14);
  group.add(bun);

  const phone = roundedBox(0.075, 0.12, 0.014, 0x263238, {
    radius: 0.015,
    edges: false,
    roughness: 0.32,
    metalness: 0.25
  });
  phone.name = 'clinicGuidePhone';
  phone.position.set(-0.1, 0.62, 0.225);
  phone.rotation.z = 0.08;
  group.add(phone);

  const screen = roundedBox(0.057, 0.098, 0.006, 0x54C9E8, { radius: 0.01, edges: false, roughness: 0.2 });
  screen.name = 'clinicGuidePhoneScreen';
  screen.position.set(-0.1, 0.62, 0.234);
  screen.rotation.z = 0.08;
  screen.material.emissive.setHex(0x35BFE4);
  screen.material.emissiveIntensity = 0.75;
  group.add(screen);

  return group;
}

function buildTrabalhador() {
  const group = new THREE.Group();
  group.name = 'trabalhador';
  group.userData.role = 'care-couple';

  const skin = new THREE.MeshStandardMaterial({ color: 0xC88E68, roughness: 0.78 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3E6A8A, roughness: 0.76 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x273142, roughness: 0.86 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.3, 10), shirtMat);
  torso.name = 'patientTorso';
  torso.position.y = 0.59;
  group.add(torso);

  const collar = roundedBox(0.11, 0.025, 0.07, 0xF2EEE6, { radius: 0.015, edges: false });
  collar.position.set(0, 0.72, 0.11);
  group.add(collar);

  const pelvis = roundedBox(0.24, 0.12, 0.22, 0x273142, { radius: 0.05, edges: false, roughness: 0.86 });
  pelvis.position.set(0, 0.42, 0.01);
  group.add(pelvis);

  const head = charHead(0.83, 0xC88E68, 0x332621);
  head.name = 'patientHead';
  group.add(head);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(side * 0.115, 0.66, 0.03);
    const elbow = side < 0
      ? new THREE.Vector3(-0.165, 0.56, 0.11)
      : new THREE.Vector3(0.18, 0.57, 0.15);
    const wrist = side < 0
      ? new THREE.Vector3(-0.085, 0.45, 0.185)
      : new THREE.Vector3(0.065, 0.59, 0.27);
    group.add(cylinderBetween(shoulder, elbow, 0.039, shirtMat));
    group.add(cylinderBetween(elbow, wrist, 0.03, skin));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), skin);
    hand.name = `patientHand${side > 0 ? 'Right' : 'Left'}`;
    hand.position.copy(wrist);
    hand.scale.set(1.1, 0.72, 1.2);
    group.add(hand);

    const hip = new THREE.Vector3(side * 0.07, 0.42, 0.04);
    const knee = side < 0
      ? new THREE.Vector3(-0.075, 0.27, 0.08)
      : new THREE.Vector3(0.075, 0.29, 0.22);
    const ankle = side < 0
      ? new THREE.Vector3(-0.075, 0.09, 0.14)
      : new THREE.Vector3(0.075, 0.105, 0.27);
    group.add(cylinderBetween(hip, knee, 0.05, pantsMat));
    group.add(cylinderBetween(knee, ankle, 0.043, pantsMat));
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.046, 9, 7), pantsMat);
    kneeJoint.position.copy(knee);
    group.add(kneeJoint);
    const shoe = roundedBox(0.09, 0.05, 0.15, 0x5A4136, { radius: 0.025, edges: false, roughness: 0.9 });
    shoe.name = `patientShoe${side > 0 ? 'Right' : 'Left'}`;
    shoe.position.set(side * 0.075, side < 0 ? 0.055 : 0.07, side < 0 ? 0.185 : 0.33);
    group.add(shoe);
  });

  const bag = roundedBox(0.13, 0.18, 0.08, 0x6B4B3D, {
    radius: 0.025,
    edges: false,
    roughness: 0.82
  });
  bag.name = 'patientBag';
  bag.position.set(-0.11, 0.33, 0.18);
  group.add(bag);

  const watch = new THREE.Mesh(
    new THREE.TorusGeometry(0.018, 0.004, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x90A0B3, roughness: 0.35, metalness: 0.5 })
  );
  watch.name = 'patientWatch';
  watch.position.set(0.08, 0.58, 0.24);
  watch.rotation.y = Math.PI / 2;
  group.add(watch);

  const partner = new THREE.Group();
  partner.name = 'patientPartner';
  partner.userData.role = 'care-partner';

  const partnerSkin = new THREE.MeshStandardMaterial({ color: 0xE1B08E, roughness: 0.8 });
  const dressMat = new THREE.MeshStandardMaterial({ color: 0xCE7E66, roughness: 0.8 });
  const partnerPants = new THREE.MeshStandardMaterial({ color: 0x4E5B72, roughness: 0.86 });

  const partnerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.28, 10), dressMat);
  partnerTorso.name = 'patientPartnerTorso';
  partnerTorso.position.y = 0.57;
  partner.add(partnerTorso);

  const partnerCollar = roundedBox(0.1, 0.022, 0.065, 0xF7EFE8, { radius: 0.014, edges: false });
  partnerCollar.position.set(0, 0.69, 0.11);
  partner.add(partnerCollar);

  const partnerPelvis = roundedBox(0.22, 0.12, 0.2, 0x4E5B72, { radius: 0.045, edges: false, roughness: 0.86 });
  partnerPelvis.position.set(0, 0.4, 0.01);
  partner.add(partnerPelvis);

  const partnerHead = charHead(0.82, 0xE1B08E, 0x4F382F);
  partnerHead.name = 'patientPartnerHead';
  partner.add(partnerHead);

  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(side * 0.105, 0.64, 0.03);
    const elbow = side < 0
      ? new THREE.Vector3(-0.135, 0.55, 0.13)
      : new THREE.Vector3(0.16, 0.55, 0.1);
    const wrist = side < 0
      ? new THREE.Vector3(0.015, 0.48, 0.215)
      : new THREE.Vector3(0.1, 0.42, 0.16);
    const upperArm = cylinderBetween(shoulder, elbow, 0.036, dressMat);
    upperArm.name = `patientPartnerUpperArm${side > 0 ? 'Right' : 'Left'}`;
    partner.add(upperArm);
    const forearm = cylinderBetween(elbow, wrist, 0.028, partnerSkin);
    forearm.name = `patientPartnerForearm${side > 0 ? 'Right' : 'Left'}`;
    partner.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), partnerSkin);
    hand.name = `patientPartnerHand${side > 0 ? 'Right' : 'Left'}`;
    hand.position.copy(wrist);
    hand.scale.set(1.08, 0.72, 1.18);
    partner.add(hand);

    const hip = new THREE.Vector3(side * 0.065, 0.4, 0.03);
    const knee = side < 0
      ? new THREE.Vector3(-0.06, 0.25, 0.12)
      : new THREE.Vector3(0.06, 0.28, 0.02);
    const ankle = side < 0
      ? new THREE.Vector3(-0.06, 0.08, 0.2)
      : new THREE.Vector3(0.06, 0.08, 0.08);
    partner.add(cylinderBetween(hip, knee, 0.045, partnerPants));
    partner.add(cylinderBetween(knee, ankle, 0.038, partnerPants));
    const shoe = roundedBox(0.085, 0.045, 0.14, 0x62453A, { radius: 0.024, edges: false, roughness: 0.9 });
    shoe.name = `patientPartnerShoe${side > 0 ? 'Right' : 'Left'}`;
    shoe.position.set(side * 0.06, 0.05, side < 0 ? 0.245 : 0.135);
    partner.add(shoe);
  });

  partner.position.set(-0.34, 0.02, -0.02);
  partner.rotation.y = 0.16;
  group.add(partner);

  return group;
}

function createCharacters(building) {
  const medica = buildMedica();
  medica.position.set(-1.35, 2.42, 1.35);
  medica.rotation.y = Math.PI * 0.75;
  medica.scale.setScalar(0.0001);
  medica.visible = false;
  building.add(medica);

  const secretaria = buildSecretaria();
  secretaria.position.set(-1.72, 4.88, -1.54);
  secretaria.rotation.y = Math.PI * 0.27;
  secretaria.scale.setScalar(0.0001);
  secretaria.visible = false;
  building.add(secretaria);

  const trabalhador = buildTrabalhador();
  trabalhador.position.set(
    PATIENT_SCENE_LAYOUT.benchPosition[0],
    PATIENT_SCENE_LAYOUT.benchPosition[1] + 0.02,
    PATIENT_SCENE_LAYOUT.benchPosition[2]
  );
  trabalhador.rotation.y = PATIENT_SCENE_LAYOUT.rotation;
  trabalhador.scale.setScalar(0.0001);
  building.add(trabalhador);

  return { medica, secretaria, trabalhador };
}

export default createCharacters;

