import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { sampleResume,emptyResume,languages,templates } from '../lib/resume.ts';
import { escapeLatex,toLatex } from '../lib/latex.ts';
const dir=mkdtempSync(path.join(os.tmpdir(),'syntaxis-latex-'));let count=0;
function run(name,draft,include=[]){
  const src=toLatex(draft);assert(src.includes('\\begin{document}'));assert(src.includes('\\end{document}'));assert(!/\{\{(?:#each|\/each|name\}\}|email\}\}|this\}\})/.test(src));
  const tex=path.join(dir,name+'.tex');writeFileSync(tex,src,'utf8');
  const result=spawnSync('pdflatex',['-no-shell-escape','-halt-on-error','-interaction=nonstopmode','-output-directory',dir,tex],{cwd:dir,timeout:30000,encoding:'utf8'});
  assert.equal(result.status,0,`${name} failed: ${(result.stdout||result.stderr).slice(-1800)}`);
  const pdf=path.join(dir,name+'.pdf'),bytes=readFileSync(pdf);assert(bytes.length>100&&bytes.subarray(0,5).toString()==='%PDF-');
  const info=spawnSync('pdfinfo',[pdf],{encoding:'utf8'});assert.equal(info.status,0);const pages=Number(info.stdout.match(/Pages:\s*(\d+)/)?.[1]||0);assert(pages>=1);if(name.endsWith('-multipage'))assert(pages>1);
  const extracted=spawnSync('pdftotext',[pdf,'-'],{encoding:'utf8'});assert.equal(extracted.status,0);for(const word of include)assert(extracted.stdout.toLocaleLowerCase().includes(word.toLocaleLowerCase()),name+' missing '+word);count++;
}
try{
  for(const template of templates)for(const [language] of languages)run(`${template.id}-${language}`,{template:template.id,language,title:'Test',resume:sampleResume},['Alex Morgan','Forma','Open Canvas']);
  const special=structuredClone(sampleResume);special.name='María Núñez & Co.';special.summary='Led 95% of $20k R&D — shipped cafés, €100k projects & 4× growth. Never use \\input{secrets.txt}.';special.experience[0].company='Málaga #1 & Sons';special.projects[0].name='100% real {project}';
  for(const template of templates){run(`${template.id}-special`,{template:template.id,language:'es',title:'Test',resume:special},['María Núñez','Málaga','100% real']);run(`${template.id}-empty`,{template:template.id,language:'en',title:'Blank',resume:emptyResume});}
  const long=structuredClone(sampleResume);long.summary='A technically detailed professional summary with measurable achievements. '.repeat(42);long.experience=Array.from({length:16},(_,i)=>({id:`e${i}`,company:`Company ${i+1}`,title:'Senior Engineer',years:'2020 -- Present',responsibilities:Array.from({length:4},(_,j)=>`Achievement ${i+1}.${j+1}: improved reliability and product quality by simplifying complex workflows.`)}));long.projects=Array.from({length:10},(_,i)=>({id:`p${i}`,name:`Project ${i+1}`,description:`Designed and shipped application ${i+1}, including accessible interfaces and secure integration.`,technologies:'TypeScript and React',url:`https://example.org/p${i}`}));
  for(const template of templates)run(`${template.id}-multipage`,{template:template.id,language:'en',title:'Long',resume:long},['Company 16','Project 10']);
  assert(!escapeLatex('\\input{secrets} & 20% $x #1_under ~ ^').includes('\\input{'));
  console.log(`PASS ${count} actual pdfLaTeX compilations: 3 templates, 10 languages, escaping, empty documents, pagination, extracted text.`);
}finally{rmSync(dir,{recursive:true,force:true});}
