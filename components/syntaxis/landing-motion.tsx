'use client';
import { useEffect, useState, type ComponentType, type RefObject } from 'react';
type MotionProps = { scope: RefObject<HTMLDivElement | null>; template: string };
export function LandingMotion(props: MotionProps) {
  const [Motion, setMotion] = useState<ComponentType<MotionProps> | null>(null);
  useEffect(() => {
    let mounted = true;
    // GSAP starts its ticker at module evaluation: load it after hydration only.
    import('./use-landing-motion').then(module => {
      if (mounted) setMotion(() => module.default);
    }).catch(() => { /* Content and navigation remain usable without motion. */ });
    return () => { mounted = false; };
  }, []);
  return Motion ? <Motion {...props} /> : null;
}
