// Hire request: POSTs straight to us (no sender mailbox needed). Mailto fallback.
(function () {
  "use strict";
  var dlg = document.getElementById("hire-dialog");
  var form = document.getElementById("hire-form");
  var sel = document.getElementById("hire-service");
  var title = document.getElementById("hire-title");
  if (!dlg || !form) return;
  document.querySelectorAll("[data-hire]").forEach(function (b) {
    b.addEventListener("click", function () {
      sel.value = b.getAttribute("data-hire");
      var shown = { teaser: "short", pmv: "pmv 18+", setup: "setup", fix: "fix" };
      title.textContent = "Request: " + (shown[sel.value] || sel.value);
      if (dlg.showModal) dlg.showModal();
    });
  });
  var close = document.getElementById("hire-close");
  if (close) close.addEventListener("click", function () { dlg.close(); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return (document.getElementById(id).value || "").trim(); };
    var service = sel.value, name = v("hire-name") || "anon";
    var date = new Date().toISOString().slice(0, 10);
    var subject = "hire: " + service + " | " + name + " | " + date;
    var data = { _subject: subject, _template: "table", _captcha: "false",
      service: service, name: v("hire-name"), contact: v("hire-contact"),
      links: v("hire-links"), deadline: v("hire-deadline"),
      budget: v("hire-budget"), what: v("hire-what") };
    fetch("https://formsubmit.co/ajax/evenweaker@disroot.org", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function () {
      dlg.close();
      title.textContent = "Sent — I reply in 48h or I pass.";
    }).catch(function () {
      var body = ["service: " + service, "name: " + v("hire-name"), "contact: " + v("hire-contact"),
        "links: " + v("hire-links"), "deadline: " + v("hire-deadline"),
        "budget: " + v("hire-budget"), "what: " + v("hire-what")].join("\n");
      location.href = "mailto:evenweaker@disroot.org?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  });
})();
