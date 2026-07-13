'use client';

import { useEffect, useRef } from 'react';

type Landing3DHomeProps = {
  markup: string;
  styles: string;
};

export default function Landing3DHome({ markup, styles }: Landing3DHomeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const canvasWrap = root.querySelector('#canvas-wrap');
    if (!(canvasWrap instanceof HTMLDivElement)) return;

    let destroyed = false;
    let sceneInstance: { destroy?: () => void } | null = null;
    let diagramObserver: IntersectionObserver | null = null;

    const setupDiagrams = () => {
      const diagrams = root.querySelectorAll('[data-diagram]');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        diagrams.forEach((diagram) => diagram.classList.add('diagram-visible'));
        return;
      }

      diagramObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('diagram-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.3 });

      diagrams.forEach((diagram) => diagramObserver?.observe(diagram));
    };

    void import('./runtime/Scene3D.js').then(({ default: Scene3D }) => {
      if (destroyed) return;
      sceneInstance = new Scene3D(root, canvasWrap, { loginHref: '/empresas/login' });
      setupDiagrams();
    });

    return () => {
      destroyed = true;
      diagramObserver?.disconnect();
      sceneInstance?.destroy?.();
      document.body.classList.remove('post-scene-active');
      document.documentElement.style.removeProperty('--accent');
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={rootRef} dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
