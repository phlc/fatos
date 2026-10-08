(function () {
  "use strict";

  var OPS = {
    add: { symbol: "+", color: "var(--add)" },
    sub: { symbol: "−", color: "var(--sub)" },
    mul: { symbol: "×", color: "var(--mul)" },
    div: { symbol: "÷", color: "var(--div)" }
  };
  var ORDER = ["add", "sub", "mul", "div"];
  var STORAGE_KEY = "fatos-ops";

  // ---------- Fact generation ----------
  // Adição e multiplicação: todas as combinações de 0 a 10.
  // Subtração e divisão: as operações inversas (sem divisão por zero).
  function factsFor(op) {
    var list = [];
    for (var a = 0; a <= 10; a++) {
      for (var b = 0; b <= 10; b++) {
        if (op === "add") list.push({ op: op, x: a, y: b, r: a + b });
        if (op === "sub") list.push({ op: op, x: a + b, y: a, r: b });
        if (op === "mul") list.push({ op: op, x: a, y: b, r: a * b });
        if (op === "div" && a !== 0) list.push({ op: op, x: a * b, y: a, r: b });
      }
    }
    return list;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- Elements ----------
  function $(id) { return document.getElementById(id); }
  var opButtons = Array.prototype.slice.call(document.querySelectorAll(".op"));
  var startBtn = $("start");
  var startIcon = $("start-icon");
  var startLabel = $("start-label");
  var pauseBtn = $("pause");
  var pauseIcon = $("pause-icon");
  var pauseLabel = $("pause-label");
  var timerEl = $("timer");
  var progressEl = $("progress");
  var barFill = $("bar-fill");
  var stage = $("stage");
  var factEl = $("fact");
  var questionEl = $("question");
  var answerEl = $("answer");
  var hintEl = $("hint");
  var screens = { welcome: $("welcome"), play: $("play"), paused: $("paused"), done: $("done") };

  // ---------- State ----------
  var selected = loadSelection();
  var deck = [];
  var index = -1;
  var revealed = false;
  var state = "idle"; // idle | playing | paused | done
  var elapsed = 0;
  var startedAt = 0;
  var tickId = null;

  // ---------- Persistence ----------
  function loadSelection() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) {
        return saved.filter(function (op) { return OPS[op]; });
      }
    } catch (e) { /* ignore */ }
    return ["add"];
  }

  function saveSelection() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); } catch (e) { /* ignore */ }
  }

  // ---------- Timer ----------
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function currentElapsed() {
    return state === "playing" ? elapsed + (now() - startedAt) : elapsed;
  }

  function formatTime(ms) {
    var total = Math.floor(ms / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var mm = (m < 10 ? "0" : "") + m;
    var ss = (s < 10 ? "0" : "") + s;
    return h > 0 ? h + ":" + mm + ":" + ss : mm + ":" + ss;
  }

  function renderTimer() { timerEl.textContent = formatTime(currentElapsed()); }

  function runClock() {
    startedAt = now();
    clearInterval(tickId);
    tickId = setInterval(renderTimer, 250);
  }

  function stopClock() {
    elapsed = currentElapsed();
    clearInterval(tickId);
    tickId = null;
  }

  // ---------- Rendering ----------
  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("hidden", key !== name);
    });
  }

  function renderOps() {
    opButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", selected.indexOf(btn.dataset.op) !== -1 ? "true" : "false");
    });
    startBtn.disabled = selected.length === 0;
    startBtn.title = selected.length === 0 ? "Escolha pelo menos uma operação" : "";
  }

  function renderControls() {
    var inGame = state !== "idle";
    startIcon.setAttribute("href", inGame ? "#i-restart" : "#i-play");
    startLabel.textContent = inGame ? "Reiniciar" : "Começar";
    startBtn.classList.toggle("restart", inGame);

    pauseBtn.disabled = !(state === "playing" || state === "paused");
    var isPaused = state === "paused";
    pauseBtn.setAttribute("aria-pressed", isPaused ? "true" : "false");
    pauseIcon.setAttribute("href", isPaused ? "#i-play" : "#i-pause");
    pauseLabel.textContent = isPaused ? "Continuar" : "Pausar";

    stage.classList.toggle("playing", state === "playing" || state === "paused");
  }

  function renderProgress() {
    var shown = Math.max(0, Math.min(index + 1, deck.length));
    progressEl.textContent = shown + " / " + deck.length;
    var done = index + (revealed ? 1 : 0);
    barFill.style.width = deck.length ? (100 * Math.max(0, done) / deck.length) + "%" : "0";
  }

  function renderFact() {
    var f = deck[index];
    questionEl.textContent = f.x + " " + OPS[f.op].symbol + " " + f.y + " = ";
    answerEl.textContent = revealed ? String(f.r) : "?";
    answerEl.classList.toggle("shown", revealed);
    factEl.style.setProperty("--op-color", OPS[f.op].color);
    hintEl.textContent = revealed
      ? (index + 1 < deck.length ? "Toque para o próximo" : "Toque para terminar")
      : "Toque na tela para ver a resposta";
  }

  // ---------- Game flow ----------
  function startGame() {
    if (selected.length === 0) return;
    deck = [];
    ORDER.forEach(function (op) {
      if (selected.indexOf(op) !== -1) deck = deck.concat(factsFor(op));
    });
    shuffle(deck);
    index = 0;
    revealed = false;
    elapsed = 0;
    state = "playing";
    runClock();
    renderTimer();
    show("play");
    animateNewFact();
    renderFact();
    renderProgress();
    renderControls();
    stage.focus({ preventScroll: true });
  }

  function resetToIdle() {
    stopClock();
    state = "idle";
    elapsed = 0;
    deck = [];
    index = -1;
    revealed = false;
    renderTimer();
    renderProgress();
    show("welcome");
    renderControls();
  }

  function animateNewFact() {
    factEl.classList.remove("new");
    void factEl.offsetWidth; // restart CSS animation
    factEl.classList.add("new");
  }

  function advance() {
    if (state === "paused") { resume(); return; }
    if (state !== "playing") return;

    if (!revealed) {
      revealed = true;
      renderFact();
      renderProgress();
      return;
    }

    if (index + 1 >= deck.length) {
      finish();
      return;
    }

    index++;
    revealed = false;
    animateNewFact();
    renderFact();
    renderProgress();
  }

  function finish() {
    stopClock();
    state = "done";
    renderTimer();
    $("done-count").textContent = deck.length;
    $("done-time").textContent = formatTime(elapsed);
    show("done");
    renderControls();
    celebrate();
  }

  function pause() {
    if (state !== "playing") return;
    stopClock();
    state = "paused";
    show("paused");
    renderControls();
  }

  function resume() {
    if (state !== "paused") return;
    state = "playing";
    runClock();
    show("play");
    renderControls();
  }

  function celebrate() {
    var box = $("confetti");
    var colors = ["#ffc93c", "#ff7a45", "#2ec27e", "#e84393", "#3a86ff", "#ffffff"];
    box.innerHTML = "";
    for (var i = 0; i < 80; i++) {
      var piece = document.createElement("i");
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = 2 + Math.random() * 2.5 + "s";
      piece.style.animationDelay = Math.random() * 0.8 + "s";
      piece.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      box.appendChild(piece);
    }
    setTimeout(function () { box.innerHTML = ""; }, 5500);
  }

  // ---------- Events ----------
  opButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var op = btn.dataset.op;
      var i = selected.indexOf(op);
      if (i === -1) selected.push(op); else selected.splice(i, 1);
      saveSelection();
      renderOps();

      // Mudou as operações no meio do jogo: encerra o jogo e espera um novo "Começar".
      if (state !== "idle") resetToIdle();
    });
  });

  startBtn.addEventListener("click", startGame);

  pauseBtn.addEventListener("click", function () {
    if (state === "playing") pause(); else if (state === "paused") resume();
  });

  stage.addEventListener("click", advance);

  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      advance();
    } else if (e.key === "p" || e.key === "P") {
      if (state === "playing") pause(); else if (state === "paused") resume();
    }
  });

  // Pausa automaticamente quando a criança sai da aba ou do aplicativo.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
  });

  // ---------- Init ----------
  renderOps();
  resetToIdle();
})();
