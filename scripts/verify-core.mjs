import assert from 'node:assert/strict';
import * as model from '../lib/resume.ts';
import * as service from '../lib/api.ts';
let checks=0;
const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const sample={resume:structuredClone(model.sampleResume),template:'vanguard',language:'en',title:'Engineering — Autumn'};
check('JSON round trip preserves résumé content',()=>{
  const restored=model.normalizeDraft(JSON.parse(JSON.stringify(sample)));
  const withoutIds=r=>({...r,experience:r.experience.map(({id,...x})=>x),education:r.education.map(({id,...x})=>x),projects:r.projects.map(({id,...x})=>x)});
  assert.deepEqual(withoutIds(restored.resume),withoutIds(sample.resume));
});
check('Restoring does not truncate authored content',()=>{
  const draft=structuredClone(sample);draft.resume.summary='x'.repeat(18000);
  draft.resume.experience=Array.from({length:61},(_,i)=>({id:String(i),title:'Role',company:'Company',years:'',responsibilities:['y'.repeat(6000)]}));
  const restored=model.normalizeDraft(draft);assert.equal(restored.resume.summary.length,18000);assert.equal(restored.resume.experience.length,61);assert.equal(restored.resume.experience[0].responsibilities[0].length,6000);
});
check('Invalid imports fail with an actionable message',()=>{assert.throws(()=>model.normalizeDraft({project:'different format'}),/missing résumé fields/);assert.throws(()=>model.normalizeDraft(null),/Invalid résumé backup/);});
check('LaTeX treats commands and control characters as text',()=>{const result=model.escapeLatex('\\input{secrets} & 20% $x #1_under ~ ^');assert(!result.includes('\\input{'));for(const token of ['\\textbackslash{}','\\{','\\}','\\&','\\%','\\$','\\#','\\_','\\textasciitilde{}','\\textasciicircum{}'])assert(result.includes(token),token);});
check('All 30 template/language combinations use original structured source',()=>{for(const t of model.templates)for(const [language] of model.languages){const source=model.toLatex({...sample,template:t.id,language});if(t.id==='silicon'){assert(source.includes('\\begin{filecontents*}[overwrite]{resume.cls}'));assert(source.includes('\\documentclass{resume}'));assert(source.includes('\\begin{rSection}'));}else{assert(source.includes('\\documentclass[letterpaper,11pt]{article}'));assert(source.includes('\\resumeSubheading'));}assert(source.includes('\\begin{document}'));assert(source.endsWith('\\end{document}\n'));assert(source.includes(model.labels[language].experience));assert(source.includes('Alex Morgan'));assert(source.includes(t.id+' template / '+language));}});
check('Blank title does not export editor placeholders',()=>{const draft=structuredClone(sample);draft.resume.title='';const source=model.toLatex(draft);assert(!source.includes('Your next chapter'));assert(!source.includes('\\\\\n\\\\\n'));});
check('Unsafe remote URLs are rejected',()=>{for(const url of ['javascript:alert(1)','data:text/html,bad','http://public.example/file'])assert.throws(()=>service.safeUrl(url,true));assert.equal(service.safeUrl('https://example.com/resume.tex'),'https://example.com/resume.tex');assert.equal(service.safeUrl('http://localhost:8080/file',true),'http://localhost:8080/file');});
check('GitHub import is idempotent',()=>{const profile={user:{login:'alex'},pinnedRepos:[{name:'Test',url:'https://github.com/alex/test',description:'A project',primaryLanguage:'TypeScript'}],languages:{TypeScript:1}};const twice=service.mergeGitHub(service.mergeGitHub(model.emptyResume,profile),profile);assert.equal(twice.projects.length,1);assert.equal(twice.skills.length,1);});
check('LinkedIn import is idempotent',()=>{const profile={name:'Alex',experience:[{company:'Example',title:'Engineer',duration:'2020—2024'}],education:[{school:'University',degree:'B.S.',field:'CS'}]};const twice=service.mergeLinkedIn(service.mergeLinkedIn(model.emptyResume,profile),profile);assert.equal(twice.experience.length,1);assert.equal(twice.education.length,1);});
const original=globalThis.fetch;let recorded;
try{
  globalThis.fetch=async(url,init)=>{recorded={url,init};return new Response(JSON.stringify({success:true,url:'https://example.com/resume.tex'}),{headers:{'Content-Type':'application/json'}});};
  const api=service.createApi('https://api.example.com/');await api.generate(sample);
  check('Generation matches the backend contract',()=>{assert.equal(recorded.url,'https://api.example.com/api/generate');assert.equal(recorded.init.credentials,'include');assert.deepEqual(JSON.parse(recorded.init.body),{resumeData:sample.resume,useAI:true,templateId:'vanguard',versionName:sample.title,language:'en'});});
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json'}});
  await assert.rejects(api.github('alex'),e=>e.status===401&&e.message.includes('Sign in'));checks++;console.log('PASS Authentication failures remain failures');
  await assert.rejects(service.createApi('').generate(sample),/not connected/);checks++;console.log('PASS Disconnected mode never claims success');
  globalThis.fetch=async()=>new Response('<html>Error</html>',{status:502,headers:{'Content-Type':'text/html'}});
  await assert.rejects(api.session(),/unexpected response/);checks++;console.log('PASS Unexpected server responses are handled');
}finally{globalThis.fetch=original;}
console.log(`${checks} core behavior checks passed.`);
