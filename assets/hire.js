// Hire request dialog: builds a rigid mailto so Goblin can filter it.
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
      title.textContent = "Request: " + sel.value;
      if (dlg.showModal) dlg.showModal();
    });
  });
  var close = document.getElementById("hire-close");
  if (close) close.addEventListener("click", function () { dlg.close(); });
  form.addEventListener("submit", function () {
    var v = function (id) { return (document.getElementById(id).value || "").trim(); };
    var service = sel.value, name = v("hire-name");
    var date = new Date().toISOString().slice(0, 10);
    var subject = "hire: " + service + " | " + name + " | " + date;
    var body = ["service: " + service, "name: " + name, "contact: " + v("hire-contact"),
      "links: " + v("hire-links"), "deadline: " + v("hire-deadline"),
      "budget: " + v("hire-budget"), "what: " + v("hire-what")].join("\n");
    location.href = "mailto:evenweaker@disroot.org?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
})();
