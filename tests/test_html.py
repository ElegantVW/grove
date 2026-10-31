#!/usr/bin/env python3
"""Grove static-page contracts. No network."""
from __future__ import annotations

import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAY_NEEDLES = ("stripe.com", "buy.stripe", "liberapay")
PAGES = [
    ROOT / "index.html",
    ROOT / "resume.html",
    ROOT / "glade.html",
    ROOT / "404.html",
    ROOT / "README.md",
]


def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8")


class APaymentGone(unittest.TestCase):
    def test_a1_a2_no_payment_hosts(self):
        for p in PAGES:
            t = read(p).lower()
            for n in PAY_NEEDLES:
                self.assertNotIn(n, t, f"{p.name} still has {n}")

    def test_a3_no_pay_euro(self):
        for p in PAGES:
            self.assertNotIn("Pay €", read(p), f"{p.name} still says Pay €")

    def test_a4_pay_class_gone_from_index(self):
        t = read(ROOT / "index.html")
        self.assertNotRegex(t, r'class="pay"')
        css = read(ROOT / "style.css")
        self.assertNotIn(".pay {", css)
        self.assertNotIn(".pay:", css)


class BRequestVisible(unittest.TestCase):
    def test_b1_splash_request(self):
        t = read(ROOT / "index.html")
        head = t.split("<nav", 1)[0]
        self.assertIn("Request work", head)

    def test_b2_nav_request(self):
        t = read(ROOT / "index.html")
        nav = t.split("<nav", 1)[1].split("</nav>", 1)[0]
        self.assertIn("Request", nav)

    def test_b3_each_service_has_request(self):
        t = read(ROOT / "index.html")
        for svc in ("teaser", "pmv", "setup", "fix", "sponsor"):
            self.assertRegex(
                t,
                rf'data-hire="{svc}"',
                f"missing data-hire={svc}",
            )
        self.assertGreaterEqual(t.count('class="request"'), 5)

    def test_b4_request_font_size(self):
        css = read(ROOT / "style.css")
        m = re.search(r"\.request\s*\{([^}]+)\}", css)
        self.assertTrue(m, ".request rule missing")
        body = m.group(1)
        size = re.search(r"font-size:\s*([0-9.]+)rem", body)
        self.assertTrue(size, "font-size rem missing")
        self.assertGreaterEqual(float(size.group(1)), 1.1)
        pad = re.search(r"padding:\s*([0-9.]+)rem\s+([0-9.]+)rem", body)
        self.assertTrue(pad, "padding missing")
        self.assertGreaterEqual(float(pad.group(1)), 0.7)
        self.assertGreaterEqual(float(pad.group(2)), 1.4)

    def test_b5_send_request_not_compose_mail(self):
        t = read(ROOT / "index.html")
        self.assertIn("Send request", t)
        self.assertNotIn("Compose mail", t)


class EBranding(unittest.TestCase):
    def test_e1_footer_does_not_require_faeos(self):
        t = read(ROOT / "index.html")
        foot = t.split("<footer", 1)[1]
        self.assertNotIn("faeOS", foot)

    def test_e2_setup_mentions_grove(self):
        t = read(ROOT / "index.html")
        self.assertIn("Grove kit", t)

    def test_e3_install_still_clones_faeos_repo(self):
        t = read(ROOT / "index.html")
        self.assertIn("ElegantVW/faeOS", t)

    def test_e4_does_not_claim_repo_already_renamed(self):
        t = read(ROOT / "index.html").lower()
        self.assertNotIn("github.com/elegantvw/grove-kit", t)


class FPages(unittest.TestCase):
    def test_f1_scripts_linked(self):
        t = read(ROOT / "index.html")
        self.assertIn("assets/codex.js", t)
        self.assertIn("assets/hire.js", t)

    def test_f2_dialog(self):
        t = read(ROOT / "index.html")
        self.assertIn('id="hire-dialog"', t)
        self.assertIn('id="hire-what"', t)
        self.assertIn('maxlength="500"', t)
        self.assertIn('id="hire-contact"', t)
        self.assertIn("required", t)

    def test_f3_no_new_payment_hosts(self):
        blob = "\n".join(read(p) for p in PAGES)
        blob += read(ROOT / "assets/hire.js")
        blob += read(ROOT / "assets/codex.js")
        low = blob.lower()
        for n in ("paypal", "buymeacoffee", "ko-fi", "patreon.com"):
            self.assertNotIn(n, low)

    def test_css_cache_bust(self):
        t = read(ROOT / "index.html")
        self.assertIn("style.css?v=20", t)


if __name__ == "__main__":
    unittest.main()
