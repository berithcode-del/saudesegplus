import * as THREE from '../vendor/three.module.js';

function createGroundTexture(worldRadius){
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const scale = (S * 0.5) / worldRadius;

  function w2c(x, z){
    const u = (z / (2 * worldRadius)) + 0.5;
    const v = (x / (2 * worldRadius)) + 0.5;
    return [u * S, (1 - v) * S];
  }

  ctx.fillStyle = '#3a3a46';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 6000; i++){
    const x = Math.random() * S, y = Math.random() * S;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    const s = Math.random() * 2 + 0.5;
    ctx.fillRect(x, y, s, s);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export default {
  createGroundTexture
};

