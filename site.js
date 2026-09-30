// Grove site: start at the shelf, climb at will.
(function () {
  "use strict";
  // Arm the rise effect only when JS runs (no-JS keeps content visible).
  document.documentElement.classList.add("fx");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Page reads top-down in stack order: splash, fire, glass, house,
  // suite, grove, then the cellar. No auto-jump anywhere.
  // Ember-rise chapters as they enter. Threshold is 0 on purpose:
  // ratios are relative to the *element*, and #house is ~13k px tall —
  // it can never reach a fractional threshold on a normal viewport,
  // which left it invisible forever. Any pixel in view rises it.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("risen");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
  document.querySelectorAll(".chapter,.splash").forEach(function (el) {
    io.observe(el);
  });
  // Safety net: if the observer never fires (odd viewport, old engine),
  // content must still appear. Visibility is never gated on animation.
  setTimeout(function () {
    document.querySelectorAll(".chapter,.splash").forEach(function (el) {
      el.classList.add("risen");
    });
  }, 2000);
  // Index highlight.
  var links = Array.prototype.slice.call(document.querySelectorAll(".index a"));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  var nav = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        links.forEach(function (a) { a.classList.remove("active"); });
        var a = byId[e.target.id];
        if (a) a.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  document.querySelectorAll("main .chapter").forEach(function (s) { nav.observe(s); });
  // Up button: appears once the splash scrolls away.
  var up = document.getElementById("up");
  function onScroll() {
    up.hidden = window.scrollY < window.innerHeight;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  up.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  onScroll();
  // Clips: pause offscreen, honor reduced motion.
  var clips = Array.prototype.slice.call(document.querySelectorAll("video.clip"));
  if (reduceMotion) {
    clips.forEach(function (v) { v.pause(); v.removeAttribute("autoplay"); v.setAttribute("controls", ""); });
  } else if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.play().catch(function () {}); }
        else { e.target.pause(); }
      });
    }, { threshold: 0.25 });
    clips.forEach(function (v) { vio.observe(v); });
  }
})();
