/* Mathe-Abenteuer – Oberfläche und Spielablauf */
(function () {
  'use strict';
  var MA = window.MA, Store = MA.Store, Gen = MA.Gen, Game = MA.Game, Gfx = MA.Gfx, Sound = MA.Sound;
  var W = Game.WORLDS;

  var state = Store.load();
  var current = 'start', previous = 'start', navLock = 0;
  var S = null;            // laufendes Level
  var worldIdx = Math.min(state.progress.lastWorld, state.progress.worldsUnlocked - 1);
  var timers = [];
  var updatePending = false;

  /* ---------- Hilfsfunktionen ---------- */
  function $(id) { return document.getElementById(id); }
  function qsa(sel, rootEl) { return Array.prototype.slice.call((rootEl || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { try { return Number(n).toLocaleString('de-DE'); } catch (e) { return String(n); } }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function reduced() {
    return state.settings.animations === 'reduced' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  var saveTimer = null;
  function save(now) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (now) { Store.save(state); return; }
    saveTimer = setTimeout(function () { saveTimer = null; Store.save(state); }, 250);
  }
  function announce(txt) { var l = $('live'); l.textContent = ''; setTimeout(function () { l.textContent = txt; }, 30); }

  function fillIcons(rootEl) {
    qsa('[data-icon]', rootEl).forEach(function (el) {
      if (!el.firstChild) el.innerHTML = Gfx.icon(el.getAttribute('data-icon'));
    });
    qsa('[data-mascot]', rootEl).forEach(function (el) { if (!el.firstChild) el.innerHTML = Gfx.mascot(); });
  }
  function setWorldColors(w) {
    var r = document.documentElement.style, c = W[w];
    r.setProperty('--world', c.color); r.setProperty('--world-dark', c.dark); r.setProperty('--world-light', c.light);
  }
  function worldImg(w) { return 'assets/images/world-' + (w + 1) + '.svg'; }
  function mascotMood(el, mood) {
    if (!el) return;
    el.classList.remove('happy', 'think');
    if (mood) { void el.offsetWidth; el.classList.add(mood); }
  }
  function say(id, text, cls) {
    var b = $(id); if (!b) return;
    b.classList.remove('pop', 'good', 'soft');
    b.innerHTML = text;
    if (cls) b.classList.add(cls);
    void b.offsetWidth; b.classList.add('pop');
  }
  function bump(el) { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function refreshBinds() {
    qsa('[data-bind="points"]').forEach(function (e) { e.textContent = fmt(state.progress.points); });
    qsa('[data-bind="stars"]').forEach(function (e) { e.textContent = fmt(Game.totalStars(state.progress)); });
  }
  function applySettings() {
    Sound.setEnabled(state.settings.sound);
    document.body.classList.toggle('reduce-motion', state.settings.animations === 'reduced');
  }

  /* ---------- Navigation ---------- */
  function go(screen, opts) {
    var now = Date.now();
    if (now - navLock < 300 && !(opts && opts.force)) return;
    navLock = now;
    if (screen === 'back') screen = previous && previous !== 'collection' ? previous : 'start';
    if (screen !== current) previous = current;
    if (current === 'play' && screen !== 'play') { clearTimers(); S = null; }
    qsa('.screen').forEach(function (s) { s.classList.remove('active'); });
    var el = $('screen-' + screen); if (!el) return;
    el.classList.add('active');
    current = screen;
    if (screen === 'start') renderStart();
    if (screen === 'map') renderMap();
    if (screen === 'world') renderWorld();
    if (screen === 'collection') renderCollection();
    if (screen === 'parents') renderParents();
    var sc = el.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
    refreshBinds();
  }

  /* ---------- Start ---------- */
  function renderStart() {
    if (updatePending) { window.location.reload(); return; }
    var p = state.progress, msg;
    if (!p.greeted) msg = 'Hallo! Ich bin Funki, ein kleiner Drache. Kommst du mit auf ein Rechen-Abenteuer?';
    else if (Game.worldDone(p, 4)) msg = 'Du hast alle Welten geschafft! Willst du noch mehr Sterne sammeln?';
    else msg = pickOne(['Schön, dass du wieder da bist! Weiter geht’s im ' + W[Math.min(p.worldsUnlocked - 1, 4)].name + '.',
      'Hallo Rechen-Held! Bereit für neue Aufgaben?', 'Ich habe schon auf dich gewartet! Auf zum nächsten Schatz!']);
    say('start-bubble', msg);
  }
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- Karte ---------- */
  function currentWorld() {
    for (var w = 0; w < state.progress.worldsUnlocked; w++) if (!Game.worldDone(state.progress, w)) return w;
    return state.progress.worldsUnlocked - 1;
  }
  function renderMap() {
    var p = state.progress, cur = currentWorld(), html = '';
    W.forEach(function (w, i) {
      var open = Game.isWorldUnlocked(p, i), stars = Game.worldStars(p, i), done = 0;
      for (var l = 1; l <= 5; l++) if (Game.levelDone(p, i, l)) done++;
      html += '<button class="world-card' + (open ? '' : ' locked') + (open && i === cur ? ' current' : '') + '" data-world="' + i + '" style="--wc:' + w.color + ';--wd:' + w.dark + '"' +
        ' aria-label="Welt ' + (i + 1) + ': ' + w.name + (open ? ', ' + stars + ' von 15 Sternen' : ', noch gesperrt') + '">' +
        '<div class="wc-img" style="background-image:url(' + worldImg(i) + ')"><span class="wc-num">' + (i + 1) + '</span>' +
        (Game.worldDone(p, i) ? '<span class="wc-badge">' + Gfx.badge(i) + '</span>' : '') +
        (open ? '' : '<span class="wc-lock">' + Gfx.icon('lock') + '</span>') +
        (open && i === cur ? '<span class="wc-here">Hier bist du!</span>' : '') + '</div>' +
        '<div class="wc-body"><span class="wc-name">' + w.name + '</span>' +
        '<span class="wc-meta">' + Gfx.icon('star') + stars + ' / 15 &nbsp;·&nbsp; Level ' + done + ' / 5</span>' +
        '<span class="wc-bar"><i style="width:' + (done * 20) + '%"></i></span></div></button>';
    });
    $('map-grid').innerHTML = html;
  }
  function openWorld(i) {
    if (!Game.isWorldUnlocked(state.progress, i)) {
      Sound.play('click');
      toast(Gfx.icon('lock') + 'Schaffe zuerst ' + W[i - 1].name + '!');
      return;
    }
    worldIdx = i; state.progress.lastWorld = i; save();
    Sound.play('click');
    go('world', { force: true });
  }

  /* ---------- Welt / Levelauswahl ---------- */
  function renderWorld() {
    var p = state.progress, w = worldIdx, c = W[w];
    setWorldColors(w);
    $('world-bg').style.backgroundImage = 'url(' + worldImg(w) + ')';
    $('world-title').textContent = c.name;
    $('world-stars').textContent = Game.worldStars(p, w) + ' / 15';
    var next = Game.currentLevel(p, w), nodes = [];
    for (var l = 1; l <= 5; l++) {
      var open = Game.isLevelUnlocked(p, w, l), done = Game.levelDone(p, w, l), st = Game.levelStars(p, w, l);
      var stars = '';
      if (done) { stars = '<span class="ln-stars">'; for (var s = 1; s <= 3; s++) stars += Gfx.icon(s <= st ? 'star' : 'starEmpty'); stars += '</span>'; }
      nodes.push('<button class="level-node' + (open ? '' : ' locked') + (open && !done && l === next ? ' next' : '') + '" data-level="' + l + '" aria-label="Level ' + l +
        (done ? ', ' + st + ' Sterne' : (open ? '' : ', gesperrt')) + '">' + (open ? l : Gfx.icon('lock')) + stars + '</button>');
      if (Game.CHEST_AFTER[1] === l || Game.CHEST_AFTER[2] === l) {
        var ci = Game.CHEST_AFTER[1] === l ? 1 : 2, cs = Game.chestState(p, w, ci);
        nodes.push('<button class="level-node chest-node ' + cs + '" data-chest="' + ci + '" aria-label="' + (ci === 2 ? 'Welt-Schatztruhe' : 'Schatztruhe') +
          (cs === 'ready' ? ', bereit zum Öffnen' : cs === 'opened' ? ', schon geöffnet' : ', noch verschlossen') + '">' + Gfx.chest(cs === 'opened') + '</button>');
      }
    }
    $('level-path').innerHTML = nodes.join('<span class="path-dots" aria-hidden="true"></span>');
    var msg;
    if (Game.chestState(p, w, 1) === 'ready' || Game.chestState(p, w, 2) === 'ready') msg = 'Eine Schatztruhe wartet auf dich! Tippe sie an.';
    else if (!Game.levelDone(p, w, 1)) msg = c.intro;
    else if (Game.worldDone(p, w)) msg = 'Diese Welt hast du geschafft! Du kannst jedes Level nochmal spielen und mehr Sterne holen.';
    else msg = 'Weiter geht’s mit Level ' + next + '!';
    say('world-bubble', msg);
    mascotMood(qsa('#screen-world .mascot')[0], null);
    renderReward($('world-reward'), w, false);
  }
  function renderReward(el, w, mini) {
    var r = Game.nextReward(state.progress, w);
    if (!r) {
      el.innerHTML = mini ? Gfx.badge(w) : Gfx.badge(w) + '<div class="rc-text">Alle Truhen dieser Welt sind geöffnet. Super!</div>';
      if (mini) el.firstChild.style.width = '38px';
      return;
    }
    var dots = '<div class="dots">';
    for (var i = 0; i < r.total; i++) dots += '<i class="' + (i < r.done ? 'on' : '') + '"></i>';
    dots += '</div>';
    var left = r.total - r.done;
    if (mini) { el.innerHTML = Gfx.chest(false) + dots; el.setAttribute('aria-label', left ? 'Noch ' + left + ' Level bis zur Schatztruhe' : 'Schatztruhe bereit'); return; }
    el.innerHTML = Gfx.chest(false) + '<div class="rc-text">' +
      (r.ready ? 'Die ' + (r.chest === 2 ? 'Welt-Schatztruhe' : 'Schatztruhe') + ' ist bereit!' :
        'Noch ' + left + ' Level bis zur ' + (r.chest === 2 ? 'Welt-Schatztruhe' : 'Schatztruhe') + '!') + dots + '</div>';
  }
  function onLevelNode(l) {
    if (!Game.isLevelUnlocked(state.progress, worldIdx, l)) {
      Sound.play('click');
      say('world-bubble', 'Level ' + l + ' ist noch verschlossen. Schaffe zuerst Level ' + (l - 1) + '!', 'soft');
      return;
    }
    Sound.play('click');
    startLevel(worldIdx, l);
  }
  function onChestNode(c) {
    var cs = Game.chestState(state.progress, worldIdx, c);
    Sound.play('click');
    if (cs === 'ready') showChest(worldIdx, c);
    else if (cs === 'opened') say('world-bubble', 'Diese Truhe hast du schon geöffnet: ' + Game.ITEMS[W[worldIdx].items[c - 1]] + '!', 'good');
    else say('world-bubble', 'Schaffe Level ' + Game.CHEST_AFTER[c] + ', dann darfst du diese Truhe öffnen!', 'soft');
  }

  /* ---------- Level spielen ---------- */
  function startLevel(w, l) {
    if (!Game.isLevelUnlocked(state.progress, w, l)) return;
    clearTimers();
    S = { w: w, l: l, total: state.settings.roundLength, done: 0, firstCorrect: 0, task: null, attempt: 1, input: '',
      start: 0, busy: false, recentKeys: [], lastOps: [], repeat: [], usedHint: false, explained: false, wrongCount: 0 };
    setWorldColors(w);
    $('play-bg').style.backgroundImage = 'url(' + worldImg(w) + ')';
    $('play-title').textContent = W[w].name + ' · Level ' + l;
    var mc = state.settings.answerMode === 'mc';
    $('keypad').hidden = mc; $('mc').hidden = !mc;
    go('play', { force: true });
    updateStreak(false);
    renderReward($('mini-reward'), w, true);
    say('play-bubble', l === 1 && !Game.levelDone(state.progress, w, 1) ? 'Level ' + l + '! Los geht’s – ich glaube an dich!' :
      pickOne(['Level ' + l + '! Los geht’s!', 'Auf geht’s zu Level ' + l + '!', 'Level ' + l + ' – du schaffst das!']));
    mascotMood($('play-mascot'), 'happy');
    nextTask();
  }
  function levelProgress() {
    var tot = S.total, pct = tot ? Math.min(100, S.done / tot * 100) : Math.min(100, (S.done % 10) * 10);
    $('level-progress-fill').style.width = pct + '%';
    $('level-progress-label').textContent = tot ? S.done + ' / ' + tot : S.done + ' gelöst';
    var pb = $('level-progress');
    pb.setAttribute('aria-valuemax', tot || 10); pb.setAttribute('aria-valuenow', tot ? S.done : S.done % 10);
    $('btn-finish').hidden = !(tot === 0 && S.done >= 5);
  }
  function nextTask() {
    if (!S) return;
    levelProgress();
    if (S.total && S.done >= S.total) { finishLevel(); return; }
    var t = null;
    for (var i = 0; i < S.repeat.length; i++) {
      if (S.repeat[i].due <= S.done) { var r = S.repeat.splice(i, 1)[0]; t = Gen.makeTask(r.op, r.a, r.b); break; }
    }
    if (!t) {
      t = Gen.generate({
        settings: state.settings,
        stage: Game.stageFor(state, S.w),
        level: S.l,
        recentKeys: S.recentKeys,
        lastOps: S.lastOps,
        weakCats: Gen.weakCategories(state.stats.cats)
      });
    }
    S.recentKeys.push(t.key); if (S.recentKeys.length > 20) S.recentKeys.shift();
    S.lastOps.push(t.op); if (S.lastOps.length > 5) S.lastOps.shift();
    S.task = t; S.attempt = 1; S.input = ''; S.usedHint = false; S.explained = false; S.wrongCount = 0;
    S.start = Date.now(); S.busy = false;
    var card = $('task-card'); card.classList.remove('is-correct', 'is-wrong');
    $('task-text').textContent = t.text;
    $('task').setAttribute('aria-label', 'Aufgabe: ' + t.speech);
    $('hint-card').hidden = true;
    renderInput();
    if (state.settings.answerMode === 'mc') renderChoices();
    if (S.done > 0) { mascotMood($('play-mascot'), null); }
    if (S.done > 0 && !S.keepBubble) say('play-bubble', pickOne(['Was ist ' + t.text + '?', 'Rechne mal: ' + t.text, 'Nächste Aufgabe!', 'Und jetzt diese hier!']));
    S.keepBubble = false;
    announce('Neue Aufgabe: ' + t.speech);
  }
  function renderInput() {
    var box = $('answer-box');
    $('answer-text').textContent = S.input;
    box.classList.toggle('filled', S.input.length > 0);
    box.setAttribute('aria-label', 'Deine Antwort: ' + (S.input || 'leer'));
    var ok = $('keypad').querySelector('.key-ok'); if (ok) ok.disabled = !S.input;
  }
  function buildKeypad(el, small) {
    var k = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'], html = '';
    k.forEach(function (x) {
      if (x === 'del') html += '<button class="key key-del" data-key="del" aria-label="Löschen">' + Gfx.icon('del') + '</button>';
      else if (x === 'ok') html += '<button class="key key-ok" data-key="ok" aria-label="Bestätigen">' + Gfx.icon('check') + '</button>';
      else html += '<button class="key" data-key="' + x + '" aria-label="' + x + '">' + x + '</button>';
    });
    el.innerHTML = html;
    if (small) el.classList.add('keypad--small');
  }
  function typeDigit(d) {
    if (!S || S.busy) return;
    if (S.input.length >= 3) return;
    if (S.input === '0') S.input = '';
    S.input += d; Sound.play('click'); renderInput();
  }
  function delDigit() {
    if (!S || S.busy || !S.input) return;
    S.input = S.input.slice(0, -1); Sound.play('click'); renderInput();
  }
  function renderChoices() {
    var ch = Gen.choices(S.task, 4), el = $('mc');
    el.innerHTML = ch.map(function (v, i) {
      return '<button class="choice" data-choice="' + v + '" aria-label="Antwort ' + (i + 1) + ': ' + v + '">' + v + '</button>';
    }).join('');
  }

  function submit(val) {
    if (!S || S.busy || !S.task) return;
    if (val === '' || val === null || val === undefined) return;
    var n = parseInt(val, 10);
    if (!isFinite(n)) return;
    S.busy = true;
    var t = S.task, card = $('task-card'), day = Store.todayKey();
    if (state.settings.answerMode === 'mc') { S.input = String(n); renderInput(); }
    if (n === t.answer) {
      var res = Game.registerCorrect(state, t, S.attempt, Date.now() - S.start, day, S.usedHint || S.explained);
      S.done++; if (S.attempt === 1) S.firstCorrect++;
      save(true);
      card.classList.remove('is-wrong'); card.classList.add('is-correct');
      if (state.settings.answerMode === 'mc') qsa('#mc .choice').forEach(function (b) { if (+b.getAttribute('data-choice') === n) b.classList.add('right'); });
      Sound.play('correct');
      mascotMood($('play-mascot'), 'happy');
      var praise = Gen.praise() + ' <b>+' + res.points + '</b>';
      if (S.attempt > 1) praise = pickOne(['Geschafft! Gut, dass du drangeblieben bist.', 'Jetzt stimmt es! Toll gemacht.', 'Richtig! Dranbleiben lohnt sich.']) + ' <b>+' + res.points + '</b>';
      say('play-bubble', praise, 'good');
      floatPoints('+' + res.points, false);
      refreshBinds(); bump($('play-points-pill'));
      updateStreak(true);
      announce('Richtig! ' + t.speech + ' ist ' + t.answer + '.');
      var wait = reduced() ? 900 : 1250;
      if (res.bonus) {
        later(function () {
          Sound.play('streak');
          toast(Gfx.icon('flame') + (res.bonusType === 'big' ? 'Super-Serie! ' : 'Serie! ') + res.streak + ' richtig hintereinander +' + res.bonus);
          floatPoints('+' + res.bonus, true); refreshBinds();
        }, 350);
        wait += 700;
      }
      S.keepBubble = true;
      later(function () { levelProgress(); }, 200);
      later(nextTask, wait);
    } else {
      Game.registerWrong(state, t, S.attempt, day);
      if (S.attempt === 1 && !S.repeat.some(function (r) { return r.a === t.a && r.b === t.b && r.op === t.op; })) {
        S.repeat.push({ op: t.op, a: t.a, b: t.b, due: S.done + 4 });
      }
      S.attempt++; S.wrongCount++;
      save();
      card.classList.remove('is-correct'); void card.offsetWidth; card.classList.add('is-wrong');
      if (state.settings.answerMode === 'mc') qsa('#mc .choice').forEach(function (b) { if (+b.getAttribute('data-choice') === n) b.classList.add('used'); });
      updateStreak(false);
      mascotMood($('play-mascot'), 'think');
      var h = Gen.hints(t), wc = S.wrongCount, hintsOn = state.settings.hints;
      var explainAt = hintsOn ? 4 : 3;
      if (wc >= explainAt || (state.settings.answerMode === 'mc' && wc >= 3)) {
        showExplanation(h);
      } else if (hintsOn && wc === 2) {
        showHint(h.hint1, 'Kleiner Tipp:');
      } else if (hintsOn && wc === 3) {
        showHint(h.hint2, 'Noch ein Tipp:');
      } else {
        Sound.play('wrong');
        say('play-bubble', Gen.wrongMessage(t, n), 'soft');
        announce(Gen.wrongMessage(t, n));
      }
      later(function () {
        if (!S) return;
        S.input = ''; renderInput();
        card.classList.remove('is-wrong');
        S.busy = false;
      }, reduced() ? 600 : 900);
    }
  }
  function markHintUsed() {
    if (!S.usedHint) { S.usedHint = true; state.stats.hintsUsed++; save(); }
  }
  function showHint(text, title) {
    markHintUsed();
    Sound.play('hint');
    say('play-bubble', title + ' ' + esc(text), 'soft');
    var hc = $('hint-card');
    hc.innerHTML = Gfx.icon('bulb') + '<div>' + esc(text) + '</div>';
    hc.hidden = false;
    announce(title + ' ' + text);
  }
  function showExplanation(h) {
    markHintUsed(); S.explained = true;
    Sound.play('hint');
    say('play-bubble', 'Komm, wir rechnen es zusammen – Schritt für Schritt. Tippe dann das Ergebnis ein.', 'soft');
    var hc = $('hint-card');
    hc.innerHTML = Gfx.icon('bulb') + '<ol>' + h.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    hc.hidden = false;
    announce('So geht es: ' + h.steps.join('. '));
  }
  function floatPoints(txt, bonus) {
    var layer = $('float-layer'), el = document.createElement('span');
    el.className = 'float-pts' + (bonus ? ' bonus' : ''); el.textContent = txt;
    layer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1300);
  }
  function updateStreak(animate) {
    var s = state.progress.streak, pill = $('streak-pill');
    $('streak-val').textContent = s;
    pill.classList.toggle('hot', s >= 5);
    pill.setAttribute('aria-label', 'Serie: ' + s + ' richtig hintereinander');
    if (animate) bump(pill);
  }
  function toast(html) {
    var t = $('toast');
    t.innerHTML = html; t.hidden = false;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function finishLevel() {
    if (!S || S.finished) return;
    S.finished = true; S.busy = true;
    var w = S.w, l = S.l, res = Game.completeLevel(state, w, l, S.firstCorrect, S.done);
    save(true);
    if (!res) { go('world', { force: true }); return; }
    refreshBinds();
    Sound.play('level');
    confetti();
    var stars = '<div class="stars-row" aria-label="' + res.stars + ' von 3 Sternen">';
    for (var i = 1; i <= 3; i++) stars += '<span class="s">' + Gfx.icon(i <= res.stars ? 'star' : 'starEmpty') + '</span>';
    stars += '</div>';
    var lines = '<div class="reward-line">';
    if (res.bonus) lines += '<span class="pill pill-coin">' + Gfx.icon('coin') + '<b>+' + res.bonus + ' Level-Bonus</b></span>';
    if (res.improved) lines += '<span class="pill pill-star">' + Gfx.icon('star') + '<b>Neuer Rekord!</b></span>';
    lines += '</div>';
    var txt = S.firstCorrect === S.done ? 'Perfekt! Alles auf Anhieb richtig!' : res.stars === 3 ? 'Wow! Fast alles auf Anhieb richtig!' : res.stars === 2 ? 'Richtig gut gemacht!' : 'Geschafft! Übung macht den Meister.';
    var actions = [];
    if (res.chest) actions.push({ label: 'Schatztruhe öffnen!', cls: 'btn-primary', icon: 'play', fn: function () { showChest(w, res.chest, true); } });
    else if (l < 5) actions.push({ label: 'Nächstes Level', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); startLevel(w, l + 1); } });
    actions.push({ label: 'Nochmal', cls: 'btn-ghost', fn: function () { closeModal(); startLevel(w, l); } });
    if (!res.chest) actions.push({ label: 'Zur Welt', cls: 'btn-secondary', icon: 'map', fn: function () { closeModal(); go('world', { force: true }); } });
    openModal('<h2 id="modal-title">Level ' + l + ' geschafft!</h2>' + stars +
      '<div class="mascot mascot--mid happy">' + Gfx.mascot() + '</div>' +
      '<p>' + txt + '<br>' + S.firstCorrect + ' von ' + S.done + ' Aufgaben auf Anhieb richtig.</p>' + lines, actions, { noEscape: true });
    announce('Level ' + l + ' geschafft! ' + res.stars + ' Sterne.');
  }

  function showChest(w, c, fromLevel) {
    if (Game.chestState(state.progress, w, c) !== 'ready') { closeModal(); go('world', { force: true }); return; }
    var name = c === 2 ? 'Welt-Schatztruhe' : 'Schatztruhe';
    openModal('<h2 id="modal-title">Eine ' + name + '!</h2><p>Tippe auf die Truhe, um sie zu öffnen.</p>' +
      '<button class="chest-big closed" id="chest-btn" aria-label="Schatztruhe öffnen">' + Gfx.chest(false) + '</button><div id="chest-prize"></div>',
      [], { noEscape: true });
    Sound.play('click');
    var btn = $('chest-btn'), opened = false;
    btn.addEventListener('click', function () {
      if (opened) return; opened = true;
      var res = Game.openChest(state, w, c);
      save(true);
      if (!res) { closeModal(); go('world', { force: true }); return; }
      refreshBinds();
      Sound.play('chest');
      confetti();
      btn.classList.remove('closed'); btn.classList.add('opening'); btn.innerHTML = Gfx.chest(true);
      btn.setAttribute('aria-label', 'Offene Schatztruhe'); btn.disabled = true;
      var box = $('modal-box');
      box.querySelector('p').textContent = 'Du hast einen Schatz gefunden!';
      $('chest-prize').innerHTML = '<div class="prize">' + Gfx.item(res.item) + '<b>' + Game.ITEMS[res.item] + '</b>' +
        '<span class="pill pill-coin">' + Gfx.icon('coin') + '<b>+' + res.points + '</b></span></div>';
      announce('Du hast ' + Game.ITEMS[res.item] + ' gefunden und ' + res.points + ' Punkte bekommen.');
      var acts = box.querySelector('.modal-actions');
      var next = c === 2
        ? { label: 'Weiter', cls: 'btn-primary', icon: 'play', fn: function () { showWorldDone(w, res); } }
        : (fromLevel && Game.isLevelUnlocked(state.progress, w, Game.CHEST_AFTER[c] + 1)
          ? { label: 'Nächstes Level', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); startLevel(w, Game.CHEST_AFTER[c] + 1); } }
          : { label: 'Super!', cls: 'btn-primary', fn: function () { closeModal(); go('world', { force: true }); } });
      var list = [next];
      if (c === 1) list.push({ label: 'Zur Welt', cls: 'btn-secondary', icon: 'map', fn: function () { closeModal(); go('world', { force: true }); } });
      renderActions(acts, list);
      later(function () { var b = acts.querySelector('button'); if (b) b.focus(); }, 50);
    });
    later(function () { btn.focus(); }, 50);
  }

  function showWorldDone(w, res) {
    Sound.play('world');
    confetti();
    var html = '<h2 id="modal-title">' + W[w].name + ' geschafft!</h2>' +
      '<div class="prize">' + Gfx.badge(w) + '<b>Abzeichen: ' + W[w].badge + '</b></div>';
    var actions = [];
    if (res.unlockedWorld !== null) {
      var n = res.unlockedWorld;
      html += '<p>Eine neue Welt ist frei:</p><div class="world-banner" style="background-image:url(' + worldImg(n) + ')" role="img" aria-label="' + W[n].name + '"></div><p><b>' + W[n].name + '</b></p>';
      actions.push({ label: 'Auf in die neue Welt!', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); worldIdx = n; state.progress.lastWorld = n; save(); go('world', { force: true }); } });
      actions.push({ label: 'Zur Karte', cls: 'btn-secondary', icon: 'map', fn: function () { closeModal(); go('map', { force: true }); } });
    } else {
      html += '<p>Unglaublich – du hast <b>alle Welten</b> geschafft! Du bist ein echter Rechen-Held!</p>';
      actions.push({ label: 'Zur Karte', cls: 'btn-primary', icon: 'map', fn: function () { closeModal(); go('map', { force: true }); } });
    }
    openModal(html, actions, { noEscape: true });
    announce(W[w].name + ' geschafft!');
  }

  function leaveLevel() {
    if (!S) { go('world'); return; }
    S.busy = true;
    openModal('<h2 id="modal-title">Pause</h2><div class="mascot mascot--mid">' + Gfx.mascot() + '</div>' +
      '<p>Möchtest du das Level verlassen? Deine Punkte bleiben erhalten.</p>', [
      { label: 'Weiterrechnen', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); if (S) S.busy = false; } },
      { label: 'Level verlassen', cls: 'btn-ghost', fn: function () { closeModal(); go('world', { force: true }); } }
    ], { onEscape: function () { if (S) S.busy = false; } });
  }

  /* ---------- Sammlung ---------- */
  function renderCollection() {
    var p = state.progress, items = '', badges = '';
    W.forEach(function (w, wi) {
      w.items.forEach(function (id) {
        var has = p.items.indexOf(id) >= 0;
        items += '<div class="collect-card' + (has ? '' : ' locked') + '">' + Gfx.item(id, '', has ? Game.ITEMS[id] : 'Noch nicht gefunden') +
          '<span>' + (has ? Game.ITEMS[id] : '???') + '</span><small>' + w.name + '</small></div>';
      });
      var hb = p.badges.indexOf(w.id) >= 0;
      badges += '<div class="collect-card' + (hb ? '' : ' locked') + '">' + Gfx.badge(wi, '', hb ? w.badge : 'Noch nicht verdient') +
        '<span>' + (hb ? w.badge : '???') + '</span><small>' + w.name + '</small></div>';
    });
    $('collect-items').innerHTML = items;
    $('collect-badges').innerHTML = badges;
  }

  /* ---------- Elternbereich ---------- */
  var SETTINGS_UI = [
    { group: 'Aufgaben' },
    { key: 'range', label: 'Zahlenraum', opts: [[20, 'bis 20'], [50, 'bis 50'], [100, 'bis 100']] },
    { key: 'add', label: 'Addition (Plus)', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'sub', label: 'Subtraktion (Minus)', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'carry', label: 'Zehnerübergang', help: 'z. B. 47 + 28 oder 52 − 7', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'difficulty', label: 'Schwierigkeit', help: 'Automatisch: steigt mit den Welten und passt sich dem Kind an. Manuell: nur Zahlenraum und Zehnerübergang zählen.', opts: [['auto', 'automatisch'], ['manual', 'manuell']] },
    { group: 'Spielablauf' },
    { key: 'answerMode', label: 'Antwortmodus', opts: [['keypad', 'Zahlentastatur'], ['mc', 'Multiple Choice']] },
    { key: 'roundLength', label: 'Rundenlänge (Aufgaben pro Level)', help: '„Unbegrenzt“: Level kann ab 5 Aufgaben beendet werden.', opts: [[5, '5'], [10, '10'], [20, '20'], [0, 'unbegrenzt']] },
    { key: 'hints', label: 'Hilfestellungen', help: 'Rechentipps nach dem 2. Fehlversuch', opts: [[true, 'an'], [false, 'aus']] },
    { group: 'Ton & Bewegung' },
    { key: 'sound', label: 'Sound', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'animations', label: 'Animationen', opts: [['full', 'an'], ['reduced', 'reduziert']] }
  ];
  function renderParents() {
    showTab('settings');
    renderSettings();
    renderStats();
  }
  function renderSettings() {
    var html = '', open = false;
    SETTINGS_UI.forEach(function (s) {
      if (s.group) { if (open) html += '</div>'; html += '<div class="setting-group"><h3>' + s.group + '</h3>'; open = true; return; }
      html += '<div class="setting"><div class="setting-label">' + s.label + (s.help ? '<small>' + s.help + '</small>' : '') + '</div><div class="seg" role="group" aria-label="' + s.label + '">';
      s.opts.forEach(function (o) {
        html += '<button data-set="' + s.key + '" data-val="' + JSON.stringify(o[0]).replace(/"/g, '&quot;') + '" aria-pressed="' + (state.settings[s.key] === o[0]) + '">' + o[1] + '</button>';
      });
      html += '</div></div>';
    });
    if (open) html += '</div>';
    html += '<div class="setting-group danger-zone"><h3>Spielstand</h3><div class="setting"><div class="setting-label">Fortschritt zurücksetzen<small>Löscht Punkte, Sterne, Level, Sammlung und Statistik. Einstellungen bleiben erhalten.</small></div>' +
      '<button class="btn btn-danger" id="btn-reset" style="font-size:18px;min-height:52px">Zurücksetzen …</button></div></div>';
    html += '<p class="privacy-note">Datenschutz: Alle Daten bleiben ausschließlich auf diesem Gerät (lokaler Speicher des Browsers). Es gibt kein Konto, kein Tracking, keine Werbung und keine Übertragung an Server.' +
      (Store.storageOk() ? '' : ' <b>Achtung: Der Browser erlaubt gerade keine Speicherung (z. B. privater Modus) – der Spielstand geht beim Schließen verloren.</b>') + '</p>';
    $('tab-settings').innerHTML = html;
  }
  function setSetting(key, val) {
    var s = state.settings;
    if ((key === 'add' && val === false && !s.sub) || (key === 'sub' && val === false && !s.add)) {
      toast('Mindestens eine Rechenart muss an sein.');
      return;
    }
    s[key] = val;
    state = Store.sanitize(state);
    applySettings();
    save(true);
    renderSettings();
    if (key === 'sound' && val) Sound.play('correct');
  }
  function renderStats() {
    var st = state.stats, p = state.progress, today = st.days[Store.todayKey()] || { tasks: 0, correct: 0, wrong: 0 };
    var rate = st.tasks ? Math.round(st.correctFirst / st.tasks * 100) : 0;
    var avg = st.tasks ? (st.timeSum / st.tasks / 1000) : 0;
    function box(v, l) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>'; }
    var html = '<div class="stat-grid">' +
      box(fmt(today.tasks), 'Aufgaben heute') + box(fmt(st.tasks), 'Aufgaben insgesamt') +
      box(fmt(st.correctFirst), 'auf Anhieb richtig') + box(fmt(st.wrongAttempts), 'Fehlversuche') +
      box(rate + ' %', 'Trefferquote (1. Versuch)') + box(fmt(p.bestStreak), 'beste Serie') +
      box(fmt(p.points), 'Punkte') + box(Game.levelsCompleted(p) + ' / 25', 'Level geschafft') +
      box(p.worldsUnlocked + ' / 5', 'Welten frei') + box(Game.totalStars(p) + ' / 75', 'Sterne') +
      box(avg ? avg.toFixed(1).replace('.', ',') + ' s' : '–', 'Ø Zeit pro Aufgabe') + box(fmt(st.hintsUsed), 'Hilfen genutzt') + '</div>';
    // letzte 7 Tage
    var days = [], max = 1, d = new Date();
    for (var i = 6; i >= 0; i--) {
      var dt = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i), k = Store.todayKey(dt), v = st.days[k] ? st.days[k].tasks : 0;
      days.push({ l: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][dt.getDay()], v: v }); if (v > max) max = v;
    }
    html += '<div class="stat-card"><h3>Aufgaben der letzten 7 Tage</h3><div class="week">' + days.map(function (x) {
      return '<div class="day"><div class="bar" style="height:' + Math.max(2, x.v / max * 100) + '%"><em>' + (x.v || '') + '</em></div>' + x.l + '</div>';
    }).join('') + '</div></div>';
    // Fehlerschwerpunkte
    var cats = Object.keys(st.cats).map(function (k) { var c = st.cats[k]; return { k: k, n: c.n, w: c.wrong, r: c.n ? c.wrong / c.n : 0, t: c.n ? c.time / c.n / 1000 : 0 }; })
      .filter(function (c) { return c.n >= 3 && c.w > 0; }).sort(function (a, b) { return b.r - a.r || b.n - a.n; });
    html += '<div class="stat-card"><h3>Häufigste Fehlertypen</h3>';
    if (!cats.length) html += '<p class="muted">Noch nicht genug Daten. Nach einigen Aufgaben erscheinen hier die Schwerpunkte.</p>';
    else html += cats.slice(0, 6).map(function (c) {
      return '<div class="err-row"><span>' + Gen.categoryLabel(c.k) + '<br><small class="muted">' + c.n + ' Aufgaben · Ø ' + c.t.toFixed(1).replace('.', ',') + ' s</small></span>' +
        '<span class="err-bar"><i style="width:' + Math.round(c.r * 100) + '%"></i></span><span>' + Math.round(c.r * 100) + ' %</span></div>';
    }).join('') + '<p class="muted">Prozent = Anteil der Aufgaben, die nicht auf Anhieb gelöst wurden. Schwierige Aufgabentypen kommen automatisch etwas häufiger dran.</p>';
    html += '</div>';
    $('tab-stats').innerHTML = html;
  }
  function showTab(name) {
    qsa('.tab').forEach(function (t) { var on = t.getAttribute('data-tab') === name; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    $('tab-settings').hidden = name !== 'settings';
    $('tab-stats').hidden = name !== 'stats';
    if (name === 'stats') renderStats();
  }
  function confirmReset() {
    var step = 0;
    openModal('<h2 id="modal-title" style="color:#B23A33">Fortschritt löschen?</h2><p>Punkte, Sterne, Level, Sammlung und Statistik werden gelöscht. Das kann nicht rückgängig gemacht werden.</p>', [
      { label: 'Abbrechen', cls: 'btn-green', fn: closeModal },
      { label: 'Ja, löschen', cls: 'btn-danger', id: 'reset-yes', fn: function (e) {
        var b = e.currentTarget;
        if (step === 0) { step = 1; b.textContent = 'Wirklich? Nochmal tippen'; return; }
        state = Store.resetProgress(state);
        worldIdx = 0;
        save(true); applySettings(); closeModal(); renderParents(); refreshBinds();
        toast('Der Spielstand wurde zurückgesetzt.');
      } }
    ]);
  }

  /* ---------- Elternzugang (3 Sekunden halten + Rechenfrage) ---------- */
  var hold = null;
  function holdStart(btn) {
    if (hold) return;
    btn.classList.add('holding');
    var t0 = Date.now();
    hold = { btn: btn, raf: 0, done: false };
    (function tick() {
      if (!hold) return;
      var p = Math.min(1, (Date.now() - t0) / 3000);
      btn.style.setProperty('--p', p);
      if (p >= 1) { hold.done = true; holdEnd(true); openGate(); return; }
      hold.raf = requestAnimationFrame(tick);
    })();
  }
  function holdEnd(success) {
    if (!hold) return;
    cancelAnimationFrame(hold.raf);
    var btn = hold.btn, short = !hold.done && !success;
    btn.classList.remove('holding'); btn.style.setProperty('--p', 0);
    hold = null;
    if (short) showHoldTip(btn);
  }
  function showHoldTip(btn) {
    var tip = document.createElement('div'), r = btn.getBoundingClientRect();
    tip.className = 'hold-tip'; tip.textContent = 'Für Eltern: 3 Sekunden gedrückt halten';
    tip.style.top = (r.bottom + 10) + 'px'; tip.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    document.body.appendChild(tip);
    setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 1800);
  }
  function openGate() {
    var a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7), input = '';
    openModal('<h2 id="modal-title" style="color:var(--purple-dark)">Elternbereich</h2><p>Bitte löse die Aufgabe:</p>' +
      '<div class="gate-q">' + a + ' × ' + b + ' = <span class="gate-input" id="gate-input"></span></div><div class="keypad" id="gate-pad"></div>',
      [{ label: 'Abbrechen', cls: 'btn-ghost', fn: closeModal }]);
    var pad = $('gate-pad');
    buildKeypad(pad, true);
    function upd() { $('gate-input').textContent = input; }
    pad.addEventListener('click', function (e) {
      var k = e.target.closest('[data-key]'); if (!k) return;
      var v = k.getAttribute('data-key');
      if (v === 'del') input = input.slice(0, -1);
      else if (v === 'ok') {
        if (parseInt(input, 10) === a * b) { closeModal(); go('parents', { force: true }); return; }
        input = ''; toast('Das stimmt leider nicht.'); later(function () { closeModal(); }, 900);
      } else if (input.length < 3) input += v;
      upd();
    });
    modalKeyHandler = function (e) {
      if (/^[0-9]$/.test(e.key) && input.length < 3) { input += e.key; upd(); }
      else if (e.key === 'Backspace') { input = input.slice(0, -1); upd(); }
      else if (e.key === 'Enter') { var ok = pad.querySelector('.key-ok'); if (ok) ok.click(); }
      else return false;
      return true;
    };
  }

  /* ---------- Dialoge ---------- */
  var modalOpts = null, modalKeyHandler = null, lastFocus = null;
  function renderActions(container, actions) {
    container.innerHTML = '';
    actions.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'btn ' + (a.cls || 'btn-primary');
      if (a.id) b.id = a.id;
      b.innerHTML = (a.icon ? Gfx.icon(a.icon) : '') + '<span>' + a.label + '</span>';
      var used = false;
      b.addEventListener('click', function (e) {
        if (used && !a.id) return;
        if (!a.id) used = true;
        Sound.play('click');
        a.fn(e);
      });
      container.appendChild(b);
    });
  }
  function openModal(html, actions, opts) {
    lastFocus = document.activeElement;
    modalOpts = opts || {}; modalKeyHandler = null;
    var box = $('modal-box');
    box.innerHTML = html + '<div class="modal-actions"></div>';
    renderActions(box.querySelector('.modal-actions'), actions || []);
    $('modal').hidden = false;
    setTimeout(function () { var f = box.querySelector('.modal-actions button') || box.querySelector('button'); if (f) f.focus(); }, 60);
  }
  function closeModal() {
    $('modal').hidden = true; $('modal-box').innerHTML = '';
    modalKeyHandler = null; modalOpts = null;
    if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) { try { lastFocus.focus(); } catch (e) { /* egal */ } }
  }
  function modalOpen() { return !$('modal').hidden; }

  function confetti() {
    if (reduced()) return;
    var box = $('confetti'), colors = ['#FFC93C', '#FF8A3D', '#22B3A0', '#7A5CFA', '#4C7BF3', '#FF4D7D', '#3DBE6E'];
    for (var i = 0; i < 46; i++) {
      var c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * .4) + 's';
      c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      box.appendChild(c);
    }
    setTimeout(function () { box.innerHTML = ''; }, 3800);
  }

  /* ---------- Ereignisse ---------- */
  function bind() {
    document.addEventListener('click', function (e) {
      Sound.unlock();
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-go')) { Sound.play('click'); var g = t.getAttribute('data-go'); if (g === 'map' && !state.progress.greeted) { state.progress.greeted = true; save(); } go(g); return; }
      if (t.hasAttribute('data-world')) { openWorld(+t.getAttribute('data-world')); return; }
      if (t.hasAttribute('data-level')) { onLevelNode(+t.getAttribute('data-level')); return; }
      if (t.hasAttribute('data-chest')) { onChestNode(+t.getAttribute('data-chest')); return; }
      if (t.hasAttribute('data-choice')) { submit(t.getAttribute('data-choice')); return; }
      if (t.hasAttribute('data-set')) { var v; try { v = JSON.parse(t.getAttribute('data-val')); } catch (x) { return; } Sound.play('click'); setSetting(t.getAttribute('data-set'), v); return; }
      if (t.hasAttribute('data-tab')) { Sound.play('click'); showTab(t.getAttribute('data-tab')); return; }
      if (t.id === 'btn-reset') { Sound.play('click'); confirmReset(); return; }
      if (t.id === 'btn-pause') { Sound.play('click'); leaveLevel(); return; }
      if (t.id === 'btn-finish') { Sound.play('click'); if (S && !S.busy && S.done >= 5) finishLevel(); return; }
    });
    $('keypad').addEventListener('click', function (e) {
      var k = e.target.closest('[data-key]'); if (!k) return;
      var v = k.getAttribute('data-key');
      if (v === 'del') delDigit(); else if (v === 'ok') submit(S ? S.input : ''); else typeDigit(v);
    });

    // Elternbereich: gedrückt halten
    qsa('.hold-btn').forEach(function (btn) {
      btn.addEventListener('pointerdown', function (e) { e.preventDefault(); Sound.unlock(); holdStart(btn); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, function () { holdEnd(false); }); });
      btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      btn.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); holdStart(btn); } });
      btn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') holdEnd(false); });
    });

    // Tastatur (externe Tastatur am iPad oder Computer)
    document.addEventListener('keydown', function (e) {
      if (modalOpen()) {
        if (modalKeyHandler && modalKeyHandler(e)) { e.preventDefault(); return; }
        if (e.key === 'Escape' && modalOpts && !modalOpts.noEscape) { var f = modalOpts.onEscape; closeModal(); if (f) f(); }
        return;
      }
      if (current !== 'play' || !S) return;
      if (state.settings.answerMode === 'mc') {
        if (/^[1-4]$/.test(e.key)) { var b = qsa('#mc .choice')[+e.key - 1]; if (b && !b.classList.contains('used')) submit(b.getAttribute('data-choice')); e.preventDefault(); }
        return;
      }
      if (/^[0-9]$/.test(e.key)) { typeDigit(e.key); flashKey(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { delDigit(); flashKey('del'); e.preventDefault(); }
      else if (e.key === 'Enter') { if (document.activeElement && document.activeElement.classList.contains('key') && document.activeElement.getAttribute('data-key') !== 'ok') return; submit(S.input); flashKey('ok'); e.preventDefault(); }
      else if (e.key === 'Escape') { leaveLevel(); }
    });

    // iOS: Zoom-Gesten verhindern
    ['gesturestart', 'gesturechange'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
    var lastTouch = 0;
    document.addEventListener('touchend', function (e) {
      var now = Date.now();
      if (now - lastTouch < 300 && !e.target.closest('button')) e.preventDefault();
      lastTouch = now;
    }, { passive: false });

    // Speichern beim Verlassen
    document.addEventListener('visibilitychange', function () { if (document.hidden) save(true); });
    window.addEventListener('pagehide', function () { save(true); });
    window.addEventListener('storage', function (e) { if (e.key === Store.KEY && current !== 'play') { state = Store.load(); applySettings(); refreshBinds(); } });
  }
  function flashKey(k) {
    var b = $('keypad').querySelector('[data-key="' + k + '"]'); if (!b) return;
    b.classList.add('pressed'); setTimeout(function () { b.classList.remove('pressed'); }, 120);
  }

  /* ---------- Service Worker (Offline & Updates) ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' }).then(function (reg) {
        try { reg.update(); } catch (e) { /* offline */ }
        document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { reg.update(); } catch (e) { /* offline */ } } });
      }).catch(function () { /* ohne SW läuft die App trotzdem */ });
      var hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController) { hadController = true; return; }
        updatePending = true;
        save(true);
        if (current === 'start' && !modalOpen()) window.location.reload();
        else { var n = $('update-note'); if (n) n.hidden = false; }
      });
    });
    if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) { /* optional */ } }
  }

  /* ---------- Start ---------- */
  function init() {
    buildKeypad($('keypad'));
    fillIcons(document);
    applySettings();
    setWorldColors(Math.max(0, worldIdx));
    bind();
    refreshBinds();
    renderStart();
    registerSW();
    // Für Tests und Fehlersuche
    window.MA_APP = { state: function () { return state; }, session: function () { return S; }, go: go, startLevel: startLevel, submit: submit };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
