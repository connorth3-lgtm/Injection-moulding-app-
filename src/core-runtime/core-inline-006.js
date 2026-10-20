
/* ===== final_audit_patch.js ===== */

/* =========================================================
   Fine-Tooth-Comb V2 patch
   - preserves audited base UK/US/NZ question bank
   - removes pseudo-precision from material-family explorer/labs
   - adds evidence references and clearer NZ/BSI status notes
   - strengthens Material Science debriefing
   ========================================================= */

function qualitativeBand(v, kind){
  if(kind==="shrink"){
    if(v>=75)return "Higher tendency";
    if(v>=50)return "Moderate-to-higher";
    if(v>=35)return "Moderate";
    return "Lower tendency";
  }
  if(v>=85)return "Higher tendency";
  if(v>=70)return "Moderate-to-higher";
  if(v>=45)return "Moderate";
  if(v>=25)return "Lower-to-moderate";
  return "Lower tendency";
}
function propMeter(label,v,kind="general"){
  return `<div class="mat-prop"><span>${label}</span><b style="font-size:12px;color:#cfe0f3">${qualitativeBand(v,kind)}</b></div>`;
}
function materialCard(m){
  const morph=m.morph.includes("Amorphous")?"Amorphous":m.morph.includes("Semi")?"Semi-crystalline":"Varies";
  return `<div class="card mat-material" data-morph="${esc(morph)}" data-moist="${esc(m.moisture)}" data-search="${esc((m.name+" "+m.full+" "+m.tags.join(" ")+" "+m.notes).toLowerCase())}" data-impact="${m.impact}" data-optical="${m.optical}" data-chemical="${m.chemical}" data-stiff="${m.stiff}">
    <span class="eyebrow">${esc(m.morph)}</span><h3>${esc(m.name)} · ${esc(m.full)}</h3>
    <div class="mat-tags">${m.tags.map(t=>`<span class="mat-tag">${esc(t)}</span>`).join("")}</div>
    ${propMeter("Shrinkage tendency",m.shrink,"shrink")}
    ${propMeter("Chemical-resistance tendency",m.chemical)}
    ${propMeter("Impact tendency",m.impact)}
    ${propMeter("Stiffness tendency",m.stiff)}
    ${propMeter("Optical/clarity tendency",m.optical)}
    <p class="muted tiny" style="line-height:1.45">${esc(m.notes)}</p>
    <div class="mat-ref">Pre-processing moisture-control priority: ${esc(m.moisture)} · family-level tendency only; grades can differ substantially.</div>
  </div>`;
}

function updateRheologyLab(){
  const shear=+$("#rheoShear").value,temp=+$("#rheoTemp").value,fill=+$("#rheoFill").value;
  const idx=Math.max(25,Math.min(220,100*Math.exp(-0.010*shear)*Math.exp(-0.025*temp)*(1+fill/90)));
  const band=idx<50?"lower":idx<75?"moderate-to-lower":idx<115?"moderate":idx<155?"moderate-to-higher":"higher";
  $("#rheoOut").innerHTML=`Illustrative apparent-viscosity tendency: <b>${band}</b>.<br><small>Direction taught: shear-thinning tends to lower apparent viscosity as shear rate rises; higher melt temperature tends to lower viscosity within the grade's safe range; fillers can alter both viscosity and shear response. No numeric value here represents a real resin viscosity.</small>`;
  const pts=[];for(let x=0;x<=100;x+=5){const y=160-(110*Math.exp(-0.018*x)*(1+fill/120));pts.push(`${20+x*3.2},${Math.max(20,Math.min(180,y-temp*.8))}`)}
  $("#rheoCurve").innerHTML=`<svg viewBox="0 0 360 210" role="img" aria-label="Conceptual shear-thinning curve"><line x1="20" y1="185" x2="345" y2="185" stroke="#516b8c"/><line x1="20" y1="20" x2="20" y2="185" stroke="#516b8c"/><polyline points="${pts.join(" ")}" fill="none" stroke="#55d6be" stroke-width="4"/><text x="220" y="202" fill="#9fb4cf" font-size="11">relative shear rate →</text><text x="4" y="18" fill="#9fb4cf" font-size="11">relative apparent viscosity</text></svg>`;
}

