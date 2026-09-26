// Grove site: start at the fire, climb on scroll.
(function () {
  "use strict";
  // Page reads top-down in stack order: splash, fire, glass, house,
  // suite, grove, then the cellar. No auto-jump anywhere.
  // Ember-rise chapters as they enter.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("risen");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".chapter,.splash").forEach(function (el) {
    io.observe(el);
  });
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
})();
