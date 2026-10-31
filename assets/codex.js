// Grove drinks the Codex guest feed this box publishes.
// Static HTML stays if the fetch fails. Never fail silent.
(function (root) {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/ElegantVW/codex-guest/main/";
  var CDN = "https://cdn.jsdelivr.net/gh/ElegantVW/codex-guest@main/";

  function bullets(md, n) {
    var out = [];
    if (!md) return out;
    md.split("\n").forEach(function (line) {
      var t = line.trim();
      if (t.indexOf("- ") === 0) out.push(t.slice(2));
      else if (t.indexOf("* ") === 0) out.push(t.slice(2));
    });
    return out.slice(0, n);
  }

  function mdInline(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  function fillList(el, items) {
    if (!el) return;
    el.innerHTML = "";
    if (!items.length) {
      el.hidden = true;
      return;
    }
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.innerHTML = mdInline(item);
      el.appendChild(li);
    });
    el.hidden = false;
  }

  function asOf(iso) {
    if (!iso) return "";
    return iso.length >= 10 ? iso.slice(0, 10) : iso;
  }

  function getFrom(fetchFn, bases, path) {
    var i = 0;
    function next() {
      if (i >= bases.length) return Promise.reject(new Error(path));
      var base = bases[i++];
      return fetchFn(base + path, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error(path);
        return r.text();
      }).catch(function () {
        return next();
      });
    }
    return next();
  }

  function paint(nowMd, lateMd, feed, els) {
    var nowItems = bullets(nowMd, 6);
    var lateItems = bullets(lateMd, 6);
    fillList(els.nowEl, nowItems);
    fillList(els.lateEl, lateItems);
    if (els.asEl) {
      var gen = feed && feed.generated;
      if (gen) {
        els.asEl.textContent = "as of " + asOf(gen) + " · this studio";
        els.asEl.hidden = false;
      } else if (!nowItems.length && !lateItems.length) {
        els.asEl.textContent = "studio quiet — feed not reached";
        els.asEl.hidden = false;
      }
    }
  }

  function run(opts) {
    opts = opts || {};
    var fetchFn = opts.fetch || fetch;
    var bases = opts.bases || [RAW, CDN];
    var els = opts.els || {
      nowEl: document.getElementById("codex-now"),
      lateEl: document.getElementById("codex-lately"),
      asEl: document.getElementById("codex-asof")
    };
    return Promise.allSettled([
      getFrom(fetchFn, bases, "feed.json"),
      getFrom(fetchFn, bases, "NOW.md"),
      getFrom(fetchFn, bases, "LATELY.md")
    ]).then(function (parts) {
      var feed = {};
      if (parts[0].status === "fulfilled") {
        try { feed = JSON.parse(parts[0].value); } catch (e) { feed = {}; }
      }
      var nowMd = parts[1].status === "fulfilled" ? parts[1].value : "";
      var lateMd = parts[2].status === "fulfilled" ? parts[2].value : "";
      paint(nowMd, lateMd, feed, els);
      if (els.asEl && !nowMd && !lateMd && !feed.generated) {
        els.asEl.textContent = "studio quiet — feed not reached";
        els.asEl.hidden = false;
      }
      return { feed: feed, nowMd: nowMd, lateMd: lateMd };
    });
  }

  var GroveCodex = {
    bullets: bullets,
    mdInline: mdInline,
    asOf: asOf,
    paint: paint,
    run: run,
    RAW: RAW,
    CDN: CDN
  };
  root.GroveCodex = GroveCodex;

  if (typeof document !== "undefined" && document.getElementById && !root.GROVE_CODEX_NOAUTO) {
    if (document.getElementById("codex-asof") || document.getElementById("codex-now")) {
      run();
    }
  }
})(typeof window !== "undefined" ? window : global);
