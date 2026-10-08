'use client';
import * as React from 'react';
import { AlertDialog as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';
export const AlertDialog=Primitive.Root;
export function AlertDialogContent({className,...props}:React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Portal><Primitive.Overlay data-slot="alert-dialog-overlay" className="fixed inset-0 z-50 bg-black/50"/><Primitive.Content data-slot="alert-dialog-content" className={cn('fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-lg',className)} {...props}/></Primitive.Portal>; }
export function AlertDialogHeader({className,...props}:React.ComponentProps<'div'>) { return <div data-slot="alert-dialog-header" className={cn('grid gap-2 text-left',className)} {...props}/>; }
export function AlertDialogFooter({className,...props}:React.ComponentProps<'div'>) { return <div data-slot="alert-dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',className)} {...props}/>; }
export function AlertDialogTitle({className,...props}:React.ComponentProps<typeof Primitive.Title>) { return <Primitive.Title data-slot="alert-dialog-title" className={cn('text-lg font-semibold',className)} {...props}/>; }
export function AlertDialogDescription({className,...props}:React.ComponentProps<typeof Primitive.Description>) { return <Primitive.Description data-slot="alert-dialog-description" className={cn('text-sm text-muted-foreground',className)} {...props}/>; }
export function AlertDialogCancel({className,...props}:React.ComponentProps<typeof Primitive.Cancel>) { return <Primitive.Cancel data-slot="alert-dialog-cancel" className={cn('button button-ghost',className)} {...props}/>; }
export function AlertDialogAction({className,...props}:React.ComponentProps<typeof Primitive.Action>) { return <Primitive.Action data-slot="alert-dialog-action" className={cn('button button-black',className)} {...props}/>; }
