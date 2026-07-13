import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';
import { SIDEWALK_THICKNESS, SIDEWALK_WIDTH } from './sidewalk.js';

const { COL, buildDoor, buildEntrancePortal, box } = geometry;

function createEntrance(building, BUILD_D){
  // Pórtico de entrada azul em U invertido que envolve a porta
  const portal = buildEntrancePortal(1.4, 1.85, 0.14, 0.2, COL.navy);
  portal.position.set(0, 0.02, BUILD_D / 2 + 0.01);
  building.add(portal);

  // Porta de correr de vidro recuada
  const entrance = buildDoor(1.1, 1.75);
  entrance.position.set(0, 0.025, BUILD_D / 2 + 0.06);
  building.add(entrance);

  // Vasos de plantas de terracota decorativos nas laterais da entrada
  const potColor = 0xC1440E; // Terracota
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3D8B5E, roughness: 0.75 });

  function makeTropicalPot(px, py, pz) {
    const potMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.11, 0.26, 12),
      new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.88 })
    );
    potMesh.position.set(px, py, pz);
    building.add(potMesh);

    // 11 bolinhas (esferas) formando a copa arredondada do vaso
    const lumps = [
      { r: 0.16, x:  0.00, y: 0.22, z:  0.00 }, // Centro inferior
      { r: 0.15, x:  0.00, y: 0.35, z:  0.00 }, // Topo
      { r: 0.12, x:  0.11, y: 0.25, z:  0.08 },
      { r: 0.12, x: -0.10, y: 0.26, z: -0.09 },
      { r: 0.11, x: -0.12, y: 0.24, z:  0.07 },
      { r: 0.12, x:  0.09, y: 0.23, z: -0.10 },
      { r: 0.10, x:  0.07, y: 0.33, z:  0.07 },
      { r: 0.09, x: -0.08, y: 0.31, z: -0.06 },
      { r: 0.09, x:  0.10, y: 0.28, z: -0.05 },
      { r: 0.11, x: -0.05, y: 0.32, z:  0.09 },
      { r: 0.08, x:  0.02, y: 0.36, z: -0.07 },
    ];
    lumps.forEach(l => {
      const lump = new THREE.Mesh(new THREE.SphereGeometry(l.r, 10, 8), leafMat);
      lump.position.set(px + l.x, py + l.y, pz + l.z);
      lump.castShadow = true;
      building.add(lump);
    });
  }

  makeTropicalPot(-0.95, 0.13, BUILD_D / 2 + 0.24);
  makeTropicalPot( 0.95, 0.13, BUILD_D / 2 + 0.24);

  // Totem da Placa "SaúdeSeg+" (Letreiro de Chão)
  const signGroup = new THREE.Group();
  signGroup.name = 'brandGroundSign';
  
  // 1. Pés da placa
  const legGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.11, 12);
  const legMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.name = 'brandSignFootLeft';
  leftLeg.position.set(-0.3, 0.055, 0);
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.name = 'brandSignFootRight';
  rightLeg.position.set(0.3, 0.055, 0);
  signGroup.add(leftLeg, rightLeg);

  // 2. Borda azul escura do painel
  const boardW = 1.18;
  const boardH = 0.46;
  const boardD = 0.1;
  const boardY = 0.11 + boardH / 2;
  
  const borderShape = geometry.roundedRectShape(boardW, boardH, 0.12);
  const borderGeo = new THREE.ExtrudeGeometry(borderShape, { depth: boardD, bevelEnabled: false, curveSegments: 16 });
  borderGeo.translate(0, 0, -boardD / 2); // Centraliza no eixo Z
  const boardBorder = new THREE.Mesh(borderGeo, new THREE.MeshStandardMaterial({ color: COL.navyDark, roughness: 0.7 }));
  boardBorder.name = 'brandSignBorder';
  boardBorder.position.set(0, boardY, 0);
  signGroup.add(boardBorder);

  // 3. Fundo branco do painel
  const whiteShape = geometry.roundedRectShape(boardW - 0.08, boardH - 0.08, 0.08);
  const whiteGeo = new THREE.ExtrudeGeometry(whiteShape, { depth: boardD + 0.01, bevelEnabled: false, curveSegments: 16 });
  whiteGeo.translate(0, 0, -(boardD + 0.01) / 2); // Centraliza no eixo Z
  const boardWhite = new THREE.Mesh(whiteGeo, new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 }));
  boardWhite.name = 'brandSignFace';
  boardWhite.position.set(0, boardY, 0);
  signGroup.add(boardWhite);

  // 4. Texto em Canvas "SaudeSeg"
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 256);
  ctx.font = '800 145px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1F1E42'; // navyDark
  ctx.fillText('SaudeSeg', 455, 136);

  const textTex = new THREE.CanvasTexture(canvas);
  textTex.anisotropy = 16;
  const textMat = new THREE.MeshStandardMaterial({ map: textTex, transparent: true, roughness: 0.4 });
  const textPlaneFront = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), textMat);
  textPlaneFront.name = 'brandSignTextFront';
  textPlaneFront.position.set(0, boardY, boardD / 2 + 0.006);
  signGroup.add(textPlaneFront);
  
  const textPlaneBack = textPlaneFront.clone();
  textPlaneBack.rotation.y = Math.PI;
  textPlaneBack.position.set(0, boardY, -(boardD / 2 + 0.006));
  signGroup.add(textPlaneBack);

  // 5. O sinal de "+" em 3D (que brilhará com a accent color)
  const plusMat = new THREE.MeshStandardMaterial({ color: COL.accent, emissive: COL.accent, emissiveIntensity: 0.8 });
  const plusShape = new THREE.Shape();
  const pt = 0.025, pl = 0.08;
  plusShape.moveTo(-pt, pt); plusShape.lineTo(-pl, pt); plusShape.lineTo(-pl, -pt);
  plusShape.lineTo(-pt, -pt); plusShape.lineTo(-pt, -pl); plusShape.lineTo(pt, -pl);
  plusShape.lineTo(pt, -pt); plusShape.lineTo(pl, -pt); plusShape.lineTo(pl, pt);
  plusShape.lineTo(pt, pt); plusShape.lineTo(pt, pl); plusShape.lineTo(-pt, pl);
  plusShape.closePath();
  
  const plusGeo = new THREE.ExtrudeGeometry(plusShape, { depth: 0.015, bevelEnabled: false });
  // O sinal da frente
  const sign = new THREE.Mesh(plusGeo, plusMat);
  sign.position.set(0.41, boardY, boardD / 2 + 0.005);
  signGroup.add(sign);
  // O sinal de trás
  const signBack = new THREE.Mesh(plusGeo, plusMat);
  signBack.position.set(-0.40, boardY, -(boardD / 2 + 0.020));
  signBack.rotation.y = Math.PI;
  signGroup.add(signBack);

  // Posição no chão da calçada, à direita
  signGroup.position.set(1.25, SIDEWALK_THICKNESS, BUILD_D / 2 + SIDEWALK_WIDTH - 0.25);
  signGroup.rotation.y = -Math.PI / 14;
  building.add(signGroup);

  const accentLight = new THREE.PointLight(COL.accent, 0.55, 9);
  accentLight.position.set(0, 1.6, 3.2);
  building.add(accentLight);

  return { sign, accentLight };
}

export default createEntrance;

