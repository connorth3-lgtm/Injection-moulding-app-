/* MouldMaster contextual research microlearning bridge — 2026.09.02.6 */
(function(){
'use strict';
const VERSION='2026.09.02.6';
const PRACTICES=new Map();
function build(input,limit=2){const e=window.MM_RESEARCH_EVIDENCE;if(!e)return[];return e.retrieve(input,limit).map(r=>({mechanismId:r.id,title:r.title,evidenceState:r.status,applicability:r.applicability.label,lesson:`Why it matters: ${r.claim}`,lookFor:(r.supports||[])[0]||r.nextEvidence,dontAssume:r.limitation,nextCheck:r.nextEvidence}))}
function hash(text){let h=2166136261;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rotate(items,offset){const xs=items.slice(),n=xs.length;if(!n)return xs;const k=((Number(offset)||0)%n+n)%n;return xs.slice(k).concat(xs.slice(0,k))}
function different(a,b){const x=String(a||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),y=String(b||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(!x||!y)return false;if(x===y)return false;const ax=new Set(x.split(/\s+/)),ay=new Set(y.split(/\s+/));let shared=0;for(const t of ax)if(ay.has(t))shared++;return shared/Math.max(1,Math.min(ax.size,ay.size))<.72}
function contextFingerprint(input,observed){
  const c=input&&typeof input==='object'?input:{};
  const normal=x=>Array.isArray(x)?x.map(v=>String(v||'').trim().toLowerCase()).filter(Boolean).sort().slice(0,24):[];
  const payload={materials:normal(c.materials),process:normal(c.process),tooling:normal(c.tooling),sensors:normal(c.sensors),signals:normal(c.signals),outcomes:normal(c.outcomes),observed:String(observed||'').trim().toLowerCase().slice(0,320)};
  return hash(JSON.stringify(payload)).toString(36)
}
function opt(key,text,correct,feedback,misconception=null){return{key,text:String(text||''),correct:!!correct,feedback,misconception}}
function evidenceOptions(r,plan,alternate,challenge='standard'){
  const correct=opt('discriminating-check',plan.strongestNextCheck,true,'This is the strongest answer because it collects independent local evidence that can support or weaken the proposed mechanism before a production conclusion is made.');
  const display=opt('display-only','Recheck only the displayed command or setpoint and assume it represents the actual process response.',false,'Displayed commands and setpoints are not the same as measured actual behaviour. A useful check should observe the relevant actual or physical outcome.','command-vs-actual');
  const broad=opt('broad-adjustment','Make a broad process adjustment and judge success from appearance alone.',false,'A broad adjustment changes several variables at once and appearance may not represent the physical outcome. It weakens diagnosis rather than discriminating between explanations.','premature-adjustment');
  const assume=opt('assume-cause','Treat the research match as the confirmed root cause because the signal moved.',false,'Research fit ranks explanations; it does not prove causation. Local measured evidence, a controlled check and recovery evidence are still required.','causation-overreach');
  const alt=alternate?.nextEvidence&&different(alternate.nextEvidence,plan.strongestNextCheck)?opt('alternative-check',alternate.nextEvidence,false,`This is a legitimate check for the competing “${alternate.title}” mechanism, but it is less discriminating for the leading mechanism in this run. Keep the alternative open; do not confuse a plausible check with the best next check.`,'alternative-mechanism'):null;
  if(challenge==='support')return[correct,display,broad,assume];
  if(challenge==='stretch'){
    const supporting=(r.supports||[])[0];
    const support= supporting&&different(supporting,plan.strongestNextCheck)?opt('supporting-pattern',supporting,false,'This would be useful supporting evidence, but by itself it mainly confirms the preferred mechanism. The stronger next step is the check that can distinguish it from a realistic alternative.','confirmation-bias'):display;
    return[correct,alt||display,support,assume]
  }
  return[correct,alt||assume,display,broad]
}
function falsificationOptions(r,plan,alternate,challenge='standard'){
  const weakening=(r.weakens||[])[0]||'Independent actual measurements remain stable while the physical outcome changes.';
  const support=(r.supports||[])[0]||r.claim;
  const options=[
    opt('weakening-evidence',weakening,true,'This is the strongest falsification answer because it describes evidence expected to stay coupled if the hypothesis is correct. If it remains stable while the outcome changes, confidence in the hypothesis should fall.'),
    opt('supporting-only',support,false,'This pattern would support the mechanism; it does not challenge it. Good troubleshooting actively looks for evidence that could make the preferred explanation less likely.','confirmation-bias'),
    opt('unchanged-command','The saved recipe and displayed setpoints remain unchanged.',false,'Unchanged commands do not prove unchanged actual process behaviour, material state, tooling condition or measurement response.','command-vs-actual'),
    opt('appearance-improves','One part looks better after an uncontrolled adjustment.',false,'A one-part cosmetic improvement after an uncontrolled change does not falsify or verify a mechanism. The evidence needs a controlled comparison and the relevant physical outcome.','premature-verification')
  ];
  if(challenge!=='support'&&alternate?.weakens?.[0]&&different(alternate.weakens[0],weakening))options[3]=opt('alternative-weakening',alternate.weakens[0],false,`That finding mainly challenges the competing “${alternate.title}” mechanism. It is useful evidence, but it does not most directly test the leading explanation.`,'alternative-mechanism');
  return options
}
function recoveryOptions(r,plan,challenge='standard'){
  const options=[
    opt('recovery-evidence',plan.recoveryCriterion,true,'Recovery should be demonstrated by the relevant actual and physical outcome moving back toward the validated local reference together, not by a setting or appearance alone.'),
    opt('setpoint-recovers','The displayed setpoint returns to the value stored in the saved recipe.',false,'A command returning to its nominal value does not prove that the actual process or physical quality recovered.','command-vs-actual'),
    opt('appearance-only','The next visible part looks acceptable, without checking the measured actual or physical quality response.',false,'A single cosmetic observation is weak recovery evidence and may miss structural, dimensional or cavity-specific effects.','appearance-only'),
    opt('rank-stays-high','The research mechanism remains the highest-ranked explanation after the change.',false,'A research ranking is not recovery evidence. Recovery must be shown by local measured behaviour and the linked physical outcome.','causation-overreach')
  ];
  if(challenge==='stretch')options[1]=opt('actual-only-recovers','A related measured process actual returns toward its nominal range, but the linked physical quality outcome is not checked.',false,'A recovered process actual is encouraging but incomplete. Strong recovery evidence reconnects the relevant actual with the physical part outcome and known-good local reference.','recovery-shortcut');
  return options
}
function integrationOptions(r,plan,alternate,challenge='standard'){
  const alt=alternate?.title||r.alternatives?.[0]||'a realistic competing explanation';
  const options=[
    opt('bounded-conclusion',`${r.title} remains a plausible hypothesis. Compare its discriminating evidence and recovery pattern with ${alt} before assigning root cause.`,true,'This keeps observation, hypothesis, competing explanations and verification separate. That is the strongest expert conclusion from incomplete evidence.'),
    opt('confirmed-cause',`${r.title} is confirmed because the research applicability score is highest.`,false,'Applicability helps rank where research may transfer; it is not proof of causation in the local process.','causation-overreach'),
    opt('change-to-test',`Change several settings that should influence ${r.title}; if quality improves, treat that as confirmation.`,false,'Changing several variables together makes the result difficult to interpret and can hide the true mechanism.','premature-adjustment'),
    opt('ignore-alternative',`Ignore ${alt} because it ranked second rather than first.`,false,'Rank order is a prioritisation aid, not a reason to discard a realistic alternative without discriminating evidence.','alternative-mechanism')
  ];
  if(challenge==='stretch')options[2]=opt('bounded-but-unverified',`${r.title} is probably correct because several observations fit, so recovery evidence can be collected after the root-cause decision is recorded.`,false,'Several matching observations can raise plausibility but do not justify recording root cause before the discriminating check and recovery evidence are complete.','premature-verification');
  return options
}
function buildPractice(input,extra={}){
  const e=window.MM_RESEARCH_EVIDENCE;if(!e)return null;
  const ranked=e.retrieve(input,3)||[],r=ranked[0];if(!r)return null;
  const plan=e.verificationPlan(input,r.id);if(!plan)return null;
  const alternate=ranked.find(x=>x.id!==r.id)||null;
  const observed=String(extra.observed||'A site-local process signal has moved away from its known-good reference.').trim();
  const contextKey=contextFingerprint(input,observed);
  const fallbackStage=window.MM_ADAPTIVE_LEARNING?.stageForMechanism?.(r.id)||'evidence';
  const intent=window.MM_LEARNING_EFFECTIVENESS?.practiceIntent?.(r.id,fallbackStage)||{stage:fallbackStage,mode:'progression',intervalDays:null,label:'progression practice'};
  const requested=String(extra.stage||intent.stage||fallbackStage);
  const stage=['evidence','falsification','recovery','integration'].includes(requested)?requested:'evidence';
  const challenge=String(extra.challenge||window.MM_LEARNING_EFFECTIVENESS?.challengeFor?.(r.id,stage)||'standard');
  const calibrated=['support','standard','stretch'].includes(challenge)?challenge:'standard';
  const mode=String(extra.mode||intent.mode||'progression')==='retention'?'retention':'progression';
  const retentionIntervalDays=mode==='retention'?Number(extra.retentionIntervalDays||intent.intervalDays)||null:null;
  const prefix=mode==='retention'?`Delayed ${retentionIntervalDays||''}-day transfer check. `:'';
  let prompt,options,rationale;
  if(stage==='falsification'){
    prompt=`${prefix}${observed} ${r.title} is currently the leading explanation. Which finding would most directly weaken that hypothesis?`;
    options=falsificationOptions(r,plan,alternate,calibrated);rationale='High-quality troubleshooting tries to disprove a preferred explanation as well as support it.';
  }else if(stage==='recovery'){
    prompt=`${prefix}${observed} A controlled correction has now been made. Which result is the strongest evidence that the mechanism has actually recovered?`;
    options=recoveryOptions(r,plan,calibrated);rationale='Recovery evidence should reconnect the relevant process actual with the physical quality response and the known-good local reference.';
  }else if(stage==='integration'){
    prompt=`${prefix}${observed} Multiple explanations remain plausible. Which conclusion best reflects the strength and limits of the available evidence?`;
    options=integrationOptions(r,plan,alternate,calibrated);rationale='Expert reasoning preserves uncertainty, compares alternatives and verifies recovery before assigning root cause.';
  }else{
    prompt=`${prefix}${observed} Which next step gives the strongest discriminating evidence?`;
    options=evidenceOptions(r,plan,alternate,calibrated);rationale='The aim is not to guess a setting. The aim is to choose the measurement or controlled check that can distinguish this explanation from realistic alternatives.';
  }
  const shuffled=rotate(options,hash(`${r.id}:${stage}:${calibrated}:${mode}:${contextKey}`)%options.length),correctIndex=shuffled.findIndex(x=>x.correct);
  const practice={
    id:`run-insight-${r.id}-${stage}-${contextKey}`,contextKey,mechanismId:r.id,title:r.title,stage,challenge:calibrated,mode,retentionIntervalDays,
    prompt,options:shuffled,correctIndex,rationale,
    weakeningQuestion:'What finding would most weaken this explanation?',
    weakeningAnswer:(r.weakens||[])[0]||'Independent actual measurements remain stable while the physical outcome changes.',
    recoveryAnswer:plan.recoveryCriterion,
    boundary:'Formative practice only. It does not change formal assessment results, authorize production changes or convert research relevance into proof of root cause.'
  };
  PRACTICES.set(practice.id,practice);return practice
}
function choiceMeta(practiceId,index){const p=PRACTICES.get(String(practiceId||''));return p?.options?.[Number(index)]||null}
window.MM_RESEARCH_MICROLEARNING={version:VERSION,build,buildPractice,choiceMeta,scope:'Contextual microlearning generated only from promoted mechanism claims. Difficulty progresses from evidence choice to falsification, recovery and integrated uncertainty, while empirical challenge calibration is allowed only after anonymous local sample thresholds. Delayed transfer checks revisit mastered reasoning after retention intervals. Advancement requires transfer across distinct structured run contexts represented only by a local one-way context hash. Misconception tags support local adaptive reinforcement. Formal assessment questions and answer keys remain separate.'};
})();
