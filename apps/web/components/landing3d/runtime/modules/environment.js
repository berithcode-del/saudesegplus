import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';

const { COL, box, roundedBox } = geometry;

export const FAMILY_SCENE_LAYOUT = {
  gardenCenter: [6.1, 0, 0.95],
  benchPosition: [6.1, 0.14, 1.02],
  treePosition: [6.1, 0.06, 0.28],
  rotation: 0
};

export const PATIENT_SCENE_LAYOUT = FAMILY_SCENE_LAYOUT;

export const STREET_LAYOUT = {
  lampPosition: [3.65, 0, 3.65]
};

function createArrivalPatio(building) {
  const patio = new THREE.Group();
  patio.name = 'arrivalPatio';

  const border = roundedBox(2.4, 0.1, 1.6, 0xB9B5A9, {
    radius: 0.18,
    edges: false,
    roughness: 0.94
  });
  border.name = 'arrivalPatioBorder';
  border.position.y = 0.05;
  patio.add(border);

  const surface = roundedBox(2.25, 0.035, 1.45, 0xE5D7C7, {
    radius: 0.15,
    edges: false,
    roughness: 0.98
  });
  surface.name = 'arrivalPatioSurface';
  surface.position.y = 0.115;
  patio.add(surface);

  const grassBed = roundedBox(2.02, 0.028, 1.22, 0x86BE72, {
    radius: 0.13,
    edges: false,
    roughness: 0.98
  });
  grassBed.name = 'arrivalPatioGrass';
  grassBed.position.set(-0.05, 0.121, 0.12);
  patio.add(grassBed);

  [
    [-0.64, 0.135, 0.5, 0.22, 0.12],
    [0.18, 0.135, 0.38, 0.28, 0.14],
    [-0.18, 0.135, 0.18, 0.24, 0.12]
  ].forEach(([x, y, z, w, d], index) => {
    const tile = roundedBox(w, 0.014, d, 0xF5E9BE, {
      radius: 0.04,
      edges: false,
      roughness: 0.9
    });
    tile.name = `arrivalGardenTile${index}`;
    tile.position.set(x, y, z);
    patio.add(tile);
  });

  const doormat = roundedBox(0.62, 0.02, 0.26, 0x7D5A48, {
    radius: 0.05,
    edges: false,
    roughness: 0.92
  });
  doormat.name = 'arrivalDoormat';
  doormat.position.set(0.48, 0.13, -0.1);
  patio.add(doormat);

  [-0.4, -0.05, 0.28].forEach((x, index) => {
    const step = roundedBox(0.36, 0.018, 0.16, 0xCEB79D, {
      radius: 0.05,
      edges: false,
      roughness: 0.95
    });
    step.name = `arrivalStep${index}`;
    step.position.set(x, 0.13, 0.24 + index * 0.12);
    patio.add(step);
  });

  patio.position.set(...FAMILY_SCENE_LAYOUT.gardenCenter);
  building.add(patio);
  return patio;
}

function createWelcomeLamp(building) {
  const lamp = new THREE.Group();
  lamp.name = 'arrivalLamp';

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 1.65, 8),
    new THREE.MeshStandardMaterial({ color: 0x8A8A9A, roughness: 0.52, metalness: 0.55 })
  );
  pole.position.y = 0.82;
  lamp.add(pole);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFF6D8, emissive: 0xFFE7A7, emissiveIntensity: 0.8 })
  );
  head.position.y = 1.72;
  lamp.add(head);

  const light = new THREE.PointLight(0xFFE7A7, 0.35, 3.2);
  light.position.y = 1.68;
  lamp.add(light);

  lamp.position.set(6.92, 0, 0.46);
  building.add(lamp);
  return lamp;
}

function pottedPlant(building, x, z, scale, name = 'pottedPlant') {
  const group = new THREE.Group();
  group.name = name;

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.11, 0.26, 12),
    new THREE.MeshStandardMaterial({ color: 0xC1440E, roughness: 0.88, metalness: 0.0 })
  );
  pot.position.y = 0.13;
  group.add(pot);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3D8B5E, roughness: 0.75 });
  const lumps = [
    { r: 0.16, x: 0.00, y: 0.22, z: 0.00 },
    { r: 0.15, x: 0.00, y: 0.35, z: 0.00 },
    { r: 0.12, x: 0.11, y: 0.25, z: 0.08 },
    { r: 0.12, x: -0.10, y: 0.26, z: -0.09 },
    { r: 0.11, x: -0.12, y: 0.24, z: 0.07 },
    { r: 0.12, x: 0.09, y: 0.23, z: -0.10 }
  ];
  lumps.forEach((lumpCfg, index) => {
    const lump = new THREE.Mesh(new THREE.SphereGeometry(lumpCfg.r, 10, 8), leafMat);
    lump.name = `${name}Leaf${index}`;
    lump.position.set(lumpCfg.x, lumpCfg.y, lumpCfg.z);
    lump.castShadow = true;
    group.add(lump);
  });

  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  building.add(group);
}

