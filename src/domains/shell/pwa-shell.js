/* MouldMaster PWA shell controller — 2026.09.06 */
(function(){
'use strict';
const RELEASE='2026.11.14.3';
const CONTENT='2026.08.26.1';
const REFERENCE_DATA_URL='./reference-data.html';
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function setAttr(el,name,value){if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value)}
function isMobileNav(){return !!window.matchMedia?.('(max-width:900px)').matches}
function isIOSFamily(){const ua=navigator.userAgent||'';return /iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&Number(navigator.maxTouchPoints||0)>1)}
function syncPlatformClasses(){const ios=isIOSFamily(),standalone=ios&&!!window.matchMedia?.('(display-mode: standalone)').matches;document.documentElement.classList.toggle('mm-ios-webkit',ios);document.documentElement.classList.toggle('mm-ios-standalone',standalone)}
function displayContext(){
  const requested=new URLSearchParams(location.search).get('desktopRelease')||'';
  const desktop=location.hostname==='127.0.0.1'&&/\bElectron\//.test(navigator.userAgent||'')?requested:'';
  const standalone=!desktop&&!!window.matchMedia?.('(display-mode: standalone)').matches;
  return desktop
    ?{version:desktop,mode:'Desktop package',title:'Desktop build',detail:'This desktop package uses the release version supplied by the verified desktop launcher.'}
    :{version:RELEASE,mode:standalone?'Installed PWA':'Browser',title:standalone?'Installed app updates':'Browser app updates',detail:standalone?'The installed PWA refreshes app files when online and keeps a verified offline copy.':'Browser mode uses the same verified same-origin service worker/cache as an installed PWA, so opening a normal tab never removes the installed offline copy.'};
}
function syncLabels(){
  const meta=document.querySelector('meta[name="mm-shell-release"]');if(meta)setAttr(meta,'content',RELEASE);
}
function sourceReviewDisplayDate(){
  const iso=window.MM_DATA?.assessmentQA?.qualitySuite?.sourceFreshnessReviewed||'';
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!match)return '';
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month=months[Number(match[2])-1];return month?`${Number(match[3])} ${month} ${match[1]}`:'';
}
function syncStandardsReviewDate(){
  const reviewed=sourceReviewDisplayDate();if(!reviewed)return;
  if(window.MM_DATA?.standards)window.MM_DATA.standards.verified=reviewed;
  document.querySelectorAll('small,.tiny,.muted,p,span').forEach(el=>{
    const text=el.textContent||'';
    if(/References reviewed\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/i.test(text))setText(el,text.replace(/References reviewed\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/gi,`Core safety and assessment references reviewed ${reviewed}`));
  });
}
function syncUpdateCard(){
  const ctx=displayContext();
  document.querySelectorAll('[data-mm-update-card]').forEach(card=>{
    setText(card.querySelector('.eyebrow'),'App version');
    setText(card.querySelector('h2'),ctx.title);
    const intro=card.querySelector('h2 + p');if(intro)setText(intro,ctx.detail);
    card.querySelectorAll('.stat').forEach(stat=>{
      const label=(stat.querySelector('span')?.textContent||'').trim(),value=stat.querySelector('b');
      if(label==='Installed version')setText(value,ctx.version);
      if(label==='Update mode')setText(value,ctx.mode);
    });
    if(!card.querySelector('[data-mm-repair-link]')){
      const repair=document.createElement('button');repair.type='button';repair.className='secondary';repair.dataset.mmRepairLink='1';repair.textContent='Repair app files';
      repair.addEventListener('click',()=>{if(displayContext().mode==='Desktop package')location.reload();else location.assign('./repair.html')});
      card.appendChild(repair);
    }
  });
}
function hideInternalQaProvenance(){
  document.querySelectorAll('h3').forEach(heading=>{
    if((heading.textContent||'').trim()==='Plugin-assisted QA provenance'