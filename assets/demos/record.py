#!/usr/bin/env python3
"""Headless TUI recorder: pty + pyte + PIL -> mp4. No display, no GL.
Usage: record.py --cols 100 --rows 30 --fps 10 --out take.mp4 --script demo.keys -- cmd...
Script lines: `<wait_secs> <text>`; escapes: \\t \\n \\x1b. Blank lines/comments (#) skipped.
"""
import argparse, codecs, fcntl, os, pty, select, struct, subprocess, sys, termios, time

sys.path.append(os.path.expanduser("~/.local/lib/python3.13/site-packages"))
import pyte
from PIL import Image, ImageDraw, ImageFont

PAL = [(0, 0, 0), (205, 0, 0), (0, 205, 0), (205, 205, 0), (0, 0, 238),
       (205, 0, 205), (0, 205, 205), (229, 229, 229)] + \
      [(127, 127, 127), (255, 0, 0), (0, 255, 0), (255, 255, 0), (92, 92, 255),
       (255, 0, 255), (0, 255, 255), (255, 255, 255)]
_cube = [0, 95, 135, 175, 215, 255]
for r in _cube:
    for g in _cube:
        for b in _cube:
            PAL.append((r, g, b))
for i in range(24):
    v = 8 + 10 * i
    PAL.append((v, v, v))
PAL = PAL[:256]


def _col(v, default):
    if not isinstance(v, str) or v == "default":
        return default
    v = v.strip().lower()
    if len(v) == 6 and all(c in "0123456789abcdef" for c in v):
        return (int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))
    if v.isdigit():
        try:
            return PAL[int(v)]
        except IndexError:
            return default
    return default


def fg_of(ch, default=(232, 228, 238)):
    return _col(ch.fg, default)


def bg_of(ch):
    return _col(ch.bg, (26, 18, 24))


def draw(screen, font, cw, chh):
    img = Image.new("RGB", (screen.columns * cw, screen.lines * chh), (26, 18, 24))
    d = ImageDraw.Draw(img)
    for y in range(screen.lines):
        for x in range(screen.columns):
            c = screen.buffer[y][x]
            d.rectangle([x * cw, y * chh, (x + 1) * cw - 1, (y + 1) * chh - 1],
                        fill=bg_of(c))
            if c.data not in ("", " "):
                col = fg_of(c)
                if c.bold and col in PAL[:8]:
                    col = PAL[PAL.index(col) + 8]
                d.text((x * cw, y * chh), c.data, font=font, fill=col)
    if not screen.cursor.hidden:
        cx, cy = screen.cursor.x, screen.cursor.y
        d.rectangle([cx * cw, cy * chh, (cx + 1) * cw - 1, (cy + 1) * chh - 1],
                    outline=(232, 160, 180))
    return img


def parse_script(path):
    steps = []
    for line in open(path):
        line = line.rstrip("\n")
        if not line.strip() or line.startswith("#"):
            continue
        wait, _, text = line.partition(" ")
        text = text.replace("\\t", "\t").replace("\\n", "\n").replace("\\x1b", "\x1b")
        steps.append((float(wait), text))
    return steps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cols", type=int, default=100)
    ap.add_argument("--rows", type=int, default=30)
    ap.add_argument("--fps", type=int, default=10)
    ap.add_argument("--out", required=True)
    ap.add_argument("--script", required=True)
    ap.add_argument("cmd", nargs="+")
    a = ap.parse_args()
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 22)
    cw, chh = 14, 27
    screen = pyte.Screen(a.cols, a.rows)
    stream = pyte.Stream(screen)
    steps = parse_script(a.script)
    pid, fd = pty.fork()
    # A fresh pty is 0x0 — set the size on BOTH ends; the child sets its
    # own slave side before exec so there is no startup race.
    winsz = struct.pack("HHHH", a.rows, a.cols, 0, 0)
    if pid == 0:
        fcntl.ioctl(0, termios.TIOCSWINSZ, winsz)
    else:
        fcntl.ioctl(fd, termios.TIOCSWINSZ, winsz)
    if pid == 0:
        os.execvpe(a.cmd[0], a.cmd,
                   {**os.environ, "TERM": "xterm-256color",
                    "PIXIE_UNICODE": "1", "CLICOLOR_FORCE": "1",
                    "COLUMNS": str(a.cols), "LINES": str(a.rows)})
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{a.cols * cw}x{a.rows * chh}", "-framerate", str(a.fps),
         "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", a.out],
        stdin=subprocess.PIPE)
    # Absolute fire times for keystrokes.
    fire = []
    t = 0.0
    for wait, _ in steps:
        t += wait
        fire.append(t)
    start = time.time()
    nxt = start
    interval = 1.0 / a.fps
    end = start + t + 5.0
    si = 0
    # Incremental decoder: pty reads can split multibyte UTF-8 mid-glyph.
    dec = codecs.getincrementaldecoder("utf-8")(errors="replace")
    try:
        while time.time() < end:
            now = time.time()
            while si < len(steps) and now - start >= fire[si]:
                os.write(fd, steps[si][1].encode())
                si += 1
            r, _, _ = select.select([fd], [], [], 0.02)
            if r:
                try:
                    data = os.read(fd, 65536)
                except OSError:
                    break
                if not data:
                    break
                if os.environ.get("RECORD_DUMP"):
                    with open(os.environ["RECORD_DUMP"], "ab") as f:
                        f.write(data)
                stream.feed(dec.decode(data))
            if now >= nxt:
                img = draw(screen, font, cw, chh)
                try:
                    ff.stdin.write(img.tobytes())
                except BrokenPipeError:
                    break
                nxt = now + interval
            try:
                done, _ = os.waitpid(pid, os.WNOHANG)
            except ChildProcessError:
                done = pid
            if done and si >= len(steps):
                time.sleep(0.5)
                img = draw(screen, font, cw, chh)
                try:
                    ff.stdin.write(img.tobytes())
                except BrokenPipeError:
                    pass
                break
    finally:
        try:
            ff.stdin.close()
        except Exception:
            pass
        ff.wait()
        try:
            os.close(fd)
        except Exception:
            pass
    print("wrote", a.out)


if __name__ == "__main__":
    main()
