/* MouldMaster Read Aloud — 2026.09.01.1
 * Learner-controlled text-to-speech using the browser/device speech-synthesis service.
 * No microphone access, recording, speech recognition, network upload, or learner-content storage.
 */
(function(){
  'use strict';

  const VERSION='2026.09.01.1';
  const synth=window.speechSynthesis;
  const supported=!!(synth&&window.SpeechSynthesisUtterance);
  const SPEEDS=[0.75,1,1.25,1.5];
  const EXCLUDED='script,style,noscript,template,svg,canvas,nav,form,input,textarea,select,option,button,[hidden],[aria-hidden="true"],.hidden,.mm-read-aloud,.mm-read-marker,.mm-reading-guide';
  const SOURCE_SELECTOR='p,li,h1,h2,h3,h4,h5,h6,label,blockquote,figcaption,td,th,.question,.feedback,.callout,.eyebrow';
  let units=[];
  let index=0;
  let speaking=false;
  let paused=false;
  let activeSource=null;
  let activeRoot=null;
  let ui=null;

  function visible(el){
    if(!el||!el.isConnected||el.closest(EXCLUDED))return false;
    const style=getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;
    const rect=el.getBoundingClientRect();
    return rect.width>0&&rect.height>0;
  }

  function sentenceParts(text){
    const clean=String(text||'').replace(/\s+/g,' ').trim();
    if(!clean)return [];
    if(window.Intl&&Intl.Segmenter){
      try{return [...new Intl.Segmenter(document.documentElement.lang||'en',{granularity:'sentence'}).segment(clean)].map(x=>x.segment.trim()).filter(Boolean)}catch(_){ }
    }
    return clean.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(x=>x.trim()).filter(Boolean)||[clean];
  }

  function chooseRoot(){
    const candidates=[
      '#lesson article.lesson-body',
      '.exam-card',
      '.scenario',
      '.visual-wrap',
      '.defect-card',
      'main.main',
      '.main',
      'main'
    ];
    for(const selector of candidates){
      const found=[...document.querySelectorAll(selector)].find(el=>visible(el)&&String(el.innerText||'').trim().length>20);
      if(found)return found;
    }
    return document.body;
  }

  function sourceFor(node,root){
    let el=node.parentElement;
    if(!el)return root;
    const preferred=el.closest(SOURCE_SELECTOR);
    if(preferred&&root.contains(preferred))el=preferred;
    return el;
  }

  function buildUnits(){
    const root=chooseRoot();
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const text=String(node.nodeValue||'').replace(/\s+/g,' ').trim();
      if(!text||text.length<2)return NodeFilter.FILTER_REJECT;
      const parent=node.parentElement;
      if(!parent||!visible(parent))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const out=[];
    let node;
    while((node=walker.nextNode())){
      const source=sourceFor(node,root);
      for(const sentence of sentenceParts(node.nodeValue)){
        if(sentence.length<2)continue;
        out.push({text:sentence,source});
      }
    }
    activeRoot=root;
    units=out.slice(0,1200);
    index=Math.min(index,Math.max(0,units.length-1));
    return units;
  }

  function clearHighlight(){
    if(activeSource){activeSource.classList.remove('mm-read-source-active');activeSource=null;}
  }

  function setStatus(text){
    if(!ui)return;
    ui.status.textContent=text;
    ui.position.textContent=units.length?`${Math.min(index+1,units.length)} / ${units.length}`:'0 / 0';
  }

  function updateButtons(){
    if(!ui)return;
    ui.play.textContent=paused?'Resume':speaking?'Pause':'Listen';
    ui.play.setAttribute('aria-label',paused?'Resume read aloud':speaking?'Pause read aloud':'Start read aloud');
    ui.prev.disabled=!supported||!units.length||index<=0;
    ui.next.disabled=!supported||!units.length||index>=units.length-1;
    ui.stop.disabled=!supported||(!speaking&&!paused);
  }

  function highlight(unit){
    clearHighlight();
    if(unit?.source&&visible(unit.source)){
      activeSource=unit.source;
      activeSource.classList.add('mm-read-source-active');
    }
    if(ui){
      ui.current.textContent=unit?.text||'';
      ui.current.hidden=!unit?.text;
    }
  }

  function stop(reason){
    if(supported)synth.cancel();
    speaking=false;paused=false;
    clearHighlight();
    if(ui)ui.current.hidden=true;
    setStatus(reason||'Stopped');
    updateButtons();
  }

  function speakCurrent(){
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');updateButtons();return;}
    if(!units.length)buildUnits();
    const unit=units[index];
    if(!unit){setStatus('No readable text is visible on this screen.');updateButtons();return;}
    synth.cancel();
    const utterance=new SpeechSynthesisUtterance(unit.text);
    utterance.lang=document.documentElement.lang||'en';
    utterance.rate=Number(ui?.speed?.value||1);
    utterance.onstart=()=>{
      speaking=true;paused=false;
      highlight(unit);
      setStatus('Reading');
      updateButtons();
    };
    utterance.onend=()=>{
      if(!speaking)return;
      if(index<units.length-1){index+=1;speakCurrent();}
      else stop('Finished');
    };
    utterance.onerror=event=>{
      if(event?.error==='canceled'||event?.error==='interrupted')return;
      stop('Speech playback could not continue.');
    };
    synth.speak(utterance);
  }

  function start(){
    index=0;
    buildUnits();
    if(!units.length){setStatus('No readable text is visible on this screen.');updateButtons();return;}
    speakCurrent();
  }

  function toggle(){
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');return;}
    if(paused){synth.resume();paused=false;speaking=true;setStatus('Reading');updateButtons();return;}
    if(speaking){synth.pause();paused=true;speaking=false;setStatus('Paused');updateButtons();return;}
    start();
  }

  function move(delta){
    if(!units.length)buildUnits();
    if(!units.length)return;
    index=Math.max(0,Math.min(units.length-1,index+delta));
    speaking=true;paused=false;
    speakCurrent();
  }

  function addStyles(){
    if(document.getElementById('mmReadAloudStyles'))return;
    const style=document.createElement('style');
    style.id='mmReadAloudStyles';
    style.textContent=`
      .mm-read-aloud{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147482000;width:min(360px,calc(100vw - 24px));font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#edf5ff}
      .mm-read-aloud details{border:1px solid #3b5575;border-radius:14px;background:#0c1929;box-shadow:0 12px 36px rgba(0,0,0,.35);overflow:hidden}
      .mm-read-aloud summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;padding:10px 13px;cursor:pointer;font-weight:800;background:#12243a}
      .mm-read-aloud summary::-webkit-details-marker{display:none}.mm-read-aloud summary span{color:#a9bdd6;font-size:12px;font-weight:600}
      .mm-read-panel{padding:12px;display:grid;gap:10px}.mm-read-controls{display:grid;grid-template-columns:1fr 1.35fr 1fr 1fr;gap:7px}
      .mm-read-controls button,.mm-read-speed{min-height:44px;border:1px solid #3c5878;border-radius:9px;background:#162b46;color:#f5f9ff;padding:8px}.mm-read-controls button:disabled{opacity:.45;cursor:not-allowed}
      .mm-read-play{background:#55d6be!important;color:#07131b!important;border-color:#55d6be!important;font-weight:850}
      .mm-read-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#b8c9dd;font-size:12px}.mm-read-meta label{display:flex;align-items:center;gap:6px;color:#b8c9dd}
      .mm-read-speed{width:auto;min-height:38px;padding:6px 8px;margin:0}.mm-read-status{margin:0;color:#cbd8e7}.mm-read-current{margin:0;padding:9px 10px;border-radius:9px;background:#192f4b;color:#fff;border-left:3px solid #55d6be;max-height:92px;overflow:auto}
      .mm-read-source-active{outline:3px solid #55d6be!important;outline-offset:4px!important;border-radius:4px}.mm-read-note{margin:0;color:#95abc4;font-size:11px}
      @media(max-width:680px){.mm-read-aloud{right:8px;bottom:max(8px,env(safe-area-inset-bottom));width:calc(100vw - 16px)}.mm-read-controls{grid-template-columns:1fr 1fr 1fr 1fr}}
      @media(prefers-reduced-motion:reduce){.mm-read-aloud *{scroll-behavior:auto!important}}
    `;
    document.head.appendChild(style);
  }

  function createUI(){
    if(document.querySelector('.mm-read-aloud'))return;
    addStyles();
    const host=document.createElement('aside');
    host.className='mm-read-aloud';
    host.setAttribute('aria-label','Read Aloud');
    host.dataset.version=VERSION;
    host.innerHTML=`<details><summary><b>🔊 Read Aloud</b><span>${supported?'Device voice':'Unavailable'}</span></summary><div class="mm-read-panel"><div class="mm-read-controls"><button type="button" data-mm-read="prev" aria-label="Previous sentence">◀</button><button type="button" class="mm-read-play" data-mm-read="play">Listen</button><button type="button" data-mm-read="next" aria-label="Next sentence">▶</button><button type="button" data-mm-read="stop">Stop</button></div><div class="mm-read-meta"><p class="mm-read-status" role="status" aria-live="polite">${supported?'Ready':'Speech synthesis is unavailable'}</p><label>Speed <select class="mm-read-speed" data-mm-read="speed" aria-label="Read aloud speed">${SPEEDS.map(v=>`<option value="${v}"${v===1?' selected':''}>${v}×</option>`).join('')}</select></label><span data-mm-read="position">0 / 0</span></div><p class="mm-read-current" data-mm-read="current" aria-live="off" hidden></p><p class="mm-read-note">Uses your device/browser speech-synthesis service. MouldMaster does not request microphone access or record audio.</p></div></details>`;
    document.body.appendChild(host);
    ui={
      host,
      play:host.querySelector('[data-mm-read="play"]'),
      prev:host.querySelector('[data-mm-read="prev"]'),
      next:host.querySelector('[data-mm-read="next"]'),
      stop:host.querySelector('[data-mm-read="stop"]'),
      speed:host.querySelector('[data-mm-read="speed"]'),
      status:host.querySelector('.mm-read-status'),
      position:host.querySelector('[data-mm-read="position"]'),
      current:host.querySelector('[data-mm-read="current"]')
    };
    ui.play.addEventListener('click',toggle);
    ui.prev.addEventListener('click',()=>move(-1));
    ui.next.addEventListener('click',()=>move(1));
    ui.stop.addEventListener('click',()=>stop('Stopped'));
    ui.speed.addEventListener('change',()=>{if(speaking||paused){paused=false;speaking=true;speakCurrent();}});
    host.querySelector('details').addEventListener('toggle',event=>{if(event.target.open&&!speaking&&!paused){buildUnits();setStatus(supported?'Ready':'Read Aloud is not available in this browser/device.');updateButtons();}});
    updateButtons();
  }

  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('nav button,.lesson-list button,[data-page],[data-view]');
    if(target&&(speaking||paused))stop('Stopped after navigation');
  },true);
  window.addEventListener('hashchange',()=>stop('Stopped after navigation'));
  window.addEventListener('popstate',()=>stop('Stopped after navigation'));
  window.addEventListener('pagehide',()=>stop('Stopped'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&speaking&&supported){synth.pause();paused=true;speaking=false;setStatus('Paused while app is hidden');updateButtons();}});

  const observer=new MutationObserver(()=>{
    if((speaking||paused)&&activeRoot&&!activeRoot.isConnected)stop('Stopped after screen changed');
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});

  window.MMReadAloud={version:VERSION,supported,stop:()=>stop('Stopped'),refresh:()=>buildUnits()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createUI,{once:true});else createUI();
})();
