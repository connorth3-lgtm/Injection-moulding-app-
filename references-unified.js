/* MouldMaster unified references experience — 2026.09.06.6 */
(function(){
'use strict';

const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const arr=v=>Array.isArray(v)?v:[];
const first=(v,n=2)=>arr(v).slice(0,n).join(' · ');
const lower=v=>String(v??'').toLowerCase();

const GROUPS=[
  ['all','All'],
  ['sources','Standards & sources'],
  ['materials','Materials'],
  ['defects','Defects'],
  ['process','Process'],
  ['equipment','Equipment'],
  ['quality-safety','Quality & safety']
];

function sourceEntries(){
  const library=window.MM_SOURCE_LIBRARY||{};
  const seen=new Set(),rows=[];
  for(const [category,items] of Object.entries(library)){
    for(const source of arr(items)){
      const title=source?.[0],description=source?.[1],url=source?.[2];
      if(!title||!url||seen.has(url))continue;
      seen.add(url);
      rows.push({kind:'source',group:'sources',category,title,description,url,search:[title,description,url,category].join(' ')});
    }
  }
  return rows;
}

function practicalEntries(){
  const data=window.MM_REFERENCE_DATA||{};
  const rows=[];
  const push=(group,category,items,titleOf,summaryOf)=>{
    for(const item of arr(items))rows.push({kind:'practical',group,category,title:titleOf(item),description:summaryOf(item),raw:item,search:JSON.stringify(item)});
  };
  push('materials','Material',data.materials,x=>x.name,x=>`${x.family||''}${x.verify?` · Verify: ${x.verify}`:''}`);
  push('defects','Defect',data.defects,x=>x.name,x=>`${x.evidence||''}${x.check?.length?` · Check: ${first(x.check)}`:''}`);
  push('process','Process signal',data.signals,x=>x.name,x=>`${x.meaning||''}${x.use?` · Use: ${x.use}`:''}`);
  push('equipment','Tooling',data.tooling,x=>x.name,x=>`${x.purpose||''}${x.remember?` · ${x.remember}`:''}`);
  push('equipment','Machine',data.machine,x=>x.name,x=>`${x.role||''}${x.evidence?` · Evidence: ${x.evidence}`:''}`);
  push('quality-safety','Quality',data.quality,x=>x.name,x=>`${x.purpose||''}${x.risk?` · Risk: ${x.risk}`:''}`);
  push('quality-safety','Safety',data.safety,x=>x.name,x=>`${x.check||''}${x.never?` · Never: ${x.never}`:''}`);
  push('process','Troubleshooting',data.troubleshooting,x=>x.name,x=>`${x.pattern||''}${x.first?.length?` · Check first: ${first(x.first)}`:''}`);
  push('all','Glossary',data.glossary,x=>x?.[0]||'',x=>x?.[1]||'');
  return rows;
}

function allEntries(){return [...sourceEntries(),...practicalEntries()];}

function card(row){
  const source=row.kind==='source';
  return `<article class="mmrd-card" data-mm-reference-kind="${esc(row.kind)}"><p class="mm-ref-kind">${esc(source?`Source · ${row.category}`:row.category)}</p><h3>${esc(row.title)}</h3><p>${esc(row.description)}</p>${source?`<p><a href="${esc(row.url)}" target="_blank" rel="noopener">Open source ↗</a></p>`:''}</article>`;
}

function enhance(){
  const modal=document.querySelector('.mmrd');
  const tabsBox=modal?.querySelector('.mmrd-tabs');
  const search=modal?.querySelector('.mmrd-search');
  const grid=modal?.querySelector('.mmrd-grid');
  const count=modal?.querySelector('.mmrd-count');
  const title=modal?.querySelector('.mmrd-title h2');
  const intro=modal?.querySelector('.mmrd-title p');
  if(!modal||!tabsBox||!search||!grid||!count||!window.MM_REFERENCE_DATA){setTimeout(enhance,35);return}
  if(modal.dataset.mmUnifiedReferences==='1')return;
  modal.dataset.mmUnifiedReferences='1';

  document.title='References · MouldMaster Academy';
  const pageTitle=document.querySelector('.mm-reference-page-top strong');
  const pageSub=document.querySelector('.mm-reference-page-top span');
  if(pageTitle)pageTitle.textContent='References';
  if(pageSub)pageSub.textContent='Standards, materials, defects, process signals and troubleshooting evidence in one place.';
  if(title)title.textContent='References';
  if(intro)intro.textContent='Search the complete practical and authoritative reference library from one place.';
  search.placeholder='Search all references…';
  search.setAttribute('aria-label','Search all references');
  modal.setAttribute('aria-label','MouldMaster references');
  modal.querySelector('.mmrd-close')?.setAttribute('aria-label','Close references');

  if(!document.getElementById('mm-unified-reference-style')){
    const style=document.createElement('style');
    style.id='mm-unified-reference-style';
    style.textContent='.mm-ref-kind{margin:0 0 5px!important;color:#72e6cd!important;font-size:11px!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:.06em!important}.mmrd-card a{display:inline-flex;min-height:40px;align-items:center;color:#8ee8d7;font-weight:800;text-decoration:none}.mmrd-card a:hover{text-decoration:underline}.mmrd-tabs button{min-height:40px}';
    document.head.appendChild(style);
  }

  const rows=allEntries();
  let active='all';
  tabsBox.replaceChildren();
  for(const [key,label] of GROUPS){
    const button=document.createElement('button');
    button.type='button';button.textContent=label;button.dataset.key=key;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(key===active));
    button.addEventListener('click',()=>{active=key;for(const child of tabsBox.children)child.setAttribute('aria-selected',String(child===button));render();});
    tabsBox.appendChild(button);
  }

  function render(){
    const q=lower(search.value.trim());
    const filtered=rows.filter(row=>{
      const inGroup=active==='all'||row.group===active||(active==='all'&&row.category==='Glossary');
      return inGroup&&(!q||lower(`${row.title} ${row.description} ${row.search}`).includes(q));
    });
    count.textContent=`${filtered.length} reference${filtered.length===1?'':'s'}${active==='all'?'':` in ${GROUPS.find(x=>x[0]===active)?.[1]||active}`}`;
    grid.innerHTML=filtered.length?filtered.map(card).join(''):'<div class="mmrd-empty">No matching references.</div>';
  }

  search.addEventListener('input',()=>queueMicrotask(render));
  render();
  window.MM_REFERENCE_LIBRARY_MODE='unified-v1';
  window.MM_REFERENCE_LIBRARY_COUNTS={all:rows.length,sources:rows.filter(x=>x.group==='sources').length};
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();
