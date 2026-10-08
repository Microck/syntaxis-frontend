'use client';
import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { isLanguage, isTemplateId, type Draft } from '@/lib/resume';
type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown }, options?: { signal: AbortSignal }) => void | Promise<void> };
export function useWorkspaceTools({ draft, change, ready }: { draft: Draft; change: (draft: Draft) => void; ready: boolean }) {
  const state = useRef({ draft, change }); state.current = { draft, change };
  useEffect(() => {
    if (!ready) return;
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = [
      { name: 'read_resume_draft', title: 'Read résumé draft', description: 'Read the résumé currently open in the visible Syntaxis editor. Does not upload, export, or change it.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => ({ ...state.current.draft }) },
      { name: 'set_resume_presentation', title: 'Set résumé presentation', description: 'Change the visible résumé template and/or section heading language. Does not translate résumé text or generate a document.', inputSchema: { type: 'object', properties: { template: { type: 'string', enum: ['vanguard','silicon','genesis'] }, language: { type: 'string', enum: ['en','es','fr','de','pt','it','nl','sv','no','da'] } }, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected template and/or language.');
        const v = input as Record<string, unknown>;
        if (Object.keys(v).some(k=>!['template','language'].includes(k)) || Object.keys(v).length === 0) throw new Error('Specify only template and/or language.');
        if (v.template !== undefined && (typeof v.template !== 'string' || !isTemplateId(v.template))) throw new Error('Unknown template.');
        if (v.language !== undefined && (typeof v.language !== 'string' || !isLanguage(v.language))) throw new Error('Unknown language.');
        const next = { ...state.current.draft };
        if (typeof v.template === 'string' && isTemplateId(v.template)) next.template = v.template;
        if (typeof v.language === 'string' && isLanguage(v.language)) next.language = v.language;
        flushSync(() => state.current.change(next));
        return { template: next.template, language: next.language };
      } },
    ];
    for (const tool of tools) { try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(()=>{}); } catch { /* Optional browser capability. */ } }
    return () => lifecycle.abort();
  }, [ready]);
}
