/* Mathe-Abenteuer – Oberfläche und Spielablauf
   Version 2 ergänzt: Bereich „Mal & Geteilt“ (Einmaleins-Zauberturm), Reihentraining,
   Tempo (Countdown/Stoppuhr), Dark Mode, Export/Import und sichere Updates. */
(function () {
  'use strict';
  var MA = window.MA, Store = MA.Store, Gen = MA.Gen, Game = MA.Game, Gfx = MA.Gfx, Sound = MA.Sound;
  var W = Game.WORLDS, TW = Game.TOWER;

  var state = Store.load();
  var current = 'start', previous = 'start', navLock = 0;
  var S = null;            // laufendes Level
  var worldIdx = Math.min(state.progress.lastWorld, state.progress.worldsUnlocked - 1);
  var timers = [];
  var updatePending = false;
  var R = null;            // laufendes Reihentraining (V2)
  var tempoTimer = null;   // Uhr für Countdown/Stoppuhr (V2)
  var swReg = null, updateReady = false, refreshing = false;
  var colorSrc = W[Math.max(0, worldIdx)];
  var darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

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
  function setWorldColors(w) { setColors(W[w]); }
  function setColors(c) {
    colorSrc = c;
    var r = document.documentElement.style, dark = currentTheme() === 'dark';
    r.setProperty('--world', c.color); r.setProperty('--world-dark', c.dark);
    r.setProperty('--world-light', dark ? c.night : c.light);
    r.setProperty('--world-ink', dark ? c.color : c.dark);
  }
  function currentTheme() {
    var t = state.settings.theme;
    if (t === 'system') return darkMQ && darkMQ.matches ? 'dark' : 'light';
    return t === 'dark' ? 'dark' : 'light';
  }
  function applyTheme() {
    var t = currentTheme();
    document.documentElement.setAttribute('data-theme', t);
    var m = $('meta-theme'); if (m) m.setAttribute('content', t === 'dark' ? '#1E1B3A' : '#FFB23F');
    if (colorSrc) setColors(colorSrc);
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
    applyTheme();
  }

  /* ---------- Navigation ---------- */
  function go(screen, opts) {
    var now = Date.now();
    if (now - navLock < 300 && !(opts && opts.force)) return;
    navLock = now;
    if (screen === 'back') screen = previous && previous !== 'collection' ? previous : 'start';
    if (screen !== current) previous = current;
    if (current === 'play' && screen !== 'play') { stopTempoTimer(); clearTimers(); S = null; }
    if (current === 'rows' && screen !== 'rows') stopRows();
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
    var area = state.settings.area;
    qsa('.area-tab').forEach(function (t) {
      var on = t.getAttribute('data-area') === area;
      t.classList.toggle('active', on); t.setAttribute('aria-selected', on);
    });
    $('map-grid').hidden = area !== 'addsub';
    $('muldiv-view').hidden = area !== 'muldiv';
    $('screen-map').classList.toggle('area-muldiv', area === 'muldiv');
    renderTempoSlot(area);
    if (area === 'muldiv') { renderMulDiv(); return; }
    renderWorldGrid();
  }
  function renderWorldGrid() {
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
    S = newSession({ w: w, l: l, area: 'addsub', mode: 'level', total: state.settings.roundLength });
    setWorldColors(w);
    $('play-bg').style.backgroundImage = 'url(' + worldImg(w) + ')';
    $('play-title').textContent = W[w].name + ' · Level ' + l;
    var mc = state.settings.answerMode === 'mc';
    $('keypad').hidden = mc; $('mc').hidden = !mc;
    go('play', { force: true });
    updateStreak(false);
    $('mini-reward').hidden = false; $('tempo-clock').hidden = true;
    renderReward($('mini-reward'), w, true);
    say('play-bubble', l === 1 && !Game.levelDone(state.progress, w, 1) ? 'Level ' + l + '! Los geht’s – ich glaube an dich!' :
      pickOne(['Level ' + l + '! Los geht’s!', 'Auf geht’s zu Level ' + l + '!', 'Level ' + l + ' – du schaffst das!']));
    mascotMood($('play-mascot'), 'happy');
    nextTask();
  }
  function levelProgress() {
    var tot = S.total, pct = tot ? Math.min(100, S.done / tot * 100) : Math.min(100, (S.done % 10) * 10);
    if (S.tempo && S.tempo.kind === 'countdown') pct = Math.min(100, tempoElapsed() / (S.tempo.sec * 1000) * 100);
    $('level-progress-fill').style.width = pct + '%';
    $('level-progress-label').textContent = tot ? S.done + ' / ' + tot : S.done + ' gelöst';
    var pb = $('level-progress');
    pb.setAttribute('aria-valuemax', tot || 10); pb.setAttribute('aria-valuenow', tot ? S.done : S.done % 10);
    $('btn-finish').hidden = !(tot === 0 && S.done >= 5 && S.mode !== 'tempo');
  }
  function nextTask() {
    if (!S) return;
    levelProgress();
    if (S.total && S.done >= S.total) { finishSession(); return; }
    if (S.timeUp) { finishSession(); return; }
    var t = null;
    for (var i = 0; i < S.repeat.length; i++) {
      if (S.repeat[i].due <= S.done) { var r = S.repeat.splice(i, 1)[0]; t = Gen.makeTask(r.op, r.a, r.b, false, r.row); break; }
    }
    if (!t && S.area === 'muldiv') {
      t = Gen.generateMulDiv({
        settings: state.settings,
        recentKeys: S.recentKeys,
        lastOps: S.lastOps,
        weakCats: Gen.weakCategories(state.stats.mulCats || {})
      });
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
      S.done++; if (S.attempt === 1) { S.firstCorrect++; S.rStreak++; if (S.rStreak > S.rBest) S.rBest = S.rStreak; }
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
      if (S.attempt === 1) S.rStreak = 0;
      if (S.attempt === 1 && !S.repeat.some(function (r) { return r.a === t.a && r.b === t.b && r.op === t.op; })) {
        S.repeat.push({ op: t.op, a: t.a, b: t.b, row: t.row, due: S.done + 4 });
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
    if (!S) { go(backTarget()); return; }
    if (modalOpen()) return;
    S.busy = true;
    pauseTempo();
    var what = S.mode === 'level' ? 'das Level' : 'die Runde';
    function resume() { closeModal(); if (S) { S.busy = false; resumeTempo(); } }
    openModal('<h2 id="modal-title">Pause</h2><div class="mascot mascot--mid">' + Gfx.mascot() + '</div>' +
      '<p>Möchtest du ' + what + ' verlassen? Deine Punkte bleiben erhalten.' + (S.tempo ? ' Die Uhr ist angehalten.' : '') + '</p>', [
      { label: 'Weiterrechnen', cls: 'btn-primary', icon: 'play', fn: resume },
      { label: S.mode === 'level' ? 'Level verlassen' : 'Runde verlassen', cls: 'btn-ghost', fn: function () { var b = backTarget(); closeModal(); go(b, { force: true }); } }
    ], { onEscape: resume });
  }
  function backTarget() { return S && S.mode !== 'level' ? 'map' : 'world'; }


  /* =====================================================================
     Version 2: Sitzungen für Mal & Geteilt und Tempo
     ===================================================================== */
  function newSession(o) {
    return { w: o.w || 0, l: o.l || 0, area: o.area, mode: o.mode, total: o.total, done: 0, firstCorrect: 0, task: null, attempt: 1, input: '',
      start: 0, busy: false, recentKeys: [], lastOps: [], repeat: [], usedHint: false, explained: false, wrongCount: 0,
      rStreak: 0, rBest: 0, tempo: o.tempo || null, timeUp: false, finished: false };
  }
  function rowsLabel() {
    var s = state.settings;
    if (s.rowMode === 'all') return 'alle Reihen';
    if (s.rowMode === 'mixed') return 'alle Reihen gemischt';
    return (s.rows.length === 1 ? s.rows[0] + 'er-Reihe' : 'Reihen ' + s.rows.join(', '));
  }
  function opsLabel(area) {
    var s = state.settings;
    if (area === 'muldiv') return s.mul && s.div ? 'Mal & Geteilt' : (s.mul ? 'nur Mal' : 'nur Geteilt');
    return s.add && s.sub ? 'Plus & Minus' : (s.add ? 'nur Plus' : 'nur Minus');
  }
  function stopwatchCount() { return state.settings.roundLength || 20; }
  function tempoLabel(area) {
    var s = state.settings, what = area === 'muldiv' ? opsLabel('muldiv') + ' (' + rowsLabel() + ')' : opsLabel('addsub') + ' bis ' + s.range;
    if (s.tempo === 'countdown') return 'Countdown ' + fmtDur(s.countdownSec * 1000) + ' · ' + what;
    return 'Stoppuhr ' + stopwatchCount() + ' Aufgaben · ' + what;
  }
  function renderTempoSlot(area) {
    var el = $('tempo-slot'), s = state.settings;
    if (s.tempo === 'off') { el.innerHTML = ''; el.hidden = true; return; }
    var cd = s.tempo === 'countdown';
    var key = Game.tempoKey(tempoOpts(area)), best = state.tempo.best[key];
    el.hidden = false;
    el.innerHTML = '<button class="action-card action-card--tempo" data-action="tempo" aria-label="Tempo-Runde starten: ' + esc(tempoLabel(area)) + '">' +
      '<span class="ac-icon">' + Gfx.icon(cd ? 'hourglass' : 'stopwatch') + '</span>' +
      '<span class="ac-text"><b>Tempo-Runde</b><small>' + esc(tempoLabel(area)) + '</small></span>' +
      (best ? '<span class="ac-best">Rekord: ' + (cd ? best.v + ' richtig' : fmtDurLong(best.v)) + '</span>' : '') +
      '<span class="ac-go">' + Gfx.icon('play') + '</span></button>';
  }
  function tempoOpts(area) {
    var s = state.settings, cd = s.tempo === 'countdown';
    return { kind: cd ? 'countdown' : 'stopwatch', area: area, sec: s.countdownSec, count: stopwatchCount(), sig: Game.settingsSig(s, area) };
  }

  function renderMulDiv() {
    setColors(TW);
    var p = state.progress, s = state.settings, html = '';
    var total = Game.mulStarsTotal(p);
    html += '<div class="tower-hero"><div class="tower-art">' + Gfx.tower() + '</div>' +
      '<div class="tower-side"><div class="mascot mascot--mid" id="tower-mascot">' + Gfx.mascot() + '</div>' +
      '<div class="bubble" id="tower-bubble">' + (p.mul.rounds || total ? pickOne(['Willkommen zurück im Zauberturm! Welche Reihe üben wir heute?', 'Mal und Geteilt – wir zaubern mit Zahlen!', 'Jede Reihe hat ihre eigenen Sterne. Sammeln wir sie!']) :
        'Das ist der Einmaleins-Zauberturm! Hier üben wir Mal und Geteilt.') + '</div></div></div>';
    html += '<div class="tower-actions">' +
      '<button class="action-card" data-action="mul-round"><span class="ac-icon ac-icon--tower">' + Gfx.icon('timesdiv') + '</span>' +
      '<span class="ac-text"><b>Aufgaben-Runde</b><small>' + esc(opsLabel('muldiv')) + ' · ' + esc(rowsLabel()) + '</small></span><span class="ac-go">' + Gfx.icon('play') + '</span></button>' +
      '<div class="tower-stars pill pill-star">' + Gfx.icon('star') + '<b>' + total + ' / 60</b></div></div>';
    html += '<h3 class="section-title tower-title">Reihentraining – wähle eine Reihe' + (s.tempo === 'stopwatch' ? ' <small>(mit Stoppuhr)</small>' : '') + '</h3><div class="row-grid">';
    for (var r = 1; r <= 10; r++) {
      var rs = Game.rowStars(p, r), medal = p.mul.medals.indexOf(String(r)) >= 0;
      html += '<button class="row-card' + (medal ? ' has-medal' : '') + '" data-row="' + r + '" aria-label="' + r + 'er-Reihe üben, Mal ' + rs.mul + ' Sterne, Geteilt ' + rs.div + ' Sterne">' +
        '<span class="rc-num">' + r + '</span><span class="rc-name">' + r + 'er-Reihe</span>' +
        '<span class="rc-stars"><i>×</i>' + miniStars(rs.mul) + '</span><span class="rc-stars"><i>÷</i>' + miniStars(rs.div) + '</span>' +
        (medal ? '<span class="rc-medal">' + Gfx.rowMedal(r, true) + '</span>' : '') + '</button>';
    }
    html += '</div>';
    $('muldiv-view').innerHTML = html;
  }
  function miniStars(n) { var h = ''; for (var i = 1; i <= 3; i++) h += Gfx.icon(i <= n ? 'star' : 'starEmpty'); return h; }

  function preparePlay(title, bgUrl) {
    $('play-bg').style.backgroundImage = 'url(' + bgUrl + ')';
    $('play-title').textContent = title;
    var mc = state.settings.answerMode === 'mc';
    $('keypad').hidden = mc; $('mc').hidden = !mc;
    go('play', { force: true });
    updateStreak(false);
  }
  function startMulRound() {
    clearTimers(); stopTempoTimer();
    S = newSession({ area: 'muldiv', mode: 'round', total: state.settings.roundLength });
    setColors(TW);
    preparePlay('Zauberturm · ' + opsLabel('muldiv'), 'assets/images/zauberturm.svg');
    $('tempo-clock').hidden = true; $('mini-reward').hidden = false;
    $('mini-reward').innerHTML = Gfx.icon('star') + '<b>' + Game.mulStarsTotal(state.progress) + '</b>';
    $('mini-reward').setAttribute('aria-label', 'Einmaleins-Sterne: ' + Game.mulStarsTotal(state.progress));
    say('play-bubble', pickOne(['Auf geht’s in den Zauberturm!', 'Mal und Geteilt – du schaffst das!', 'Zeig mir dein Einmaleins!']));
    mascotMood($('play-mascot'), 'happy');
    nextTask();
  }
  function startTempo(area) {
    var o = tempoOpts(area);
    clearTimers(); stopTempoTimer();
    S = newSession({ area: area, mode: 'tempo', total: o.kind === 'stopwatch' ? o.count : 0,
      tempo: { kind: o.kind, sec: o.sec, count: o.count, sig: o.sig, startAt: 0, pausedAt: 0, pausedMs: 0, lastTick: -1, label: tempoLabel(area) } });
    if (area === 'muldiv') { setColors(TW); } else { S.w = currentWorld(); S.l = 3; setWorldColors(S.w); }
    preparePlay(o.kind === 'countdown' ? 'Tempo · Countdown' : 'Tempo · Stoppuhr', area === 'muldiv' ? 'assets/images/zauberturm.svg' : worldImg(S.w));
    $('mini-reward').hidden = true; $('tempo-clock').hidden = false;
    say('play-bubble', o.kind === 'countdown' ? 'Wie viele Aufgaben schaffst du in ' + fmtDur(o.sec * 1000) + ' Minuten? Los!' : o.count + ' Aufgaben – so schnell du kannst. Los!');
    mascotMood($('play-mascot'), 'happy');
    S.tempo.startAt = Date.now();
    tempoTimer = setInterval(tempoTick, 250);
    tempoTick();
    nextTask();
  }
  function tempoElapsed() {
    var t = S && S.tempo; if (!t || !t.startAt) return 0;
    var now = t.pausedAt || Date.now();
    return Math.max(0, now - t.startAt - t.pausedMs);
  }
  function tempoTick() {
    if (!S || !S.tempo) return;
    var t = S.tempo, el = tempoElapsed(), val = $('tempo-clock-val'), clock = $('tempo-clock');
    if (t.kind === 'countdown') {
      var left = Math.max(0, t.sec * 1000 - el), sec = Math.ceil(left / 1000);
      val.textContent = fmtDur(left);
      clock.classList.toggle('urgent', sec <= 10);
      clock.setAttribute('aria-label', 'Noch ' + sec + ' Sekunden');
      if (sec <= 5 && sec > 0 && sec !== t.lastTick && !t.pausedAt) { t.lastTick = sec; Sound.play('tick'); }
      levelProgress();
      if (left <= 0 && !S.timeUp) {
        S.timeUp = true; stopTempoTimer();
        if (!modalOpen()) finishSession();
      }
    } else {
      val.textContent = fmtDur(el);
      clock.setAttribute('aria-label', 'Zeit: ' + fmtDur(el));
    }
  }
  function stopTempoTimer() { if (tempoTimer) { clearInterval(tempoTimer); tempoTimer = null; } }
  function pauseTempo() { if (S && S.tempo && !S.tempo.pausedAt && !S.finished) { S.tempo.pausedAt = Date.now(); } }
  function resumeTempo() {
    if (!S || !S.tempo || !S.tempo.pausedAt) return;
    S.tempo.pausedMs += Date.now() - S.tempo.pausedAt; S.tempo.pausedAt = 0;
    if (S.timeUp) { finishSession(); return; }
    if (!tempoTimer && !S.finished) tempoTimer = setInterval(tempoTick, 250);
  }

  function finishSession() {
    if (!S || S.finished) return;
    if (S.mode === 'level') finishLevel();
    else if (S.mode === 'round') finishRound();
    else finishTempo();
  }
  function starsRow(n) {
    var h = '<div class="stars-row" aria-label="' + n + ' von 3 Sternen">';
    for (var i = 1; i <= 3; i++) h += '<span class="s">' + Gfx.icon(i <= n ? 'star' : 'starEmpty') + '</span>';
    return h + '</div>';
  }
  function finishRound() {
    S.finished = true; S.busy = true;
    var res = Game.completeMulRound(state, S.firstCorrect, S.done);
    save(true); refreshBinds();
    Sound.play('level'); confetti();
    var txt = S.firstCorrect === S.done ? 'Perfekt! Alles auf Anhieb richtig!' : res.stars === 3 ? 'Zauberhaft gerechnet!' : res.stars === 2 ? 'Richtig gut gemacht!' : 'Geschafft! Übung macht den Meister.';
    openModal('<h2 id="modal-title">Runde geschafft!</h2>' + starsRow(res.stars) +
      '<div class="mascot mascot--mid happy">' + Gfx.mascot() + '</div>' +
      '<p>' + txt + '<br>' + S.firstCorrect + ' von ' + S.done + ' Aufgaben auf Anhieb richtig.</p>', [
      { label: 'Nochmal', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); startMulRound(); } },
      { label: 'Zum Zauberturm', cls: 'btn-secondary', icon: 'map', fn: function () { closeModal(); go('map', { force: true }); } }
    ], { noEscape: true });
    announce('Runde geschafft! ' + res.stars + ' Sterne.');
  }
  function finishTempo() {
    S.finished = true; S.busy = true; stopTempoTimer(); clearTimers();
    var t = S.tempo, ms = t.kind === 'countdown' ? Math.min(tempoElapsed(), t.sec * 1000) : tempoElapsed();
    var r = Game.recordTempo(state, { kind: t.kind, area: S.area, sec: t.sec, count: t.count, sig: t.sig, label: t.label,
      tasks: S.done, correct: S.firstCorrect, streak: S.rBest, ms: ms });
    save(true); refreshBinds();
    Sound.play('tempoEnd'); if (r.best && S.done) confetti();
    var area = S.area;
    var head = t.kind === 'countdown' ? 'Zeit ist um!' : 'Geschafft!';
    var lines = '<div class="result-grid">' +
      resultBox(S.done, 'Aufgaben') + resultBox(S.firstCorrect, 'auf Anhieb richtig') +
      resultBox(pct(S.firstCorrect, S.done) + ' %', 'Trefferquote') + resultBox(S.rBest, 'beste Serie') +
      (t.kind === 'stopwatch' ? resultBox(fmtDurLong(ms), 'benötigte Zeit') : '') + '</div>';
    var rec = '';
    if (r.best && r.prev !== null) rec = '<span class="pill pill-star">' + Gfx.icon('star') + '<b>Neuer Rekord!</b></span>';
    else if (r.firstRecord) rec = '<span class="pill pill-star">' + Gfx.icon('star') + '<b>Erster Rekord!</b></span>';
    else if (r.prev !== null) rec = '<span class="pill">' + (t.kind === 'countdown' ? 'Rekord: ' + r.prev + ' richtig' : 'Bestzeit: ' + fmtDurLong(r.prev)) + '</span>';
    openModal('<h2 id="modal-title">' + head + '</h2><div class="mascot mascot--mid happy">' + Gfx.mascot() + '</div>' + lines +
      '<div class="reward-line">' + rec + '</div>', [
      { label: 'Nochmal', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); startTempo(area); } },
      { label: 'Zur Karte', cls: 'btn-secondary', icon: 'map', fn: function () { closeModal(); go('map', { force: true }); } }
    ], { noEscape: true });
    announce(head + ' ' + S.done + ' Aufgaben, ' + S.firstCorrect + ' auf Anhieb richtig.');
  }
  function resultBox(v, l) { return '<div class="result"><b>' + v + '</b><span>' + l + '</span></div>'; }

  /* =====================================================================
     Version 2: Reihentraining mit echten Eingabefeldern (iPad-Tastatur)
     ===================================================================== */
  function chooseRow(row) {
    var s = state.settings, acts = [];
    if (s.mul) acts.push({ label: 'Mal üben', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); startRows(row, 'mul'); } });
    if (s.div) acts.push({ label: 'Geteilt üben', cls: 'btn-purple', icon: 'play', fn: function () { closeModal(); startRows(row, 'div'); } });
    acts.push({ label: 'Abbrechen', cls: 'btn-ghost', fn: closeModal });
    var rs = Game.rowStars(state.progress, row);
    openModal('<h2 id="modal-title">' + row + 'er-Reihe</h2>' + Gfx.rowMedal(row, state.progress.mul.medals.indexOf(String(row)) >= 0, 'medal-big') +
      '<p>' + (s.mul ? 'Mal: 1 × ' + row + ' bis 10 × ' + row + ' · ' + starText(rs.mul) : '') + (s.mul && s.div ? '<br>' : '') +
      (s.div ? 'Geteilt: ' + row + ' ÷ ' + row + ' bis ' + (10 * row) + ' ÷ ' + row + ' · ' + starText(rs.div) : '') + '</p>' +
      (s.tempo === 'stopwatch' ? '<p class="muted">Mit Stoppuhr – die Zeit läuft ab dem Start.</p>' : ''), acts);
  }
  function startRows(row, op) {
    stopRows();
    setColors(TW);
    var tasks = Gen.rowSequence(row, op);
    R = { row: row, op: op, tasks: tasks, attempts: tasks.map(function () { return 0; }), solved: tasks.map(function () { return false; }),
      starts: tasks.map(function () { return 0; }), first: 0, done: 0, finished: false,
      watch: state.settings.tempo === 'stopwatch' ? { startAt: Date.now(), hiddenAt: 0, pausedMs: 0 } : null, timer: null };
    $('rows-title').textContent = row + 'er-Reihe · ' + (op === 'mul' ? 'Mal' : 'Geteilt');
    var html = '';
    tasks.forEach(function (t, i) {
      html += '<div class="row-line" id="rl-' + i + '"><label class="row-task" for="ri-' + i + '">' + t.text + ' =</label>' +
        '<input class="row-input" id="ri-' + i + '" data-ri="' + i + '" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="' + (i < 9 ? 'next' : 'done') + '"' +
        ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="3" aria-label="' + t.speech + '">' +
        '<span class="row-mark" aria-hidden="true"></span><div class="row-hint" id="rh-' + i + '" hidden></div></div>';
    });
    $('rows-list').innerHTML = html;
    $('rows-clock').hidden = !R.watch;
    $('rows-streak-val').textContent = state.progress.streak;
    rowsProgress();
    go('rows', { force: true });
    say('rows-bubble', op === 'mul' ? 'Die ' + row + 'er-Reihe! Tippe das Ergebnis ein und drücke „Weiter“ oder Enter.' : 'Geteilt durch ' + row + '! Tippe das Ergebnis ein und drücke „Weiter“ oder Enter.');
    mascotMood($('rows-mascot'), 'happy');
    if (R.watch) { R.timer = setInterval(rowsTick, 250); rowsTick(); }
    focusRow(0);
  }
  function rowsElapsed() { if (!R || !R.watch) return 0; var w = R.watch; return Math.max(0, (w.hiddenAt || Date.now()) - w.startAt - w.pausedMs); }
  function rowsTick() { if (R && R.watch) $('rows-clock-val').textContent = fmtDur(rowsElapsed()); }
  function stopRows() { if (R && R.timer) clearInterval(R.timer); if (R) R.timer = null; R = null; }
  function rowsProgress() {
    $('rows-progress-fill').style.width = (R.done * 10) + '%';
    $('rows-progress-label').textContent = R.done + ' / 10';
  }
  function focusRow(i) {
    var inp = $('ri-' + i); if (!inp) return;
    R.starts[i] = R.starts[i] || Date.now();
    try { inp.focus({ preventScroll: false }); } catch (e) { inp.focus(); }
    var line = $('rl-' + i); if (line && line.scrollIntoView) { try { line.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* alt */ } }
  }
  function nextOpenRow(from) {
    for (var k = 1; k <= 10; k++) { var i = (from + k) % 10; if (!R.solved[i]) return i; }
    return -1;
  }
  function currentRowIndex() {
    var a = document.activeElement;
    if (a && a.hasAttribute && a.hasAttribute('data-ri')) return Number(a.getAttribute('data-ri'));
    return nextOpenRow(-1);
  }
  function checkRow(i) {
    if (!R || R.finished || i < 0 || R.solved[i]) return;
    var inp = $('ri-' + i), line = $('rl-' + i), t = R.tasks[i];
    var v = (inp.value || '').replace(/\D/g, '');
    if (!v) { focusRow(i); return; }
    var n = parseInt(v, 10), day = Store.todayKey();
    R.starts[i] = R.starts[i] || Date.now();
    if (n === t.answer) {
      var attempt = R.attempts[i] + 1;
      var res = Game.registerCorrect(state, t, attempt, Date.now() - R.starts[i], day, attempt > 2);
      R.solved[i] = true; R.done++; if (attempt === 1) R.first++;
      save(true);
      line.classList.remove('is-wrong'); line.classList.add('is-correct');
      inp.readOnly = true; inp.setAttribute('aria-label', t.speech + ' ist ' + t.answer + ', richtig');
      $('rh-' + i).hidden = true;
      Sound.play(res.bonus ? 'streak' : 'correct');
      mascotMood($('rows-mascot'), 'happy');
      say('rows-bubble', (attempt === 1 ? Gen.praise() : 'Jetzt stimmt es!') + ' <b>+' + (res.points + res.bonus) + '</b>' + (res.bonus ? ' Serie ' + res.streak + '!' : ''), 'good');
      $('rows-streak-val').textContent = state.progress.streak; bump($('rows-streak'));
      refreshBinds(); rowsProgress();
      announce('Richtig. ' + t.speech + ' ist ' + t.answer + '.');
      var nx = nextOpenRow(i);
      if (nx < 0) { finishRows(); return; }
      focusRow(nx);
    } else {
      R.attempts[i]++;
      Game.registerWrong(state, t, R.attempts[i], day);
      save();
      line.classList.remove('is-wrong'); void line.offsetWidth; line.classList.add('is-wrong');
      $('rows-streak-val').textContent = state.progress.streak;
      mascotMood($('rows-mascot'), 'think');
      var h = Gen.hints(t), wc = R.attempts[i], hint = $('rh-' + i), hintsOn = state.settings.hints;
      if (wc >= (hintsOn ? 3 : 2)) {
        hint.innerHTML = Gfx.icon('bulb') + '<span>' + h.steps.map(esc).join(' · ') + '</span>'; hint.hidden = false;
        Sound.play('hint'); say('rows-bubble', 'Schau, so geht es. Tippe dann das Ergebnis ein.', 'soft');
      } else if (wc === 2 && hintsOn) {
        hint.innerHTML = Gfx.icon('bulb') + '<span>' + esc(h.hint1) + '</span>'; hint.hidden = false;
        Sound.play('hint'); say('rows-bubble', 'Kleiner Tipp: ' + esc(h.hint1), 'soft');
      } else {
        Sound.play('wrong'); say('rows-bubble', Gen.wrongMessage(t, n), 'soft');
      }
      announce(Gen.wrongMessage(t, n));
      inp.value = '';
      focusRow(i);
    }
  }
  function finishRows() {
    if (!R || R.finished) return;
    R.finished = true;
    if (R.timer) { clearInterval(R.timer); R.timer = null; }
    var row = R.row, op = R.op, ms = rowsElapsed();
    var res = Game.completeRow(state, row, op, R.first, 10), tr = null;
    if (R.watch) tr = Game.recordTempo(state, { kind: 'stopwatch', area: 'row', count: 10, sig: row + ':' + op,
      label: row + 'er-Reihe ' + (op === 'mul' ? 'Mal' : 'Geteilt'), tasks: 10, correct: R.first, streak: 0, ms: ms });
    save(true); refreshBinds();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    Sound.play(res.medal ? 'world' : 'rowDone'); confetti();
    var html = '<h2 id="modal-title">' + row + 'er-Reihe geschafft!</h2>' + starsRow(res.stars);
    if (res.medal) html += '<div class="prize">' + Gfx.rowMedal(row, true) + '<b>Medaille: ' + row + 'er-Reihe!</b></div>';
    else html += '<div class="mascot mascot--mid happy">' + Gfx.mascot() + '</div>';
    html += '<p>' + R.first + ' von 10 auf Anhieb richtig.' + (res.improved ? ' Neuer Sterne-Rekord!' : '') + '</p>';
    if (tr) html += '<div class="reward-line"><span class="pill">' + Gfx.icon('stopwatch') + '<b>' + fmtDurLong(ms) + '</b></span>' +
      (tr.best ? '<span class="pill pill-star">' + Gfx.icon('star') + '<b>' + (tr.prev === null ? 'Erste Bestzeit!' : 'Neue Bestzeit!') + '</b></span>' : '<span class="pill">Bestzeit: ' + fmtDurLong(tr.prev) + '</span>') + '</div>';
    var other = op === 'mul' ? 'div' : 'mul', acts = [{ label: 'Nochmal', cls: 'btn-primary', icon: 'play', fn: function () { closeModal(); startRows(row, op); } }];
    if (state.settings[other]) acts.push({ label: other === 'div' ? 'Geteilt üben' : 'Mal üben', cls: 'btn-purple', fn: function () { closeModal(); startRows(row, other); } });
    acts.push({ label: 'Andere Reihe', cls: 'btn-secondary', icon: 'map', fn: function () { closeModal(); go('map', { force: true }); } });
    openModal(html, acts, { noEscape: true });
    announce(row + 'er-Reihe geschafft. ' + res.stars + ' Sterne.');
  }
  function leaveRows() {
    if (!R || R.finished || R.done === 0) { go('map', { force: true }); return; }
    if (R.watch && !R.watch.hiddenAt) R.watch.hiddenAt = Date.now();
    function resume() { closeModal(); if (R && R.watch && R.watch.hiddenAt) { R.watch.pausedMs += Date.now() - R.watch.hiddenAt; R.watch.hiddenAt = 0; } }
    openModal('<h2 id="modal-title">Pause</h2><div class="mascot mascot--mid">' + Gfx.mascot() + '</div><p>Möchtest du das Reihentraining verlassen? Deine Punkte bleiben erhalten.</p>', [
      { label: 'Weiterüben', cls: 'btn-primary', icon: 'play', fn: function () { resume(); var i = nextOpenRow(-1); if (i >= 0) focusRow(i); } },
      { label: 'Verlassen', cls: 'btn-ghost', fn: function () { closeModal(); go('map', { force: true }); } }
    ], { onEscape: resume });
  }

  /* =====================================================================
     Version 2: Export / Import
     ===================================================================== */
  function exportState() {
    var data = Store.exportData(state), json = JSON.stringify(data, null, 1), name = Store.exportFileName();
    var file = null;
    try { file = new File([json], name, { type: 'application/json' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.share) {
      try {
        if (navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Mathe-Abenteuer Spielstand' }).then(function () { toast('Spielstand exportiert.'); })
            .catch(function (e) { if (!e || e.name !== 'AbortError') downloadBlob(json, name); });
          return;
        }
      } catch (e) { /* weiter mit Download */ }
    }
    downloadBlob(json, name);
  }
  function downloadBlob(json, name) {
    try {
      var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      var a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('Spielstand exportiert: ' + name);
    } catch (e) { toast('Export nicht möglich.'); }
  }
  function onImportFile(file) {
    if (!file) return;
    if (file.size > 2000000) { importError('Die Datei ist zu groß für einen Spielstand.'); return; }
    var fr = new FileReader();
    fr.onload = function () { handleImportText(String(fr.result || '')); };
    fr.onerror = function () { importError('Die Datei konnte nicht gelesen werden.'); };
    fr.readAsText(file);
  }
  function importError(msg) {
    openModal('<h2 id="modal-title" style="color:#B23A33">Import nicht möglich</h2><p>' + esc(msg) + '</p><p class="muted">Der aktuelle Spielstand wurde nicht verändert.</p>',
      [{ label: 'OK', cls: 'btn-primary', fn: closeModal }]);
  }
  function handleImportText(text) {
    var res = Store.parseImport(text);
    if (!res.ok) { importError(res.error); return; }
    var n = res.state, p = n.progress;
    openModal('<h2 id="modal-title" style="color:var(--purple-dark)">Spielstand importieren?</h2>' +
      '<p>Gefunden: Version ' + res.schema + '-Spielstand mit <b>' + fmt(p.points) + ' Punkten</b>, ' + Game.levelsCompleted(p) + ' von 25 Leveln, ' +
      p.worldsUnlocked + ' Welten frei, ' + fmt(n.stats.tasks) + ' gelösten Aufgaben.</p>' +
      '<p class="muted">Der aktuelle Stand (' + fmt(state.progress.points) + ' Punkte) wird ersetzt und vorher automatisch gesichert.</p>', [
      { label: 'Importieren', cls: 'btn-purple', fn: function () {
        Store.backupBeforeImport(state);
        state = n; worldIdx = Math.min(state.progress.lastWorld, state.progress.worldsUnlocked - 1); colorSrc = W[Math.max(0, worldIdx)];
        save(true); applySettings(); closeModal(); renderParents(); refreshBinds();
        toast('Spielstand importiert.');
      } },
      { label: 'Abbrechen', cls: 'btn-ghost', fn: closeModal }
    ]);
  }

  /* =====================================================================
     Version 2: kontrollierte Updates (keine Reload-Schleife)
     ===================================================================== */
  function showUpdateReady() {
    updateReady = true;
    var b = $('update-bar'); if (b) b.hidden = false;
    if (current === 'parents') renderSettings();
  }
  function applyUpdate() {
    if (!swReg || !swReg.waiting) { window.location.reload(); return; }
    save(true);
    try { sessionStorage.setItem('ma-update-at', String(Date.now())); } catch (e) { /* egal */ }
    swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  function recentlyUpdated() {
    try { return Date.now() - Number(sessionStorage.getItem('ma-update-at') || 0) < 15000; } catch (e) { return false; }
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
    var medals = '';
    for (var r = 1; r <= 10; r++) {
      var has = p.mul.medals.indexOf(String(r)) >= 0, rs = Game.rowStars(p, r);
      medals += '<div class="collect-card' + (has ? '' : ' locked locked-soft') + '">' + Gfx.rowMedal(r, has) +
        '<span>' + r + 'er-Reihe</span><small>× ' + starText(rs.mul) + ' · ÷ ' + starText(rs.div) + '</small></div>';
    }
    $('collect-medals').innerHTML = medals;
  }
  function starText(n) { return n ? new Array(n + 1).join('★') + new Array(4 - n).join('☆') : '☆☆☆'; }

  /* ---------- Elternbereich ---------- */
  var SETTINGS_UI = [
    { group: 'Rechenbereich' },
    { key: 'area', label: 'Rechenbereich beim Start', help: 'Das Kind kann auf der Abenteuerkarte jederzeit selbst wechseln.', opts: [['addsub', 'Plus & Minus'], ['muldiv', 'Mal & Geteilt']] },
    { group: 'Plus & Minus' },
    { key: 'range', label: 'Zahlenraum', opts: [[20, 'bis 20'], [50, 'bis 50'], [100, 'bis 100']] },
    { key: 'add', label: 'Addition (Plus)', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'sub', label: 'Subtraktion (Minus)', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'carry', label: 'Zehnerübergang', help: 'z. B. 47 + 28 oder 52 − 7', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'difficulty', label: 'Schwierigkeit', help: 'Automatisch: steigt mit den Welten und passt sich dem Kind an. Manuell: nur Zahlenraum und Zehnerübergang zählen.', opts: [['auto', 'automatisch'], ['manual', 'manuell']] },
    { group: 'Mal & Geteilt (kleines Einmaleins)' },
    { key: 'mul', label: 'Multiplikation (Mal)', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'div', label: 'Division (Geteilt)', help: 'Immer ohne Rest, nie durch 0.', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'rows', label: 'Reihen', help: 'Einzelne oder mehrere Reihen antippen · „alle“: Reihen 1–10 gleichmäßig · „gemischt“: alle Reihen, schwierige (3, 4, 6–9) etwas häufiger.', custom: 'rows' },
    { group: 'Spielablauf' },
    { key: 'answerMode', label: 'Antwortmodus', opts: [['keypad', 'Zahlentastatur'], ['mc', 'Multiple Choice']] },
    { key: 'roundLength', label: 'Rundenlänge (Aufgaben pro Level)', help: '„Unbegrenzt“: Level kann ab 5 Aufgaben beendet werden. Gilt auch für die Stoppuhr-Runde (unbegrenzt = 20 Aufgaben).', opts: [[5, '5'], [10, '10'], [20, '20'], [0, 'unbegrenzt']] },
    { key: 'hints', label: 'Hilfestellungen', help: 'Rechentipps nach dem 2. Fehlversuch', opts: [[true, 'an'], [false, 'aus']] },
    { group: 'Tempo' },
    { key: 'tempo', label: 'Tempo-Modus', help: 'Zusätzliche Tempo-Runde auf der Karte. Die normalen Level bleiben unverändert. Stoppuhr gilt auch fürs Reihentraining.', opts: [['off', 'aus'], ['countdown', 'Countdown'], ['stopwatch', 'Stoppuhr']] },
    { key: 'countdownSec', label: 'Countdown-Dauer', custom: 'countdown' },
    { group: 'Darstellung, Ton & Bewegung' },
    { key: 'theme', label: 'Darstellung', help: '„System“ folgt der Einstellung des iPads.', opts: [['light', 'Hell'], ['dark', 'Dunkel'], ['system', 'System']] },
    { key: 'sound', label: 'Sound', opts: [[true, 'an'], [false, 'aus']] },
    { key: 'animations', label: 'Animationen', opts: [['full', 'an'], ['reduced', 'reduziert']] }
  ];
  function renderParents() {
    showTab('settings');
    renderSettings();
    renderStats();
  }
  function segButton(key, val, label, pressed) {
    return '<button data-set="' + key + '" data-val="' + JSON.stringify(val).replace(/"/g, '&quot;') + '" aria-pressed="' + pressed + '">' + label + '</button>';
  }
  function renderSettings() {
    var html = '', open = false, st = state.settings;
    SETTINGS_UI.forEach(function (s) {
      if (s.group) { if (open) html += '</div>'; html += '<div class="setting-group"><h3>' + s.group + '</h3>'; open = true; return; }
      html += '<div class="setting' + (s.custom ? ' setting--wide' : '') + '"><div class="setting-label">' + s.label + (s.help ? '<small>' + s.help + '</small>' : '') + '</div>';
      if (s.custom === 'rows') {
        html += '<div class="seg seg--rows" role="group" aria-label="Reihen">';
        for (var r = 1; r <= 10; r++) html += '<button data-row-set="' + r + '" aria-label="' + r + 'er-Reihe" aria-pressed="' + (st.rowMode === 'select' && st.rows.indexOf(r) >= 0) + '">' + r + '</button>';
        html += '<button data-row-set="all" aria-pressed="' + (st.rowMode === 'all') + '">alle</button><button data-row-set="mixed" aria-pressed="' + (st.rowMode === 'mixed') + '">gemischt</button></div>';
      } else if (s.custom === 'countdown') {
        var presets = [60, 120, 300, 600], isPreset = presets.indexOf(st.countdownSec) >= 0;
        html += '<div class="seg" role="group" aria-label="Countdown-Dauer">';
        presets.forEach(function (v) { html += segButton('countdownSec', v, (v / 60) + ' Min', st.countdownSec === v); });
        html += '<button aria-pressed="' + !isPreset + '" data-cd-custom="1">' + (isPreset ? 'eigene …' : fmtDur(st.countdownSec * 1000)) + '</button></div>';
      } else {
        html += '<div class="seg" role="group" aria-label="' + s.label + '">';
        s.opts.forEach(function (o) { html += segButton(s.key, o[0], o[1], st[s.key] === o[0]); });
        html += '</div>';
      }
      html += '</div>';
    });
    if (open) html += '</div>';
    html += '<div class="setting-group"><h3>Daten</h3>' +
      '<div class="setting"><div class="setting-label">Spielstand exportieren<small>Speichert Einstellungen, Fortschritt, Statistik, Tempo- und Einmaleins-Daten als JSON-Datei (z. B. in „Dateien“).</small></div>' +
      '<button class="btn btn-secondary btn-small" id="btn-export">' + Gfx.icon('download') + '<span>Exportieren</span></button></div>' +
      '<div class="setting"><div class="setting-label">Spielstand importieren<small>Liest eine exportierte Datei (Version 1 oder 2) ein. Der aktuelle Stand wird vorher automatisch gesichert.</small></div>' +
      '<button class="btn btn-purple btn-small" id="btn-import">' + Gfx.icon('upload') + '<span>Importieren …</span></button></div></div>';
    html += '<div class="setting-group danger-zone"><h3>Spielstand</h3><div class="setting"><div class="setting-label">Fortschritt zurücksetzen<small>Löscht Punkte, Sterne, Level, Sammlung, Einmaleins-Sterne, Tempo-Bestwerte und Statistik. Einstellungen bleiben erhalten.</small></div>' +
      '<button class="btn btn-danger" id="btn-reset" style="font-size:18px;min-height:52px">Zurücksetzen …</button></div></div>';
    if (updateReady) html += '<div class="setting-group"><div class="setting"><div class="setting-label">Neue Version bereit<small>Wird sonst beim nächsten Öffnen automatisch aktiv.</small></div><button class="btn btn-purple btn-small" data-update="apply">Jetzt aktualisieren</button></div></div>';
    var meta = state.meta || {};
    html += '<p class="privacy-note">Datenschutz: Alle Daten bleiben ausschließlich auf diesem Gerät (lokaler Speicher des Browsers). Es gibt kein Konto, kein Tracking, keine Werbung und keine Übertragung an Server.' +
      (Store.storageOk() ? '' : ' <b>Achtung: Der Browser erlaubt gerade keine Speicherung (z. B. privater Modus) – der Spielstand geht beim Schließen verloren.</b>') +
      '<br><b class="app-version">Mathe-Abenteuer (Funki) · Version ' + MA.VERSION.app + '</b>' +
      (meta.migratedFrom === 1 ? ' · Spielstand aus Version 1 übernommen' + (meta.migratedAt ? ' am ' + new Date(meta.migratedAt).toLocaleDateString('de-DE') : '') : '') + '</p>';
    $('tab-settings').innerHTML = html;
  }
  function setSetting(key, val) {
    var s = state.settings;
    if ((key === 'add' && val === false && !s.sub) || (key === 'sub' && val === false && !s.add)) {
      toast('Mindestens eine Rechenart muss an sein.');
      return;
    }
    if ((key === 'mul' && val === false && !s.div) || (key === 'div' && val === false && !s.mul)) {
      toast('Mal oder Geteilt muss an sein.');
      return;
    }
    s[key] = val;
    commitSettings();
    if (key === 'sound' && val) Sound.play('correct');
  }
  function commitSettings() {
    state = Store.sanitize(state);
    applySettings();
    save(true);
    if (current === 'parents') renderSettings();
  }
  function setRows(v) {
    var s = state.settings;
    if (v === 'all' || v === 'mixed') { s.rowMode = v; s.rows = Store.ROWS.slice(); }
    else {
      var r = Number(v);
      if (s.rowMode !== 'select') { s.rowMode = 'select'; s.rows = [r]; }
      else {
        var i = s.rows.indexOf(r);
        if (i >= 0) { if (s.rows.length === 1) { toast('Mindestens eine Reihe muss gewählt sein.'); return; } s.rows.splice(i, 1); }
        else s.rows.push(r);
      }
    }
    commitSettings();
  }
  function askCustomCountdown() {
    var cur = Math.round(state.settings.countdownSec / 60);
    openModal('<h2 id="modal-title" style="color:var(--purple-dark)">Eigene Dauer</h2><p>Minuten (1 bis 30):</p>' +
      '<input class="text-input" id="cd-minutes" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="' + cur + '" aria-label="Minuten">', [
      { label: 'Übernehmen', cls: 'btn-primary', fn: function () {
        var m = parseInt(($('cd-minutes') || {}).value, 10);
        if (!isFinite(m) || m < 1 || m > 30) { toast('Bitte 1 bis 30 Minuten eingeben.'); return; }
        closeModal(); state.settings.countdownSec = m * 60; commitSettings();
      } },
      { label: 'Abbrechen', cls: 'btn-ghost', fn: closeModal }
    ]);
    setTimeout(function () { var i = $('cd-minutes'); if (i) { i.focus(); i.select(); } }, 80);
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function secs(ms, n) { return n ? (ms / n / 1000).toFixed(1).replace('.', ',') + ' s' : '–'; }
  function fmtDur(ms) {
    var t = Math.max(0, Math.round(ms / 1000)), m = Math.floor(t / 60), x = t % 60;
    return m + ':' + (x < 10 ? '0' : '') + x;
  }
  function fmtDurLong(ms) {
    var t = Math.max(0, ms / 1000);
    if (t < 60) return t.toFixed(1).replace('.', ',') + ' s';
    return fmtDur(ms) + ' min';
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
    // Rechenarten (V2)
    var o = st.ops;
    html += '<div class="stat-card"><h3>Nach Rechenart</h3><table class="stat-table"><thead><tr><th>Rechenart</th><th>Aufgaben</th><th>auf Anhieb</th><th>Ø Zeit</th></tr></thead><tbody>' +
      [['add', 'Plus'], ['sub', 'Minus'], ['mul', 'Mal'], ['div', 'Geteilt']].map(function (x) {
        var c = o[x[0]];
        return '<tr><td>' + x[1] + '</td><td>' + fmt(c.n) + '</td><td>' + (c.n ? pct(c.first, c.n) + ' %' : '–') + '</td><td>' + secs(c.time, c.n) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    // Einmaleins-Reihen (V2)
    var mc = st.mulCats || {}, rowsHtml = '';
    for (var r = 1; r <= 10; r++) {
      var cm = mc['mul|' + r] || { n: 0, wrong: 0, time: 0 }, cd = mc['div|' + r] || { n: 0, wrong: 0, time: 0 }, rs = Game.rowStars(p, r);
      rowsHtml += '<tr><td>' + r + 'er</td><td>' + (cm.n ? cm.n + ' · ' + pct(cm.n - cm.wrong, cm.n) + ' %' : '–') + '</td><td>' + (cd.n ? cd.n + ' · ' + pct(cd.n - cd.wrong, cd.n) + ' %' : '–') + '</td><td>' + secs(cm.time + cd.time, cm.n + cd.n) + '</td><td>' + starText(rs.mul) + ' / ' + starText(rs.div) + '</td></tr>';
    }
    html += '<div class="stat-card"><h3>Einmaleins nach Reihen</h3><table class="stat-table"><thead><tr><th>Reihe</th><th>Mal (auf Anhieb)</th><th>Geteilt (auf Anhieb)</th><th>Ø Zeit</th><th>Sterne × / ÷</th></tr></thead><tbody>' + rowsHtml +
      '</tbody></table><p class="muted">Medaillen: ' + p.mul.medals.length + ' / 10 · Aufgaben-Runden: ' + p.mul.rounds + '</p></div>';
    // Fehlerschwerpunkte
    var all = [];
    [st.cats, mc].forEach(function (src) {
      Object.keys(src).forEach(function (k) { var c = src[k]; all.push({ k: k, n: c.n, w: c.wrong, r: c.n ? c.wrong / c.n : 0, t: c.n ? c.time / c.n / 1000 : 0 }); });
    });
    var cats = all.filter(function (c) { return c.n >= 3 && c.w > 0; }).sort(function (a, b) { return b.r - a.r || b.n - a.n; });
    html += '<div class="stat-card"><h3>Häufigste Fehlertypen</h3>';
    if (!cats.length) html += '<p class="muted">Noch nicht genug Daten. Nach einigen Aufgaben erscheinen hier die Schwerpunkte.</p>';
    else html += cats.slice(0, 6).map(function (c) {
      return '<div class="err-row"><span>' + Gen.categoryLabel(c.k) + '<br><small class="muted">' + c.n + ' Aufgaben · Ø ' + c.t.toFixed(1).replace('.', ',') + ' s</small></span>' +
        '<span class="err-bar"><i style="width:' + Math.round(c.r * 100) + '%"></i></span><span>' + Math.round(c.r * 100) + ' %</span></div>';
    }).join('') + '<p class="muted">Prozent = Anteil der Aufgaben, die nicht auf Anhieb gelöst wurden. Schwierige Aufgabentypen und Reihen kommen automatisch etwas häufiger dran.</p>';
    html += '</div>';
    // Tempo (V2)
    var tp = state.tempo, bests = Object.keys(tp.best);
    html += '<div class="stat-card"><h3>Tempo-Runden</h3><p class="muted">Gespielte Tempo-Runden: ' + fmt(tp.rounds) + '</p>';
    if (bests.length) {
      html += '<table class="stat-table"><thead><tr><th>Bestwert</th><th>Wert</th><th>Datum</th></tr></thead><tbody>' + bests.map(function (k) {
        var b = tp.best[k], cd = k.indexOf('cd|') === 0;
        return '<tr><td>' + esc(b.label || k) + '</td><td>' + (cd ? b.v + ' richtig' : fmtDurLong(b.v)) + '</td><td>' + (b.at ? new Date(b.at).toLocaleDateString('de-DE') : '–') + '</td></tr>';
      }).join('') + '</tbody></table>';
    }
    if (tp.history.length) {
      html += '<h3 class="stat-sub">Letzte Runden</h3><table class="stat-table"><thead><tr><th>Runde</th><th>Aufgaben</th><th>Treffer</th><th>Zeit</th></tr></thead><tbody>' +
        tp.history.slice(-6).reverse().map(function (h) {
          return '<tr><td>' + esc(h.label) + (h.best ? ' (Rekord)' : '') + '</td><td>' + h.tasks + '</td><td>' + pct(h.correct, h.tasks) + ' %</td><td>' + fmtDurLong(h.ms) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    if (!bests.length && !tp.history.length) html += '<p class="muted">Noch keine Tempo-Runde gespielt. Den Tempo-Modus schaltest du unter Einstellungen → Tempo ein.</p>';
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
    openModal('<h2 id="modal-title" style="color:#B23A33">Fortschritt löschen?</h2><p>Punkte, Sterne, Level, Sammlung, Einmaleins-Sterne, Tempo-Bestwerte und Statistik werden gelöscht. Das kann nicht rückgängig gemacht werden.</p>', [
      { label: 'Abbrechen', cls: 'btn-green', fn: closeModal },
      { label: 'Ja, löschen', cls: 'btn-danger', id: 'reset-yes', fn: function (e) {
        var b = e.currentTarget;
        if (step === 0) { step = 1; b.textContent = 'Wirklich? Nochmal tippen'; return; }
        state = Store.resetProgress(state);
        worldIdx = 0; colorSrc = W[0];
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
      if (t.id === 'btn-finish') { Sound.play('click'); if (S && !S.busy && S.done >= 5) finishSession(); return; }
      // Version 2
      if (t.hasAttribute('data-area')) { Sound.play('click'); state.settings.area = t.getAttribute('data-area'); save(true); renderMap(); var sc = $('screen-map').querySelector('.scroll'); if (sc) sc.scrollTop = 0; return; }
      if (t.hasAttribute('data-action')) {
        Sound.play('click');
        var act = t.getAttribute('data-action');
        if (act === 'mul-round') startMulRound();
        else if (act === 'tempo') startTempo(state.settings.area);
        return;
      }
      if (t.hasAttribute('data-row')) { Sound.play('click'); chooseRow(+t.getAttribute('data-row')); return; }
      if (t.hasAttribute('data-row-set')) { Sound.play('click'); setRows(t.getAttribute('data-row-set')); return; }
      if (t.hasAttribute('data-cd-custom')) { Sound.play('click'); askCustomCountdown(); return; }
      if (t.hasAttribute('data-update')) { Sound.play('click'); applyUpdate(); return; }
      if (t.id === 'btn-export') { Sound.play('click'); exportState(); return; }
      if (t.id === 'btn-import') { Sound.play('click'); var fi = $('import-file'); fi.value = ''; fi.click(); return; }
      if (t.id === 'btn-rows-back') { Sound.play('click'); leaveRows(); return; }
      if (t.id === 'btn-rows-check') { checkRow(currentRowIndex()); return; }
    });
    $('import-file').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; onImportFile(f); });
    // Reihentraining: Eingabe nur Ziffern, Enter/Weiter prüft und springt weiter
    $('rows-list').addEventListener('input', function (e) {
      var i = e.target; if (!i.hasAttribute('data-ri')) return;
      var clean = i.value.replace(/\D/g, '').slice(0, 3);
      if (clean !== i.value) i.value = clean;
      if (R) { var idx = Number(i.getAttribute('data-ri')); R.starts[idx] = R.starts[idx] || Date.now(); $('rl-' + idx).classList.remove('is-wrong'); }
    });
    $('rows-list').addEventListener('keydown', function (e) {
      var i = e.target; if (!i.hasAttribute('data-ri')) return;
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); checkRow(Number(i.getAttribute('data-ri'))); }
    });
    $('rows-list').addEventListener('submit', function (e) { e.preventDefault(); });
    $('rows-list').addEventListener('focusin', function (e) {
      var i = e.target; if (R && i.hasAttribute('data-ri')) { var idx = Number(i.getAttribute('data-ri')); R.starts[idx] = R.starts[idx] || Date.now(); }
    });
    if (darkMQ) {
      var onScheme = function () { if (state.settings.theme === 'system') applyTheme(); };
      if (darkMQ.addEventListener) darkMQ.addEventListener('change', onScheme); else if (darkMQ.addListener) darkMQ.addListener(onScheme);
    }
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
      if (current === 'rows' && e.key === 'Escape') { leaveRows(); return; }
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
      if (now - lastTouch < 300 && !e.target.closest('button, input, label, textarea, select')) e.preventDefault();
      lastTouch = now;
    }, { passive: false });

    // Speichern beim Verlassen
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        save(true);
        if (current === 'play' && S && S.tempo && !S.finished && !modalOpen()) leaveLevel();   // Uhr anhalten
        if (current === 'rows' && R && R.watch && !R.finished && !R.watch.hiddenAt) R.watch.hiddenAt = Date.now();
      } else if (current === 'rows' && R && R.watch && R.watch.hiddenAt && !modalOpen()) {
        R.watch.pausedMs += Date.now() - R.watch.hiddenAt; R.watch.hiddenAt = 0;
      }
    });
    window.addEventListener('pagehide', function () { save(true); });
    window.addEventListener('storage', function (e) { if (e.key === Store.KEY && current !== 'play' && current !== 'rows') { state = Store.load(); applySettings(); refreshBinds(); } });
  }
  function flashKey(k) {
    var b = $('keypad').querySelector('[data-key="' + k + '"]'); if (!b) return;
    b.classList.add('pressed'); setTimeout(function () { b.classList.remove('pressed'); }, 120);
  }

  /* ---------- Service Worker (Offline & Updates) ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      var hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController) { hadController = true; return; }   // erste Installation: kein Neuladen nötig
        if (refreshing) return;
        refreshing = true;
        updatePending = true;
        save(true);
        if (current === 'start' && !modalOpen()) window.location.reload();
        else { var n = $('update-note'); if (n) n.hidden = false; }
      });
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' }).then(function (reg) {
        swReg = reg;
        if (reg.waiting && navigator.serviceWorker.controller) onWaiting();
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) onWaiting();
          });
        });
        try { reg.update(); } catch (e) { /* offline */ }
        document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { reg.update(); } catch (e) { /* offline */ } } });
      }).catch(function () { /* ohne SW läuft die App trotzdem */ });
    });
    if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) { /* optional */ } }
  }
  /* Neue Version liegt bereit: auf dem Startbildschirm (ruhiger Moment) direkt übernehmen, sonst Hinweis zeigen */
  function onWaiting() {
    showUpdateReady();
    if (current === 'start' && !modalOpen() && !recentlyUpdated()) applyUpdate();
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
    window.MA_APP = { state: function () { return state; }, session: function () { return S; }, rows: function () { return R; },
      go: go, startLevel: startLevel, submit: submit, startMulRound: startMulRound, startTempo: startTempo, startRows: startRows,
      checkRow: checkRow, handleImportText: handleImportText, exportData: function () { return Store.exportData(state); },
      setSetting: setSetting, theme: currentTheme, version: MA.VERSION.app };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
