
(function () {
  function showStartupFailure(message) {
    var existing = document.getElementById("mmStartupFailure");
    if (existing) {
      existing.querySelector("pre").textContent += "\n" + message;
      return;
    }
    var box = document.createElement("div");
    box.id = "mmStartupFailure";
    box.style.cssText =
      "position:fixed;inset:16px;z-index:999999;background:#20151a;color:#fff;" +
      "border:2px solid #ff7b86;border-radius:14px;padding:18px;overflow:auto;" +
      "font-family:system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)";
    box.innerHTML =
      "<h2 style='margin-top:0'>MouldMaster could not start</h2>" +
      "<p>The standalone file caught a startup error instead of leaving dead buttons.</p>" +
      "<pre style='white-space:pre-wrap;background:#120c0f;padding:12px;border-radius:8px'></pre>" +
      "<p>Try reopening the file in a current Chrome, Edge, Firefox or Safari browser.</p>";
    document.body.appendChild(box);
    box.querySelector("pre").textContent = message;
  }

  window.addEventListener("error", function (e) {
    showStartupFailure(
      (e.message || "JavaScript error") +
      (e.filename ? "\nFile: " + e.filename : "") +
      (e.lineno ? "\nLine: " + e.lineno : "")
    );
  });

  window.addEventListener("unhandledrejection", function (e) {
    showStartupFailure("Unhandled promise rejection: " + String(e.reason || "unknown"));
  });

  window.__mmShowStartupFailure = showStartupFailure;
})();
