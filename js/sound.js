/* Mathe-Abenteuer – dezente Soundeffekte, live erzeugt mit der Web Audio API (keine Audiodateien). */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};
  var ctx = null, master = null, enabled = true, active = [], lastClick = 0;

  function ensure() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  /* iPad: Audio darf erst nach einer Berührung starten */
  function unlock() {
    var c = ensure();
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { /* ignorieren */ } }
  }

  function stopAll() {
    var now = ctx ? ctx.currentTime : 0;
    active.forEach(function (v) {
      try { v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, 0.02); v.o.stop(now + 0.1); } catch (e) { /* bereits beendet */ }
    });
    active = [];
  }

  function tone(freq, start, dur, type, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    var t0 = ctx.currentTime + start;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
    var v = { o: o, g: g };
    active.push(v);
    o.onended = function () { var i = active.indexOf(v); if (i >= 0) active.splice(i, 1); };
  }
  function seq(notes, step, dur, type, vol) {
    notes.forEach(function (f, i) { tone(f, i * step, dur, type, vol); });
  }

  var N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568, A4: 440, G4: 392, E4: 329.63, C4: 261.63 };

  var SOUNDS = {
    click: function () { tone(880, 0, 0.06, 'triangle', 0.18); },
    correct: function () { seq([N.E5, N.G5, N.C6], 0.08, 0.22, 'triangle', 0.45); },
    wrong: function () { tone(N.E4, 0, 0.22, 'sine', 0.3); tone(N.C4, 0.14, 0.3, 'sine', 0.25); },
    hint: function () { seq([N.G5, N.E5], 0.1, 0.2, 'sine', 0.3); },
    streak: function () { seq([N.C5, N.E5, N.G5, N.C6, N.E6], 0.06, 0.2, 'triangle', 0.4); },
    chest: function () { seq([N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.E6, N.G6], 0.05, 0.25, 'sine', 0.35); },
    level: function () { seq([N.C5, N.E5, N.G5], 0.12, 0.2, 'triangle', 0.45); tone(N.C6, 0.38, 0.5, 'triangle', 0.5); },
    world: function () { seq([N.G4, N.C5, N.E5, N.G5], 0.13, 0.22, 'triangle', 0.45); tone(N.C6, 0.55, 0.5, 'sine', 0.4); tone(N.E6, 0.75, 0.5, 'sine', 0.35); tone(N.G6, 0.95, 0.7, 'sine', 0.3); },
    star: function () { tone(N.E6, 0, 0.25, 'sine', 0.3); }
  };

  function play(name) {
    if (!enabled) return;
    var c = ensure();
    if (!c || !SOUNDS[name]) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) { return; } }
    try {
      if (name === 'click') {
        var now = Date.now();
        if (now - lastClick < 60) return;
        lastClick = now;
      } else if (name !== 'star') {
        stopAll(); // Effekte überlagern sich nicht
      }
      SOUNDS[name]();
    } catch (e) { /* Ton ist nie kritisch */ }
  }

  MA.Sound = {
    play: play, unlock: unlock,
    setEnabled: function (v) { enabled = !!v; if (!enabled && ctx) stopAll(); },
    isEnabled: function () { return enabled; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
