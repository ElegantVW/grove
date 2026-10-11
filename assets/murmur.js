// Murmur web toy: same word-pools as the terminal glass, session-only.
// Real oracle lives in faeOS (`murmur`): persistence, egg flags, TUI.
(function () {
  "use strict";
  var log = document.getElementById("murmur-log");
  var form = document.getElementById("murmur-form");
  var input = document.getElementById("murmur-in");
  var title = document.getElementById("murmur-title");
  if (!log || !form) return;
  var S = { mood: "fog", act: 0, heard: {}, turns: 0, meaningful: 0, fogStreak: 0, lastReply: "", lastKeys: [], recent: [], phraseCd: {}, bond: 0 };
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function toks(t) { return (t.toLowerCase().match(/[a-z0-9']+/g) || []); }
  function gib(rng_n) {
    var o = [], d = D.syl;
    for (var i = 0; i < Math.max(3, rng_n); i++) o.push(pick(d));
    return o.join(" ");
  }
  function say(who, text) {
    var p = document.createElement("p");
    p.innerHTML = "<strong>" + (who === "you" ? "▸ you" : "✦ glass") + ":</strong> " + esc(text);
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }
  function moodLine() { /* keep the card h3; mood stays internal */ }
  function isSilence(t) {
    if (!t.trim()) return true;
    if (!toks(t).length && /^[?.!…·. ]*$/.test(t)) return true;
    return ["...", "…", "?", "??", "???", ".", ".."].includes(t.trim());
  }
  function isMeta(t) {
    var low = t.toLowerCase();
    if (D.meta_phrases.some(function (p) { return low.includes(p); })) return true;
    var ts = new Set(toks(t));
    if ([...ts].every(function (w) { return ["how", "are", "you", "ya"].includes(w); }) && ts.size) return false;
    return [...ts].some(function (w) { return D.meta_keys.includes(w); });
  }
  function matchKeys(t) {
    var tk = toks(t), low = tk.join(" "), found = [];
    Object.keys(D.oracles).forEach(function (k) { if (k.includes(" ") && low.includes(k)) found.push(k); });
    tk.forEach(function (w) { if (D.oracles[w] && !found.includes(w)) found.push(w); });
    return found;
  }
  function shard(key) {
    var pool = D.oracles[key] || [];
    if (!pool.length) return gib(3);
    var fresh = pool.filter(function (x) { return !S.heard[x]; });
    return pick(fresh.length ? fresh : pool);
  }
  function reply(raw) {
    var t = raw.trim();
    Object.keys(S.phraseCd).forEach(function (k) { if (--S.phraseCd[k] <= 0) delete S.phraseCd[k]; });
    if (!t || isSilence(t)) {
      S.fogStreak++; S.turns++;
      var l = pick(D.silence_react);
      return Math.random() < 0.5 ? [l, gib(4 + ((Math.random() * 6) | 0))] : [l];
    }
    if (isMeta(t)) {
      S.turns++; S.bond = Math.max(0, S.bond - 1);
      var m = pick(D.refusal);
      return Math.random() < 0.45 ? [m] : [m, gib(4 + ((Math.random() * 5) | 0))];
    }
    var hits = matchKeys(t);
    var keyset = [...new Set(hits)].sort().join(",");
    var repeat = hits.length && keyset === S.lastKeys.join(",") && S.turns > 0;
    if (!hits.length) {
      S.fogStreak++;
      if (S.fogStreak >= 3) S.mood = "fog"; else if (S.mood === "bright") S.mood = "stir";
      S.turns++;
      var base = 8 + Math.min(18, S.fogStreak * 2);
      return [gib(base)];
    }
    S.fogStreak = 0; S.meaningful++;
    var eggish = hits.some(function (h) { return ["egg", "hatch", "warm", "menagerie", "pen"].includes(h); });
    if (hits.length >= 2 || eggish || S.act >= 2) S.mood = "bright";
    else if (S.mood === "fog") S.mood = "stir";
    else if (S.mood === "stir") S.mood = "bright";
    if (S.meaningful >= 12) S.act = 2; else if (S.meaningful >= 5) S.act = 1;
    var shards = hits.map(shard);
    shards.forEach(function (s) { s.split(" ").forEach(function (w) { S.heard[w] = 1; }); });
    var trail = new Set(S.recent.slice(-6).concat(hits));
    for (var i = 0; i < D.threads.length; i++) {
      var need = D.threads[i][0];
      if (need.every(function (k) { return trail.has(k); }) && Math.random() < 0.55 && (S.mood === "stir" || S.mood === "bright") && Math.random() < 0.5) {
        var cand = pick(D.threads[i][1]);
        if (!S.phraseCd[cand]) { S.phraseCd[cand] = 6; S.turns++; S.bond = Math.min(100, S.bond + 1); hits.forEach(function (h) { S.heard[h] = 1; S.recent.push(h); }); S.recent = S.recent.slice(-12); return [cand]; }
      }
    }
    var out;
    if (repeat) out = [pick(D.tired) + "  ·  " + gib(3 + ((Math.random() * 6) | 0))];
    else if (S.mood === "fog" || (S.mood === "stir" && Math.random() < 0.35)) {
      var s = pick(shards), f = gib(4 + ((Math.random() * 7) | 0));
      out = [Math.random() < 0.5 ? f + "  ·  " + s : s + "  ·  " + f];
    } else if (S.mood === "stir") out = [pick(shards)];
    else {
      var free = D.phrases.filter(function (x) { return !S.phraseCd[x]; });
      if (free.length && Math.random() < 0.42) { var ph = pick(free); S.phraseCd[ph] = 5; out = [ph]; }
      else out = [pick(shards)];
    }
    S.lastKeys = [...new Set(hits)];
    S.turns++; S.bond = Math.min(100, S.bond + 1);
    hits.forEach(function (h) { S.heard[h] = 1; S.recent.push(h); });
    S.recent = S.recent.slice(-12);
    return out;
  }
  var D = null;
  fetch("assets/murmur/murmur-data.json").then(function (r) { return r.json(); }).then(function (data) {
    D = data;
    say("glass", pick(D.greet));
    moodLine();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value;
      if (!v.trim()) { reply(""); }
      say("you", v || "…");
      reply(v).forEach(function (l) { say("glass", l); });
      input.value = "";
      moodLine();
    });
  }).catch(function () {
    log.innerHTML = "<p>Glass offline — try in the terminal: <code>murmur</code>.</p>";
  });
})();
