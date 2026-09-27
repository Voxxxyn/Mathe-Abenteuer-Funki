/* Mathe-Abenteuer – Spielregeln: Welten, Level, Punkte, Serien, Truhen, Sammlung. */
(function (root) {
  'use strict';
  var MA = root.MA = root.MA || {};

  var LEVELS_PER_WORLD = 5;
  var CHEST_AFTER = { 1: 3, 2: 5 }; // Truhe 1 nach Level 3, Welt-Truhe nach Level 5

  var WORLDS = [
    { id: 'w1', name: 'Sonnendorf', stage: 1, color: '#F5A524', dark: '#C27800', light: '#FFF1CC',
      intro: 'Willkommen im Sonnendorf! Hier beginnt unser Abenteuer.',
      items: ['klee', 'sonnenblume'], badge: 'Dorf-Held' },
    { id: 'w2', name: 'Zauberwald', stage: 2, color: '#2FA36B', dark: '#1B7048', light: '#DDF6E8',
      intro: 'Psst … im Zauberwald leuchten die Pilze. Rechnen wir uns hindurch!',
      items: ['pilz', 'feder'], badge: 'Wald-Wächter' },
    { id: 'w3', name: 'Wolkenburg', stage: 3, color: '#4C7BF3', dark: '#2A52C0', light: '#E0E9FF',
      intro: 'Die Wolkenburg! Die Ritter brauchen unsere Rechenkünste.',
      items: ['schild', 'krone'], badge: 'Burg-Ritter' },
    { id: 'w4', name: 'Feuerberg', stage: 4, color: '#F2603A', dark: '#B83A1A', light: '#FFE3D8',
      intro: 'Heiß, heiß, heiß! Im Feuerberg glitzern die Kristalle.',
      items: ['kristall', 'drachenei'], badge: 'Vulkan-Forscher' },
    { id: 'w5', name: 'Sternenreise', stage: 5, color: '#7A5CFA', dark: '#4F33C9', light: '#ECE6FF',
      intro: 'Countdown läuft … 3, 2, 1 – ab ins Weltall!',
      items: ['rakete', 'komet'], badge: 'Sternen-Kapitän' }
  ];

  var ITEMS = {
    klee: 'Glücksklee', sonnenblume: 'Sonnenblume', pilz: 'Zauberpilz', feder: 'Eulenfeder',
    schild: 'Ritterschild', krone: 'Goldkrone', kristall: 'Feuerkristall', drachenei: 'Drachenei',
    rakete: 'Mini-Rakete', komet: 'Sternschnuppe'
  };

  var POINTS = { first: 10, second: 5, later: 2, streak5: 25, streak10: 50, level: 50, chest: 100 };

  function lid(w, l) { return 'w' + (w + 1) + '-l' + l; }
  function cid(w, c) { return 'w' + (w + 1) + '-c' + c; }

  function levelDone(p, w, l) { var v = p.levels[lid(w, l)]; return !!(v && v.done); }
  function levelStars(p, w, l) { var v = p.levels[lid(w, l)]; return v ? v.stars : 0; }
  function isWorldUnlocked(p, w) { return w >= 0 && w < WORLDS.length && w < p.worldsUnlocked; }
  function isLevelUnlocked(p, w, l) {
    if (!isWorldUnlocked(p, w) || l < 1 || l > LEVELS_PER_WORLD) return false;
    return l === 1 || levelDone(p, w, l - 1);
  }
  function chestState(p, w, c) {
    var id = cid(w, c);
    if (p.chestsOpened.indexOf(id) >= 0) return 'opened';
    return levelDone(p, w, CHEST_AFTER[c]) ? 'ready' : 'locked';
  }
  function worldStars(p, w) {
    var s = 0; for (var l = 1; l <= LEVELS_PER_WORLD; l++) s += levelStars(p, w, l); return s;
  }
  function totalStars(p) { var s = 0; for (var w = 0; w < WORLDS.length; w++) s += worldStars(p, w); return s; }
  function levelsCompleted(p) {
    var n = 0; for (var w = 0; w < WORLDS.length; w++) for (var l = 1; l <= LEVELS_PER_WORLD; l++) if (levelDone(p, w, l)) n++;
    return n;
  }
  function worldDone(p, w) { return chestState(p, w, 2) === 'opened'; }
  function currentLevel(p, w) {
    for (var l = 1; l <= LEVELS_PER_WORLD; l++) if (!levelDone(p, w, l)) return l;
    return LEVELS_PER_WORLD;
  }
  /* Fortschritt zur nächsten Truhe in dieser Welt */
  function nextReward(p, w) {
    var c = chestState(p, w, 1) === 'opened' ? 2 : 1;
    if (c === 2 && chestState(p, w, 2) === 'opened') return null;
    var from = c === 1 ? 1 : 4, to = CHEST_AFTER[c], done = 0;
    for (var l = from; l <= to; l++) if (levelDone(p, w, l)) done++;
    return { chest: c, done: done, total: to - from + 1, ready: chestState(p, w, c) === 'ready' };
  }

  /* Schwierigkeitsstufe für die automatische Anpassung */
  function stageFor(state, w) {
    var base = WORLDS[Math.max(0, Math.min(4, w))].stage;
    var r = state.progress.recent || [];
    var adj = 0;
    if (r.length >= 10) {
      var last = r.slice(-10), ok = last.filter(Boolean).length;
      if (ok >= 9) adj = 1; else if (ok <= 5) adj = -1;
    }
    return Math.max(1, Math.min(5, base + adj));
  }

  function dayOf(stats, key) {
    if (!stats.days[key]) stats.days[key] = { tasks: 0, correct: 0, wrong: 0 };
    var keys = Object.keys(stats.days).sort();
    while (keys.length > 60) delete stats.days[keys.shift()];
    return stats.days[key];
  }

  /* Falscher Versuch – keine Punktabzüge, nur Serie endet */
  function registerWrong(state, task, attemptNo, dayKey) {
    state.stats.wrongAttempts++;
    dayOf(state.stats, dayKey).wrong++;
    if (attemptNo === 1) state.progress.streak = 0;
  }

  /* Richtige Antwort; attemptNo = 1 bedeutet „auf Anhieb“ */
  function registerCorrect(state, task, attemptNo, timeMs, dayKey, usedHint) {
    var p = state.progress, st = state.stats;
    var first = attemptNo === 1;
    var pts = first ? POINTS.first : (attemptNo === 2 && !usedHint ? POINTS.second : POINTS.later);
    var bonus = 0, bonusType = null;
    if (first) {
      p.streak++;
      if (p.streak > p.bestStreak) p.bestStreak = p.streak;
      if (p.streak % 10 === 0) { bonus = POINTS.streak10; bonusType = 'big'; }
      else if (p.streak % 5 === 0) { bonus = POINTS.streak5; bonusType = 'small'; }
    }
    p.points += pts + bonus;
    p.recent.push(first);
    if (p.recent.length > 20) p.recent = p.recent.slice(-20);

    st.tasks++;
    if (first) st.correctFirst++;
    st.correctTotal++;
    var t = Math.max(0, Math.min(60000, Math.round(timeMs || 0)));
    st.timeSum += t;
    var d = dayOf(st, dayKey);
    d.tasks++; if (first) d.correct++;
    var c = st.cats[task.cat] || (st.cats[task.cat] = { n: 0, wrong: 0, time: 0 });
    c.n++; if (!first) c.wrong++; c.time += t;
    return { points: pts, bonus: bonus, bonusType: bonusType, streak: p.streak };
  }

  function starsFor(firstCorrect, total) {
    if (!total) return 1;
    var q = firstCorrect / total;
    return q >= 0.9 ? 3 : (q >= 0.7 ? 2 : 1);
  }

  /* Level abschließen – Bonus nur beim ersten Mal, Sterne nur verbessern */
  function completeLevel(state, w, l, firstCorrect, total) {
    var p = state.progress, id = lid(w, l);
    if (!isLevelUnlocked(p, w, l)) return null;
    var prev = p.levels[id] || { stars: 0, done: false };
    var stars = starsFor(firstCorrect, total);
    var firstTime = !prev.done;
    var bonus = firstTime ? POINTS.level : 0;
    p.levels[id] = { stars: Math.max(prev.stars, stars), done: true };
    p.points += bonus;
    var chest = null;
    for (var c = 1; c <= 2; c++) if (CHEST_AFTER[c] === l && chestState(p, w, c) === 'ready') chest = c;
    return { stars: stars, best: p.levels[id].stars, improved: stars > prev.stars && !firstTime,
      firstTime: firstTime, bonus: bonus, chest: chest };
  }

  /* Truhe öffnen – jede Truhe genau einmal */
  function openChest(state, w, c) {
    var p = state.progress;
    if (chestState(p, w, c) !== 'ready') return null;
    p.chestsOpened.push(cid(w, c));
    var item = WORLDS[w].items[c - 1];
    if (p.items.indexOf(item) < 0) p.items.push(item);
    p.points += POINTS.chest;
    var res = { item: item, points: POINTS.chest, badge: null, unlockedWorld: null, allDone: false };
    if (c === 2) {
      if (p.badges.indexOf(WORLDS[w].id) < 0) p.badges.push(WORLDS[w].id);
      res.badge = WORLDS[w].id;
      if (w + 1 < WORLDS.length && p.worldsUnlocked < w + 2) { p.worldsUnlocked = w + 2; res.unlockedWorld = w + 1; }
      if (w === WORLDS.length - 1) res.allDone = true;
    }
    return res;
  }

  MA.Game = {
    WORLDS: WORLDS, ITEMS: ITEMS, POINTS: POINTS, LEVELS_PER_WORLD: LEVELS_PER_WORLD, CHEST_AFTER: CHEST_AFTER,
    lid: lid, cid: cid, levelDone: levelDone, levelStars: levelStars, isWorldUnlocked: isWorldUnlocked,
    isLevelUnlocked: isLevelUnlocked, chestState: chestState, worldStars: worldStars, totalStars: totalStars,
    levelsCompleted: levelsCompleted, worldDone: worldDone, currentLevel: currentLevel, nextReward: nextReward,
    stageFor: stageFor, registerWrong: registerWrong, registerCorrect: registerCorrect, starsFor: starsFor,
    completeLevel: completeLevel, openChest: openChest
  };
})(typeof window !== 'undefined' ? window : globalThis);
