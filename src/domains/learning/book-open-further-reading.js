/* MouldMaster Book supplemental open further-reading lists. This does not alter claim evidence or SME status. */
(function(){
  "use strict";
  const DATA_URL="./src/domains/learning/book-data/book-open-further-reading-v1.json";
  const EXPECTED_CHAPTER_IDS=["r01","r02","r03","r03a","r04","r05","r06","r07","r08","r09","r10","r11","r12","r13","r14","r15","r16","r17","r18","r19","r20"];
  let dataPromise=null,hydrating=false;
  function validate(data){
    if(!data||data.schemaVersion!==1||data.bookId!=="mouldmaster-book"||data.status!=="supplemental-open-further-reading")throw new Error("further-reading data header is invalid");
    const rows=Array.isArray(data.sources)?data.sources:[],byId=new Map();
    for(const source of rows){
      if(!source||!source.id||!source.title||!source.publisher||!source.kind||!/^https:\/\//i.test(String(source.url||""))||byId.has(source.id))throw new Error("further-reading source is missing required data or has a duplicate ID");
      byId.set(source.id,source);
    }
    const chapters=Array.isArray(data.chapters)?data.chapters:[];
    if(chapters.length!==EXPECTED_CHAPTER_IDS.length||chapters.some((c,i)=>c.chapterId!==EXPECTED_CHAPTER_IDS[i]))throw new Error("further-reading chapters do not match the Book reader map");
    for(const chapter of chapters){
      if(!chapter.title||!Array.isArray(chapter.sourceIds)||chapter.sourceIds.length!==15||new Set(chapter.sourceIds).size!==15||chapter.sourceIds.some(id=>!byId.has(id)))throw new Error("further-reading source count or mapping is invalid for "+chapter.chapterId);
    }
    return {chapters,byId};
  }
  function load(){
    if(!dataPromise){
      dataPromise=fetch(DATA_URL,{cache:"no-cache"}).then(response=>{
        if(!response.ok)throw new Error("further-reading list unavailable ("+response.status+")");
        return response.json();
      }).then(validate).catch(error=>{dataPromise=null;throw error;});
    }
    return dataPromise;
  }
  function render(article,chapter,byId){
    if(article.dataset.mmBookFurtherReading==="ready")return;
    const heading=article.querySelector("h2");
    if(!heading||heading.textContent.trim()!==chapter.title)return;
    const details=document.createElement("details");
    details.className="mm-book-further-reading";
    const summary=document.createElement("summary");
    summary.textContent="15 open further-reading sources";
    details.appendChild(summary);
    const note=document.createElement("p");
    note.textContent="Optional reading for deeper study. These sources are separate from the book’s governed claim evidence and review records.";
    details.appendChild(note);
    const list=document.createElement("ol");
    for(const id of chapter.sourceIds){
      const source=byId.get(id),item=document.createElement("li"),link=document.createElement("a"),meta=document.createElement("small");
      link.href=source.url;
      link.target="_blank";
      link.rel="noopener noreferrer";
      link.textContent=source.title;
      meta.textContent=source.publisher+" · "+source.kind;
      item.append(link,document.createElement("br"),meta);
      list.appendChild(item);
    }
    details.appendChild(list);
    const notes=article.querySelector(".mm-book-reader-notes");
    if(!notes)return;
    notes.insertAdjacentElement("afterend",details);
    article.dataset.mmBookFurtherReading="ready";
  }
  async function hydrate(){
    if(hydrating)return;
    hydrating=true;
    try{
      const {chapters,byId}=await load(),byChapter=new Map(chapters.map(c=>[c.chapterId,c]));
      document.querySelectorAll("article[data-mm-book-reader-chapter]").forEach(article=>{
        const chapter=byChapter.get(article.dataset.mmBookReaderChapter);
        if(chapter)render(article,chapter,byId);
      });
    }catch(error){
      console.warn("[MouldMaster Book] Supplemental further-reading list was not loaded.",error);
    }finally{hydrating=false;}
  }
  function boot(){
    if(!document.documentElement){requestAnimationFrame(boot);return;}
    const observer=new MutationObserver(()=>{void hydrate();});
    observer.observe(document.documentElement,{subtree:true,childList:true});
    void hydrate();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
