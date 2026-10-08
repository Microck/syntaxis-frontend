'use client';
// Focused adaptation of Animate UI's Base Toggle Group: Base UI semantics,
// spring-animated selection and reduced-motion support, without unused modes.
import { createContext, useContext, useId, useState, type ComponentProps } from 'react';
import { ToggleGroup as BaseGroup } from '@base-ui/react/toggle-group';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
const Context=createContext<{value:readonly unknown[];id:string}>({value:[],id:''});
export function ToggleGroup({className,children,value,defaultValue,onValueChange,...props}:ComponentProps<typeof BaseGroup>) {
  const [local,setLocal]=useState(defaultValue||[]);
  const id=useId();
  return <Context.Provider value={{value:value||local,id}}><BaseGroup data-slot="toggle-group" className={cn('relative flex w-fit items-center gap-0.5 rounded-lg',className)} value={value||local} onValueChange={(next,event)=>{setLocal(next);onValueChange?.(next,event);}} {...props}>{children}</BaseGroup></Context.Provider>;
}
export function Toggle({className,children,value,...props}:ComponentProps<typeof BaseToggle>) {
  const context=useContext(Context);
  const active=context.value.includes(value);
  return <BaseToggle data-slot="toggle" value={value} className={cn('relative inline-flex min-w-0 flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',className)} {...props}><AnimatePresence>{active&&<motion.span data-slot="toggle-group-highlight" layoutId={context.id+'-selected'} className="absolute inset-0 rounded-md bg-accent" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{type:'spring',stiffness:200,damping:25}}/>}</AnimatePresence><span className="relative z-10">{children}</span></BaseToggle>;
}
