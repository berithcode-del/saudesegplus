import * as THREE from '../vendor/three.module.js';
import geometry from '../utils/geometry.js';

const { addFloorWindows } = geometry;

function createWindows(building, w, d, h, y, openDirs, glassWarm, glassCool){
  return addFloorWindows(building, w, d, h, y, openDirs, glassWarm, glassCool);
}

export default createWindows;

