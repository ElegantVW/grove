// Grove ↔ resume. Supporting browsers use CSS @view-transition.
// Everyone else gets a short fade. Reduced-motion and modified clicks pass through.
(function () {
  "use strict";
  document.documentElement.classList.add("fx");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isResumePath(path) {
    return /resume\.html$/.test(path);
  }

  function isCross(a) {
    if (!a || a.target === "_blank") return false;
    var to;
    try { to = new URL(a.getAttribute("href"), location.href); }
    catch (err) { return false; }
    if (to.origin !== location.origin) return false;
    return isResumePath(location.pathname) !== isResumePath(to.pathname);
  }

  window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("leaving");
  });

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href]");
    if (!isCross(a)) return;
    if (reduce) return;
    if (typeof document.startViewTransition === "function") return;
    e.preventDefault();
    document.documentElement.classList.add("leaving");
    var url = a.href;
    setTimeout(function () { location.href = url; }, 320);
  });
})();
