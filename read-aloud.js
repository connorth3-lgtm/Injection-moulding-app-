/* MouldMaster Book Read Aloud — 2026.10.21.3
 * Learner-controlled text-to-speech using the browser/device speech-synthesis service.
 * No microphone access, recording, speech recognition, network upload, or learner-content storage.
 */
(function(){
  'use strict';

  const VERSION='2026.10.21.3';
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
  let preferredVoiceId='';
  let speakToken=0;
  let activeSource=null;
  let activeRoot=null;
  let ui=null;
  let listeningUI=null;
  let playlistMode=false;
  // Navigation while paused/stopped selects the next unit without permission
  // to start new speech. The next explicit Play consumes this selection.
  let selectionPending=false;
  let listeningOpen=false;
  let previousView=null;
  let queuedBookStart=null;
  let bookChapterCache=[];
  let appAudioContext=null;
  let appAudioTimer=null;

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

  function visibleBookView(){
    const book=document.getElementById('mmBookView');
    return book&&visible(book)?book:null;
  }

  function syncBookScope(){
    const inBook=!!visibleBookView();
    if(ui?.host&&ui.host.hidden===inBook)ui.host.hidden=!inBook;
    if(!inBook){
      if(speaking||paused||starting||appAudioTimer)stop('Stopped after leaving Book');
      if(activeRoot||units.length||bookChapterCache.length){
        activeRoot=null;units=[];index=0;bookChapterCache=[];
        refreshBookControls();
        updateButtons();
      }
    }
    return inBook;
  }

  function chooseRoot(){
    // Read Aloud is available only inside the visible Book. Lesson, exam,
    // scenario and generic page text are never fallback narration sources.
    const book=visibleBookView();
    if(!book)return null;
    const reader=book.querySelector('[data-mm-book-reader]');
    if(reader&&visible(reader))return reader;
    const contents=book.querySelector('[data-mm-book-contents]');
    if(contents&&visible(contents))return contents;
    return book;
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
    if(!root){units=[];index=0;activeRoot=null;bookChapterCache=[];return units;}
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
      for(const sentence of sentenceParts(node.nodeValue))if(sentence.length>=2)out.push({text:sentence,source,node});
    }
    activeRoot=root;
    const chapterCounts=new Map(),chapters=new Map();
    for(const unit of out){
      const article=unit.source?.closest?.('[data-mm-book-audio-chapter]');
      if(!article)continue;
      const chapterId=article.dataset.mmBookAudioChapter;
      unit.bookChapterId=chapterId;
      unit.bookSentenceIndex=chapterCounts.get(chapterId)||0;
      chapterCounts.set(chapterId,unit.bookSentenceIndex+1);
      if(!chapters.has(chapterId))chapters.set(chapterId,{id:chapterId,title:article.querySelector('h2')?.textContent?.trim()||chapterId});
    }
    bookChapterCache=[...chapters.values()];
    // The Book reader can span all governed chapters, so keep one bounded
    // Book-only queue rather than a generic screen or lesson queue.
    units=out.slice(0,20000);
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
  function reportBookPosition(unit){
    if(unit?.bookChapterId)window.dispatchEvent(new CustomEvent('mm:book-audio-position',{detail:{chapterId:unit.bookChapterId,unitIndex:unit.bookSentenceIndex}}));
  }

  function setStatus(text){
    if(ui){ui.status.textContent=text;ui.position.textContent=units.length?`${Math.min(index+1,units.length)} / ${units.length}`:'0 / 0';}
    if(listeningUI){listeningUI.status.textContent=text;}
    refreshBookControls();
    renderListeningState();
  }

  function refreshVoice(){
    if(!supported||typeof synth.getVoices!=='function'){selectedVoice=null;return null;}
    let voices=[];
    try{voices=synth.getVoices()||[]}catch(_){selectedVoice=null;return null;}
    if(!voices.length){selectedVoice=null;return null;}
    if(ui?.voice){
      const sig=voices.map(v=>`${v.voiceURI||v.name}:${v.lang}`).join('|');
      if(ui.voice.dataset.signature!==sig){
        const auto=document.createElement('option');auto.value='';auto.textContent='Automatic device voice';
        const opts=voices.map(v=>{const item=document.createElement('option');item.value=v.voiceURI||`${v.name}:${v.lang}`;item.textContent=`${v.name} (${v.lang||'unknown language'})`;return item;});
        ui.voice.replaceChildren(auto,...opts);ui.voice.dataset.signature=sig;
      }
      ui.voice.value=preferredVoiceId;
    }
    const lang=String(document.documentElement.lang||navigator.language||'en').toLowerCase();
    const base=lang.split('-')[0];
    selectedVoice=voices.find(v=>(v.voiceURI||`${v.name}:${v.lang}`)===preferredVoiceId)||voices.find(v=>String(v.lang||'').toLowerCase()===lang)
      ||voices.find(v=>String(v.lang||'').toLowerCase().split('-')[0]===base)
      ||voices.find(v=>v.default)||voices[0]||null;
    return selectedVoice;
  }

  function applyAvailableVoice(utterance){
    // Android and iOS may expose a working default system voice while
    // getVoices() returns an empty list. Supplying the page's generic "en"
    // hint in that state can make some platform engines select a voice they
    // cannot synthesize. Leave lang empty and let the OS choose its default.
    if(!selectedVoice){utterance.lang='';return;}
    utterance.voice=selectedVoice;
    utterance.lang=selectedVoice.lang||document.documentElement.lang||navigator.language||'en';
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
    const appAudioActive=!!appAudioTimer;
    if(ui){
      ui.play.disabled=!supported||appAudioActive;
      ui.play.textContent=starting?'Starting…':paused?'Resume':speaking?'Pause':'Listen';
      ui.play.setAttribute('aria-label',starting?'Starting read aloud':paused?'Resume read aloud':speaking?'Pause read aloud':'Start read aloud');
      ui.testAudio.disabled=appAudioActive;
      ui.prev.disabled=!supported||!units.length||index<=0;
      ui.next.disabled=!supported||!units.length||index>=units.length-1;
      ui.stop.disabled=(!supported&&!appAudioActive)||(!speaking&&!paused&&!starting&&!appAudioActive);
    }
    if(listeningUI){
      listeningUI.play.textContent=starting?'Starting…':paused?'Resume':speaking&&playlistMode?'Pause':'Play';
      listeningUI.play.disabled=!supported;
      listeningUI.stop.disabled=!supported||(!speaking&&!paused&&!starting);
    }
  }

  function highlight(unit){
    clearHighlight();
    if(unit?.source&&visible(unit.source)){
      activeSource=unit.source;activeSource.classList.add('mm-read-source-active');
      if(ui?.follow?.checked&&unit.bookChapterId){
        const expected=activeSource;
        requestAnimationFrame(()=>{if(activeSource===expected&&visible(expected))expected.scrollIntoView({block:'center',behavior:'auto'});});
      }
    }
    if(ui){ui.current.textContent=unit?.text||'';ui.current.hidden=!unit?.text;}
    renderListeningState();
  }

  function resumePausedSpeechQueue(){
    // SpeechSynthesis can remain globally paused after an interruption even
    // when this player's own state is idle. New utterances then queue silently.
    if(!supported||typeof synth.resume!=='function')return;
    try{if(synth.paused===true)synth.resume()}catch(_){ }
  }

  function deviceIsSpeaking(){
    try{return synth.speaking===true}catch(_){return false}
  }

  function cancelDeviceSpeech(force=false){
    // Some mobile providers mishandle cancel() immediately before a new
    // utterance. Clear a device queue only when it is active, or when an
    // explicit stop/failed-start must invalidate the current request.
    if(!supported)return;
    if(!force){
      try{if(synth.speaking!==true&&synth.pending!==true)return}catch(_){return}
    }
    try{synth.cancel()}catch(_){}
  }

  function closeAppAudio(){
    if(appAudioTimer){clearTimeout(appAudioTimer);appAudioTimer=null;}
    const context=appAudioContext;appAudioContext=null;
    if(context&&context.state!=='closed'){try{context.close()}catch(_){ }}
    if(ui)updateButtons();
  }

  function primeAudioOutput(){
    const AudioContextType=window.AudioContext||window.webkitAudioContext;
    if(typeof AudioContextType!=='function')return false;
    try{
      if(!appAudioContext||appAudioContext.state==='closed')appAudioContext=new AudioContextType();
      const context=appAudioContext;
      const resumed=context.state==='running'?Promise.resolve():context.resume();
      if(appAudioTimer)clearTimeout(appAudioTimer);
      appAudioTimer=setTimeout(closeAppAudio,2500);
      Promise.resolve(resumed).then(()=>{
        if(appAudioContext!==context)return;
        if(appAudioTimer)clearTimeout(appAudioTimer);
        appAudioTimer=setTimeout(closeAppAudio,1500);
      }).catch(()=>{});
      return true;
    }catch(_){return false}
  }

  function stop(reason,cancelSpeech=true){
    closeAppAudio();
    // Invalidate active callbacks before cancel: some device voices dispatch
    // a synchronous cancellation error from synth.cancel().
    const cancelActive=starting||speaking||paused;
    speakToken+=1;
    if(cancelSpeech)cancelDeviceSpeech(cancelActive);
    selectionPending=false;
    starting=false;speaking=false;paused=false;
    clearHighlight();
    if(ui)ui.current.hidden=true;
    setStatus(reason||'Stopped');
    updateButtons();
  }

  // Mobile browser speech may require the original user gesture even when
  // getVoices() is empty. Keep desktop's delayed-voice path separate.
  const androidSpeech=/Android/i.test(navigator.userAgent||'');
  const iosSpeech=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')
    ||(/Macintosh/i.test(navigator.userAgent||'')&&Number(navigator.maxTouchPoints||0)>1);
  function speakCurrent(retry=0,replaceCurrent=false){
    selectionPending=false;
    if(playlistMode){setStatus('Book Read Aloud cannot start a lesson playlist.');updateButtons();return;}
    if(!visibleBookView()){stop('Open the Book to use Read Aloud.');return;}
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');updateButtons();return;}
    // Automatic sentence chaining must stop if the Book replaces or hides its source.
    if(!playlistMode&&units.length&&refreshStaleReading())return;
    if(!units.length)(playlistMode?buildPlaylist():buildUnits());
    const unit=currentUnit();
    if(!unit){setStatus('No readable text is visible in the Book.');updateButtons();return;}
    const token=++speakToken;
    starting=true;speaking=false;paused=false;
    setStatus(refreshVoice()?'Starting device voice…':(androidSpeech||iosSpeech)?'Starting default device voice…':'Loading device voice…');
    updateButtons();
    const beginSpeech=()=>{
      if(token!==speakToken)return;
      // Windows voices may arrive after the initial tap. Never start
      // Book speech must not start after the app tab has hidden.
      if(document.hidden&&!playlistMode){stop('Stopped because the app was hidden before speech started');return;}
      // Must run directly inside the original tap handler on Android, even
      // with an empty voice list. The platform can pick its default voice.
      if(replaceCurrent)cancelDeviceSpeech(true);
      resumePausedSpeechQueue();
      let utterance;
      try{
        utterance=new SpeechSynthesisUtterance(unit.text);
        applyAvailableVoice(utterance);
        utterance.rate=Number((playlistMode?listeningUI?.speed:ui?.speed)?.value||1);
      }catch(err){
        // Voice provider constructors and property setters can fail before
        // synth.speak() runs. Do not leave the Play button stuck at Starting.
        stop(androidSpeech||iosSpeech
          ? 'Device voice could not be prepared. Tap Listen again.'
          : 'Device voice could not be prepared. Try again.');
        console.error('MouldMaster Read Aloud:',err);
        return;
      }
      let started=false;
      let startTimer;
      const markStarted=()=>{
        if(token!==speakToken||started)return;
        // Some mobile providers begin output without dispatching onstart.
        // Use the same visibility boundary for the event and active-state fallback.
        if(document.hidden&&!playlistMode){stop('Stopped because the app was hidden before speech started');return;}
        clearTimeout(startTimer);started=true;starting=false;speaking=true;paused=false;
        highlight(unit);
        reportBookPosition(unit);
        setStatus(playlistMode?'Listening session playing':'Reading');updateButtons();
      };
      startTimer=setTimeout(()=>{
        if(token!==speakToken||started)return;
        // Do not cut off audible speech just because a provider omitted onstart.
        // SpeechSynthesis.speaking is the fallback for that mobile behavior.
        if(deviceIsSpeaking()){markStarted();return;}
        if(androidSpeech){
          // Android can omit start/boundary events and report speaking=false
          // while its provider is still initializing. Canceling here can cut
          // off the first audible word, so keep the utterance active and let
          // its late start/end or an explicit Stop settle it.
          setStatus('Android voice has not confirmed playback yet. It may still start; press Stop if it stays silent.');
          updateButtons();
          return;
        }
        // A platform may deliver a late onstart after timeout. Invalidate it
        // before canceling or retrying, including when cancel emits no error.
        speakToken+=1;
        cancelDeviceSpeech(true);starting=false;speaking=false;paused=false;
        if(iosSpeech){
          setStatus('Device voice did not start. Tap Listen again; check iOS speech settings if it stays silent.');
          updateButtons();
        }else if(retry<1){
          selectedVoice=null;setStatus('Retrying device voice…');updateButtons();speakCurrent(1);
        }else{
          setStatus('Book voice did not start. Check device text-to-speech settings, then try again.');updateButtons();
        }
      },(androidSpeech||iosSpeech)?6000:2500);
      utterance.onstart=markStarted;
      utterance.onboundary=markStarted;
      utterance.onend=()=>{
        clearTimeout(startTimer);
        // Some mobile speech providers complete an utterance without firing
        // onstart. Accept that completion while this utterance is still the
        // active start request, but ignore callbacks after Stop, Pause or a
        // newer utterance.
        if(token!==speakToken||(!speaking&&!starting))return;
        if(!started){
          if(document.hidden&&!playlistMode){stop('Stopped because the app was hidden before speech started');return;}
          starting=false;
        }
        if(index<units.length-1){index+=1;speakCurrent();}
        else {
          if(unit.bookChapterId)window.dispatchEvent(new CustomEvent('mm:book-audio-complete'));
          stop(playlistMode?'Finished all lessons':'Finished reading',false);
        }
      };
      utterance.onerror=event=>{
        clearTimeout(startTimer);
        if(token!==speakToken)return;
        // When this is the CURRENT utterance, interruption is a real
        // device failure, not a cancellation from our own Stop button.
        // Keep its sentence selected so a retry continues where the device
        // stopped instead of silently jumping back to the beginning.
        const interrupted=event?.error==='canceled'||event?.error==='interrupted';
        const code=String(event?.error||'');
        let message;
        if(interrupted){
          message=playlistMode?'Device interrupted playback. Press Play to restart.':'Device interrupted playback. Press Listen to restart this sentence.';
        }else if(androidSpeech&&code==='not-allowed'){
          message='Android blocked voice playback. Tap Listen to start audio.';
        }else if(androidSpeech&&code==='synthesis-failed'){
          message='Android text-to-speech stopped after it began. Tap Listen to retry this sentence. If it stops again, open Settings > Accessibility > Text-to-speech output, choose an engine, then download or select a voice.';
        }else if(code==='voice-unavailable'||code==='language-unavailable'){
          message='The selected device voice or language is unavailable. Choose Automatic device voice or another installed voice, then tap Listen to retry this sentence.';
        }else{
          message=`Speech playback could not continue${code?`: ${code}`:''}. Tap Listen to retry this sentence.`;
        }
        // Some Android engines can emit audible output without onstart. Save
        // the failed Book sentence even when the provider never confirmed start.
        reportBookPosition(unit);
        starting=false;
        stop(message);
        selectionPending=units.length>0;
        if(ui&&unit){ui.current.textContent=unit.text;ui.current.hidden=false;}
        updateButtons();
      };
      try{synth.speak(utterance)}catch(err){
        clearTimeout(startTimer);starting=false;
        stop(androidSpeech?'Android voice could not start. Tap Listen again.':'Device voice could not be started.');
        console.error('MouldMaster Read Aloud:',err);
      }
    };
    if(androidSpeech){
      // No Promise, timeout or delayed voiceschanged listener before speak().
      beginSpeech();
    }else if(iosSpeech){
      // iOS Safari can also require transient activation from this tap.
      beginSpeech();
    }else{
      waitForVoice(retry?700:1200).then(beginSpeech,()=>{
        if(token!==speakToken)return;
        beginSpeech();
      });
    }
  }

  function refreshStaleReading(nextIndex=index){
    if(playlistMode||!units.length)return false;
    const stillCurrent=unit=>{
      const source=unit?.source,node=unit?.node;
      // The preferred source element can remain visible even when its child
      // text is hidden or replaced. Revalidate the actual visible text node.
      return !!(source?.isConnected&&visible(source)&&node?.isConnected&&
        visible(node.parentElement)&&String(node.nodeValue||'').replace(/\s+/g,' ').includes(unit.text));
    };
    if(activeRoot&&visible(activeRoot)&&stillCurrent(currentUnit())&&
       (nextIndex===index||stillCurrent(units[nextIndex])))return false;
    // A replaced, hidden or rewritten reading source must not be spoken from
    // an old queue. Invalidate old OS callbacks, then rebuild visible text.
    stop('Stopped after screen changed');
    index=0;
    buildUnits();
    updateButtons();
    return true;
  }

  function start(){
    if(!visibleBookView()){stop('Open the Book to use Read Aloud.');return;}
    index=0;buildUnits();
    if(queuedBookStart){
      const wanted=queuedBookStart;
      const found=units.findIndex(u=>u.bookChapterId===wanted.chapterId&&u.bookSentenceIndex>=wanted.unitIndex);
      if(found>=0)index=found;
      else {const beginning=units.findIndex(u=>u.bookChapterId===wanted.chapterId);if(beginning>=0)index=beginning;}
      queuedBookStart=null;
    }
    if(!units.length){setStatus('No readable text is visible in the Book.');updateButtons();return;}
    speakCurrent();
  }

  function testAppAudio(){
    if(!visibleBookView()){setStatus('Open the Book to test audio output.');return;}
    const AudioContextType=window.AudioContext||window.webkitAudioContext;
    if(typeof AudioContextType!=='function'){
      setStatus('Device audio output testing is unavailable in this browser.');
      return;
    }
    stop('Testing phone sound…');
    let context;
    try{
      context=new AudioContextType();
      appAudioContext=context;
      appAudioTimer=setTimeout(closeAppAudio,2500);
      updateButtons();
      const resumed=context.state==='running'?Promise.resolve():context.resume();
      Promise.resolve(resumed).then(()=>{
        if(appAudioContext!==context)return;
        const first=context.currentTime+0.03;
        const output=context.createGain();
        output.gain.setValueAtTime(0.0001,first);
        output.connect(context.destination);
        [[880,first],[660,first+0.28]].forEach(([frequency,start])=>{
          const oscillator=context.createOscillator();
          oscillator.type='sine';
          oscillator.frequency.setValueAtTime(frequency,start);
          oscillator.connect(output);
          output.gain.setValueAtTime(0.14,start);
          output.gain.exponentialRampToValueAtTime(0.0001,start+0.18);
          oscillator.start(start);
          oscillator.stop(start+0.2);
        });
        if(appAudioTimer)clearTimeout(appAudioTimer);
        appAudioTimer=setTimeout(closeAppAudio,900);
        setStatus('Two tones sent through browser audio output. If tones are silent, check media volume and headphone/Bluetooth output. If tones sound but Book speech is silent, check device text-to-speech settings and selected voice.');
        updateButtons();
      }).catch(()=>{
        if(appAudioContext===context){
          setStatus('Browser audio could not start. Check media volume and headphone/Bluetooth output.');
          closeAppAudio();
        }
      });
    }catch(_){
      if(context&&context.state!=='closed'){try{context.close()}catch(__){}}
      appAudioContext=null;
      if(appAudioTimer){clearTimeout(appAudioTimer);appAudioTimer=null;}
      setStatus('Phone sound check could not start. Check browser audio support and selected output.');
      updateButtons();
    }
  }

  function startPlaylist(startLessonId){
    stop('Ready');
    buildPlaylist(startLessonId);
    if(!units.length){setStatus('No lesson audio is available.');return;}
    speakCurrent();
  }

  function toggle(){
    if(!visibleBookView()){setStatus('Open the Book to use Read Aloud.');updateButtons();return;}
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');return;}
    const wasActive=starting||speaking||paused;
    // A stopped Book Listen tap may replace a previous Contents queue with a
    // 20-chapter reader. Revalidating that idle queue, then calling start(),
    // traverses the entire new reader twice before mobile speak() sees the tap.
    // Only revalidate when playback is active or a user-cued sentence exists;
    // a fresh start already rebuilds the visible source exactly once.
    if((wasActive||selectionPending)&&refreshStaleReading()){
      if(wasActive)return;
      // A stale cued sentence has been replaced with the current source.
      // Use that rebuilt queue immediately instead of traversing it again.
      if(!units.length){setStatus('No readable text is visible in the Book.');updateButtons();return;}
      speakCurrent();return;
    }
    if(starting){stop('Stopped');return;}
    if(paused){
      try{synth.resume()}catch(_){stop('Device voice could not resume. Start playback again.');return;}
      paused=false;speaking=true;setStatus(playlistMode?'Listening session playing':'Reading');updateButtons();return;
    }
    if(speaking){
      try{synth.pause()}catch(_){stop('Device voice could not pause. Start playback again.');return;}
      paused=true;speaking=false;setStatus('Paused');updateButtons();return;
    }
    primeAudioOutput();
    if(selectionPending&&!playlistMode){speakCurrent();return;}
    start();
  }

  function changeSpeed(forPlaylist){
    if(playlistMode!==forPlaylist)return;
    // Editing the playback rate while paused must not resume narration.
    // The new rate is applied when the next sentence is synthesized.
    if(paused){setStatus('Paused. Updated speed applies to the next sentence.');updateButtons();return;}
    if(speaking)speakCurrent(0,true);
  }

  function togglePlaylist(){
    if(starting){stop('Stopped');return;}
    if(speaking||paused){
      if(!playlistMode){stop('Ready');startPlaylist();return;}
      toggle();return;
    }
    // Next/Previous when stopped chooses the exact destination but does not
    // initiate speech. Play should then speak that selection; ordinary Stop
    // followed by Play still restarts at the selected lesson's beginning.
    if(selectionPending&&playlistMode&&units.length){speakCurrent();return;}
    const selectedLesson=playlistMode?currentLessonUnit()?.lessonId:undefined;
    startPlaylist(selectedLesson);
  }

  function selectUnit(nextIndex){
    if(nextIndex===index)return;
    const autoplay=speaking||starting;
    index=nextIndex;
    refreshBookControls();
    if(autoplay){
      speaking=false;paused=false;speakCurrent(0,true);
      return;
    }
    // A paused device still owns an utterance at the old position. Cancel it
    // with a fresh token, then leave the new unit cued and not playing.
    stop('Ready');
    selectionPending=true;
    const unit=currentUnit();
    if(ui){ui.current.textContent=unit?.text||'';ui.current.hidden=!unit?.text;}
    setStatus(playlistMode?'Lesson or sentence selected. Press Play to listen.':'Sentence selected. Press Listen to start.');
    updateButtons();
  }

  function move(delta){
    if(units.length)refreshStaleReading(Math.max(0,Math.min(units.length-1,index+delta)));
    if(!units.length)(playlistMode?buildPlaylist():buildUnits());
    if(!units.length)return;
    selectUnit(Math.max(0,Math.min(units.length-1,index+delta)));
  }

  function refreshBookControls(){
    if(!ui?.bookNav)return;
    const active=bookChapterCache.length>0&&units.some(u=>!!u.bookChapterId);
    ui.bookNav.hidden=!active;
    if(!active)return;
    const signature=bookChapterCache.map(c=>c.id).join('|');
    if(ui.bookChapter.dataset.signature!==signature){
      ui.bookChapter.replaceChildren(...bookChapterCache.map(c=>{const option=document.createElement('option');option.value=c.id;option.textContent=c.title;return option;}));
      ui.bookChapter.dataset.signature=signature;
    }
    const id=currentUnit()?.bookChapterId;
    if(id)ui.bookChapter.value=id;
    const pos=bookChapterCache.findIndex(c=>c.id===id);
    ui.bookPrev.disabled=pos<=0;ui.bookNext.disabled=pos<0||pos===bookChapterCache.length-1;
  }
  function startBookFromGesture(){
    if(!supported||!visibleBookView())return false;
    primeAudioOutput();
    // Called directly from the Book's real Listen tap, not a synthetic
    // HTMLElement.click(). This is critical for mobile speech permissions.
    start();
    return units.length>0;
  }
  function selectBookChapter(id){
    if(!visibleBookView()||!units.length||!bookChapterCache.some(c=>c.id===id))return false;
    const at=units.findIndex(u=>u.bookChapterId===id);
    if(at<0)return false;
    selectUnit(at);return true;
  }
  function jumpBookChapter(delta){
    const at=bookChapterCache.findIndex(c=>c.id===currentUnit()?.bookChapterId);
    const target=bookChapterCache[Math.max(0,Math.min(bookChapterCache.length-1,at+delta))];
    if(target)selectBookChapter(target.id);
  }
  function jumpLesson(delta){
    if(!playlistMode||!units.length)buildPlaylist();
    const unit=currentLessonUnit();
    if(!unit)return;
    const lessonIds=[...new Set(units.map(x=>x.lessonId).filter(id=>id!=null))];
    const pos=Math.max(0,lessonIds.findIndex(id=>String(id)===String(unit.lessonId)));
    const nextPos=Math.max(0,Math.min(lessonIds.length-1,pos+delta));
    const target=lessonIds[nextPos];
    const found=units.findIndex(x=>String(x.lessonId)===String(target));
    if(found>=0)selectUnit(found);
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
    // Switching from a Book or single-screen reader to the course Listening
    // screen must release its old device utterance first. The Listening
    // playlist has its own explicit Play action and cannot inherit playback.
    if(!playlistMode&&(starting||speaking||paused))stop('Ready');
    // The core router may hide this custom view without dispatching a click
    // (for example after a programmatic switchView()). Reconcile against
    // the actual DOM before deciding the Listening tab is already open.
    if(listeningOpen&&view.classList.contains('hidden'))listeningOpen=false;
    if(!listeningOpen){
      previousView=[...document.querySelectorAll('.view')].find(v=>!v.classList.contains('hidden'))||null;
      document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
      view.classList.remove('hidden');
      listeningOpen=true;
      document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
      listeningUI.nav.classList.add('active');
      const title=document.getElementById('pageTitle');const subtitle=document.getElementById('pageSubtitle');
      if(title)title.textContent='Listening';if(subtitle)subtitle.textContent='Continuous lesson audio for longer study sessions.';
      renderListeningState();
      window.scrollTo({top:0,behavior:'auto'});
      // The Listening tab is a custom view. Send keyboard/screen-reader
      // focus to its heading after hiding the previous view.
      view.querySelector('.mm-listening-hero h2')?.focus({preventScroll:true});
    }
  }

  function leaveListening(){
    if(!listeningOpen)return;
    // Backgrounding this tab is a deliberate long-session use case, but
    // navigating *within* the app to another screen ends that session.
    // Do not let unseen lesson audio follow a learner into an assessment.
    if(playlistMode&&(starting||speaking||paused))stop('Stopped after leaving Listening');
    listeningOpen=false;
    listeningUI?.view?.classList.add('hidden');
    listeningUI?.nav?.classList.remove('active');
  }

  function addStyles(){
    if(document.getElementById('mmReadAloudStyles'))return;
    const style=document.createElement('style');
    style.id='mmReadAloudStyles';
    style.textContent=`
      .mm-book-audio-chapters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px;border:1px solid #3c5878;border-radius:9px}.mm-book-audio-chapters[hidden]{display:none}.mm-book-audio-chapters label{display:flex;align-items:center;gap:6px;flex:1 1 160px}.mm-book-audio-chapters select{min-width:0;max-width:100%;background:#162b46;color:#f5f9ff;padding:8px;border:1px solid #3c5878;border-radius:7px}.mm-book-audio-chapters button{min-height:40px;min-width:44px;border-radius:8px;background:#162b46;color:#fff;border:1px solid #3c5878}.mm-book-audio-chapters .mm-book-audio-follow{flex:0 0 auto}.mm-read-aloud{position:relative;z-index:9;width:auto;font:14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;color:#edf5ff}.mm-read-aloud details{border:1px solid #3b5575;border-radius:12px;background:#0c1929;box-shadow:none;overflow:hidden}.mm-read-aloud details:not([open]){width:44px;height:44px;margin:0}.mm-read-aloud summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:8px 10px;cursor:pointer;font-weight:800;background:#12243a}.mm-read-aloud details:not([open]) summary{width:44px;min-width:44px;height:44px;min-height:44px;padding:0;justify-content:center;border-radius:12px}.mm-read-aloud details:not([open]) summary b{font-size:0}.mm-read-aloud details:not([open]) summary b::before{content:'🔊';font-size:18px;line-height:1}.mm-read-aloud details:not([open]) summary span{display:none}.mm-read-aloud details[open]{position:fixed;right:12px;top:72px;z-index:2147482000;width:min(360px,calc(100vw - 24px));box-shadow:0 12px 36px rgba(0,0,0,.35)}.mm-read-aloud summary::-webkit-details-marker{display:none}.mm-read-aloud summary span{color:#a9bdd6;font-size:12px;font-weight:600} .mm-read-panel{padding:12px;display:grid;gap:10px}.mm-read-audio-tests{display:grid;grid-template-columns:1fr 1fr;gap:7px}.mm-read-audio-tests button{width:100%;font-size:13px}.mm-read-controls{display:grid;grid-template-columns:1fr 1.35fr 1fr 1fr;gap:7px}.mm-read-controls button,.mm-read-speed{min-height:44px;border:1px solid #3c5878;border-radius:9px;background:#162b46;color:#f5f9ff;padding:8px}.mm-read-controls button:disabled{opacity:.45;cursor:not-allowed}.mm-read-play{background:#55d6be!important;color:#07131b!important;border-color:#55d6be!important;font-weight:850}.mm-read-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#b8c9dd;font-size:12px}.mm-read-meta label{display:flex;align-items:center;gap:6px;color:#b8c9dd}.mm-read-speed{width:auto;min-height:38px;padding:6px 8px;margin:0}.mm-read-status{margin:0;color:#cbd8e7}.mm-read-current{margin:0;padding:9px 10px;border-radius:9px;background:#192f4b;color:#fff;border-left:3px solid #55d6be;max-height:92px;overflow:auto}.mm-read-source-active{outline:3px solid #55d6be!important;outline-offset:4px!important;border-radius:4px}.mm-read-note{margin:0;color:#95abc4;font-size:11px}
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
    view.innerHTML=`<section class="card mm-listening-hero"><span class="eyebrow">Long-session audio learning</span><h2 tabindex="-1">Listen through MouldMaster lessons continuously</h2><p>Start once and move through the lesson library hands-free. Playback uses your browser or operating-system speech service. MouldMaster does not request microphone access, record audio, or upload lesson text through MouldMaster servers; voice-provider processing depends on your device, browser and selected voice.</p></section><section class="card mm-listening-player"><div class="mm-listening-now"><span class="eyebrow">Now listening</span><h3 data-mm-listening-lesson>Lesson library ready</h3><p class="mm-listening-current" data-mm-listening-current>Press Play to start continuous listening from the lesson library.</p></div><div class="mm-listening-controls"><button type="button" data-mm-listening="prev-lesson">⏮ Previous lesson</button><button type="button" data-mm-listening="back">◀ Sentence</button><button type="button" class="play" data-mm-listening="play">Play</button><button type="button" data-mm-listening="forward">Sentence ▶</button><button type="button" data-mm-listening="next-lesson">Next lesson ⏭</button></div><div class="mm-listening-options"><p class="mm-read-status" data-mm-listening-status role="status" aria-live="polite">${supported?'Ready':'Speech synthesis is unavailable'}</p><label>Speed <select class="mm-read-speed" data-mm-listening-speed aria-label="Listening speed">${SPEEDS.map(v=>`<option value="${v}"${v===1?' selected':''}>${v}×</option>`).join('')}</select></label><button type="button" class="ghost" data-mm-listening="stop">Stop</button><strong data-mm-listening-progress-text>0 lessons</strong></div><div class="mm-listening-progress" aria-hidden="true"><span data-mm-listening-bar></span></div><div class="mm-listening-privacy"><b>Designed for long sessions:</b> Listening mode continues when this app tab is in the background where the browser/device permits it. Normal one-screen Read Aloud still pauses when the app is hidden.</div></section>`;
    main.appendChild(view);
    // Core routing can hide custom views without a nav click. Treat that
    // transition as leaving Listening so hidden queues never keep speaking.
    new MutationObserver(()=>{
      if(listeningOpen&&view.classList.contains('hidden'))leaveListening();
    }).observe(view,{attributes:true,attributeFilter:['class']});
    listeningUI={view,nav:navButton,play:view.querySelector('[data-mm-listening="play"]'),stop:view.querySelector('[data-mm-listening="stop"]'),speed:view.querySelector('[data-mm-listening-speed]'),status:view.querySelector('[data-mm-listening-status]'),lesson:view.querySelector('[data-mm-listening-lesson]'),current:view.querySelector('[data-mm-listening-current]'),progress:view.querySelector('[data-mm-listening-progress-text]'),bar:view.querySelector('[data-mm-listening-bar]')};
    navButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openListening();});
    view.querySelector('[data-mm-listening="play"]').addEventListener('click',togglePlaylist);
    view.querySelector('[data-mm-listening="stop"]').addEventListener('click',()=>stop('Stopped'));
    view.querySelector('[data-mm-listening="back"]').addEventListener('click',()=>move(-1));
    view.querySelector('[data-mm-listening="forward"]').addEventListener('click',()=>move(1));
    view.querySelector('[data-mm-listening="prev-lesson"]').addEventListener('click',()=>jumpLesson(-1));
    view.querySelector('[data-mm-listening="next-lesson"]').addEventListener('click',()=>jumpLesson(1));
    listeningUI.speed.addEventListener('change',()=>changeSpeed(true));
    renderListeningState();
  }

  function createUI(){
    if(document.querySelector('.mm-read-aloud'))return;
    addStyles();
    const host=document.createElement('aside');
    host.className='mm-read-aloud';host.setAttribute('aria-label','Read Aloud');host.dataset.version=VERSION;
    host.innerHTML=`<details><summary title="Expand or collapse the Read Aloud controls"><b>🔊 Listen</b><span>${supported?'Device voice':'Unavailable'}</span></summary><div class="mm-read-panel"><div class="mm-read-controls"><button type="button" data-mm-read="prev" aria-label="Previous sentence">◀</button><button type="button" class="mm-read-play" data-mm-read="play">Listen</button><button type="button" data-mm-read="next" aria-label="Next sentence">▶</button><button type="button" data-mm-read="stop">Stop</button></div><button type="button" class="mm-read-speed" data-mm-read="test" aria-label="Test browser audio output with two short tones" title="Send two tones to the browser-selected audio output">Test phone sound</button><div class="mm-read-meta"><p class="mm-read-status" role="status" aria-live="polite">${supported?'Ready':'Speech synthesis is unavailable'}</p><label>Speed <select class="mm-read-speed" data-mm-read="speed" aria-label="Read aloud speed">${SPEEDS.map(v=>`<option value="${v}"${v===1?' selected':''}>${v}×</option>`).join('')}</select></label><label>Voice <select class="mm-read-speed" data-mm-read="voice" aria-label="Narration voice"><option value="">Automatic device voice</option></select></label><span data-mm-read="position">0 / 0</span></div><div class="mm-book-audio-chapters" data-mm-book-audio-controls hidden><button type="button" data-mm-book-audio-prev aria-label="Previous Book chapter">⏮</button><label>Book chapter <select data-mm-book-audio-chapter aria-label="Book audio chapter"></select></label><button type="button" data-mm-book-audio-next aria-label="Next Book chapter">⏭</button><label class="mm-book-audio-follow"><input type="checkbox" data-mm-book-audio-follow checked> Follow text</label></div><p class="mm-read-current" data-mm-read="current" aria-live="off" hidden></p><p class="mm-read-note">Uses your device/browser speech-synthesis service. MouldMaster does not request microphone access or record audio.</p></div></details>`;
    const actions=document.querySelector('#app .top-actions,.top-actions');(actions||document.body).appendChild(host);
    ui={host,play:host.querySelector('[data-mm-read="play"]'),testAudio:host.querySelector('[data-mm-read="test"]'),prev:host.querySelector('[data-mm-read="prev"]'),next:host.querySelector('[data-mm-read="next"]'),stop:host.querySelector('[data-mm-read="stop"]'),speed:host.querySelector('[data-mm-read="speed"]'),voice:host.querySelector('[data-mm-read="voice"]'),status:host.querySelector('.mm-read-status'),position:host.querySelector('[data-mm-read="position"]'),current:host.querySelector('[data-mm-read="current"]'),bookNav:host.querySelector('[data-mm-book-audio-controls]'),bookChapter:host.querySelector('[data-mm-book-audio-chapter]'),bookPrev:host.querySelector('[data-mm-book-audio-prev]'),bookNext:host.querySelector('[data-mm-book-audio-next]'),follow:host.querySelector('[data-mm-book-audio-follow]')};
    ui.play.addEventListener('click',toggle);ui.testAudio.addEventListener('click',testAppAudio);ui.prev.addEventListener('click',()=>move(-1));ui.next.addEventListener('click',()=>move(1));ui.stop.addEventListener('click',()=>stop('Stopped'));
    ui.speed.addEventListener('change',()=>changeSpeed(false));
    ui.voice.addEventListener('change',()=>{preferredVoiceId=ui.voice.value;refreshVoice();if(speaking&&!playlistMode)speakCurrent(0,true);});
    ui.bookChapter.addEventListener('change',()=>selectBookChapter(ui.bookChapter.value));
    ui.bookPrev.addEventListener('click',()=>jumpBookChapter(-1));
    ui.bookNext.addEventListener('click',()=>jumpBookChapter(1));
    host.querySelector('details').addEventListener('toggle',event=>{if(event.target.open&&!starting&&!speaking&&!paused){buildUnits();setStatus(supported?'Ready':'Read Aloud is not available in this browser/device.');updateButtons();}});
    refreshVoice();if(supported&&!selectedVoice)setStatus('Device voice will load when playback starts.');updateButtons();syncBookScope();
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
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden||!supported||playlistMode)return;
    // A desktop voice can be waiting for a voiceschanged callback; the
    // previous speaking-only guard missed this delayed-start privacy race.
    if(starting){stop('Stopped because the app was hidden before speech started');return;}
    if(!speaking)return;
    try{synth.pause()}catch(_){
      stop('Device voice could not pause while hidden. Start playback again.');
      return;
    }
    paused=true;speaking=false;setStatus('Paused while app is hidden');updateButtons();
  });

  const observer=new MutationObserver(()=>{
    syncBookScope();
    if((speaking||paused)&&activeRoot&&!activeRoot.isConnected&&!playlistMode)stop('Stopped after screen changed');
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,
    attributeFilter:['class','style','hidden','aria-hidden']});

  window.MMReadAloud={version:VERSION,supported,stop:()=>stop('Stopped'),refresh:()=>buildUnits(),
    queueBookStart:({chapterId,unitIndex=0}={})=>{if(!/^r(?:0[1-9]|1[0-9]|20)$/.test(String(chapterId||'')))return false;queuedBookStart={chapterId,unitIndex:Math.max(0,Math.min(20000,Math.floor(Number(unitIndex)||0)))};return true;},
    selectBookChapter,startBookFromGesture};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createUI,{once:true});else createUI();
})();
