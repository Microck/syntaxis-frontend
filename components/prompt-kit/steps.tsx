'use client';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
export function Steps({defaultOpen=true,className,...props}:ComponentProps<typeof Collapsible>) { return <Collapsible className={className} defaultOpen={defaultOpen} {...props}/>; }
export function StepsTrigger({className,children,leftIcon,swapIconOnHover,...props}:ComponentProps<typeof CollapsibleTrigger>&{leftIcon?:ReactNode;swapIconOnHover?:boolean}) { return <CollapsibleTrigger className={cn('group flex w-full items-center justify-between gap-2 text-sm text-muted-foreground',className)} {...props}><span className="flex items-center gap-2">{leftIcon}<span>{children}</span></span><ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180"/></CollapsibleTrigger>; }
export function StepsContent({className,children,bar,...props}:ComponentProps<typeof CollapsibleContent>&{bar?:ReactNode}) { return <CollapsibleContent className={cn('overflow-hidden text-popover-foreground',className)} {...props}><div className="mt-3 grid min-w-0 grid-cols-[min-content_minmax(0,1fr)] items-start gap-x-3"><div className="min-w-0 self-stretch">{bar||<StepsBar/>}</div><div className="min-w-0 space-y-2">{children}</div></div></CollapsibleContent>; }
export function StepsBar({className,...props}:HTMLAttributes<HTMLDivElement>) { return <div aria-hidden className={cn('h-full w-[2px] bg-muted',className)} {...props}/>; }
export function StepsItem({className,...props}:HTMLAttributes<HTMLDivElement>) { return <div className={cn('flex items-start gap-2 text-sm',className)} {...props}/>; }
