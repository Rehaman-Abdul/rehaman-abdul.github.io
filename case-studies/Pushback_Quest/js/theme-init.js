// Classic script (not a module) so the saved theme is applied before first paint.
// Duplicates the storage read on purpose: it must run synchronously and stand alone.
(function () {
  try {
    var raw = window.localStorage.getItem("pushbackQuest.v1");
    var settings = raw ? (JSON.parse(raw).settings || {}) : {};
    var root = document.documentElement;
    if (settings.theme === "light" || settings.theme === "dark") {
      root.setAttribute("data-theme", settings.theme);
    }
    if (settings.reducedMotion === true) {
      root.setAttribute("data-motion", "reduce");
    }
  } catch (e) {
    /* storage unavailable: fall back to system preferences */
  }
})();
