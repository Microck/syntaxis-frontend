export const templates = [
  { id: 'vanguard', name: 'Vanguard', tagline: 'Precision, on paper.', description: 'A clear, confident layout for engineers, makers, and ambitious first chapters.', tag: 'THE TECHNICAL ONE', index: '01' },
  { id: 'silicon', name: 'Silicon', tagline: 'Quietly convincing.', description: 'A considered, editorial layout for product thinkers and people who connect the dots.', tag: 'THE VERSATILE ONE', index: '02' },
  { id: 'genesis', name: 'Genesis', tagline: 'Room for your depth.', description: 'A structured layout for experienced specialists, researchers, and the details that matter.', tag: 'THE ESTABLISHED ONE', index: '03' },
] as const;
export type TemplateId = (typeof templates)[number]['id'];
export const languages = [ ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['it', 'Italiano'], ['nl', 'Nederlands'], ['sv', 'Svenska'], ['no', 'Norsk'], ['da', 'Dansk'] ] as const;
export type Language = (typeof languages)[number][0];
export type Experience = { id: string; company: string; title: string; years: string; responsibilities: string[] };
export type Education = { id: string; school: string; degree: string; year: string };
export type Project = { id: string; name: string; description: string; url: string; technologies: string };
export type Resume = { name: string; title: string; email: string; phone: string; location: string; website: string; github: string; linkedin: string; summary: string; skills: string[]; experience: Experience[]; education: Education[]; projects: Project[] };
export type Draft = { resume: Resume; template: TemplateId; language: Language; title: string };
export type Version = Draft & { id: string; savedAt: string };
export const sampleResume: Resume = {
  name: 'Alex Morgan', title: 'Software Engineer', email: 'alex@example.com', phone: '', location: 'Brooklyn, New York', website: 'alexmorgan.dev', github: 'alexmorgan', linkedin: '',
  summary: 'Software engineer building thoughtful products at the intersection of design and technology. Turning complex problems into simple, useful experiences.',
  skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Figma', 'Systems thinking'],
  experience: [
    { id: 'exp-1', company: 'Forma', title: 'Senior Software Engineer', years: '2023 — Present', responsibilities: ['Led the design and development of a collaborative workspace used by a distributed product team.', 'Built an accessible component system that brought consistency to four product surfaces.', 'Partnered with design to make complex workflows feel intuitive.'] },
    { id: 'exp-2', company: 'Studio North', title: 'Software Engineer', years: '2020 — 2023', responsibilities: ['Shipped responsive web experiences from early prototypes to production.', 'Improved application performance through thoughtful rendering and caching.'] },
  ],
  education: [{ id: 'edu-1', school: 'New York University', degree: 'B.S. Computer Science', year: '2016 — 2020' }],
  projects: [{ id: 'proj-1', name: 'Open Canvas', description: 'An open-source, collaborative space for early ideas. Built with a focus on simplicity and accessibility.', url: 'github.com/alexmorgan/open-canvas', technologies: 'React · TypeScript · WebSockets' }],
};
export const emptyResume: Resume = { name: '', title: '', email: '', phone: '', location: '', website: '', github: '', linkedin: '', summary: '', skills: [], experience: [], education: [], projects: [] };
export const defaultDraft: Draft = { resume: emptyResume, template: 'vanguard', language: 'en', title: 'My résumé' };
export const labels: Record<Language, { summary: string; experience: string; education: string; skills: string; projects: string }> = {
  en: { summary: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Selected projects' },
  es: { summary: 'Perfil', experience: 'Experiencia', education: 'Formación', skills: 'Habilidades', projects: 'Proyectos destacados' },
  fr: { summary: 'Profil', experience: 'Expérience', education: 'Formation', skills: 'Compétences', projects: 'Projets sélectionnés' },
  de: { summary: 'Profil', experience: 'Berufserfahrung', education: 'Ausbildung', skills: 'Kenntnisse', projects: 'Ausgewählte Projekte' },
  pt: { summary: 'Perfil', experience: 'Experiência', education: 'Formação', skills: 'Competências', projects: 'Projetos selecionados' },
  it: { summary: 'Profilo', experience: 'Esperienza', education: 'Formazione', skills: 'Competenze', projects: 'Progetti selezionati' },
  nl: { summary: 'Profiel', experience: 'Werkervaring', education: 'Opleiding', skills: 'Vaardigheden', projects: 'Geselecteerde projecten' },
  sv: { summary: 'Profil', experience: 'Erfarenhet', education: 'Utbildning', skills: 'Kompetenser', projects: 'Utvalda projekt' },
  no: { summary: 'Profil', experience: 'Erfaring', education: 'Utdanning', skills: 'Ferdigheter', projects: 'Utvalgte prosjekter' },
  da: { summary: 'Profil', experience: 'Erfaring', education: 'Uddannelse', skills: 'Kompetencer', projects: 'Udvalgte projekter' },
};
export function isTemplateId(value: string): value is TemplateId { return templates.some(t => t.id === value); }
export function isLanguage(value: string): value is Language { return languages.some(l => l[0] === value); }
// Limits belong at the input boundary, never in a read-back operation.
// Reloading a saved draft must not silently truncate the user's writing.
const stringValue = (value: unknown, _max = 15000) => typeof value === 'string' ? value : '';
export function normalizeResume(value: unknown): Resume {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a Syntaxis résumé JSON file.');
  const v = value as Record<string, unknown>;
  if (!('name' in v) || !('experience' in v)) throw new Error('The file is missing résumé fields. Export a JSON backup from Syntaxis first.');
  const array = (x: unknown) => Array.isArray(x) ? x : [];
  const record = (x: unknown): Record<string, unknown> => x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : {};
  return {
    name: stringValue(v.name, 200), title: stringValue(v.title, 300), email: stringValue(v.email, 300), phone: stringValue(v.phone, 100), location: stringValue(v.location, 300), website: stringValue(v.website, 1000), github: stringValue(v.github, 500), linkedin: stringValue(v.linkedin, 1000), summary: stringValue(v.summary),
    skills: array(v.skills).map(x => stringValue(x, 200)).filter(Boolean),
    experience: array(v.experience).map((x, i) => { const e = record(x); return { id: 'exp-' + i, company: stringValue(e.company, 300), title: stringValue(e.title, 300), years: stringValue(e.years, 200), responsibilities: array(e.responsibilities).map(x => stringValue(x, 4000)).filter(Boolean) }; }),
    education: array(v.education).map((x, i) => { const e = record(x); return { id: 'edu-' + i, school: stringValue(e.school, 300), degree: stringValue(e.degree, 300), year: stringValue(e.year, 100) }; }),
    projects: array(v.projects).map((x, i) => { const e = record(x); return { id: 'proj-' + i, name: stringValue(e.name, 300), description: stringValue(e.description), url: stringValue(e.url, 1000), technologies: stringValue(e.technologies, 1000) }; }),
  };
}
export function normalizeDraft(value: unknown): Draft {
  if (!value || typeof value !== 'object') throw new Error('Invalid résumé backup.');
  const v = value as Record<string, unknown>;
  return { resume: normalizeResume(v.resume ?? v), template: typeof v.template === 'string' && isTemplateId(v.template) ? v.template : 'vanguard', language: typeof v.language === 'string' && isLanguage(v.language) ? v.language : 'en', title: stringValue(v.title, 160) || 'My résumé' };
}
export { toLatex, escapeLatex } from './latex.ts';
export function downloadFile(content: string, filename: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function fileStem(name: string) { return name.trim().replace(/[^a-zA-Z0-9\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'resume'; }
