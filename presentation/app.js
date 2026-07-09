/* ============================================================
   Ambiente Futbolero · Informe de Premiación
   Motor de presentación dinámica
   ============================================================ */
(function () {
  "use strict";

  // ---- Datos de cada slide -------------------------------------------------
  const SLIDES = [
    { img: "slides/slide-01.jpg", type: "cover",
      tag: "Informe de Premiación" },

    { img: "slides/slide-02.jpg", type: "winner", num: 1,
      name: "Yanette Bonilla Arias", city: "Pereira",
      prize: "Patineta Eléctrica Segway ZT3 Pro" },

    { img: "slides/slide-03.jpg", type: "winner", num: 2,
      name: "Adriana Cuintaco", city: "Bogotá",
      prize: "TV Samsung QLED 50”" },

    { img: "slides/slide-04.jpg", type: "winner", num: 3,
      name: "Daniel Alejandro Cross Carranza", city: "Bogotá",
      prize: "Kit Futbolero", note: "Carta de desistimiento" },

    { img: "slides/slide-05.jpg", type: "winner", num: 4,
      name: "Valeria Duque Rangel", city: "Pereira",
      prize: "Lámpara de mesa WiZ Squire" },

    { img: "slides/slide-06.jpg", type: "winner", num: 5,
      name: "Juan Camilo Vélez Ocampo", city: "Pereira",
      prize: "Lámpara de mesa WiZ Squire" },

    { img: "slides/slide-07.jpg", type: "winner", num: 6,
      name: "Valentina Osorio", city: "Pereira",
      prize: "Lámpara de mesa WiZ Squire" },

    { img: "slides/slide-08.jpg", type: "winner", num: 7,
      name: "Margarita Londoño", city: "Pereira",
      prize: "Lámpara de mesa WiZ Squire" },

    { img: "slides/slide-09.jpg", type: "winner", num: 8,
      name: "Juan David Bohórquez", city: "Pereira",
      prize: "Set X3 bombillos WiZ RGB" },

    { img: "slides/slide-10.jpg", type: "winner", num: 9,
      name: "Luz Adriana Ríos", city: "Pereira",
      prize: "Set X3 bombillos WiZ RGB" },

    { img: "slides/slide-11.jpg", type: "winner", num: 10,
      name: "Laura Castaño", city: "Pereira",
      prize: "Set X3 bombillos WiZ RGB" },

    { img: "slides/slide-12.jpg", type: "closing",
      tag: "¡Gracias!" }
  ];

  const AUTOPLAY_MS = 6500;
  const CONFETTI_COLORS = ["#19a7e8", "#4fd2ff", "#ffffff", "#0b5ed7", "#ffd257"];

  // ---- Estado --------------------------------------------------------------
  let index = 0;
  let playing = false;
  let autoTimer = null;

  // ---- Elementos -----------------------------------------------------------
  const $ = (s) => document.querySelector(s);
  const deck = $("#deck");
  const dotsWrap = $("#dots");
  const confettiWrap = $("#confetti");
  const progressBar = $("#progressBar");
  const curEl = $("#cur");
  const totalEl = $("#total");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");
  const playBtn = $("#playBtn");
  const fsBtn = $("#fsBtn");
  const intro = $("#intro");
  const stage = $("#stage");

  const pad = (n) => String(n).padStart(2, "0");

  // ---- Construcción de slides ---------------------------------------------
  function buildSlides() {
    const frag = document.createDocumentFragment();

    SLIDES.forEach((s, i) => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.dataset.index = i;

      const img = document.createElement("div");
      img.className = "slide-img";
      img.style.backgroundImage = `url("${s.img}")`;
      slide.appendChild(img);

      if (s.type === "winner") {
        slide.appendChild(buildLowerThird(s));
      } else if (s.tag) {
        const tag = document.createElement("div");
        tag.className = "tag";
        tag.innerHTML = `<span class="pulse"></span>${s.tag}`;
        slide.appendChild(tag);
      }

      frag.appendChild(slide);

      // precarga
      const pre = new Image();
      pre.src = s.img;
    });

    deck.appendChild(frag);
  }

  function buildLowerThird(s) {
    const el = document.createElement("div");
    el.className = "lower";
    el.innerHTML = `
      <div class="lower-num">${pad(s.num)}</div>
      <div class="lower-body">
        <div class="lower-kicker">Ganador ${s.num}</div>
        <div class="lower-name">${s.name}</div>
        <div class="lower-meta">
          <span class="lower-chip"><span class="dot"></span>${s.city}</span>
          <span class="lower-chip"><span class="dot"></span>Premio: <b>${s.prize}</b></span>
        </div>
        ${s.note ? `<span class="lower-note">${s.note}</span>` : ""}
      </div>`;
    return el;
  }

  // ---- Navegación ----------------------------------------------------------
  function buildDots() {
    SLIDES.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "dot";
      d.setAttribute("aria-label", "Ir al slide " + (i + 1));
      d.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(d);
    });
    totalEl.textContent = pad(SLIDES.length);
  }

  function slideEls() {
    return deck.querySelectorAll(".slide");
  }

  function render(dir) {
    const slides = slideEls();
    slides.forEach((el, i) => {
      el.classList.remove("active", "leaving", "dir-next", "dir-prev");
      if (i === index) {
        el.classList.add("active", dir === -1 ? "dir-prev" : "dir-next");
      }
    });

    dotsWrap.querySelectorAll(".dot").forEach((d, i) =>
      d.classList.toggle("on", i === index)
    );

    curEl.textContent = pad(index + 1);
    progressBar.style.width = ((index + 1) / SLIDES.length) * 100 + "%";
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === SLIDES.length - 1;

    if (SLIDES[index].type === "winner") burstConfetti();

    if (playing) restartAuto();
  }

  function goTo(i, dir) {
    i = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (i === index && dir === undefined) return;
    const d = dir !== undefined ? dir : i > index ? 1 : -1;
    index = i;
    render(d);
  }

  function next() {
    if (index < SLIDES.length - 1) goTo(index + 1, 1);
    else if (playing) { goTo(0, 1); } // loop en autoplay
  }
  function prev() { if (index > 0) goTo(index - 1, -1); }

  // ---- Confeti -------------------------------------------------------------
  function burstConfetti() {
    confettiWrap.innerHTML = "";
    const n = 46;
    for (let k = 0; k < n; k++) {
      const piece = document.createElement("i");
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const dur = 2.4 + Math.random() * 1.8;
      const color = CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0];
      const drift = (Math.random() * 40 - 20).toFixed(0);
      piece.style.left = left + "%";
      piece.style.background = color;
      piece.style.setProperty("--drift", drift + "px");
      piece.style.width = 6 + Math.random() * 6 + "px";
      piece.style.height = 10 + Math.random() * 8 + "px";
      piece.style.animation = `confettiFall ${dur}s ease-in ${delay}s forwards`;
      piece.style.transform = `translateX(${drift}px)`;
      confettiWrap.appendChild(piece);
    }
    // limpieza
    setTimeout(() => { if (confettiWrap.children.length) confettiWrap.innerHTML = ""; }, 4800);
  }

  // ---- Autoplay ------------------------------------------------------------
  function restartAuto() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(next, AUTOPLAY_MS);
  }
  function setPlaying(v) {
    playing = v;
    playBtn.classList.toggle("playing", v);
    playBtn.setAttribute("aria-pressed", v);
    if (v) restartAuto(); else clearTimeout(autoTimer);
  }

  // ---- Pantalla completa ---------------------------------------------------
  function toggleFs() {
    const root = document.documentElement;
    if (!document.fullscreenElement) {
      (root.requestFullscreen || root.webkitRequestFullscreen)?.call(root);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    }
  }

  // ---- Arranque ------------------------------------------------------------
  function startShow() {
    intro.classList.add("hide");
    stage.classList.add("show");
    stage.setAttribute("aria-hidden", "false");
    index = 0;
    render(1);
  }

  // ---- Eventos -------------------------------------------------------------
  function bind() {
    $("#startBtn").addEventListener("click", startShow);
    nextBtn.addEventListener("click", next);
    prevBtn.addEventListener("click", prev);
    playBtn.addEventListener("click", () => setPlaying(!playing));
    fsBtn.addEventListener("click", toggleFs);

    document.addEventListener("keydown", (e) => {
      if (intro.classList.contains("hide") === false) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startShow(); }
        return;
      }
      switch (e.key) {
        case "ArrowRight": case "PageDown": case " ": e.preventDefault(); next(); break;
        case "ArrowLeft": case "PageUp": prev(); break;
        case "Home": goTo(0, -1); break;
        case "End": goTo(SLIDES.length - 1, 1); break;
        case "f": case "F": toggleFs(); break;
        case "p": case "P": setPlaying(!playing); break;
      }
    });

    // Swipe táctil
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) { dx < 0 ? next() : prev(); }
      x0 = null;
    }, { passive: true });
  }

  // ---- Deep link (#N abre directo en ese slide) ----------------------------
  function fromHash() {
    const m = /^#s?(\d+)$/.exec(location.hash);
    if (!m) return false;
    const n = Math.max(1, Math.min(SLIDES.length, parseInt(m[1], 10)));
    intro.classList.add("hide");
    stage.classList.add("show");
    stage.setAttribute("aria-hidden", "false");
    index = n - 1;
    render(1);
    return true;
  }

  // ---- Init ----------------------------------------------------------------
  buildSlides();
  buildDots();
  bind();
  fromHash();
})();
