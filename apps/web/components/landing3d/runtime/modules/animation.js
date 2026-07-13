import * as THREE from '../vendor/three.module.js';

export const ACCENT_HEX = [0x4F46E5, 0x4F46E5, 0x16A34A, 0xF59E0B, 0x14B8A6, 0x5B4FE5, 0x4F46E5];

export function sph(radius, elevDeg, azimDeg, targetY){
  const e = elevDeg * Math.PI / 180, a = azimDeg * Math.PI / 180;
  return [
    Math.cos(e) * Math.cos(a) * radius,
    targetY + Math.sin(e) * radius,
    Math.cos(e) * Math.sin(a) * radius
  ];
}

export const KF = [
  { sph: [15, 32, 40, 3.4], zoom: 1.0, look: [0, 3.4, 0] },
  { sph: [8.0, 20, 45, 1.1], zoom: 4.8, look: [2.15, 1.1, 2.15] },
  { sph: [8.0, 20, 135, 3.3], zoom: 4.8, look: [-2.15, 3.3, 2.15] },
  { sph: [8.0, 20, 225, 5.72], zoom: 4.8, look: [-2.15, 5.72, -2.15] },
  { sph: [7.6, 17, 34, 0.88], zoom: 4.45, look: [6.1, 0.88, 1.02] },
  { sph: [13.4, 31, 45, 3.2], zoom: 0.94, look: [0.72, 2.9, 0.72] },
  { sph: [15, 32, 400, 3.4], zoom: 1.0, look: [0, 3.4, 0] }
];

// Antes de retomar a orbita do predio, a camera recua ainda olhando a chegada em casa.
export const PATIENT_EXIT_KF = {
  at: 0.42,
  sph: [9.0, 17, 43, 1.0],
  look: [6.1, 1.0, 1.02],
  zoom: 2.55
};

export function smoothstep(t){ return t * t * (3 - 2 * t); }

export function getRoomReveal(progress, frame, radius = 0.85){
  const proximity = Math.max(0, 1 - Math.abs(progress - frame) / radius);
  return smoothstep(proximity);
}

export function getGlassOpacity(progress, frame, closedOpacity, radius = 0.85){
  return closedOpacity * (1 - getRoomReveal(progress, frame, radius));
}

