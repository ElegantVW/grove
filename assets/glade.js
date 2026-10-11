// The glade: public Worlds reels. EVW-994 is the site air. Fresh load is hush.
(function (root) {
  "use strict";
  var air = document.getElementById("air-reel");
  var song = document.getElementById("song");
  var songWord = song && song.querySelector(".song-word");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wantAir = false;

  function paintSong() {
    if (!song) return;
    song.setAttribute("aria-pressed", wantAir ? "true" : "false");
    if (songWord) songWord.textContent = wantAir ? "air" : "hush";
    if (air && air.closest(".reel")) {
      air.closest(".reel").classList.toggle("is-play", wantAir && !air.paused);
    }
  }

  function startAir() {
    if (!air) return;
    wantAir = true;
    air.muted = false;
    air.play().then(paintSong).catch(function () {
      wantAir = false;
      paintSong();
    });
  }

  function hushAir() {
    wantAir = false;
    if (air) {
      air.pause();
      air.muted = true;
    }
    paintSong();
  }

  root.GroveAir = {
    start: startAir,
    hush: hushAir,
    isAir: function () { return wantAir; },
    pause: function () { if (air) air.pause(); },
    resume: function () {
      if (wantAir && air) air.play().catch(function () {});
    }
  };

  if (song) {
    song.addEventListener("click", function () {
      if (wantAir) hushAir();
      else startAir();
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (!wantAir || !air) return;
    if (document.hidden) air.pause();
    else air.play().catch(function () {});
  });
  if (air) {
    air.addEventListener("play", paintSong);
    air.addEventListener("pause", paintSong);
  }

  var reels = Array.prototype.slice.call(document.querySelectorAll("#glade video"));
  reels.forEach(function (v) {
    var fig = v.closest(".reel");
    var btn = fig && fig.querySelector(".reel-play");
    function toggle() {
      if (v === air) {
        if (wantAir) hushAir();
        else startAir();
        return;
      }
      if (v.paused) {
        v.muted = true;
        v.play().catch(function () {});
      } else {
        v.pause();
      }
    }
    if (btn) btn.addEventListener("click", toggle);
    v.addEventListener("click", toggle);
    v.addEventListener("play", function () {
      if (fig) fig.classList.add("is-play");
      if (btn) btn.textContent = "pause";
    });
    v.addEventListener("pause", function () {
      if (fig && v !== air) fig.classList.remove("is-play");
      if (btn) btn.textContent = "play";
    });
  });

  if (reduce) {
    reels.forEach(function (v) { v.pause(); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (v === air && wantAir) return;
        if (!e.isIntersecting) v.pause();
      });
    }, { threshold: 0.15 });
    reels.forEach(function (v) { io.observe(v); });
  }

  paintSong();
})(window);
