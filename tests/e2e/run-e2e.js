/* Mathe-Abenteuer – automatischer Browser-Test (optional, nur für Entwickler).
   Voraussetzung: Node.js und Playwright (npm install playwright, danach npx playwright install chromium).
   Start im Projektordner:  node tests/e2e/run-e2e.js
   Der Test startet einen eigenen kleinen Webserver, ändert nichts am Projekt und nutzt ein frisches Browserprofil. */
'use strict';
var http = require('http'), fs = require('fs'), path = require('path');
var playwright;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require(path.join(process.env.HOME || '', '.npm-global/lib/node_modules/playwright')); } catch (e2) {
    console.error('Playwright fehlt. Bitte zuerst „npm install playwright“ ausführen.'); process.exit(2);
  }
}
var ROOT = path.join(__dirname, '..', '..');
var TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain' };
vmFixture();
function vmFixture() { require('vm').runInThisContext(fs.readFileSync(path.join(ROOT, 'tests/fixtures/v1-spielstand.js'), 'utf8')); }
var V1 = globalThis.MA_FIXTURE_V1;

var server = http.createServer(function (req, res) {
  var u = decodeURIComponent(req.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  var f = path.join(ROOT, u);
  if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
});

var results = [];
function ok(name, cond, info) { results.push({ name: name, ok: !!cond, info: info }); console.log((cond ? '✔ ' : '✘ ') + name + (cond || info === undefined ? '' : '  → ' + JSON.stringify(info))); }

server.listen(0, async function () {
  var base = 'http://127.0.0.1:' + server.address().port + '/';
  var browser = await playwright.chromium.launch();
  var errors = [], external = [];
  function watch(page) {
    page.on('pageerror', function (e) { errors.push(e.message); });
    page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', function (r) { if (r.url().indexOf(base) !== 0 && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) external.push(r.url()); });
  }
  async function answerLoop(page, max) {
    for (var k = 0; k < (max || 400); k++) {
      var st = await page.evaluate(function () { var s = MA_APP.session(); if (!s || s.finished) return 'done'; if (s.busy || !s.task) return 'busy'; return s.task.answer; });
      if (st === 'done') return;
      if (st === 'busy') { await page.waitForTimeout(120); continue; }
      await page.evaluate(function (a) { MA_APP.submit(String(a)); }, st);
    }
  }
  try {
    var ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, acceptDownloads: true });
    var p = await ctx.newPage(); watch(p);

    /* 1. V1-Spielstand → Migration + Backup */
    await p.addInitScript(function (f) {
      if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('matheAbenteuer.v1', JSON.stringify(f)); }
    }, V1);
    await p.goto(base); await p.waitForTimeout(600);
    var mig = await p.evaluate(function () {
      var s = MA_APP.state(); return { pts: s.progress.points, levels: Object.keys(s.progress.levels).length, items: s.progress.items, badges: s.progress.badges,
        chests: s.progress.chestsOpened, tasks: s.stats.tasks, v: s.version, backup: localStorage.getItem('matheAbenteuer.v1.backup-before-v2'), v1: localStorage.getItem('matheAbenteuer.v1'), v2: !!localStorage.getItem('matheAbenteuer.v2') };
    });
    ok('Migration: Punkte, Level, Truhen, Gegenstände, Badges, Statistik aus V1 übernommen',
      mig.pts === V1.progress.points && mig.levels === Object.keys(V1.progress.levels).length && mig.items.join() === V1.progress.items.join() &&
      mig.badges.join() === V1.progress.badges.join() && mig.chests.join() === V1.progress.chestsOpened.join() && mig.tasks === V1.stats.tasks && mig.v === 2, mig);
    ok('Migration: Backup vorhanden und identisch mit V1-Original', mig.backup === JSON.stringify(V1) && mig.v1 === JSON.stringify(V1) && mig.v2);
    ok('Startbildschirm mit Funki sichtbar', await p.isVisible('#screen-start .mascot-svg'));

    /* 2. Regression Plus/Minus: Welt, Level per Zahlentastatur, Hinweis, Abschluss */
    await p.evaluate(function () { MA_APP.setSetting('answerMode', 'keypad'); });
    await p.click('text=Los geht'); await p.waitForTimeout(350);
    ok('Abenteuerkarte zeigt 5 Welten', (await p.$$('.world-card')).length === 5);
    await p.click('[data-world="1"]'); await p.waitForTimeout(350);
    ok('Levelpfad mit 5 Leveln und 2 Truhen', (await p.$$('#level-path .level-node:not(.chest-node)')).length === 5 && (await p.$$('#level-path .chest-node')).length === 2);
    await p.click('[data-level="2"]'); await p.waitForTimeout(350);
    var task = await p.evaluate(function () { return MA_APP.session().task; });
    var wrong = String(task.answer === 99 ? 98 : task.answer + 1);
    for (var w = 0; w < 2; w++) { for (var d of wrong) await p.tap('#keypad [data-key="' + d + '"]'); await p.tap('#keypad [data-key="ok"]'); await p.waitForTimeout(1000); }
    ok('Plus/Minus: Hinweis nach 2. Fehlversuch', await p.isVisible('#hint-card'));
    for (var d2 of String(task.answer)) await p.tap('#keypad [data-key="' + d2 + '"]');
    await p.tap('#keypad [data-key="ok"]'); await p.waitForTimeout(300);
    ok('Plus/Minus: richtige Antwort per Zahlentastatur', await p.evaluate(function () { return MA_APP.session().done === 1; }));
    await answerLoop(p); await p.waitForTimeout(700);
    ok('Level geschafft-Dialog erscheint', (await p.textContent('#modal-title')).indexOf('Level 2 geschafft') >= 0);
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; MA_APP.go('map', { force: true }); }); await p.waitForTimeout(300);

    /* 3. Mal & Geteilt: Bereichswechsel + Aufgaben-Runde */
    await p.click('[data-area="muldiv"]'); await p.waitForTimeout(300);
    ok('Bereichswechsel: Zauberturm mit 10 Reihenkarten', await p.isVisible('#muldiv-view') && (await p.$$('.row-card')).length === 10);
    await p.click('[data-action="mul-round"]'); await p.waitForTimeout(350);
    var t1 = await p.evaluate(function () { return MA_APP.session().task; });
    ok('Aufgaben-Runde: Mal/Geteilt-Aufgabe korrekt', (t1.op === 'mul' && t1.answer === t1.a * t1.b) || (t1.op === 'div' && t1.a % t1.b === 0 && t1.answer === t1.a / t1.b), t1);
    for (var d3 of String(t1.answer)) await p.tap('#keypad [data-key="' + d3 + '"]');
    await p.tap('#keypad [data-key="ok"]'); await p.waitForTimeout(300);
    ok('Aufgaben-Runde: Eingabe über integrierte Zahlentastatur', await p.evaluate(function () { return MA_APP.session().done === 1; }));
    await answerLoop(p); await p.waitForTimeout(700);
    ok('Aufgaben-Runde: Abschlussdialog mit Sternen', (await p.textContent('#modal-title')).indexOf('Runde geschafft') >= 0 && await p.isVisible('.stars-row'));
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; MA_APP.setSetting('answerMode', 'mc'); MA_APP.startMulRound(); }); await p.waitForTimeout(350);
    var mc = await p.evaluate(function () { var t = MA_APP.session().task; return { a: t.answer, c: Array.from(document.querySelectorAll('#mc .choice')).map(function (b) { return +b.getAttribute('data-choice'); }) }; });
    ok('Multiple Choice für Mal/Geteilt: 4 verschiedene Antworten inkl. richtiger', mc.c.length === 4 && mc.c.indexOf(mc.a) >= 0 && new Set(mc.c).size === 4, mc);
    await p.evaluate(function () { MA_APP.setSetting('answerMode', 'keypad'); document.querySelector('#modal').hidden = true; MA_APP.go('map', { force: true }); }); await p.waitForTimeout(300);

    /* 4. Reihentraining mit nativer Eingabe */
    await p.click('[data-row="8"]'); await p.waitForTimeout(300);
    await p.click('text=Mal üben'); await p.waitForTimeout(400);
    var rowInfo = await p.evaluate(function () {
      var inputs = Array.from(document.querySelectorAll('#rows-list .row-input'));
      return { n: inputs.length, labels: Array.from(document.querySelectorAll('#rows-list .row-task')).map(function (l) { return l.textContent; }),
        focus: document.activeElement && document.activeElement.id, mode: inputs.every(function (i) { return i.getAttribute('inputmode') === 'numeric' && i.type === 'text'; }),
        size: parseFloat(getComputedStyle(inputs[0]).fontSize) };
    });
    ok('Reihentraining: zehn echte Eingabefelder mit inputmode="numeric"', rowInfo.n === 10 && rowInfo.mode, rowInfo);
    ok('Reihentraining: richtige Reihenfolge 1 × 8 … 10 × 8', rowInfo.labels[0] === '1 × 8 =' && rowInfo.labels[9] === '10 × 8 =', rowInfo.labels);
    ok('Reihentraining: erstes Feld hat den Fokus, Schrift ≥ 16 px (kein Zoom)', rowInfo.focus === 'ri-0' && rowInfo.size >= 16, rowInfo);
    await p.keyboard.type('9'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok('Reihentraining: falsche Eingabe bleibt im Feld (Fokus bleibt)', await p.evaluate(function () { return document.activeElement.id === 'ri-0' && document.getElementById('rl-0').classList.contains('is-wrong'); }));
    for (var k = 1; k <= 10; k++) { await p.keyboard.type(String(k * 8)); await p.keyboard.press('Enter'); await p.waitForTimeout(80); if (k === 1) ok('Reihentraining: nach richtiger Antwort springt der Fokus weiter', await p.evaluate(function () { return document.activeElement.id === 'ri-1'; })); }
    await p.waitForTimeout(400);
    ok('Reihentraining: Ergebnis geprüft, Abschlussdialog, Sterne gespeichert',
      (await p.textContent('#modal-title')).indexOf('8er-Reihe geschafft') >= 0 && await p.evaluate(function () { return MA_APP.state().progress.mul.rowStars['8'].mul === 3; }));
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; MA_APP.startRows(4, 'div'); }); await p.waitForTimeout(300);
    var divLabels = await p.evaluate(function () { return Array.from(document.querySelectorAll('#rows-list .row-task')).map(function (l) { return l.textContent; }); });
    ok('Reihentraining Geteilt: 4 ÷ 4 … 40 ÷ 4', divLabels[0] === '4 ÷ 4 =' && divLabels[9] === '40 ÷ 4 =', divLabels);
    await p.click('#ri-0'); await p.keyboard.type('1'); await p.click('#btn-rows-check'); await p.waitForTimeout(100);
    ok('Reihentraining: Knopf „Prüfen & weiter“ funktioniert', await p.evaluate(function () { return MA_APP.rows().done === 1 && document.activeElement.id === 'ri-1'; }));
    await p.evaluate(function () { MA_APP.go('map', { force: true }); }); await p.waitForTimeout(200);

    /* 5. Tempo: Countdown und Stoppuhr */
    await p.evaluate(function () { MA_APP.setSetting('tempo', 'countdown'); MA_APP.setSetting('countdownSec', 30); MA_APP.go('map', { force: true }); }); await p.waitForTimeout(200);
    ok('Tempo-Karte erscheint nur bei aktivem Tempo-Modus', await p.isVisible('[data-action="tempo"]'));
    await p.click('[data-action="tempo"]'); await p.waitForTimeout(300);
    ok('Countdown: Uhr läuft rückwärts', /0:(29|30)/.test(await p.textContent('#tempo-clock-val')));
    await answerLoop(p, 6);
    await p.evaluate(function () { MA_APP.session().tempo.startAt -= 31000; }); await p.waitForTimeout(800);
    var cd = await p.evaluate(function () { return { title: document.getElementById('modal-title') && document.getElementById('modal-title').textContent, rounds: MA_APP.state().tempo.rounds, txt: document.getElementById('modal-box').textContent }; });
    ok('Countdown: endet sauber mit Aufgaben, Treffern, Quote, bester Serie', cd.title === 'Zeit ist um!' && cd.rounds === 1 && /Aufgaben/.test(cd.txt) && /Trefferquote/.test(cd.txt) && /beste Serie/.test(cd.txt), cd);
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; MA_APP.setSetting('tempo', 'stopwatch'); MA_APP.setSetting('roundLength', 5); MA_APP.startTempo('addsub'); }); await p.waitForTimeout(300);
    await answerLoop(p); await p.waitForTimeout(600);
    var sw = await p.evaluate(function () { var b = MA_APP.state().tempo.best; return { title: document.getElementById('modal-title').textContent, txt: document.getElementById('modal-box').textContent, keys: Object.keys(b) }; });
    ok('Stoppuhr: Zeit, Aufgabenanzahl, Trefferquote und Bestwert gespeichert', sw.title === 'Geschafft!' && /benötigte Zeit/.test(sw.txt) && sw.keys.some(function (k) { return k.indexOf('sw|addsub|5') === 0; }), sw);
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; MA_APP.startRows(3, 'mul'); }); await p.waitForTimeout(300);
    ok('Reihentraining mit Stoppuhr zeigt die Zeit', await p.isVisible('#rows-clock'));
    for (var k2 = 1; k2 <= 10; k2++) { await p.keyboard.type(String(k2 * 3)); await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
    await p.waitForTimeout(300);
    ok('Reihentraining Stoppuhr: Bestzeit gespeichert', await p.evaluate(function () { return !!MA_APP.state().tempo.best['sw|row|10|3:mul']; }));
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; MA_APP.setSetting('tempo', 'off'); MA_APP.setSetting('roundLength', 10); MA_APP.go('start', { force: true }); }); await p.waitForTimeout(300);

    /* 6. Dark Mode */
    await p.evaluate(function () { MA_APP.go('parents', { force: true }); }); await p.waitForTimeout(300);
    await p.click('button[data-set="theme"][data-val="&quot;dark&quot;"]').catch(async function () { await p.evaluate(function () { document.querySelector('button[data-set="theme"]:nth-child(2)').click(); }); });
    await p.waitForTimeout(250);
    var dm = await p.evaluate(function () {
      function lum(c) { var m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2]; }
      function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
      var body = getComputedStyle(document.querySelector('#screen-parents'));
      var card = getComputedStyle(document.querySelector('.setting-group'));
      var lab = getComputedStyle(document.querySelector('.setting-label'));
      return { theme: document.documentElement.getAttribute('data-theme'), saved: JSON.parse(localStorage.getItem('matheAbenteuer.v2')).settings.theme,
        bg: body.backgroundColor, contrast: ratio(lab.color, card.backgroundColor) };
    });
    ok('Dark Mode: sofort aktiv (ohne Neuladen) und gespeichert', dm.theme === 'dark' && dm.saved === 'dark', dm);
    ok('Dark Mode: gut lesbar (Kontrast Text/Karte ≥ 7:1)', dm.contrast >= 7, dm);
    await p.reload(); await p.waitForTimeout(500);
    ok('Dark Mode: bleibt nach Neustart erhalten', await p.evaluate(function () { return document.documentElement.getAttribute('data-theme') === 'dark'; }));
    var screens = ['start', 'map', 'collection', 'parents'], darkOk = true;
    for (var sc of screens) { await p.evaluate(function (s) { MA_APP.go(s, { force: true }); }, sc); await p.waitForTimeout(150);
      var bgc = await p.evaluate(function (s) { return getComputedStyle(document.getElementById('screen-' + s)).backgroundColor; }, sc);
      if (!/rgb\((1\d|2\d|3\d),/.test(bgc)) darkOk = false; }
    ok('Dark Mode: auf allen Hauptbildschirmen angewendet', darkOk);
    await p.evaluate(function () { MA_APP.setSetting('theme', 'light'); });

    /* 7. Elternbereich: Version, Export, Import, Reset */
    await p.evaluate(function () { MA_APP.go('parents', { force: true }); }); await p.waitForTimeout(250);
    ok('Elternbereich zeigt „Version 2.0.0“', (await p.textContent('#tab-settings')).indexOf('Version 2.0.0') >= 0);
    var dlP = p.waitForEvent('download', { timeout: 5000 }).catch(function () { return null; });
    await p.click('#btn-export');
    var dl = await dlP, exp = null;
    if (dl) { var fp = await dl.path(); exp = JSON.parse(fs.readFileSync(fp, 'utf8')); }
    ok('Export: JSON mit Schema, Zeitstempel, Einstellungen, Fortschritt, Statistik, Tempo, 1×1', exp && exp.schema === 2 && exp.exportedAt && exp.data.settings && exp.data.progress.mul && exp.data.stats.mulCats && exp.data.tempo, exp && Object.keys(exp));
    var tmp = path.join(require('os').tmpdir(), 'funki-v1-import.json');
    var v1mod = JSON.parse(JSON.stringify(V1)); v1mod.progress.points = 4321; fs.writeFileSync(tmp, JSON.stringify(v1mod));
    await p.setInputFiles('#import-file', tmp); await p.waitForTimeout(400);
    var impTitle = await p.textContent('#modal-title');
    await p.click('text=Importieren >> nth=-1'); await p.waitForTimeout(300);
    var imp = await p.evaluate(function () { return { pts: MA_APP.state().progress.points, backup: !!localStorage.getItem('matheAbenteuer.backup-before-import') }; });
    ok('Import: V1-Datei wird erkannt, migriert und übernommen; alter Stand gesichert', /importieren/.test(impTitle) && imp.pts === 4321 && imp.backup, imp);
    var tmp2 = path.join(require('os').tmpdir(), 'funki-fremd.json');
    fs.writeFileSync(tmp2, '{"app":"etwas-anderes","schema":2,"data":{"settings":{},"progress":{}}}');
    await p.evaluate(function () { document.getElementById('import-file').value = ''; });
    await p.setInputFiles('#import-file', tmp2); await p.waitForTimeout(400);
    ok('Import: fremde/ungültige Datei wird abgelehnt, Stand bleibt', (await p.textContent('#modal-title')).indexOf('nicht möglich') >= 0 && await p.evaluate(function () { return MA_APP.state().progress.points === 4321; }));
    await p.evaluate(function () { document.querySelector('#modal').hidden = true; }); await p.waitForTimeout(100);
    await p.evaluate(function () { MA_APP.go('parents', { force: true }); }); await p.waitForTimeout(200);
    await p.click('#btn-reset'); await p.waitForTimeout(200); await p.click('#reset-yes'); await p.waitForTimeout(100); await p.click('#reset-yes'); await p.waitForTimeout(250);
    var rs = await p.evaluate(function () { var s = MA_APP.state(); return { pts: s.progress.points, rounds: s.tempo.rounds, mul: Object.keys(s.progress.mul.rowStars).length, range: s.settings.range }; });
    ok('Reset: Fortschritt inkl. Einmaleins/Tempo gelöscht, Einstellungen behalten', rs.pts === 0 && rs.rounds === 0 && rs.mul === 0 && rs.range === V1.settings.range, rs);

    /* 8. Offline */
    await p.evaluate(function () { return navigator.serviceWorker.ready; }); await p.waitForTimeout(400);
    var cache = await p.evaluate(async function () { var keys = await caches.keys(); var c = await caches.open(keys[0]); var req = await c.keys(); return { keys: keys, n: req.length, urls: req.map(function (r) { return new URL(r.url).pathname; }) }; });
    var sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8'), list = eval(sw.match(/var FILES = (\[[\s\S]*?\]);/)[1]);
    ok('Offline-Cache v2.0.0 enthält alle ' + list.length + ' Dateien', cache.keys.join() === 'mathe-abenteuer-v2.0.0' && cache.n === list.length, cache);
    await ctx.setOffline(true);
    await p.reload(); await p.waitForTimeout(700);
    await p.evaluate(function () { MA_APP.go('map', { force: true }); }); await p.waitForTimeout(200);
    await p.click('[data-area="muldiv"]'); await p.waitForTimeout(200);
    var img = await p.evaluate(function () { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(true); }; i.onerror = function () { r(false); }; i.src = 'assets/images/zauberturm.svg'; }); });
    await p.evaluate(function () { MA_APP.startRows(6, 'mul'); }); await p.waitForTimeout(200);
    ok('Offline-Neustart: App, Zauberturm-Bild und Reihentraining funktionieren', img && await p.isVisible('#ri-0'));
    await ctx.setOffline(false);
    await ctx.close();

    /* 9. Hoch- und Querformat */
    var layoutOk = true, info = [];
    for (var vp of [[768, 1024], [820, 1180], [1024, 768], [1180, 820]]) {
      var c2 = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, hasTouch: true }); var q = await c2.newPage(); watch(q);
      await q.goto(base); await q.waitForTimeout(400);
      for (var s2 of ['start', 'map', 'collection', 'parents']) {
        await q.evaluate(function (s) { MA_APP.go(s, { force: true }); }, s2); await q.waitForTimeout(120);
        var hs = await q.evaluate(function () { return document.documentElement.scrollWidth > window.innerWidth || Array.from(document.querySelectorAll('.screen.active .scroll')).some(function (x) { return x.scrollWidth > x.clientWidth + 1; }); });
        if (hs) { layoutOk = false; info.push(vp.join('x') + ' ' + s2); }
      }
      await q.evaluate(function () { MA_APP.state().settings.area = 'muldiv'; MA_APP.go('map', { force: true }); }); await q.waitForTimeout(120);
      if (await q.evaluate(function () { return Array.from(document.querySelectorAll('.screen.active .scroll')).some(function (x) { return x.scrollWidth > x.clientWidth + 1; }); })) { layoutOk = false; info.push(vp.join('x') + ' muldiv'); }
      await q.evaluate(function () { MA_APP.startMulRound(); }); await q.waitForTimeout(200);
      var fits = await q.evaluate(function () { var k = document.querySelector('#keypad .key-ok').getBoundingClientRect(); return k.bottom <= window.innerHeight + 1; });
      if (!fits) { layoutOk = false; info.push(vp.join('x') + ' Tastatur'); }
      await q.evaluate(function () { MA_APP.startRows(9, 'mul'); }); await q.waitForTimeout(200);
      if (await q.evaluate(function () { var s = document.getElementById('rows-scroll'); return s.scrollWidth > s.clientWidth + 1; })) { layoutOk = false; info.push(vp.join('x') + ' Reihen'); }
      await c2.close();
    }
    ok('Hoch- und Querformat (iPad-Größen): keine horizontale Scrollleiste, Zahlentastatur passt', layoutOk, info);

    ok('Keine JavaScript-Fehler', errors.length === 0, errors);
    ok('Keine externen Anfragen', external.length === 0, external);
  } catch (e) {
    ok('Testlauf ohne Abbruch', false, String(e && e.stack || e));
  }
  await browser.close(); server.close();
  var bad = results.filter(function (r) { return !r.ok; });
  console.log('\n' + (results.length - bad.length) + ' von ' + results.length + ' Browser-Tests bestanden.');
  process.exit(bad.length ? 1 : 0);
});
