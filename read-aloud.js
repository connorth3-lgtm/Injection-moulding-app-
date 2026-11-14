/* MouldMaster Book Read Aloud — 2026.11.14.3
 * Learner-controlled text-to-speech using the browser/device speech-synthesis service.
 * No microphone access, recording, speech recognition, network upload, or learner-content storage.
 */
(function(){
  'use strict';

  const VERSION='2026.11.14.3';
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
      if(!parent||!visible(paren