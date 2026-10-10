// The clearing — original Grove air. GBA-shaped voices, not a game tune.
// G mixolydian, 112 BPM, 32-bar loop. Off until the hush/air button asks.
(function (root) {
  "use strict";

  var BPM = 112;
  var LOOP = 32 * 16; // 16ths
  var LOOK = 0.12;
  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  var ctx = null;
  var master = null;
  var pulse25 = null;
  var pulse50 = null;
  var waveTable = null;
  var noiseBuf = null;
  var wantAir = false;
  var origin = 0;
  var cursor = 0;
  var timer = null;
  var live = [];
  var events = [];

  function hz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function parseTok(tok) {
    if (tok.charAt(0) === ".") {
      var rest = tok.indexOf(":") >= 0 ? +tok.split(":")[1] : tok.length > 1 ? +tok.slice(1) : 4;
      return { rest: true, len: rest };
    }
    var m = tok.match(/^([A-G])(#|b)?(\d+):(\d+)$/);
    if (!m) throw new Error("clearing: bad token " + tok);
    var acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
    var midi = (parseInt(m[3], 10) + 1) * 12 + PC[m[1]] + acc;
    return { rest: false, midi: midi, len: +m[4] };
  }

  function lay(ch, bars, vol) {
    var step = 0;
    for (var b = 0; b < bars.length; b++) {
      var toks = bars[b].trim().split(/\s+/);
      var used = 0;
      for (var i = 0; i < toks.length; i++) {
        var n = parseTok(toks[i]);
        if (!n.rest) {
          if (!events[step]) events[step] = [];
          events[step].push({ ch: ch, midi: n.midi, len: n.len, vol: vol });
        }
        step += n.len;
        used += n.len;
      }
      if (used !== 16) throw new Error("clearing: bar " + b + " ch " + ch + " is " + used);
    }
  }

  function crunch(bar, sixteenth, vol) {
    var step = bar * 16 + sixteenth;
    if (!events[step]) events[step] = [];
    events[step].push({ ch: 4, midi: 0, len: 2, vol: vol });
  }

  // Pulse 1 — path. Opening G A B D, not Pallet Town.
  lay(1, [
    "G4:4 A4:4 B4:4 D5:4",
    "E5:6 D5:2 B4:4 A4:4",
    "G4:4 B4:4 D5:8",
    "C5:4 B4:4 A4:8",
    "D5:4 E5:4 G5:4 E5:4",
    "D5:4 B4:4 A4:4 G4:4",
    "A4:4 B4:4 D5:4 E5:4",
    "D5:4 C5:4 B4:4 A4:4",
    "G5:4 D5:4 B4:4 G4:4",
    "A5:4 E5:4 C5:4 A4:4",
    "B5:4 G5:4 D5:8",
    "A5:4 G5:4 E5:4 D5:4",
    "G5:4 A5:4 B5:4 D6:4",
    "E5:4 D5:4 B4:4 A4:4",
    "G4:4 A4:4 B4:4 D5:4",
    "E5:4 D5:4 C5:2 B4:2 A4:4",
    "D5:4 F5:4 G5:4 A5:4",
    "G5:6 E5:2 D5:4 B4:4",
    "C5:4 D5:4 E5:4 G5:4",
    "F5:4 E5:4 D5:4 C5:4",
    "B4:4 D5:4 G5:4 B5:4",
    "A5:4 G5:4 E5:4 D5:4",
    "C5:4 E5:4 G5:4 F5:4",
    "E5:4 D5:4 B4:4 A4:4",
    "G4:4 A4:4 B4:4 D5:4",
    "E5:6 D5:2 B4:4 A4:4",
    "G4:4 B4:4 D5:8",
    "C5:4 B4:4 A4:8",
    "D5:4 E5:4 G5:4 E5:4",
    "D5:4 B4:4 A4:4 G4:4",
    "A4:4 B4:4 D5:4 E5:4",
    "D5:4 B4:4 G4:8"
  ], 11);

  // Pulse 2 — thirds under the path; B section is marimba plucks.
  lay(2, [
    "B3:8 D4:8",
    "E3:8 C4:8",
    "B3:8 D4:8",
    "A3:8 C4:8",
    "D4:8 G3:8",
    "B3:8 D4:8",
    "C4:8 E4:8",
    "D4:8 C4:8",
    "D4:8 G3:8",
    "E4:8 A3:8",
    "D4:8 G3:8",
    "C4:8 E4:8",
    "D4:8 G4:8",
    "B3:8 D4:8",
    "B3:8 D4:8",
    "C4:8 B3:8",
    "G4:2 .:2 D5:2 .:2 A4:2 .:2 D5:2 .:2",
    "G4:2 .:2 E5:2 .:2 B4:2 .:2 D5:2 .:2",
    "A4:2 .:2 E5:2 .:2 C5:2 .:2 G4:2 .:2",
    "F4:2 .:2 D5:2 .:2 A4:2 .:2 C5:2 .:2",
    "G4:2 .:2 D5:2 .:2 B4:2 .:2 G5:2 .:2",
    "A4:2 .:2 G4:2 .:2 E4:2 .:2 D5:2 .:2",
    "C5:2 .:2 E4:2 .:2 G4:2 .:2 F4:2 .:2",
    "E4:2 .:2 D4:2 .:2 B3:2 .:2 A3:2 .:2",
    "B3:8 D4:8",
    "E3:8 C4:8",
    "B3:8 D4:8",
    "A3:8 C4:8",
    "D4:8 G3:8",
    "B3:8 D4:8",
    "C4:8 E4:8",
    "D4:8 B3:8"
  ], 6);

  // Wave — walking bass. Mixolydian F in the turnarounds.
  lay(3, [
    "G2:8 D3:8",
    "G2:8 F2:8",
    "G2:8 D3:8",
    "C3:8 D3:8",
    "G2:8 D3:8",
    "G2:8 F2:8",
    "E2:8 C3:8",
    "D3:8 G2:8",
    "G2:8 D3:8",
    "A2:8 E2:8",
    "G2:8 D3:8",
    "C3:8 E2:8",
    "G2:8 D3:8",
    "G2:8 F2:8",
    "E2:8 C3:8",
    "D3:8 G2:8",
    "G2:8 F2:8",
    "E2:8 D3:8",
    "C3:8 G2:8",
    "F2:8 C3:8",
    "G2:8 D3:8",
    "A2:8 E2:8",
    "C3:8 G2:8",
    "F2:8 D3:8",
    "G2:8 D3:8",
    "G2:8 F2:8",
    "G2:8 D3:8",
    "C3:8 D3:8",
    "G2:8 D3:8",
    "G2:8 F2:8",
    "E2:8 C3:8",
    "D3:4 G2:12"
  ], 9);

  crunch(19, 12, 3);
  crunch(23, 12, 3);

  function pulseWave(duty) {
    var n = 32;
    var real = new Float32Array(n);
    var imag = new Float32Array(n);
    for (var k = 1; k < n; k++) {
      imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    }
    return ctx.createPeriodicWave(real, imag);
  }

  function makeWaveTable() {
    var n = 32;
    var real = new Float32Array(n);
    var imag = new Float32Array(n);
    // Soft triangle / organ — FFTA-ish wave RAM, not a saw.
    for (var k = 1; k < n; k += 2) {
      imag[k] = (k % 4 === 1 ? 1 : -1) / (k * k);
    }
    return ctx.createPeriodicWave(real, imag);
  }

  function makeNoise() {
    var len = ctx.sampleRate;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var reg = 0x7fff;
    for (var i = 0; i < len; i++) {
      var bit = (reg ^ (reg >> 1)) & 1;
      reg = (reg >> 1) | (bit << 14);
      d[i] = bit ? 0.12 : -0.12;
    }
    return buf;
  }

  function ensure() {
    if (ctx) return;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    var coarse = root.matchMedia && root.matchMedia("(pointer: coarse)").matches;
    master.gain.value = coarse ? 0.055 : 0.09;
    master.connect(ctx.destination);
    pulse25 = pulseWave(0.25);
    pulse50 = pulseWave(0.5);
    waveTable = makeWaveTable();
    noiseBuf = makeNoise();
  }

  function cut() {
    for (var i = 0; i < live.length; i++) {
      try {
        live[i].stop();
      } catch (e) {}
    }
    live = [];
  }

  function envGain(start, dur, peak, sustain, decay) {
    var g = ctx.createGain();
    var p = (peak / 15) * 0.35;
    var s = p * sustain;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(p, start + 0.008);
    g.gain.exponentialRampToValueAtTime(Math.max(s, 0.0001), start + 0.008 + decay);
    var rel = Math.max(0.04, dur * 0.2);
    var end = start + dur;
    g.gain.setValueAtTime(Math.max(s, 0.0001), Math.max(start + 0.01, end - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    return g;
  }

  function playPulse(ev, t, table, decay, sustain) {
    var dur = ev.len * (60 / BPM / 4);
    var osc = ctx.createOscillator();
    osc.setPeriodicWave(table);
    osc.frequency.value = hz(ev.midi);
    var g = envGain(t, dur, ev.vol, sustain, decay);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = function () {
      var i = live.indexOf(osc);
      if (i >= 0) live.splice(i, 1);
    };
    live.push(osc);
  }

  function playWave(ev, t) {
    playPulse(ev, t, waveTable, 0.1, 0.55);
  }

  function playNoise(ev, t) {
    var dur = 0.07;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2800;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((ev.vol / 15) * 0.2, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
    src.onended = function () {
      var i = live.indexOf(src);
      if (i >= 0) live.splice(i, 1);
    };
    live.push(src);
  }

  function voice(ev, t) {
    if (ev.ch === 1) playPulse(ev, t, pulse25, 0.09, 0.4);
    else if (ev.ch === 2) playPulse(ev, t, pulse50, ev.len <= 2 ? 0.16 : 0.12, ev.len <= 2 ? 0.08 : 0.35);
    else if (ev.ch === 3) playWave(ev, t);
    else playNoise(ev, t);
  }

  function sixteenth() {
    return 60 / BPM / 4;
  }

  function schedule() {
    if (!wantAir || !ctx) return;
    if (ctx.state === "suspended") {
      timer = root.setTimeout(schedule, 50);
      return;
    }
    var now = ctx.currentTime;
    var dt = sixteenth();
    var horizon = now + LOOK;
    while (origin + cursor * dt < horizon) {
      var t = origin + cursor * dt;
      if (t >= now - 0.02) {
        var slot = events[cursor % LOOP];
        if (slot) {
          for (var i = 0; i < slot.length; i++) voice(slot[i], t);
        }
      }
      cursor += 1;
    }
    timer = root.setTimeout(schedule, 25);
  }

  function start() {
    ensure();
    if (!ctx) return false;
    wantAir = true;
    cut();
    function go() {
      if (!wantAir || !ctx) return;
      origin = ctx.currentTime + 0.05;
      cursor = 0;
      if (timer) root.clearTimeout(timer);
      schedule();
    }
    var p = ctx.resume();
    if (p && p.then) p.then(go);
    else go();
    return true;
  }

  function hush() {
    wantAir = false;
    if (timer) {
      root.clearTimeout(timer);
      timer = null;
    }
    cut();
    if (ctx && ctx.state === "running") ctx.suspend();
  }

  function pause() {
    if (!wantAir || !ctx) return;
    if (timer) {
      root.clearTimeout(timer);
      timer = null;
    }
    if (ctx.state === "running") ctx.suspend();
  }

  function resume() {
    if (!wantAir || !ctx) return;
    function go() {
      if (!wantAir || !ctx) return;
      origin = ctx.currentTime - cursor * sixteenth();
      if (timer) root.clearTimeout(timer);
      schedule();
    }
    var p = ctx.resume();
    if (p && p.then) p.then(go);
    else go();
  }

  root.GroveClearing = {
    start: start,
    hush: hush,
    pause: pause,
    resume: resume,
    isAir: function () {
      return wantAir;
    }
  };
})(window);
