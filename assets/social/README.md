# Social exports (free, local)

Source: `../clips-new/*.mp4` + `../../shots-new/*.png` (live takes, tiny files).
Target: 1080x1920 vertical, silent (avoid copyright strikes) or your own Siren track.

```bash
# 1. clip → vertical 1080x1920, pad with house night color
ffmpeg -i ../clips-new/pixie.mp4 -vf "scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#1A1218" -an -c:v libx264 -crf 23 pixie-1080x1920.mp4

# 2. screenshot → 7s still for carousels
ffmpeg -loop 1 -i ../../shots-new/menagerie.png -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -t 7 -c:v libx264 -crf 23 menagerie-1080x1920.mp4
```

Rules: the public studio lives here and on `@elegantvideoworlds` — numbered
Worlds shorts, all-ages. Custom PMV (18+) is a separate hire, off-site.
No telemetry, no watermarks.
