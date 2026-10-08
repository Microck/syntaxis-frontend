'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from '@/components/syntaxis/navigation-link';
import { ArrowUpRight, Download, Layers3, Check, Menu, X, Plus, BookOpen, PenLine, Home } from 'lucide-react';
import { Toolbar } from '@base-ui/react/toolbar';
import { ToggleGroup, Toggle } from '@/components/animate-ui/components/base/toggle-group';
import { Steps, StepsTrigger, StepsContent, StepsItem } from '@/components/prompt-kit/steps';
import { Dock, DockItem, DockIcon, DockLabel } from '@/components/motion-primitives/dock';
import { TweetCard } from '@/components/magicui/tweet-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brand } from './brand';
import { DecodeReveal } from './decode-reveal';
import { ResumePreview } from './resume-preview';
import { LandingMotion } from './landing-motion';
import { sampleResume, templates, type TemplateId } from '@/lib/resume';
const notes = [
  { title: 'Choose what matters.', body: 'Include the work that supports the role you want next. You don’t need to document everything.' },
  { title: 'Be specific.', body: 'What did you build? What changed because you were there? Start with that.' },
  { title: 'Make it easy to read.', body: 'Clear headings, short sentences, and enough space. Let your experience carry the page.' },
];
const questions = [
  ['Do I need an account?', 'No. The editor, three templates, saved versions, and exports work without signing in. Your draft stays in this browser.'],
  ['Can I import a profile?', 'You can import a Syntaxis JSON backup now. GitHub and LinkedIn profile imports require a connected live service.'],
  ['How do I get a PDF?', 'Choose Compile PDF to typeset the original LaTeX template in your browser. The first run downloads the TeX engine and packages. Open Syntaxis in its own tab. You can also download the original .tex source or separately print the approximate HTML preview.'],
  ['Can I change the language?', 'Section headings are available in ten languages. Your writing stays as entered; full translation requires the connected AI service.'],
  ['Where is my résumé saved?', 'In this browser, on this device. Download a JSON backup to keep a portable copy. Clearing browser data removes local drafts and versions.'],
  ['Can I tailor it for different roles?', 'Yes. Save named versions, restore any version, switch its template, and export it again.'],
];
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<TemplateId>('vanguard');
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [privacy, setPrivacy] = useState(false);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem('syntaxis.notes') || '[]');
      if (Array.isArray(value)) setSaved(value.filter((x: unknown) => typeof x === 'number'));
    } catch { /* Optional preference storage. */ }
  }, []);
  const saveNote = (i: number) => {
    const next = saved.includes(i) ? saved.filter(x => x !== i) : [...saved, i];
    setSaved(next);
    try { localStorage.setItem('syntaxis.notes', JSON.stringify(next)); } catch { /* Optional preference storage. */ }
  };
  const current = templates.find(t => t.id === selected)!;
  const behind = templates.filter(t => t.id !== selected);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  return <div ref={root} className="landing landing-motion" id="top">
    <LandingMotion scope={root} template={selected} />
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="site-nav shell">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#approach">How it works</a><a href="#templates">Templates</a><a href="#notes">Field notes</a></nav>
        <div className="header-right">
          <Link className="button button-black button-small" href="/workspace">Open workspace <ArrowUpRight size={16} /></Link>
          <button className="mobile-menu-toggle" aria-expanded={menu} aria-controls="mobile-navigation" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        </div>
      </div>
      {menu && <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{[['approach', 'How it works'], ['templates', 'Templates'], ['notes', 'Field notes'], ['faq', 'Questions']].map(([id, label]) => <a href={'#' + id} key={id} onClick={() => setMenu(false)}>{label}</a>)}</nav>}
    </header>
    <main id="main">
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" aria-label="Your work. Well told."><span className="hero-line"><span className="hero-line-inner">Your work.</span></span><span className="hero-line"><span className="hero-line-inner"><DecodeReveal text="Well told." /></span></span></h1>
          <p className="hero-description">Build a résumé worth reading.</p>
          <div className="hero-actions">
            <span className="magnetic-target"><Link className="button button-black button-large magnetic-button" href="/workspace">Build your résumé <ArrowUpRight size={19} /></Link></span>
            <button className="text-link" onClick={() => scrollTo('templates')}>View templates</button>
          </div>
          <p className="hero-footnote">No account required.</p>
        </div>
        <div className="hero-stage">
          <div className="hero-document-frame" aria-hidden="true"><div className="paper-drift"><div className="paper-tilt">
            <div className="paper-layer paper-back-left"><div className="paper-sheet"><ResumePreview resume={sampleResume} template={behind[0].id} /></div></div>
            <div className="paper-layer paper-back-right"><div className="paper-sheet"><ResumePreview resume={sampleResume} template={behind[1].id} /></div></div>
            <div className="paper-layer paper-front"><div className="paper-sheet"><div className="paper-content"><ResumePreview resume={sampleResume} template={selected} /></div></div></div>
          </div></div></div>
          <div className="hero-preview-controls"><span className="preview-name" aria-live="polite">{current.name}</span><Toolbar.Root className="hero-toolbar" aria-label="Preview templates">{templates.map(t => <Toolbar.Button key={t.id} aria-label={'Preview ' + t.name} aria-pressed={selected === t.id} className={selected === t.id ? 'active' : ''} onClick={() => setSelected(t.id)}>{t.index}</Toolbar.Button>)}</Toolbar.Root></div>
        </div>
      </section>
      <section className="approach shell section-space" id="approach" aria-labelledby="approach-title">
        <div className="motion-rule" aria-hidden="true" />
        <h2 className="section-title" id="approach-title" data-reveal>How it works.</h2>
        <div className="process-grid" data-reveal-group>
          <ProcessCard icon={<PenLine />} title="Add your experience." body="Write from scratch or edit the example." details={['Edit your experience, projects, education, and skills.', 'Import a Syntaxis JSON backup.']} />
          <ProcessCard icon={<Layers3 />} title="Choose a template." body="Switch layouts. Keep every word." details={['See changes in the live preview.', 'Choose section headings in ten languages.']} />
          <ProcessCard icon={<Download />} title="Export your résumé." body="Ready to send, with source you can keep." details={['Compile the original LaTeX template to a PDF.', 'Download LaTeX source or a JSON backup.', 'Save named versions for different roles.']} />
        </div>
      </section>
      <section className="template-section section-space" id="templates" aria-labelledby="templates-title"><div className="shell">
        <div className="template-heading"><h2 id="templates-title" data-reveal>A format that fits.</h2></div>
        <div className="template-gallery" role="group" aria-label="Résumé templates">{templates.map(t => <div className="template-motion-card" key={t.id}>
          <button className={'template-card ' + (selected === t.id ? 'is-selected' : '')} onClick={() => setSelected(t.id)} aria-pressed={selected === t.id} aria-label={'Select ' + t.name + ' template'}>
            <div className="template-art"><span className="template-select-icon" aria-hidden="true">{selected === t.id ? <Check size={16} /> : <Plus size={16} />}</span><div className="template-miniature" aria-hidden="true"><ResumePreview resume={sampleResume} template={t.id} /></div></div>
            <div className="template-description"><h3>{t.name}</h3><p>{t.tagline}</p></div>
          </button>
        </div>)}</div>
        <div className="template-bottom">
          <ToggleGroup className="template-toggle" value={[selected]} onValueChange={value => { if (value[0]) setSelected(value[0] as TemplateId); }} aria-label="Selected template">{templates.map(t => <Toggle key={t.id} value={t.id}>{t.name}</Toggle>)}</ToggleGroup>
          <span className="magnetic-target"><Link className="button button-black magnetic-button" href={'/workspace?template=' + selected}>Start with {current.name} <ArrowUpRight size={18} /></Link></span>
        </div>
      </div></section>
      <section className="notes-section shell section-space" id="notes" aria-labelledby="notes-title"><div className="notes-heading"><h2 id="notes-title" data-reveal>Field notes.</h2></div><div className="notes-grid" data-reveal-group>{notes.map((n, i) => <TweetCard key={i} title={n.title} saved={saved.includes(i)} onSave={() => saveNote(i)}>{n.body}</TweetCard>)}</div></section>
      <section className="faq-section shell section-space" id="faq" aria-labelledby="faq-title"><div className="motion-rule" aria-hidden="true" /><h2 id="faq-title" data-reveal>Questions.</h2><Accordion type="single" collapsible className="faq-list">{questions.map(([q, a], i) => <AccordionItem value={String(i)} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></section>
      <section className="closing-section" aria-labelledby="closing-title"><div className="shell closing-content">
        <h2 id="closing-title"><span className="closing-line"><span>Make your</span></span><span className="closing-line"><span>next move.</span></span></h2>
        <div className="closing-action"><ArrowUpRight className="closing-arrow" aria-hidden="true" strokeWidth={.75} /><span className="magnetic-target"><Link className="button button-white button-large magnetic-button" href="/workspace">Build your résumé <ArrowUpRight size={19} /></Link></span></div>
      </div></section>
    </main>
    <footer className="site-footer shell"><Brand /><div><button onClick={() => setPrivacy(true)}>Privacy</button><span>© {new Date().getFullYear()} Syntaxis</span></div></footer>
    <div className="landing-dock"><Dock magnification={53} panelHeight={56} distance={120} className="site-dock"><DockItem label="Back to top" onClick={() => scrollTo('top')}><DockIcon><Home size={20} /></DockIcon><DockLabel>Home</DockLabel></DockItem><DockItem label="View templates" onClick={() => scrollTo('templates')}><DockIcon><Layers3 size={20} /></DockIcon><DockLabel>Templates</DockLabel></DockItem><DockItem label="Read field notes" onClick={() => scrollTo('notes')}><DockIcon><BookOpen size={20} /></DockIcon><DockLabel>Field notes</DockLabel></DockItem><DockItem label="Open résumé workspace" onClick={() => { window.location.href = '/workspace'; }}><DockIcon><PenLine size={20} /></DockIcon><DockLabel>Workspace</DockLabel></DockItem></Dock></div>
    <Dialog open={privacy} onOpenChange={setPrivacy}><DialogContent className="syntaxis-dialog"><DialogHeader><DialogTitle>Your privacy</DialogTitle><DialogDescription>How the workspace stores your data.</DialogDescription></DialogHeader><div className="dialog-prose"><p>Drafts, versions, and saved notes stay in this browser on this device. They are not uploaded automatically.</p><p>The LaTeX compiler downloads public engine and package files. Your résumé is typeset locally, not sent to a PDF service. The ChatGPT demo does not connect to an AI provider.</p><p>Connected imports and AI generation send the requested data to the configured backend only when that service is explicitly connected.</p><p>Clearing browser data removes local drafts. Export a JSON backup to keep a copy you can restore.</p></div></DialogContent></Dialog>
  </div>;
}
function ProcessCard({ icon, title, body, details }: { icon: ReactNode; title: string; body: string; details: string[] }) {
  return <article className="process-card"><span className="process-icon">{icon}</span><h3>{title}</h3><p>{body}</p><Steps defaultOpen={false} className="process-details"><StepsTrigger>Details</StepsTrigger><StepsContent>{details.map(d => <StepsItem key={d}><Check size={13} />{d}</StepsItem>)}</StepsContent></Steps></article>;
}
