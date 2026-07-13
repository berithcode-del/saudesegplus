import * as THREE from '../vendor/three.module.js';

const COL = {
  navy: 0x2B2A55,
  navyDark: 0x1F1E42,
  cream: 0xFBFAF6,
  creamDark: 0xEFEDE4,
  accent: 0x5B4FE5,
  accentSoft: 0x8B7CF6,
  warm: 0xFF8A65,
  asphalt: 0x3A3A4A,
  glassA: 0xB8C9E8,  // vidro neutro azul-claro (antes laranja 0xE9825A)
  glassB: 0xC5D2F0,  // vidro neutro azul-acinzentado (antes roxo 0x6E62F0)
  green: 0x4F9E6E,
  greenTrunk: 0x6B4A34
};

const SKIN = 0xF3D2B3;

function roundedBoxEdges(mesh, color, opacity){
  const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: opacity === undefined ? 0.35 : opacity
  }));
  mesh.add(line);
}

function box(w, h, d, color, opts){
  opts = opts || {};
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness === undefined ? 0.75 : opts.roughness,
    metalness: opts.metalness || 0.05
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (opts.edges !== false) roundedBoxEdges(m, opts.edgeColor || 0x14142B, opts.edgeOpacity);
  return m;
}

function roundedRectShape(w, h, r){
  r = Math.min(r, w/2, h/2);
  const s = new THREE.Shape();
  const x = -w/2, y = -h/2;
  s.moveTo(x, y+r);
  s.lineTo(x, y+h-r);
  s.quadraticCurveTo(x, y+h, x+r, y+h);
  s.lineTo(x+w-r, y+h);
  s.quadraticCurveTo(x+w, y+h, x+w, y+h-r);
  s.lineTo(x+w, y+r);
  s.quadraticCurveTo(x+w, y, x+w-r, y);
  s.lineTo(x+r, y);
  s.quadraticCurveTo(x, y, x, y+r);
  return s;
}

function carvedBuildingShape(w, d, r, cut, corner){
  const s = new THREE.Shape();
  const x = -w/2, y = -d/2;
  //
  // ATENÇÃO: Após rotateX(-PI/2), shape-Y vira world -Z.
  // Portanto o mapeamento shape -> world é:
  //   shape bottom-left  (-x, -y)  =  world (-x, +z)
  //   shape bottom-right (+x, -y)  =  world (+x, +z)
  //   shape top-right    (+x, +y)  =  world (+x, -z)
  //   shape top-left     (-x, +y)  =  world (-x, -z)
  
  // 1. Inicia no Bottom-Left = world (-x, +z)
  if (corner === '-x+z') {   // <-- mundo -x+z = shape bottom-left
    s.moveTo(x + cut, y);
  } else {
    s.moveTo(x + r, y);
  }
  
  // 2. Borda inferior -> Bottom-Right = world (+x, +z)
  if (corner === '+x+z') {
    s.lineTo(x + w - cut, y);
    s.lineTo(x + w - cut, y + cut);
    s.lineTo(x + w, y + cut);
  } else {
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
  }
  
  // 3. Borda direita -> Top-Right = world (+x, -z)
  if (corner === '+x-z') {
    s.lineTo(x + w, y + d - cut);
    s.lineTo(x + w - cut, y + d - cut);
    s.lineTo(x + w - cut, y + d);
  } else {
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  }
  
  // 4. Borda superior -> Top-Left = world (-x, -z)
  if (corner === '-x-z') {
    s.lineTo(x + cut, y + d);
    s.lineTo(x + cut, y + d - cut);
    s.lineTo(x, y + d - cut);
  } else {
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
  }
  
  // 5. Borda esquerda -> fecha no Bottom-Left = world (-x, +z)
  if (corner === '-x+z') {
    s.lineTo(x, y + cut);
    s.lineTo(x + cut, y + cut);
    s.lineTo(x + cut, y);
  } else {
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
  }
  
  return s;
}

