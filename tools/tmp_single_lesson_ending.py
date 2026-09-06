from pathlib import Path


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def rep(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing expected marker: {label}")
    return text.replace(old, new, 1)


# Deep lesson content: preserve exact authored evidence check, but keep it inside More detail.
p = "lesson-deep-authoring-v2.js"
s = read(p)
s = rep(s, "const VERSION='2026.09.07.3';", "const VERSION='2026.09.07.4';", "deep version")
s = rep(
    s,
    "  const guide=l.mmGuide||{};\n  const mechanism=sentence(summary||points[0]||guide.plain||`This lesson develops the ${clean(l.title)} mechanism.`);",
    "  const guide=l.mmGuide||{};\n  const evidencePrompt=sentence(l.evidencePrompt||'');\n  const commonTrap=sentence(l.commonTrap||'');\n  const mechanism=sentence(summary||points[0]||guide.plain||`This lesson develops the ${clean(l.title)} mechanism.`);",
    "deep authored evidence fields",
)
s = rep(
    s,
    "  return {id:l.id,title:l.title,course:l.courseName,mechanism,evidence,decision,misconception,teachBack,boundary}",
    "  return {id:l.id,title:l.title,course:l.courseName,mechanism,evidence,decision,misconception,teachBack,evidencePrompt,commonTrap,boundary}",
    "deep record fields",
)
s = rep(
    s,
    "function pedagogicalPayload(r){return {mechanism:r.mechanism,evidence:r.evidence,decision:r.decision,misconception:r.misconception,teachBack:r.teachBack,boundary:r.boundary}}",
    "function pedagogicalPayload(r){return {mechanism:r.mechanism,evidence:r.evidence,decision:r.decision,misconception:r.misconception,teachBack:r.teachBack,evidencePrompt:r.evidencePrompt,commonTrap:r.commonTrap,boundary:r.boundary}}",
    "deep fingerprint payload",
)
s = rep(
    s,
    "<h4>Plant decision</h4><p>${esc(r.decision)}</p>",
    "<h4>Evidence check</h4><p><b>Capture:</b> ${esc(r.evidencePrompt||'Compare the current setpoint, measured actuals and repeatability before drawing a conclusion.')}</p><p><b>Common trap:</b> ${esc(r.commonTrap||r.misconception)}</p><h4>Plant decision</h4><p>${esc(r.decision)}</p>",
    "deep evidence check markup",
)
write(p, s)

# Simple lesson shell: one completion action, compact bookmark, collapsed measured evidence.
p = "lesson-simple-experience.js"
s = read(p)
s = rep(s, "/* MouldMaster simple lesson experience — 2026.09.07.2 */", "/* MouldMaster simple lesson experience — 2026.09.07.3 */", "simple comment version")
s = rep(s, "const VERSION='2026.09.07.2';", "const VERSION='2026.09.07.3';", "simple version")
css = """.mm-simple-lesson-bookmark{width:42px;min-width:42px;height:42px;padding:0!important;display:inline-grid!important;place-items:center;border-radius:12px!important;font-size:20px!important;line-height:1!important}
#lesson.mm-simple-lesson .lesson-actions-sticky.mm-simple-completion{display:block;margin-top:12px}
#lesson.mm-simple-lesson .lesson-actions-sticky.mm-simple-completion>button:not(.primary){display:none!important}
#lesson.mm-simple-lesson .lesson-actions-sticky.mm-simple-completion>.primary{width:100%;min-height:52px;font-size:16px}
#lesson.mm-simple-lesson .mm-simple-measured-evidence{margin:10px 0 0;border:1px solid #304a68;border-radius:14px;background:#0e1d31;overflow:hidden}
#lesson.mm-simple-lesson .mm-simple-measured-evidence>summary{min-height:46px;display:flex;align-items:center;padding:10px 13px;cursor:pointer;list-style:none;color:#d9e8f7;font-weight:750}
#lesson.mm-simple-lesson .mm-simple-measured-evidence>summary::-webkit-details-marker{display:none}
#lesson.mm-simple-lesson .mm-simple-measured-evidence>summary::before{content:'▸';margin-right:8px;color:#9fd8ff}
#lesson.mm-simple-lesson .mm-simple-measured-evidence[open]>summary::before{content:'▾'}
#lesson.mm-simple-lesson .mm-simple-measured-evidence>.mme-panel{margin:0!important;border:0!important;border-top:1px solid #263f5c!important;border-radius:0!important;background:transparent!important}
"""
s = rep(
    s,
    ".mm-simple-lesson-start{width:100%;margin-top:17px;min-height:50px;font-size:16px}\n",
    ".mm-simple-lesson-start{width:100%;margin-top:17px;min-height:50px;font-size:16px}\n" + css,
    "simple compact completion css",
)
funcs = r"""
function compactCompletionActions(article){
  const actions=article.querySelector('.lesson-actions-sticky');
  if(!actions)return;
  actions.classList.add('mm-simple-completion');
  const meta=article.querySelector('.mm-simple-lesson-hero .mm-simple-lesson-meta');
  const bookmark=[...actions.querySelectorAll('button')].find(button=>{
    const action=button.getAttribute('onclick')||button.getAttribute('data-mm-onclick')||'';
    return /toggleBookmark\(/.test(action);
  });
  if(bookmark&&meta){
    const saved=/★|Saved/i.test(bookmark.textContent||'');
    bookmark.className='ghost mm-simple-lesson-bookmark';
    bookmark.textContent=saved?'★':'☆';
    bookmark.setAttribute('aria-label',saved?'Remove saved lesson':'Save lesson');
    bookmark.title=saved?'Remove saved lesson':'Save lesson';
    meta.appendChild(bookmark);
  }
}
function foldEvidenceCheck(article){
  const detail=article.querySelector('#mmLessonDeepV2 .mm-deep-v2-detail');
  if(!detail||![...detail.querySelectorAll('h4')].some(h=>/^Evidence check$/i.test(String(h.textContent||'').trim())))return;
  for(const section of article.querySelectorAll(':scope > .content-block,:scope > .mm-simple-section')){
    const heading=section.querySelector(':scope > h3');
    if(heading&&/^Evidence check$/i.test(String(heading.textContent||'').trim()))section.remove();
  }
}
function foldMeasuredEvidence(article){
  for(const panel of article.querySelectorAll('[data-mm-measured-evidence="relevant"]')){
    if(panel.closest('.mm-simple-measured-evidence'))continue;
    const details=document.createElement('details');
    details.className='mm-simple-measured-evidence';
    const summary=document.createElement('summary');
    summary.textContent='Measured evidence';
    panel.before(details);
    details.append(summary,panel);
  }
}
"""
s = rep(s, "}\nfunction simplifyCoreLesson(){", "}\n" + funcs + "function simplifyCoreLesson(){", "simple cleanup functions")
s = rep(
    s,
    "    });\n  }\n}\nfunction simplifyMaterialLesson(){",
    "    });\n  }\n  compactCompletionActions(article);\n  foldEvidenceCheck(article);\n  foldMeasuredEvidence(article);\n}\nfunction simplifyMaterialLesson(){",
    "simple cleanup calls",
)
write(p, s)

# Keep Listen available but visibly secondary when collapsed.
p = "read-aloud.js"
s = read(p)
s = rep(s, "/* MouldMaster Read Aloud — 2026.09.07.1", "/* MouldMaster Read Aloud — 2026.09.07.2", "read aloud comment version")
s = rep(s, "const VERSION='2026.09.07.1';", "const VERSION='2026.09.07.2';", "read aloud version")
s = rep(
    s,
    ".mm-read-aloud details:not([open]) summary{min-width:118px;justify-content:center;border-radius:13px}",
    ".mm-read-aloud details:not([open]) summary{min-width:102px;min-height:44px;padding:8px 10px;justify-content:center;border-radius:13px;font-size:13px}",
    "collapsed Listen geometry",
)
write(p, s)

# Browser regression: one ending, evidence folded, measured evidence collapsed, compact Listen.
p = "qa/lesson-detail-simplicity.spec.js"
s = read(p)
marker = "test('lesson has one clear ending and optional evidence stays out of the default flow'"
if marker not in s:
    s += r'''

test('lesson has one clear ending and optional evidence stays out of the default flow',async({page})=>{
  await openLesson(page);
  const details=page.locator('#mmLessonDeepV2 details');
  const directEvidenceCount=await page.locator('#lesson .lesson-body > .content-block, #lesson .lesson-body > .mm-simple-section').evaluateAll(nodes=>nodes.filter(node=>/^Evidence check$/i.test(node.querySelector(':scope > h3')?.textContent?.trim()||'')).length);
  expect(directEvidenceCount).toBe(0);
  await details.locator('summary').click();
  await expect(details.getByRole('heading',{name:'Evidence check'})).toBeVisible();
  await expect(details.getByText(/^Capture:/)).toBeVisible();
  await expect(details.getByText(/^Common trap:/)).toBeVisible();
  await details.locator('summary').click();
  const actions=page.locator('#lesson .lesson-actions-sticky.mm-simple-completion');
  await expect(actions).toBeVisible();
  await expect(actions.locator('button:visible')).toHaveCount(1);
  await expect(actions.locator('button.primary')).toBeVisible();
  const bookmark=page.locator('#lesson .mm-simple-lesson-meta .mm-simple-lesson-bookmark');
  await expect(bookmark).toBeVisible();
  const bookmarkBox=await bookmark.boundingBox();
  expect(bookmarkBox?.width||999).toBeLessThanOrEqual(46);
  expect(bookmarkBox?.height||999).toBeLessThanOrEqual(46);
  const measured=page.locator('#lesson .mm-simple-measured-evidence');
  await expect(measured).toBeVisible();
  expect(await measured.evaluate(el=>el.open)).toBe(false);
  await expect(measured.locator('> .mme-panel')).toBeHidden();
  await expect(measured.locator('summary')).toHaveText('Measured evidence');
  const listen=page.locator('.mm-read-aloud details:not([open]) summary');
  await expect(listen).toBeVisible();
  const listenBox=await listen.boundingBox();
  expect(listenBox?.width||999).toBeLessThanOrEqual(112);
  expect(listenBox?.height||999).toBeLessThanOrEqual(48);
});
'''
write(p, s)

# Governed .22 release identity + Read Aloud component identity.
for p in ["version.json", "pwa-shell.js", "service-worker.js", "index.html", "qa_release.py"]:
    s = read(p)
    if "2026.09.06.21" not in s:
        raise SystemExit(f"missing .21 web release marker in {p}")
    write(p, s.replace("2026.09.06.21", "2026.09.06.22"))

p = "version.json"
s = read(p)
s = rep(s, '"read_aloud_version": "2026.09.07.1"', '"read_aloud_version": "2026.09.07.2"', "version read aloud identity")
write(p, s)

print("single lesson ending migration applied")
