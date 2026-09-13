from pathlib import Path
import re

runtime = Path('read-aloud.js')
text = runtime.read_text(encoding='utf-8')

text = text.replace("const VERSION='2026.09.07.3';", "const VERSION='2026.09.14.1';")
text = text.replace("  let paused=false;\n", "  let paused=false;\n  let starting=false;\n  let selectedVoice=null;\n  let speakToken=0;\n")

marker = "  function setStatus(text){\n    if(!ui)return;\n    ui.status.textContent=text;\n    ui.position.textContent=units.length?`${Math.min(index+1,units.length)} / ${units.length}`:'0 / 0';\n  }\n"
insert = marker + "\n  function refreshVoice(){\n    if(!supported||typeof synth.getVoices!=='function'){selectedVoice=null;return null;}\n    const voices=synth.getVoices()||[];\n    if(!voices.length){selectedVoice=null;return null;}\n    const lang=String(document.documentElement.lang||navigator.language||'en').toLowerCase();\n    const base=lang.split('-')[0];\n    selectedVoice=voices.find(v=>String(v.lang||'').toLowerCase()===lang)\n      ||voices.find(v=>String(v.lang||'').toLowerCase().split('-')[0]===base)\n      ||voices.find(v=>v.default)\n      ||voices[0]\n      ||null;\n    return selectedVoice;\n  }\n\n  function waitForVoice(timeout=1200){\n    if(refreshVoice())return Promise.resolve(selectedVoice);\n    if(!supported)return Promise.resolve(null);\n    return new Promise(resolve=>{\n      let done=false;\n      const finish=()=>{if(done)return;done=true;cleanup();resolve(refreshVoice())};\n      const cleanup=()=>{clearTimeout(timer);try{synth.removeEventListener?.('voiceschanged',finish)}catch(_){}};\n      const timer=setTimeout(finish,timeout);\n      try{synth.addEventListener?.('voiceschanged',finish,{once:true})}catch(_){ }\n    });\n  }\n"
assert marker in text
text = text.replace(marker, insert)

text = text.replace("    ui.play.textContent=paused?'Resume':speaking?'Pause':'Listen';\n    ui.play.setAttribute('aria-label',paused?'Resume read aloud':speaking?'Pause read aloud':'Start read aloud');",
                    "    ui.play.textContent=starting?'Starting…':paused?'Resume':speaking?'Pause':'Listen';\n    ui.play.setAttribute('aria-label',starting?'Starting read aloud':paused?'Resume read aloud':speaking?'Pause read aloud':'Start read aloud');")

text = text.replace("    speaking=false;paused=false;\n", "    speakToken+=1;\n    starting=false;speaking=false;paused=false;\n", 1)

pattern = re.compile(r"  function speakCurrent\(\)\{.*?\n  \}\n\n  function start\(\)\{", re.S)
replacement = r'''  async function speakCurrent(retry=0){
    if(!supported){setStatus('Read Aloud is not available in this browser/device.');updateButtons();return;}
    if(!units.length)buildUnits();
    const unit=units[index];
    if(!unit){setStatus('No readable text is visible on this screen.');updateButtons();return;}
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
    utterance.rate=Number(ui?.speed?.value||1);
    let started=false;
    const startTimer=setTimeout(()=>{
      if(token!==speakToken||started)return;
      synth.cancel();
      starting=false;speaking=false;paused=false;
      if(retry<1){
        selectedVoice=null;
        setStatus('Retrying device voice…');
        updateButtons();
        speakCurrent(1);
      }else{
        setStatus('Device voice did not start. Check Windows speech voices, then try again.');
        updateButtons();
      }
    },2500);
    utterance.onstart=()=>{
      if(token!==speakToken)return;
      clearTimeout(startTimer);started=true;
      starting=false;speaking=true;paused=false;
      highlight(unit);
      setStatus('Reading');
      updateButtons();
    };
    utterance.onend=()=>{
      clearTimeout(startTimer);
      if(token!==speakToken||!speaking)return;
      if(index<units.length-1){index+=1;speakCurrent();}
      else stop('Finished');
    };
    utterance.onerror=event=>{
      clearTimeout(startTimer);
      if(token!==speakToken)return;
      if(event?.error==='canceled'||event?.error==='interrupted')return;
      starting=false;
      stop(`Speech playback could not continue${event?.error?`: ${event.error}`:''}.`);
    };
    try{synth.speak(utterance)}catch(err){
      clearTimeout(startTimer);
      starting=false;
      stop('Device voice could not be started.');
      console.error('MouldMaster Read Aloud:',err);
    }
  }

  function start(){'''
