
(function(){
  function hideMouldMasterSplash(){
    var s=document.getElementById("mmAppSplash");
    if(!s)return;
    s.style.opacity="0";
    s.style.visibility="hidden";
    setTimeout(function(){ if(s&&s.parentNode)s.parentNode.removeChild(s); },430);
  }
  if(document.readyState==="complete"){
    setTimeout(hideMouldMasterSplash,650);
  }else{
    window.addEventListener("load",function(){setTimeout(hideMouldMasterSplash,650);},{once:true});
  }
  setTimeout(hideMouldMasterSplash,2200);
})();
