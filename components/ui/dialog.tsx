'use client';
import * as React from 'react';
import { XIcon } from 'lucide-react';
import { Dialog as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export function DialogContent({className,children,showCloseButton=true,...props}:React.ComponentProps<typeof Primitive.Content>&{showCloseButton?:boolean}) { return <Primitive.Portal><Primitive.Overlay data-slot="dialog-overlay" className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0"/><Primitive.Content data-slot="dialog-content" className={cn('fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none sm:max-w-lg',className)} {...props}>{children}{showCloseButton&&<Primitive.Close data-slot="dialog-close" className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"><XIcon size={16}/><span className="sr-only">Close</span></Primitive.Close>}</Primitive.Content></Primitive.Portal>; }
export function DialogHeader({className,...props}:React.ComponentProps<'div'>) { return <div data-slot="dialog-header" className={cn('flex flex-col gap-2 text-center sm:text-left',className)} {...props}/>; }
export function DialogFooter({className,...props}:React.ComponentProps<'div'>) { return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',className)} {...props}/>; }
export function DialogTitle({className,...props}:React.ComponentProps<typeof Primitive.Title>) { return <Primitive.Title data-slot="dialog-title" className={cn('text-lg leading-none font-semibold',className)} {...props}/>; }
export function DialogDescription({className,...props}:React.ComponentProps<typeof Primitive.Description>) { return <Primitive.Description data-slot="dialog-description" className={cn('text-sm text-muted-foreground',className)} {...props}/>; }
