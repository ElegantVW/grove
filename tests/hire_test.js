"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "../assets/hire.js"), "utf8");
eval(src);
const H = global.GroveHire;
const date = "2026-10-31";

function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (e) {
    console.error("FAIL " + name);
    console.error(e);
    process.exitCode = 1;
  }
}

check("C1 subject teaser Ada", function () {
  assert.strictEqual(H.subject("teaser", "Ada", date), "hire: teaser | Ada | 2026-10-31");
});
check("C2 empty name is anon", function () {
  assert.strictEqual(H.subject("fix", "  ", date), "hire: fix | anon | 2026-10-31");
  assert.strictEqual(H.subject("fix", "", date), "hire: fix | anon | 2026-10-31");
});
check("C3 services", function () {
  ["pmv", "setup", "fix", "sponsor"].forEach(function (s) {
    assert.ok(H.subject(s, "Ada", date).indexOf("hire: " + s + " |") === 0);
  });
});
check("C4 payload keys", function () {
  const p = H.payload({
    service: "setup",
    name: "Ada",
    contact: "a@b.c",
    links: "repo",
    deadline: "soon",
    budget: "88",
    what: "arch box"
  }, date);
  ["_subject", "service", "name", "contact", "links", "deadline", "budget", "what"].forEach(function (k) {
    assert.ok(k in p, k);
  });
  assert.strictEqual(p._subject, "hire: setup | Ada | 2026-10-31");
});
check("C5 mailto encodes subject and what", function () {
  const href = H.mailtoUrl({
    service: "teaser",
    name: "Ada",
    contact: "a@b.c",
    what: "a short from clips"
  }, date);
  assert.ok(href.indexOf("mailto:evenweaker@disroot.org?") === 0);
  assert.ok(href.indexOf("subject=") > 0);
  assert.ok(decodeURIComponent(href).indexOf("what: a short from clips") >= 0);
  assert.ok(decodeURIComponent(href).indexOf("hire: teaser | Ada | 2026-10-31") >= 0);
});
check("C9 no stripe in hire.js", function () {
  assert.ok(src.toLowerCase().indexOf("stripe") < 0);
});
