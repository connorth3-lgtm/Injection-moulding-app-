
setTimeout(function () {
  try {
    var dash = document.getElementById("dashboard");
    var navButtons = document.querySelectorAll("#nav button[data-view]");
    if (!dash || !dash.innerHTML.trim()) {
      window.__mmShowStartupFailure(
        "The application scripts loaded but the Home dashboard did not render."
      );
      return;
    }
    if (!navButtons.length) {
      window.__mmShowStartupFailure(
        "The application rendered but navigation controls were not found."
      );
    }
  } catch (e) {
    window.__mmShowStartupFailure("Startup self-check failed: " + e.message);
  }
}, 700);