text, count = pattern.subn(replacement, text)
assert count == 1

text = text.replace("    if(paused){synth.resume();paused=false;speaking=true;setStatus('Reading');updateButtons();return;}",
                    "    if(starting){stop('Stopped');return;}\n    if(paused){synth.resume();paused=false;speaking=true;setStatus('Reading');updateButtons();return;}")
text = text.replace("    speaking=true;paused=false;\n    speakCurrent();", "    speaking=false;paused=false;\n    speakCurrent();")

needle = "    updateButtons();\n  }\n\n  document.addEventListener('click',event=>{"
replacement2 = "    refreshVoice();\n    if(supported&&!selectedVoice)setStatus('Device voice will load when playback starts.');\n    updateButtons();\n  }\n\n  if(supported){\n    try{synth.addEventListener?.('voiceschanged',()=>{\n      if(refreshVoice()&&ui&&!starting&&!speaking&&!paused){setStatus('Ready');updateButtons();}\n    })}catch(_){ }\n  }\n\n  document.addEventListener('click',event=>{"
assert needle in text
text = text.replace(needle, replacement2)

runtime.write_text(text, encoding='utf-8')

qa = Path('qa/read-aloud.spec.js')
q = qa.read_text(encoding='utf-8')
q = q.replace("'2026.09.07.3'", "'2026.09.14.1'")
q = q.replace("getVoices(){return[];},", "getVoices(){return[{name:'QA Voice',lang:'en-US',default:true}];},", 1)

extra = r'''

test('Read Aloud waits for delayed Windows voices and selects the device voice before speaking', async ({ page }) => {
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><main class="main"><p>Delayed Windows voice sentinel.</p></main></body></html>`);
  await page.evaluate(() => {
    class QaSpeechSynthesisUtterance {
      constructor(text=''){this.text=String(text);this.lang='';this.voice=null;this.rate=1;this.onstart=null;this.onend=null;this.onerror=null;}
    }
    const listeners=new Set();
    let ready=false;
    const voice={name:'Windows QA Voice',lang:'en-NZ',default:true};
    const synth={
      getVoices(){return ready?[voice]:[];},
      speak(utterance){
        window.__mmDelayedVoiceName=utterance.voice?.name||'';
        window.__mmDelayedSpeech=utterance.text;
        queueMicrotask(()=>utterance.onstart?.());
      },
      cancel(){},pause(){},resume(){},
      addEventListener(type,fn){if(type==='voiceschanged')listeners.add(fn);},
      removeEventListener(type,fn){if(type==='voiceschanged')listeners.delete(fn);}
    };
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,writable:true,value:QaSpeechSynthesisUtterance});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,writable:true,value:synth});
    setTimeout(()=>{ready=true;for(const fn of [...listeners])fn();},120);
  });
  await page.addScriptTag({path:'read-aloud.js'});
  const host=page.locator('.mm-read-aloud');
  await host.locator('details').evaluate(el=>{el.open=true;});
  await host.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmDelayedVoiceName||'')).toBe('Windows QA Voice');
  await expect.poll(()=>page.evaluate(()=>window.__mmDelayedSpeech||'')).toContain('Delayed Windows voice sentinel.');
  await expect(host.locator('.mm-read-status')).toHaveText('Reading');
});
'''
if 'delayed Windows voices' not in q:
    q += extra
qa.write_text(q, encoding='utf-8')

print('patched runtime and QA')
