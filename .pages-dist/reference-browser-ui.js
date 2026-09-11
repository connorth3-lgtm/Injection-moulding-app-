/* MouldMaster reference browser UI polish — 2026-08-24 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const FILTERS=[['all','All'],['safety','Safety'],['materials','Materials'],['testing','Testing'],['automation','Automation'],['research','Research'],['sustainability','Sustainability']];
let active='all';

function kind(cat,row){
  const n=String(row?.[0]||''),u=String(row?.[2]||'').toLowerCase();
  if(/legislation\.gov|legislation\.govt\.nz/.test(u)||/\b(?:act|regulations?)\b/i.test(n)&&/^(?:UK|NZ)\s*[—-]/.test(n))return 'Law';
  if(/^(?:BS EN )?ISO\b|^ASTM\b|^ANSI\/PLASTICS\b|^AS\/NZS\b/i.test(n))return 'Standard';
  if(/^(?:HSE|OSHA|WorkSafe|FDA)\b/i.test(n))return 'Regulator';
  if(/doi\.org|pubmed\.ncbi|pmc\.ncbi|consensus\.app|link\.springer\.com\/article/i.test(u))return 'Research';
  if(/^EUROMAP\b/i.test(n))return 'Industry';
  if(/^(?:Autodesk|Kistler|RJG|Covestro)\b/i.test(n))return 'Technical';
  return 'Reference';
}
function status(row){
  const n=String(row?.[0]||'').trim().toLowerCase();
  if(n==='iso 20430:2020')return ['Current','ISO confirmed this edition current; status checked 24 Aug 2026.'];
  if(n==='bs en iso 20430:2020')return ['Under review','BSI lists this edition as Current, Under Review; status checked 24 Aug 2026.'];
  if(n==='ansi/plastics b151.1-2017')return ['Under review','PLASTICS lists the 2017 edition as published and under review for ISO 20430 alignment; checked 24 Aug 2026.'];
  if(n.includes('health and safety at work amendment act 2026'))return ['Future 2027','Enacted in 2026 with commencement on 1 April 2027.'];
  return null;
}
function groups(cat,row){
  const c=String(cat||'').toLowerCase(),t=(String(row?.[0]||'')+' '+String(row?.[1]||'')+' '+String(row?.[2]||'')).toLowerCase(),k=kind(cat,row),out=[];
  if(/safety|law/.test(c)||/guard|safety|lockout|hazard|puwer|coshh|hswa|osha|worksafe|fume/.test(t))out.push('safety');
  if(/materials?|polymers?|recycl/.test(c)||/polymer|resin|rheolog|viscos|moisture|drying|crystalli|regrind|feedstock/.test(t))out.push('materials');
  if(/stats|quality|validation|testing/.test(c)||/test method|capability|measurement|doe|statistics|validation|iso 294|iso 527|iso 178|iso 179|iso 180|iso 75|iso 306|iso 1183|iso 15512/.test(t))out.push('testing');
  if(/sensors?|automation|machine/.test(c)||/sensor|robot|opc ua|euromap 77|euromap 82|vision|condition monitoring|automation/.test(t))out.push('automation');
  if(k==='Research')out.push('research');
  if(/sustain|recycl/.test(c)||/life[- ]cycle|\blca\b|recycl|secondary feedstock|environmental|iso 140/.test(t))out.push('sustainability');
  return [...new Set(out)];
}
function matchesFilter(cat,row){return active==='all'||groups(cat,row).includes(active)}
function sourceRows(S){const rows=[];for(const [cat,list] of Object.entries(S||{}))for(const row of list||[])rows.push([cat,row]);return rows}
function badge(label,extra=''){return `<span class="mmsrc-badge"${extra}>${esc(label)}</span>`}
function card(cat,row){
  const st=status(row),k=kind(cat,row),statusHtml=st?badge(st[0],` title="${esc(st[1])}" aria-label="Status: ${esc(st[0])}. ${esc(st[1])}"`):'';
  return `<a class="mmsrc-link" href="${esc(row[2])}" target="_blank" rel="noopener"><span class="mmsrc-cardtop"><b>${esc(row[0])}</b><span class="mmsrc-badges">${badge(k)}${statusHtml}</span></span><small>${esc(row[1])}</small><em>Open source ↗</em></a>`;
}
function addStyles(){
  if(document.getElementById('mm-reference-ui-style'))return;
  const s=document.createElement('style');s.id='mm-reference-ui-style';
  s.textContent=`
.mmsrc-panel{position:relative}.mmsrc-head{flex:none;padding:14px 16px 11px}.mmsrc-top{align-items:center;gap:9px}.mmsrc h2{font-size:20px;line-height:1.14;letter-spacing:-.2px}.mmsrc-top p{margin:5px 0 0;font-size:13px;line-height:1.35;max-width:650px}.mmsrc-close{flex:0 0 auto;min-height:34px;padding:6px 10px;border-radius:8px;font:600 14px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif}.mmsrc-search{min-height:42px;margin-top:9px;padding:9px 11px;font-size:15px;line-height:1.2}.mmsrc-search::placeholder{color:#9aadc3;opacity:1}.mmsrc-filters{display:flex;gap:6px;overflow-x:auto;overscroll-behavior-inline:contain;margin-top:8px;padding:0 0 2px;scrollbar-width:none}.mmsrc-filters::-webkit-scrollbar{display:none}.mmsrc-filter{flex:0 0 auto;border:1px solid #36506e;background:#101f32;color:#b9cbe0;border-radius:999px;padding:6px 9px;font:650 11px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap}.mmsrc-filter[aria-pressed="true"]{background:#17364a;border-color:#55d6be;color:#eafffb}.mmsrc-body{padding:10px 16px 74px;scroll-behavior:smooth}.mmsrc-note{margin:0 0 8px;padding:9px 10px;font-size:11.5px;line-height:1.42}.mmsrc-count{margin:0 0 9px;font-size:10.5px;line-height:1.2;color:#91a7c0}.mmsrc-section{margin:0 0 15px}.mmsrc-section h3{margin:0 0 6px;font-size:17px;line-height:1.2}.mmsrc-link{padding:9px 10px;margin:5px 0;border-radius:9px}.mmsrc-cardtop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap}.mmsrc-cardtop>b{font-size:15px;line-height:1.24}.mmsrc-link small{font-size:12.5px;line-height:1.34;margin-top:3px}.mmsrc-link em{font-size:11.5px;margin-top:4px}.mmsrc-badges{display:flex;gap:4px;flex-wrap:wrap}.mmsrc-badge{display:inline-flex;align-items:center;min-height:20px;border:1px solid #3a526d;background:#0c1a2a;color:#aac2d8;border-radius:999px;padding:3px 6px;font:650 9.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap}.mmsrc-topbtn{position:absolute;z-index:4;right:14px;bottom:14px;min-height:36px;border:1px solid #45617f;background:#132940;color:#eaf5ff;border-radius:999px;padding:7px 11px;font:700 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .15s ease,transform .15s ease}.mmsrc-topbtn[data-show="1"]{opacity:1;transform:none;pointer-events:auto}.mmsrc-filter:focus-visible,.mmsrc-topbtn:focus-visible{outline:3px solid #72e6cd;outline-offset:2px}
@media(max-width:650px){.mmsrc-head{padding:max(9px,env(safe-area-inset-top)) 12px 9px}.mmsrc-top{gap:7px}.mmsrc h2{font-size:18px;line-height:1.1}.mmsrc-top p{font-size:12px;line-height:1.3;margin-top:4px}.mmsrc-close{min-height:31px;padding:5px 8px;font-size:12.5px}.mmsrc-search{min-height:39px;margin-top:7px;padding:8px 10px;font-size:14px}.mmsrc-filters{margin-top:7px}.mmsrc-filter{padding:5px 8px;font-size:10.5px}.mmsrc-body{padding:8px 12px calc(70px + env(safe-area-inset-bottom))}.mmsrc-note{font-size:11px;padding:8px 9px;margin-bottom:7px}.mmsrc-count{margin-bottom:8px}.mmsrc-section{margin-bottom:13px}.mmsrc-section h3{font-size:16px}.mmsrc-link{padding:8px 9px;margin:4px 0}.mmsrc-cardtop>b{font-size:14px}.mmsrc-link small{font-size:12px}.mmsrc-link em{font-size:11px}.mmsrc-badge{font-size:9px}.mmsrc-topbtn{right:12px;bottom:max(11px,env(safe-area-inset-bottom))}}
@media(prefers-reduced-motion:reduce){.mmsrc-topbtn{transition:none}.mmsrc-body{scroll-behavior:auto}}
`;
  document.head.appendChild(s);
}
function enhance(){
  const modal=document.querySelector('.mmsrc'),S=window.MM_REFERENCE_SOURCES;if(!modal||!S||modal.dataset.uiPolished==='1')return false;
  modal.dataset.uiPolished='1';addStyles();
  const head=modal.querySelector('.mmsrc-head'),search=modal.querySelector('.mmsrc-search'),list=modal.querySelector('.mmsrc-list'),count=modal.querySelector('.mmsrc-count'),body=modal.querySelector('.mmsrc-body'),open=document.getElementById('mm-src-open');
  if(!head||!search||!list||!count||!body)return false;
  const filters=document.createElement('div');filters.className='mmsrc-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter references');head.appendChild(filters);
  const top=document.createElement('button');top.type='button';top.className='mmsrc-topbtn';top.textContent='↑ Top';top.setAttribute('aria-label','Back to top of references');top.dataset.show='0';modal.querySelector('.mmsrc-panel')?.appendChild(top);
  const allRows=sourceRows(S);
  function chipCount(id){return id==='all'?allRows.length:allRows.filter(([cat,row])=>groups(cat,row).includes(id)).length}
  function drawFilters(){filters.innerHTML=FILTERS.map(([id,label])=>`<button type="button" class="mmsrc-filter" data-filter="${id}" aria-pressed="${active===id?'true':'false'}">${esc(label)} <span aria-hidden="true">${chipCount(id)}</span></button>`).join('')}
  function renderEnhanced(){
    const q=search.value.trim().toLowerCase();let total=0,html='';
    for(const [cat,rows] of Object.entries(S)){
      const matches=(rows||[]).filter(row=>matchesFilter(cat,row)&&(!q||row.join(' ').toLowerCase().includes(q)));
      if(!matches.length)continue;total+=matches.length;html+=`<section class="mmsrc-section"><h3>${esc(cat)}</h3>${matches.map(row=>card(cat,row)).join('')}</section>`;
    }
    const label=FILTERS.find(x=>x[0]===active)?.[1]||'All';
    count.textContent=`${total} reference${total===1?'':'s'} shown${active==='all'?'':` · ${label}`}`;
    list.innerHTML=html||'<p>No matching references for this filter.</p>';
    drawFilters();
  }
  filters.addEventListener('click',e=>{const b=e.target.closest('.mmsrc-filter');if(!b)return;active=b.dataset.filter||'all';renderEnhanced();body.scrollTo({top:0,behavior:'smooth'})});
  search.addEventListener('input',renderEnhanced);
  open?.addEventListener('click',()=>requestAnimationFrame(renderEnhanced));
  body.addEventListener('scroll',()=>{top.dataset.show=body.scrollTop>420?'1':'0'});
  top.addEventListener('click',()=>{body.scrollTo({top:0,behavior:'smooth'});search.focus({preventScroll:true})});
  renderEnhanced();
  window.MM_REFERENCE_BROWSER_UI={version:'2026-08-24',filters:FILTERS.map(x=>x[0]),sourceTypeBadges:true,verifiedStatusBadges:true,backToTop:true,mobileCompact:true};
  return true;
}
function start(){if(enhance())return;let tries=0;const id=setInterval(()=>{tries++;if(enhance()||tries>40)clearInterval(id)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
