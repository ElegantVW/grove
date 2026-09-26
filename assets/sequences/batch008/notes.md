# batch008 — pixie fit fix (2026-09-26, 21:40)
Cause: pixie hardcoded width=76 boxes + menagerie full model paths →
overflow on the narrow story rig (80 cols). Fix: box width now
min(76, term_width-1) (fit proven at 58 and 76 cols), menagerie prints
~/ paths and short ctx. Re-shot: title-first, fitted. Also caught a
transient :96 grab freeze (two stale frames) — recover by re-grabbing;
always pair get-text with a diff-grab. 9:16 portrait still clips the
right edge of long lines: that is the frame, not the app.
