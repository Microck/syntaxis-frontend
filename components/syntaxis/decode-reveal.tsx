'use client';
// Server-safe text; the browser-only motion layer adds the GSAP reveal.
export function DecodeReveal({ text, className = '' }: { text: string; className?: string }) {
  return <span className={'decode-reveal ' + className} aria-label={text}><span aria-hidden="true" style={{ visibility: 'hidden' }}>{text}</span><span data-decode-text={text} aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>{text}</span></span>;
}
