import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';
import entrance from './entrance.js';
import ground from './ground.js';
import sidewalk from './sidewalk.js';
import { createEmpresaRoom } from './rooms/empresaRoom.js';
import { createMedicoRoom } from './rooms/medicoRoom.js';
import { createClinicaRoom } from './rooms/clinicaRoom.js';

const { COL, roundedBox, roundedColumn, addFloorWindows, createRoofAC, createRoofVent, createRoofChimney } = geometry;

export const BUILD_W = 4.3;
export const BUILD_D = 4.3;
export const LIGHT_R = 0.5;
export const LIGHT_BV = 0.16;
export const TOTAL_H = 6.86;
export const SHELL_CAP_CLEARANCE = 0.04;

export const FLOOR_OPENINGS = {
  empresa: { bottom: 0.374, top: 1.826 },
  medico: { bottom: 2.41, top: 4.293 },
  clinica: { bottom: 4.87, top: 6.537 }
};

export const ROOM_LAYOUT = {
  empresa: { position: [1.1, 0.34, 1.1], rotation: Math.PI / 2, frame: 1 },
  medico: { position: [-1.1, 2.38, 1.1], rotation: -Math.PI / 2, frame: 2 },
  clinica: { position: [-1.0, 4.84, -1.0], rotation: 0, frame: 3 }
};

function getWindowBand(opening) {
  return {
    nominalHeight: (opening.top - opening.bottom) / 0.66,
    center: (opening.bottom + opening.top) / 2
  };
}

