'use client';
// Motion Primitives Dock, adapted with native buttons and reduced-motion support.
import { motion, type MotionValue, useMotionValue, useSpring, useTransform, type SpringOptions, AnimatePresence, useReducedMotion } from 'motion/react';
import { Children, cloneElement, createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type ReactElement } from 'react';
import { cn } from '@/lib/utils';
type DockContextType={mouseX:MotionValue<number>;spring:SpringOptions;magnification:number;distance:number};
const Context=createContext<DockContextType|undefined>(undefined);
function useDock(){const context=useContext(Context);if(!context)throw new Error('Dock items require Dock.');return context;}
export function Dock({children,className,spring={mass:.1,stiffness:150,damping:12},magnification=80,distance=150,panelHeight=64}:{children:ReactNode;className?:string;spring?:SpringOptions;magnification?:number;distance?:number;panelHeight?:number}){
  const mouseX=useMotionValue(Infinity),hover=useMotionValue(0),reduce=useReducedMotion();
  const maximum=useMemo(()=>Math.max(128,magnification*1.5+4),[magnification]);
  const height=useSpring(useTransform(hover,[0,1],[panelHeight,maximum]),spring);
  return <motion.div style={{height:reduce?panelHeight:height,scrollbarWidth:'none'}} className="mx-2 flex max-w-full items-end overflow-visible"><motion.div onMouseMove={({clientX})=>{if(!reduce){hover.set(1);mouseX.set(clientX);}}} onMouseLeave={()=>{hover.set(0);mouseX.set(Infinity);}} className={cn('mx-auto flex w-fit gap-4 rounded-2xl bg-gray-50 px-4',className)} style={{height:panelHeight}} role="toolbar" aria-label="Application dock"><Context.Provider value={{mouseX,spring,distance,magnification:reduce?40:magnification}}>{children}</Context.Provider></motion.div></motion.div>;
}
export function DockItem({children,className,onClick,label}:{children:ReactNode;className?:string;onClick?:()=>void;label?:string}){
  const ref=useRef<HTMLButtonElement>(null),{distance,magnification,mouseX,spring}=useDock(),isHovered=useMotionValue(0);
  const delta=useTransform(mouseX,value=>{const rect=ref.current?.getBoundingClientRect()??{x:0,width:0};return value-rect.x-rect.width/2;});
  const width=useSpring(useTransform(delta,[-distance,0,distance],[40,magnification,40]),spring);
  return <motion.button ref={ref} style={{width}} onHoverStart={()=>isHovered.set(1)} onHoverEnd={()=>isHovered.set(0)} onFocus={()=>isHovered.set(1)} onBlur={()=>isHovered.set(0)} className={cn('relative inline-flex items-center justify-center',className)} type="button" aria-label={label} onClick={onClick}>{Children.map(children,child=>cloneElement(child as ReactElement<{width?:MotionValue<number>;isHovered?:MotionValue<number>}>,{width,isHovered}))}</motion.button>;
}
export function DockLabel({children,className,isHovered}:{children:ReactNode;className?:string;isHovered?:MotionValue<number>}){
  const [visible,setVisible]=useState(false);
  useEffect(()=>isHovered?.on('change',value=>setVisible(value===1)),[isHovered]);
  return <AnimatePresence>{visible&&<motion.div initial={{opacity:0,y:0}} animate={{opacity:1,y:-10}} exit={{opacity:0,y:0}} transition={{duration:.2}} className={cn('absolute -top-6 left-1/2 w-fit whitespace-pre rounded-md border bg-gray-100 px-2 py-0.5 text-xs',className)} role="tooltip" style={{x:'-50%'}}>{children}</motion.div>}</AnimatePresence>;
}
export function DockIcon({children,className,width}:{children:ReactNode;className?:string;width?:MotionValue<number>}){
  const fallback=useMotionValue(40);
  const size=useTransform(width??fallback,value=>value/2);
  return <motion.div style={{width:size}} className={cn('flex items-center justify-center',className)}>{children}</motion.div>;
}