function roundedBox(w, h, d, color, opts){
  opts = opts || {};
  const r = opts.radius !== undefined ? opts.radius : Math.min(w, d) * 0.26;
  const bevel = Math.min(opts.bevel !== undefined ? opts.bevel : h * 0.32, h/2 - 0.001, r * 0.9);
  const shape = roundedRectShape(w, d, r);
  const depth = Math.max(0.002, h - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: opts.segments || 6,
    curveSegments: opts.curveSegments || 12
  });
  geo.translate(0, 0, -(h/2 - bevel));
  geo.rotateX(-Math.PI/2);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness === undefined ? 0.7 : opts.roughness,
    metalness: opts.metalness || 0.05
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (opts.edges !== false) roundedBoxEdges(m, opts.edgeColor || 0x14142B, opts.edgeOpacity === undefined ? 0.22 : opts.edgeOpacity);
  return m;
}

function windowPanel(w, h, r, color, opts){
  opts = opts || {};
  const geo = new THREE.ShapeGeometry(roundedRectShape(w, h, r), opts.segments || 12);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: opts.emissiveIntensity === undefined ? 0.5 : opts.emissiveIntensity,
    transparent: true,
    opacity: opts.opacity === undefined ? 0.55 : opts.opacity,
    roughness: 0.22,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(geo, mat);
}

function doorShape(w, h){
  const s = new THREE.Shape();
  const hw = w/2, r = hw;
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h-r);
  s.quadraticCurveTo(-hw, h, -hw+r, h);
  s.lineTo(hw-r, h);
  s.quadraticCurveTo(hw, h, hw, h-r);
  s.lineTo(hw, 0);
  s.lineTo(-hw, 0);
  return s;
}

function buildDoor(w, h){
  const g = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.ShapeGeometry(doorShape(w + 0.14, h + 0.09), 28),
    new THREE.MeshStandardMaterial({ color: COL.navyDark, roughness: 0.5 })
  );
  g.add(frame);
  const glass = new THREE.Mesh(
    new THREE.ShapeGeometry(doorShape(w, h), 28),
    new THREE.MeshStandardMaterial({
      color: 0xBFD3F5,
      transparent: true,
      opacity: 0.5,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
  );
  glass.position.z = 0.015;
  g.add(glass);
  const mullion = new THREE.Mesh(
    new THREE.PlaneGeometry(0.035, h),
    new THREE.MeshStandardMaterial({ color: COL.navyDark })
  );
  mullion.position.set(0, h/2, 0.02);
  g.add(mullion);
  [-0.17, 0.17].forEach(x => {
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6),
      new THREE.MeshStandardMaterial({ color: 0xD8DCE6, metalness: 0.6, roughness: 0.3 })
    );
    handle.rotation.z = Math.PI/2;
    handle.position.set(x, h * 0.42, 0.028);
    g.add(handle);
  });
  return g;
}

// Builds one floor's windows. The two "open" faces (the ones facing the
// revealed corner room) each get a pane pulled toward the corner they share,
// so together they read as a single wraparound "janela de canto" hugging the
// building's rounded edge. The two closed faces get a pair of smaller
// ambient windows instead of one big blank pane, which fits the reference
// look better than a single centered window per wall.
function createFramedWindow(w, h, r, glassColor, frameColor, isAmbient) {
  const g = new THREE.Group();
  
  const frameThickness = 0.05;
  const frameDepth = 0.04;
  
  const frameShape = roundedRectShape(w, h, r);
  const innerR = Math.max(0.01, r - frameThickness);
  const hole = roundedRectShape(w - frameThickness * 2, h - frameThickness * 2, innerR);
  frameShape.holes.push(hole);
  
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: frameDepth,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    curveSegments: 12
  });
  frameGeo.translate(0, 0, -frameDepth / 2);
  
  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor || 0x1F1E42,
    roughness: 0.65,
    metalness: 0.1
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  g.add(frameMesh);
  
  const glassGeo = new THREE.ShapeGeometry(roundedRectShape(w - frameThickness * 0.8, h - frameThickness * 0.8, Math.max(0.01, r - frameThickness * 0.4)), 12);
  const glassMat = new THREE.MeshStandardMaterial({
    color: glassColor,
    emissive: glassColor,
    emissiveIntensity: isAmbient ? 0.25 : 0.5,
    transparent: true,
    opacity: isAmbient ? 0.6 : 0.85,
    roughness: 0.15,
    metalness: 0.5,
    side: THREE.DoubleSide
  });
  glassMat.userData.closedOpacity = glassMat.opacity;
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.z = 0.01;
  g.add(glassMesh);
  
  return { group: g, glassMat };
}

