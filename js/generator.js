/* Mathe-Abenteuer – Aufgabengenerator, Hinweise, Multiple-Choice, adaptive Auswahl.
   Reine Logik ohne DOM, damit sie auch in tests.html geprüft werden kann. */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};

  var rnd = Math.random;
  function setRandom(fn) { rnd = typeof fn === 'function' ? fn : Math.random; }
  function randInt(min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function weighted(obj) {
    var keys = Object.keys(obj), total = 0, i;
    for (i = 0; i < keys.length; i++) total += obj[keys[i]];
    var r = rnd() * total;
    for (i = 0; i < keys.length; i++) { r -= obj[keys[i]]; if (r < 0) return keys[i]; }
    return keys[keys.length - 1];
  }

  /* Schwierigkeitsstufen (Stufe 1–5). max = größte vorkommende Zahl/Ergebnis. */
  var STAGES = {
    1: { max: 20,  carry: 0,    shapes: { small: 1 } },
    2: { max: 30,  carry: 0.35, shapes: { small: 0.75, two: 0.25 } },
    3: { max: 50,  carry: 0.5,  shapes: { small: 0.45, round: 0.15, two: 0.4 } },
    4: { max: 100, carry: 0.5,  shapes: { small: 0.3, round: 0.15, two: 0.55 } },
    5: { max: 100, carry: 0.65, shapes: { small: 0.15, two: 0.85 }, big: true }
  };
  var MANUAL = {
    20:  { max: 20,  shapes: { small: 0.85, two: 0.15 } },
    50:  { max: 50,  shapes: { small: 0.45, round: 0.15, two: 0.4 } },
    100: { max: 100, shapes: { small: 0.3, round: 0.15, two: 0.55 } }
  };

  function hasCarry(op, a, b) {
    return op === 'add' ? (a % 10) + (b % 10) >= 10 : (a % 10) < (b % 10);
  }
  function result(op, a, b) { return op === 'add' ? a + b : a - b; }
  function bucket(op, a, b) {
    var m = Math.max(a, b, result(op, a, b));
    return m <= 20 ? '20' : (m <= 50 ? '50' : '100');
  }
  function category(op, a, b) {
    return op + '|' + (hasCarry(op, a, b) ? 'z' : 'o') + '|' + bucket(op, a, b);
  }
  function categoryLabel(key) {
    var p = String(key).split('|');
    var t = p[0] === 'add' ? 'Plus' : 'Minus';
    var c = p[1] === 'z' ? 'mit Zehnerübergang' : 'ohne Zehnerübergang';
    return t + ' ' + c + ' (bis ' + p[2] + ')';
  }
  function taskKey(op, a, b) {
    if (op === 'add') return 'add:' + Math.min(a, b) + '+' + Math.max(a, b);
    return 'sub:' + a + '-' + b;
  }

  function shapeOk(shape, op, a, b, big) {
    if (b === 0 || a === 0) return false;
    if (op === 'sub' && a === b) return false;
    switch (shape) {
      case 'small': // eine Zahl einstellig
        return op === 'add' ? (b <= 9 || a <= 9) : b <= 9;
      case 'round': // glatte Zehner
        return b >= 10 && b % 10 === 0 && a >= 10;
      case 'two':   // zweistellig ± zweistellig (nicht glatt)
        return a >= 10 && b >= 10 && b % 10 !== 0 && (!big || Math.max(a, result(op, a, b)) >= 30);
      default: return true;
    }
  }

  /* Alle passenden Paare aufzählen (max. 101×101 – sehr schnell) und eins zufällig wählen.
     Garantiert: Ergebnis 0..max, keine negativen Ergebnisse. */
  function candidates(op, carry, max, shape, big, bucketFilter) {
    var list = [];
    for (var a = 1; a <= max; a++) {
      for (var b = 1; b <= max; b++) {
        var r = result(op, a, b);
        if (r < 0 || r > max) continue;
        if (carry !== null && hasCarry(op, a, b) !== carry) continue;
        if (shape && !shapeOk(shape, op, a, b, big)) continue;
        if (bucketFilter && bucket(op, a, b) !== bucketFilter) continue;
        list.push([a, b]);
      }
    }
    return list;
  }

  /* Hauptfunktion: erzeugt eine Aufgabe.
     ctx = { settings, stage, level, recentKeys:[], lastOps:[], weakCats:[] } */
  function generate(ctx) {
    var s = ctx.settings || {};
    var ops = [];
    if (s.add !== false) ops.push('add');
    if (s.sub !== false) ops.push('sub');
    if (!ops.length) ops = ['add'];
    var range = [20, 50, 100].indexOf(s.range) >= 0 ? s.range : 100;
    var allowCarry = s.carry !== false;

    var conf, carryProb;
    if (s.difficulty === 'manual') {
      conf = MANUAL[range];
      carryProb = allowCarry ? 0.5 : 0;
    } else {
      var st = Math.max(1, Math.min(5, ctx.stage || 1));
      conf = STAGES[st];
      var lvl = Math.max(1, Math.min(5, ctx.level || 1));
      carryProb = allowCarry ? Math.min(0.8, conf.carry * (0.75 + 0.08 * (lvl - 1))) : 0;
    }
    var max = Math.min(conf.max, range);

    var op = pick(ops);
    var last = ctx.lastOps || [];
    if (ops.length === 2 && last.length >= 3 && last[last.length - 1] === last[last.length - 2] &&
        last[last.length - 2] === last[last.length - 3]) {
      op = last[last.length - 1] === 'add' ? 'sub' : 'add';
    }
    var carry = rnd() < carryProb;
    var shape = weighted(conf.shapes);
    var bucketFilter = null;

    // Adaptive Wiederholung: in ca. 30 % der Fälle ein schwacher Aufgabentyp
    var weak = (ctx.weakCats || []).filter(function (k) {
      var p = k.split('|');
      if (ops.indexOf(p[0]) < 0) return false;
      if (p[1] === 'z' && !allowCarry) return false;
      if (Number(p[2]) > max) return false;
      return true;
    });
    var adaptive = false;
    if (weak.length && rnd() < 0.3) {
      var wk = pick(weak).split('|');
      op = wk[0]; carry = wk[1] === 'z'; bucketFilter = wk[2]; shape = null; adaptive = true;
    }
    if (shape === 'round') carry = false;
    if (max <= 10) carry = false;

    var recent = ctx.recentKeys || [];
    var attempts = [
      [op, carry, shape, bucketFilter],
      [op, carry, shape, null],
      [op, carry, null, null],
      [op, false, null, null],
      ['add', false, null, null]
    ];
    var list = [];
    for (var i = 0; i < attempts.length && !list.length; i++) {
      var t = attempts[i];
      if (t[1] && !allowCarry) continue;
      var c = candidates(t[0], t[1], max, t[2], conf.big, t[3]);
      var fresh = c.filter(function (p) { return recent.indexOf(taskKey(t[0], p[0], p[1])) < 0; });
      list = fresh.length ? fresh : c;
      if (list.length) { op = t[0]; carry = t[1]; }
    }
    if (!list.length) list = [[1, 1]];
    var pair = pick(list);
    return makeTask(op, pair[0], pair[1], adaptive);
  }

  function makeTask(op, a, b, adaptive) {
    var r = result(op, a, b);
    return {
      op: op, a: a, b: b, answer: r,
      text: a + (op === 'add' ? ' + ' : ' − ') + b,
      speech: a + (op === 'add' ? ' plus ' : ' minus ') + b,
      carry: hasCarry(op, a, b),
      cat: category(op, a, b),
      key: taskKey(op, a, b),
      adaptive: !!adaptive
    };
  }

  /* Multiple Choice: typische Fehler als Ablenker */
  function choices(task, count) {
    count = count || 4;
    var a = task.a, b = task.b, r = task.answer, op = task.op;
    var c = [];
    function add(v) { if (v >= 0 && v <= 100 && v !== r && c.indexOf(v) < 0) c.push(v); }
    if (op === 'add') {
      if (task.carry) add(r - 10);                                   // Übertrag vergessen
      add(Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10 + ((a + b) % 10)); // Einer ohne Übertrag
      add(r + 10);
      add(a - b);                                                    // falsche Rechenart
    } else {
      if (task.carry) {
        add(Math.floor(a / 10) * 10 - Math.floor(b / 10) * 10 + Math.abs(a % 10 - b % 10)); // „kleine von großer“
        add(r + 10);
      }
      add(r - 10);
      add(a + b);
    }
    add(r + 1); add(r - 1);
    if (r >= 10 && r % 10 !== Math.floor(r / 10)) add((r % 10) * 10 + Math.floor(r / 10)); // Zahlendreher
    add(r + 2); add(r - 2); add(r + 11); add(r - 9); add(r + 9); add(r - 11);
    for (var k = 3; c.length < count - 1 && k < 200; k++) { add(r + k); add(r - k); }
    var picks = c.slice(0, Math.min(4, c.length));
    picks = shuffle(picks).slice(0, count - 1);
    picks.push(r);
    return shuffle(picks);
  }

  /* Regelbasierte Hilfen. Liefert { hint1, hint2, steps[] } */
  function hints(task) {
    var a = task.a, b = task.b, r = task.answer;
    var h = { hint1: '', hint2: '', steps: [] };
    if (task.op === 'add') {
      var big = Math.max(a, b), small = Math.min(a, b);
      var swap = a < b && small <= 9;
      var pre = swap ? 'Tausche die Zahlen: ' + big + ' + ' + small + ' ist leichter. ' : '';
      if (small >= 10) {
        var T = Math.floor(small / 10) * 10, E = small % 10, mid = big + T;
        h.hint1 = pre + 'Rechne zuerst ' + big + ' + ' + T + '.';
        h.hint2 = big + ' + ' + T + ' = ' + mid + '. ' + (E ? 'Jetzt fehlen noch ' + E + '.' : 'Fertig!');
        h.steps = [big + ' + ' + T + ' = ' + mid];
        if (E) h.steps.push(mid + ' + ' + E + ' = ' + r);
      } else if (task.carry) {
        var toTen = 10 - (big % 10), nextTen = big + toTen, rest = small - toTen;
        h.hint1 = pre + 'Rechne zuerst bis zum nächsten Zehner: ' + big + ' + ' + toTen + '.';
        if (rest === 0) {
          h.hint1 = pre + 'Schau auf die Einer: ' + (big % 10) + ' + ' + small + ' ergibt genau 10.';
          h.hint2 = 'Aus den Einern wird ein neuer Zehner. ' + (big - big % 10) + ' + 10 = ' + r + '.';
          h.steps = [(big % 10) + ' + ' + small + ' = 10', (big - big % 10) + ' + 10 = ' + r];
        } else {
          h.hint2 = big + ' + ' + toTen + ' = ' + nextTen + '. Jetzt fehlen noch ' + rest + '.';
          h.steps = [small + ' = ' + toTen + ' + ' + rest, big + ' + ' + toTen + ' = ' + nextTen, nextTen + ' + ' + rest + ' = ' + r];
        }
      } else if (big >= 10) {
        var e1 = big % 10;
        h.hint1 = pre + 'Schau nur auf die Einer: ' + e1 + ' + ' + small + '.';
        h.hint2 = e1 + ' + ' + small + ' = ' + (e1 + small) + '. Die Zehner bleiben gleich.';
        h.steps = [e1 + ' + ' + small + ' = ' + (e1 + small), (big - e1) + ' + ' + (e1 + small) + ' = ' + r];
      } else {
        h.hint1 = pre + 'Starte bei ' + big + ' und zähle ' + small + ' weiter.';
        h.hint2 = 'Zähle mit: ' + seq(big + 1, r) + '.';
        h.steps = [big + ' und ' + small + ' weiter: ' + seq(big + 1, r)];
      }
    } else {
      if (b >= 10) {
        var T2 = Math.floor(b / 10) * 10, E2 = b % 10, mid2 = a - T2;
        h.hint1 = 'Rechne zuerst ' + a + ' − ' + T2 + '.';
        h.hint2 = a + ' − ' + T2 + ' = ' + mid2 + '. ' + (E2 ? 'Jetzt noch ' + E2 + ' wegnehmen.' : 'Fertig!');
        h.steps = [a + ' − ' + T2 + ' = ' + mid2];
        if (E2) h.steps.push(mid2 + ' − ' + E2 + ' = ' + r);
      } else if (task.carry) {
        var down = a % 10, ten = a - down, rest2 = b - down;
        if (a === 10) {
          h.hint1 = 'Wie viel fehlt von ' + b + ' bis 10?';
          h.hint2 = 'Zähle von ' + b + ' bis 10: ' + seq(b + 1, 10) + '.';
          h.steps = [b + ' + ' + r + ' = 10', 'Also: ' + task.text + ' = ' + r];
          return h;
        }
        if (down === 0) {
          h.hint1 = 'Nimm einen Zehner: 10 − ' + b + ' = ?';
          h.hint2 = '10 − ' + b + ' = ' + (10 - b) + '. Dazu kommen noch ' + (a - 10) + '.';
          h.steps = [a + ' = ' + (a - 10) + ' + 10', '10 − ' + b + ' = ' + (10 - b), (a - 10) + ' + ' + (10 - b) + ' = ' + r];
          h.steps.push('Also: ' + task.text + ' = ' + r);
          return h;
        }
        h.hint1 = 'Rechne zuerst bis zum Zehner: ' + a + ' − ' + down + '.';
        h.hint2 = a + ' − ' + down + ' = ' + ten + '. Jetzt fehlen noch ' + rest2 + '.';
        h.steps = [b + ' = ' + down + ' + ' + rest2, a + ' − ' + down + ' = ' + ten, ten + ' − ' + rest2 + ' = ' + r];
      } else if (a >= 10) {
        var e2 = a % 10;
        h.hint1 = 'Schau nur auf die Einer: ' + e2 + ' − ' + b + '.';
        h.hint2 = e2 + ' − ' + b + ' = ' + (e2 - b) + '. Die Zehner bleiben gleich.';
        h.steps = [e2 + ' − ' + b + ' = ' + (e2 - b),
          e2 === b ? 'Es bleiben nur die Zehner: ' + r : (a - e2) + ' + ' + (e2 - b) + ' = ' + r];
      } else {
        h.hint1 = 'Starte bei ' + a + ' und zähle ' + b + ' zurück.';
        h.hint2 = 'Zähle rückwärts: ' + seqDown(a - 1, r) + '.';
        h.steps = [a + ' und ' + b + ' zurück: ' + seqDown(a - 1, r)];
      }
    }
    h.steps.push('Also: ' + task.text + ' = ' + r);
    return h;
  }
  function seq(from, to) { var o = []; for (var i = from; i <= to; i++) o.push(i); return o.join(', '); }
  function seqDown(from, to) { var o = []; for (var i = from; i >= to; i--) o.push(i); return o.join(', '); }

  /* Freundliche, fehlerspezifische Rückmeldung */
  var SOFT = ['Fast! Versuch es noch einmal.', 'Das war knapp. Schau noch einmal genau hin.',
    'Hmm, noch nicht ganz. Du schaffst das!', 'Guter Versuch! Probier es nochmal.'];
  function wrongMessage(task, given) {
    var r = task.answer;
    if (given === r + 10 || given === r - 10) return 'Fast! Schau noch einmal auf die Zehner.';
    if (Math.floor(given / 10) === Math.floor(r / 10) && given !== r) return 'Die Zehner stimmen schon! Schau noch einmal auf die Einer.';
    if (task.op === 'add' && given === task.a - task.b) return 'Achtung: Hier heißt es Plus!';
    if (task.op === 'sub' && given === task.a + task.b) return 'Achtung: Hier heißt es Minus!';
    if (Math.abs(given - r) === 1) return 'Ganz knapp daneben! Zähl noch einmal nach.';
    return pick(SOFT);
  }
  var PRAISE = ['Super!', 'Richtig!', 'Klasse gemacht!', 'Toll gerechnet!', 'Genau!', 'Spitze!', 'Wunderbar!', 'Stark!'];
  function praise() { return pick(PRAISE); }

  /* Schwache Aufgabentypen aus Statistik bestimmen */
  function weakCategories(cats) {
    var all = [], totalTime = 0, totalN = 0, k;
    for (k in cats) {
      if (!Object.prototype.hasOwnProperty.call(cats, k)) continue;
      totalTime += cats[k].time || 0; totalN += cats[k].n || 0;
    }
    var avgTime = totalN ? totalTime / totalN : 0;
    for (k in cats) {
      if (!Object.prototype.hasOwnProperty.call(cats, k)) continue;
      var c = cats[k];
      if (!c || c.n < 3) continue;
      var errRate = (c.wrong + 0.5) / (c.n + 2);
      var slow = avgTime > 0 && c.time / c.n > avgTime * 1.6 && c.time / c.n > 12000;
      if (errRate >= 0.3 || slow) all.push({ k: k, score: errRate + (slow ? 0.2 : 0) });
    }
    all.sort(function (x, y) { return y.score - x.score; });
    return all.slice(0, 3).map(function (x) { return x.k; });
  }

  MA.Gen = {
    STAGES: STAGES, setRandom: setRandom, randInt: randInt, shuffle: shuffle,
    generate: generate, makeTask: makeTask, choices: choices, hints: hints,
    wrongMessage: wrongMessage, praise: praise, hasCarry: hasCarry,
    category: category, categoryLabel: categoryLabel, taskKey: taskKey,
    weakCategories: weakCategories
  };
})(typeof window !== 'undefined' ? window : globalThis);
