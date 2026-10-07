/* MouldMaster Book compatibility loader — canonical runtime lives under src/domains/learning/. */
(function(){
  'use strict';
  const release=(document.querySelector('meta[name="mm-shell-release"]')?.content||'').trim();
  function releaseAssetUrl(value){
    const shared=window.MM_RELEASE_ASSET_URL;
    if(typeof shared==='function')return shared(value);
    const raw=String(value||''),version=release||String(window.MM_RUNTIME_ASSET_VERSION||'').trim();
    if(!raw||!version)return raw;
    let url;try{url=new URL(raw,location.href)}catch(_){return raw}
    if(url.origin!==location.origin||!url.pathname.endsWith('.js'))return raw;
    if(!url.searchParams.has('v'))url.searchParams.set('v',version);
    return url.href;
  }
  const canonicalEvidenceLinks=Object.freeze({
    '24f22c3f6f355c0497be3aea21e1a1cc':'https://doi.org/10.3390/polym17081096',
    'c82506ff62375c969e92b74a15c92c3c':'https://doi.org/10.1007/s00170-024-12990-5',
    '87423bb5d6e15bcba62bfe49843785c7':'https://doi.org/10.1007/s00170-022-08859-0',
    '4c976e13bbb957b0862288b2202429ee':'https://doi.org/10.3390/s23031735',
    'c253cc9c68cd5db1b1afec5c98425d9d':'https://doi.org/10.1007/s00170-024-13607-7'
  });
  function canonicalizeEvidenceLinks(root=document){
    root.querySelectorAll?.('a[href*="consensus.app/papers/"]').forEach(anchor=>{
      const href=anchor.getAttribute('href')||'';
      for(const [fingerprint,canonical] of Object.entries(canonicalEvidenceLinks))if(href.includes(fingerprint)){anchor.href=canonical;anchor.rel='noopener noreferrer';break;}
    });
  }
  if(!window.__MM_CANONICAL_EVIDENCE_LINKS__){
    canonicalizeEvidenceLinks();
    window.addEventListener?.('mm:book-render',()=>canonicalizeEvidenceLinks());
    window.__MM_CANONICAL_EVIDENCE_LINKS__=Object.freeze({version:'1',rewrite:canonicalizeEvidenceLinks});
  }
  if(window.MMBook?.version===release)return;
  if(document.querySelector('script[data-mm-book-canonical-runtime]'))return;
  const script=document.createElement('script');
  script.src=releaseAssetUrl('./src/domains/learning/book-runtime.js');
  script.async=false;
  script.dataset.mmBookCanonicalRuntime='1';
  script.addEventListener('error',()=>console.error('[MouldMaster Book] canonical Book runtime could not be loaded'));
  document.head.appendChild(script);
})();
