'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class StorageMock {
  constructor() { this.data = new Map(); }
  get length() { return this.data.size; }
  key(i) { return [...this.data.keys()][i] ?? null; }
  getItem(k) { return this.data.has(String(k)) ? this.data.get(String(k)) : null; }
  setItem(k, v) { this.data.set(String(k), String(v)); }
  removeItem(k) { this.data.delete(String(k)); }
}

function deterministicCrypto() {
  let seq = 0;
  return {
    randomUUID() {
      seq += 1;
      return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
    },
    getRandomValues(a) {
      for (let i = 0; i < a.length; i += 1) a[i] = (i + seq + 1) & 255;
      return a;
    }
  };
}

function testLearnerAndTrainerIsolation() {
  const learnerSource = fs.readFileSync('src/domains/shared/learner-scope.js', 'utf8');
  const trainerSource = fs.readFileSync('src/domains/zz-v27/02-trainer-governance.js', 'utf8');

  const localStorage = new StorageMock();
  const crypto = deterministicCrypto();
  const db = {
    activeUser: 'learner-a',
    users: {
      'learner-a': { id: 'learner-a', name: 'Same Name', role: 'learner' },
      'learner-b': { id: 'learner-b', name: 'Same Name', role: 'learner' },
      'trainer-1': { id: 'trainer-1', name: 'Trainer', role: 'instructor' }
    }
  };
  const document = {
    getElementById() { return null; },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const window = {
    crypto,
    db,
    user: db.users['learner-a'],
    addEventListener() {},
    saveProfile() {
      db.users[db.activeUser].role = 'instructor';
    },
    normaliseImportedUser(u, id) {
      return { ...(u || {}), id: String(id || u?.id || '') };
    }
  };
  const sandbox = {
    window,
    document,
    localStorage,
    Storage: StorageMock,
    crypto,
    Uint8Array,
    JSON,
    Math,
    Object,
    Array,
    Set,
    Map,
    String,
    Number,
    Date,
    Error,
    console,
    queueMicrotask: fn => fn(),
    persist() {}
  };

  vm.createContext(sandbox);
  vm.runInContext(learnerSource, sandbox, { filename: 'learner-scope.js' });
  const S = window.MM_LEARNER_SCOPE;
  const tokenA = S.tokenFor('learner-a');
  const tokenB = S.tokenFor('learner-b');
  const tokenTrainer = S.tokenFor('trainer-1');

  assert.match(tokenA, /^[0-9a-f]{32}$/, 'learner A must receive a strong opaque token');
  assert.match(tokenB, /^[0-9a-f]{32}$/, 'learner B must receive a strong opaque token');
  assert.notStrictEqual(tokenA, tokenB, 'duplicate display names must not collapse learner identity');

  db.activeUser = 'learner-a';
  localStorage.setItem('mm_real_measured_assessment_v1', JSON.stringify({ owner: 'a' }));
  assert.deepStrictEqual(
    JSON.parse(localStorage.getItem(`mm_real_measured_assessment_v1::${tokenA}`)),
    { owner: 'a' },
    'learner A assessment must be stored in learner A bucket'
  );

  db.activeUser = 'learner-b';
  assert.strictEqual(
    localStorage.getItem('mm_real_measured_assessment_v1'),
    null,
    'learner B must not read learner A assessment through the legacy bare key'
  );
  localStorage.setItem('mm_real_measured_assessment_v1', JSON.stringify({ owner: 'b' }));
  assert.deepStrictEqual(
    JSON.parse(localStorage.getItem(`mm_real_measured_assessment_v1::${tokenB}`)),
    { owner: 'b' },
    'learner B assessment must be stored in learner B bucket'
  );

  db.activeUser = 'learner-a';
  assert.deepStrictEqual(
    JSON.parse(localStorage.getItem('mm_real_measured_assessment_v1')),
    { owner: 'a' },
    'switching back to learner A must restore only learner A assessment'
  );

  vm.runInContext(trainerSource, sandbox, { filename: 'trainer-governance.js' });
  const G = window.MM_TRAINER_GUARD;

  assert.throws(
    () => G.addObservation('learner-b', 'Machine setup', 'learner tried to write'),
    /Instructor authorization required/,
    'learner profiles must not create trainer observations'
  );

  db.activeUser = 'learner-a';
  window.saveProfile();
  assert.strictEqual(
    db.users['learner-a'].role,
    'learner',
    'learner preference save must not self-grant instructor authority'
  );

  const importedLearner = window.normaliseImportedUser(
    { id: 'learner-a', role: 'instructor' },
    'learner-a'
  );
  assert.strictEqual(
    importedLearner.role,
    'learner',
    'imported backup must not grant instructor authority to a learner'
  );
  const importedTrainer = window.normaliseImportedUser(
    { id: 'trainer-1', role: 'learner' },
    'trainer-1'
  );
  assert.strictEqual(
    importedTrainer.role,
    'instructor',
    'an already-authorized local trainer must retain its governed role'
  );

  db.activeUser = 'trainer-1';
  const obsA = G.addObservation('learner-a', 'Evidence-first troubleshooting', 'Observed on cell 2');
  const signB = G.signOff('learner-b', 'Safe start-up', 'Completed under supervision');

  assert.strictEqual(obsA.learnerRef, tokenA, 'learner A evidence must carry learner A opaque reference');
  assert.strictEqual(signB.learnerRef, tokenB, 'learner B evidence must carry learner B opaque reference');
  assert.strictEqual(obsA.trainerRef, tokenTrainer, 'observation must carry governed trainer reference');
  assert.strictEqual(signB.signOff, true, 'sign-off record must be distinguishable from observation');

  const evidenceAKey = `mm_practical_evidence_v27::${tokenA}`;
  const evidenceBKey = `mm_practical_evidence_v27::${tokenB}`;
  const evidenceA = JSON.parse(localStorage.getItem(evidenceAKey));
  const evidenceB = JSON.parse(localStorage.getItem(evidenceBKey));
  assert.strictEqual(evidenceA.length, 1, 'learner A must have an independent evidence bucket');
  assert.strictEqual(evidenceB.length, 1, 'learner B must have an independent evidence bucket');
  assert.strictEqual(evidenceA[0].learnerId, 'learner-a', 'learner A evidence bucket was contaminated');
  assert.strictEqual(evidenceB[0].learnerId, 'learner-b', 'learner B evidence bucket was contaminated');

  db.activeUser = 'learner-a';
  assert.strictEqual(G.list('learner-a').length, 1, 'learner A must be able to read own evidence');
  assert.throws(
    () => G.list('learner-b'),
    /Learners can read only their own practical evidence/,
    'learner A must not read learner B practical evidence'
  );

  db.activeUser = 'learner-b';
  assert.strictEqual(G.list('learner-b').length, 1, 'learner B must be able to read own evidence');
  assert.throws(
    () => G.signOff('learner-b', 'Unsafe self-signoff'),
    /Instructor authorization required/,
    'learner must not sign off their own evidence'
  );
}

function testAuditHardeningRuntime() {
  const source = fs.readFileSync('src/domains/zz-v27/05-audit-hardening.js', 'utf8');

  class HTMLElementMock {
    constructor() {
      this.attrs = {};
      this.children = [];
      this.inert = false;
      this.offsetParent = {};
      this.focused = false;
    }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    focus() { this.focused = true; document.activeElement = this; }
    contains() { return false; }
  }

  const input = new HTMLElementMock();
  input.value = '';
  const searchButton = new HTMLElementMock();
  searchButton.dataset = { mmSearchKind: 'lesson', mmSearchId: '2' };
  searchButton.addEventListener = (type, fn) => {
    if (type === 'click') searchButton.clickHandler = fn;
  };
  const host = new HTMLElementMock();
  host.innerHTML = '';
  host.querySelectorAll = sel => sel === '[data-mm-search-kind]' ? [searchButton] : [];

  const feedback = new HTMLElementMock();
  const titledButton = new HTMLElementMock();
  titledButton.attrs.title = 'Close search';
  const releaseText = new HTMLElementMock();
  releaseText.textContent = 'Release 2026.09.06.26';
  const copyNode = {
    nodeValue: "Change global clamp force. Clips aren't uploaded; audio is transcribed on this device."
  };

  const heading = new HTMLElementMock();
  heading.id = '';
  const firstField = new HTMLElementMock();
  const lastField = new HTMLElementMock();
  const card = new HTMLElementMock();
  card.querySelector = sel => {
    if (sel === 'h1,h2,h3') return heading;
    if (sel.startsWith('[autofocus]')) return firstField;
    return null;
  };
  const modal = new HTMLElementMock();
  modal.querySelector = sel => sel === '.modal-card' ? card : null;
  modal.querySelectorAll = () => [firstField, lastField];
  const appRoot = new HTMLElementMock();
  const invoker = new HTMLElementMock();

  const actions = [];
  let keydownHandler = null;
  let walkerDone = false;
  const document = {
    activeElement: invoker,
    documentElement: {},
    body: { children: [appRoot, modal] },
    getElementById(id) {
      if (id === 'globalSearch') return input;
      if (id === 'searchResults') return host;
      return null;
    },
    querySelector(sel) {
      if (sel.includes('.modal')) return modal;
      return null;
    },
    querySelectorAll(sel) {
      if (sel.includes('.feedback')) return [feedback];
      if (sel.includes('button[title]')) return [titledButton];
      if (sel === '.tiny,.muted,p,span,b') return [releaseText];
      return [];
    },
    createTreeWalker() {
      walkerDone = false;
      return {
        currentNode: null,
        nextNode() {
          if (walkerDone) return false;
          walkerDone = true;
          this.currentNode = copyNode;
          return true;
        }
      };
    },
    addEventListener(type, fn) {
      if (type === 'keydown') keydownHandler = fn;
    }
  };

  class MutationObserverMock {
    constructor(fn) { this.fn = fn; }
    observe() {}
  }

  const D = {
    lessons: [
      { id: 1, title: 'Temperature control', summary: 'Control melt temperature', courseName: 'Processing' },
      { id: 2, title: 'Non-return valve diagnostics', summary: 'Check shot delivery repeatability', courseName: 'Machine' }
    ],
    defects: [
      { id: 'flash', name: 'Flash', symptom: 'Material escapes the parting line', mechanisms: ['clamp or pressure imbalance'] }
    ],
    glossary: {
      'Gate seal': 'Point where hold pressure no longer transmits through the gate'
    }
  };
  const MAT_LESSONS = [
    { id: 11, title: 'Glass transition', intro: 'Polymer mobility changes near Tg', points: ['amorphous phase'], chapterName: 'Materials' }
  ];

  const window = {
    openModal() { actions.push('openModal'); },
    closeModal() { actions.push('closeModal'); },
    goLesson(id) { actions.push(`goLesson:${id}`); },
    switchView(id) { actions.push(`switchView:${id}`); },
    MM_TRAINER_GUARD: { install() { actions.push('trainerInstall'); } }
  };
  const sandbox = {
    window,
    document,
    D,
    MAT_LESSONS,
    doSearch() {},
    closeModal: window.closeModal,
    goLesson: window.goLesson,
    switchView: window.switchView,
    MutationObserver: MutationObserverMock,
    NodeFilter: { SHOW_TEXT: 4 },
    HTMLElement: HTMLElementMock,
    queueMicrotask: fn => fn(),
    setTimeout: fn => fn(),
    String,
    Object,
    Array,
    Set,
    Map,
    Math,
    Number,
    Date,
    Error,
    JSON,
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: '05-audit-hardening.js' });

  input.value = 'temprature';
  window.doSearch();
  assert.match(host.innerHTML, /Temperature control/, 'one-edit temperature typo must still find the lesson');
  assert.match(host.innerHTML, /data-mm-search-kind="lesson"/, 'search results must be actionable buttons');

  input.value = 'check ring';
  window.doSearch();
  assert.match(host.innerHTML, /Non-return valve diagnostics/, 'check-ring synonym must find NRV content');
  assert.strictEqual(typeof searchButton.clickHandler, 'function', 'search action handler must be attached');
  actions.length = 0;
  searchButton.clickHandler();
  assert.deepStrictEqual(
    actions.slice(0, 3),
    ['closeModal', 'goLesson:2', 'switchView:lesson'],
    'lesson search result must navigate to the selected lesson'
  );

  assert.strictEqual(feedback.attrs.role, 'status', 'assessment feedback must expose status semantics');
  assert.strictEqual(feedback.attrs['aria-live'], 'polite', 'assessment feedback must announce updates politely');
  assert.strictEqual(titledButton.attrs['aria-label'], 'Close search', 'titled buttons must receive accessible names');
  assert.match(releaseText.textContent, /2026\.09\.08\.27/, 'visible release labels must be upgraded to v27');
  assert.match(
    copyNode.nodeValue,
    /Escalate any authorised process-change decision to the responsible trainer\/process lead/,
    'unsafe flash instruction must be replaced'
  );
  assert.match(
    copyNode.nodeValue,
    /MouldMaster does not intentionally upload audio clips/,
    'speech privacy copy must not overclaim that clips are never uploaded by device services'
  );
  assert.match(
    copyNode.nodeValue,
    /handled by your browser\/device speech service/,
    'speech transcription copy must identify the device/browser service boundary'
  );

  actions.length = 0;
  window.openModal();
  assert.strictEqual(modal.attrs.role, 'dialog', 'modal must expose dialog role');
  assert.strictEqual(modal.attrs['aria-modal'], 'true', 'modal must expose aria-modal');
  assert.strictEqual(modal.attrs['aria-labelledby'], 'mm-modal-title-v27', 'modal must be labelled by its heading');
  assert.strictEqual(appRoot.inert, true, 'background content must be inert while modal is open');
  assert.strictEqual(firstField.focused, true, 'modal must move focus inside on open');
  assert.strictEqual(typeof keydownHandler, 'function', 'modal keyboard handler must be installed');

  let prevented = false;
  keydownHandler({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.strictEqual(prevented, true, 'Escape close must prevent stray default behavior');
  assert.ok(actions.includes('closeModal'), 'Escape must close the modal');
  assert.strictEqual(appRoot.inert, false, 'background inert state must be cleared on close');
  assert.strictEqual(invoker.focused, true, 'focus must return to the element that opened the modal');
}

testLearnerAndTrainerIsolation();
testAuditHardeningRuntime();

console.log('v27 security/search/accessibility regression QA passed');
