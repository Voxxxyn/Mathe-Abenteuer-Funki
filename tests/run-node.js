/* Tests ohne Browser ausführen: node tests/run-node.js */
var fs = require('fs'), path = require('path'), vm = require('vm');
['js/version.js', 'js/storage.js', 'js/generator.js', 'js/game.js', 'tests/fixtures/v1-spielstand.js', 'tests/tests.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), { filename: f });
});
var res = globalThis.MA_TEST_RESULTS;
// Zusatzprüfung nur ohne Browser: Service-Worker-Version passt zur App-Version, alle Dateien vorhanden
(function () {
  var sw = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');
  var v = (sw.match(/var VERSION = '([^']+)'/) || [])[1];
  var ok = v === 'v' + globalThis.MA.VERSION.app, msg = 'SW ' + v + ' / App ' + globalThis.MA.VERSION.app;
  var list = eval(sw.match(/var FILES = (\[[\s\S]*?\]);/)[1]);
  var missing = list.filter(function (f) { return f !== './' && !fs.existsSync(path.join(__dirname, '..', f)); });
  var html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  var refs = (html.match(/(?:src|href)="([^"#:]+)"/g) || []).map(function (m) { return './' + m.replace(/^(src|href)="/, '').replace(/"$/, ''); });
  var notCached = refs.filter(function (r) { return list.indexOf(r) < 0; });
  res.push({ name: 'Service Worker: Version passt (' + v + '), alle Dateien vorhanden und im Offline-Cache', ok: ok && !missing.length && !notCached.length,
    msg: msg + (missing.length ? ' fehlt: ' + missing.join() : '') + (notCached.length ? ' nicht im Cache: ' + notCached.join() : '') });
  var ext = [];
  ['index.html', 'style.css', 'app.js', 'manifest.json', 'service-worker.js'].concat(fs.readdirSync(path.join(__dirname, '..', 'js')).map(function (f) { return 'js/' + f; }))
    .concat(fs.readdirSync(path.join(__dirname, '..', 'assets/images')).map(function (f) { return 'assets/images/' + f; })).forEach(function (f) {
      var t = fs.readFileSync(path.join(__dirname, '..', f), 'utf8').replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '');
      if (/https?:\/\//.test(t)) ext.push(f);
    });
  res.push({ name: 'Keine externen Laufzeit-Abhängigkeiten (keine http-Adressen im App-Code)', ok: !ext.length, msg: ext.join() });
  var man = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  res.push({ name: 'Manifest unverändert kompatibel (id, start_url, scope, standalone)', ok: man.id === './' && man.start_url === './index.html' && man.scope === './' && man.display === 'standalone', msg: JSON.stringify(man).slice(0, 80) });
})();
var bad = res.filter(function (r) { return !r.ok; });
res.forEach(function (r) { console.log((r.ok ? '✔ ' : '✘ ') + r.name + (r.ok ? '' : '  → ' + r.msg)); });
console.log('\n' + (res.length - bad.length) + ' von ' + res.length + ' Tests bestanden.');
process.exit(bad.length ? 1 : 0);
