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
  // Glitch titles + outer-space starfield.
  document.querySelectorAll("main .chapter h2").forEach(function (h) {
    h.setAttribute("data-text", h.textContent);
  });
  var sky = document.getElementById("stars");
  if (sky && sky.getContext) {
    var cx = sky.getContext("2d");
    var palette = ["#D4B4E8", "#E8A0B4", "#8EC4C8", "#F0D8A0", "#B08CC8", "#8FBF9A", "#E8C070", "#F0E4EE"];
    var stars = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function seed() {
      W = window.innerWidth; H = window.innerHeight;
      sky.width = W * dpr; sky.height = H * dpr;
      sky.style.width = W + "px"; sky.style.height = H + "px";
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.floor((W * H) / 9000);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() < 0.85 ? 1 : 2,
          c: palette[(Math.random() * palette.length) | 0],
          base: 0.25 + Math.random() * 0.45,
          amp: 0.15 + Math.random() * 0.3,
          sp: 0.4 + Math.random() * 1.4,
          ph: Math.random() * 6.28
        });
      }
    }
    seed();
    window.addEventListener("resize", seed);
    if (reduceMotion) {
      // one static frame: space, but make it sit still
      stars.forEach(function (s) {
        cx.globalAlpha = s.base; cx.fillStyle = s.c;
        cx.fillRect(s.x, s.y, s.r, s.r);
      });
      cx.globalAlpha = 1;
    } else {
      var blip = null, blipLeft = 0;
      var sweep = null;       // {y, h, vy} scanline band sweeping down
      var nextSweep = 4 + Math.random() * 5;
      var shifts = [];        // [{y, h, dx, left}] row-shift slices
      var nextShift = 2 + Math.random() * 4;
      var flashLeft = 0;      // full-frame burst lift
      var nextFlash = 9 + Math.random() * 8;
      var last = 0;
      function drawStar(s, dx, color, alpha) {
        cx.globalAlpha = alpha; cx.fillStyle = color || s.c;
        cx.fillRect(s.x + (dx || 0), s.y, s.r, s.r);
      }
      (function tick(t) {
        var dt = Math.min((t - last) / 1000 || 0.016, 0.1);
        last = t;
        var time = t / 1000;
        cx.clearRect(0, 0, W, H);
        stars.forEach(function (s) {
          drawStar(s, 0, null, s.base + s.amp * Math.sin(time * s.sp + s.ph));
        });
        // --- glitch blip: one star flashes wrong for a few frames
        if (blipLeft <= 0 && Math.random() < 0.02) {
          blip = stars[(Math.random() * stars.length) | 0];
          blipLeft = 3;
        }
        if (blip && blipLeft > 0) {
          drawStar(blip, 2, "#FFFFFF", 0.95);
          drawStar(blip, -2, "#8EC4C8", 0.5);
          blipLeft--;
        }
        // --- scanline sweep: palette band with RGB-split stars inside
        nextSweep -= dt;
        if (!sweep && nextSweep <= 0) {
          sweep = { y: -60, h: 30 + Math.random() * 50, vy: H / 0.9 };
          nextSweep = 5 + Math.random() * 7;
        }
        if (sweep) {
          sweep.y += sweep.vy * dt;
          if (sweep.y > H + 60) { sweep = null; }
          else {
            cx.globalAlpha = 0.06; cx.fillStyle = "#B08CC8";
            cx.fillRect(0, sweep.y, W, sweep.h);
            cx.globalAlpha = 1;
            stars.forEach(function (s) {
              if (s.y >= sweep.y && s.y <= sweep.y + sweep.h) {
                drawStar(s, 3, "#8EC4C8", 0.7);
                drawStar(s, -3, "#E8A0B4", 0.7);
              }
            });
          }
        }
        // --- row-shift slices: a few rows jump sideways, briefly
        nextShift -= dt;
        if (nextShift <= 0) {
          shifts = [];
          var rows = 2 + ((Math.random() * 3) | 0);
          for (var i = 0; i < rows; i++) {
            shifts.push({
              y: Math.random() * H, h: 6 + Math.random() * 10,
              dx: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 8),
              left: 4 + ((Math.random() * 4) | 0)
            });
          }
          nextShift = 3 + Math.random() * 5;
        }
        shifts = shifts.filter(function (r) { return r.left > 0; });
        shifts.forEach(function (r) {
          r.left--;
          stars.forEach(function (s) {
            if (s.y >= r.y && s.y <= r.y + r.h) drawStar(s, r.dx, "#F0E4EE", 0.35);
          });
        });
        // --- burst lift: whole sky breathes light for 2 frames
        nextFlash -= dt;
        if (nextFlash <= 0) { flashLeft = 2; nextFlash = 9 + Math.random() * 9; }
        if (flashLeft > 0) {
          cx.globalAlpha = 0.045; cx.fillStyle = "#F0E4EE";
          cx.fillRect(0, 0, W, H);
          flashLeft--;
        }
        cx.globalAlpha = 1;
        requestAnimationFrame(tick);
      })(0);
    }
  }
})();
