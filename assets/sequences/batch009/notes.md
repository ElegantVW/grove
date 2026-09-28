# batch009 — 3.5s descriptive story clips (2026-09-28)

Second shelf next to the 3s glitter-glitch set in `assets/story/`.
Same 1080x1920 canvas + house palette (`#1A1218`, sigil pastel, `#F0E4EE`
name, `#6B6FA8` tagline), new taglines that say what the app IS —
one phrase each. 3.5s @30fps, yuv420p, faststart.

## Phrases (old → new)

| app | old (vague) | new (says what it is) |
|---|---|---|
| bulwark | does not lie | host firewall + glass screen lock |
| faeos | pink offline-first house | pink offline-first terminal |
| fairy | pockets? (was V1) | GBA emulator from scratch |
| goblin | ask him / no aerc | TLS mail in your terminal |
| grove | the pink offline-first house | front door of the offline house |
| imp | a red port, sealed | terminal art from a wish |
| kindling | you light kindling | x86_64 kernel we write |
| kur | haiku dragon, hatched | answers only in haiku |
| mourama | five seats | Iberian hillfort strategy game |
| pixie | local agent | offline AI agent on your machine |
| siren | never blasts | local music + speaker player |

## VFX (old: zoom, twinkle, bursts, slice glitch)

Kept all four, plus: dual RGB-split slice windows (1.1–1.25s,
2.4–2.55s) with matched film grain, brightness burst lifts
(0.5–0.65s, 2.9–3.05s), full-frame vignette, 0.4s fade in/out.
Slow 6% push over 105 frames.

## Build

`make-batch009.py` — swaps the font-size=38 tagline in
`assets/story/<app>.svg`, renders `b9-<app>.png` via rsvg-convert,
encodes `b9-<app>-3p5s.mp4` via ffmpeg. Re-run skips clips that
exist and exceed 50 kB.

## Coverage note (footage without a home) — update 2026-09-28

scroll HAS a repo now: `ElegantVW/scroll` (living book + PATH leaf 📜),
cut 2026-09-28 with story card + 3.5s clip in this batch
(`b9-scroll.svg/.png/-3p5s.mp4`, story card mirrored to
`assets/story/scroll.svg/.png`). faeOS keeps only a thin launcher.

Still repo-less: tv (`faeOS/bin/tv` — CRT shader toggle 📺, proposed
“CRT shader for the terminal”, not yet cut). seal/glass stays housed in
bulwark by design (same repo, separate privilege/state/units).
