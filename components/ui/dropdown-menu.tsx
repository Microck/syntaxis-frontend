'use client';
import * as React from 'react';
import { DropdownMenu as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';
export const DropdownMenu=Primitive.Root;
export const DropdownMenuTrigger=Primitive.Trigger;
export function DropdownMenuContent({className,sideOffset=4,...props}:React.ComponentProps<typeof Primitive.Content>) { return <Primitive.Portal><Primitive.Content data-slot="dropdown-menu-content" sideOffset={sideOffset} className={cn('z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md',className)} {...props}/></Primitive.Portal>; }
export function DropdownMenuItem({className,...props}:React.ComponentProps<typeof Primitive.Item>) { return <Primitive.Item data-slot="dropdown-menu-item" className={cn('relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',className)} {...props}/>; }
export function DropdownMenuSeparator({className,...props}:React.ComponentProps<typeof Primitive.Separator>) { return <Primitive.Separator data-slot="dropdown-menu-separator" className={cn('bg-border -mx-1 my-1 h-px',className)} {...props}/>; }
