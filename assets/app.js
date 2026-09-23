/* =========================================================================
   MISSION EUROPA — site logic
   Reads everything from site-config.js. No cookies, no storage, no network.
   ========================================================================= */
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* ------------------------------------------------------------ helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const arr = (v) => (Array.isArray(v) ? v : []);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const raw = window.MISSION_EUROPA;
  const showError = (err) => { const b = $('#configError'); if (b) b.hidden = false; if (err) console.error('[Mission Europa]', err); };
  if (!raw || typeof raw !== 'object') showError('site-config.js did not define window.MISSION_EUROPA');
  const cfg = Object.assign({ thisWeek: '', project: {}, links: {}, phases: [], keyDates: [], games: [], crews: [], patchNotes: [], bugBounty: [], bloopers: [] }, raw || {});
  const P = cfg.project || {};
  const L = cfg.links || {};

  function safe(name, fn) { try { fn(); } catch (e) { showError(name + ': ' + e.message); } }

  /* -------------------------------------------------------------- dates */
  const DAY = 864e5;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(s || '').trim());
    return m ? new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1) : null;
  }
  const params = new URLSearchParams(location.search);
  const todayOverride = parseDate(params.get('today'));
  function now() {
    const real = new Date();
    if (!todayOverride) return real;
    const d = new Date(todayOverride);
    d.setHours(real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds());
    return d;
  }
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  const daysBetween = (a, b) => Math.round((dayStart(b) - dayStart(a)) / DAY);
  const fmt = (d, year = true) => d ? `${d.getDate()} ${MONTHS[d.getMonth()]}${year ? ' ' + d.getFullYear() : ''}` : '';
  function fmtRange(a, b) {
    if (!a) return '';
    if (!b || +a === +b) return fmt(a, false);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]}`;
    return `${fmt(a, false)} – ${fmt(b, false)}`;
  }
  function relative(days) {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days < 14) return `in ${days} days`;
    if (days < 60) return `in ${Math.round(days / 7)} weeks`;
    const m = Math.round(days / 30.44);
    return `in ${m} months`;
  }

  /* -------------------------------------------------------------- crews */
  const crews = arr(cfg.crews);
  const crewById = (id) => crews.find((c) => c.id === id);
  const confirmed = crews.filter((c) => c.status === 'confirmed');
  const crewName = (c) => (c ? (c.name || (c.place ? c.place : `Crew ${c.code}`)) : '');
  const crewShort = (c) => (c ? `Crew ${c.code}${c.cc ? ' · ' + c.cc : ''}` : '');
  const twinsOf = (c) => {
    const t = c && c.twin;
    const ids = Array.isArray(t) ? t : (t ? [t] : []);
    const out = ids.map(crewById).filter(Boolean);
    crews.forEach((o) => { // twins declared on the other side only
      const ot = Array.isArray(o.twin) ? o.twin : (o.twin ? [o.twin] : []);
      if (o !== c && ot.includes(c.id) && !out.includes(o)) out.push(o);
    });
    return out;
  };
  const games = arr(cfg.games);
  const gameById = (id) => games.find((g) => g.id === id);

  /* -------------------------------------------------------------- sound */
  let soundOn = false; let audioCtx = null;
  function tone(kind = 'tap') {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
      const notes = kind === 'launch' ? [220, 440] : kind === 'ready' ? [330, 494] : kind === 'win' ? [392, 784] : [300, 360];
      osc.type = kind === 'launch' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(notes[0], t0);
      osc.frequency.exponentialRampToValueAtTime(notes[1], t0 + 0.11);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0); osc.stop(t0 + 0.17);
    } catch (_) { /* audio is optional */ }
  }
  safe('sound', () => {
    const btn = $('#soundToggle'); const label = $('.sound-label');
    btn.addEventListener('click', () => {
      soundOn = !soundOn;
      btn.setAttribute('aria-pressed', String(soundOn));
      label.textContent = soundOn ? 'Sound on' : 'Sound off';
      if (soundOn) tone('ready');
    });
    document.addEventListener('click', (e) => { const el = e.target.closest('[data-sound]'); if (el) tone(el.dataset.sound || 'tap'); });
  });

  /* ---------------------------------------------------------- mobile nav */
  safe('nav', () => {
    const btn = $('#menuToggle'); const nav = $('#siteNav');
    const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.site-header')) close(); });
    // highlight the section in view
    if ('IntersectionObserver' in window) {
      const links = $$('.nav a');
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('current', a.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach((a) => { const s = document.getElementById(a.getAttribute('href').slice(1)); if (s) io.observe(s); });
    }
  });

  /* ------------------------------------------------------------ copying */
  function copyText(text, statusHost) {
    const done = (ok) => {
      if (!statusHost) return;
      let s = statusHost.querySelector('.copied');
      if (!s) { s = document.createElement('span'); s.className = 'copied'; s.setAttribute('role', 'status'); statusHost.appendChild(s); }
      s.textContent = ok ? 'Copied ✓' : 'Select the text and copy it by hand.';
      clearTimeout(s._t); s._t = setTimeout(() => { s.textContent = ''; }, 2600);
    };
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta); done(ok);
      } catch (_) { done(false); }
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), fallback);
    else fallback();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const src = document.getElementById(b.dataset.copy);
    if (src) copyText(src.textContent.trim(), b.parentElement);
  });

  /* --------------------------------------------------------- timeline logic */
  const phases = arr(cfg.phases).map((p) => ({ ...p, s: parseDate(p.start), e: parseDate(p.end) })).filter((p) => p.s && p.e);
  function phaseState(t = now()) {
    const cur = phases.find((p) => t >= p.s && t < endOfDay(p.e));
    if (cur) return { kind: 'in', phase: cur };
    const next = phases.find((p) => t < p.s);
    if (!next) return { kind: phases.length ? 'after' : 'none' };
    return { kind: next === phases[0] ? 'before' : 'gap', phase: next };
  }
  const keyDates = arr(cfg.keyDates).map((k) => ({ ...k, s: parseDate(k.date), e: parseDate(k.end) || parseDate(k.date) })).filter((k) => k.s).sort((a, b) => a.s - b.s);

  /* ------------------------------------------------------- mission control */
  safe('mission control', () => {
    const phaseEl = $('#mcPhase'); const labelEl = $('#mcPhaseLabel'); const pill = $('#mcPill');
    const countLabel = $('#mcCountLabel'); const digits = $('#mcDigits');
    $('#mcWeek').textContent = cfg.thisWeek || 'Check TwinSpace for this week’s mission.';

    function nextEvent(t) {
      const ongoing = keyDates.find((k) => k.precision !== 'month' && t >= k.s && t < endOfDay(k.e) && k.e > k.s);
      if (ongoing) return { ev: ongoing, ongoing: true };
      const up = keyDates.find((k) => k.precision !== 'month' && k.s > t);
      return up ? { ev: up, ongoing: false } : null;
    }
    const pad = (n) => String(n).padStart(2, '0');
    function tick() {
      const t = now();
      const st = phaseState(t);
      if (st.kind === 'in') { labelEl.textContent = `NOW · PHASE ${st.phase.n} OF ${phases.length}`; phaseEl.textContent = st.phase.title; pill.textContent = 'LIVE'; }
      else if (st.kind === 'before') { labelEl.textContent = 'PRE-LAUNCH'; phaseEl.textContent = 'Crews are forming across Europe'; pill.textContent = 'COUNTDOWN'; }
      else if (st.kind === 'gap') { labelEl.textContent = 'BETWEEN PHASES'; phaseEl.textContent = `Next: Phase ${st.phase.n} · ${st.phase.title}`; pill.textContent = 'LIVE'; }
      else if (st.kind === 'after') { labelEl.textContent = 'MISSION COMPLETE'; phaseEl.textContent = 'Thanks, crews. The games stay online.'; pill.textContent = 'ARCHIVE'; }
      const ne = nextEvent(t);
      if (!ne) { countLabel.textContent = ''; digits.textContent = st.kind === 'after' ? 'See you next mission' : '–'; return; }
      if (ne.ongoing) { countLabel.textContent = 'Happening now:'; digits.textContent = ne.ev.label; digits.classList.add('as-text'); return; }
      digits.classList.remove('as-text');
      let ms = Math.max(0, ne.ev.s - t);
      const d = Math.floor(ms / DAY); ms -= d * DAY;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      const s = Math.floor(ms / 1e3);
      countLabel.textContent = ne.ev.label + ' in';
      digits.textContent = `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
    }
    tick();
    let timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => {
      clearInterval(timer);
      if (!document.hidden) { tick(); timer = setInterval(tick, 1000); }
    });
  });

  /* ------------------------------------------------------------- network */
  safe('network', () => {
    const stage = $('#networkStage'); const host = $('#networkNodes'); const canvas = $('#networkCanvas'); const info = $('#nodeInfo');
    const pos = [[0.17, 0.2], [0.83, 0.2], [0.9, 0.56], [0.72, 0.84], [0.28, 0.84], [0.1, 0.56]];
    const slots = crews.slice(0, 6);
    let ctx; let w = 0; let h = 0; let raf = 0; let visible = true; let selected = null;

    function describe(c) {
      if (c.status !== 'confirmed') return `Crew slot ${c.code} is open. Partner schools can join until ${fmt(parseDate(P.lateJoinBy)) || 'mid-October'}.`;
      const tw = twinsOf(c);
      const place = [c.place, c.country].filter(Boolean).join(', ');
      return `Crew ${c.code}${place ? ' · ' + place : ''}${c.school ? ' · ' + c.school : ''}. Twin crew: ${tw.length ? tw.map((x) => `${x.code}${x.place ? ' (' + x.place + ')' : ''}`).join(', ') : 'paired at the kick-off'}.`;
    }
    slots.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'network-node' + (c.status === 'confirmed' ? '' : ' open');
      b.style.left = `${pos[i][0] * 100}%`; b.style.top = `${pos[i][1] * 100}%`;
      b.style.setProperty('--node', c.accent || '#fff');
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', `Crew ${c.code}: ${c.status === 'confirmed' ? crewName(c) : 'open slot'}`);
      b.innerHTML = `<span><b>${esc(c.code)}</b><small>${esc(c.status === 'confirmed' ? (c.cc || crewName(c)) : 'OPEN')}</small></span>`;
      b.addEventListener('click', () => {
        selected = selected === c.id ? null : c.id;
        $$('.network-node', host).forEach((n) => n.setAttribute('aria-pressed', 'false'));
        if (selected) { b.setAttribute('aria-pressed', 'true'); info.textContent = describe(c); tone('tap'); } else info.textContent = 'Tap a crew to see who it is.';
        if (reducedMotion()) draw(0);
      });
      host.appendChild(b);
    });

    function resize() {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }
    function draw(t) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2; const cy = h * 0.46;
      // twin links
      const drawn = new Set();
      slots.forEach((c, i) => {
        twinsOf(c).forEach((o) => {
          const j = slots.indexOf(o); if (j < 0) return;
          const key = [c.id, o.id].sort().join('|'); if (drawn.has(key)) return; drawn.add(key);
          const x1 = pos[i][0] * w; const y1 = pos[i][1] * h; const x2 = pos[j][0] * w; const y2 = pos[j][1] * h;
          ctx.beginPath(); ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo((x1 + x2) / 2 * 0.6 + cx * 0.4, (y1 + y2) / 2 * 0.6 + cy * 0.4, x2, y2);
          ctx.strokeStyle = 'rgba(155,255,58,.55)'; ctx.lineWidth = 1.6; ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]);
        });
      });
      // links to Europa
      slots.forEach((c, i) => {
        const x = pos[i][0] * w; const y = pos[i][1] * h; const on = c.status === 'confirmed';
        const sel = selected === c.id;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy);
        ctx.strokeStyle = on ? (c.accent || '#fff') : 'rgba(255,255,255,.14)';
        ctx.globalAlpha = on ? (sel ? 1 : 0.7) : 1;
        ctx.lineWidth = sel ? 3 : on ? 1.8 : 1;
        ctx.setLineDash(on ? [] : [5, 8]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (on && t) {
          const p = ((t / 1700) + i * 0.17) % 1;
          ctx.beginPath(); ctx.arc(x + (cx - x) * p, y + (cy - y) * p, sel ? 4 : 3, 0, Math.PI * 2);
          ctx.fillStyle = c.accent || '#fff'; ctx.fill();
        }
      });
    }
    function loop(t) { draw(t); raf = (visible && !reducedMotion()) ? requestAnimationFrame(loop) : 0; }
    window.addEventListener('resize', resize, { passive: true });
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        if (visible && !raf && !reducedMotion()) raf = requestAnimationFrame(loop);
      }).observe(stage);
    }
    if (!reducedMotion()) raf = requestAnimationFrame(loop);
  });

  /* --------------------------------------------------------------- games */
  const STATES = ['planned', 'design', 'building', 'ab-test', 'live'];
  const STATE_LABEL = { planned: 'Idea', design: 'Brief', building: 'Build', 'ab-test': 'A/B test', live: 'Live' };
  const withParams = (file, p) => { const q = new URLSearchParams(p).toString(); return q ? `${file}?${q}` : file; };
  function playLinks(g) {
    if (g.state === 'ab-test') {
      return ['A', 'B'].map((v) => ({ label: `Version ${v}`, href: withParams(g.file, Object.assign({ v }, g.testerMode ? { test: 1 } : {})) }));
    }
    if (g.state === 'live') return [{ label: 'Play', href: g.file }];
    return [];
  }
  function versionsHtml(g) {
    const vs = arr(g.versions);
    if (!vs.length) return '';
    const items = vs.slice().reverse().map((v) => `<li><a href="${esc(v.file)}" target="_blank" rel="noopener">v${esc(v.v)}</a><span>${esc(fmt(parseDate(v.date)))}${v.note ? ' · ' + esc(v.note) : ''}</span></li>`).join('');
    return `<details class="versions"><summary>Versions (${vs.length})</summary><ul>${items}</ul></details>`;
  }
  function actionsHtml(g, dark) {
    const links = playLinks(g);
    let h = links.map((l, i) => `<a class="button ${i === 0 ? 'button-primary' : (dark ? 'button-ghost-dark' : 'button-ghost')} small" href="${esc(l.href)}" target="_blank" rel="noopener" data-sound="launch">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join('');
    if (g.state === 'live' && g.testerMode) h += `<a class="button ${dark ? 'button-ghost-dark' : 'button-ghost'} small" href="${esc(withParams(g.file, { test: 1 }))}" target="_blank" rel="noopener" data-sound="launch">Tester mode <span aria-hidden="true">↗</span></a>`;
    if (links.length) h += `<button class="link-btn" type="button" data-qr="${esc(g.id)}">QR code</button>`;
    if (g.thread) h += `<a class="link-btn" href="${esc(g.thread)}" target="_blank" rel="noopener">TwinSpace thread ↗</a>`;
    return h;
  }
  safe('games', () => {
    const grid = $('#gameGrid'); const bonusHost = $('#bonusGame');
    const accents = ['var(--blue)', 'var(--lime)'];
    let newIdx = 0;
    games.forEach((g) => {
      if (g.kind === 'bonus') {
        const el = document.createElement('article');
        el.className = 'bonus-card reveal';
        el.innerHTML = `
          <div class="game-shot">${g.image ? `<img src="${esc(g.image)}" alt="Opening screen of ${esc(g.title)}" loading="lazy" width="1200" height="675">` : ''}<span class="badge"><i></i>Bonus${g.version ? ' · v' + esc(g.version) : ''}</span></div>
          <div class="game-body">
            <span class="game-tag">${esc(g.tag || 'Bonus mission')}</span>
            <h3>${esc(g.title)}</h3>
            <p class="game-sub">${esc(g.subtitle || '')}</p>
            <p class="pitch">${esc(g.pitch || '')}</p>
            <div class="game-meta">${g.physics ? `<span class="chip mono">${esc(g.physics)}</span>` : ''}<span class="chip">5 stations</span><span class="chip">play as a class</span></div>
            <div class="game-actions">${actionsHtml(g, true)}</div>
            <p class="bonus-note">Each school runs one station. At the end, the game gives your crew a report code for Mission Control.</p>
          </div>`;
        bonusHost.appendChild(el);
        return;
      }
      const el = document.createElement('article');
      if (g.kind === 'new') {
        const accent = g.accent || accents[newIdx % accents.length];
        newIdx += 1;
        const si = Math.max(0, STATES.indexOf(g.state));
        const track = STATES.map((s, i) => `<li class="${i < si ? 'done' : i === si ? 'now' : ''}">${STATE_LABEL[s]}</li>`).join('');
        const studios = arr(g.studios).map((s) => {
          const names = arr(s.crews).map((id) => { const c = crewById(id); return c ? c.code : id; }).join(', ');
          return `<li><b>${esc(s.name || 'Studio')}</b>${names ? ' · crews ' + esc(names) : ''}${g.revealed && s.version ? ' · made version ' + esc(s.version) : ''}</li>`;
        }).join('');
        const playable = g.state === 'ab-test' || g.state === 'live';
        el.className = 'game-card new reveal';
        el.style.setProperty('--accent', accent);
        el.innerHTML = `
          <div class="game-body">
            <div class="new-num" aria-hidden="true">${esc(g.title.replace(/[^0-9]/g, '') ? 'G' + g.title.replace(/[^0-9]/g, '') : '★')}</div>
            <span class="game-tag">New game · designed by students</span>
            <h3>${esc(g.title)}</h3>
            <p class="game-sub">${esc(g.subtitle || '')}</p>
            <ol class="stage-track" aria-label="Progress: ${esc(STATE_LABEL[STATES[si]])}">${track}</ol>
            <p class="pitch">${esc(g.pitch || '')}</p>
            <div class="game-meta"><span class="chip">Physics: ${esc(g.physics || 'to be chosen')}</span>${g.decideBy ? `<span class="chip">Decision by ${esc(fmt(parseDate(g.decideBy)))}</span>` : ''}</div>
            ${studios ? `<ul class="studios">${studios}</ul>` : ''}
            <div class="game-actions">${playable ? actionsHtml(g, false) : '<span class="chip">Not playable yet</span>'}</div>
            ${versionsHtml(g)}
          </div>`;
      } else {
        el.className = 'game-card reveal';
        el.innerHTML = `
          <div class="game-shot">${g.image ? `<img src="${esc(g.image)}" alt="Opening screen of ${esc(g.title)}" loading="lazy" width="1200" height="675">` : ''}<span class="badge"><i></i>${g.state === 'live' ? 'Playable' : esc(STATE_LABEL[g.state] || '')}${g.version ? ' · v' + esc(g.version) : ''}</span></div>
          <div class="game-body">
            <span class="game-tag">${esc(g.tag || 'Starting game')}</span>
            <h3>${esc(g.title)}</h3>
            <p class="game-sub">${esc(g.subtitle || '')}</p>
            <p class="pitch">${esc(g.pitch || '')}</p>
            <div class="game-meta">${g.physics ? `<span class="chip mono">${esc(g.physics)}</span>` : ''}<span class="chip">4 stages</span><span class="chip">starting game</span></div>
            <div class="game-actions">${actionsHtml(g, false)}</div>
            ${versionsHtml(g)}
          </div>`;
      }
      grid.appendChild(el);
    });
    const atlas = $('#atlasLink'); if (atlas && L.atlas) atlas.href = L.atlas;
  });

  /* ------------------------------------------------------------ QR modal */
  safe('qr', () => {
    const modal = $('#qrModal'); const row = $('#qrRow'); const title = $('#qrTitle');
    let lastFocus = null;
    function svgFor(url) {
      if (typeof window.qrcode !== 'function') return '';
      const q = window.qrcode(0, 'M'); q.addData(url); q.make();
      return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    }
    function open(g) {
      const links = playLinks(g).map((l) => (g.state === 'live' && g.testerMode ? { label: 'Tester mode', href: withParams(g.file, { test: 1 }) } : l));
      title.textContent = g.title;
      row.innerHTML = links.map((l) => {
        const abs = new URL(l.href, location.href).href;
        return `<div class="qr-box">${svgFor(abs)}<b>${esc(l.label)}</b><code>${esc(abs)}</code></div>`;
      }).join('');
      lastFocus = document.activeElement;
      modal.hidden = false;
      $('.modal-close', modal).focus();
    }
    function close() { modal.hidden = true; if (lastFocus) lastFocus.focus(); }
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-qr]');
      if (b) { const g = gameById(b.dataset.qr); if (g) open(g); return; }
      if (!modal.hidden && (e.target === modal || e.target.closest('[data-close]'))) close();
    });
    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('button, a, [tabindex]:not([tabindex="-1"])', modal);
        if (!f.length) return;
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  });

  /* --------------------------------------------------------- report desk */
  safe('report desk', () => {
    const reportGames = games.filter((g) => g.state === 'live' || g.state === 'ab-test');
    const crewOptions = (confirmed.length ? confirmed : crews).map((c) => `<option value="${esc(c.id)}">${esc(crewShort(c))}</option>`).join('') || '<option value="">Crew</option>';
    const gameOptions = reportGames.map((g) => `<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('');
    const forms = [$('#formReport'), $('#formCard')];
    forms.forEach((f) => { f.crew.innerHTML = crewOptions; f.game.innerHTML = gameOptions; f.version.value = (reportGames[0] && reportGames[0].version) || ''; });

    // rating buttons
    $$('.rating').forEach((fs) => {
      const box = document.createElement('div'); box.className = 'dots';
      for (let i = 1; i <= 5; i += 1) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = i;
        b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', `${fs.dataset.name} ${i} of 5`);
        b.addEventListener('click', () => {
          const on = b.getAttribute('aria-pressed') !== 'true';
          $$('button', box).forEach((x) => x.setAttribute('aria-pressed', 'false'));
          if (on) b.setAttribute('aria-pressed', 'true');
          fs.dataset.value = on ? String(i) : '';
          renderReport();
        });
        box.appendChild(b);
      }
      fs.appendChild(box);
    });

    const val = (f, n) => (f[n] && f[n].value ? String(f[n].value).trim() : '');
    const gameLabel = (f) => { const g = gameById(val(f, 'game')); return g ? `${g.title}${val(f, 'version') ? ' v' + val(f, 'version') : ''}` : 'Game'; };
    const crewLabel = (f) => { const c = crewById(val(f, 'crew')); return c ? `Crew ${c.code}${c.cc ? ' (' + c.cc + ')' : ''}` : 'Crew'; };
    const crewTag = (f) => { const c = crewById(val(f, 'crew')); return c ? `crew ${c.code}${c.cc ? ' ' + c.cc : ''}` : 'crew –'; };
    const rating = (n) => { const fs = $(`.rating[data-name="${n}"]`); return fs && fs.dataset.value ? `${fs.dataset.value}/5` : '–'; };

    function renderReport() {
      const f = forms[0]; const g = gameById(val(f, 'game'));
      $('.ab-only', f).hidden = !(g && g.state === 'ab-test');
      const err = val(f, 'error');
      const parts = [
        'ME-REPORT', gameLabel(f), `Stage ${val(f, 'stage')}`, val(f, 'device'),
        `tries ${val(f, 'tries') || '–'}`, `error ${err ? err + '%' : '–'}`, `hints ${val(f, 'hints') || '0'}`, `${val(f, 'minutes') || '–'} min`,
        `fun ${rating('fun')} · clarity ${rating('clarity')} · physics ${rating('physics')}`, crewTag(f),
      ];
      if (g && g.state === 'ab-test' && val(f, 'prefer')) parts.push(`plays again: ${val(f, 'prefer')}`);
      $('#outReport').textContent = parts.join(' | ');
      hint($('#pasteHintReport'), g);
    }
    function renderCard() {
      const f = forms[1]; const g = gameById(val(f, 'game'));
      const lines = [
        `FEEDBACK CARD · ${gameLabel(f)} · Stage ${val(f, 'stage')}`,
        `ABOUT: ${val(f, 'about')}`,
        `WHAT HAPPENED: ${val(f, 'what') || '…'}`,
        `WHY IT MATTERS: ${val(f, 'why') || '…'}`,
        `WE PROPOSE: ${val(f, 'fix') || '…'}`,
        `— ${crewLabel(f)}`,
      ];
      $('#outCard').textContent = lines.join('\n');
      hint($('#pasteHintCard'), g);
    }
    function hint(host, g) {
      const url = (g && g.thread) || L.twinspace;
      host.innerHTML = url ? `Paste it in <a href="${esc(url)}" target="_blank" rel="noopener">${g && g.thread ? 'the game’s TwinSpace thread' : 'TwinSpace'} ↗</a>` : 'Paste it in your game’s thread in the TwinSpace forum.';
    }
    forms.forEach((f, i) => {
      const r = i === 0 ? renderReport : renderCard;
      f.addEventListener('input', r); f.addEventListener('change', r);
      f.game.addEventListener('change', () => { const g = gameById(f.game.value); f.version.value = (g && g.version) || ''; r(); });
      f.addEventListener('submit', (e) => e.preventDefault());
    });
    // sentence starters go into the last focused text box
    let lastBox = forms[1].what;
    $$('textarea', forms[1]).forEach((t) => t.addEventListener('focus', () => { lastBox = t; }));
    $$('[data-starter]', forms[1]).forEach((b) => b.addEventListener('click', () => {
      const s = b.dataset.starter; const t = lastBox;
      const pos = typeof t.selectionStart === 'number' ? t.selectionStart : t.value.length;
      t.value = t.value.slice(0, pos) + (t.value && pos > 0 && !/\s$/.test(t.value.slice(0, pos)) ? ' ' : '') + s + t.value.slice(pos);
      t.focus(); renderCard();
    }));
    // tabs
    const tabs = [$('#tabReport'), $('#tabCard')]; const panels = [$('#panelReport'), $('#panelCard')];
    const select = (i) => tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j;
    });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const j = (i + 1) % 2; select(j); tabs[j].focus(); }
      });
    });
    if (!reportGames.length) { $('#reportDesk').insertAdjacentHTML('afterbegin', '<p class="empty" style="margin:20px">No game is open for playtesting right now.</p>'); }
    renderReport(); renderCard();
  });

  /* ------------------------------------------------------------ timeline */
  safe('timeline', () => {
    const t = now();
    const list = $('#phaseList');
    const st = phaseState(t);
    list.innerHTML = phases.map((p) => {
      const state = t >= endOfDay(p.e) ? 'done' : (t >= p.s ? 'now' : 'next');
      const tag = state === 'done' ? 'Done' : state === 'now' ? 'You are here' : (st.phase === p ? 'Up next' : '');
      return `<li class="phase ${state}">
        ${tag ? `<span class="p-state">${tag}</span>` : ''}
        <span class="p-num">${esc(p.n)}</span>
        <span class="p-when">${esc(fmtRange(p.s, p.e))}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.text || '')}</p>
        <span class="p-lessons">${p.core != null ? esc(p.core) + ' core' : ''}${p.full != null ? ' · ' + esc(p.full) + ' full' : ''} lessons</span>
      </li>`;
    }).join('');
    const focus = $('.phase.now', list) || $$('.phase', list).find((el) => el.querySelector('.p-state') && /next/i.test(el.textContent));
    if (focus && list.scrollWidth > list.clientWidth + 4) list.scrollLeft = Math.max(0, focus.offsetLeft - list.offsetLeft - 8);
    // progress bar
    const s = parseDate(P.start) || (phases[0] && phases[0].s); const e = parseDate(P.end) || (phases.length && phases[phases.length - 1].e);
    const fill = $('#progressFill'); const lab = $('#progressLabel'); const intro = $('#timelineIntro');
    if (s && e) {
      const frac = Math.min(1, Math.max(0, (t - s) / (endOfDay(e) - s)));
      requestAnimationFrame(() => { fill.style.width = `${(frac * 100).toFixed(1)}%`; });
      if (t < s) { lab.textContent = `LAUNCH ${relative(daysBetween(t, s)).toUpperCase()}`; }
      else if (frac >= 1) { lab.textContent = 'MISSION COMPLETE'; }
      else { lab.textContent = `${Math.round(frac * 100)}% OF THE MISSION`; }
      if (st.kind === 'in' && intro) intro.textContent = `Right now: Phase ${st.phase.n}, ${st.phase.title}. October to April, never more than one lesson a week.`;
    }
    // key dates
    $('#keyDates').innerHTML = keyDates.map((k) => {
      let when; let cls = k.kind || '';
      if (k.precision === 'month') {
        const monthsAway = (k.s.getFullYear() - t.getFullYear()) * 12 + (k.s.getMonth() - t.getMonth());
        when = monthsAway < 0 ? 'done' : monthsAway === 0 ? 'this month' : monthsAway === 1 ? 'next month' : `in ${monthsAway} months`;
        if (monthsAway < 0) cls += ' past'; else if (monthsAway === 0) cls += ' soon';
      } else {
        const d0 = daysBetween(t, k.s); const d1 = daysBetween(t, k.e);
        if (d1 < 0) { when = 'done'; cls += ' past'; }
        else if (d0 <= 0) { when = 'now'; cls += ' soon'; }
        else { when = relative(d0); if (d0 <= 14) cls += ' soon'; }
      }
      const shown = k.display || (k.precision === 'month' ? `${MONTHS_LONG[k.s.getMonth()]} ${k.s.getFullYear()}` : (k.e && +k.e !== +k.s ? `${fmtRange(k.s, k.e)} ${k.s.getFullYear()}` : fmt(k.s)));
      return `<li class="${esc(cls.trim())}"><span class="kd-date">${esc(shown)}</span><span>${esc(k.label)}</span><span class="kd-when">${esc(when)}</span></li>`;
    }).join('');
  });

  /* --------------------------------------------------------------- crews */
  safe('crews', () => {
    const points = {};
    arr(cfg.bugBounty).forEach((b) => { points[b.crew] = (points[b.crew] || 0) + (Number(b.points) || 0); });
    const studioOf = (c, gid) => { const g = gameById(gid); const s = g && arr(g.studios).find((x) => arr(x.crews).includes(c.id)); return s ? s.name : ''; };
    const open = crews.filter((c) => c.status !== 'confirmed');
    const cards = confirmed.map((c) => {
      const tw = twinsOf(c);
      const s1 = studioOf(c, 'game-1'); const s2 = studioOf(c, 'game-2');
      return `<article class="crew-card" style="--crew:${esc(c.accent || '#fff')}">
        <div class="crew-top"><span class="crew-code">${esc(c.code)}</span>${c.patch ? `<img class="crew-patch" src="${esc(c.patch)}" alt="Mission patch of crew ${esc(c.code)}" loading="lazy">` : '<span class="crew-state">confirmed</span>'}</div>
        <h3>${esc(crewName(c))}</h3>
        <p class="crew-place">${esc([c.school, c.country].filter(Boolean).join(' · '))}</p>
        <ul class="crew-links">
          <li>Twin crew: <b>${tw.length ? esc(tw.map((x) => `${x.code}${x.place ? ' · ' + x.place : ''}`).join(', ')) : 'paired at the kick-off'}</b></li>
          ${s1 || s2 ? `<li>Studios: <b>${esc([s1 && 'Game 1 · ' + s1, s2 && 'Game 2 · ' + s2].filter(Boolean).join(' / '))}</b></li>` : ''}
          <li>Bounty points: <b>${points[c.id] || 0}</b></li>
        </ul>
        ${c.cc ? `<span class="crew-cc">${esc(c.cc)}</span>` : ''}
      </article>`;
    });
    if (open.length) {
      const rest = confirmed.length % 3;
      const span = rest === 1 ? 'span 2' : rest === 2 ? 'span 1' : '1 / -1';
      cards.push(`<article class="crew-card open" style="grid-column:${span}">
        <div class="crew-top"><span class="crew-state">${open.length} open slot${open.length > 1 ? 's' : ''}</span></div>
        <h3>Your school here?</h3>
        <p class="crew-place">Partner schools can join until ${esc(fmt(parseDate(P.lateJoinBy)) || 'mid-October')}. Teachers: see “For teachers” below.</p>
        <ul class="open-codes">${open.map((c) => `<li style="--c:${esc(c.accent || '#fff')}">${esc(c.code)}</li>`).join('')}</ul>
      </article>`);
    }
    $('#crewGrid').innerHTML = cards.join('');
  });

  /* ------------------------------------------------------ call sign maker */
  safe('call sign', () => {
    const A = ['ASTRO', 'COMET', 'NOVA', 'ORBIT', 'PULSAR', 'QUASAR', 'PHOTON', 'VECTOR', 'LUNAR', 'SOLAR', 'POLAR', 'ZENITH', 'APOGEE', 'NEBULA', 'METEOR', 'ROVER', 'PROBE', 'LANDER', 'KEPLER', 'HALLEY', 'DELTA', 'SIGMA', 'GAMMA', 'OMEGA', 'ECHO', 'DRIFT', 'SPIN', 'AURIGA', 'VEGA', 'LYRA'];
    const B = ['FOX', 'OWL', 'LYNX', 'WOLF', 'HAWK', 'RAVEN', 'ORCA', 'OTTER', 'HERON', 'BISON', 'PANDA', 'TIGER', 'GECKO', 'MANTA', 'FALCON', 'EAGLE', 'SWIFT', 'KITE', 'COBRA', 'JAGUAR'];
    const out = $('#callsignOut');
    const pick = (l) => l[Math.floor(Math.random() * l.length)];
    out.textContent = 'PRESS GENERATE';
    $('#callsignBtn').addEventListener('click', () => {
      out.textContent = `${pick(A)} ${pick(B)}-${String(Math.floor(Math.random() * 93) + 7).padStart(2, '0')}`;
    });
  });

  /* ------------------------------------------------------------ role quiz */
  safe('role quiz', () => {
    const ROLES = {
      physics: ['Physics officer', 'You check every number before it reaches the game, run the calculations behind the brief and hunt physics errors in playtests.'],
      narrative: ['Narrative designer', 'You write the setting, the characters, the briefings and the crisis events. Players care before they compute.'],
      art: ['Artist or sound designer', 'You design the look and feel: the crew’s mission patch, sketches, sample screens and sounds.'],
      tester: ['Tester', 'You break things on purpose: bugs, confusing steps, accessibility problems. Confirmed bugs earn bounty points.'],
      translator: ['Translator', 'You make the game work in your language and help your crew post clear English in TwinSpace.'],
      reporter: ['Reporter', 'You keep TwinSpace alive: crew news, the Decision Log and patch notes. You could become a pupil administrator.'],
    };
    const Q = [
      ['A new game opens. What do you check first?', [['Whether the numbers make sense', 'physics'], ['Who the characters are', 'narrative'], ['How it looks and sounds', 'art'], ['What happens if I press everything', 'tester']]],
      ['Your twin crew posts in the wrong language. You…', [['translate it for everyone', 'translator'], ['sum it up in two lines for your crew', 'reporter'], ['ask them for the numbers', 'physics'], ['reply with a quick sketch', 'art']]],
      ['Pick a superpower.', [['See bugs through walls', 'tester'], ['Write a first line nobody can stop reading', 'narrative'], ['Speak every language in the crew', 'translator'], ['Make a whole room listen', 'reporter']]],
      ['Your perfect TwinSpace post is…', [['a clean calculation with units', 'physics'], ['a two-line story hook for a new game', 'narrative'], ['a character sketch or a sound effect', 'art'], ['a translation that saves the day', 'translator']]],
    ];
    const body = $('#quizBody');
    let step = 0; let score = {}; let last = '';
    function render() {
      if (step >= Q.length) {
        const best = Object.keys(score).sort((a, b) => score[b] - score[a] || (b === last) - (a === last))[0];
        const [name, text] = ROLES[best];
        body.innerHTML = `<div class="quiz-result"><span class="kicker" style="margin:0">Your role</span><b>${esc(name)}</b><p>${esc(text)}</p><p style="font-size:.8rem;margin:0">Roles can change between phases. Talk to your crew before you choose.</p></div>
          <div class="kit-actions" style="margin-top:12px"><button class="button button-primary small" type="button" id="quizAgain">Try again</button></div>`;
        tone('win');
        $('#quizAgain').addEventListener('click', () => { step = 0; score = {}; last = ''; render(); $('#quizBody button').focus(); });
        return;
      }
      const [q, opts] = Q[step];
      body.innerHTML = `<div class="quiz-progress" aria-hidden="true">${Q.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <p class="quiz-q">${step + 1}/${Q.length} · ${esc(q)}</p>
        <div class="quiz-opts">${opts.map(([label, role]) => `<button type="button" data-role="${role}">${esc(label)}</button>`).join('')}</div>`;
      $$('[data-role]', body).forEach((b) => b.addEventListener('click', () => {
        score[b.dataset.role] = (score[b.dataset.role] || 0) + 1; last = b.dataset.role; step += 1; tone('tap'); render();
        const first = $('button', body); if (first) first.focus({ preventScroll: true });
      }));
    }
    render();
  });

  /* ----------------------------------------------------- physics: 1/r² */
  safe('inverse square', () => {
    const r = $('#invR'); const PL = [[0.72, 'Venus'], [1, 'Earth'], [1.52, 'Mars'], [5.2, 'Jupiter'], [9.54, 'Saturn']];
    const nf = (x) => (x >= 10 ? Math.round(x).toString() : x.toFixed(1));
    function upd() {
      const d = parseFloat(r.value);
      const near = PL.find(([a]) => Math.abs(a - d) < 0.1 * Math.max(1, a / 3));
      $('#invRVal').textContent = `${d.toFixed(2)} AU`;
      const pl = $('#invPlanet'); pl.textContent = near ? near[1] : ''; pl.hidden = !near;
      $('#invSun').textContent = `${nf(100 / (d * d))}%`;
      $('#invArea').textContent = `×${nf(d * d)}`;
      const side = Math.min(104, 11 * d);
      const sq = $('#invSquare'); sq.style.width = `${side}px`; sq.style.height = `${side}px`;
      r.setAttribute('aria-valuetext', `${d.toFixed(2)} AU${near ? ', ' + near[1] : ''}`);
    }
    r.addEventListener('input', upd); upd();
  });

  /* ---------------------------------------------------- physics: Kepler */
  safe('kepler', () => {
    const cv = $('#keplerCanvas'); const btn = $('#keplerBtn'); const out = $('#keplerCount');
    const moons = [
      { n: 'Io', a: 1, T: 1, c: '#ffbf00', r: 4 },
      { n: 'Europa', a: Math.pow(2, 2 / 3), T: 2, c: '#fee99c', r: 4.5 },
      { n: 'Ganymede', a: Math.pow(4, 2 / 3), T: 4, c: '#9fb7ff', r: 6 },
    ];
    const period = 2.6; // seconds of animation per Io orbit
    let playing = !reducedMotion(); let visible = true; let t = 0; let lastTs = 0; let raf = 0; let ctx; let W = 0; let H = 0;
    function size() {
      const rect = cv.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width || 360; H = rect.height || 240;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    function draw() {
      if (!ctx) return;
      const cx = W / 2; const cy = H / 2; const scale = (Math.min(W, H) / 2 - 14) / moons[2].a;
      ctx.clearRect(0, 0, W, H);
      moons.forEach((m) => { ctx.beginPath(); ctx.arc(cx, cy, m.a * scale, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke(); });
      const g = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 16);
      g.addColorStop(0, '#ffe2b8'); g.addColorStop(0.6, '#d49a6a'); g.addColorStop(1, '#8a5a44');
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      moons.forEach((m) => {
        const ang = -Math.PI / 2 + (2 * Math.PI * t) / (m.T * period);
        const x = cx + Math.cos(ang) * m.a * scale; const y = cy + Math.sin(ang) * m.a * scale;
        ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fillStyle = m.c; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 10px system-ui, sans-serif'; ctx.fillText(m.n, x + m.r + 3, y + 3);
      });
      out.textContent = moons.map((m) => `${m.n} ${Math.floor(t / (m.T * period))}`).join(' · ');
    }
    function loop(ts) {
      if (!lastTs) lastTs = ts;
      t += Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts; draw();
      raf = playing && visible ? requestAnimationFrame(loop) : 0; if (!raf) lastTs = 0;
    }
    function setPlaying(p) {
      playing = p; btn.setAttribute('aria-pressed', String(p)); btn.textContent = p ? 'Pause' : 'Play';
      if (p && visible && !raf) raf = requestAnimationFrame(loop);
    }
    btn.addEventListener('click', () => setPlaying(!playing));
    window.addEventListener('resize', size, { passive: true });
    size(); setPlaying(playing);
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible && playing && !raf) raf = requestAnimationFrame(loop); }).observe(cv);
  });

  /* ------------------------------------------------------------- brief */
  safe('brief', () => {
    $('#printBrief').addEventListener('click', () => {
      document.body.classList.add('print-brief');
      const off = () => document.body.classList.remove('print-brief');
      window.addEventListener('afterprint', off, { once: true });
      window.print();
      setTimeout(off, 1500);
    });
  });

  /* ------------------------------------------------------ decision room */
  safe('decision room', () => {
    const host = $('#decisionRooms');
    const newGames = games.filter((g) => g.kind === 'new');
    function verdict(a, b, p) {
      if (a + b === 0) return ['No results yet.', 'Each school reports once, after its blind playtest.'];
      const left = p > 0 ? `${p} school${p > 1 ? 's' : ''} still to report.` : '';
      if (p > 0) {
        if (a > b) return [`A leads ${a}–${b}.`, left];
        if (b > a) return [`B leads ${b}–${a}.`, left];
        return [`Level at ${a}–${b}.`, left];
      }
      if (a > b) return [`Version A goes forward (${a}–${b}).`, 'Next: the carry-over vote on the best features of version B.'];
      if (b > a) return [`Version B goes forward (${b}–${a}).`, 'Next: the carry-over vote on the best features of version A.'];
      return [`Tie at ${a}–${b}.`, 'The learning data decide: smaller errors, fewer hints.'];
    }
    newGames.forEach((g) => {
      const results = g.results && typeof g.results === 'object' ? g.results : {};
      const real = Object.keys(results).length > 0 || g.state === 'ab-test' || g.state === 'live';
      const schools = real ? (confirmed.length ? confirmed : crews) : crews.slice(0, 6);
      const votes = {}; schools.forEach((c) => { votes[c.id] = real ? (results[c.id] || '') : ''; });
      const room = document.createElement('article');
      room.className = 'room reveal';
      room.innerHTML = `
        <div class="room-head"><h3>${esc(g.title)}</h3><span class="room-mode ${real ? '' : 'demo'}">${real ? 'Results' : 'Demo'}</span></div>
        <p class="room-hint">${real ? 'Results from the blind playtests: one per school.' : 'Tap the schools to try the rule. Real results appear here after the blind playtests.'}</p>
        <div class="school-chips"></div>
        <div class="tally" aria-hidden="true"><span class="ta"></span><span class="tp"></span><span class="tb"></span></div>
        <p class="verdict" aria-live="polite"></p>
        ${g.revealed ? `<ul class="studios">${arr(g.studios).map((s) => `<li>Version ${esc(s.version || '?')}: <b>${esc(s.name || '')}</b></li>`).join('')}</ul>` : ''}
        <div class="room-foot"><span>${g.decideBy ? 'Decision due by ' + esc(fmt(parseDate(g.decideBy))) : ''}</span>${real ? '' : '<button type="button" class="reset">Reset demo</button>'}</div>`;
      host.appendChild(room);
      const chipsHost = $('.school-chips', room);
      chipsHost.innerHTML = schools.map((c) => {
        const label = `<span><b>${esc(c.code)}</b> ${esc(c.cc || (c.status === 'confirmed' ? crewName(c) : ''))}</span><span class="vote">–</span>`;
        return real ? `<div class="school-chip" data-id="${esc(c.id)}">${label}</div>` : `<button type="button" class="school-chip" data-id="${esc(c.id)}" aria-label="School ${esc(c.code)}: no result">${label}</button>`;
      }).join('');
      function update() {
        let a = 0; let b = 0; let p = 0;
        schools.forEach((c) => {
          const v = votes[c.id]; if (v === 'A') a += 1; else if (v === 'B') b += 1; else p += 1;
          const chip = $(`[data-id="${c.id}"]`, chipsHost);
          chip.dataset.vote = v || ''; $('.vote', chip).textContent = v || '–';
          if (!real) chip.setAttribute('aria-label', `School ${c.code}: ${v ? 'prefers version ' + v : 'no result'}`);
        });
        const [ta, tp, tb] = $$('.tally span', room);
        ta.style.flexGrow = a; tb.style.flexGrow = b; tp.style.flexGrow = p;
        ta.textContent = a ? `A · ${a}` : ''; tb.textContent = b ? `B · ${b}` : ''; tp.textContent = p ? `${p} to report` : '';
        let [v1, v2] = verdict(a, b, p);
        if (real && (g.decision === 'A' || g.decision === 'B')) {
          v1 = `Decision: version ${g.decision} goes forward.`;
          v2 = g.carryOver ? `Carried over from the other version: ${g.carryOver}` : 'Next: the carry-over vote.';
        }
        $('.verdict', room).innerHTML = `${esc(v1)}<small>${esc(v2)}</small>`;
      }
      if (!real) {
        chipsHost.addEventListener('click', (e) => {
          const chip = e.target.closest('.school-chip'); if (!chip) return;
          const id = chip.dataset.id; votes[id] = votes[id] === '' ? 'A' : votes[id] === 'A' ? 'B' : '';
          tone('tap'); update();
        });
        $('.reset', room).addEventListener('click', () => { Object.keys(votes).forEach((k) => { votes[k] = ''; }); update(); });
      }
      update();
    });
  });

  /* ---------------------------------------------------------------- log */
  safe('log', () => {
    const TYPES = { fix: 'Fix', feature: 'New', physics: 'Physics', balance: 'Balance', text: 'Text' };
    const notes = arr(cfg.patchNotes).slice().sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
    const pl = $('#patchList');
    pl.innerHTML = notes.length ? notes.map((n) => {
      const g = gameById(n.game);
      const credit = arr(n.credit).map((id) => { const c = crewById(id); return c ? `Crew ${c.code}${c.cc ? ' ' + c.cc : ''}` : id; }).join(' · ');
      const type = TYPES[n.type] ? n.type : 'fix';
      return `<li class="patch"><span class="p-type ${type}">${TYPES[type]}</span>
        <span class="p-head">${esc(g ? g.title : n.game || '')}${n.version ? ' v' + esc(n.version) : ''} · ${esc(fmt(parseDate(n.date)))}</span>
        <span class="p-text">${esc(n.text || '')}</span>
        ${credit ? `<span class="p-credit">Idea: ${esc(credit)}</span>` : ''}</li>`;
    }).join('') : '<li class="empty">No patches yet. The first playtest is in October: your crew’s fix could be the first line here.</li>';

    const pts = {}; arr(cfg.bugBounty).forEach((b) => { pts[b.crew] = (pts[b.crew] || 0) + (Number(b.points) || 0); });
    const ranked = Object.keys(pts).map((id) => ({ c: crewById(id), id, p: pts[id] })).sort((a, b) => b.p - a.p);
    const max = ranked.length ? ranked[0].p || 1 : 1;
    $('#leaderboard').innerHTML = ranked.length ? ranked.map((r) => `<li style="--c:${esc((r.c && r.c.accent) || 'var(--purple)')}">
        <span class="lb-code">${esc(r.c ? r.c.code : r.id)}</span>
        <span><span style="font-size:.8rem;font-weight:700">${esc(r.c ? crewName(r.c) : r.id)}</span><span class="lb-bar"><i style="width:${Math.round((r.p / max) * 100)}%"></i></span></span>
        <span class="lb-pts">${r.p}</span></li>`).join('')
      : '<li class="empty">The bug bounty opens with the first playtest. Confirmed bugs and physics errors earn points for your crew.</li>';

    const bl = arr(cfg.bloopers);
    $('#bloopers').innerHTML = bl.length ? bl.map((b) => {
      const c = crewById(b.crew);
      return `<figure><img src="${esc(b.file)}" alt="${esc(b.title || 'Blooper')}" loading="lazy"><figcaption>${esc(b.title || '')}${c ? ' · Crew ' + esc(c.code) : ''}</figcaption></figure>`;
    }).join('') : '<p class="empty" style="grid-column:1/-1">No crash landings yet. Philae’s real bounce is the one to beat.</p>';
  });

  /* ----------------------------------------------------------- teachers */
  safe('teachers', () => {
    const t = now();
    const jb = parseDate(P.joinBy); const lj = parseDate(P.lateJoinBy);
    const who = [P.coordinator, [P.coordinatorSchool, P.coordinatorPlace].filter(Boolean).join(', ')].filter(Boolean).join(', ');
    let txt = `Contact the project coordinator${who ? ', ' + who + ',' : ''} through the European School Education Platform.`;
    if (lj && t >= endOfDay(lj)) txt += ' Partner recruitment for 2026–2027 is closed.';
    else if (jb && t < endOfDay(jb)) txt += ` Reply by ${fmt(jb)} if you can; schools can still join until ${fmt(lj)}, during Phase 1.`;
    else if (lj) txt += ` Late joiners are welcome until ${fmt(lj)}, during Phase 1.`;
    txt += ' Tell us your school, country and subject, the age and number of your students, core or full track, and the weeks your school is closed.';
    $('#joinText').textContent = txt;
    const links = [];
    if (L.partnerInfo) links.push(`<a class="button button-primary small" href="${esc(L.partnerInfo)}" target="_blank" rel="noopener">Partner information (PDF)</a>`);
    links.push(`<a class="button button-ghost-dark small" href="${esc(L.esepProfile || 'https://school-education.ec.europa.eu/en/etwinning')}" target="_blank" rel="noopener">${L.esepProfile ? 'Coordinator on ESEP' : 'eTwinning on ESEP'} ↗</a>`);
    if (L.twinspace) links.push(`<a class="button button-ghost-dark small" href="${esc(L.twinspace)}" target="_blank" rel="noopener">TwinSpace ↗</a>`);
    $('#teacherLinks').innerHTML = links.join('');
    const sb = parseDate(P.setupBy);
    if (sb) $('#setupBy').textContent = `By ${fmt(sb)}. No lessons needed for this.`;
  });

  /* ------------------------------------------------------------- reveal */
  safe('reveal', () => {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reducedMotion()) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
    els.forEach((el) => io.observe(el));
    // never leave content hidden when someone jumps with an anchor link or prints
    window.addEventListener('beforeprint', () => els.forEach((el) => el.classList.add('in')));
  });
})();
