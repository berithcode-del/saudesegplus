'use client';

import { useEffect, useRef } from 'react';

type Landing3DHomeProps = {
  markup: string;
  styles: string;
};

function setupLandingInteractions(root: HTMLDivElement) {
  const activateDemoTab = (selectedTab: HTMLButtonElement) => {
    const tabList = selectedTab.closest('[data-demo-tabs]');
    const panel = selectedTab.closest('.visual-card');
    if (!tabList || !panel) return;

    const tabs = Array.from(tabList.querySelectorAll<HTMLButtonElement>('[data-demo-target]'));
    tabs.forEach((tab) => {
      const isSelected = tab === selectedTab;
      const targetId = tab.dataset.demoTarget;
      const view = targetId ? panel.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`) : null;

      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      view?.classList.toggle('is-active', isSelected);
      view?.setAttribute('aria-hidden', String(!isSelected));
    });
  };

  const handleClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;

    const demoTab = event.target.closest<HTMLButtonElement>('[data-demo-target]');
    if (demoTab && root.contains(demoTab)) {
      activateDemoTab(demoTab);
      return;
    }

    const roleFilter = event.target.closest<HTMLButtonElement>('[data-role-filter]');
    if (roleFilter && root.contains(roleFilter)) {
      const stage = roleFilter.closest<HTMLElement>('[data-role-stage]');
      const roleTabs = roleFilter.closest('[data-role-tabs]');
      if (!stage || !roleTabs) return;

      stage.dataset.activeRole = roleFilter.dataset.roleFilter ?? 'all';
      roleTabs.querySelectorAll<HTMLButtonElement>('[data-role-filter]').forEach((filter) => {
        filter.setAttribute('aria-pressed', String(filter === roleFilter));
      });
      return;
    }

    const answer = event.target.closest<HTMLButtonElement>('.answer-choice');
    if (answer && root.contains(answer)) {
      const group = answer.closest('[data-answer-group]');
      if (!group) return;

      group.querySelectorAll<HTMLButtonElement>('.answer-choice').forEach((choice) => {
        choice.setAttribute('aria-pressed', String(choice === answer));
      });

      const feedback = group.parentElement?.querySelector<HTMLElement>('[data-answer-feedback]');
      if (feedback) {
        feedback.textContent = `Resposta selecionada: ${answer.textContent?.trim()}. A próxima pergunta será adaptada.`;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLButtonElement) || !event.target.matches('[data-demo-target]')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const tabList = event.target.closest('[data-demo-tabs]');
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll<HTMLButtonElement>('[data-demo-target]'));
    const currentIndex = tabs.indexOf(event.target);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
    if (!nextTab) return;

    event.preventDefault();
    activateDemoTab(nextTab);
    nextTab.focus();
  };

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeyDown);

  return () => {
    root.removeEventListener('click', handleClick);
    root.removeEventListener('keydown', handleKeyDown);
  };
}

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
    const cleanupInteractions = setupLandingInteractions(root);

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

    setupDiagrams();

    void import('./runtime/Scene3D.js').then(({ default: Scene3D }) => {
      if (destroyed) return;
      sceneInstance = new Scene3D(root, canvasWrap, { loginHref: '/empresas/login' });
    });

    return () => {
      destroyed = true;
      cleanupInteractions();
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
