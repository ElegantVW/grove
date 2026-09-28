#!/usr/bin/env python3
"""batch009 — 3.5s story clips, descriptive one-liners, richer VFX.
Reads grove/assets/story/<app>.svg, swaps the tagline (font-size=38),
renders PNG via rsvg-convert, then ffmpeg: slow push +dual glitch slices
+burst lifts +vignette +fades. 1080x1920, 30fps, 3.5s, yuv420p.
"""
import re, subprocess, pathlib
from xml.sax.saxutils import escape

STORY = pathlib.Path("/home/evenweaker/grove/assets/story")
OUT = pathlib.Path("/home/evenweaker/grove/assets/sequences/batch009")
OUT.mkdir(parents=True, exist_ok=True)

PHRASES = {
    "bulwark": "host firewall + glass screen lock",
    "faeos": "pink offline-first terminal",
    "fairy": "GBA emulator from scratch",
    "goblin": "TLS mail in your terminal",
    "grove": "front door of the offline house",
    "imp": "terminal art from a wish",
    "kindling": "x86_64 kernel we write",
    "kur": "answers only in haiku",
    "mourama": "Iberian hillfort strategy game",
    "pixie": "offline AI agent on your machine",
    "siren": "local music + speaker player",
}

TAGLINE_RE = re.compile(r'(<text[^>]*font-size="38"[^>]*>)(.*?)(</text>)')

for app, phrase in PHRASES.items():
    src = STORY / f"{app}.svg"
    svg = src.read_text()
    new_svg, n = TAGLINE_RE.subn(lambda m: m.group(1) + escape(phrase) + m.group(3), svg, count=1)
    assert n == 1, f"tagline not found in {src}"
    out_svg = OUT / f"b9-{app}.svg"
    out_svg.write_text(new_svg)
    png = OUT / f"b9-{app}.png"
    subprocess.run(["rsvg-convert", "-w", "1080", "-h", "1920", "-o", str(png), str(out_svg)], check=True)
    mp4 = OUT / f"b9-{app}-3p5s.mp4"
    if mp4.exists() and mp4.stat().st_size > 50000:
        print(f"SKIP {app}: exists ({mp4.stat().st_size//1024} kB)")
        continue
    vf = (
        "zoompan=z='1+0.06*on/105':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=105:s=1080x1920:fps=30,"
        "rgbashift=rh=8:bh=-8:gh=0:enable='between(t,1.1,1.25)+between(t,2.4,2.55)',"
        "noise=alls=6:allf=t:enable='between(t,1.1,1.25)+between(t,2.4,2.55)',"
        "eq=brightness=0.12:enable='between(t,0.5,0.65)+between(t,2.9,3.05)',"
        "vignette=PI/4,"
        "fade=t=in:st=0:d=0.4,fade=t=out:st=3.1:d=0.4,"
        "format=yuv420p"
    )
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-i", str(png),
        "-vf", vf, "-frames:v", "105", "-r", "30", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
        "-movflags", "+faststart", str(mp4),
    ], check=True)
    print(f"OK {app}: {mp4.name} ({mp4.stat().st_size//1024} kB) phrase={phrase!r}")
print("batch009 complete:", len(PHRASES), "clips")
