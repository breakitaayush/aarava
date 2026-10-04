(() => {
  "use strict";

  const W = window.WEDDING;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ───────── Text bindings ───────── */
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), W);
  $$("[data-bind]").forEach((el) => {
    const v = get(el.dataset.bind);
    if (v) el.textContent = v;
    else el.remove();
  });
  const names = `${W.couple.groom} & ${W.couple.bride}`;
  $$("[data-names]").forEach((el) => (el.textContent = names));
  $$("[data-mono]").forEach((el) => (el.textContent = W.couple.monogram[el.dataset.mono]));
  $$("[data-monogram]").forEach((el) => (el.textContent = `${W.couple.monogram[0]} ✦ ${W.couple.monogram[1]}`));

  /* ───────── Mandala (generated SVG) ───────── */
  function mandala() {
    const ring = (n, r, rx, ry) =>
      Array.from({ length: n }, (_, i) =>
        `<ellipse cx="0" cy="${-r}" rx="${rx}" ry="${ry}" transform="rotate(${(360 / n) * i})"/>`).join("");
    const dots = (n, r, size) =>
      Array.from({ length: n }, (_, i) => {
        const a = ((Math.PI * 2) / n) * i;
        return `<circle cx="${(Math.cos(a) * r).toFixed(2)}" cy="${(Math.sin(a) * r).toFixed(2)}" r="${size}" fill="currentColor" stroke="none"/>`;
      }).join("");
    return `<svg class="mandala-svg" viewBox="-100 -100 200 200" fill="none" stroke="currentColor" stroke-width=".6">
      <circle r="98"/><circle r="94"/>${dots(60, 96, 0.8)}
      ${ring(32, 82, 5, 11)}<circle r="70"/>
      ${ring(16, 58, 9, 16)}${ring(16, 58, 4, 9)}<circle r="42"/>${dots(24, 46, 1.1)}
      ${ring(12, 32, 7, 12)}<circle r="22"/><circle r="18"/>
      ${ring(8, 11, 4, 7)}<circle r="4" fill="currentColor"/>
    </svg>`;
  }
  $$("[data-mandala]").forEach((el) => (el.innerHTML = mandala()));

  /* ───────── Toran (hanging marigold strings) ───────── */
  const toran = $("#toran");
  function buildToran() {
    const count = Math.max(9, Math.round(window.innerWidth / 34));
    let html = "";
    for (let i = 0; i < count; i++) {
      const len = 4 + ((i % 3 === 1) ? 3 : (i % 2) * 2);
      let beads = "";
      for (let b = 0; b < len; b++) {
        const cls = b % 4 === 3 ? "rose" : b % 2 ? "alt" : "";
        beads += `<span class="bead ${cls}"></span>`;
      }
      const tail = i % 2 ? '<span class="bell"></span>' : '<span class="leaf"></span>';
      html += `<div class="strand" style="animation-delay:${(-(i * 0.37) % 4).toFixed(2)}s;animation-duration:${(3.4 + (i % 4) * 0.4).toFixed(1)}s">${beads}${tail}</div>`;
    }
    toran.innerHTML = html;
  }
  buildToran();
  let toranW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (Math.abs(window.innerWidth - toranW) > 60) { toranW = window.innerWidth; buildToran(); }
  });

  /* ───────── Dates ───────── */
  const TZ = "Asia/Kolkata";
  const fmt = (d, opts, locale = "en-IN") => new Intl.DateTimeFormat(locale, { timeZone: TZ, ...opts }).format(d);
  const dayKey = (d) => fmt(d, { year: "numeric", month: "2-digit", day: "2-digit" });
  const timeOf = (d) => fmt(d, { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?(am|pm)/i, (m) => " " + m.trim().toUpperCase());

  /* ───────── Events ───────── */
  const ICONS = {
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    haldi: '<path d="M3 11h18a9 7 0 0 1-18 0Z"/><path d="M7 21h10"/><path d="M12 2c2.5 3 2.5 5.5 0 7-2.5-1.5-2.5-4 0-7Z"/>',
    fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
    crown: '<path d="M2 6l4 11h12l4-11-6 5-4-7-4 7-6-5Z"/><path d="M6 21h12"/>',
    feast: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3Zm0 0v7"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.music}</svg>`;

  const events = W.events.map((e) => ({ ...e, s: new Date(e.start), e: new Date(e.end || e.start) }));
  const now = new Date();
  const nextEvent = events.find((e) => e.e > now);

  const groups = [];
  events.forEach((e) => {
    const k = dayKey(e.s);
    let g = groups.find((x) => x.key === k);
    if (!g) groups.push((g = { key: k, date: e.s, items: [] }));
    g.items.push(e);
  });
  const ordinal = ["One", "Two", "Three", "Four", "Five", "Six"];

  $("#days").innerHTML = groups.map((g, gi) => `
    <div class="day">
      <div class="day-head reveal">
        <div>
          <span class="day-label">Day ${ordinal[gi] || gi + 1}</span>
          <span class="day-date">${fmt(g.date, { weekday: "long", day: "numeric", month: "long" })}</span>
          <span class="day-hi" lang="hi">${fmt(g.date, { weekday: "long", day: "numeric", month: "long" }, "hi-IN")}</span>
        </div>
      </div>
      <div class="cards">
        ${g.items.map((e) => {
          const idx = events.indexOf(e);
          return `
          <div class="card reveal" role="button" tabindex="0" aria-pressed="false" data-idx="${idx}" aria-label="${esc(e.name)} — tap for theme and dress code">
            ${e === nextEvent ? '<span class="ev-badge">Up Next</span>' : ""}
            <div class="card-inner">
              <div class="face face-front">
                <div class="ev-icon">${icon(e.icon)}</div>
                <p class="ev-hi" lang="hi">${esc(e.hindi || "")}</p>
                <p class="ev-name">${esc(e.name)}</p>
                <p class="ev-time">${timeOf(e.s)}</p>
                <p class="ev-date">${fmt(e.s, { weekday: "short", day: "numeric", month: "short" })}</p>
                <p class="ev-tap">Tap for theme &amp; dress code</p>
              </div>
              <div class="face face-back">
                <p class="back-title">${esc(e.name)}</p>
                <p class="back-label">Theme</p>
                <p class="back-theme">${esc(e.theme || "To be announced")}</p>
                <p class="back-label">Dress Code</p>
                <p class="back-text">${esc(e.dressCode || "To be announced")}</p>
                ${e.palette?.length ? `<div class="swatches">${e.palette.map((c) => `<span style="background:${esc(c)}"></span>`).join("")}</div>` : ""}
                <button class="cal-btn" type="button" data-cal="${idx}">Add to Calendar</button>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`).join("");

  const flip = (card) => {
    card.classList.toggle("flipped");
    card.setAttribute("aria-pressed", card.classList.contains("flipped"));
  };
  $$(".card").forEach((card) => {
    card.addEventListener("click", (ev) => {
      if (ev.target.closest(".cal-btn")) return;
      flip(card);
    });
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); flip(card); }
    });
  });
  $$(".cal-btn").forEach((btn) =>
    btn.addEventListener("click", (ev) => { ev.stopPropagation(); downloadICS(events[+btn.dataset.cal]); }));

  function downloadICS(e) {
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const text = (s) => String(s).replace(/[,;\\]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aarava//Wedding Invite//EN", "BEGIN:VEVENT",
      `UID:${stamp(e.s)}-${e.name.replace(/\W/g, "")}@aarava`,
      `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(e.s)}`, `DTEND:${stamp(e.e)}`,
      `SUMMARY:${text(`${e.name} · ${names}`)}`,
      `LOCATION:${text(`${W.venue.name}, ${W.venue.address}`)}`,
      `DESCRIPTION:${text(`Theme: ${e.theme || "TBA"}\nDress code: ${e.dressCode || "TBA"}\nDirections: ${W.venue.mapsLink}`)}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${e.name.replace(/\W+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ───────── Countdown ───────── */
  const target = new Date(W.countdownTo);
  const cd = $("#countdown");
  cd.innerHTML = ["Days", "Hours", "Minutes", "Seconds"]
    .map((l) => `<div class="cd-box"><span class="cd-num">0</span><span class="cd-label">${l}</span></div>`).join("");
  const nums = $$(".cd-num", cd);
  function tick() {
    let diff = Math.max(0, target - new Date());
    if (diff === 0) {
      cd.innerHTML = '<span class="cd-done">The celebrations have begun!</span>';
      return;
    }
    const parts = [86400000, 3600000, 60000, 1000].map((unit) => {
      const v = Math.floor(diff / unit);
      diff -= v * unit;
      return v;
    });
    parts.forEach((v, i) => (nums[i].textContent = i ? String(v).padStart(2, "0") : v));
    setTimeout(tick, 1000);
  }
  tick();

  /* ───────── Love story ───────── */
  const timeline = $("#timeline");
  timeline.insertAdjacentHTML("beforeend", W.story.map((c) => `
    <article class="chapter reveal">
      <div class="ch-photo"><div class="ch-photo-inner">
        ${c.photo
          ? `<img src="${esc(c.photo)}" alt="${esc(c.title)}" loading="lazy" />`
          : `<div class="ch-placeholder"><div class="mini-mandala">${mandala()}</div>Photo</div>`}
      </div></div>
      <div class="ch-text">
        <div class="ch-when">${esc(c.when)}</div>
        <h3 class="ch-title">${esc(c.title)}</h3>
        <p class="ch-body">${esc(c.text)}</p>
      </div>
    </article>`).join(""));

  const fill = $("#timelineFill");
  function updateTimeline() {
    const r = timeline.getBoundingClientRect();
    const p = (window.innerHeight * 0.6 - r.top) / r.height;
    fill.style.height = `${Math.min(1, Math.max(0, p)) * 100}%`;
  }

  /* ───────── Quiz ───────── */
  const quizCard = $("#quizCard");
  const corners = ["tl", "tr", "bl", "br"].map((c) => `<div class="corner ${c}">${mandala()}</div>`).join("");
  let qi = 0, score = 0;

  function renderQuestion() {
    const q = W.quiz[qi];
    quizCard.innerHTML = `${corners}
      <div class="q-progress">${W.quiz.map((_, i) => `<span class="${i < qi ? "done" : i === qi ? "now" : ""}"></span>`).join("")}</div>
      <p class="q-count">Question ${qi + 1} of ${W.quiz.length}</p>
      <p class="q-text">${esc(q.q)}</p>
      <div class="q-options">${q.options.map((o, i) => `<button class="q-opt" type="button" data-i="${i}">${esc(o)}</button>`).join("")}</div>
      <p class="q-reveal" aria-live="polite"></p>`;
    $$(".q-opt", quizCard).forEach((b) => b.addEventListener("click", () => answer(+b.dataset.i)));
  }

  function answer(i) {
    const q = W.quiz[qi];
    const opts = $$(".q-opt", quizCard);
    opts.forEach((b) => (b.disabled = true));
    opts[q.answer].classList.add("right");
    const correct = i === q.answer;
    if (correct) {
      score++;
      const r = opts[i].getBoundingClientRect();
      Petals.burst(r.left + r.width / 2, r.top + r.height / 2, 26);
    } else {
      opts[i].classList.add("wrong");
    }
    $(".q-reveal", quizCard).textContent = (correct ? "Wah! " : "Oops! ") + (q.reveal || "");
    const next = document.createElement("button");
    next.className = "btn btn-maroon q-next";
    next.type = "button";
    next.textContent = qi < W.quiz.length - 1 ? "Next Question" : "See My Score";
    next.addEventListener("click", () => {
      qi++;
      qi < W.quiz.length ? renderQuestion() : renderResult();
    });
    quizCard.appendChild(next);
  }

  function renderResult() {
    const total = W.quiz.length;
    const ratio = score / total;
    const [title, line] =
      ratio === 1 ? ["Parivaar Certified!", "You know us better than we know ourselves."]
      : ratio >= 0.6 ? ["Almost Family", "Pretty impressive — a few more chai sessions and you're there."]
      : ratio >= 0.3 ? ["Getting There", "Come to the wedding, we'll fill you in on the rest!"]
      : ["Who Are You?", "Just kidding — see you in Jaipur, we'll catch up!"];
    quizCard.innerHTML = `${corners}
      <p class="q-count">Your Score</p>
      <p class="q-result-title">${title}</p>
      <p class="q-score">${score} / ${total}</p>
      <p class="q-reveal">${line}</p>`;
    const again = document.createElement("button");
    again.className = "btn btn-maroon q-again";
    again.type = "button";
    again.textContent = "Play Again";
    again.addEventListener("click", () => { qi = 0; score = 0; renderQuestion(); });
    quizCard.appendChild(again);
    if (ratio >= 0.6) Petals.shower(90);
  }
  if (W.quiz?.length) renderQuestion();
  else $("#quiz").remove();

  /* ───────── Venue ───────── */
  $("#mapFrame").src = `https://www.google.com/maps?q=${encodeURIComponent(W.venue.embedQuery || W.venue.address)}&output=embed`;
  $("#directionsBtn").href = W.venue.mapsLink;
  $("#copyAddress").addEventListener("click", async () => {
    const text = `${W.venue.name}, ${W.venue.address}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Address copied");
    } catch {
      toast(text);
    }
  });

  /* ───────── Contacts ───────── */
  const PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>';
  const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>';
  if (W.contacts?.length) {
    $("#contacts").innerHTML = W.contacts.map((c) => {
      const digits = String(c.phone).replace(/\D/g, "");
      return `<div class="contact reveal">
        <p class="contact-role">${esc(c.role)}</p>
        <p class="contact-name">${esc(c.name)}</p>
        <div class="contact-actions">
          <a href="tel:+${digits}" aria-label="Call ${esc(c.name)}">${PHONE}</a>
          <a href="https://wa.me/${digits}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(c.name)}">${CHAT}</a>
        </div>
      </div>`;
    }).join("");
  } else {
    $("#contact").remove();
    $('.nav-links a[href="#contact"]')?.remove();
  }

  /* ───────── Toast ───────── */
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  /* ───────── Petals ───────── */
  const Petals = (() => {
    const canvas = $("#petals");
    const ctx = canvas.getContext("2d");
    const COLORS = ["#f39c12", "#f7b733", "#ffcf4a", "#e8710a", "#c2185b", "#e04e6f", "#ecd08c"];
    let petals = [], running = false, w = 0, h = 0, dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const rand = (a, b) => a + Math.random() * (b - a);
    function make(x, y, vx, vy) {
      return {
        x, y, vx, vy,
        size: rand(6, 12),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.08, 0.08),
        flip: rand(0, Math.PI * 2),
        vf: rand(0.03, 0.08),
        sway: rand(0, Math.PI * 2),
        color: COLORS[(Math.random() * COLORS.length) | 0],
      };
    }

    function loop() {
      ctx.clearRect(0, 0, w, h);
      petals = petals.filter((p) => p.y < h + 30 && p.x > -60 && p.x < w + 60);
      for (const p of petals) {
        p.vy = Math.min(p.vy + 0.05, 2.6);
        p.vx *= 0.985;
        p.sway += 0.03;
        p.x += p.vx + Math.sin(p.sway) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        p.flip += p.vf;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2); // tumbling
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.7, p.size * 0.7, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.7, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.12)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.7);
        ctx.lineTo(0, p.size * 0.7);
        ctx.stroke();
        ctx.restore();
      }
      if (petals.length) requestAnimationFrame(loop);
      else running = false;
    }
    function start() {
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    return {
      burst(x, y, n = 36) {
        if (reduceMotion) n = Math.min(n, 10);
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2), s = rand(2, 7);
          petals.push(make(x, y, Math.cos(a) * s, Math.sin(a) * s - 3));
        }
        start();
      },
      shower(n = 70) {
        if (reduceMotion) n = Math.min(n, 20);
        for (let i = 0; i < n; i++) petals.push(make(rand(0, w), rand(-h * 0.6, -10), rand(-0.6, 0.6), rand(0.6, 1.6)));
        start();
      },
    };
  })();

  /* Double-tap / double-click anywhere → petals */
  let lastTap = { t: 0, x: 0, y: 0 };
  document.addEventListener("pointerup", (ev) => {
    if (!document.body.classList.contains("opened")) return;
    const t = performance.now();
    const close = Math.hypot(ev.clientX - lastTap.x, ev.clientY - lastTap.y) < 40;
    if (t - lastTap.t < 320 && close) {
      Petals.burst(ev.clientX, ev.clientY, 40);
      Petals.shower(36);
      lastTap.t = 0;
    } else {
      lastTap = { t, x: ev.clientX, y: ev.clientY };
    }
  });
  document.addEventListener("dblclick", (ev) => ev.preventDefault());

  /* ───────── Music ───────── */
  const audio = $("#bgm");
  const musicBtn = $("#musicBtn");
  let fadeTimer;
  function fadeTo(vol, ms = 2000) {
    clearInterval(fadeTimer);
    const stepMs = 50, steps = ms / stepMs, delta = (vol - audio.volume) / steps;
    fadeTimer = setInterval(() => {
      const v = audio.volume + delta;
      if ((delta > 0 && v >= vol) || (delta < 0 && v <= vol) || delta === 0) {
        audio.volume = vol;
        clearInterval(fadeTimer);
        if (vol === 0) audio.pause();
      } else audio.volume = v;
    }, stepMs);
  }
  function playMusic() {
    if (!W.music) return;
    audio.volume = 0;
    audio.play().then(() => {
      musicBtn.hidden = false;
      musicBtn.classList.remove("paused");
      fadeTo(0.55, 3000);
    }).catch(() => (musicBtn.hidden = true));
  }
  if (W.music) audio.src = W.music;
  musicBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      fadeTo(0.55, 1200);
      musicBtn.classList.remove("paused");
      musicBtn.setAttribute("aria-label", "Pause music");
    } else {
      fadeTo(0, 600);
      musicBtn.classList.add("paused");
      musicBtn.setAttribute("aria-label", "Play music");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) { audio.pause(); audio.dataset.resume = "1"; }
    else if (!document.hidden && audio.dataset.resume) { audio.play().catch(() => {}); delete audio.dataset.resume; }
  });

  /* ───────── Gate ───────── */
  const gate = $("#gate");
  let opened = false;
  function openGate() {
    if (opened) return;
    opened = true;
    playMusic(); // must run inside the tap for browsers to allow sound
    gate.classList.add("opening");
    setTimeout(() => Petals.shower(110), reduceMotion ? 0 : 700);
    setTimeout(() => {
      gate.classList.add("open");
      document.body.classList.remove("locked");
      document.body.classList.add("opened");
      revealVisible();
    }, reduceMotion ? 50 : 1500);
    setTimeout(() => toast("✿ Double-tap anywhere for a shower of petals ✿", 4200), reduceMotion ? 400 : 3200);
  }
  gate.addEventListener("click", openGate);
  gate.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openGate(); }
  });

  /* ───────── Scroll reveal, nav, timeline ───────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  function revealVisible() { $$(".reveal:not(.in)").forEach((el) => io.observe(el)); }
  revealVisible();

  const nav = $("#nav");
  const hero = $("#home");
  const navLinks = $$(".nav-links a");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  function onScroll() {
    nav.classList.toggle("show", window.scrollY > hero.offsetHeight * 0.7);
    const mid = window.innerHeight * 0.35;
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= mid) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
    updateTimeline();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
