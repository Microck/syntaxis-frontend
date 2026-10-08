'use client';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
export function Providers({ children }: { children: React.ReactNode }) { return <MotionConfig reducedMotion="user">{children}<Toaster theme="light" position="bottom-right" /></MotionConfig>; }
