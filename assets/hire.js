// Hire request: FormSubmit ajax, mailto fallback. No payment URLs.
(function (root) {
  "use strict";

  function todayISO(d) {
    d = d || new Date();
    return d.toISOString().slice(0, 10);
  }

  function subject(service, name, date) {
    var n = (name || "").trim() || "anon";
    var day = date || todayISO();
    return "hire: " + service + " | " + n + " | " + day;
  }

  function fieldsFrom(v) {
    return {
      service: v.service,
      name: v.name || "",
      contact: v.contact || "",
      links: v.links || "",
      deadline: v.deadline || "",
      budget: v.budget || "",
      what: v.what || ""
    };
  }

  function payload(v, date) {
    var f = fieldsFrom(v);
    var sub = subject(f.service, f.name, date);
    return {
      _subject: sub,
      _template: "table",
      _captcha: "false",
      service: f.service,
      name: f.name,
      contact: f.contact,
      links: f.links,
      deadline: f.deadline,
      budget: f.budget,
      what: f.what
    };
  }

  function bodyText(v) {
    var f = fieldsFrom(v);
    return [
      "service: " + f.service,
      "name: " + f.name,
      "contact: " + f.contact,
      "links: " + f.links,
      "deadline: " + f.deadline,
      "budget: " + f.budget,
      "what: " + f.what
    ].join("\n");
  }

  function mailtoUrl(v, date) {
    var f = fieldsFrom(v);
    var sub = subject(f.service, f.name, date);
    return "mailto:evenweaker@disroot.org?subject=" +
      encodeURIComponent(sub) + "&body=" + encodeURIComponent(bodyText(f));
  }

  var GroveHire = {
    subject: subject,
    payload: payload,
    bodyText: bodyText,
    mailtoUrl: mailtoUrl,
    todayISO: todayISO
  };
  root.GroveHire = GroveHire;
  if (typeof document === "undefined") return;

  var dlg = document.getElementById("hire-dialog");
  var form = document.getElementById("hire-form");
  var sel = document.getElementById("hire-service");
  var title = document.getElementById("hire-title");
  var note = document.getElementById("hire-note");
  if (!dlg || !form || typeof document.querySelectorAll !== "function") return;

  var shown = {
    teaser: "short",
    pmv: "pmv 18+",
    setup: "setup",
    fix: "fix",
    sponsor: "sponsor"
  };

  function setTitle(service) {
    title.textContent = "Request work: " + (shown[service] || service);
  }

  document.querySelectorAll("[data-hire]").forEach(function (b) {
    b.addEventListener("click", function (ev) {
      ev.preventDefault();
      sel.value = b.getAttribute("data-hire");
      setTitle(sel.value);
      if (note) note.textContent = "";
      if (dlg.showModal) dlg.showModal();
    });
  });
  var close = document.getElementById("hire-close");
  if (close) close.addEventListener("click", function () { dlg.close(); });

  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || "").trim() : "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = {
      service: sel.value,
      name: val("hire-name"),
      contact: val("hire-contact"),
      links: val("hire-links"),
      deadline: val("hire-deadline"),
      budget: val("hire-budget"),
      what: val("hire-what")
    };
    var data = GroveHire.payload(v);
    fetch("https://formsubmit.co/ajax/evenweaker@disroot.org", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error("relay");
      if (note) {
        note.textContent = "Sent — I reply in 48h or I pass. If this is the first request, check that FormSubmit confirm mail.";
      }
      title.textContent = "Request sent";
    }).catch(function () {
      var href = GroveHire.mailtoUrl(v);
      if (note) {
        note.innerHTML = 'Relay quiet. <a href="' + href + '">Open a mail draft instead</a>.';
      }
    });
  });
})(typeof window !== "undefined" ? window : global);
