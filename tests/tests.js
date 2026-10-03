/* Mathe-Abenteuer – interne Tests der Rechen- und Spiellogik.
   Im Browser: tests/index.html öffnen. Ohne Browser: node tests/run-node.js */
(function (root) {
  'use strict';
  var MA = root.MA, Gen = MA.Gen, Game = MA.Game, Store = MA.Store;
  var results = [];
  function test(name, fn) {
    try { fn(); results.push({ name: name, ok: true }); }
    catch (e) { results.push({ name: name, ok: false, msg: e && e.message ? e.message : String(e) }); }
  }
  function assert(cond, msg) { if (!cond) throw new Error(msg || 'Bedingung nicht erfüllt'); }
  function settings(o) {
    var s = Store.defaults().settings;
    for (var k in o) s[k] = o[k];
    return s;
  }
  function many(ctx, n) { var out = []; for (var i = 0; i < n; i++) out.push(Gen.generate(ctx)); return out; }

  test('Addition: Ergebnis nie über 100 (alle Stufen, 3 000 Aufgaben)', function () {
    for (var st = 1; st <= 5; st++) many({ settings: settings({ sub: false }), stage: st, level: 5 }, 600).forEach(function (t) {
      assert(t.op === 'add', 'nur Addition erwartet');
      assert(t.answer === t.a + t.b, 'Rechenfehler ' + t.text);
      assert(t.answer >= 0 && t.answer <= 100, 'Ergebnis außerhalb: ' + t.text);
    });
  });
  test('Subtraktion: nie negativ (alle Stufen, 3 000 Aufgaben)', function () {
    for (var st = 1; st <= 5; st++) many({ settings: settings({ add: false }), stage: st, level: 3 }, 600).forEach(function (t) {
      assert(t.op === 'sub', 'nur Subtraktion erwartet');
      assert(t.answer === t.a - t.b && t.answer >= 0, 'negativ: ' + t.text);
      assert(t.a <= 100, 'Zahl zu groß: ' + t.text);
    });
  });
  test('Zahlenraum bis 20 und bis 50 wird eingehalten (manuell und automatisch)', function () {
    [20, 50].forEach(function (r) {
      ['manual', 'auto'].forEach(function (d) {
        for (var st = 1; st <= 5; st++) many({ settings: settings({ range: r, difficulty: d }), stage: st }, 200).forEach(function (t) {
          assert(Math.max(t.a, t.b, t.answer) <= r, 'Zahlenraum ' + r + ' verletzt: ' + t.text);
        });
      });
    });
  });
  test('Zehnerübergang aus: keine Aufgabe mit Übergang', function () {
    for (var st = 1; st <= 5; st++) many({ settings: settings({ carry: false }), stage: st, weakCats: ['add|z|50'] }, 300).forEach(function (t) {
      assert(!t.carry, 'Übergang gefunden: ' + t.text);
    });
  });
  test('Stufe 1 ohne Zehnerübergang und bis 20', function () {
    many({ settings: settings({}), stage: 1 }, 500).forEach(function (t) {
      assert(!t.carry && t.answer <= 20 && Math.max(t.a, t.b) <= 20, 'Stufe 1 verletzt: ' + t.text);
    });
  });
  test('Mischung: Aufgaben mit und ohne Zehnerübergang in Stufe 4', function () {
    var ts = many({ settings: settings({}), stage: 4, level: 3 }, 300);
    var c = ts.filter(function (t) { return t.carry; }).length;
    assert(c > 60 && c < 240, 'Anteil Übergang unplausibel: ' + c);
    var ops = ts.filter(function (t) { return t.op === 'add'; }).length;
    assert(ops > 90 && ops < 210, 'Plus/Minus-Mischung unplausibel: ' + ops);
  });
  test('Keine direkte Wiederholung (letzte 20 Aufgaben)', function () {
    var recent = [];
    for (var i = 0; i < 200; i++) {
      var t = Gen.generate({ settings: settings({}), stage: 3, recentKeys: recent });
      assert(recent.indexOf(t.key) < 0, 'Wiederholung: ' + t.text);
      recent.push(t.key); if (recent.length > 20) recent.shift();
    }
  });
  test('Nur eine Rechenart aktiv wird respektiert; beide aus → Addition', function () {
    var t = Gen.generate({ settings: settings({ add: false, sub: false }), stage: 2 });
    assert(t.op === 'add', 'Fallback Addition erwartet');
    assert(Store.sanitize({ settings: { add: false, sub: false } }).settings.add === true, 'sanitize muss Addition aktivieren');
  });
  test('Multiple Choice: 4 verschiedene Antworten, richtige enthalten, alle 0–100', function () {
    for (var i = 0; i < 2000; i++) {
      var t = Gen.generate({ settings: settings({}), stage: 1 + (i % 5) });
      var ch = Gen.choices(t, 4);
      assert(ch.length === 4, 'Anzahl ' + ch.length);
      assert(ch.indexOf(t.answer) >= 0, 'richtige fehlt');
      ch.forEach(function (v, j) {
        assert(ch.indexOf(v) === j, 'doppelt bei ' + t.text + ': ' + ch.join(','));
        assert(v >= 0 && v <= 100, 'außerhalb: ' + v);
      });
    }
  });
  test('Multiple Choice 47 + 28 enthält typische Fehler 65 oder 85', function () {
    var ch = Gen.choices(Gen.makeTask('add', 47, 28), 4);
    assert(ch.indexOf(75) >= 0 && (ch.indexOf(65) >= 0 || ch.indexOf(85) >= 0), ch.join(','));
  });
  test('Hinweis 54 − 27: „Rechne zuerst 54 − 20.“ / „Jetzt noch 7 …“', function () {
    var h = Gen.hints(Gen.makeTask('sub', 54, 27));
    assert(h.hint1.indexOf('54 − 20') >= 0, h.hint1);
    assert(h.hint2.indexOf('34') >= 0 && h.hint2.indexOf('7') >= 0, h.hint2);
    assert(h.steps[h.steps.length - 1].indexOf('= 27') >= 0, 'Erklärung endet nicht mit Ergebnis');
  });
  test('Hinweise für viele Aufgaben erzeugbar und schlüssig', function () {
    for (var i = 0; i < 1500; i++) {
      var t = Gen.generate({ settings: settings({}), stage: 1 + (i % 5) });
      var h = Gen.hints(t);
      assert(h.hint1 && h.hint2 && h.steps.length >= 2, 'Hinweis fehlt: ' + t.text);
      assert(!/NaN|undefined|−\s*-|\+ 0\b|noch 0/.test(h.hint1 + h.hint2 + h.steps.join()), 'Hinweis fehlerhaft: ' + t.text + ' → ' + h.hint2);
    }
  });
  test('Fehlermeldungen sind freundlich (kein „Falsch“)', function () {
    for (var i = 0; i < 200; i++) {
      var t = Gen.generate({ settings: settings({}), stage: 3 });
      var m = Gen.wrongMessage(t, t.answer + (i % 7) + 1);
      assert(!/falsch/i.test(m), m);
    }
  });
  test('Punkte und Serien: +10, Bonus bei 5 und 10, Serie endet bei Fehler', function () {
    var s = Store.defaults(), t = Gen.makeTask('add', 3, 4), day = '2026-01-01';
    for (var i = 1; i <= 4; i++) Game.registerCorrect(s, t, 1, 1000, day);
    assert(s.progress.points === 40 && s.progress.streak === 4, 'nach 4: ' + s.progress.points);
    var r5 = Game.registerCorrect(s, t, 1, 1000, day);
    assert(r5.bonus === 25 && s.progress.points === 75, 'Bonus 5');
    for (i = 6; i <= 10; i++) r5 = Game.registerCorrect(s, t, 1, 1000, day);
    assert(r5.bonus === 50 && s.progress.bestStreak === 10, 'Bonus 10');
    var before = s.progress.points;
    Game.registerWrong(s, t, 1, day);
    assert(s.progress.streak === 0 && s.progress.points === before, 'kein Abzug, Serie 0');
    var r = Game.registerCorrect(s, t, 2, 1000, day);
    assert(r.points === 5 && s.progress.streak === 0, 'zweiter Versuch 5 Punkte');
    assert(s.stats.tasks === 11 && s.stats.correctFirst === 10 && s.stats.wrongAttempts === 1, 'Statistik');
    assert(s.stats.days[day].tasks === 11, 'Tagesstatistik');
  });
  test('Level-Abschluss: Sterne, Bonus nur einmal, Freischaltung', function () {
    var s = Store.defaults();
    assert(Game.isLevelUnlocked(s.progress, 0, 1) && !Game.isLevelUnlocked(s.progress, 0, 2), 'Start');
    assert(Game.completeLevel(s, 0, 2, 10, 10) === null, 'gesperrtes Level darf nicht abschließbar sein');
    var r = Game.completeLevel(s, 0, 1, 10, 10);
    assert(r.stars === 3 && r.bonus === 50 && r.firstTime, 'erstes Mal');
    var r2 = Game.completeLevel(s, 0, 1, 5, 10);
    assert(r2.bonus === 0 && !r2.firstTime && Game.levelStars(s.progress, 0, 1) === 3, 'kein Doppelbonus, Sterne bleiben');
    assert(Game.isLevelUnlocked(s.progress, 0, 2), 'Level 2 frei');
    assert(Game.starsFor(7, 10) === 2 && Game.starsFor(6, 10) === 1 && Game.starsFor(9, 10) === 3, 'Sternegrenzen');
  });
  test('Schatztruhen: nach Level 3 und 5, nur einmal öffnbar, nächste Welt frei', function () {
    var s = Store.defaults();
    for (var l = 1; l <= 3; l++) Game.completeLevel(s, 0, l, 8, 10);
    assert(Game.chestState(s.progress, 0, 1) === 'ready', 'Truhe 1 bereit');
    var o = Game.openChest(s, 0, 1);
    assert(o && o.item === 'klee' && s.progress.items.length === 1, 'Gegenstand');
    assert(Game.openChest(s, 0, 1) === null, 'Truhe doppelt geöffnet');
    assert(!Game.isWorldUnlocked(s.progress, 1), 'Welt 2 noch gesperrt');
    Game.completeLevel(s, 0, 4, 8, 10); var r = Game.completeLevel(s, 0, 5, 8, 10);
    assert(r.chest === 2, 'Welt-Truhe gemeldet');
    var o2 = Game.openChest(s, 0, 2);
    assert(o2.unlockedWorld === 1 && Game.isWorldUnlocked(s.progress, 1) && s.progress.badges[0] === 'w1', 'Welt 2 frei + Abzeichen');
    var pts = s.progress.points;
    assert(Game.openChest(s, 0, 2) === null && s.progress.points === pts, 'keine Doppelbelohnung');
  });
  test('Speichern: ungültige Daten führen nicht zum Absturz', function () {
    var bad = [null, 42, 'x', [], { settings: 'kaputt' }, { progress: { points: -5, levels: { 'w9-l1': 1, 'w1-l1': { stars: 99, done: 'ja' } } } },
      { stats: { tasks: NaN, days: { 'gestern': 1 }, cats: { 'hack': {} } } }, { progress: { points: 1e99, items: [1, 'klee', 'klee'] } }];
    bad.forEach(function (b) {
      var s = Store.sanitize(b);
      assert(s.settings.range === 100 && s.progress.points >= 0 && s.progress.points <= 1e9, 'Default');
    });
    var s2 = Store.sanitize({ progress: { levels: { 'w1-l1': { stars: 99, done: true } }, items: ['klee', 'klee', 3] } });
    assert(s2.progress.levels['w1-l1'].stars === 3 && s2.progress.items.length === 1, 'Werte begrenzt');
  });
  test('Speichern und Laden ergibt identischen Stand', function () {
    var s = Store.defaults();
    Game.registerCorrect(s, Gen.makeTask('add', 12, 9), 1, 3000, '2026-02-02');
    Game.completeLevel(s, 0, 1, 9, 10);
    s.settings.range = 50; s.settings.answerMode = 'mc';
    var again = Store.sanitize(JSON.parse(JSON.stringify(s)));
    assert(JSON.stringify(again) === JSON.stringify(s), 'Unterschied nach Laden');
  });
  test('Zurücksetzen behält Einstellungen', function () {
    var s = Store.defaults(); s.settings.range = 20; s.progress.points = 500;
    var r = Store.resetProgress(s);
    assert(r.progress.points === 0 && r.settings.range === 20, 'Reset');
  });
  test('Adaptive Logik: Schwächen werden erkannt und häufiger geübt', function () {
    var cats = { 'sub|z|50': { n: 10, wrong: 6, time: 200000 }, 'add|o|20': { n: 30, wrong: 1, time: 150000 } };
    var weak = Gen.weakCategories(cats);
    assert(weak[0] === 'sub|z|50' && weak.indexOf('add|o|20') < 0, weak.join());
    var ts = many({ settings: settings({}), stage: 3, weakCats: weak }, 400);
    var n = ts.filter(function (t) { return t.cat === 'sub|z|50'; }).length;
    assert(n > 80 && n < 250, 'nicht zu aggressiv/zu schwach: ' + n);
  });
  test('Automatische Stufe passt sich moderat an', function () {
    var s = Store.defaults();
    assert(Game.stageFor(s, 1) === 2, 'Basis');
    s.progress.recent = [true, true, true, true, true, true, true, true, true, true];
    assert(Game.stageFor(s, 1) === 3, 'hoch');
    s.progress.recent = [false, false, false, false, false, true, true, true, true, true];
    assert(Game.stageFor(s, 0) === 1, 'nicht unter 1');
  });


  /* =====================================================================
     Version 2
     ===================================================================== */
  function memStore(init) {
    var m = {}; for (var k in (init || {})) m[k] = init[k];
    return { data: m, getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); }, removeItem: function (k) { delete m[k]; } };
  }
  var V1 = root.MA_FIXTURE_V1;

  test('Version: App 2.0.0, Speicherschema 2', function () {
    assert(MA.VERSION && MA.VERSION.app === '2.0.0' && MA.VERSION.schema === 2 && Store.SCHEMA === 2, 'Versionsangaben');
  });
  test('Migration: echter V1-Spielstand → V2, alle Daten erhalten', function () {
    assert(V1 && V1.version === 1, 'V1-Testdatei fehlt');
    var raw = JSON.stringify(V1), st = memStore({ 'matheAbenteuer.v1': raw });
    var s = Store.load(st), info = Store.lastLoad();
    assert(info.source === 'v1' && info.migrated && info.backupCreated, 'Migration nicht erkannt');
    assert(s.version === 2 && s.meta.migratedFrom === 1, 'Schema 2 / Herkunft');
    assert(s.progress.points === V1.progress.points, 'Punkte');
    assert(s.progress.streak === V1.progress.streak && s.progress.bestStreak === V1.progress.bestStreak, 'Serie');
    assert(JSON.stringify(s.progress.levels) === JSON.stringify(V1.progress.levels), 'Level');
    assert(s.progress.chestsOpened.join() === V1.progress.chestsOpened.join(), 'Truhen');
    assert(s.progress.items.join() === V1.progress.items.join(), 'Gegenstände');
    assert(s.progress.badges.join() === V1.progress.badges.join(), 'Badges');
    assert(s.progress.worldsUnlocked === V1.progress.worldsUnlocked, 'Welten');
    assert(s.stats.tasks === V1.stats.tasks && s.stats.correctFirst === V1.stats.correctFirst && s.stats.wrongAttempts === V1.stats.wrongAttempts, 'Statistik');
    assert(JSON.stringify(s.stats.cats) === JSON.stringify(V1.stats.cats) && JSON.stringify(s.stats.days) === JSON.stringify(V1.stats.days), 'Fehlerschwerpunkte/Tage');
    ['range', 'answerMode', 'sound', 'roundLength', 'hints', 'animations', 'difficulty', 'carry'].forEach(function (k) {
      assert(s.settings[k] === V1.settings[k], 'Einstellung ' + k);
    });
    assert(s.settings.theme === 'light' && s.settings.tempo === 'off' && s.settings.area === 'addsub', 'neue Standardwerte');
    assert(s.stats.ops.add.n + s.stats.ops.sub.n === V1.stats.tasks, 'Rechenarten aus V1 abgeleitet');
    assert(st.data['matheAbenteuer.v1.backup-before-v2'] === raw, 'Backup unverändert');
    assert(st.data['matheAbenteuer.v1'] === raw, 'V1-Feld unverändert');
    assert(JSON.parse(st.data['matheAbenteuer.v2']).version === 2, 'als V2 gespeichert');
  });
  test('Migration: Backup wird nicht bei jedem Start überschrieben', function () {
    var st = memStore({ 'matheAbenteuer.v1': JSON.stringify(V1), 'matheAbenteuer.v1.backup-before-v2': 'ALT' });
    Store.load(st);
    assert(st.data['matheAbenteuer.v1.backup-before-v2'] === 'ALT', 'Backup überschrieben');
    var again = Store.load(st);
    assert(Store.lastLoad().source === 'v2' && !Store.lastLoad().backupCreated && again.progress.points === V1.progress.points, 'zweiter Start lädt V2');
  });
  test('Migration: beschädigter V2-Stand fällt auf V1 zurück, leerer Speicher startet neu', function () {
    var st = memStore({ 'matheAbenteuer.v1': JSON.stringify(V1), 'matheAbenteuer.v2': '{kaputt' });
    var s = Store.load(st);
    assert(s.progress.points === V1.progress.points && st.data['matheAbenteuer.v2.unlesbar'] === '{kaputt', 'Rückfall');
    var n = Store.load(memStore());
    assert(Store.lastLoad().source === 'new' && n.progress.points === 0 && n.version === 2, 'Neustart');
  });
  test('V2-Einstellungen werden geprüft (Reihen, Darstellung, Tempo)', function () {
    var s = Store.sanitize({ settings: { rows: [0, 11, 'x', 3, 3, 7], rowMode: 'select', theme: 'pink', tempo: 'turbo', countdownSec: 5, mul: false, div: false } });
    assert(s.settings.rows.join() === '3,7' && s.settings.rowMode === 'select', 'Reihen');
    assert(s.settings.theme === 'light' && s.settings.tempo === 'off' && s.settings.countdownSec === 30, 'Darstellung/Tempo');
    assert(s.settings.mul === true, 'Mal oder Geteilt bleibt an');
    var e = Store.sanitize({ settings: { rows: [] } });
    assert(e.settings.rows.length === 10, 'leere Auswahl → alle');
  });
  test('Export enthält Schema, Zeitstempel und alle Bereiche; Import erkennt V1 und V2', function () {
    var s = Store.defaults();
    Game.registerCorrect(s, Gen.makeTask('mul', 7, 8, false, 8), 1, 2000, '2026-10-01');
    Game.recordTempo(s, { kind: 'countdown', area: 'muldiv', sec: 60, sig: 'x', tasks: 5, correct: 4, ms: 60000 });
    var ex = Store.exportData(s);
    assert(ex.schema === 2 && ex.app === 'mathe-abenteuer-funki' && /^\d{4}-/.test(ex.exportedAt) && ex.appVersion === '2.0.0', 'Kopf');
    assert(ex.data.settings && ex.data.progress && ex.data.stats && ex.data.tempo && ex.data.stats.mulCats['mul|8'], 'Inhalt');
    var back = Store.parseImport(JSON.stringify(ex));
    assert(back.ok && back.schema === 2 && back.state.stats.mulCats['mul|8'].n === 1 && back.state.tempo.rounds === 1, 'V2-Import');
    var v1 = Store.parseImport(JSON.stringify(V1));
    assert(v1.ok && v1.schema === 1 && v1.state.progress.points === V1.progress.points && v1.state.meta.migratedFrom === 1, 'V1-Import');
  });
  test('Import lehnt ungültige Dateien ab', function () {
    ['', 'kein json', '42', '[]', '{}', JSON.stringify({ app: 'mathe-abenteuer-fino', schema: 2, data: { settings: {}, progress: {} } }),
      JSON.stringify({ app: 'mathe-abenteuer-funki', schema: 3, data: { settings: {}, progress: {} } }),
      JSON.stringify({ settings: {} }), JSON.stringify({ version: 9, settings: {}, progress: {} })].forEach(function (t) {
      assert(!Store.parseImport(t).ok, 'angenommen: ' + t.slice(0, 40));
    });
  });
  test('Reset löscht auch Einmaleins- und Tempo-Daten, Einstellungen bleiben', function () {
    var s = Store.defaults(); s.settings.theme = 'dark'; s.settings.rows = [3]; s.settings.rowMode = 'select';
    s.progress.mul.medals.push('3'); s.tempo.rounds = 4; s.stats.mulCats['mul|3'] = { n: 1, wrong: 0, time: 1 };
    var r = Store.resetProgress(s);
    assert(r.progress.mul.medals.length === 0 && r.tempo.rounds === 0 && !r.stats.mulCats['mul|3'], 'nicht gelöscht');
    assert(r.settings.theme === 'dark' && r.settings.rows.join() === '3', 'Einstellungen verloren');
  });

  test('Multiplikation: Reihen 1–10 vollständig, richtige Reihenfolge und Ergebnisse', function () {
    for (var r = 1; r <= 10; r++) {
      var seq = Gen.rowSequence(r, 'mul');
      assert(seq.length === 10, 'zehn Aufgaben');
      seq.forEach(function (t, i) { assert(t.a === i + 1 && t.b === r && t.answer === (i + 1) * r && t.text === (i + 1) + ' × ' + r, t.text); });
    }
  });
  test('Multiplikation: Auswahl einzelner/mehrerer/aller Reihen und gemischt', function () {
    function opts(o) { var s = Store.defaults().settings; s.div = false; for (var k in o) s[k] = o[k]; return s; }
    many({ settings: opts({ rowMode: 'select', rows: [7] }) }, 0);
    for (var i = 0; i < 300; i++) { var t = Gen.generateMulDiv({ settings: opts({ rowMode: 'select', rows: [7] }) }); assert(t.op === 'mul' && t.row === 7 && (t.a === 7 || t.b === 7) && t.answer === t.a * t.b, 'einzeln ' + t.text); }
    var seen = {};
    for (i = 0; i < 600; i++) { t = Gen.generateMulDiv({ settings: opts({ rowMode: 'select', rows: [3, 4, 9] }) }); assert([3, 4, 9].indexOf(t.row) >= 0, 'mehrere ' + t.text); seen[t.row] = 1; }
    assert(Object.keys(seen).length === 3, 'alle gewählten Reihen kommen vor');
    ['all', 'mixed'].forEach(function (m) {
      var rows = {};
      for (var j = 0; j < 2000; j++) { var u = Gen.generateMulDiv({ settings: opts({ rowMode: m }) }); rows[u.row] = 1; assert(u.answer === u.a * u.b && u.answer >= 1 && u.answer <= 100, u.text); }
      assert(Object.keys(rows).length === 10, m + ': nicht alle Reihen');
    });
  });
  test('Division: nur exakt, kein Rest, nie durch 0, Ergebnis 1–10', function () {
    var s = Store.defaults().settings; s.mul = false;
    for (var i = 0; i < 3000; i++) {
      var t = Gen.generateMulDiv({ settings: s });
      assert(t.op === 'div' && t.b >= 1 && t.b <= 10, 'Teiler ' + t.text);
      assert(t.a % t.b === 0 && t.answer === t.a / t.b && t.answer >= 1 && t.answer <= 10 && t.a <= 100, 'Rest/Ergebnis ' + t.text);
    }
    for (var r = 1; r <= 10; r++) Gen.rowSequence(r, 'div').forEach(function (u, k) {
      assert(u.a === (k + 1) * r && u.b === r && u.answer === k + 1 && u.text === u.a + ' ÷ ' + r, u.text);
    });
  });
  test('Mal & Geteilt gemischt: beide Rechenarten, keine Dreierfolge gleicher Art erzwungen', function () {
    var s = Store.defaults().settings, ops = { mul: 0, div: 0 }, last = [];
    for (var i = 0; i < 400; i++) { var t = Gen.generateMulDiv({ settings: s, lastOps: last }); ops[t.op]++; last.push(t.op); if (last.length > 5) last.shift(); }
    assert(ops.mul > 120 && ops.div > 120, 'Mischung ' + ops.mul + '/' + ops.div);
  });
  test('Einmaleins Multiple Choice: 4 verschiedene, richtige dabei, positiv', function () {
    var s = Store.defaults().settings;
    for (var i = 0; i < 2000; i++) {
      var t = Gen.generateMulDiv({ settings: s }), ch = Gen.choices(t, 4);
      assert(ch.length === 4 && ch.indexOf(t.answer) >= 0, 'Anzahl/richtig ' + t.text);
      ch.forEach(function (v, j) { assert(ch.indexOf(v) === j && v >= 1 && v <= 100, 'Wert ' + v + ' bei ' + t.text); });
    }
  });
  test('Einmaleins Hinweise für alle 200 Aufgaben schlüssig', function () {
    for (var r = 1; r <= 10; r++) ['mul', 'div'].forEach(function (op) {
      Gen.rowSequence(r, op).concat(op === 'mul' ? Gen.rowSequence(r, 'mul').map(function (t) { return Gen.makeTask('mul', t.b, t.a, false, r); }) : []).forEach(function (t) {
        var h = Gen.hints(t), all = h.hint1 + h.hint2 + h.steps.join();
        assert(h.hint1 && h.hint2 && h.steps.length >= 2 && !/NaN|undefined|Infinity/.test(all), 'Hinweis ' + t.text);
        assert(h.steps[h.steps.length - 1].indexOf('= ' + t.answer) >= 0, 'Erklärung endet nicht mit Ergebnis: ' + t.text);
        assert(!/falsch/i.test(Gen.wrongMessage(t, t.answer + 1)), 'freundlich');
      });
    });
  });
  test('Adaptive Reihen: schwache Reihe moderat häufiger', function () {
    var s = Store.defaults().settings; s.div = false;
    var weak = Gen.weakCategories({ 'mul|7': { n: 10, wrong: 6, time: 90000 }, 'mul|2': { n: 20, wrong: 0, time: 40000 } });
    assert(weak[0] === 'mul|7', weak.join());
    var n = 0; for (var i = 0; i < 1000; i++) if (Gen.generateMulDiv({ settings: s, weakCats: weak }).row === 7) n++;
    assert(n > 200 && n < 450, 'Anteil 7er-Reihe ' + n);
  });
  test('Statistik: Mal/Geteilt getrennt erfasst, Plus/Minus-Kategorien unverändert', function () {
    var s = Store.defaults(), d = '2026-10-02';
    Game.registerCorrect(s, Gen.makeTask('mul', 6, 7, false, 7), 1, 3000, d);
    Game.registerWrong(s, Gen.makeTask('div', 42, 7, false, 7), 1, d);
    Game.registerCorrect(s, Gen.makeTask('div', 42, 7, false, 7), 2, 5000, d);
    Game.registerCorrect(s, Gen.makeTask('add', 3, 4), 1, 1000, d);
    assert(s.stats.mulCats['mul|7'].n === 1 && s.stats.mulCats['div|7'].wrong === 1, 'Reihen');
    assert(Object.keys(s.stats.cats).join() === 'add|o|20', 'Plus/Minus-Kategorien');
    assert(s.stats.ops.mul.first === 1 && s.stats.ops.div.wrong === 1 && s.stats.ops.add.n === 1 && s.stats.tasks === 3, 'Rechenarten');
    assert(Gen.categoryLabel('div|7') === 'Geteilt: 7er-Reihe', 'Bezeichnung');
  });
  test('Reihentraining: Sterne verbessern, Medaille nur einmal', function () {
    var s = Store.defaults();
    var a = Game.completeRow(s, 8, 'mul', 10, 10);
    assert(a.stars === 3 && !a.medal, 'Mal 3 Sterne');
    var b = Game.completeRow(s, 8, 'div', 6, 10);
    assert(b.stars === 1 && Game.rowStars(s.progress, 8).div === 1, 'Geteilt 1 Stern');
    var c = Game.completeRow(s, 8, 'div', 10, 10);
    assert(c.medal && s.progress.mul.medals.join() === '8', 'Medaille');
    var d2 = Game.completeRow(s, 8, 'div', 5, 10);
    assert(!d2.medal && Game.rowStars(s.progress, 8).div === 3 && s.progress.mul.medals.length === 1, 'keine Verschlechterung/Doppelmedaille');
    assert(Game.completeRow(s, 11, 'mul', 10, 10) === null && Game.completeRow(s, 0, 'mul', 10, 10) === null, 'ungültige Reihe');
  });
  test('Tempo: Countdown-Rekord = mehr richtig, Stoppuhr-Rekord = schneller, getrennt nach Modus', function () {
    var s = Store.defaults();
    var o = { kind: 'countdown', area: 'addsub', sec: 120, sig: 'as' };
    function cd(c) { return Game.recordTempo(s, { kind: o.kind, area: o.area, sec: o.sec, sig: o.sig, tasks: c + 2, correct: c, ms: 120000 }); }
    var r1 = cd(10), r2 = cd(8), r3 = cd(12);
    assert(r1.best && r1.firstRecord && !r2.best && r3.best && r3.prev === 10, 'Countdown');
    var other = Game.recordTempo(s, { kind: 'countdown', area: 'addsub', sec: 60, sig: 'as', tasks: 3, correct: 3, ms: 60000 });
    assert(other.firstRecord, 'andere Dauer = eigener Rekord');
    function sw(ms) { return Game.recordTempo(s, { kind: 'stopwatch', area: 'row', count: 10, sig: '8:mul', tasks: 10, correct: 10, ms: ms }); }
    var w1 = sw(40000), w2 = sw(45000), w3 = sw(30000);
    assert(w1.best && !w2.best && w3.best && w3.prev === 40000, 'Stoppuhr');
    assert(s.tempo.rounds === 7 && s.tempo.history.length === 7, 'Verlauf');
    for (var i = 0; i < 40; i++) sw(50000 + i);
    assert(s.tempo.history.length === 30, 'Verlauf begrenzt');
    var empty = Game.recordTempo(s, { kind: 'countdown', area: 'muldiv', sec: 60, sig: 'z', tasks: 0, correct: 0, ms: 60000 });
    assert(!empty.best, 'leere Runde ist kein Rekord');
    assert(Store.sanitize(JSON.parse(JSON.stringify(s))).tempo.best[r3.key].v === 12, 'Bestwerte speicherbar');
  });
  test('Regression: alle 25 Level, 10 Truhen und 5 Welten durchspielbar wie in Version 1', function () {
    var s = Store.defaults();
    for (var w = 0; w < 5; w++) {
      for (var l = 1; l <= 5; l++) { var r = Game.completeLevel(s, w, l, 10, 10); assert(r && r.firstTime, 'Level ' + (w + 1) + '-' + l); }
      assert(Game.openChest(s, w, 1) && Game.openChest(s, w, 2), 'Truhen Welt ' + (w + 1));
    }
    assert(Game.levelsCompleted(s.progress) === 25 && s.progress.items.length === 10 && s.progress.badges.length === 5 && s.progress.worldsUnlocked === 5, 'Endstand');
    assert(Game.totalStars(s.progress) === 75, 'Sterne');
  });

  root.MA_TEST_RESULTS = results;
})(typeof window !== 'undefined' ? window : globalThis);
