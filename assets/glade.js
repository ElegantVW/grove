// The glade: vertical shorts carousel. EVW-994 is optional air. Fresh load is hush.
(function (root) {
  "use strict";
  var feed = document.getElementById("shorts");
  var air = document.getElementById("air-reel");
  var song = document.getElementById("song");
  var songWord = song && song.querySelector(".song-word");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wantAir = false;
  var reels = Array.prototype.slice.call(document.querySelectorAll(".glade-page .reel video"));

  function paintSong() {
    if (!song) return;
    song.setAttribute("aria-pressed", wantAir ? "true" : "false");
    if (songWord) songWord.textContent = wantAir ? "air" : "hush";
  }

  function mostlyVisible(el) {
    if (!el || !feed) return false;
    var r = el.getBoundingClientRect();
    var f = feed.getBoundingClientRect();
    var vis = Math.min(r.bottom, f.bottom) - Math.max(r.top, f.top);
    return vis > f.height * 0.5;
  }

  function startAir() {
    wantAir = true;
    if (air) {
      air.muted = false;
      if (mostlyVisible(air)) air.play().catch(function () {});
    }
    paintSong();
  }

  function hushAir() {
    wantAir = false;
    if (air) air.muted = true;
    paintSong();
  }

  function playVisible(v) {
    if (!v || reduce) return;
    if (v === air) v.muted = !wantAir;
    else v.muted = true;
    v.play().catch(function () {});
  }

  root.GroveAir = {
    start: startAir,
    hush: hushAir,
    isAir: function () { return wantAir; },
    pause: function () { if (air) air.pause(); },
    resume: function () {
      if (wantAir && air && mostlyVisible(air)) air.play().catch(function () {});
    }
  };

  if (song) {
    song.addEventListener("click", function () {
      if (wantAir) hushAir();
      else startAir();
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) reels.forEach(function (v) { v.pause(); });
  });

  reels.forEach(function (v) {
    var fig = v.closest(".reel");
    var btn = fig && fig.querySelector(".reel-play");
    function toggle() {
      if (v.paused) playVisible(v);
      else v.pause();
    }
    if (btn) btn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggle();
    });
    v.addEventListener("click", toggle);
    v.addEventListener("play", function () {
      if (fig) fig.classList.add("is-play");
      if (btn) btn.textContent = "pause";
    });
    v.addEventListener("pause", function () {
      if (fig) fig.classList.remove("is-play");
      if (btn) btn.textContent = "play";
    });
  });

  if (reduce) {
    reels.forEach(function (v) { v.pause(); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.intersectionRatio >= 0.55) playVisible(v);
        else v.pause();
      });
    }, { root: feed, threshold: [0.55] });
    reels.forEach(function (v) { io.observe(v); });
  }

  function slides() {
    return Array.prototype.slice.call(document.querySelectorAll(".glade-page .reel"));
  }

  function currentIndex() {
    var list = slides();
    var top = feed ? feed.scrollTop : 0;
    var h = feed ? feed.clientHeight : 1;
    var i = Math.round(top / h);
    if (i < 0) i = 0;
    if (i > list.length - 1) i = list.length - 1;
    return i;
  }

  function go(delta) {
    if (!feed) return;
    var list = slides();
    var next = currentIndex() + delta;
    if (next < 0 || next >= list.length) return;
    list[next].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") {
      e.preventDefault();
      go(-1);
    }
  });

  paintSong();
})(window);
