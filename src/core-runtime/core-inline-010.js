
(function(){
  const MM_APP_VERSION = "2026.08.21.1";
  function mmUpdateState(){
    const p = new URLSearchParams(location.search);
    return {
      status: p.get("mmUpdate") || "unknown",
      version: p.get("v") || MM_APP_VERSION
    };
  }
  function mmStatusText(status){
    if(status==="updated") return ["Updated successfully","MouldMaster was updated before launch."];
    if(status==="current") return ["You're up to date","MouldMaster checked for updates before launch."];
    if(status==="offline") return ["Offline — using installed version","MouldMaster could not reach the update service, so it opened normally."];
    if(status==="verify-failed") return ["Update blocked safely","A downloaded update did not pass verification. Your existing version was kept."];
    if(status==="feed-unavailable") return ["Updates not live yet","The automatic update feed has not been published yet. The installed app continues to work normally."];
    return ["Automatic updates enabled","MouldMaster checks for updates whenever you launch it."];
  }
  function mmUpdateCard(){
    const s=mmUpdateState(), copy=mmStatusText(s.status);
    return `<div class="card form-card" style="margin-top:14px">
      <span class="eyebrow">Updates</span>
      <h2 style="margin-bottom:6px">${copy[0]}</h2>
      <p class="muted">${copy[1]}</p>
      <div class="grid2" style="margin-top:10px">
        <div class="stat"><span>Installed version</span><b>${s.version}</b></div>
        <div class="stat"><span>Update mode</span><b>Automatic on launch</b></div>
      </div>
      <p class="tiny muted" style="margin-top:10px">Learner progress, notes, scores and certificates stay in your browser profile and are not replaced by app updates.</p>
    </div>`;
  }
  function attachUpdateCard(){
    try{
      const profile=document.getElementById("profile");
      if(profile && !profile.querySelector("[data-mm-update-card]")){
        const wrap=document.createElement("div");
        wrap.setAttribute("data-mm-update-card","1");
        wrap.innerHTML=mmUpdateCard();
        profile.appendChild(wrap);
      }
    }catch(e){}
  }
  const originalSwitch = window.switchView;
  if(typeof originalSwitch==="function"){
    window.switchView=function(id){
      const r=originalSwitch.apply(this,arguments);
      if(id==="profile") setTimeout(attachUpdateCard,0);
      return r;
    };
  }
  window.addEventListener("load",function(){
    setTimeout(function(){
      const st=mmUpdateState();
      if(st.status==="updated" && typeof window.toast==="function") window.toast("MouldMaster updated successfully");
      if(st.status==="verify-failed" && typeof window.toast==="function") window.toast("Unsafe/invalid update blocked — current version kept");
    },900);
  });
})();
