"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (e) {
    console.error("FAIL " + name);
    console.error(e && e.stack ? e.stack : e);
    process.exitCode = 1;
  }
}

global.GROVE_CODEX_NOAUTO = true;
const src = fs.readFileSync(path.join(__dirname, "../assets/codex.js"), "utf8");
eval(src);
const C = global.GroveCodex;

check("D5 bullets empty and star", function () {
  assert.deepStrictEqual(C.bullets("hello\nworld", 6), []);
  assert.deepStrictEqual(C.bullets("- one\n* two\nnope", 6), ["one", "two"]);
});
check("D6 md links", function () {
  const h = C.mdInline("see [helper](https://github.com/ElegantVW/pixie)");
  assert.ok(h.indexOf('<a href="https://github.com/ElegantVW/pixie">helper</a>') >= 0);
});
check("D7 asOf missing", function () {
  assert.strictEqual(C.asOf(""), "");
  assert.strictEqual(C.asOf("2026-10-31T00:32:53Z"), "2026-10-31");
});
check("D10 old date still paints", function () {
  assert.strictEqual(C.asOf("2020-01-02T00:00:00Z"), "2020-01-02");
});

function fakeEls() {
  function el() {
    return { innerHTML: "", hidden: true, textContent: "", children: [], appendChild: function (c) { this.children.push(c); } };
  }
  return { nowEl: el(), lateEl: el(), asEl: el() };
}

function fetchMap(map) {
  return function (url) {
    return new Promise(function (resolve, reject) {
      var key = url.split("/").pop();
      if (map[url]) key = url;
      var hit = map[url] || map[key];
      if (hit === undefined) return reject(new Error("miss " + url));
      if (hit === "fail") return resolve({ ok: false, text: function () { return Promise.resolve(""); } });
      resolve({ ok: true, text: function () { return Promise.resolve(hit); } });
    });
  };
}

function withDom(fn) {
  global.document = {
    createElement: function () {
      return { innerHTML: "" };
    },
    getElementById: function () {
      return null;
    }
  };
  return Promise.resolve(fn()).finally(function () {
    delete global.document;
  });
}

async function runCase(name, map, bases, pred) {
  await withDom(async function () {
    const els = fakeEls();
    // fillList uses document.createElement
    global.document = global.document || {
      createElement: function () { return { innerHTML: "" }; },
      getElementById: function () { return null; }
    };
    await C.run({ fetch: fetchMap(map), bases: bases, els: els });
    pred(els);
    console.log("ok  " + name);
  });
}

(async function () {
  const now = "# Now\n\n- **Pixie** — local familiar\n- **Grove** — the door\n";
  const late = "# Lately\n\n- **pixie** — 0.3.15 · [helper](https://github.com/ElegantVW/pixie)\n";
  const feed = JSON.stringify({ generated: "2026-10-31T00:32:53Z" });
  const bases = ["https://raw.example/", "https://cdn.example/"];

  try {
    await runCase("D1 all ok", {
      "NOW.md": now, "LATELY.md": late, "feed.json": feed
    }, ["https://raw.example/"], function (els) {
      assert.strictEqual(els.nowEl.hidden, false);
      assert.strictEqual(els.lateEl.hidden, false);
      assert.ok(els.asEl.textContent.indexOf("2026-10-31") >= 0);
      assert.strictEqual(els.asEl.hidden, false);
    });
  } catch (e) { console.error("FAIL D1", e); process.exitCode = 1; }

  try {
    await runCase("D2 NOW fails", {
      "LATELY.md": late, "feed.json": feed
    }, ["https://raw.example/"], function (els) {
      assert.strictEqual(els.lateEl.hidden, false);
      assert.ok(els.asEl.textContent.indexOf("2026-10-31") >= 0);
      assert.strictEqual(els.nowEl.hidden, true);
    });
  } catch (e) { console.error("FAIL D2", e); process.exitCode = 1; }

  try {
    await runCase("D3 LATELY fails", {
      "NOW.md": now, "feed.json": feed
    }, ["https://raw.example/"], function (els) {
      assert.strictEqual(els.nowEl.hidden, false);
      assert.ok(els.asEl.textContent.indexOf("2026-10-31") >= 0);
    });
  } catch (e) { console.error("FAIL D3", e); process.exitCode = 1; }

  try {
    await runCase("D4 both fail", {}, ["https://raw.example/", "https://cdn.example/"], function (els) {
      assert.ok(els.asEl.textContent.toLowerCase().indexOf("quiet") >= 0);
      assert.strictEqual(els.asEl.hidden, false);
    });
  } catch (e) { console.error("FAIL D4", e); process.exitCode = 1; }

  try {
    await runCase("D8 unhide on success", {
      "NOW.md": now, "LATELY.md": late, "feed.json": feed
    }, ["https://raw.example/"], function (els) {
      assert.strictEqual(els.nowEl.hidden, false);
      assert.strictEqual(els.lateEl.hidden, false);
    });
  } catch (e) { console.error("FAIL D8", e); process.exitCode = 1; }
})();
