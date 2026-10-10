// Scroll web reader: read-only export of the terminal book.
(function () {
  "use strict";
  var sel = document.getElementById("book-sel");
  var page = document.getElementById("book-page");
  var q = document.getElementById("book-q");
  var prev = document.getElementById("book-prev");
  var next = document.getElementById("book-next");
  if (!sel || !page) return;
  var all = [];
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function render(p) {
    if (!p) { page.innerHTML = "<p>No page.</p>"; return; }
    var h = "<h3>" + esc(p.name) + "</h3><p><em>" + esc(p.tagline) + "</em> · " + esc(p.domain) + "</p>";
    (p.intro || []).forEach(function (t) { h += "<p>" + esc(t) + "</p>"; });
    if (p.how && p.how.length) {
      h += "<h4>Keys</h4><ul>" + p.how.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
    }
    if (p.cli && p.cli.length) {
      h += "<h4>Spells</h4><ul>" + p.cli.map(function (c) { return "<li><code>" + esc(c.cmd) + "</code> — " + esc(c.desc) + "</li>"; }).join("") + "</ul>";
    }
    if (p.runes && p.runes.length) {
      h += "<p>" + p.runes.map(function (r) { return "<span>" + esc(r.label) + "</span>"; }).join(" · ") + "</p>";
    }
    page.innerHTML = h;
    var hash = "#book/" + p.id;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }
  function fill(filter) {
    var f = (filter || "").toLowerCase();
    var list = all.filter(function (p) {
      return !f || p.id.includes(f) || p.name.toLowerCase().includes(f);
    });
    sel.innerHTML = list.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + "</option>"; }).join("");
    return list;
  }
  function current() {
    return all.find(function (p) { return p.id === sel.value; }) || null;
  }
  function step(d) {
    var opts = Array.prototype.map.call(sel.options, function (o) { return o.value; });
    var i = opts.indexOf(sel.value) + d;
    if (i < 0) i = opts.length - 1;
    if (i >= opts.length) i = 0;
    sel.value = opts[i] || "";
    render(current());
  }
  fetch("assets/scroll/scroll-pages.json").then(function (r) { return r.json(); }).then(function (data) {
    all = data;
    var fromHash = (location.hash.match(/^#book\/([\w-]+)/) || [])[1];
    fill("");
    if (fromHash && all.some(function (p) { return p.id === fromHash; })) sel.value = fromHash;
    else if (all.some(function (p) { return p.id === "pixie"; })) sel.value = "pixie";
    render(current());
    sel.addEventListener("change", function () { render(current()); });
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    q.addEventListener("input", function () {
      var keep = sel.value;
      var list = fill(q.value);
      if (list.some(function (p) { return p.id === keep; })) sel.value = keep;
      render(current());
    });
  }).catch(function () {
    page.innerHTML = "<p>Book offline — fetch failed. Read it in the terminal: <code>scroll</code>.</p>";
  });
})();
