#!/usr/bin/env python3
"""Run Grove static + JS fixture tests."""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> int:
    loader = unittest.TestLoader()
    suite = loader.discover(str(HERE), pattern="test_*.py")
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    code = 0 if result.wasSuccessful() else 1
    for js in ("hire_test.js", "codex_test.js"):
        print("---", js)
        r = subprocess.run(["node", str(HERE / js)], cwd=str(HERE.parent))
        if r.returncode != 0:
            code = 1
    return code


if __name__ == "__main__":
    sys.exit(main())
