import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';
import { GROUND_Y } from './ground.js';

const { roundedRectShape } = geometry;

// ---------------------------------------------------------------------------
// SIDEWALK ("calçada")
// ---------------------------------------------------------------------------
// A rounded-corner paved ring that hugs the building footprint, sitting on
// top of the asphalt disc (GROUND_Y). It's built as a single flat shape with
// a rectangular hole cut out where the building stands, so the building's
// own base (ground.js's shell) drops in flush with no gap or z-fighting.
//
// The ring sits slightly ABOVE the asphalt disc (a small curb step), which
// reads correctly next to the existing access ramp in ground.js.

export const SIDEWALK_WIDTH = 1.25;
export const SIDEWALK_THICKNESS = 0.11;
export const CURB_HEIGHT = 0.16;
const BRICK_WORLD_SIZE = 0.8;

function createBrickTexture(){
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');

  // mortar / base tone (cinza cimento mais escuro)
  ctx.fillStyle = '#777B84';
  ctx.fillRect(0, 0, S, S);

  const brickW = 128, brickH = 58, gap = 6;
  let row = 0;
  for (let y = -brickH; y < S + brickH; y += brickH){
    const offset = (row % 2 === 0) ? 0 : brickW / 2;
    for (let x = -brickW; x < S + brickW; x += brickW){
      const bx = x + offset;
      const shade = 0.86 + Math.random() * 0.24;
      const r = Math.round(142 * shade);
      const g = Math.round(145 * shade);
      const b = Math.round(150 * shade);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(bx + gap / 2, y + gap / 2, brickW - gap, brickH - gap);
    }
    row++;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function createSidewalk(building, footprintW, footprintD, opts){
  opts = opts || {};
  const width = opts.width !== undefined ? opts.width : SIDEWALK_WIDTH;
  const thickness = opts.thickness !== undefined ? opts.thickness : SIDEWALK_THICKNESS;

  const outerW = footprintW + width * 2;
  const outerD = footprintD + width * 2;
  const outerR = Math.min(outerW, outerD) * 0.14;
  const innerR = Math.max(outerR - width * 0.7, 0.06);

  function createExtrudedRing(outerWidth, outerDepth, innerWidth, innerDepth, height, color, name){
    const radius = Math.min(outerWidth, outerDepth) * 0.14;
    const shape = roundedRectShape(outerWidth, outerDepth, radius);
    shape.holes.push(roundedRectShape(
      innerWidth,
      innerDepth,
      Math.max(0.04, radius - (outerWidth - innerWidth) / 2)
    ));
    const ringGeo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 32
    });
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.computeBoundingBox();
    ringGeo.translate(0, GROUND_Y - ringGeo.boundingBox.min.y, 0);
    const mesh = new THREE.Mesh(
      ringGeo,
      new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0.01 })
    );
    mesh.name = name;
    mesh.receiveShadow = true;
    building.add(mesh);
    return mesh;
  }

  createExtrudedRing(
    outerW + 0.22,
    outerD + 0.22,
    outerW - 0.04,
    outerD - 0.04,
    CURB_HEIGHT,
    0xB8B6B0,
    'sidewalkCurb'
  );

  const roadLine = createExtrudedRing(
    outerW + 0.56,
    outerD + 0.56,
    outerW + 0.44,
    outerD + 0.44,
    0.008,
    0xF3F1E9,
    'sidewalkRoadLine'
  );
  roadLine.material.emissive.setHex(0xE8E6DE);
  roadLine.material.emissiveIntensity = 0.08;

  const outerShape = roundedRectShape(outerW, outerD, outerR);
  const innerHole = roundedRectShape(footprintW, footprintD, innerR);
  outerShape.holes.push(innerHole);

  const geo = new THREE.ExtrudeGeometry(outerShape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 32
  });
  geo.rotateX(-Math.PI / 2);

  // Rest the sidewalk's BOTTOM face on the asphalt disc (GROUND_Y), so it
  // reads as a slab paved on top of it, rather than sunk into it.
  geo.computeBoundingBox();
  const bottomY = geo.boundingBox.min.y;
  geo.translate(0, GROUND_Y - bottomY, 0);

  const brickTex = createBrickTexture();
  brickTex.repeat.set(outerW / BRICK_WORLD_SIZE, outerD / BRICK_WORLD_SIZE);

  const mat = new THREE.MeshStandardMaterial({
    map: brickTex,
    roughness: 0.92,
    metalness: 0.02
  });

  const sidewalk = new THREE.Mesh(geo, mat);
  sidewalk.name = 'sidewalk';
  sidewalk.receiveShadow = true;
  sidewalk.castShadow = false;
  building.add(sidewalk);

  const joints = new THREE.Group();
  joints.name = 'sidewalkExpansionJoints';
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x666A72, roughness: 0.96 });
  const sideCenter = footprintW / 2 + width / 2;
  const frontCenter = footprintD / 2 + width / 2;
  [-1.25, 0, 1.25].forEach((offset) => {
    [-1, 1].forEach((side) => {
      const frontJoint = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.006, width * 0.82), jointMat);
      frontJoint.position.set(offset, GROUND_Y + thickness + 0.003, side * frontCenter);
      joints.add(frontJoint);

      const sideJoint = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.006, 0.018), jointMat);
      sideJoint.position.set(side * sideCenter, GROUND_Y + thickness + 0.003, offset);
      joints.add(sideJoint);
    });
  });
  building.add(joints);

  return { mesh: sidewalk, outerW, outerD, width, thickness, curbHeight: CURB_HEIGHT };
}

export default createSidewalk;