function tree(parent, x, z, scale, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || 'tree';

  if (options.planter !== false) {
    const planterBorder = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.07, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x2A2B30, roughness: 0.85 })
    );
    planterBorder.position.y = 0.035;
    group.add(planterBorder);

    const planterSoil = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.04, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.95 })
    );
    planterSoil.position.y = 0.065;
    group.add(planterSoil);
  }

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.09, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: COL.greenTrunk, roughness: 0.88 })
  );
  trunk.position.y = 0.62;
  trunk.castShadow = true;
  group.add(trunk);

  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x3D8B5E, roughness: 0.72 });
  const lumps = [
    { r: 0.52, x: 0.00, y: 1.38, z: 0.00 },
    { r: 0.36, x: 0.28, y: 1.58, z: 0.12 },
    { r: 0.32, x: -0.26, y: 1.52, z: -0.16 },
    { r: 0.28, x: 0.05, y: 1.74, z: -0.08 },
    { r: 0.24, x: -0.14, y: 1.65, z: 0.22 }
  ];
  lumps.forEach((lumpCfg) => {
    const lump = new THREE.Mesh(new THREE.SphereGeometry(lumpCfg.r, 12, 10), canopyMat);
    lump.position.set(lumpCfg.x, lumpCfg.y, lumpCfg.z);
    lump.castShadow = true;
    group.add(lump);
  });

  group.position.set(x, options.y || 0, z);
  group.scale.setScalar(scale);
  parent.add(group);
}

function createCar(building, x, z, rotationY, color) {
  const carGroup = new THREE.Group();
  carGroup.name = 'car';

  const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.28, 0.55),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
  );
  carBody.name = 'carBody';
  carBody.position.y = 0.28;
  carBody.castShadow = true;
  carGroup.add(carBody);

  const carRoof = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.22, 0.46),
    new THREE.MeshStandardMaterial({ color: 0xEFEFF5, roughness: 0.3 })
  );
  carRoof.name = 'carRoof';
  carRoof.position.set(-0.04, 0.5, 0);
  carRoof.castShadow = true;
  carGroup.add(carRoof);

  const carGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0xA7D8FF,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.3
    })
  );
  carGlass.name = 'carWindshield';
  carGlass.position.set(-0.04, 0.51, 0.235);
  carGlass.rotation.x = -0.12;
  carGroup.add(carGlass);

  const rearGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0xB8DCF8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.08,
      metalness: 0.2
    })
  );
  rearGlass.name = 'carRearWindow';
  rearGlass.position.set(-0.18, 0.49, -0.235);
  rearGlass.rotation.x = 0.2;
  carGroup.add(rearGlass);

  const bumperFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.08, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xD8DEE7, roughness: 0.45, metalness: 0.45 })
  );
  bumperFront.name = 'carFrontBumper';
  bumperFront.position.set(0, 0.18, 0.29);
  carGroup.add(bumperFront);

  const bumperRear = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.08, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xAEB6C5, roughness: 0.52, metalness: 0.35 })
  );
  bumperRear.name = 'carRearBumper';
  bumperRear.position.set(0, 0.18, -0.29);
  carGroup.add(bumperRear);

  const wheelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.9 });
  [[-0.3, 0.27], [0.3, 0.27], [-0.3, -0.27], [0.3, -0.27]].forEach(([xo, zo], index) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.name = `carWheel${index}`;
    wheel.position.set(xo, 0.09, zo);
    wheel.rotation.x = Math.PI / 2;
    carGroup.add(wheel);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.105, 10),
      new THREE.MeshStandardMaterial({ color: 0xA4ABB8, roughness: 0.3, metalness: 0.65 })
    );
    hub.name = `carHubcap${index}`;
    hub.position.set(xo, 0.09, zo);
    hub.rotation.x = Math.PI / 2;
    carGroup.add(hub);
  });

  [[0.22, 0.26], [-0.22, 0.26]].forEach(([xo, zo], index) => {
    const light = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0xFFFFAA, emissive: 0xFFFF88, emissiveIntensity: 0.5 })
    );
    light.name = `carHeadlight${index}`;
    light.position.set(xo, 0.28, zo);
    light.rotation.x = Math.PI / 2;
    carGroup.add(light);
  });

  [[0.24, -0.26], [-0.24, -0.26]].forEach(([xo, zo], index) => {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.03, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xF87171, emissive: 0xD9485C, emissiveIntensity: 0.4 })
    );
    light.name = `carTailLight${index}`;
    light.position.set(xo, 0.28, zo);
    carGroup.add(light);
  });

  carGroup.position.set(x, 0, z);
  carGroup.rotation.y = rotationY;
  building.add(carGroup);
  return carGroup;
}

