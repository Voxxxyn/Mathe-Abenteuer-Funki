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

  root.MA_TEST_RESULTS = results;
})(typeof window !== 'undefined' ? window : globalThis);
