'use client';
import { useState } from 'react';
import { Toolbar } from '@base-ui/react/toolbar';
import { Sparkles, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Draft } from '@/lib/resume';

/** Explicit local simulation: never authenticates or invokes a model. */
export function DemoAssistant({ draft, onApply }: { draft: Draft; onApply: (draft: Draft) => void }) {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [review, setReview] = useState<{ before: string; after: string } | null>(null);
  const preview = () => {
    const before = draft.resume.summary;
    // Deterministic edit uses only the user's existing words; no invented claims.
    const after = before.trim().replace(/\s+/g, ' ').replace(/\bI am an? /i, '').replace(/\bResponsible for\b/g, 'Focused on');
    setReview({ before, after });
  };
  return <><Toolbar.Button className="ai-action" onClick={() => { setReview(null); setOpen(true); }}><Sparkles size={15} /> Try AI edit <span className="demo-badge">Demo</span></Toolbar.Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="syntaxis-dialog demo-dialog"><DialogHeader><DialogTitle>{review ? 'Review the edit' : 'Continue with ChatGPT'}</DialogTitle><DialogDescription>Demo only. No sign-in, API request, or credits are used.</DialogDescription></DialogHeader>
      {!connected ? <><div className="connection-notice"><ShieldCheck size={21}/><p>This simulates connecting your account. Do not enter credentials; no account is connected.</p></div><button className="button button-black" onClick={() => { setConnected(true); preview(); }}>Simulate connection</button></> : !review ? <><p className="field-hint">The mock trims and tidies your existing summary. It does not generate new experience.</p><button className="button button-black" onClick={preview}>Preview demo edit</button><button className="text-link" onClick={() => { setConnected(false); toast('Demo disconnected.'); }}>Disconnect demo</button></> : <>
        <div className="demo-comparison"><div><h3>Before</h3><p>{review.before || 'No summary yet.'}</p></div><div><h3>After</h3><p>{review.after || 'Add a professional summary to try the demo.'}</p></div></div>
        {draft.resume.summary !== review.before && <p role="alert">Your summary changed while this review was open. Preview again before applying.</p>}
        <div className="demo-actions"><button className="button button-ghost" onClick={() => setOpen(false)}>Discard</button><button className="button button-black" disabled={!review.after || draft.resume.summary !== review.before} onClick={() => { onApply({ ...draft, resume: { ...draft.resume, summary: review.after } }); setOpen(false); toast.success('Demo edit applied. Undo restores the previous summary.'); }}><Check size={16}/> Apply edit</button></div>
      </>}
    </DialogContent></Dialog>
  </>;
}