function createBuilding(building){
  ground(building);
  sidewalk(building, BUILD_W, BUILD_D);

  const slices = [
    { yStart: 0, yEnd: 0.374, carvedCorner: null },
    { yStart: FLOOR_OPENINGS.empresa.bottom, yEnd: FLOOR_OPENINGS.empresa.top, carvedCorner: '+x+z' },
    {
      yStart: FLOOR_OPENINGS.empresa.top,
      yEnd: FLOOR_OPENINGS.medico.bottom - SHELL_CAP_CLEARANCE,
      carvedCorner: null
    },
    { yStart: FLOOR_OPENINGS.medico.bottom, yEnd: FLOOR_OPENINGS.medico.top, carvedCorner: '-x+z' },
    {
      yStart: FLOOR_OPENINGS.medico.top,
      yEnd: FLOOR_OPENINGS.clinica.bottom - SHELL_CAP_CLEARANCE,
      carvedCorner: null
    },
    { yStart: FLOOR_OPENINGS.clinica.bottom, yEnd: FLOOR_OPENINGS.clinica.top, carvedCorner: '-x-z' },
    { yStart: 6.537, yEnd: TOTAL_H, carvedCorner: null }
  ];

  slices.forEach((slice) => {
    const h = slice.yEnd - slice.yStart;
    const sliceShell = roundedColumn(BUILD_W, h, BUILD_D, COL.cream, {
      radius: LIGHT_R,
      carvedCorner: slice.carvedCorner,
      edges: false
    });
    sliceShell.position.y = slice.yStart + h / 2;
    building.add(sliceShell);
  });

  function belt(y, protrude = 0.24, h = 0.32){
    const beltMesh = roundedBox(
      BUILD_W + protrude * 2,
      h,
      BUILD_D + protrude * 2,
      COL.navy,
      { radius: LIGHT_R + protrude, bevel: 0.05, edges: false }
    );
    beltMesh.position.y = y;
    building.add(beltMesh);
    return beltMesh;
  }

  belt(0.16);
  belt(2.25);
  belt(4.71);

  const empresaWindow = getWindowBand(FLOOR_OPENINGS.empresa);
  const floor0OpenMats = addFloorWindows(
    building,
    BUILD_W,
    BUILD_D,
    empresaWindow.nominalHeight,
    empresaWindow.center,
    ['+x', '+z'],
    COL.glassA,
    COL.glassB,
    '/office_medico.png'
  );
  const empresaRoom = createEmpresaRoom();
  empresaRoom.position.set(...ROOM_LAYOUT.empresa.position);
  empresaRoom.rotation.y = ROOM_LAYOUT.empresa.rotation;
  empresaRoom.scale.setScalar(0.0001);
  building.add(empresaRoom);

  const entranceParts = entrance(building, BUILD_D);

  const medicoWindow = getWindowBand(FLOOR_OPENINGS.medico);
  const floor1OpenMats = addFloorWindows(
    building,
    BUILD_W,
    BUILD_D,
    medicoWindow.nominalHeight,
    medicoWindow.center,
    ['-x', '+z'],
    COL.glassB,
    COL.glassA,
    null
  );
  const medicoRoom = createMedicoRoom();
  medicoRoom.position.set(...ROOM_LAYOUT.medico.position);
  medicoRoom.rotation.y = ROOM_LAYOUT.medico.rotation;
  medicoRoom.scale.setScalar(0.0001);
  building.add(medicoRoom);

  const clinicaWindow = getWindowBand(FLOOR_OPENINGS.clinica);
  const floor2OpenMats = addFloorWindows(
    building,
    BUILD_W,
    BUILD_D,
    clinicaWindow.nominalHeight,
    clinicaWindow.center,
    ['-x', '-z'],
    COL.glassA,
    COL.glassB,
    '/office_clinica.png'
  );
  const clinicaRoom = createClinicaRoom();
  clinicaRoom.position.set(...ROOM_LAYOUT.clinica.position);
  clinicaRoom.rotation.y = ROOM_LAYOUT.clinica.rotation;
  clinicaRoom.scale.setScalar(0.0001);
  building.add(clinicaRoom);

  const ROOF_H = 0.52;
  const ROOF_OVERLAP = 0.05;
  const roofBottomY = TOTAL_H - ROOF_OVERLAP;

  const roofFloorH = 0.18;
  const roofFloor = roundedBox(BUILD_W + 0.28, roofFloorH, BUILD_D + 0.28, COL.navyDark, {
    radius: LIGHT_R + 0.14,
    bevel: 0.05,
    edges: false
  });
  roofFloor.position.y = roofBottomY + roofFloorH / 2;
  building.add(roofFloor);

  const outerW = BUILD_W + 0.28;
  const outerD = BUILD_D + 0.28;
  const outerR = LIGHT_R + 0.14;
  const pWidth = 0.25;
  const bevel = 0.11;

  const roofShape = geometry.roundedRectShape(outerW, outerD, outerR);
  const roofHole = geometry.roundedRectShape(
    outerW - pWidth * 2,
    outerD - pWidth * 2,
    Math.max(0.01, outerR - pWidth)
  );
  roofShape.holes.push(roofHole);

  const depth = Math.max(0.002, ROOF_H - bevel * 2);
  const roofBorderGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 12
  });
  roofBorderGeo.translate(0, 0, -(ROOF_H / 2 - bevel));
  roofBorderGeo.rotateX(-Math.PI / 2);

  const roofBorder = new THREE.Mesh(
    roofBorderGeo,
    new THREE.MeshStandardMaterial({ color: COL.navyDark, roughness: 0.7 })
  );
  roofBorder.position.y = roofBottomY + ROOF_H / 2;
  roofBorder.castShadow = true;
  roofBorder.receiveShadow = true;
  building.add(roofBorder);

  const roofTopY = roofBottomY + roofFloorH;

  [[-0.32, -0.65], [0.32, -0.65]].forEach(([x, z]) => {
    const ac = createRoofAC(0xCBD0DE);
    ac.position.set(x, roofTopY, z);
    building.add(ac);
  });

  const vent = createRoofVent();
  vent.position.set(-0.85, roofTopY, 0.55);
  building.add(vent);

  [[0.65, 0.3], [0.65, 0.75]].forEach(([x, z]) => {
    const chimney = createRoofChimney();
    chimney.position.set(x, roofTopY, z);
    chimney.rotation.y = Math.PI;
    building.add(chimney);
  });

  const rooms = [
    { mesh: empresaRoom, idx: ROOM_LAYOUT.empresa.frame, openMats: floor0OpenMats },
    { mesh: medicoRoom, idx: ROOM_LAYOUT.medico.frame, openMats: floor1OpenMats },
    { mesh: clinicaRoom, idx: ROOM_LAYOUT.clinica.frame, openMats: floor2OpenMats }
  ];

  return { revealRooms: rooms, entranceParts };
}

export default createBuilding;

