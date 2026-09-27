/* Tests ohne Browser ausführen: node tests/run-node.js */
var fs = require('fs'), path = require('path'), vm = require('vm');
['js/storage.js', 'js/generator.js', 'js/game.js', 'tests/tests.js'].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), { filename: f });
});
var res = globalThis.MA_TEST_RESULTS, bad = res.filter(function (r) { return !r.ok; });
res.forEach(function (r) { console.log((r.ok ? '✔ ' : '✘ ') + r.name + (r.ok ? '' : '  → ' + r.msg)); });
console.log('\n' + (res.length - bad.length) + ' von ' + res.length + ' Tests bestanden.');
process.exit(bad.length ? 1 : 0);