function createCurvedCornerWindow(winH, glassColor) {
  const g = new THREE.Group();
  
  // Ro: raio da curva da janela (deve combinar com o raio do prédio ~0.65)
  // legL: comprimento de cada "perna" da janela ao longo da parede
  //        = halfW - Ro = 2.15 - 0.55 = 1.60, cobrindo da quina até o centro da face
  const Ro = 0.55;
  const Ri = Ro - 0.055;
  const legL = 1.60;
  const frameThickness = 0.055;
  
  // 1. Moldura superior e inferior seguindo a curva para o interior
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-legL, Ro);
  frameShape.lineTo(0, Ro);
  frameShape.absarc(0, 0, Ro, Math.PI/2, 0, true);
  frameShape.lineTo(Ro, -legL);
  frameShape.lineTo(Ri, -legL);
  frameShape.lineTo(Ri, 0);
  frameShape.absarc(0, 0, Ri, 0, Math.PI/2, false);
  frameShape.lineTo(-legL, Ri);
  frameShape.closePath();
  
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: frameThickness,
    bevelEnabled: false
  });
  frameGeo.rotateX(-Math.PI/2);
  
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1F1E42, roughness: 0.65 });
  
  const topFrame = new THREE.Mesh(frameGeo, frameMat);
  topFrame.position.y = winH - frameThickness;
  g.add(topFrame);
  
  const bottomFrame = new THREE.Mesh(frameGeo, frameMat);
  bottomFrame.position.y = 0;
  g.add(bottomFrame);
  
  // 2. Vidro curvo cobrindo toda a abertura da janela
  const glassShape = new THREE.Shape();
  const Rg = Ro - 0.025;
  const RgInner = Rg - 0.01;
  glassShape.moveTo(-legL, Rg);
  glassShape.lineTo(0, Rg);
  glassShape.absarc(0, 0, Rg, Math.PI/2, 0, true);
  glassShape.lineTo(Rg, -legL);
  glassShape.lineTo(RgInner, -legL);
  glassShape.lineTo(RgInner, 0);
  glassShape.absarc(0, 0, RgInner, 0, Math.PI/2, false);
  glassShape.lineTo(-legL, RgInner);
  glassShape.closePath();
  
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: winH - frameThickness * 2,
    bevelEnabled: false
  });
  glassGeo.rotateX(-Math.PI/2);
  
  const glassMat = new THREE.MeshStandardMaterial({
    color: glassColor,
    emissive: glassColor,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.45,
    roughness: 0.08,
    metalness: 0.92,
    side: THREE.DoubleSide
  });
  glassMat.userData.closedOpacity = glassMat.opacity;
  
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.y = frameThickness;
  g.add(glassMesh);
  
  // 3. Montantes verticais nas extremidades das pernas e na quina
  const vertFrameGeo = new THREE.BoxGeometry(frameThickness, winH - frameThickness * 2, frameThickness);
  
  // Extremidade da perna esquerda (onde o vidro encontra a parede sólida)
  // No shape 2D: X = -legL, Y = Ro. No 3D (Y -> -Z): X = -legL, Z = -Ro
  const leftVert = new THREE.Mesh(vertFrameGeo, frameMat);
  leftVert.position.set(-legL + frameThickness/2, winH/2, -Ro + frameThickness/2);
  g.add(leftVert);
  
  // Extremidade da perna direita
  // No shape 2D: X = Ro, Y = -legL. No 3D (Y -> -Z): X = Ro, Z = legL
  const rightVert = new THREE.Mesh(vertFrameGeo, frameMat);
  rightVert.position.set(Ro - frameThickness/2, winH/2, legL - frameThickness/2);
  g.add(rightVert);
  
  // Montante no meio da curva (divisa visual na quina)
  const mullionGeo = new THREE.CylinderGeometry(0.025, 0.025, winH - frameThickness * 2, 8);
  const mullion = new THREE.Mesh(mullionGeo, frameMat);
  // O arco está no quadrante (+X, +Y) do shape, que vira (+X, -Z) no mundo após rotateX(-PI/2)
  mullion.position.set(Rg * 0.707, winH/2, -Rg * 0.707);
  g.add(mullion);
  
  return { group: g, glassMat };
}


