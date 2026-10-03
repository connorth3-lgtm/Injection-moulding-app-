
(function mmStartupSelfCheck(){
  var started=Date.now();
  function check(){
    try {
      if (!window.MM_APP_SHELL_FINALIZED) {
        if (Date.now()-started < 10000) { setTimeout(check,250); return; }
        window.__mmShowStartupFailure("The application shell did not finish starting within 10 seconds.");
        return;
      }
      var dash = document.getElementById("dashboard");
      var navButtons = document.querySelectorAll("#nav button[data-view]");
      if (!dash || !dash.innerHTML.trim()) {
        window.__mmShowStartupFailure("The application scripts loaded but the Home dashboard did not render.");
        return;
      }
      if (!navButtons.length) {
        window.__mmShowStartupFailure("The application rendered but navigation controls were not found.");
      }
    } catch (e) {
      window.__mmShowStartupFailure("Startup self-check failed: " + e.message);
    }
  }
  setTimeout(check,250);
})();
