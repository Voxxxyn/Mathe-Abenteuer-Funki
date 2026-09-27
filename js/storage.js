/* Mathe-Abenteuer – lokale Speicherung mit Prüfung aller Werte (localStorage). */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};
  var KEY = 'matheAbenteuer.v1';
  var VERSION = 1;

  function defaultSettings() {
    return { range: 100, add: true, sub: true, carry: true, answerMode: 'keypad',
      difficulty: 'auto', roundLength: 10, hints: true, sound: true, animations: 'full' };
  }
  function defaultProgress() {
    return { points: 0, streak: 0, bestStreak: 0, levels: {}, chestsOpened: [], items: [],
      badges: [], worldsUnlocked: 1, recent: [], lastWorld: 0, greeted: false };
  }
  function defaultStats() {
    return { tasks: 0, correctFirst: 0, correctTotal: 0, wrongAttempts: 0, hintsUsed: 0,
      timeSum: 0, days: {}, cats: {} };
  }
  function defaults() {
    return { version: VERSION, settings: defaultSettings(), progress: defaultProgress(), stats: defaultStats() };
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

  function sanitize(raw) {
    var d = defaults();
    if (!isObj(raw)) return d;
    var s = isObj(raw.settings) ? raw.settings : {};
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
      animations: oneOf(s.animations, ['full', 'reduced'], 'full')
    };
    if (!d.settings.add && !d.settings.sub) d.settings.add = true;

    var p = isObj(raw.progress) ? raw.progress : {};
    var levels = {};
    if (isObj(p.levels)) {
      Object.keys(p.levels).forEach(function (k) {
        if (/^w[1-5]-l[1-5]$/.test(k) && isObj(p.levels[k])) {
          levels[k] = { stars: num(p.levels[k].stars, 0, 0, 3), done: bool(p.levels[k].done, false) };
        }
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
      greeted: bool(p.greeted, false)
    };
    if (d.progress.bestStreak < d.progress.streak) d.progress.bestStreak = d.progress.streak;

    var st = isObj(raw.stats) ? raw.stats : {};
    d.stats = {
      tasks: num(st.tasks, 0, 0), correctFirst: num(st.correctFirst, 0, 0),
      correctTotal: num(st.correctTotal, 0, 0), wrongAttempts: num(st.wrongAttempts, 0, 0),
      hintsUsed: num(st.hintsUsed, 0, 0), timeSum: num(st.timeSum, 0, 0), days: {}, cats: {}
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
        if (/^(add|sub)\|[zo]\|(20|50|100)$/.test(k) && isObj(st.cats[k])) {
          var c = st.cats[k];
          d.stats.cats[k] = { n: num(c.n, 0, 0), wrong: num(c.wrong, 0, 0), time: num(c.time, 0, 0) };
        }
      });
    }
    return d;
  }

  function storageOk() {
    try { var t = '__ma_test'; root.localStorage.setItem(t, '1'); root.localStorage.removeItem(t); return true; }
    catch (e) { return false; }
  }
  function load() {
    try {
      var txt = root.localStorage.getItem(KEY);
      if (!txt) return defaults();
      return sanitize(JSON.parse(txt));
    } catch (e) {
      return defaults();
    }
  }
  function save(state) {
    try { root.localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }
  function resetProgress(state) {
    var fresh = defaults();
    fresh.settings = state.settings;
    return fresh;
  }
  function todayKey(date) {
    var d = date || new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  MA.Store = { KEY: KEY, defaults: defaults, sanitize: sanitize, load: load, save: save,
    resetProgress: resetProgress, todayKey: todayKey, storageOk: storageOk };
})(typeof window !== 'undefined' ? window : globalThis);
