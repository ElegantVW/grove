// The clearing — original Grove air. GBA PSG + Direct Sound.
// Whimsy porch, doom-jazz turn, rain bed. 96 BPM, 32 bars, light swing.
// Off until the hush/air button asks.
(function (root) {
  "use strict";

  var BPM = 96;
  var LOOP = 32 * 16;
  var LOOK = 0.14;
  var SWING = 0.18;
  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  var ctx = null;
  var master = null;
  var pulse12 = null;
  var pulse50 = null;
  var waveTable = null;
  var noiseBuf = null;
  var rainBuf = null;
  var rainLive = [];
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

  function chordTones(tok) {
    var m = tok.match(/^([A-G])(#|b)?(7b9|m7|m|7)?:(\d+)$/);
    if (!m) throw new Error("clearing: bad chord " + tok);
    var acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
    var root = 55 + ((PC[m[1]] + acc - 7 + 12) % 12);
    var q = m[3] || "";
    var third = q.charAt(0) === "m" ? 3 : 4;
    var top = q.indexOf("7") >= 0 ? 10 : 7;
    if (q === "7b9") return [root, root + 4, root + 13];
    return [root, root + third, root + top];
  }

  function layPad(bars, vol) {
    var step = 0;
    for (var b = 0; b < bars.length; b++) {
      var toks = bars[b].trim().split(/\s+/);
      var used = 0;
      for (var i = 0; i < toks.length; i++) {
        var m = toks[i].match(/:(\d+)$/);
        var len = m ? +m[1] : 16;
        if (toks[i].charAt(0) !== ".") {
          if (!events[step]) events[step] = [];
          events[step].push({ ch: 5, chord: chordTones(toks[i]), len: len, vol: vol });
        }
        step += len;
        used += len;
      }
      if (used !== 16) throw new Error("clearing: pad bar " + b + " is " + used);
    }
  }

  function layDrum(bars) {
    for (var b = 0; b < bars.length; b++) {
      var row = bars[b];
      if (row.length !== 16) throw new Error("clearing: drum bar " + b + " is " + row.length);
      for (var i = 0; i < 16; i++) {
        var k = row.charAt(i);
        if (k === "." ) continue;
        var step = b * 16 + i;
        if (!events[step]) events[step] = [];
        var vol = k === "k" ? 8 : k === "s" ? 6 : k === "c" ? 4 : 3;
        events[step].push({ ch: 4, kind: k, vol: vol });
      }
    }
  }

  // Pulse 1 — waits, then the hook, then a lower doom turn.
  lay(1, [
    ".:16", ".:16", ".:16", ".:16",
    "G5:4 .:4 D5:4 .:4",
    "B4:6 .:2 A4:8",
    "D5:4 G5:4 A5:2 .:2 G5:4",
    "F5:6 .:2 D5:8",
    "G5:4 .:4 D5:4 B4:4",
    "A4:6 .:2 G4:8",
    "C5:4 .:2 B4:2 A4:4 .:4",
    "D5:4 .:4 G4:8",
    "G5:4 .:4 D5:4 .:4",
    "B4:6 .:2 A4:8",
    "D5:4 G5:4 A5:2 .:2 G5:4",
    "F5:6 .:2 D5:8",
    "G5:4 .:4 D5:4 B4:4",
    "A4:6 .:2 G4:8",
    "C5:4 .:2 B4:2 A4:4 .:4",
    "D5:4 .:4 G4:8",
    "D4:8 .:4 Bb3:4",
    "G4:6 .:2 F4:8",
    "Eb4:8 D4:8",
    "C4:4 .:4 A3:8",
    "Bb3:8 G3:8",
    "F4:4 Eb4:4 D4:8",
    "C4:8 .:4 Eb4:4",
    "D4:12 .:4",
    "E4:4 G4:4 A4:4 .:4",
    "B4:8 D5:4 .:4",
    "F5:6 .:2 D5:8",
    "G4:12 .:4"
  ], 10);

  lay(2, [
    ".:16",
    ".:8 D3:8",
    ".:16",
    ".:8 G3:8",
    ".:4 D4:4 .:4 B3:4",
    ".:8 G3:8",
    ".:10 B3:2 D4:4",
    ".:6 C4:2 A3:8",
    ".:4 D4:4 .:4 G3:4",
    ".:8 B3:8",
    ".:4 E3:2 .:6 G3:4",
    ".:4 B3:4 D4:8",
    "D4:2 .:6 B3:2 .:6",
    ".:4 G3:4 .:4 D4:4",
    "B3:4 .:4 D4:4 .:4",
    "A3:8 C4:4 .:4",
    "D4:2 .:2 G3:4 .:8",
    "B3:8 .:8",
    "E3:4 G3:4 .:8",
    "D4:8 G3:8",
    "Bb3:4 .:4 D4:4 .:4",
    "G3:8 F3:8",
    "Eb3:4 .:4 G3:8",
    "A3:4 .:4 C4:4 .:4",
    "Bb3:8 .:8",
    "F3:4 G3:4 A3:8",
    "Eb3:8 G3:8",
    "D3:8 A3:8",
    "C4:8 E4:8",
    "D4:8 F#4:4 .:4",
    "F4:8 A3:8",
    "G3:8 D4:8"
  ], 5);

  lay(3, [
    "G2:16",
    "G2:8 D2:8",
    "G2:16",
    "D2:8 G2:8",
    "G2:8 D3:8",
    "G2:8 F2:8",
    "C3:8 G2:8",
    "D3:8 A2:8",
    "G2:8 D3:8",
    "E2:8 B2:8",
    "A2:8 E2:8",
    "D3:8 G2:8",
    "G2:8 D3:8",
    "F2:8 C3:8",
    "C3:8 G2:8",
    "D3:4 A2:4 D3:8",
    "G2:8 D3:8",
    "E2:8 B2:8",
    "F2:8 C3:8",
    "D3:8 G2:8",
    "G2:8 D3:8",
    "Eb2:8 Bb2:8",
    "C2:8 G2:8",
    "D2:8 Ab2:8",
    "G2:8 D3:8",
    "F2:8 C3:8",
    "Eb2:8 Bb2:8",
    "D2:8 A2:8",
    "C3:8 G2:8",
    "D3:8 A2:8",
    "G2:8 F2:8",
    "G2:12 D2:4"
  ], 7);

  layPad([
    "G7:16", "G7:16", "G7:16", "G7:16",
    "G7:16", "G7:16", "F:8 C:8", "D7:16",
    "G7:16", "Em:16", "Am:16", "D7:16",
    "G7:16", "F:16", "C:8 Am:8", "D7:16",
    "G7:16", "Em:16", "F:8 C:8", "D7:16",
    "Gm:16", "Eb:16", "Cm:16", "D7b9:16",
    "Gm:16", "F:16", "Eb:16", "D7:16",
    "C:16", "D7:16", "G7:8 F:8", "G7:16"
  ], 4);

  layDrum([
    "..h...h...h...h.",
    "..h...h...h...h.",
    "k.h...h...h...h.",
    "k.h...h.k.h...h.",
    "k.h...h.k.h.s.h.",
    "k.h...h.k.h...h.",
    "k.h...h.k.h.s.h.",
    "k.h...h.k.h.s.h.",
    "k.h...h.k.h.s.h.",
    "k.h...h.k.h...h.",
    "k.h...h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h...h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k..h.s.h.k..h.s.",
    "k..h.s.h.k..h.s.",
    "k..h.s.h.k..h.s.",
    "k..h.s.h.k..s.h.",
    "k..h.s.h.k..h.s.",
    "k..h.s.h.k..h.s.",
    "k..h.s.h.k..h.s.",
    "k..h.s.h.k..s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.h.",
    "k.h.s.h.k.h.s.k.",
    "k...s...k...s.c."
  ]);

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
    for (var k = 1; k < n; k += 2) {
      imag[k] = (k % 4 === 1 ? 1 : -1) / (k * k);
    }
    return ctx.createPeriodicWave(real, imag);
  }

  function lfsrBuf(seconds, stereo) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var ch = stereo ? 2 : 1;
    var buf = ctx.createBuffer(ch, len, ctx.sampleRate);
    for (var c = 0; c < ch; c++) {
      var d = buf.getChannelData(c);
      var reg = c ? 0x7fff : 0x5a3c;
      for (var i = 0; i < len; i++) {
        var bit = (reg ^ (reg >> 1)) & 1;
        reg = (reg >> 1) | (bit << 14);
        d[i] = bit ? 0.1 : -0.1;
      }
    }
    return buf;
  }

  function track(node) {
    node.onended = function () {
      var i = live.indexOf(node);
      if (i >= 0) live.splice(i, 1);
    };
    live.push(node);
  }

  function ensure() {
    if (ctx) return;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    var coarse = root.matchMedia && root.matchMedia("(pointer: coarse)").matches;
    master.gain.value = coarse ? 0.04 : 0.065;
    master.connect(ctx.destination);
    pulse12 = pulseWave(0.125);
    pulse50 = pulseWave(0.5);
    waveTable = makeWaveTable();
    noiseBuf = lfsrBuf(1, false);
    rainBuf = lfsrBuf(4, true);
  }

  function stopRain() {
    for (var i = 0; i < rainLive.length; i++) {
      try { rainLive[i].stop(); } catch (e) {}
    }
    rainLive = [];
  }

  function startRain() {
    stopRain();
    if (!ctx || !rainBuf) return;
    var src = ctx.createBufferSource();
    src.buffer = rainBuf;
    src.loop = true;
    var hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 380;
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1300;
    var g = ctx.createGain();
    g.gain.value = 0.02;
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    if (pan) {
      g.connect(pan);
      pan.connect(master);
      var lfo = ctx.createOscillator();
      var lg = ctx.createGain();
      lfo.frequency.value = 0.06;
      lg.gain.value = 0.4;
      lfo.connect(lg);
      lg.connect(pan.pan);
      lfo.start();
      rainLive.push(lfo);
    } else {
      g.connect(master);
    }
    src.start();
    rainLive.push(src);
  }

  function cut() {
    for (var i = 0; i < live.length; i++) {
      try { live[i].stop(); } catch (e) {}
    }
    live = [];
    stopRain();
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
    track(osc);
  }

  function playWave(ev, t) {
    playPulse(ev, t, waveTable, 0.16, 0.7);
  }

  function playPad(ev, t) {
    var dur = ev.len * (60 / BPM / 4);
    var cents = [-5, 0, 6];
    for (var i = 0; i < ev.chord.length; i++) {
      var osc = ctx.createOscillator();
      osc.setPeriodicWave(waveTable);
      osc.frequency.value = hz(ev.chord[i]);
      osc.detune.value = cents[i] || 0;
      var g = ctx.createGain();
      var p = (ev.vol / 15) * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p, t + 0.05);
      g.gain.setValueAtTime(p, t + Math.max(0.08, dur - 0.14));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      track(osc);
    }
  }

  function playDrum(ev, t) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    var g = ctx.createGain();
    var dur = 0.06;
    var peak = (ev.vol / 15) * 0.45;
    if (ev.kind === "k") {
      f.type = "lowpass";
      f.frequency.value = 140;
      dur = 0.14;
      peak *= 1.2;
    } else if (ev.kind === "s") {
      f.type = "bandpass";
      f.frequency.value = 1800;
      f.Q.value = 0.7;
      dur = 0.09;
    } else if (ev.kind === "c") {
      f.type = "highpass";
      f.frequency.value = 2400;
      dur = 0.11;
      peak *= 0.5;
    } else {
      f.type = "highpass";
      f.frequency.value = 6500;
      dur = 0.03;
      peak *= 0.45;
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.02);
    track(src);
  }

  function voice(ev, t) {
    if (ev.ch === 1) playPulse(ev, t, pulse12, 0.14, 0.55);
    else if (ev.ch === 2) playPulse(ev, t, pulse50, ev.len <= 4 ? 0.18 : 0.14, ev.len <= 4 ? 0.2 : 0.45);
    else if (ev.ch === 3) playWave(ev, t);
    else if (ev.ch === 5) playPad(ev, t);
    else playDrum(ev, t);
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
      var swung = origin + cursor * dt;
      if (cursor % 2 === 1) swung += dt * SWING;
      if (swung >= now - 0.02) {
        var slot = events[cursor % LOOP];
        if (slot) {
          for (var i = 0; i < slot.length; i++) voice(slot[i], swung);
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
      startRain();
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
      if (!rainLive.length) startRain();
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