function createLampPost(building) {
  const lamp = new THREE.Group();
  lamp.name = 'streetLamp';

  const lampPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x8A8A9A, roughness: 0.5, metalness: 0.6 })
  );
  lampPost.name = 'streetLampPole';
  lampPost.position.y = 1.1;
  lamp.add(lampPost);

  const lampHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFFFEE, emissive: 0xFFEEAA, emissiveIntensity: 1.0 })
  );
  lampHead.name = 'streetLampHead';
  lampHead.position.y = 2.3;
  lamp.add(lampHead);

  const lampLight = new THREE.PointLight(0xFFEEAA, 0.4, 4);
  lampLight.position.y = 2.2;
  lamp.add(lampLight);

  lamp.position.set(...STREET_LAYOUT.lampPosition);
  building.add(lamp);
  return lamp;
}

function createSportsCourt(building) {
  const court = new THREE.Group();
  court.name = 'sportsCourt';

  const base = roundedBox(2.82, 0.045, 1.78, 0x4B9D7B, {
    radius: 0.12,
    edges: false,
    roughness: 0.93
  });
  base.name = 'sportsCourtSurface';
  base.position.y = 0.0225;
  court.add(base);

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xF6FAF7,
    roughness: 0.9,
    metalness: 0.0
  });

  function addLine(name, x, z, w, d) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, d), lineMat);
    line.name = name;
    line.position.set(x, 0.052, z);
    line.receiveShadow = true;
    court.add(line);
    return line;
  }

  addLine('sportsCourtLineFront', 0, 0.78, 2.38, 0.035);
  addLine('sportsCourtLineBack', 0, -0.78, 2.38, 0.035);
  addLine('sportsCourtLineLeft', -1.19, 0, 0.035, 1.56);
  addLine('sportsCourtLineRight', 1.19, 0, 0.035, 1.56);
  addLine('sportsCourtLineCenter', 0, 0, 0.035, 1.5);

  const circle = new THREE.Mesh(
    new THREE.RingGeometry(0.27, 0.3, 32),
    lineMat
  );
  circle.name = 'sportsCourtCenterCircle';
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.057;
  court.add(circle);

  addLine('sportsCourtGoalLeftBack', -1.3, 0, 0.035, 0.48);
  addLine('sportsCourtGoalRightBack', 1.3, 0, 0.035, 0.48);

  court.position.set(2.25, 0, -5.15);
  court.rotation.y = 0;
  building.add(court);
  return court;
}

function createEnvironment(building) {
  const vegGroup = new THREE.Group();
  vegGroup.name = 'environmentVegetation';
  vegGroup.position.y = 0.07;
  building.add(vegGroup);

  createArrivalPatio(building);
  pottedPlant(building, 5.28, 1.18, 0.9, 'arrivalPlantLeft');
  pottedPlant(building, 6.92, 0.2, 0.82, 'arrivalPlantRight');
  createWelcomeLamp(building);
  pottedPlant(vegGroup, 2.8, 2.6, 0.9, 'cornerPlant');

  tree(vegGroup, -6.5, -1.0, 1.05);
  tree(vegGroup, -6.5, 0.0, 1.2);
  tree(vegGroup, -6.5, 1.0, 0.95);
  tree(
    building,
    FAMILY_SCENE_LAYOUT.treePosition[0],
    FAMILY_SCENE_LAYOUT.treePosition[2],
    1.1,
    {
      y: FAMILY_SCENE_LAYOUT.treePosition[1],
      planter: false,
      name: 'patientShadeTree'
    }
  );

  const xOrigin = -5.15;
  const zOrigin = -1.575;
  const spacing = 1.05;

  createCar(building, xOrigin, zOrigin + 0.5 * spacing, 0, 0x2A3B72);
  createCar(building, xOrigin, zOrigin + 1.5 * spacing, 0, 0xE8E2D5);
  createCar(building, xOrigin, zOrigin + 2.5 * spacing, 0, 0xD0D4DC);

  createSportsCourt(building);
  createLampPost(building);
  return vegGroup;
}

export default createEnvironment;

