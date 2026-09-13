/* MouldMaster Read Aloud + Listening — 2026.09.14.2
 * Learner-controlled text-to-speech using the browser/device speech-synthesis service.
 * No microphone access, recording, speech recognition, network upload, or learner-content storage.
 */
(function(){
  'use strict';

  const VERSION='2026.09.14.2';
  const synth=window.speechSynthesis;
  const supported=!!(synth&&window.SpeechSynthesisUtterance);
  const SPEEDS=[0.75,1,1.25,1.5];
  const EXCLUDED='script,style,noscript,template,svg,canvas,nav,form,input,textarea,select,option,button,[hidden],[aria-hidden="true"],.hidden,.mm-read-aloud,.mm-read-marker,.mm-reading-guide';
  const SOURCE_SELECTOR='p,li,h1,h2,h3,h4,h5,h6,label,blockquote,figcaption,td,th,.question,.feedback,.callout,.eyebrow';
  let units=[];
  let index=0;
  let speaking=false;
  let paused=false;
  let starting=false;
  let selectedVoice=null;
  let speakToken=0;
  let activeSource=null;
  let activeRoot=null;
  let ui=null;
  let listeningUI=null;
  let playlistMode=false;
  let listeningOpen=false;
  let previousView=null;

  function visible(el){
    if(!el||!el.isConnected||el.closest(EXCLUDED))return false;
    const style=getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;
    const rect=el.getBoundingClientRect();
    return rect.width>0&&rect.height>0;
  }

  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function sentenceParts(text){
    const clean=String(text||'').replace(/\s+/g,' ').trim();
    if(!clean)return [];
    if(window.Intl&&Intl.Segmenter){
      try{return [...new Intl.Segmenter(document.documentElement.lang||'en',{granularity:'sentence'}).segment(clean)].map(x=>x.segment.trim()).filter(Boolean)}catch(_){ }
    }
    return clean.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(x=>x.trim()).filter(Boolean)||[clean];
  }

  function chooseRoot(){
    const candidates=['#lesson article.lesson-body','.exam-card','.scenario','.visual-wrap','.defect-card','main.main','.main','main'];
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
    playlistMode=false;
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
      for(const sentence of sentenceParts(node.nodeValue))if(sentence.length>=2)out.push({text:sentence,source});
    }
    activeRoot=root;
    units=out.slice(0,1200);
    index=Math.min(index,Math.max(0,units.length-1));
    return units;
  }

  function lessonText(lesson){
    const parts=[lesson.title,lesson.intro,lesson.summary];
    if(Array.isArray(lesson.objectives)&&lesson.objectives.length)parts.push('Learning objectives.',...lesson.objectives);
    if(Array.isArray(lesson.keypoints)&&lesson.keypoints.length)parts.push('Key engineering points.',...lesson.keypoints);
    if(lesson.exercise)parts.push('Shop floor exercise.',lesson.exercise);
    return parts.filter(Boolean);
  }

  function buildPlaylist(startLessonId){
    const lessons=Array.isArray(window.MM_DATA?.lessons)?window.MM_DATA.lessons:[];
    const out=[];
    for(const lesson of lessons){
      for(const piece of lessonText(lesson)){
        for(const sentence of sentenceParts(piece))out.push({text:sentence,source:null,lessonId:lesson.id,lessonTitle:lesson.title});
      }
    }
    playlistMode=true;
    activeRoot=null;
    units=out;
    const target=startLessonId??window.MMReadAloud?.currentLessonId?.();
    const found=target==null?-1:units.findIndex(unit=>String(unit.lessonId)===String(target));
    index=found>=0?found:0;
    renderListeningState();
    return units;
  }

  function clearHighlight(){if(activeSource){activeSource.classList.remove('mm-read-source-active');activeSource=null;}}

  function currentUnit(){return units[index]||null}
  function currentLessonUnit(){const unit=currentUnit();return unit?.lessonId==null?null:unit}

  function setStatus(text){
    if(ui){ui.status.textContent=text;ui.position.textContent=units.length?`${Math.min(index+1,units.length)} / ${units.length}`:'0 / 0';}
    if(listeningUI){listeningUI.status.textContent=text;}
    renderListeningState();
  }

  function refreshVoice(){
    if(!supported||typeof synth.getVoices!=='function'){selectedVoice=null;return null;}
    const voices=synth.getVoices()||[];
    if(!voices.length){selectedVoice=null;return null;}
    const lang=String(document.documentElement.lang||navigator.language||'en').toLowerCase();
    const base=lang.split('-')[0];
    selectedVoice=voices.find(v=>String(v.lang||'').toLowerCase()===lang)
      ||voices.find(v=>String(v.lang||'').toLowerCase().split('-')[0]===base)
      ||voices.find(v=>v.default)||voices[0]||null;
    return selectedVoice;
  }

  function waitForVoice(timeout=1200){
    if(refreshVoice())return Promise.resolve(selectedVoice);
    if(!supported)return Promise.resolve(null);
    return new Promise(resolve=>{
      let done=false;
      const finish=()=>{if(done)return;done=true;cleanup();resolve(refreshVoice())};
      const cleanup=()=>{clearTimeout(timer);try{synth.removeEventListener?.('voiceschanged',finish)}catch(_){}};
      const timer=setTimeout(finish,timeout);
      try{synth.addEventListener?.('voiceschanged',finish,{once:true})}catch(_){ }
    });
  }

  function updateButtons(){
    if(ui){
      ui.play.textContent=starting?'Starting…':paused?'Resume':speaking?'Pause':'Listen';
      ui.play.setAttribute('aria-label',starting?'Starting read aloud':paused?'Resume read aloud':speaking?'Pause read aloud':'Start read aloud');
      ui.prev.disabled=!supported||!units.length||index<=0;
      ui.next.disabled=!supported||!units.length||index>=units.length-1;
      ui.stop.disabled=!supported||(!speaking&&!paused&&!starting);
    }
    if(listeningUI){
      listeningUI.play.textContent=starting?'Starting…':paused?'Resume':speaking&&playlistMode?'Pause':'Play';
      listeningUI.play.disabled=!supported;
      listeningUI.stop.disabled=!supported||(!speaking&&!paused&&!starting);
    }
  }

  function highlight(unit){
    clearHighlight();
    if(unit?.source&&visible(unit.source)){activeSource=unit.source;activeSource.classList.add('mm-read-source-active');}
    if(ui){ui.current.textContent=unit?.text||'';ui.current.hidden=!unit?.text;}
    renderListeningState();
  }

  function stop(reason){
    if(supported)synth.cancel();
    speakToken+=1;
    starting=false;speaking=false;paused=false;
    clearHighlight();
    if(ui)ui.current.hidden=true;
    setStatus(reason||'Stopped');
    updateButtons();
  }

  async function speakCurrent(retry=0){
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');updateButtons();return;}
    if(!units.length)(playlistMode?buildPlaylist():buildUnits());
    const unit=currentUnit();
    if(!unit){setStatus(playlistMode?'No lesson audio is available.':'No readable text is visible on this screen.');updateButtons();return;}
    const token=++speakToken;
    starting=true;speaking=false;paused=false;
    setStatus(refreshVoice()?'Starting device voice…':'Loading device voice…');
    updateButtons();
    await waitForVoice(retry?700:1200);
    if(token!==speakToken)return;
    synth.cancel();
    const utterance=new SpeechSynthesisUtterance(unit.text);
    if(selectedVoice){utterance.voice=selectedVoice;utterance.lang=selectedVoice.lang||document.documentElement.lang||'en';}
    else utterance.lang=document.documentElement.lang||'en';
    utterance.rate=Number((playlistMode?listeningUI?.speed:ui?.speed)?.value||1);
    let started=false;
    const startTimer=setTimeout(()=>{
      if(token!==speakToken||started)return;
      synth.cancel();starting=false;speaking=false;paused=false;
      if(retry<1){selectedVoice=null;setStatus('Retrying device voice…');updateButtons();speakCurrent(1);}
      else{setStatus('Device voice did not start. Check Windows speech voices, then try again.');updateButtons();}
    },2500);
    utterance.onstart=()=>{
      if(token!==speakToken)return;
      clearTimeout(startTimer);started=true;starting=false;speaking=true;paused=false;
      highlight(unit);setStatus(playlistMode?'Listening session playing':'Reading');updateButtons();
    };
    utterance.onend=()=>{
      clearTimeout(startTimer);
      if(token!==speakToken||!speaking)return;
      if(index<units.length-1){index+=1;speakCurrent();}
      else stop('Finished all lessons');
    };
    utterance.onerror=event=>{
      clearTimeout(startTimer);
      if(token!==speakToken)return;
      if(event?.error==='canceled'||event?.error==='interrupted')return;
      starting=false;stop(`Speech playback could not continue${event?.error?`: ${event.error}`:''}.`);
    };
    try{synth.speak(utterance)}catch(err){clearTimeout(startTimer);starting=false;stop('Device voice could not be started.');console.error('MouldMaster Read Aloud:',err);}
  }

  function start(){index=0;buildUnits();if(!units.length){setStatus('No readable text is visible on this screen.');updateButtons();return;}speakCurrent();}

  function startPlaylist(startLessonId){
    stop('Ready');
    buildPlaylist(startLessonId);
    if(!units.length){setStatus('No lesson audio is available.');return;}
    speakCurrent();
  }

  function toggle(){
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');return;}
    if(starting){stop('Stopped');return;}
    if(paused){synth.resume();paused=false;speaking=true;setStatus(playlistMode?'Listening session playing':'Reading');updateButtons();return;}
    if(speaking){synth.pause();paused=true;speaking=false;setStatus('Paused');updateButtons();return;}
    start();
  }

  function togglePlaylist(){
    if(!playlistMode&&!speaking&&!paused){startPlaylist();return;}
    if(!playlistMode){stop('Ready');startPlaylist();return;}
    toggle();
  }

  function move(delta){if(!units.length)(playlistMode?buildPlaylist():buildUnits());if(!units.length)return;index=Math.max(0,Math.min(units.length-1,index+delta));speaking=false;paused=false;speakCurrent();}

  function jumpLesson(delta){
    if(!playlistMode||!units.length)buildPlaylist();
    const unit=currentLessonUnit();
    if(!unit)return;
    const lessonIds=[...new Set(units.map(x=>x.lessonId).filter(id=>id!=null))];
    const pos=Math.max(0,lessonIds.findIndex(id=>String(id)===String(unit.lessonId)));
    const nextPos=Math.max(0,Math.min(lessonIds.length-1,pos+delta));
    const target=lessonIds[nextPos];
    const found=units.findIndex(x=>String(x.lessonId)===String(target));
    if(found>=0){index=found;speaking=false;paused=false;speakCurrent();}
  }

  function renderListeningState(){
    if(!listeningUI)return;
    const unit=currentLessonUnit();
    const lessons=Array.isArray(window.MM_DATA?.lessons)?window.MM_DATA.lessons:[];
    listeningUI.lesson.textContent=unit?`Lesson ${unit.lessonId}: ${unit.lessonTitle}`:(lessons.length?`${lessons.length} lessons ready`:'Lesson library unavailable');
    listeningUI.current.textContent=unit?.text||'Press Play to start continuous listening from the lesson library.';
    const lessonIndex=unit?Math.max(0,lessons.findIndex(l=>String(l.id)===String(unit.lessonId))):0;
    listeningUI.progress.textContent=lessons.length?`Lesson ${Math.min(lessonIndex+1,lessons.length)} of ${lessons.length}`:'0 lessons';
    listeningUI.bar.style.width=lessons.length?`${Math.round((lessonIndex+1)/lessons.length*100)}%`:'0%';
    updateButtons();
  }

  function openListening(){
    const main=document.querySelector('#mainContent,.main,main');
    const view=listeningUI?.view;
    if(!main||!view)return;
    if(!listeningOpen){
      previousView=[...document.querySelectorAll('.view')].find(v=>!v.classList.contains('hidden'))||null;
      document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
      view.classList.remove('hidden');
      listeningOpen=true;
      document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
      listeningUI.nav.classList.add('active');
      const title=document.getElementById('pageTitle');const subtitle=document.getElementById('pageSubtitle');
      if(title)title.textContent='Listening';if(subtitle)subtitle.textContent='Continuous lesson audio for longer study sessions.';
      renderListeningState();window.scrollTo({top:0,behavior:'smooth'});
    }
  }

  function leaveListening(){
    if(!listeningOpen)return;
    listeningOpen=false;
    listeningUI?.view?.classList.add('hidden');
    listeningUI?.nav?.classList.remove('active');
  }

  function addStyles(){
    if(document.getElementById('mmReadAloudStyles'))return;
    const style=document.createElement('style');
    style.id='mmReadAloudStyles';
    style.textContent=`
      .mm-read-aloud{position:relative;z-index:9;width:auto;font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#edf5ff}.mm-read-aloud details{border:1px solid #3b5575;border-radius:12px;background:#0c1929;box-shadow:none;overflow:hidden}.mm-read-aloud details:not([open]){width:44px;height:44px;margin:0}.mm-read-aloud summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 10px;cursor:pointer;font-weight:800;background:#12243a}.mm-read-aloud details:not([open]) summary{width:44px;min-width:44px;height:44px;min-height:44px;padding:0;justify-content:center;border-radius:12px}.mm-read-aloud details:not([open]) summary b{font-size:0}.mm-read-aloud details:not([open]) summary b::before{content:'🔊';font-size:18px;line-height:1}.mm-read-aloud details:not([open]) summary span{display:none}.mm-read-aloud details[open]{position:fixed;right:12px;top:72px;z-index:2147482000;width:min(360px,calc(100vw - 24px));box-shadow:0 12px 36px rgba(0,0,0,.35)}.mm-read-aloud summary::-webkit-details-marker{display:none}.mm-read-aloud summary span{color:#a9bdd6;font-size:12px;font-weight:600}.mm-read-panel{padding:12px;display:grid;gap:10px}.mm-read-controls{display:grid;grid-template-columns:1fr 1.35fr 1fr 1fr;gap:7px}.mm-read-controls button,.mm-read-speed{min-height:44px;border:1px solid #3c5878;border-radius:9px;background:#162b46;color:#f5f9ff;padding:8px}.mm-read-controls button:disabled{opacity:.45;cursor:not-allowed}.mm-read-play{background:#55d6be!important;color:#07131b!important;border-color:#55d6be!important;font-weight:850}.mm-read-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#b8c9dd;font-size:12px}.mm-read-meta label{display:flex;align-items:center;gap:6px;color:#b8c9dd}.mm-read-speed{width:auto;min-height:38px;padding:6px 8px;margin:0}.mm-read-status{margin:0;color:#cbd8e7}.mm-read-current{margin:0;padding:9px 10px;border-radius:9px;background:#192f4b;color:#fff;border-left:3px solid #55d6be;max-height:92px;overflow:auto}.mm-read-source-active{outline:3px solid #55d6be!important;outline-offset:4px!important;border-radius:4px}.mm-read-note{margin:0;color:#95abc4;font-size:11px}
      .mm-listening-view{display:grid;gap:16px}.mm-listening-hero{padding:26px;background:radial-gradient(circle at 88% 0%,rgba(85,214,190,.18),transparent 36%),linear-gradient(145deg,#12243a,#0d1b2d)}.mm-listening-hero h2{margin:7px 0 8px;font-size:30px}.mm-listening-hero p{color:#b9cbe0;line-height:1.6;max-width:820px}.mm-listening-player{padding:22px;display:grid;gap:16px}.mm-listening-now{padding:18px;border-radius:14px;background:#0b1728;border:1px solid #304b69}.mm-listening-now h3{margin:4px 0 10px}.mm-listening-current{color:#dce8f6;line-height:1.65;min-height:52px}.mm-listening-controls{display:grid;grid-template-columns:1fr 1fr 1.4fr 1fr 1fr;gap:8px}.mm-listening-controls button{min-height:48px;border-radius:10px;border:1px solid #3b5879;background:#162b46;color:#f5f9ff}.mm-listening-controls .play{background:#55d6be;color:#07131b;font-weight:850;border-color:#55d6be}.mm-listening-options{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.mm-listening-options label{display:flex;align-items:center;gap:8px}.mm-listening-progress{height:8px;background:#21324a;border-radius:999px;overflow:hidden}.mm-listening-progress span{display:block;height:100%;background:linear-gradient(90deg,#55d6be,#69a8ff);width:0}.mm-listening-privacy{padding:14px 16px;border-left:4px solid #55d6be;background:#10263a;border-radius:10px;color:#d5ece7;line-height:1.55}
      @media(max-width:700px){.mm-read-aloud details[open]{top:auto;right:8px;bottom:calc(var(--mm-mobile-nav-clearance,104px) + env(safe-area-inset-bottom) + 10px);width:calc(100vw - 16px)}.mm-read-controls{grid-template-columns:1fr 1fr 1fr 1fr}.mm-listening-controls{grid-template-columns:1fr 1fr}.mm-listening-controls .play{grid-column:1/-1;grid-row:1}.mm-listening-hero{padding:20px}}
      @media(prefers-reduced-motion:reduce){.mm-read-aloud *{scroll-behavior:auto!important}}
    `;
    document.head.appendChild(style);
  }

  function createListeningTab(){
    const nav=document.getElementById('nav');
    const main=document.querySelector('#mainContent,.main,main');
    if(!nav||!main||document.getElementById('mmListeningView'))return;
    const navButton=document.createElement('button');
    navButton.type='button';navButton.dataset.mmListeningTab='1';navButton.innerHTML='🔊 <span>Listening</span>';
    const pathButton=nav.querySelector('[data-view="path"]');
    pathButton?.insertAdjacentElement('afterend',navButton);
    if(!pathButton)nav.prepend(navButton);

    const view=document.createElement('section');
    view.id='mmListeningView';view.className='view hidden mm-listening-view';
    view.innerHTML=`<section class="card mm-listening-hero"><span class="eyebrow">Long-session audio learning</span><h2>Listen through MouldMaster lessons continuously</h2><p>Start once and move through the lesson library hands-free. Playback uses the same local device voice as Read Aloud, with no microphone, recording or cloud audio upload.</p></section><section class="card mm-listening-player"><div class="mm-listening-now"><span class="eyebrow">Now listening</span><h3 data-mm-listening-lesson>Lesson library ready</h3><p class="mm-listening-current" data-mm-listening-current>Press Play to start continuous listening from the lesson library.</p></div><div class="mm-listening-controls"><button type="button" data-mm-listening="prev-lesson">⏮ Previous lesson</button><button type="button" data-mm-listening="back">◀ Sentence</button><button type="button" class="play" data-mm-listening="play">Play</button><button type="button" data-mm-listening="forward">Sentence ▶</button><button type="button" data-mm-listening="next-lesson">Next lesson ⏭</button></div><div class="mm-listening-options"><p class="mm-read-status" data-mm-listening-status role="status" aria-live="polite">${supported?'Ready':'Speech synthesis is unavailable'}</p><label>Speed <select class="mm-read-speed" data-mm-listening-speed aria-label="Listening speed">${SPEEDS.map(v=>`<option value="${v}"${v===1?' selected':''}>${v}×</option>`).join('')}</select></label><button type="button" class="ghost" data-mm-listening="stop">Stop</button><strong data-mm-listening-progress-text>0 lessons</strong></div><div class="mm-listening-progress" aria-hidden="true"><span data-mm-listening-bar></span></div><div class="mm-listening-privacy"><b>Designed for long sessions:</b> Listening mode continues when this app tab is in the background where the browser/device permits it. Normal one-screen Read Aloud still pauses when the app is hidden.</div></section>`;
    main.appendChild(view);
    listeningUI={view,nav:navButton,play:view.querySelector('[data-mm-listening="play"]'),stop:view.querySelector('[data-mm-listening="stop"]'),speed:view.querySelector('[data-mm-listening-speed]'),status:view.querySelector('[data-mm-listening-status]'),lesson:view.querySelector('[data-mm-listening-lesson]'),current:view.querySelector('[data-mm-listening-current]'),progress:view.querySelector('[data-mm-listening-progress-text]'),bar:view.querySelector('[data-mm-listening-bar]')};
    navButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openListening();});
    view.querySelector('[data-mm-listening="play"]').addEventListener('click',togglePlaylist);
    view.querySelector('[data-mm-listening="stop"]').addEventListener('click',()=>stop('Stopped'));
    view.querySelector('[data-mm-listening="back"]').addEventListener('click',()=>move(-1));
    view.querySelector('[data-mm-listening="forward"]').addEventListener('click',()=>move(1));
    view.querySelector('[data-mm-listening="prev-lesson"]').addEventListener('click',()=>jumpLesson(-1));
    view.querySelector('[data-mm-listening="next-lesson"]').addEventListener('click',()=>jumpLesson(1));
    listeningUI.speed.addEventListener('change',()=>{if(playlistMode&&(speaking||paused)){paused=false;speaking=true;speakCurrent();}});
    renderListeningState();
  }

  function createUI(){
    if(document.querySelector('.mm-read-aloud'))return;
    addStyles();
    const host=document.createElement('aside');
    host.className='mm-read-aloud';host.setAttribute('aria-label','Read Aloud');host.dataset.version=VERSION;
    host.innerHTML=`<details><summary><b>🔊 Listen</b><span>${supported?'Device voice':'Unavailable'}</span></summary><div class="mm-read-panel"><div class="mm-read-controls"><button type="button" data-mm-read="prev" aria-label="Previous sentence">◀</button><button type="button" class="mm-read-play" data-mm-read="play">Listen</button><button type="button" data-mm-read="next" aria-label="Next sentence">▶</button><button type="button" data-mm-read="stop">Stop</button></div><div class="mm-read-meta"><p class="mm-read-status" role="status" aria-live="polite">${supported?'Ready':'Speech synthesis is unavailable'}</p><label>Speed <select class="mm-read-speed" data-mm-read="speed" aria-label="Read aloud speed">${SPEEDS.map(v=>`<option value="${v}"${v===1?' selected':''}>${v}×</option>`).join('')}</select></label><span data-mm-read="position">0 / 0</span></div><p class="mm-read-current" data-mm-read="current" aria-live="off" hidden></p><p class="mm-read-note">Uses your device/browser speech-synthesis service. MouldMaster does not request microphone access or record audio.</p></div></details>`;
    const actions=document.querySelector('#app .top-actions,.top-actions');(actions||document.body).appendChild(host);
    ui={host,play:host.querySelector('[data-mm-read="play"]'),prev:host.querySelector('[data-mm-read="prev"]'),next:host.querySelector('[data-mm-read="next"]'),stop:host.querySelector('[data-mm-read="stop"]'),speed:host.querySelector('[data-mm-read="speed"]'),status:host.querySelector('.mm-read-status'),position:host.querySelector('[data-mm-read="position"]'),current:host.querySelector('[data-mm-read="current"]')};
    ui.play.addEventListener('click',toggle);ui.prev.addEventListener('click',()=>move(-1));ui.next.addEventListener('click',()=>move(1));ui.stop.addEventListener('click',()=>stop('Stopped'));
    ui.speed.addEventListener('change',()=>{if(speaking||paused){paused=false;speaking=true;speakCurrent();}});
    host.querySelector('details').addEventListener('toggle',event=>{if(event.target.open&&!speaking&&!paused){buildUnits();setStatus(supported?'Ready':'Read Aloud is not available in this browser/device.');updateButtons();}});
    refreshVoice();if(supported&&!selectedVoice)setStatus('Device voice will load when playback starts.');updateButtons();
    createListeningTab();
  }

  if(supported){try{synth.addEventListener?.('voiceschanged',()=>{if(refreshVoice()&&ui&&!starting&&!speaking&&!paused){setStatus('Ready');updateButtons();}})}catch(_){ }}

  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('nav button,.lesson-list button,[data-page],[data-view]');
    if(!target||target.dataset.mmListeningTab)return;
    if(listeningOpen)leaveListening();
    if((speaking||paused||starting)&&!playlistMode)stop('Stopped after navigation');
  },true);
  window.addEventListener('hashchange',()=>{if(!playlistMode)stop('Stopped after navigation')});
  window.addEventListener('popstate',()=>{if(!playlistMode)stop('Stopped after navigation')});
  window.addEventListener('pagehide',()=>stop('Stopped'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&speaking&&supported&&!playlistMode){synth.pause();paused=true;speaking=false;setStatus('Paused while app is hidden');updateButtons();}});

  const observer=new MutationObserver(()=>{if((speaking||paused)&&activeRoot&&!activeRoot.isConnected&&!playlistMode)stop('Stopped after screen changed');});
  observer.observe(document.documentElement,{subtree:true,childList:true});

  window.MMReadAloud={version:VERSION,supported,stop:()=>stop('Stopped'),refresh:()=>buildUnits(),startPlaylist,openListening,currentLessonId:()=>{try{return window.MM_DATA?.lessons?.find(l=>String(l.id)===String(window.currentLesson?.()?.id))?.id||null}catch(_){return null}}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createUI,{once:true});else createUI();
})();