function materialTabsHTML(){
  return `<div class="mat-tabs">
    <button class="${materialTab==="learn"?"active":""}" data-mm-onclick="switchMaterialTab('learn')">Learn</button>
    <button class="${materialTab==="explorer"?"active":""}" data-mm-onclick="switchMaterialTab('explorer')">Material explorer</button>
    <button class="${materialTab==="labs"?"active":""}" data-mm-onclick="switchMaterialTab('labs')">Interactive labs</button>
    <button class="${materialTab==="quiz"?"active":""}" data-mm-onclick="switchMaterialTab('quiz')">Knowledge check</button>
    <button class="${materialTab==="references"?"active":""}" data-mm-onclick="switchMaterialTab('references')">Evidence & references</button>
  </div>`;
}
const FTC2_renderMaterials_base=renderMaterials;
renderMaterials=function(){
  if(materialTab==="references"){
    $("#materials").innerHTML=renderMaterialReferences();
    return;
  }
  FTC2_renderMaterials_base();
};
function renderMaterialReferences(){
  return `<div class="mat-shell">${materialTabsHTML()}
    <div class="card mat-hero">
      <span class="eyebrow">Evidence & references</span>
      <h2>Where the material-science teaching principles come from.</h2>
      <p>These sources support the general mechanisms taught here. They do not replace the actual resin grade's current TDS/SDS, qualification data or your approved process.</p>
    </div>
    <div class="mat-disclaimer"><b>Evidence rule:</b> general polymer science tells you what mechanisms are plausible. Grade-specific supplier data and component/process validation tell you what is acceptable for the actual job.</div>
    <div class="grid2">
      <div class="card standard-card"><span class="eyebrow">Rheology</span><h3>Trotta et al. (2021), Polymer Testing</h3><p>Injection-moulding rheology study showing shear-thinning/apparent-viscosity changes under high-shear moulding conditions and the importance of processing-specific rheology.</p><a class="standard-link" target="_blank" rel="noopener" href="https://doi.org/10.1016/j.polymertesting.2021.107068">Open DOI ↗</a></div>
      <div class="card standard-card"><span class="eyebrow">Crystallisation</span><h3>Hu et al. (2022), Polymers</h3><p>Flash-DSC study showing that polypropylene crystallisation temperature and crystallinity depend strongly on cooling rate.</p><a class="standard-link" target="_blank" rel="noopener" href="https://doi.org/10.3390/polym14173646">Open DOI ↗</a></div>
      <div class="card standard-card"><span class="eyebrow">Fibre orientation / warpage</span><h3>Warpage mechanism due to fibre orientation</h3><p>Experimental work linking local fibre orientation in injection-moulded short-fibre composites to anisotropic properties/shrinkage and warpage.</p><a class="standard-link" target="_blank" rel="noopener" href="https://www.jstage.jst.go.jp/article/seikeikakou1989/16/7/16_7_467/_article/-char/en">Open paper ↗</a></div>
      <div class="card standard-card"><span class="eyebrow">MFR / MVR</span><h3>ISO 1133-1:2022</h3><p>Defines MFR/MVR under specified temperature and load and explicitly notes that test shear rates are much lower than normal processing rates, so results may not always correlate with processing behaviour.</p><a class="standard-link" target="_blank" rel="noopener" href="https://www.iso.org/standard/83905.html">Open ISO page ↗</a></div>
      <div class="card standard-card"><span class="eyebrow">Melt-flow testing</span><h3>ASTM D1238-23a</h3><p>Describes melt-flow rate as an empirically defined parameter strongly influenced by polymer structure and measurement conditions; it is primarily a quality-control test, not a complete rheology model.</p><a class="standard-link" target="_blank" rel="noopener" href="https://store.astm.org/standards/d1238">Open ASTM page ↗</a></div>
      <div class="card standard-card"><span class="eyebrow">Moisture / time-temperature-sensitive MFR</span><h3>ISO 1133-2:2011</h3><p>Provides a specific MFR/MVR method for materials whose rheology is sensitive to time-temperature history and/or moisture, reinforcing why material history matters.</p><a class="standard-link" target="_blank" rel="noopener" href="https://www.iso.org/standard/44274.html">Open ISO page ↗</a></div>
    </div>
  </div>`;
}

