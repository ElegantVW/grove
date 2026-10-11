// Grove ↔ resume ↔ glade. Chromium MPA view transitions get a direction.
// Everyone else gets a matching slide, then navigate.
// Reduced-motion and modified clicks pass through.
(function () {
  "use strict";
  var html = document.documentElement;
  html.classList.add("fx");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canMpa = "onpagereveal" in window;
  var ENTER_KEY = "grove-cross-enter";

  function roomOf(path) {
    path = String(path || "");
    if (/glade\.html$/.test(path)) return "glade";
    if (/resume\.html$/.test(path)) return "resume";
    return "grove";
  }

  function here() {
    return roomOf(location.pathname);
  }

  function isCross(a) {
    if (!a || a.target === "_blank") return false;
    var to;
    try { to = new URL(a.getAttribute("href"), location.href); }
    catch (err) { return false; }
    if (to.origin !== location.origin) return false;
    return here() !== roomOf(to.pathname);
  }

  function destRoom(a) {
    try { return roomOf(new URL(a.getAttribute("href"), location.href).pathname); }
    catch (err) { return "grove"; }
  }

  function setTypes(vt, from, to) {
    if (!vt || !vt.types) return;
    try {
      vt.types.clear();
      vt.types.add("from-" + from);
      vt.types.add("to-" + to);
    } catch (err) {}
  }

  window.addEventListener("pageswap", function (e) {
    if (!e.viewTransition) return;
    var dest = e.activation && e.activation.entry && e.activation.entry.url;
    if (!dest) return;
    var from = here();
    var to = roomOf(new URL(dest, location.href).pathname);
    if (from === to) return;
    setTypes(e.viewTransition, from, to);
  });

  window.addEventListener("pagereveal", function (e) {
    html.classList.remove("leaving", "entering", "entered", "to-glade", "to-resume", "to-grove", "from-glade", "from-resume", "from-grove");
    if (!e.viewTransition) return;
    var fromUrl = e.activation && e.activation.from && e.activation.from.url;
    if (!fromUrl) return;
    var from = roomOf(new URL(fromUrl, location.href).pathname);
    var to = here();
    if (from === to) return;
    setTypes(e.viewTransition, from, to);
  });

  window.addEventListener("pageshow", function () {
    html.classList.remove("leaving");
  });

  if (!reduce) {
    try {
      var enter = sessionStorage.getItem(ENTER_KEY);
      if (enter) {
        sessionStorage.removeItem(ENTER_KEY);
        var bits = enter.split(":");
        html.classList.add("entering", "to-" + bits[0], "from-" + bits[1]);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            html.classList.add("entered");
          });
        });
      }
    } catch (err) {}
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!isCross(a)) return;
    if (reduce) return;
    if (canMpa) return;
    e.preventDefault();
    var to = destRoom(a);
    var from = here();
    html.classList.add("leaving", "to-" + to, "from-" + from);
    try { sessionStorage.setItem(ENTER_KEY, to + ":" + from); }
    catch (err) {}
    var url = a.href;
    setTimeout(function () { location.href = url; }, 520);
  });
})();
