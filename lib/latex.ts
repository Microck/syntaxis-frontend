import type { Draft, Resume, TemplateId } from './resume.ts';
import { labels } from './resume.ts';
import { VANGUARD_PREAMBLE, GENESIS_PREAMBLE, SILICON_CLASS } from './latex-templates.ts';

// User input is data, never executable LaTeX. Preserve T1-supported Latin accents.
const chars: Record<string, string> = {
  '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
  '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
  '—': '---', '–': '--', '−': '$-$', '·': '\\textperiodcentered{}',
  '•': '\\textbullet{}', '…': '\\ldots{}', '“': '``', '”': "''", '‘': '`', '’': "'",
  '×': '\\texttimes{}', '°': '\\textdegree{}', '€': '\\texteuro{}',
  '™': '\\texttrademark{}', '©': '\\textcopyright{}', '®': '\\textregistered{}',
  '\u00a0': '~', '\u202f': '~', '\u200b': '', '\ufeff': '',
};
export function escapeLatex(value: string): string {
  return value.replace(/[\\&%$#_{}~^—–−·•…“”‘’×°€™©®\u00a0\u202f\u200b\ufeff]/g, ch => chars[ch]);
}
const command = (name: string, ...args: string[]) => `\\${name}` + args.map(x => `{${x}}`).join('');
const e = (value: string) => escapeLatex(value.trim());
const present = (s: string) => Boolean(s.trim());
const lines = (...values: string[]) => values.filter(present).join('\n');
const block = (begin: string, content: string, end: string) => content.trim() ? `${begin}\n${content}\n${end}\n` : '';
const itemList = (items: string[]) => block('\\resumeItemListStart', items.filter(present).map(value => command('resumeItem', e(value))).join('\n'), '\\resumeItemListEnd');
const contacts = (r: Resume) => [r.email, r.phone, r.location, r.website, r.github && (r.github.startsWith('http') ? r.github : 'github.com/' + r.github), r.linkedin]
  .filter(present).map(e).join(' \\enspace $|$ \\enspace ');
const summaryText = (s: string) => e(s).replace(/\n\s*\n/g, '\n\\par\n');
const section = (title: string, body: string) => body.trim() ? `\\section{${e(title)}}\n${body}\n` : '';
const subheading = (a: string, b: string, c: string, d: string) => command('resumeSubheading', e(a), e(b), e(c), e(d));
const subheadingList = (body: string) => block('\\resumeSubHeadingListStart', body, '\\resumeSubHeadingListEnd');

function standardLatex(draft: Draft, template: 'vanguard' | 'genesis') {
  const r = draft.resume, l = labels[draft.language];
  const education = subheadingList(r.education.map(x => subheading(x.school, x.year, x.degree, '')).join('\n'));
  const experience = subheadingList(r.experience.map(x =>
    subheading(x.company, x.years, x.title, '') + '\n' + itemList(x.responsibilities)).join('\n'));
  const projects = subheadingList(r.projects.map(x => template === 'vanguard'
    ? lines(command('resumeProjectHeading', `\\textbf{${e(x.name)}}${x.technologies ? ' $|$ \\emph{' + e(x.technologies) + '}' : ''}`, ''), itemList([x.description, x.url]))
    : command('resumeSubItem', e(x.name), e([x.description, x.technologies, x.url].filter(present).join(' | ')))
  ).join('\n'));
  const skills = r.skills.filter(present).map(e).join(' \\enspace \\textbullet{} \\enspace ');
  const header = template === 'vanguard' ?
    `\\begin{center}\n\\textbf{\\Huge \\scshape ${e(r.name)}}${r.title ? ' \\\\\n' + e(r.title) : ''}\n${contacts(r) ? '\\\\\n\\small ' + contacts(r) : ''}\n\\end{center}` :
    `\\begin{center}\n{\\LARGE\\bfseries ${e(r.name)}}${r.title ? ' \\\\\n' + e(r.title) : ''}\n${contacts(r) ? '\\\\\n\\small ' + contacts(r) : ''}\n\\end{center}`;
  const base = template === 'vanguard' ? VANGUARD_PREAMBLE : GENESIS_PREAMBLE;
  return `${base}\n\\begin{document}\n\\null\n${header}\n` +
    section(l.summary, summaryText(r.summary)) + section(l.education, education) +
    section(l.experience, experience) + section(l.projects, projects) +
    section(l.skills, skills) + '\\end{document}\n';
}

function siliconLatex(draft: Draft) {
  const r = draft.resume, l = labels[draft.language];
  const s = (title: string, content: string) => block(`\\begin{rSection}{${e(title)}}`, content, '\\end{rSection}');
  const education = r.education.map(x => lines(`\\textbf{${e(x.degree)}} \\hfill ${e(x.year)}\\\\`, e(x.school), '\\medskip')).join('\n');
  const experience = r.experience.map(x => block(
    command('begin', 'rSubsection') + `{${e(x.company)}}{${e(x.years)}}{${e(x.title)}}{}`,
    x.responsibilities.filter(present).map(v => '\\item ' + e(v)).join('\n') || '\\item[]',
    '\\end{rSubsection}'
  )).join('\n');
  const projects = r.projects.map(x => {
    const name = `\\textbf{${e(x.name)}}${x.technologies ? ' \\textit{(' + e(x.technologies) + ')}' : ''}`;
    const details = [x.description, x.url].filter(present).map(e);
    const nextLine = ' ' + String.raw`\\` + '\n';
    return name + (details.length ? nextLine + details.join(nextLine) : '') + '\n\\medskip';
  }).join('\n');
  const contact = contacts(r);
  // Embed the original resume.cls so the downloaded source is self-contained.
  return String.raw`\begin{filecontents*}[overwrite]{resume.cls}` + '\n' + SILICON_CLASS + '\n' + String.raw`\end{filecontents*}` + '\n' +
    String.raw`\documentclass{resume}` + '\n' +
    String.raw`\usepackage[utf8]{inputenc}` + '\n' +
    String.raw`\usepackage[T1]{fontenc}` + '\n' +
    String.raw`\usepackage{textcomp}` + '\n' +
    String.raw`\usepackage{lmodern}` + '\n' +
    String.raw`\usepackage[left=0.6in,right=0.6in,top=0.55in,bottom=0.55in]{geometry}` + '\n' +
    command('name', e(r.name) || ' ') + '\n' +
    (r.title ? command('address', e(r.title)) + '\n' : '') +
    (contact ? command('address', contact) + '\n' : '') +
    String.raw`\begin{document}` + '\n\\null\n' +
    s(l.summary, summaryText(r.summary)) + s(l.education, education) +
    s(l.skills, r.skills.filter(present).map(e).join(' \\enspace \\textbullet{} \\enspace ')) +
    s(l.experience, experience) + s(l.projects, projects) +
    String.raw`\end{document}` + '\n';
}

export function toLatex(draft: Draft): string {
  const template: TemplateId = draft.template;
  const body = template === 'silicon' ? siliconLatex(draft) : standardLatex(draft, template);
  return `% Syntaxis — original ${template} template / ${draft.language}\n` +
    '% Repaired and filled from the original Syntaxis backend design. Compile with pdfLaTeX.\n' + body;
}
