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
  var judgeEl = $("judge");
  var scoreRightEl = $("score-right");
  var scoreWrongEl = $("score-wrong");
  var cardEl = $("card");
  var screens = { welcome: $("welcome"), play: $("play"), paused: $("paused"), done: $("done"),
    countdown: $("countdown") };
  var countEl = $("count");

  // ---------- State ----------
  var selected = loadSelection();
  var deck = [];
  var index = -1;
  var revealed = false;
  var total = 0;   // fatos diferentes na rodada
  var right = 0;   // fatos já acertados (saem da fila)
  var wrong = 0;   // fatos errados que ainda vão reaparecer
  var misses = 0;  // total de vezes que a criança marcou "Errei"
  var firstTry = 0; // fatos acertados sem nunca terem sido errados
  var state = "idle"; // idle | countdown | playing | paused | done
  var countdownId = null;
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

  // Progresso = fatos já acertados. Os errados voltam para o fim da fila,
  // então a rodada só termina quando todos forem acertados.
  function renderProgress() {
    progressEl.textContent = right + " / " + total;
    barFill.style.width = total ? (100 * right / total) + "%" : "0";
  }

  function renderFact() {
    var f = deck[index];
    questionEl.textContent = f.x + " " + OPS[f.op].symbol + " " + f.y + " = ";
    answerEl.textContent = revealed ? String(f.r) : "?";
    answerEl.classList.toggle("shown", revealed);
    factEl.style.setProperty("--op-color", OPS[f.op].color);
    hintEl.textContent = revealed ? "Você acertou?" : "Toque na tela para ver a resposta";
    judgeEl.classList.toggle("hidden", !revealed);
  }

  function renderScore() {
    scoreRightEl.textContent = right;
    scoreWrongEl.textContent = wrong;
  }

  function bump(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // reinicia a animação
    el.classList.add(cls);
  }

  // ---------- Game flow ----------
  // Começar/Reiniciar: zera tudo e mostra uma contagem "3, 2, 1, Já!" antes do primeiro fato.
  function startGame() {
    if (selected.length === 0) return;
    stopClock();
    clearInterval(countdownId);
    elapsed = 0;
    deck = [];
    index = -1;
    revealed = false;
    total = 0;
    right = 0;
    wrong = 0;
    misses = 0;
    firstTry = 0;
    state = "countdown";
    renderScore();
    renderTimer();
    renderProgress();
    renderControls();

    var n = 3;
    function step() {
      countEl.textContent = n > 0 ? String(n) : "Já!";
      show("countdown");
      countEl.classList.remove("tick");
      void countEl.offsetWidth; // reinicia a animação
      countEl.classList.add("tick");
    }
    step();
    countdownId = setInterval(function () {
      n--;
      if (n >= 0) { step(); return; }
      clearInterval(countdownId);
      countdownId = null;
      playGame();
    }, 700);
  }

  function playGame() {
    deck = [];
    ORDER.forEach(function (op) {
      if (selected.indexOf(op) !== -1) deck = deck.concat(factsFor(op));
    });
    shuffle(deck);
    total = deck.length;
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
    clearInterval(countdownId);
    countdownId = null;
    stopClock();
    state = "idle";
    elapsed = 0;
    deck = [];
    index = -1;
    revealed = false;
    total = 0;
    right = 0;
    wrong = 0;
    misses = 0;
    firstTry = 0;
    renderScore();
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

    // Depois de ver a resposta, só os botões Acertei/Errei avançam.
    if (!revealed) {
      revealed = true;
      renderFact();
    }
  }

  function judge(correct) {
    if (state !== "playing" || !revealed) return;
    var f = deck[index];
    if (correct) {
      right++;
      if (f.missed) {
        wrong--; // estava na fila de revisão e agora foi acertado
        f.missed = false;
        bump(scoreWrongEl.parentNode, "bump");
      } else {
        firstTry++;
      }
      bump(scoreRightEl.parentNode, "bump");
      bump(cardEl, "flash-right");
    } else {
      misses++;
      if (!f.missed) {
        wrong++;
        f.missed = true;
      }
      deck.push(f); // volta para o fim da fila e reaparece depois
      bump(scoreWrongEl.parentNode, "bump");
      bump(cardEl, "flash-wrong");
    }
    renderScore();
    renderProgress();

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
    $("done-count").textContent = total;
    $("done-time").textContent = formatTime(elapsed);
    $("done-first").textContent = firstTry;
    $("done-pct").textContent = Math.round(100 * firstTry / total) + "%";
    $("done-misses").textContent = misses;
    $("done-misses-label").textContent = misses === 1 ? "vez" : "vezes";
    $("done-retry").classList.toggle("hidden", misses === 0);
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

  $("btn-right").addEventListener("click", function (e) { e.stopPropagation(); judge(true); });
  $("btn-wrong").addEventListener("click", function (e) { e.stopPropagation(); judge(false); });

  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      advance();
    } else if (e.key === "a" || e.key === "A") {
      judge(true);
    } else if (e.key === "e" || e.key === "E") {
      judge(false);
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
