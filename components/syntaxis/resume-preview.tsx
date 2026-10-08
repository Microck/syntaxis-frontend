import { labels, type Resume, type TemplateId, type Language } from '@/lib/resume';
export function ResumePreview({ resume, template = 'vanguard', language = 'en', className = '' }: { resume: Resume; template?: TemplateId; language?: Language; className?: string }) {
  const l = labels[language];
  const contact = [resume.email, resume.phone, resume.location, resume.website, resume.github && 'github.com/' + resume.github, resume.linkedin].filter(Boolean);
  return <article className={'resume-paper resume-' + template + ' ' + className} aria-label={(resume.name || 'Your') + ' résumé preview'} lang={language}>
    <header className="resume-heading"><h2>{resume.name || <span className="screen-placeholder">Your name</span>}</h2>{resume.title ? <p className="resume-role">{resume.title}</p> : !resume.name && <p className="resume-role screen-placeholder">Your next chapter starts here</p>}{contact.length > 0 && <div className="resume-contact">{contact.map((x, i) => <span key={i}>{x}</span>)}</div>}</header>
    <div className="resume-body">
      {resume.summary && <section className="resume-summary"><h3>{l.summary}</h3><p>{resume.summary}</p></section>}
      {resume.experience.length > 0 && <section><h3>{l.experience}</h3>{resume.experience.map((x) => <div className="resume-entry" key={x.id}><div className="resume-row"><h4>{x.title || <span className="screen-placeholder">Role title</span>}</h4><span>{x.years}</span></div><p className="resume-company">{x.company}</p>{x.responsibilities.length > 0 && <ul>{x.responsibilities.filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}</ul>}</div>)}</section>}
      {resume.projects.length > 0 && <section><h3>{l.projects}</h3>{resume.projects.map(x => <div className="resume-entry" key={x.id}><h4>{x.name || <span className="screen-placeholder">Project name</span>}</h4><p>{x.description}</p>{x.technologies && <p className="resume-project-meta">{x.technologies}</p>}{x.url && <p className="resume-project-url">{x.url}</p>}</div>)}</section>}
      {resume.education.length > 0 && <section><h3>{l.education}</h3>{resume.education.map(x => <div className="resume-entry" key={x.id}><div className="resume-row"><h4>{x.degree || <span className="screen-placeholder">Degree</span>}</h4><span>{x.year}</span></div><p>{x.school}</p></div>)}</section>}
      {resume.skills.length > 0 && <section><h3>{l.skills}</h3><p className="resume-skills">{resume.skills.join('  ·  ')}</p></section>}
    </div>
  </article>;
}