function addFloorWindows(parent, w, d, h, y, openDirs, glassWarm, glassCool, imageUrl){
  const halfW = w / 2, halfD = d / 2;
  const cornerW = Math.min(w, d) * 0.5;
  const winH = h * 0.66;
  const r = Math.min(cornerW, winH) * 0.24;
  const gap = 0.035;

  const openMats = [];

  const biasX = openDirs.includes('+x') ? 1 : (openDirs.includes('-x') ? -1 : 0);
  const biasZ = openDirs.includes('+z') ? 1 : (openDirs.includes('-z') ? -1 : 0);

  // 1. Cria a janela curva de esquina
  const color = (biasX === 1) ? glassWarm : glassCool; 
  const curvedWin = createCurvedCornerWindow(winH, color);
  
  const Ro = 0.55;
  const cx = biasX * (halfW - Ro);
  const cz = biasZ * (halfD - Ro);
  curvedWin.group.position.set(cx, y - winH/2, cz);
  
  if (biasX === 1 && biasZ === 1)   curvedWin.group.rotation.y = -Math.PI / 2; // +x+z: arco aponta para +X,+Z
  else if (biasX === -1 && biasZ === 1) curvedWin.group.rotation.y = Math.PI;       // -x+z: arco aponta para -X,+Z (empresa)
  else if (biasX === -1 && biasZ === -1) curvedWin.group.rotation.y = Math.PI / 2;  // -x-z: arco aponta para -X,-Z
  else if (biasX === 1 && biasZ === -1)  curvedWin.group.rotation.y = 0;             // +x-z: arco aponta para +X,-Z
  
  parent.add(curvedWin.group);
  openMats.push(curvedWin.glassMat);

  // 2. Janelas secundárias nas paredes fechadas
  const allDirs = ['+z', '-z', '+x', '-x'];
  const closedDirs = allDirs.filter(dir => !openDirs.includes(dir));
  
  closedDirs.forEach(dir => {
    const color = (dir === '+z' || dir === '-x') ? glassWarm : glassCool;
    const smallW = cornerW * 0.6;
    const spacing = smallW * 0.9;
    
    function place(win, dir, offset){
      if (dir === '+z'){ win.position.set(offset, y, halfD + gap); win.rotation.y = 0; }
      else if (dir === '-z'){ win.position.set(offset, y, -halfD - gap); win.rotation.y = Math.PI; }
      else if (dir === '+x'){ win.position.set(halfW + gap, y, offset); win.rotation.y = Math.PI / 2; }
      else { win.position.set(-halfW - gap, y, offset); win.rotation.y = -Math.PI / 2; }
    }

    [-1, 1].forEach(side => {
      const framed = createFramedWindow(smallW, winH, r * 0.8, color, 0x1F1E42, true);
      place(framed.group, dir, side * spacing);
      parent.add(framed.group);
    });
  });

  return openMats;
}

