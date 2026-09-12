from pathlib import Path

path=Path('training-qa-fix.js')
text=path.read_text(encoding='utf-8')
old='''function relabelLearnerResetControls(root=document){
 try{root.querySelectorAll?.('button[onclick*=\\"resetData\\"]')?.forEach(button=>{if(button.textContent.trim()==='Reset all local data')button.textContent='Reset learner data'})}catch(_){}
}
relabelLearnerResetControls();
try{new MutationObserver(()=>relabelLearnerResetControls()).observe(document.documentElement,{childList:true,subtree:true})}catch(_){}
'''
new='''function relabelLearnerResetControls(root){
 if(!root&&typeof document!=='undefined')root=document;
 if(!root?.querySelectorAll)return;
 try{root.querySelectorAll('button[onclick*=\\"resetData\\"]').forEach(button=>{if(button.textContent.trim()==='Reset all local data')button.textContent='Reset learner data'})}catch(_){}
}
relabelLearnerResetControls();
try{if(typeof document!=='undefined'&&typeof MutationObserver!=='undefined')new MutationObserver(()=>relabelLearnerResetControls(document)).observe(document.documentElement,{childList:true,subtree:true})}catch(_){}
'''
if text.count(old)!=1:
    raise SystemExit(f'training reset DOM guard target count was {text.count(old)}, expected 1')
path.write_text(text.replace(old,new,1),encoding='utf-8')

qa=Path('qa_process_data_integrity.cjs')
q=qa.read_text(encoding='utf-8')
anchor="const runtimeSource=fs.readFileSync('data-integration-runtime.js','utf8');\n"
regression="""const trainingBridgeSource=fs.readFileSync('training-qa-fix.js','utf8');
{
  const memory=new Map();
  const storage={
    get length(){return memory.size},
    key(i){return [...memory.keys()][i]??null},
    getItem:k=>memory.has(String(k))?memory.get(String(k)):null,
    setItem:(k,v)=>memory.set(String(k),String(v)),
    removeItem:k=>memory.delete(String(k)),
  };
  const bridgeWindow={};
  const bridgeSandbox={window:bridgeWindow,localStorage:storage,console,Date,Math,Object,String,Number,JSON,setTimeout:()=>{},alert:()=>{},confirm:()=>true,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}}};
  vm.createContext(bridgeSandbox);
  assert.doesNotThrow(()=>vm.runInContext(trainingBridgeSource,bridgeSandbox,{filename:'training-qa-fix.js'}),'training bridge must initialize without a DOM so import/reset validation can run in non-browser contexts');
  assert(bridgeWindow.MM_TRAINING_DATA_BRIDGE,'DOM-less training bridge initialization must still expose its cleanup API');
}

"""
if q.count(anchor)!=1:
    raise SystemExit(f'process integrity QA anchor count was {q.count(anchor)}, expected 1')
qa.write_text(q.replace(anchor,anchor+regression,1),encoding='utf-8')
