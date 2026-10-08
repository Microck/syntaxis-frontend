'use client';
// Adapted from Magic UI's MIT-licensed Tweet Card. Local editorial content
// replaces social identity: these are product notes, not testimonials or tweets.
import type { ReactNode } from 'react';
import { Bookmark } from 'lucide-react';
export function TweetCard({title,children,saved,onSave}:{title:string;children:ReactNode;saved:boolean;onSave:()=>void}) { return <article className="relative flex h-fit w-full max-w-lg flex-col gap-4 overflow-hidden rounded-xl border p-5 field-note"><div className="note-heading"><h3>{title}</h3><button className={'note-save '+(saved?'is-saved':'')} aria-label={(saved?'Unsave ':'Save ')+title} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button></div><div className="note-body"><p>{children}</p></div><span className="sr-only" role="status">{saved?'Saved on this device':''}</span></article>; }
