import * as THREE from '../vendor/three.module.js';

// ---------------------------------------------------------------------------
// GROUND / BASE REFERENCE
// ---------------------------------------------------------------------------
// The rest of the scene (building shell, trees, cars, benches, ramp...)
// already assumes "the floor" is at y = GROUND_Y = 0. The base disc, though,
// is built with ExtrudeGeometry + bevel, and the bevel math pushes the
// shape's flat top face away from y = 0 (it was landing around y = 2.28, not
// 0) — that's why the building/props were sinking into, or floating above,
// the disc instead of resting cleanly on top of it.
//
// Fix: after building the geometry we measure its real bounding box and
// translate it so the TOP FACE (the flat surface people/props stand on) is
// pinned exactly to y = GROUND_Y. Any future tweak to bevel/radius/height
// keeps working, since we no longer hand-guess the offset.
//
// Any new module (sidewalk, extra props, etc.) should build "up" from
// GROUND_Y, and can import BASE_RADIUS to know how wide the disc is.
export const GROUND_Y = 0;
export const BASE_RADIUS = 7.4;
export const BASE_HEIGHT = 1.0;
const BEVEL = 0.28;

function createGround(building){
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3A3A3A,
    roughness: 0.95,
    metalness: 0.05
  });

  const shape = new THREE.Shape();
  shape.moveTo(BASE_RADIUS, 0);
  shape.absarc(0, 0, BASE_RADIUS, 0, Math.PI, false);
  shape.absarc(0, 0, BASE_RADIUS, Math.PI, Math.PI * 2, false);
  shape.closePath();

  const discGeo = new THREE.ExtrudeGeometry(shape, {
    depth: BASE_HEIGHT,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 16,
    curveSegments: 64
  });
  discGeo.rotateX(-Math.PI / 2);

  // Snap the top face to GROUND_Y using the real geometry bounds, instead of
  // trusting a manually-guessed offset.
  discGeo.computeBoundingBox();
  const topY = discGeo.boundingBox.max.y;
  discGeo.translate(0, GROUND_Y - topY, 0);

  const base = new THREE.Mesh(discGeo, baseMat);
  base.receiveShadow = true;
  base.castShadow = true;
  base.name = 'groundBase';
  building.add(base);

  // Rampa de acesso removida (era estranha na visual isométrica)
  // A escada em entrance.js já faz essa função

  // Demarcações de pintura no asfalto (estacionamento)
  const markings = new THREE.Group();
  markings.name = 'roadMarkings';
  markings.position.y = GROUND_Y + 0.002; // Evita z-fighting com o asfalto
  building.add(markings);

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xEBEFF5,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  // Vagas perpendiculares no quadrante esquerdo do prédio (Face -X)
  // Centralizado no eixo Z (-1.575 a 1.575) para encaixar perfeitamente na lateral
  const X_ORIG = -5.15;
  const Z_ORIG = -1.575;
  const lineLength = 1.8;
  const lineWidth = 0.05;
  const spacing = 1.05;

  // 4 faixas brancas = 3 vagas
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(lineWidth, lineLength),
      lineMat
    );
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = -Math.PI / 2; // Linhas apontam no eixo X (perpendiculares à parede)

    const px = X_ORIG;
    const pz = Z_ORIG + (i * spacing);

    line.position.set(px, 0, pz);
    markings.add(line);
  }

  // Linha traseira de fechamento das vagas
  const backLine = new THREE.Mesh(
    new THREE.PlaneGeometry(lineWidth, spacing * 3),
    lineMat
  );
  backLine.rotation.x = -Math.PI / 2;
  backLine.rotation.z = 0; // Linha de fundo paralela ao eixo Z
  const bx = X_ORIG - (lineLength / 2);
  const bz = Z_ORIG + (spacing * 1.5);
  backLine.position.set(bx, 0, bz);
  markings.add(backLine);

  // Símbolo de acessibilidade (cadeirante) na 1ª vaga (mais perto da frente/Z=0)
  const vx = X_ORIG;
  const vz = Z_ORIG + (0.5 * spacing);

  const wheelchair = new THREE.Group();
  wheelchair.position.set(vx, 0, vz);
  wheelchair.rotation.y = Math.PI / 2; // Virado para o prédio
  markings.add(wheelchair);


  // Cabeça do cadeirante
  const head = new THREE.Mesh(
    new THREE.RingGeometry(0, 0.035, 12),
    lineMat
  );
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 0, -0.22);
  wheelchair.add(head);

  // Roda
  const wheel = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 16, 1, -Math.PI * 0.25, Math.PI * 1.5),
    lineMat
  );
  wheel.rotation.x = -Math.PI / 2;
  wheel.position.set(-0.02, 0, -0.09);
  wheelchair.add(wheel);

  // Tronco/Espinha
  const spine = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.12), lineMat);
  spine.rotation.x = -Math.PI / 2;
  spine.rotation.z = -0.3;
  spine.position.set(-0.01, 0, -0.15);
  wheelchair.add(spine);

  // Braço
  const arm = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.07), lineMat);
  arm.rotation.x = -Math.PI / 2;
  arm.rotation.z = -0.6;
  arm.position.set(0.02, 0, -0.13);
  wheelchair.add(arm);

  // Perna/Assento
  const leg = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.08), lineMat);
  leg.rotation.x = -Math.PI / 2;
  leg.rotation.z = 0.8;
  leg.position.set(0.03, 0, -0.08);
  wheelchair.add(leg);

  const crosswalk = new THREE.Group();
  crosswalk.name = 'frontCrosswalk';
  crosswalk.position.set(0, 0.001, 5.08);
  markings.add(crosswalk);

  for (let i = 0; i < 5; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.12, 0.15),
      lineMat
    );
    stripe.name = `frontCrosswalkStripe${i}`;
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0, (i - 2) * 0.32);
    crosswalk.add(stripe);
  }

  return { groundY: GROUND_Y, radius: BASE_RADIUS };
}

export default createGround;