export function createAnimator(opts){
  const { scene, camera, building, sign, accentLight, revealRooms, characters, effects, reduceMotion, W, H, FRUSTUM, renderer } = opts;
  const { medica, secretaria, trabalhador } = characters;
  const { rings } = effects;

  const ACCENTS = ACCENT_HEX.map(h => new THREE.Color(h));
  const curAccent = ACCENTS[0].clone();
  const tmpAccent = new THREE.Color();
  const rootStyle = document.documentElement.style;

  camera.position.set(...sph(...KF[0].sph));
  camera.lookAt(...KF[0].look);
  camera.zoom = KF[0].zoom;
  camera.updateProjectionMatrix();

  const curPos = new THREE.Vector3(...sph(...KF[0].sph));
  const curLook = new THREE.Vector3(...KF[0].look);
  let curZoom = KF[0].zoom;

  function updateAccent(p){
    const N = ACCENTS.length;
    const idx = Math.min(Math.floor(p), N - 2);
    const t = smoothstep(Math.max(0, Math.min(1, p - idx)));
    tmpAccent.copy(ACCENTS[idx]).lerp(ACCENTS[idx + 1], t);
    const damp = reduceMotion ? 1 : 0.12;
    curAccent.lerp(tmpAccent, damp);
    rootStyle.setProperty('--accent', '#' + curAccent.getHexString());
    if (sign){
      sign.material.color.copy(curAccent);
      sign.material.emissive.copy(curAccent);
    }
    if (accentLight) accentLight.color.copy(curAccent);
  }

  function updateCameraForProgress(p){
    const N = KF.length;
    const idx = Math.min(Math.floor(p), N - 2);
    const frameT = Math.max(0, Math.min(1, p - idx));
    let a = KF[idx], b = KF[idx + 1];
    let localT = frameT;

    if (idx === 4) {
      if (frameT <= PATIENT_EXIT_KF.at) {
        b = PATIENT_EXIT_KF;
        localT = frameT / PATIENT_EXIT_KF.at;
      } else {
        a = PATIENT_EXIT_KF;
        localT = (frameT - PATIENT_EXIT_KF.at) / (1 - PATIENT_EXIT_KF.at);
      }
    }

    const t = smoothstep(localT);
    
    // Interpolacao orbital evita atravessar o predio durante a transicao.
    const sA = a.sph, sB = b.sph;
    const r = sA[0] + (sB[0] - sA[0]) * t;
    const e = sA[1] + (sB[1] - sA[1]) * t;
    const az = sA[2] + (sB[2] - sA[2]) * t;
    const ty = sA[3] + (sB[3] - sA[3]) * t;
    
    const targetPos = new THREE.Vector3(...sph(r, e, az, ty));
    const targetLook = new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), t);
    const targetZoom = a.zoom + (b.zoom - a.zoom) * t;

    if (idx === 3) {
      const descentArc = Math.sin(Math.PI * t);
      targetPos.y += descentArc * 1.8;
      targetLook.y += descentArc * 0.55;
    }

    const damp = reduceMotion ? 1 : 0.085;
    curPos.lerp(targetPos, damp);
    curLook.lerp(targetLook, damp);
    curZoom += (targetZoom - curZoom) * damp;

    camera.position.copy(curPos);
    camera.lookAt(curLook);
    camera.zoom = curZoom;

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const isNarrow = W() < 640;
    const standardPan = (isNarrow ? 1.1 : 2.3) / curZoom;
    const arrivalPan = (isNarrow ? 0.45 : 0.75) / curZoom;
    const arrivalFocus = smoothstep(Math.max(0, 1 - Math.abs(p - 4) / 0.8));
    const panWorld = standardPan + (arrivalPan - standardPan) * arrivalFocus;
    camera.position.addScaledVector(right, -panWorld);
    camera.updateProjectionMatrix();
  }

  let progress = 0;
  let rawProgress = 0;

  const clock = new THREE.Clock();

  let frameId = 0;
  let disposed = false;

  function animate(){
    if (disposed) return;
    frameId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    progress += (rawProgress - progress) * (reduceMotion ? 1 : 0.09);
    updateCameraForProgress(progress);
    updateAccent(progress);

    if (!reduceMotion){
      building.rotation.y = Math.sin(t * 0.06) * 0.05;
    }

    revealRooms.forEach(({ mesh, idx, openMats }) => {
      const s = getRoomReveal(progress, idx);
      mesh.scale.setScalar(0.0001 + s * 0.9999);
      if (openMats) openMats.forEach((m) => {
        const closedOpacity = m.userData.closedOpacity ?? 0.45;
        m.opacity = getGlassOpacity(progress, idx, closedOpacity);
      });
    });

    const medicaW = smoothstep(Math.max(0, 1 - Math.abs(progress - 2) / 0.85));
    medica.scale.setScalar(0.0001 + medicaW * 0.9999);
    medica.children[0].scale.y = 1 + Math.sin(t * 1.8) * 0.015;
    const medicaHead = medica.children[8];
    if (medicaHead) medicaHead.rotation.z = Math.sin(t * 0.7) * 0.04;

    secretaria.scale.setScalar(0.0001);

    const trabW = smoothstep(Math.max(0, 1 - Math.abs(progress - 4) / 0.85));
    trabalhador.scale.setScalar(0.0001 + trabW * 0.9999);
    const patientTorso = trabalhador.getObjectByName('patientTorso');
    if (patientTorso) patientTorso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
    const coverageT = Math.max(0, Math.min(1, (progress - 4.6) / 1.0));
    rings.forEach((r, i) => {
      r.material.opacity = coverageT * 0.5;
      r.rotation.z = t * 0.05 * (i % 2 === 0 ? 1 : -1);
    });

    renderer.render(scene, camera);
  }

  function setRawProgress(p){ rawProgress = p; }
  function getProgress(){ return progress; }
  function dispose(){
    disposed = true;
    if (frameId) cancelAnimationFrame(frameId);
  }

  return { animate, setRawProgress, getProgress, dispose };
}

export default { createAnimator, smoothstep, ACCENT_HEX, KF, sph };