const FTC2_renderMaterialQuiz_base=renderMaterialQuiz;
renderMaterialQuiz=function(){
  const html=FTC2_renderMaterialQuiz_base();
  return html.replace(
    `<div class="mat-disclaimer"><b>Learning assessment only:</b>`,
    `<div class="mat-disclaimer"><b>Question integrity:</b> Incorrect choices are assessment distractors, not operating instructions or substitute procedures.<br><br><b>Learning assessment only:</b>`
  );
};
function gradeMaterialQuiz(){
  let correct=0;const rows=[];
  materialQuizOrder.forEach((item,qi)=>{
    const q=item.q,r=document.querySelector(`input[name=mq${qi}]:checked`),sel=r?+r.value:null,ok=sel===q[2];if(ok)correct++;
    rows.push(`<div class="mat-review ${ok?"correct":"incorrect"}"><b>${qi+1}. ${ok?"Correct ✓":"Review"}</b><br>
      <span class="tiny">Your answer: ${sel==null?"No answer":esc(q[1][sel])}</span><br>
      <span class="tiny">Correct answer: <b>${esc(q[1][q[2]])}</b></span>
      <p class="muted" style="margin:7px 0 0">${esc(q[3])}</p>
      ${ok?"":`<div class="mat-ref">The selected incorrect option is a distractor for assessment purposes, not an instruction to apply in production.</div>`}
    </div>`);
  });
  const pct=Math.round(correct/materialQuizOrder.length*100),m=ensureMaterialState();m.quizAttempts++;m.bestQuiz=Math.max(m.bestQuiz||0,pct);persist();
  const box=$("#materialQuizResult");box.classList.remove("hidden");box.innerHTML=`<b>${correct}/${materialQuizOrder.length} correct — ${pct}%</b><br>${pct>=80?"Strong material-science result. Keep connecting the theory to the actual resin grade and process evidence.":"Review the explanations below and revisit the relevant chapters."}`;
  $("#materialQuizReview").innerHTML=rows.join("");
  if(pct>=80&&typeof awardXP==="function")awardXP(120,"material-quiz-80","Material Science mastery",{celebrate:true});
  checkMaterialAchievements();
}

/* Clarify standards source status without altering the audited data.js bank. */
const FTC2_renderStandards_base=renderStandards;
renderStandards=function(){
  FTC2_renderStandards_base();
  const selected=user.region==="ALL"?["UK","US","NZ"]:[user.region];
  if(selected.includes("UK")){
    $("#standards").insertAdjacentHTML("beforeend",`<div class="legal-note"><b>UK standards status:</b> BSI currently lists BS EN ISO 20430:2020 as <b>Current, Under Review</b>. The platform treats it as the current published UK standard while keeping the scheduled standards re-check active.</div>`);
  }
  if(selected.includes("NZ")){
    $("#standards").insertAdjacentHTML("beforeend",`<div class="legal-note"><b>NZ source-status clarification:</b> WorkSafe's injection/blow-moulding page remains published and contains useful machinery controls, but WorkSafe states that the page has <b>not been updated to reflect the current HSWA framework</b>. It must therefore be read alongside current HSWA duties, current WorkSafe machinery guidance and applicable standards such as AS/NZS 4024.</div>`);
  }
};

/* Material Science entry includes traceability. */
const FTC2_renderMaterialLearn_base=renderMaterialLearn;
renderMaterialLearn=function(){
  const html=FTC2_renderMaterialLearn_base();
  return html.replace(
    `<div class="mat-disclaimer"><b>Important:</b>`,
    `<div class="mat-disclaimer"><b>Evidence status:</b> Core mechanisms have been re-checked against current standards pages and peer-reviewed injection-moulding/polymer studies. Use the Evidence & references tab for traceability.<br><br><b>Important:</b>`
  );
};

