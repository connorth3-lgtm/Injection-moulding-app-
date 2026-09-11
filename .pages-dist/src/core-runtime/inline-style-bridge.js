(function(){
  'use strict';
  if(window.MM_INLINE_STYLE_BRIDGE)return;

  const VERSION='1';
  const DATA_ATTR='data-mm-style';
  const STYLE_ATTR_RE=/(\s)style\s*=\s*(["'])([\s\S]*?)\2/gi;

  function bridgeError(message,detail){
    const error=new Error(`MouldMaster inline-style bridge: ${message}`);
    if(detail!==undefined)error.detail=detail;
    console.error(error);
    return error;
  }

  function splitTopLevel(source,delimiter){
    const parts=[];
    let start=0,depth=0,quote='',escaped=false;
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(quote){
        if(escaped){escaped=false;continue}
        if(ch==='\\'){escaped=true;continue}
        if(ch===quote)quote='';
        continue;
      }
      if(ch==='\''||ch==='"'){quote=ch;continue}
      if(ch==='('||ch==='['||ch==='{'){depth++;continue}
      if(ch===')'||ch===']'||ch==='}'){depth--;if(depth<0)throw bridgeError('unbalanced CSS declaration',source);continue}
      if(ch===delimiter&&depth===0){parts.push(source.slice(start,i));start=i+1}
    }
    if(quote||depth!==0)throw bridgeError('unterminated CSS declaration',source);
    parts.push(source.slice(start));
    return parts;
  }

  function findTopLevelColon(source){
    let depth=0,quote='',escaped=false;
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(quote){
        if(escaped){escaped=false;continue}
        if(ch==='\\'){escaped=true;continue}
        if(ch===quote)quote='';
        continue;
      }
      if(ch==='\''||ch==='"'){quote=ch;continue}
      if(ch==='('||ch==='['||ch==='{'){depth++;continue}
      if(ch===')'||ch===']'||ch==='}'){depth--;continue}
      if(ch===':'&&depth===0)return i;
    }
    return -1;
  }

  function applyDeclaration(element,declaration){
    const raw=declaration.trim();
    if(!raw)return;
    const colon=findTopLevelColon(raw);
    if(colon<=0)throw bridgeError('style declaration has no property separator',raw);
    const property=raw.slice(0,colon).trim();
    let value=raw.slice(colon+1).trim();
    if(!/^--[A-Za-z0-9_-]+$/.test(property)&&!/^[-A-Za-z][A-Za-z0-9_-]*$/.test(property))throw bridgeError('invalid CSS property name',property);
    let priority='';
    const important=value.match(/\s*!important\s*$/i);
    if(important){value=value.slice(0,important.index).trim();priority='important'}
    element.style.setProperty(property,value,priority);
  }

  function applyElement(element){
    if(!(element instanceof Element)||!element.hasAttribute(DATA_ATTR))return;
    const raw=element.getAttribute(DATA_ATTR)||'';
    element.removeAttribute(DATA_ATTR);
    try{
      for(const declaration of splitTopLevel(raw,';'))applyDeclaration(element,declaration);
    }catch(error){
      if(!(error instanceof Error))console.error(bridgeError('unexpected CSS application failure',error));
    }
  }

  function applyTree(root){
    if(root instanceof Element)applyElement(root);
    if(root&&typeof root.querySelectorAll==='function')for(const element of root.querySelectorAll(`[${DATA_ATTR}]`))applyElement(element);
  }

  function transformMarkup(markup){
    return String(markup).replace(STYLE_ATTR_RE,(_whole,prefix,quote,value)=>`${prefix}${DATA_ATTR}=${quote}${value}${quote}`);
  }

  function patchHtmlSinks(){
    const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
    if(inner&&inner.get&&inner.set&&inner.configurable){
      Object.defineProperty(Element.prototype,'innerHTML',{
        configurable:inner.configurable,
        enumerable:inner.enumerable,
        get:inner.get,
        set(value){inner.set.call(this,transformMarkup(value));applyTree(this)}
      });
    }

    const outer=Object.getOwnPropertyDescriptor(Element.prototype,'outerHTML');
    if(outer&&outer.get&&outer.set&&outer.configurable){
      Object.defineProperty(Element.prototype,'outerHTML',{
        configurable:outer.configurable,
        enumerable:outer.enumerable,
        get:outer.get,
        set(value){const parent=this.parentElement;outer.set.call(this,transformMarkup(value));if(parent)applyTree(parent)}
      });
    }

    const nativeInsert=Element.prototype.insertAdjacentHTML;
    if(typeof nativeInsert==='function'){
      Element.prototype.insertAdjacentHTML=function(position,text){
        const parent=this.parentElement;
        const result=nativeInsert.call(this,position,transformMarkup(text));
        applyTree(position==='beforebegin'||position==='afterend'?parent:this);
        return result;
      };
    }

    if(typeof Range!=='undefined'&&typeof Range.prototype.createContextualFragment==='function'){
      const nativeFragment=Range.prototype.createContextualFragment;
      Range.prototype.createContextualFragment=function(text){const fragment=nativeFragment.call(this,transformMarkup(text));applyTree(fragment);return fragment};
    }
  }

  patchHtmlSinks();
  applyTree(document.documentElement);

  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)applyTree(node);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.MM_INLINE_STYLE_BRIDGE=Object.freeze({
    version:VERSION,
    dataAttribute:DATA_ATTR,
    transformForTest:transformMarkup,
    applyForTest:applyTree
  });
})();
