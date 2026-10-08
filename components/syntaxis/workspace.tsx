'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from '@/components/syntaxis/navigation-link';
import { Toolbar } from '@base-ui/react/toolbar';
import { toast } from 'sonner';
import { FileText, PenLine, Layers3, History, Plus, Upload, Download, Check, Undo2, Redo2, ChevronDown, Trash2, Save, Printer, CodeXml, CircleHelp, GitFork, BriefcaseBusiness, UserRound, Sparkles, Loader2, Laptop, Eye, ShieldCheck, Globe2, FileJson, RotateCcw, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Steps, StepsTrigger, StepsContent, StepsItem } from '@/components/prompt-kit/steps';
import { ResumePreview } from './resume-preview';
import { Brand } from './brand';
import { DemoAssistant } from './demo-assistant';
import { createApi, mergeGitHub, mergeLinkedIn, safeUrl, type Session, type RemoteGeneration, type GenerationResult } from '@/lib/api';
import { defaultDraft, sampleResume, templates, languages, normalizeDraft, isTemplateId, toLatex, downloadFile, fileStem, type Draft, type Resume, type Version, type Language } from '@/lib/resume';
import { useWorkspaceTools } from './workspace-tools';
import { compileLatexPdf } from '@/lib/latex-pdf';
const DRAFT_KEY = 'syntaxis.draft.v1';
const VERSIONS_KEY = 'syntaxis.versions.v1';
type Modal = 'import' | 'save' | 'account' | 'help' | 'generate' | null;
const errorMessage = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong. Please try again.';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export default function Workspace({ apiBaseUrl, aiEnabled, importsEnabled }: { apiBaseUrl: string; aiEnabled: boolean; importsEnabled: boolean }) {
  const [draft, setDraft] = useState<Draft>(clone(defaultDraft));
  const [versions, setVersions] = useState<Version[]>([]);
  const [past, setPast] = useState<Draft[]>([]);
  const [future, setFuture] = useState<Draft[]>([]);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Opening workspace…');
  const [panel, setPanel] = useState('content');
  const [mobileView, setMobileView] = useState('edit');
  const [modal, setModal] = useState<Modal>(null);
  const [reset, setReset] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [session, setSession] = useState<Session>(null);
  const [connection, setConnection] = useState(apiBaseUrl ? 'Connecting…' : 'On this device');
  const [busy, setBusy] = useState(false);
  const [importType, setImportType] = useState('backup');
  const [importValue, setImportValue] = useState('');
  const [importDraft, setImportDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState('');
  const [signUp, setSignUp] = useState(false);
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [generated, setGenerated] = useState<GenerationResult | null>(null);
  const [remoteHistory, setRemoteHistory] = useState<RemoteGeneration[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [compiledPdf, setCompiledPdf] = useState<{ url: string; fingerprint: string } | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingDraft = useRef(draft);
  const versionsRef = useRef<Version[]>([]);
  versionsRef.current = versions;
  const accountRef = useRef<string | null>(null);
  accountRef.current = session?.user.id || null;
  const importRequest = useRef(0);
  const api = useMemo(() => { try { return createApi(apiBaseUrl); } catch { return createApi(''); } }, [apiBaseUrl]);
  const r = draft.resume;
  const currentTemplate = templates.find(t => t.id === draft.template)!;
  const draftFingerprint = JSON.stringify(draft);
  const pdfFresh = !!compiledPdf && compiledPdf.fingerprint === draftFingerprint;
  useEffect(() => () => { if (compiledPdf) URL.revokeObjectURL(compiledPdf.url); }, [compiledPdf]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      let initial = raw ? normalizeDraft(JSON.parse(raw)) : clone(defaultDraft);
      const params = new URLSearchParams(window.location.search);
      const selected = params.get('template');
      if (selected && isTemplateId(selected)) initial = { ...initial, template: selected };
      if (params.get('example') === 'true' && !raw) initial = { ...initial, resume: clone(sampleResume), title: 'Example résumé' };
      setDraft(initial); pendingDraft.current = initial;
      let storedVersions: unknown = [];
      try { storedVersions = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); }
      catch { const rawVersions = localStorage.getItem(VERSIONS_KEY); if (rawVersions) localStorage.setItem('syntaxis.versions-recovery.' + Date.now(), rawVersions); toast.error('Saved versions could not be read. A recovery copy has been kept.'); }
      if (Array.isArray(storedVersions)) {
        const restored: Version[] = [];
        for (const value of storedVersions) { try { if (typeof value.id === 'string' && typeof value.savedAt === 'string') restored.push({ ...normalizeDraft(value), id: value.id, savedAt: value.savedAt }); } catch { /* Retain other valid versions. */ } }
        setVersions(restored);
      }
    } catch {
      toast.error('Could not read a saved draft. Your previous browser data has been kept as a recovery copy.');
      try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) localStorage.setItem('syntaxis.recovery.' + Date.now(), raw); } catch { /* Storage may be unavailable. */ }
    } finally { setReady(true); }
  }, []);
  useEffect(() => {
    if (!ready) return;
    pendingDraft.current = draft; setSaveStatus('Saving…');
    const timer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setSaveStatus('Saved on this device'); }
      catch { setSaveStatus('Not saved · download a backup'); }
    }, 450);
    return () => clearTimeout(timer);
  }, [draft, ready]);
  useEffect(() => {
    if (!ready) return;
    const flush = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(pendingDraft.current)); } catch { /* Visible status reports failures. */ } };
    const beforeUnload = (e: BeforeUnloadEvent) => { flush(); if (saveStatus.startsWith('Not saved')) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('pagehide', flush); window.addEventListener('beforeunload', beforeUnload);
    return () => { flush(); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', beforeUnload); };
  }, [ready, saveStatus]);
  useEffect(() => {
    if (!api.configured) { setConnection('On this device'); return; }
    let active = true;
    api.session().then(value => { if (active) { setSession(value); setConnection('Service connected'); } }).catch(() => { if (active) setConnection('Service unavailable'); });
    return () => { active = false; };
  }, [api]);
  useEffect(() => { setRemoteHistory([]); setGenerated(null); }, [session?.user.id]);
  const change = useCallback((next: Draft) => { setPast(previous => [...previous.slice(-39), draft]); setFuture([]); setDraft(next); pendingDraft.current = next; }, [draft]);
  const updateResume = (partial: Partial<Resume>) => change({ ...draft, resume: { ...r, ...partial } });
  const undo = () => { const previous = past[past.length - 1]; if (!previous) return; setPast(p => p.slice(0, -1)); setFuture(f => [draft, ...f].slice(0, 40)); setDraft(previous); pendingDraft.current = previous; };
  const redo = () => { const next = future[0]; if (!next) return; setFuture(f => f.slice(1)); setPast(p => [...p, draft].slice(-40)); setDraft(next); pendingDraft.current = next; };
  const openModal = (next: Modal) => { importRequest.current++; setFormError(''); setImportDraft(null); setImportValue(''); setGenerated(null); setModal(next); };
  const persistVersions = (next: Version[]) => { try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(next)); versionsRef.current = next; setVersions(next); return true; } catch { toast.error('Could not save this version. Download a JSON backup instead.'); return false; } };
  const saveVersion = (name: string, source = draft, quiet = false) => {
    const title = name.trim(); if (!title) { setFormError('Give this version a name.'); return false; }
    if (versionsRef.current.length >= 40) { setFormError('You have 40 saved versions. Download and remove a version before saving another.'); return false; }
    const next: Version = { ...clone(source), title, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
    if (!persistVersions([next, ...versionsRef.current])) return false;
    if (!quiet) toast.success('Version saved on this device.');
    return true;
  };
  const exportJson = () => { downloadFile(JSON.stringify({ schemaVersion: 1, ...draft }, null, 2), fileStem(r.name || draft.title) + '.syntaxis.json', 'application/json'); toast.success('JSON backup downloaded.'); };
  const exportLatex = () => { downloadFile(toLatex(draft), fileStem(r.name || draft.title) + '.tex', 'application/x-tex'); toast.success('LaTeX source downloaded.'); };
  const printResume = () => { const old = document.title; document.title = (r.name || 'My') + ' — Résumé'; window.print(); document.title = old; };
  const triggerPdfDownload = (url: string) => {
    const link = document.createElement('a'); link.href = url; link.download = fileStem(r.name || draft.title) + '.pdf';
    document.body.appendChild(link); link.click(); link.remove();
  };
  const compilePdf = async (download = false) => {
    if (!r.name.trim()) { toast.error('Add your name before compiling your résumé.'); return; }
    if (pdfBusy) return;
    setPdfError(''); setPdfBusy(true); setPdfProgress('Preparing the actual LaTeX template…');
    const original = draftFingerprint;
    try {
      if (compiledPdf?.fingerprint === original) {
        if (download) triggerPdfDownload(compiledPdf.url); else { setShowPdf(true); setMobileView('preview'); }
        return;
      }
      const blob = await compileLatexPdf(toLatex(draft), setPdfProgress);
      const url = URL.createObjectURL(blob);
      setCompiledPdf({ url, fingerprint: original });
      if (download) triggerPdfDownload(url); else { setShowPdf(true); setMobileView('preview'); }
      toast.success('Compiled from the original LaTeX template.');
    } catch (error) { setPdfError(errorMessage(error)); toast.error('PDF compilation failed. Your LaTeX source is still available.'); }
    finally { setPdfBusy(false); setPdfProgress(''); }
  };
  const loadExample = () => { change({ ...draft, resume: clone(sampleResume), title: 'Example résumé' }); toast.info('Example loaded. Replace the sample details with your own.'); };
  const readFile = async (file?: File) => {
    const request = ++importRequest.current; setImportDraft(null); setFormError('');
    if (!file) return;
    if (file.size > 1024 * 1024) { setFormError('Choose a JSON backup smaller than 1 MB.'); return; }
    try { const next = normalizeDraft(JSON.parse(await file.text())); if (request !== importRequest.current) return; setImportDraft(next); }
    catch (e) { if (request !== importRequest.current) return; setFormError(e instanceof SyntaxError ? 'This file is not valid JSON. Choose a Syntaxis backup.' : errorMessage(e)); }
  };
  const importProfile = async (e: FormEvent) => {
    e.preventDefault(); setFormError(''); setImportDraft(null);
    const request = ++importRequest.current;
    if (!api.configured || !importsEnabled) { setFormError('Profile imports need the connected service. You can write your details or import a JSON backup now.'); return; }
    if (!session) { setFormError('Sign in from the account menu before importing a profile.'); return; }
    const value = importValue.trim();
    if (importType === 'github' && !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value)) { setFormError('Enter a valid GitHub username, without the URL.'); return; }
    if (importType === 'linkedin') { try { const u = new URL(value); if (u.protocol !== 'https:' || !/(^|\.)linkedin\.com$/.test(u.hostname) || !u.pathname.startsWith('/in/')) throw new Error(); } catch { setFormError('Use an HTTPS LinkedIn profile URL, such as https://www.linkedin.com/in/your-name.'); return; } }
    setBusy(true);
    try {
      const imported = importType === 'github' ? mergeGitHub(r, (await api.github(value)).data) : mergeLinkedIn(r, (await api.linkedin(value)).data);
      if (request !== importRequest.current) return;
      setImportDraft({ ...draft, resume: imported }); toast.success('Profile received. Review it before applying.');
    } catch (e) { setFormError(errorMessage(e)); } finally { setBusy(false); }
  };
  const applyImport = () => { if (!importDraft) return; change(clone(importDraft)); setModal(null); setPanel('content'); toast.success('Résumé imported. Review the details and make it yours.'); };
  const authenticate = async (e: FormEvent) => {
    e.preventDefault(); setFormError(''); setBusy(true);
    try {
      if (signUp) await api.signUp(auth.name, auth.email, auth.password); else await api.signIn(auth.email, auth.password);
      const value = await api.session(); setSession(value); setConnection('Service connected'); setAuth({ name: '', email: '', password: '' });
      if (value) { setModal(null); toast.success('Signed in. Your local draft is ready.'); } else setFormError('Account request completed. Check your email if verification is required, then sign in.');
    } catch (e) { setFormError(errorMessage(e)); } finally { setBusy(false); }
  };
  const signOut = async () => { setBusy(true); try { await api.signOut(); setSession(null); accountRef.current = null; setRemoteHistory([]); setGenerated(null); setModal(null); toast.success('Signed out. Your résumé stays on this device.'); } catch (e) { setFormError(errorMessage(e)); } finally { setBusy(false); } };
  const generate = async () => {
    if (!session) { setFormError('Sign in to generate with the live service.'); return; }
    if (!r.name.trim()) { setFormError('Add your name before generating a résumé.'); return; }
    setBusy(true); setFormError('');
    try { const result = await api.generate(draft); if (!result.success || !result.url) throw new Error('The service did not return a generated document.'); safeUrl(result.url, true); setGenerated(result); toast.success('LaTeX generated by the live service.'); }
    catch (e) { setFormError(errorMessage(e)); } finally { setBusy(false); }
  };
  const fetchRemoteHistory = async () => { const accountId = accountRef.current; setLoadingHistory(true); try { const value = await api.generations(); if (accountRef.current === accountId) setRemoteHistory(value.generations || []); } catch (e) { if (accountRef.current === accountId) toast.error(errorMessage(e)); } finally { setLoadingHistory(false); } };
  useWorkspaceTools({ draft, change, ready });
  const completion = [Boolean(r.name.trim()), Boolean(r.email.trim()), Boolean(r.summary.trim()), r.experience.length > 0, r.skills.filter(Boolean).length > 0].filter(Boolean).length;
  return <div className="workspace">
    <a className="skip-link" href="#editor">Skip to editor</a>
    <header className="workspace-header"><div className="workspace-brand"><Brand /><span className="workspace-divider" /><span className="workspace-label">WORKSPACE</span></div><div className="workspace-header-actions"><span className="connection-label"><Laptop size={14} /> {connection}</span><button className="icon-button" aria-label="Workspace help" onClick={() => openModal('help')}><CircleHelp size={19} /></button>{api.configured && <button className="account-button" onClick={() => openModal('account')}><UserRound size={16} />{session ? session.user.name?.split(' ')[0] || 'Account' : 'Sign in'}</button>}</div></header>
    <div className="workspace-title-row"><div><div className="workspace-breadcrumb"><Link href="/">Syntaxis</Link><span>/</span><span>My résumé</span></div><input className="document-title" aria-label="Document title" value={draft.title} maxLength={160} onChange={e => change({ ...draft, title: e.target.value })} /><span className="save-status" aria-live="polite">{saveStatus === 'Saving…' ? <span className="saving-indicator" /> : <Check size={12} />}{saveStatus}</span></div><div className="workspace-primary-actions"><button className="button button-ghost" disabled={!ready} onClick={() => { setVersionName(draft.title); openModal('save'); }}><Save size={16} /> Save version</button><DropdownMenu><DropdownMenuTrigger asChild><button className="button button-black" disabled={!ready}><Download size={16} /> Export <ChevronDown size={15} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="export-menu"><DropdownMenuItem onSelect={() => { void compilePdf(true); }}><Printer /> Compile LaTeX PDF</DropdownMenuItem><DropdownMenuItem onSelect={exportLatex}><CodeXml /> Original template (.tex)</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={printResume}><FileText /> Print HTML preview</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={exportJson}><FileJson /> JSON backup</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>
    <Toolbar.Root className="editor-toolbar" aria-label="Résumé editing tools"><Toolbar.Group className="toolbar-group"><Toolbar.Button aria-label="Undo last edit" onClick={undo} disabled={!past.length}><Undo2 size={17} /></Toolbar.Button><Toolbar.Button aria-label="Redo edit" onClick={redo} disabled={!future.length}><Redo2 size={17} /></Toolbar.Button></Toolbar.Group><Toolbar.Separator className="toolbar-separator" /><Toolbar.Group className="toolbar-group"><Toolbar.Button onClick={() => openModal('import')}><Upload size={15} /><span>Import</span></Toolbar.Button><Toolbar.Button onClick={loadExample}><FileText size={15} /><span>Load example</span></Toolbar.Button><Toolbar.Button onClick={() => setReset(true)}><Plus size={16} /><span>New résumé</span></Toolbar.Button></Toolbar.Group><span className="toolbar-flex" />{api.configured && aiEnabled ? <Toolbar.Button onClick={() => openModal('generate')} className="ai-action"><Sparkles size={15} /> Generate with AI</Toolbar.Button> : <DemoAssistant draft={draft} onApply={change} />}</Toolbar.Root>
    <Tabs value={mobileView} onValueChange={setMobileView} className="mobile-editor-tabs"><TabsList><TabsTrigger value="edit"><PenLine size={15} /> Edit résumé</TabsTrigger><TabsTrigger value="preview"><Eye size={15} /> Preview</TabsTrigger></TabsList></Tabs>
    <div className={'workspace-body mobile-' + mobileView}>
      <aside className="editor-panel" id="editor"><Tabs value={panel} onValueChange={setPanel} className="editor-tabs"><TabsList variant="line" className="editor-tab-list"><TabsTrigger value="content"><PenLine size={15} /> Content</TabsTrigger><TabsTrigger value="design"><Layers3 size={15} /> Design</TabsTrigger><TabsTrigger value="versions"><History size={15} /> Versions <span className="version-count">{versions.length}</span></TabsTrigger></TabsList>
      <TabsContent value="content" className="editor-content"><div className="editor-intro"><h1>Edit résumé</h1></div>
        <Accordion type="multiple" defaultValue={['profile','summary','experience','education','skills','projects']} className="form-accordion">
          <AccordionItem value="profile"><AccordionTrigger><span><UserRound size={16} /> The basics</span></AccordionTrigger><AccordionContent><div className="form-grid"><Field label="Full name" value={r.name} onChange={name => updateResume({ name })} placeholder="Your name" autoComplete="name" /><Field label="Professional title" value={r.title} onChange={title => updateResume({ title })} placeholder="What you do" autoComplete="organization-title" /><Field label="Email" value={r.email} onChange={email => updateResume({ email })} placeholder="you@example.com" type="email" autoComplete="email" /><Field label="Phone" value={r.phone} onChange={phone => updateResume({ phone })} placeholder="Optional" type="tel" autoComplete="tel" /><Field label="Location" value={r.location} onChange={location => updateResume({ location })} placeholder="City, Country" autoComplete="address-level2" /><Field label="Website" value={r.website} onChange={website => updateResume({ website })} placeholder="your-portfolio.com" /><Field label="GitHub username" value={r.github} onChange={github => updateResume({ github })} placeholder="your-username" /><Field label="LinkedIn URL" value={r.linkedin} onChange={linkedin => updateResume({ linkedin })} placeholder="linkedin.com/in/you" /></div></AccordionContent></AccordionItem>
          <AccordionItem value="summary"><AccordionTrigger><span><PenLine size={16} /> Your introduction</span></AccordionTrigger><AccordionContent><Field label="Professional summary" value={r.summary} onChange={summary => updateResume({ summary })} placeholder="What do you bring to the table? A few clear sentences about your work, your strengths, and what comes next." multiline rows={5} /><span className="field-hint">{r.summary.length} characters · Make every sentence earn its place.</span></AccordionContent></AccordionItem>
          <AccordionItem value="experience"><AccordionTrigger><span><BriefcaseBusiness size={16} /> Experience <em>{r.experience.length}</em></span></AccordionTrigger><AccordionContent><div className="repeatable-list">{r.experience.map((item, i) => <div className="repeatable-item" key={item.id}><div className="item-heading"><span>POSITION {String(i+1).padStart(2,'0')}</span><button className="icon-button" aria-label={'Remove experience ' + (item.title || i+1)} onClick={() => updateResume({ experience: r.experience.filter(x => x.id !== item.id) })}><Trash2 size={14} /></button></div><div className="form-grid"><Field label="Role" value={item.title} onChange={title => updateResume({ experience: r.experience.map(x => x.id === item.id ? { ...x, title } : x) })} placeholder="Your role" /><Field label="Company" value={item.company} onChange={company => updateResume({ experience: r.experience.map(x => x.id === item.id ? { ...x, company } : x) })} placeholder="Company or studio" /><Field label="Dates" value={item.years} onChange={years => updateResume({ experience: r.experience.map(x => x.id === item.id ? { ...x, years } : x) })} placeholder="2023 — Present" className="full-width" /><Field label="Highlights · one per line" value={item.responsibilities.join('\n')} onChange={value => updateResume({ experience: r.experience.map(x => x.id === item.id ? { ...x, responsibilities: value.split('\n') } : x) })} placeholder="What did you build, improve, or make possible?" multiline rows={4} className="full-width" /></div></div>)}</div><button className="add-entry" onClick={() => updateResume({ experience: [...r.experience, { id: crypto.randomUUID(), title: '', company: '', years: '', responsibilities: [] }] })}><Plus size={15} />Add experience</button></AccordionContent></AccordionItem>
          <AccordionItem value="education"><AccordionTrigger><span><FileText size={16} /> Education <em>{r.education.length}</em></span></AccordionTrigger><AccordionContent><div className="repeatable-list">{r.education.map((item, i) => <div className="repeatable-item" key={item.id}><div className="item-heading"><span>EDUCATION {String(i+1).padStart(2,'0')}</span><button className="icon-button" aria-label={'Remove education ' + (item.school || i+1)} onClick={() => updateResume({ education: r.education.filter(x => x.id !== item.id) })}><Trash2 size={14} /></button></div><div className="form-grid"><Field label="School" value={item.school} onChange={school => updateResume({ education: r.education.map(x => x.id === item.id ? { ...x, school } : x) })} placeholder="University or institution" className="full-width" /><Field label="Degree / qualification" value={item.degree} onChange={degree => updateResume({ education: r.education.map(x => x.id === item.id ? { ...x, degree } : x) })} placeholder="Your qualification" /><Field label="Dates" value={item.year} onChange={year => updateResume({ education: r.education.map(x => x.id === item.id ? { ...x, year } : x) })} placeholder="2020 — 2024" /></div></div>)}</div><button className="add-entry" onClick={() => updateResume({ education: [...r.education, { id: crypto.randomUUID(), school: '', degree: '', year: '' }] })}><Plus size={15} />Add education</button></AccordionContent></AccordionItem>
          <AccordionItem value="skills"><AccordionTrigger><span><CodeXml size={16} /> Skills</span></AccordionTrigger><AccordionContent><Field label="What you’re good at" value={r.skills.join(', ')} onChange={value => updateResume({ skills: value.split(',').map(x => x.trimStart()) })} placeholder="TypeScript, Research, Leadership…" multiline rows={3} /><span className="field-hint">Separate each skill with a comma.</span></AccordionContent></AccordionItem>
          <AccordionItem value="projects"><AccordionTrigger><span><Layers3 size={16} /> Selected projects <em>{r.projects.length}</em></span></AccordionTrigger><AccordionContent><div className="repeatable-list">{r.projects.map((item, i) => <div className="repeatable-item" key={item.id}><div className="item-heading"><span>PROJECT {String(i+1).padStart(2,'0')}</span><button className="icon-button" aria-label={'Remove project ' + (item.name || i+1)} onClick={() => updateResume({ projects: r.projects.filter(x => x.id !== item.id) })}><Trash2 size={14} /></button></div><div className="form-grid"><Field label="Project name" value={item.name} onChange={name => updateResume({ projects: r.projects.map(x => x.id === item.id ? { ...x, name } : x) })} placeholder="Something you made" /><Field label="Link" value={item.url} onChange={url => updateResume({ projects: r.projects.map(x => x.id === item.id ? { ...x, url } : x) })} placeholder="Where to find it" /><Field label="Description" value={item.description} onChange={description => updateResume({ projects: r.projects.map(x => x.id === item.id ? { ...x, description } : x) })} placeholder="What it does and why it matters" multiline rows={3} className="full-width" /><Field label="Tools / technologies" value={item.technologies} onChange={technologies => updateResume({ projects: r.projects.map(x => x.id === item.id ? { ...x, technologies } : x) })} placeholder="The things you used to make it happen" className="full-width" /></div></div>)}</div><button className="add-entry" onClick={() => updateResume({ projects: [...r.projects, { id: crypto.randomUUID(), name: '', description: '', url: '', technologies: '' }] })}><Plus size={15} />Add a project</button></AccordionContent></AccordionItem>
        </Accordion><div className="editor-bottom-note"><ShieldCheck size={16} /><span>Your draft is saved in this browser. Download a backup to take it with you.</span></div>
      </TabsContent>
      <TabsContent value="design" className="editor-content"><div className="editor-intro"><h1>Choose a template</h1></div><div className="design-choices">{templates.map(t => <button key={t.id} className={'design-choice ' + (draft.template === t.id ? 'active' : '')} aria-pressed={draft.template === t.id} onClick={() => change({ ...draft, template: t.id })}><span className="design-thumb"><ResumePreview resume={sampleResume} template={t.id} /></span><span><span className="design-name">{t.name}</span><span className="design-caption">{t.tagline}</span></span><span className="design-check">{draft.template === t.id ? <Check size={15} /> : <Plus size={15} />}</span></button>)}</div><div className="design-language"><h3><Globe2 size={17} /> Section language</h3><Select value={draft.language} onValueChange={language => change({ ...draft, language: language as Language })}><SelectTrigger aria-label="Résumé section language"><SelectValue /></SelectTrigger><SelectContent>{languages.map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}</SelectContent></Select><p>Changes section headings. Your writing stays as entered.</p></div><div className="design-description"><p>{currentTemplate.description}</p></div></TabsContent>
      <TabsContent value="versions" className="editor-content"><div className="editor-intro"><h1>Saved versions</h1></div><button className="button button-black full-width" onClick={() => { setVersionName(draft.title); openModal('save'); }}><Plus size={16} /> Save the current version</button>{versions.length === 0 ? <div className="versions-empty"><History size={29} strokeWidth={1} /><h3>No saved versions</h3><p>Save a version to restore or tailor later.</p></div> : <div className="versions-list">{versions.map(v => <article className="version-item" key={v.id}><div className="version-icon"><FileText size={19} /></div><div><h3>{v.title}</h3><span>{new Date(v.savedAt).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })} · {v.template}</span><div className="version-actions"><button onClick={() => { change(normalizeDraft(v)); toast.success('Version restored. Undo returns to your previous draft.'); }}><RotateCcw size={12} /> Restore</button><button aria-label={'Download backup of ' + v.title} onClick={() => downloadFile(JSON.stringify(v,null,2),fileStem(v.title)+'.syntaxis.json','application/json')}><Download size={12} /> Backup</button></div></div><button className="icon-button version-delete" aria-label={'Delete version ' + v.title} onClick={() => { if (persistVersions(versions.filter(x => x.id !== v.id))) toast('Version deleted.',{ action:{label:'Undo',onClick:()=>{const current=versionsRef.current;if(!current.some(x=>x.id===v.id))persistVersions([...current,v].sort((a,b)=>b.savedAt.localeCompare(a.savedAt)));}} }); }}><Trash2 size={14} /></button></article>)}</div>}{api.configured && session && <div className="remote-versions"><h3>Generated by the live service</h3><button className="add-entry" onClick={fetchRemoteHistory} disabled={loadingHistory}>{loadingHistory ? <Loader2 size={15} className="spin" /> : <History size={15} />} Load generation history</button>{remoteHistory.map(g => { let url = ''; try { url = safeUrl(g.downloadUrl,true); } catch { return null; } return <a key={g.id} className="remote-version" href={url} target="_blank" rel="noopener noreferrer"><FileText size={16} /><span>{g.versionName}</span><Download size={15} /></a>; })}</div>}</TabsContent>
      </Tabs></aside>
      <section className="editor-preview" aria-label="Live résumé preview"><div className="preview-topline"><span className="micro">{showPdf && pdfFresh ? 'ACTUAL LATEX PDF' : 'INSTANT HTML PREVIEW'}</span><div><span>{currentTemplate.name}</span><span className="preview-language">{draft.language.toUpperCase()}</span></div></div><div className="preview-paper-scroll">{showPdf && pdfFresh ? <iframe className="latex-pdf-frame" title="Compiled LaTeX résumé" src={compiledPdf!.url} /> : <><ResumePreview resume={r} template={draft.template} language={draft.language} className="workspace-paper" />{!r.name && !r.summary && <div className="preview-empty-note"><PenLine size={17} /><span>Add your experience to begin.</span></div>}</>}</div><div className="preview-bottomline"><span><FileText size={13} /> Letter · {currentTemplate.name}</span><div className="latex-preview-actions">{showPdf && pdfFresh && <button onClick={() => setShowPdf(false)}>Quick preview</button>}{pdfFresh && !showPdf && <button onClick={() => setShowPdf(true)}>View PDF</button>}<button disabled={pdfBusy || !ready} onClick={() => { void compilePdf(false); }}>{pdfBusy ? <Loader2 size={13} className="spin"/> : <Printer size={13}/>} {pdfBusy ? 'Compiling…' : 'Compile PDF'}</button>{pdfFresh && <button onClick={() => triggerPdfDownload(compiledPdf!.url)}><Download size={13}/> Download</button>}</div></div>{pdfBusy && <p className="latex-pdf-status" role="status">{pdfProgress || 'Compiling with pdfTeX…'}</p>}{pdfError && <p className="latex-pdf-error" role="alert">{pdfError}</p>}<div className="writing-progress"><span>{completion}/5 essentials added</span><div aria-label={completion+' of 5 essentials added'}>{[0,1,2,3,4].map(i=><span className={i<completion?'complete':''} key={i}/>)}</div></div></section>
    </div>
    <Dialog open={modal !== null} onOpenChange={open => { if (!open && !busy) setModal(null); }}><DialogContent className="syntaxis-dialog workspace-dialog" onInteractOutside={e => { if (busy) e.preventDefault(); }} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }}>
      {modal === 'save' && <><DialogHeader><DialogTitle>Keep this chapter.</DialogTitle><DialogDescription>Save a named snapshot on this device. Your draft stays editable.</DialogDescription></DialogHeader><form onSubmit={e=>{e.preventDefault();if(saveVersion(versionName))setModal(null);}}><Field label="Version name" value={versionName} onChange={setVersionName} placeholder="e.g. Product engineer — October" required maxLength={160} /><FormError message={formError} /><button className="button button-black dialog-submit" type="submit"><Save size={16}/> Save version</button></form></>}
      {modal === 'import' && <><DialogHeader><DialogTitle>Import résumé</DialogTitle><DialogDescription>Start from a saved résumé or a connected profile. Review before applying.</DialogDescription></DialogHeader><Tabs value={importType} onValueChange={value=>{importRequest.current++;setImportType(value);setImportDraft(null);setImportValue('');setFormError('');}}><TabsList className="import-tabs"><TabsTrigger value="backup"><FileJson size={15}/> Backup</TabsTrigger><TabsTrigger value="github"><GitFork size={15}/> GitHub</TabsTrigger><TabsTrigger value="linkedin"><BriefcaseBusiness size={15}/> LinkedIn</TabsTrigger></TabsList><TabsContent value="backup"><input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose résumé JSON backup" onChange={e=>{readFile(e.target.files?.[0]);e.target.value='';}}/><button className="file-dropzone" onClick={()=>fileInput.current?.click()}><Upload size={26} strokeWidth={1.2}/><span>Choose your JSON backup</span><small>A Syntaxis export · up to 1 MB</small></button></TabsContent>{['github','linkedin'].map(source=><TabsContent value={source} key={source}>{(!api.configured||!importsEnabled)&&<div className="connection-notice"><Laptop size={20}/><div><h3>You’re in the standalone workspace.</h3><p>Profile imports become available when the live service is connected. Your editor, templates, and exports work now.</p></div></div>}<form onSubmit={importProfile}><Field label={source==='github'?'GitHub username':'LinkedIn profile URL'} value={importValue} onChange={setImportValue} placeholder={source==='github'?'your-username':'https://www.linkedin.com/in/your-name'} required /><p className="field-hint">A connected import uses account credits and sends this profile identifier to the service.</p><button className="button button-black dialog-submit" type="submit" disabled={busy||!api.configured||!importsEnabled}>{busy?<Loader2 size={16} className="spin"/>:<Upload size={16}/>} Import profile</button></form></TabsContent>)}</Tabs><FormError message={formError}/>{importDraft&&<div className="import-review"><h3>{importDraft.resume.name||'Untitled résumé'}</h3><p>{importDraft.resume.experience.length} positions · {importDraft.resume.projects.length} projects · {importDraft.resume.skills.filter(Boolean).length} skills</p><p className="field-hint">This replaces the open draft. You can undo the import.</p><button className="button button-black full-width" onClick={applyImport}><Check size={16}/> Use this résumé</button></div>}</>}
      {modal === 'account' && <><DialogHeader><DialogTitle>{session?'Your account.':signUp?'A new chapter starts here.':'Welcome back.'}</DialogTitle><DialogDescription>{session?'Connected to the Syntaxis service.': 'Sign in to use connected profile imports and generation.'}</DialogDescription></DialogHeader>{session?<div className="account-details"><p>{session.user.name}</p><span>{session.user.email}</span><FormError message={formError}/><button className="button button-ghost dialog-submit" onClick={signOut} disabled={busy}><LogOut size={16}/> Sign out</button></div>:<form onSubmit={authenticate}>{signUp&&<Field label="Name" value={auth.name} onChange={name=>setAuth({...auth,name})} autoComplete="name" required/>}<Field label="Email" value={auth.email} onChange={email=>setAuth({...auth,email})} autoComplete="email" type="email" required/><Field label="Password" value={auth.password} onChange={password=>setAuth({...auth,password})} autoComplete={signUp?'new-password':'current-password'} type="password" minLength={8} required/><FormError message={formError}/><button className="button button-black dialog-submit" type="submit" disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<UserRound size={16}/>} {signUp?'Create account':'Sign in'}</button><button className="auth-switch" type="button" onClick={()=>{setSignUp(!signUp);setFormError('');}}>{signUp?'Already have an account? Sign in':'New to Syntaxis? Create an account'}</button></form>}</>}
      {modal === 'generate' && <><DialogHeader><DialogTitle>Give your story a fresh edit.</DialogTitle><DialogDescription>Generate LaTeX with the connected AI service.</DialogDescription></DialogHeader><Steps defaultOpen><StepsTrigger>What happens next</StepsTrigger><StepsContent><StepsItem>1. Your résumé is sent to the configured service.</StepsItem><StepsItem>2. Your selected template and language are included in the request.</StepsItem><StepsItem>3. Review the generated LaTeX before using it. Your local draft stays intact.</StepsItem></StepsContent></Steps><p className="field-hint">This action uses account credits. Check all AI output for accuracy.</p><FormError message={formError}/>{generated?<div className="generation-result"><Check size={20}/><h3>Your source is ready.</h3><a className="button button-black" href={safeUrl(generated.url,true)} target="_blank" rel="noopener noreferrer"><Download size={16}/> Open generated LaTeX</a>{generated.remainingCredits&&<p>{generated.remainingCredits.totalCredits} credits remaining</p>}</div>:<button className="button button-black" onClick={generate} disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<Sparkles size={16}/>} {busy?'Generating…':'Generate LaTeX'}</button>}</>}
      {modal === 'help' && <><DialogHeader><DialogTitle>A little orientation.</DialogTitle><DialogDescription>Your workspace, at a glance.</DialogDescription></DialogHeader><div className="help-items"><HelpItem icon={<PenLine/>} title="Write, then refine.">Fill in the sections on the left. Changes appear in the preview. Use Undo to step back.</HelpItem><HelpItem icon={<Layers3/>} title="Find your form.">Choose Design to switch among three templates or change the language of your section headings.</HelpItem><HelpItem icon={<History/>} title="Keep your options open.">Save a named version before tailoring your résumé for another role. Restore it from Versions.</HelpItem><HelpItem icon={<Download/>} title="Take it with you.">Export a JSON backup or the original LaTeX template. Compile PDF runs pdfTeX in your browser and shows the exact result. The first run downloads the compiler and packages; an isolated browser tab is required.</HelpItem></div><div className="connection-notice"><ShieldCheck size={21}/><p>Drafts and versions are saved on this device. Clearing browser data removes them. Keep a downloaded backup of anything important.</p></div></>}
    </DialogContent></Dialog>
    <AlertDialog open={reset} onOpenChange={setReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Start a fresh page?</AlertDialogTitle><AlertDialogDescription>This clears your open draft. Saved versions stay available, and Undo can restore your previous draft until you leave the workspace.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={()=>{change({...clone(defaultDraft),template:draft.template,language:draft.language});setPanel('content');toast('A fresh page, ready for your story.');}}>Start fresh</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
function Field({ label, value, onChange, multiline = false, rows = 3, className = '', ...props }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; rows?: number; className?: string; placeholder?: string; type?: string; autoComplete?: string; required?: boolean; minLength?: number; maxLength?: number }) {
  const id = useId(); const { type, ...shared } = props;
  return <div className={'field ' + className}><label htmlFor={id}>{label}</label>{multiline?<textarea id={id} value={value} onChange={e=>onChange(e.target.value)} rows={rows} maxLength={15000} {...shared}/>:<input id={id} type={type||'text'} value={value} onChange={e=>onChange(e.target.value)} maxLength={1000} {...shared}/>}</div>;
}
function FormError({ message }: { message: string }) { return message?<p className="form-error" role="alert">{message}</p>:null; }
function HelpItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) { return <div className="help-item"><span>{icon}</span><div><h3>{title}</h3><p>{children}</p></div></div>; }
