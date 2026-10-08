'use client';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin);
export default function LandingMotionClient({ scope, template }: { scope: RefObject<HTMLDivElement | null>; template: string }) {
  useLandingMotion(scope, template);
  return null;
}
/** Separate transform owners: entrance on papers, scroll on drift, pointer on tilt. */
export function useLandingMotion(scope: RefObject<HTMLDivElement | null>, template: string) {
  useGSAP(() => {
    const root = scope.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add({
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1024px)',
      fine: '(hover: hover) and (pointer: fine)',
    }, context => {
      const { motion, desktop, fine } = context.conditions!;
      if (!motion) return;
      const $ = gsap.utils.selector(root);
      const dispose: (() => void)[] = [];
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } });
      entrance
        .from($('.hero-line-inner'), { yPercent: 115, rotation: 3, duration: 1.05, stagger: .12 }, .05)
        .from($('.hero-description, .hero-actions, .hero-footnote'), { y: 22, opacity: 0, duration: .7, stagger: .1 }, .45)
        .fromTo($('.paper-back-left'), { x: 40, y: 125, rotation: 8, scale: .88, opacity: 0 }, { x: -38, y: 24, rotation: -13, scale: .96, opacity: 1, duration: 1.35 }, .05)
        .fromTo($('.paper-back-right'), { x: 70, y: 155, rotation: -8, scale: .88, opacity: 0 }, { x: 40, y: 15, rotation: 11, scale: .97, opacity: 1, duration: 1.35 }, .17)
        .fromTo($('.paper-front'), { x: 30, y: 185, rotation: 8, rotationX: 18, scale: .85, opacity: 0 }, { x: 0, y: 0, rotation: -3, rotationX: 0, scale: 1, opacity: 1, duration: 1.35 }, .29)
        .from($('.hero-preview-controls'), { opacity: 0, y: 12, duration: .6 }, .85);
      gsap.utils.toArray<HTMLElement>('[data-decode-text]', root).forEach(output => {
        entrance.to(output, { duration: .85, scrambleText: { text: output.dataset.decodeText || '', chars: '_/·', revealDelay: .1, speed: .7, tweenLength: false }, ease: 'none' }, .3);
      });
      if (desktop) gsap.to($('.paper-drift'), { y: -70, rotation: -3, ease: 'none', scrollTrigger: { trigger: $('.hero')[0], start: 'top top', end: 'bottom top', scrub: .7 } });
      gsap.utils.toArray<HTMLElement>('[data-reveal]', root).forEach(element => {
        gsap.from(element, { y: 38, opacity: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 91%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal-group]', root).forEach(group => {
        gsap.from(group.children, { y: 35, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 90%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('.motion-rule', root).forEach(rule => {
        gsap.from(rule, { scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: rule, start: 'top 94%', once: true } });
      });
      const gallery = $('.template-gallery')[0] as HTMLElement;
      const cards = gsap.utils.toArray<HTMLElement>('.template-motion-card', root);
      if (desktop) {
        const spread = gsap.timeline({ scrollTrigger: { trigger: gallery, start: 'top 98%', end: 'top 29%', scrub: .65, invalidateOnRefresh: true } });
        cards.forEach((card, i) => {
          spread.fromTo(card, { x: () => (gallery.clientWidth - card.offsetWidth) / 2 - card.offsetLeft, y: i === 1 ? 20 : 52, rotation: [-10, 2, 11][i], scale: .9 }, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: 'power2.inOut' }, 0);
        });
        const revealForKeyboard = (event: FocusEvent) => {
          if (!(event.target instanceof HTMLElement) || !event.target.matches(':focus-visible')) return;
          spread.scrollTrigger?.getTween()?.pause();
          spread.scrollTrigger?.kill(false, true);
          spread.progress(1);
        };
        gallery.addEventListener('focusin', revealForKeyboard);
        dispose.push(() => gallery.removeEventListener('focusin', revealForKeyboard));
      } else cards.forEach(card => gsap.from(card, { y: 35, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 94%', once: true } }));
      gsap.from($('.closing-line > span'), { yPercent: 108, duration: 1.05, stagger: .12, ease: 'power4.out', scrollTrigger: { trigger: $('.closing-section')[0], start: 'top 78%', once: true } });
      gsap.from($('.closing-arrow'), { x: -36, y: 36, opacity: 0, duration: 1.15, ease: 'power3.out', scrollTrigger: { trigger: $('.closing-section')[0], start: 'top 72%', once: true } });
      if (fine) {
        const frame = $('.hero-document-frame')[0] as HTMLElement;
        const tilt = $('.paper-tilt')[0];
        const rotateX = gsap.quickTo(tilt, 'rotationX', { duration: .8, ease: 'power3.out' });
        const rotateY = gsap.quickTo(tilt, 'rotationY', { duration: .8, ease: 'power3.out' });
        const move = (event: PointerEvent) => {
          const bounds = frame.getBoundingClientRect();
          rotateX(-((event.clientY - bounds.top) / bounds.height - .5) * 8);
          rotateY(((event.clientX - bounds.left) / bounds.width - .5) * 10);
        };
        const leave = () => { rotateX(0); rotateY(0); };
        frame.addEventListener('pointermove', move); frame.addEventListener('pointerleave', leave);
        dispose.push(() => { frame.removeEventListener('pointermove', move); frame.removeEventListener('pointerleave', leave); });
        gsap.utils.toArray<HTMLElement>('.magnetic-target', root).forEach(target => {
          const button = target.querySelector<HTMLElement>('.magnetic-button')!;
          const x = gsap.quickTo(button, 'x', { duration: .55, ease: 'power3.out' });
          const y = gsap.quickTo(button, 'y', { duration: .55, ease: 'power3.out' });
          const moveButton = (event: PointerEvent) => {
            const bounds = target.getBoundingClientRect();
            x((event.clientX - bounds.left - bounds.width / 2) * .09); y((event.clientY - bounds.top - bounds.height / 2) * .14);
          };
          const reset = () => { x(0); y(0); };
          target.addEventListener('pointermove', moveButton); target.addEventListener('pointerleave', reset); target.addEventListener('focusout', reset);
          dispose.push(() => { target.removeEventListener('pointermove', moveButton); target.removeEventListener('pointerleave', reset); target.removeEventListener('focusout', reset); });
        });
      }
      let active = true;
      document.fonts?.ready.then(() => { if (active) ScrollTrigger.refresh(); });
      let resizeTimer: ReturnType<typeof setTimeout>;
      let lastHeight = root.offsetHeight;
      const resize = new ResizeObserver(() => {
        if (Math.abs(root.offsetHeight - lastHeight) < 2) return;
        lastHeight = root.offsetHeight; clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (active) ScrollTrigger.refresh(); }, 150);
      });
      resize.observe(root);
      return () => { active = false; resize.disconnect(); clearTimeout(resizeTimer); dispose.forEach(cleanup => cleanup()); };
    });
    return () => media.revert();
  }, { scope });
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.paper-front .paper-content', { opacity: .25, y: 9 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
    });
    return () => media.revert();
  }, { scope, dependencies: [template], revertOnUpdate: true });
}
