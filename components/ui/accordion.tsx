'use client';
import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Accordion as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';
export function Accordion(props: React.ComponentProps<typeof Primitive.Root>) { return <Primitive.Root data-slot="accordion" {...props}/>; }
export function AccordionItem({className,...props}:React.ComponentProps<typeof Primitive.Item>) { return <Primitive.Item data-slot="accordion-item" className={cn('border-b last:border-b-0',className)} {...props}/>; }
export function AccordionTrigger({className,children,...props}:React.ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Header className="flex"><Primitive.Trigger data-slot="accordion-trigger" className={cn('flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',className)} {...props}>{children}<ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200"/></Primitive.Trigger></Primitive.Header>; }
export function AccordionContent({className,children,...props}:React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Content data-slot="accordion-content" className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}><div className={cn('pt-0 pb-4',className)}>{children}</div></Primitive.Content>; }
