/* Mathe-Abenteuer – lokale Speicherung mit Prüfung aller Werte (localStorage).
   Version 2: eigenes Speicherfeld „matheAbenteuer.v2“, automatische Übernahme aus Version 1,
   einmalige Sicherung des V1-Stands, Export/Import als JSON. */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};
  var VERSION = 2;                                       // Schema-Version
  var KEY = 'matheAbenteuer.v2';                         // aktueller Spielstand
  var KEY_V1 = 'matheAbenteuer.v1';                      // Spielstand aus Version 1 (wird nie verändert)
  var BACKUP_V1 = 'matheAbenteuer.v1.backup-before-v2';  // unveränderte Kopie vor der ersten Migration
  var BACKUP_IMPORT = 'matheAbenteuer.backup-before-import';
  var CORRUPT = 'matheAbenteuer.v2.unlesbar';
  var ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var lastLoad = { source: 'new', migrated: false, backupCreated: false };

  function appInfo() { return MA.VERSION || { app: '2.0.0', schema: VERSION, appId: 'mathe-abenteuer-funki' }; }

  function defaultSettings() {
    return { range: 100, add: true, sub: true, carry: true, answerMode: 'keypad',
      difficulty: 'auto', roundLength: 10, hints: true, sound: true, animations: 'full',
      // neu in Version 2
      area: 'addsub', mul: true, div: true, rows: ROWS.slice(), rowMode: 'all',
      theme: 'light', tempo: 'off', countdownSec: 120 };
  }
  function defaultMul() { return { rounds: 0, rowStars: {}, medals: [] }; }
  function defaultProgress() {
    return { points: 0, streak: 0, bestStreak: 0, levels: {}, chestsOpened: [], items: [],
      badges: [], worldsUnlocked: 1, recent: [], lastWorld: 0, greeted: false, mul: defaultMul() };
  }
  function defaultOps() {
    var o = {}; ['add', 'sub', 'mul', 'div'].forEach(function (k) { o[k] = { n: 0, first: 0, wrong: 0, time: 0 }; }); return o;
  }
  function defaultStats() {
    return { tasks: 0, correctFirst: 0, correctTotal: 0, wrongAttempts: 0, hintsUsed: 0,
      timeSum: 0, days: {}, cats: {}, mulCats: {}, ops: defaultOps() };
  }
  function defaultTempo() { return { rounds: 0, best: {}, history: [] }; }
  function defaults() {
    return { version: VERSION, settings: defaultSettings(), progress: defaultProgress(), stats: defaultStats(),
      tempo: defaultTempo(), meta: { createdAt: new Date().toISOString(), migratedFrom: null, migratedAt: null } };
  }

  function num(v, def, min, max) {
    var n = Number(v);
    if (typeof v !== 'number' || !isFinite(n)) return def;
    n = Math.floor(n);
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    return n;
  }
  function bool(v, def) { return typeof v === 'boolean' ? v : def; }
  function oneOf(v, list, def) { return list.indexOf(v) >= 0 ? v : def; }
  function strList(v, pattern, maxLen) {
    if (!Array.isArray(v)) return [];
    var out = [];
    for (var i = 0; i < v.length && out.length < (maxLen || 200); i++) {
      if (typeof v[i] === 'string' && pattern.test(v[i]) && out.indexOf(v[i]) < 0) out.push(v[i]);
    }
    return out;
  }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isoOrNull(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) && v.length < 40 ? v : null; }
  function counter(c) { c = isObj(c) ? c : {}; return { n: num(c.n, 0, 0), wrong: num(c.wrong, 0, 0), time: num(c.time, 0, 0) }; }

  /* Prüft und vervollständigt einen Spielstand (Version 1 oder 2). Ergebnis ist immer Version 2. */
  function sanitize(raw) {
    var d = defaults();
    if (!isObj(raw)) return d;
    var s = isObj(raw.settings) ? raw.settings : {};
    var rows = Array.isArray(s.rows) ? s.rows.filter(function (r, i, a) { return ROWS.indexOf(r) >= 0 && a.indexOf(r) === i; }).sort(function (a, b) { return a - b; }) : ROWS.slice();
    d.settings = {
      range: oneOf(s.range, [20, 50, 100], 100),
      add: bool(s.add, true),
      sub: bool(s.sub, true),
      carry: bool(s.carry, true),
      answerMode: oneOf(s.answerMode, ['keypad', 'mc'], 'keypad'),
      difficulty: oneOf(s.difficulty, ['auto', 'manual'], 'auto'),
      roundLength: oneOf(s.roundLength, [5, 10, 20, 0], 10),
      hints: bool(s.hints, true),
      sound: bool(s.sound, true),
      animations: oneOf(s.animations, ['full', 'reduced'], 'full'),
      area: oneOf(s.area, ['addsub', 'muldiv'], 'addsub'),
      mul: bool(s.mul, true),
      div: bool(s.div, true),
      rows: rows.length ? rows : ROWS.slice(),
      rowMode: oneOf(s.rowMode, ['select', 'all', 'mixed'], 'all'),
      theme: oneOf(s.theme, ['light', 'dark', 'system'], 'light'),
      tempo: oneOf(s.tempo, ['off', 'countdown', 'stopwatch'], 'off'),
      countdownSec: num(s.countdownSec, 120, 30, 1800)
    };
    if (!d.settings.add && !d.settings.sub) d.settings.add = true;
    if (!d.settings.mul && !d.settings.div) d.settings.mul = true;

    var p = isObj(raw.progress) ? raw.progress : {};
    var levels = {};
    if (isObj(p.levels)) {
      Object.keys(p.levels).forEach(function (k) {
        if (/^w[1-5]-l[1-5]$/.test(k) && isObj(p.levels[k])) {
          levels[k] = { stars: num(p.levels[k].stars, 0, 0, 3), done: bool(p.levels[k].done, false) };
        }
      });
    }
    var pm = isObj(p.mul) ? p.mul : {}, rowStars = {};
    if (isObj(pm.rowStars)) {
      Object.keys(pm.rowStars).forEach(function (k) {
        if (/^(10|[1-9])$/.test(k) && isObj(pm.rowStars[k])) rowStars[k] = { mul: num(pm.rowStars[k].mul, 0, 0, 3), div: num(pm.rowStars[k].div, 0, 0, 3) };
      });
    }
    d.progress = {
      points: num(p.points, 0, 0, 1e9),
      streak: num(p.streak, 0, 0, 1e6),
      bestStreak: num(p.bestStreak, 0, 0, 1e6),
      levels: levels,
      chestsOpened: strList(p.chestsOpened, /^w[1-5]-c[12]$/),
      items: strList(p.items, /^[a-z]+$/),
      badges: strList(p.badges, /^w[1-5]$/),
      worldsUnlocked: num(p.worldsUnlocked, 1, 1, 5),
      recent: Array.isArray(p.recent) ? p.recent.filter(function (x) { return typeof x === 'boolean'; }).slice(-20) : [],
      lastWorld: num(p.lastWorld, 0, 0, 4),
      greeted: bool(p.greeted, false),
      mul: { rounds: num(pm.rounds, 0, 0), rowStars: rowStars, medals: strList(pm.medals, /^(10|[1-9])$/) }
    };
    if (d.progress.bestStreak < d.progress.streak) d.progress.bestStreak = d.progress.streak;

    var st = isObj(raw.stats) ? raw.stats : {};
    d.stats = {
      tasks: num(st.tasks, 0, 0), correctFirst: num(st.correctFirst, 0, 0),
      correctTotal: num(st.correctTotal, 0, 0), wrongAttempts: num(st.wrongAttempts, 0, 0),
      hintsUsed: num(st.hintsUsed, 0, 0), timeSum: num(st.timeSum, 0, 0), days: {}, cats: {}, mulCats: {}, ops: defaultOps()
    };
    if (d.stats.correctFirst > d.stats.tasks) d.stats.correctFirst = d.stats.tasks;
    if (isObj(st.days)) {
      Object.keys(st.days).filter(function (k) { return /^\d{4}-\d{2}-\d{2}$/.test(k); })
        .sort().slice(-60).forEach(function (k) {
          var v = isObj(st.days[k]) ? st.days[k] : {};
          d.stats.days[k] = { tasks: num(v.tasks, 0, 0), correct: num(v.correct, 0, 0), wrong: num(v.wrong, 0, 0) };
        });
    }
    if (isObj(st.cats)) {
      Object.keys(st.cats).forEach(function (k) {
        if (/^(add|sub)\|[zo]\|(20|50|100)$/.test(k) && isObj(st.cats[k])) d.stats.cats[k] = counter(st.cats[k]);
      });
    }
    if (isObj(st.mulCats)) {
      Object.keys(st.mulCats).forEach(function (k) {
        if (/^(mul|div)\|(10|[1-9])$/.test(k) && isObj(st.mulCats[k])) d.stats.mulCats[k] = counter(st.mulCats[k]);
      });
    }
    if (isObj(st.ops)) {
      Object.keys(d.stats.ops).forEach(function (k) {
        var o = isObj(st.ops[k]) ? st.ops[k] : {};
        d.stats.ops[k] = { n: num(o.n, 0, 0), first: num(o.first, 0, 0), wrong: num(o.wrong, 0, 0), time: num(o.time, 0, 0) };
      });
    } else {
      // Version 1 kannte keine Aufteilung nach Rechenarten → aus den Fehlerkategorien ableiten
      Object.keys(d.stats.cats).forEach(function (k) {
        var c = d.stats.cats[k], o = d.stats.ops[k.split('|')[0]];
        o.n += c.n; o.wrong += c.wrong; o.first += Math.max(0, c.n - c.wrong); o.time += c.time;
      });
    }

    var t = isObj(raw.tempo) ? raw.tempo : {};
    d.tempo = { rounds: num(t.rounds, 0, 0), best: {}, history: [] };
    if (isObj(t.best)) {
      Object.keys(t.best).slice(0, 300).forEach(function (k) {
        var b = t.best[k];
        if (/^(cd|sw)\|[a-z0-9|:,.-]{1,80}$/.test(k) && isObj(b) && typeof b.v === 'number' && isFinite(b.v) && b.v >= 0) {
          d.tempo.best[k] = { v: Math.round(b.v), at: isoOrNull(b.at), label: typeof b.label === 'string' ? b.label.slice(0, 80) : '' };
        }
      });
    }
    if (Array.isArray(t.history)) {
      t.history.slice(-30).forEach(function (h) {
        if (!isObj(h)) return;
        d.tempo.history.push({
          at: isoOrNull(h.at), kind: oneOf(h.kind, ['countdown', 'stopwatch'], 'countdown'),
          area: oneOf(h.area, ['addsub', 'muldiv', 'row'], 'addsub'), label: typeof h.label === 'string' ? h.label.slice(0, 80) : '',
          tasks: num(h.tasks, 0, 0), correct: num(h.correct, 0, 0), streak: num(h.streak, 0, 0),
          ms: num(h.ms, 0, 0), best: bool(h.best, false)
        });
      });
    }

    var m = isObj(raw.meta) ? raw.meta : {};
    d.meta = {
      createdAt: isoOrNull(m.createdAt) || d.meta.createdAt,
      migratedFrom: m.migratedFrom === 1 ? 1 : null,
      migratedAt: isoOrNull(m.migratedAt)
    };
    return d;
  }

  /* Version-1-Daten in Version 2 überführen (alle alten Werte bleiben erhalten) */
  function migrate(raw) {
    var d = sanitize(raw);
    if (!isObj(raw) || raw.version !== 2) {
      d.meta.migratedFrom = 1;
      d.meta.migratedAt = new Date().toISOString();
    }
    return d;
  }

  function store(st) { return st || root.localStorage; }
  function storageOk(st) {
    try { var s = store(st), t = '__ma_test'; s.setItem(t, '1'); s.removeItem(t); return true; }
    catch (e) { return false; }
  }
  function get(st, k) { try { return store(st).getItem(k); } catch (e) { return null; } }
  function set(st, k, v) { try { store(st).setItem(k, v); return true; } catch (e) { return false; } }

  /* Laden: V2 → sonst V1 übernehmen (vorher sichern) → sonst neu */
  function load(st) {
    lastLoad = { source: 'new', migrated: false, backupCreated: false };
    var txt2 = get(st, KEY);
    if (txt2) {
      try { lastLoad.source = 'v2'; return sanitize(JSON.parse(txt2)); }
      catch (e) { set(st, CORRUPT, txt2); /* weiter mit V1, falls vorhanden */ }
    }
    var txt1 = get(st, KEY_V1);
    if (txt1) {
      if (!get(st, BACKUP_V1)) lastLoad.backupCreated = set(st, BACKUP_V1, txt1);
      var parsed = null;
      try { parsed = JSON.parse(txt1); } catch (e) { parsed = null; }
      if (parsed) {
        var d = migrate(parsed);
        set(st, KEY, JSON.stringify(d));
        lastLoad.source = 'v1'; lastLoad.migrated = true;
        return d;
      }
    }
    lastLoad.source = 'new';
    return defaults();
  }
  function save(state, st) { return set(st, KEY, JSON.stringify(state)); }

  function resetProgress(state) {
    var fresh = defaults();
    fresh.settings = state.settings;
    fresh.meta.createdAt = state.meta && state.meta.createdAt ? state.meta.createdAt : fresh.meta.createdAt;
    return fresh;
  }
  function todayKey(date) {
    var d = date || new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ---------- Export / Import ---------- */
  function exportData(state) {
    var info = appInfo();
    return { app: info.appId, schema: VERSION, appVersion: info.app, exportedAt: new Date().toISOString(), data: sanitize(state) };
  }
  function exportFileName(date) {
    var d = date || new Date();
    return 'funki-spielstand-' + todayKey(d) + '.json';
  }
  /* Liefert { ok, state, schema, error } – ungültige Dateien werden abgelehnt */
  function parseImport(text) {
    var obj;
    if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'Die Datei ist leer.' };
    if (text.length > 2000000) return { ok: false, error: 'Die Datei ist zu groß für einen Spielstand.' };
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'Die Datei ist kein gültiger Spielstand (kein JSON).' }; }
    if (!isObj(obj)) return { ok: false, error: 'Die Datei enthält keinen Spielstand.' };
    var data = obj, schema;
    if (isObj(obj.data) && ('schema' in obj || 'app' in obj)) {
      if (obj.app && obj.app !== appInfo().appId) return { ok: false, error: 'Diese Datei gehört zu einer anderen App.' };
      if (typeof obj.schema === 'number' && obj.schema > VERSION) return { ok: false, error: 'Diese Datei stammt aus einer neueren Version der App.' };
      data = obj.data;
    }
    if (!isObj(data) || !isObj(data.progress) || !isObj(data.settings)) return { ok: false, error: 'In der Datei fehlen Spielstand oder Einstellungen.' };
    if (typeof data.version === 'number' && data.version > VERSION) return { ok: false, error: 'Diese Datei stammt aus einer neueren Version der App.' };
    schema = data.version === 2 ? 2 : 1;
    return { ok: true, schema: schema, state: migrate(data) };
  }
  function backupBeforeImport(state, st) {
    return set(st, BACKUP_IMPORT, JSON.stringify({ savedAt: new Date().toISOString(), data: state }));
  }

  MA.Store = { KEY: KEY, KEY_V1: KEY_V1, BACKUP_V1: BACKUP_V1, BACKUP_IMPORT: BACKUP_IMPORT, SCHEMA: VERSION, ROWS: ROWS,
    defaults: defaults, sanitize: sanitize, migrate: migrate, load: load, save: save,
    resetProgress: resetProgress, todayKey: todayKey, storageOk: storageOk,
    exportData: exportData, exportFileName: exportFileName, parseImport: parseImport, backupBeforeImport: backupBeforeImport,
    lastLoad: function () { return lastLoad; } };
})(typeof window !== 'undefined' ? window : globalThis);