function roundedColumn(w, h, d, color, opts){
  opts = opts || {};
  const r = opts.radius !== undefined ? opts.radius : Math.min(w, d) * 0.26;
  const shape = opts.carvedCorner ? carvedBuildingShape(w, d, r, 2.15, opts.carvedCorner) : roundedRectShape(w, d, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: opts.curveSegments || 12
  });
  geo.translate(0, 0, -h/2);
  geo.rotateX(-Math.PI/2);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness === undefined ? 0.7 : opts.roughness,
    metalness: opts.metalness || 0.05
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (opts.edges !== false) roundedBoxEdges(m, opts.edgeColor || 0x14142B, opts.edgeOpacity === undefined ? 0.22 : opts.edgeOpacity);
  return m;
}

function createRoofAC(colorBase, colorDetail) {
  const g = new THREE.Group();
  const base = box(0.45, 0.3, 0.45, colorBase || 0xCBD0DE, { roughness: 0.4, metalness: 0.3, edges: false });
  base.position.y = 0.04 + 0.15;
  g.add(base);
  
  const fanGrid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
  );
  fanGrid.position.set(0, 0.34 + 0.01, 0);
  g.add(fanGrid);

  const fanCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.024, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  fanCenter.position.set(0, 0.34 + 0.012, 0);
  g.add(fanCenter);

  const foot1 = box(0.45, 0.04, 0.06, 0x333333, { edges: false, roughness: 0.8 });
  foot1.position.set(0, 0.02, -0.18);
  const foot2 = box(0.45, 0.04, 0.06, 0x333333, { edges: false, roughness: 0.8 });
  foot2.position.set(0, 0.02, 0.18);
  g.add(foot1, foot2);
  
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 })
  );
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0.12, 0.19, -0.26);
  g.add(pipe);

  return g;
}

function createRoofVent() {
  const g = new THREE.Group();
  const body = box(0.5, 0.22, 0.32, 0x9094A0, { metalness: 0.5, roughness: 0.4, edges: false });
  body.position.y = 0.11;
  g.add(body);
  
  for (let i = -0.06; i <= 0.06; i += 0.04) {
    const slat = box(0.44, 0.015, 0.33, 0x2A2B30, { edges: false, roughness: 0.9 });
    slat.position.set(0, 0.11 + i, 0);
    g.add(slat);
  }
  
  return g;
}

function createRoofChimney() {
  const g = new THREE.Group();
  const pipeV = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x9094A0, metalness: 0.6, roughness: 0.4 })
  );
  pipeV.position.y = 0.175;
  g.add(pipeV);

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0x808490, metalness: 0.6, roughness: 0.4 })
  );
  head.rotation.x = Math.PI / 2;
  head.position.set(0, 0.35, 0.04);
  g.add(head);

  return g;
}

function entrancePortalShape(w, h, thickness) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const r = thickness;
  
  s.moveTo(hw, 0);
  s.lineTo(hw, h - r);
  s.quadraticCurveTo(hw, h, hw - r, h);
  s.lineTo(-hw + r, h);
  s.quadraticCurveTo(-hw, h, -hw, h - r);
  s.lineTo(-hw, 0);
  
  const hole = new THREE.Path();
  const ihw = hw - thickness;
  const ih = h - thickness;
  const ir = Math.max(0.01, r - thickness * 0.5);
  
  hole.moveTo(-ihw, 0);
  hole.lineTo(-ihw, ih - ir);
  hole.quadraticCurveTo(-ihw, ih, -ihw + ir, ih);
  hole.lineTo(ihw - ir, ih);
  hole.quadraticCurveTo(ihw, ih, ihw, ih - ir);
  hole.lineTo(ihw, 0);
  
  s.holes.push(hole);
  return s;
}

function buildEntrancePortal(w, h, thickness, depth, color) {
  const shape = entrancePortalShape(w, h, thickness);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 4,
    curveSegments: 16
  });
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.6,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export default {
  COL,
  SKIN,
  box,
  roundedBox,
  roundedColumn,
  windowPanel,
  buildDoor,
  addFloorWindows,
  roundedRectShape,
  doorShape,
  roundedBoxEdges,
  createRoofAC,
  createRoofVent,
  createRoofChimney,
  buildEntrancePortal
};

