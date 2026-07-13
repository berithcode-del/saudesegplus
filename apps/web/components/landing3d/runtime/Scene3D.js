import * as THREE from './vendor/three.module.js';
import createBuilding from './modules/building.js';
import createCharacters from './modules/characters.js';
import createEnvironment from './modules/environment.js';
import createEffects from './modules/effects.js';
import { createAnimator } from './modules/animation.js';

export default class Scene3D {
  constructor(rootEl, wrapEl, options = {}){
    this.root = rootEl;
    this.wrap = wrapEl;
    this.loginHref = options.loginHref ?? '/empresas/login';
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.W = () => window.innerWidth;
    this.H = () => window.innerHeight;
    this.FRUSTUM = 9;

    this._setupScene();
    this._setupLights();
    this._build();
  }

  _setupScene(){
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xEDEDFB);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.W(), this.H());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.wrap.appendChild(this.renderer.domElement);

    const aspect = this.W() / this.H();
    this.camera = new THREE.OrthographicCamera(
      -this.FRUSTUM * aspect, this.FRUSTUM * aspect,
      this.FRUSTUM, -this.FRUSTUM,
      0.1, 100
    );
  }

  _setupLights(){
    const hemi = new THREE.HemisphereLight(0xE8E0D0, 0x3A3A46, 0.7);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xFFF8F0, 0.95);
    sun.position.set(9, 14, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xC0B8D8, 0.25);
    fill.position.set(-8, 6, -6);
    this.scene.add(fill);
  }

  _build(){
    this.building = new THREE.Group();
    this.scene.add(this.building);

    const { revealRooms, entranceParts } = createBuilding(this.building);
    this.revealRooms = revealRooms;

    const { sign, accentLight } = entranceParts;
    this.sign = sign;
    this.accentLight = accentLight;

    this.characters = createCharacters(this.building);
    this.effects = createEffects(this.building);
    this.vegGroup = createEnvironment(this.building);

    this.animator = createAnimator({
      scene: this.scene,
      camera: this.camera,
      building: this.building,
      sign: this.sign,
      accentLight: this.accentLight,
      revealRooms: this.revealRooms,
      characters: this.characters,
      effects: this.effects,
      reduceMotion: this.reduceMotion,
      W: this.W,
      H: this.H,
      FRUSTUM: this.FRUSTUM,
      renderer: this.renderer
    });

    this._setupScroll();
    this._setupCTAs();
    this.animator.animate();
    this._syncPanels(0);
  }

  _setupScroll(){
    const panels = Array.from(this.root.querySelectorAll('.panel'));
    const dotRows = Array.from(this.root.querySelectorAll('.rail .dot-row'));
    const scrollCue = this.root.querySelector('#scrollCue');
    const scrollSpacer = this.root.querySelector('#scroll-spacer');
    const N = 7;

    const getSceneScrollMax = () => {
      if (!scrollSpacer) return 1;
      return Math.max(scrollSpacer.offsetHeight - window.innerHeight, 1);
    };

    const getScrollProgress = () => {
      const max = getSceneScrollMax();
      const p = Math.min(window.scrollY, max) / max;
      return Math.max(0, Math.min(1, p)) * (N - 1);
    };

    const syncPanels = (p) => {
      const activeIdx = Math.round(p);
      panels.forEach(panel => {
        const i = parseInt(panel.dataset.i, 10);
        const dist = Math.abs(p - i);
        panel.classList.toggle('visible', dist < 0.42);
      });
      dotRows.forEach(row => {
        const i = parseInt(row.dataset.i, 10);
        row.classList.toggle('active', i === activeIdx);
      });
      scrollCue.classList.toggle('visible', p < 0.15);
      document.body.classList.toggle('post-scene-active', window.scrollY > getSceneScrollMax() + window.innerHeight * 0.12);
    };

    this._syncPanels = syncPanels;
    this._getScrollProgress = getScrollProgress;
    this._N = N;

    let ticking = false;
    this._onScroll = () => {
      const raw = getScrollProgress();
      this.animator.setRawProgress(raw);
      if (!ticking){
        ticking = true;
        requestAnimationFrame(() => { syncPanels(raw); ticking = false; });
      }
    };

    this._onResize = () => {
      const raw = getScrollProgress();
      this.animator.setRawProgress(raw);
      syncPanels(raw);
    };

    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize);
  }

  _setupCTAs(){
    const goLogin = () => { window.location.assign(this.loginHref); };
    const topEntrar = this.root.querySelector('#topEntrar');
    const topCadastro = this.root.querySelector('#topCadastro');
    const heroEntrar = this.root.querySelector('#heroEntrar');
    const ctaEntrar = this.root.querySelector('#ctaEntrar');
    const heroScroll = this.root.querySelector('#heroScroll');

    this._ctaListeners = [
      [topEntrar, 'click', goLogin],
      [topCadastro, 'click', goLogin],
      [heroEntrar, 'click', goLogin],
      [ctaEntrar, 'click', goLogin],
    ];

    this._ctaListeners.forEach(([el, eventName, handler]) => {
      if (el) el.addEventListener(eventName, handler);
    });

    this._onHeroScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max / (this._N - 1) * 1, behavior: 'smooth' });
    };

    if (heroScroll) heroScroll.addEventListener('click', this._onHeroScroll);
    this._heroScrollEl = heroScroll;
  }

  enableVegetation(){
    if (this.vegGroup) this.vegGroup.visible = true;
  }

  disableVegetation(){
    if (this.vegGroup) this.vegGroup.visible = false;
  }

  destroy(){
    if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._heroScrollEl && this._onHeroScroll) {
      this._heroScrollEl.removeEventListener('click', this._onHeroScroll);
    }
    if (this._ctaListeners) {
      this._ctaListeners.forEach(([el, eventName, handler]) => {
        if (el) el.removeEventListener(eventName, handler);
      });
    }
    if (this.animator?.dispose) this.animator.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.wrap?.removeChild?.(this.renderer.domElement);
    }
  }
}

