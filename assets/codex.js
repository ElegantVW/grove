// Grove drinks the Codex guest feed this box publishes.
// Static HTML stays if the fetch fails.
(function () {
  "use strict";
  var RAW = "https://raw.githubusercontent.com/ElegantVW/codex-guest/main/";

  function get(path) {
    return fetch(RAW + path, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(path);
      return r.text();
    });
  }

  function bullets(md, n) {
    var out = [];
    md.split("\n").forEach(function (line) {
      var t = line.trim();
      if (t.indexOf("- ") === 0) out.push(t.slice(2));
    });
    return out.slice(0, n);
  }

  function mdInline(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  function fillList(el, items) {
    if (!el || !items.length) return;
    el.innerHTML = "";
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

  Promise.all([get("feed.json"), get("NOW.md"), get("LATELY.md")])
    .then(function (parts) {
      var feed = JSON.parse(parts[0]);
      var nowEl = document.getElementById("codex-now");
      var lateEl = document.getElementById("codex-lately");
      var asEl = document.getElementById("codex-asof");
      fillList(nowEl, bullets(parts[1], 6));
      fillList(lateEl, bullets(parts[2], 6));
      if (asEl && feed && feed.generated) {
        asEl.textContent = "as of " + asOf(feed.generated) + " · this studio";
        asEl.hidden = false;
      }
    })
    .catch(function () {
      // keep the handwritten Codex card
    });
})();
