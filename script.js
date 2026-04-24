/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   alecrj.com — v2
   one scroll source, one rAF loop, delegated actions,
   particle sim, kinetic type, custom cursor,
   menu + drawer state, konami code.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const mapRange = (v, aMin, aMax, bMin, bMax) =>
    clamp(bMin + (bMax - bMin) * ((v - aMin) / (aMax - aMin)), Math.min(bMin, bMax), Math.max(bMin, bMax));

  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class')         n.className = attrs[k];
      else if (k === 'text')     n.textContent = attrs[k];
      else if (k === 'href')     n.setAttribute('href', attrs[k]);
      else if (k.startsWith('data-')) n.setAttribute(k, attrs[k]);
      else                       n[k] = attrs[k];
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  };

  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─────────────────────────────────────
  // CONFIG — swap these for the real Alec
  // ─────────────────────────────────────
  const SOCIAL_URLS = {
    x:  'https://x.com/alecrj',
    ig: 'https://instagram.com/alecrj',
    li: 'https://linkedin.com/in/alecrj',
  };

  // Real projects — edit these four and everything else (monitors, rooms, menu)
  // rehydrates automatically.
  const PROJECTS = [
    {
      slug: 'shallowbay',
      name: 'Shallow Bay Advisors',
      year: '2025',
      role: 'built & designed',
      url: 'https://shallowbayadvisors.com',
      statement: 'Find your perfect warehouse. Industrial properties across South Florida, searchable by county and size.',
      hasThumb: true,
    },
    {
      slug: 'recoveryos',
      name: 'RecoveryOS',
      year: '2026',
      role: 'founder + built & designed',
      url: 'https://recoveryos.app',
      statement: 'Sober living management software that runs itself. Fill beds faster, collect rent on time.',
      hasThumb: true,
    },
    {
      slug: 'capitalmailer',
      name: 'Capital Mailer Co',
      year: '2025',
      role: 'built & designed',
      url: '#', // TODO alec: real url
      statement: 'Direct mail, modernized. Pick a campaign, we print and post. [TODO: refine]',
      hasThumb: false,
    },
    {
      slug: 'livelikeryan',
      name: 'Live Like Ryan Foundation',
      year: '2024',
      role: 'designed + built',
      url: '#', // TODO alec: real url
      statement: 'A foundation in honor of Ryan — carrying his spirit forward through community. [TODO: refine]',
      hasThumb: false,
    },
  ];

  // ─────────────────────────────────────
  // Spray-can hiss (WebAudio)
  // ─────────────────────────────────────
  let audioCtx = null;
  const ensureAudio = () => {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  };

  const sprayHiss = ({ duration = 0.35, volume = 0.35, pitch = 3200 } = {}) => {
    const ctx = ensureAudio(); if (!ctx) return;
    const now = ctx.currentTime;
    const size = Math.floor(ctx.sampleRate * duration);
    const noise = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource(); src.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = pitch; bp.Q.value = 0.9;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
    const peak = ctx.createBiquadFilter(); peak.type = 'peaking'; peak.frequency.value = 6500; peak.Q.value = 2; peak.gain.value = 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    g.gain.exponentialRampToValueAtTime(volume * 0.6, now + duration * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(bp).connect(hp).connect(peak).connect(g).connect(ctx.destination);
    src.start(now); src.stop(now + duration);
  };

  const clickTone = (freq = 520, duration = 0.08) => {
    const ctx = ensureAudio(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + duration);
  };

  // ─────────────────────────────────────
  // Hero reveal
  // ─────────────────────────────────────
  window.addEventListener('load', () => {
    requestAnimationFrame(() => { body.dataset.phase = 'hero-in'; });
  });

  const primeAudioOnce = () => {
    ensureAudio();
    sprayHiss({ duration: 0.45, volume: 0.32 });
    ['scroll','pointerdown','keydown','touchstart'].forEach(e => window.removeEventListener(e, primeAudioOnce));
  };
  ['scroll','pointerdown','keydown','touchstart'].forEach(e =>
    window.addEventListener(e, primeAudioOnce, { once: true, passive: true })
  );

  // ─────────────────────────────────────
  // Unified scroll state
  // ─────────────────────────────────────
  let realScroll = window.scrollY;
  let smoothScroll = realScroll;
  const scrollState = {
    y: realScroll, raw: realScroll,
    progress: 0,
    vh: window.innerHeight,
    docH: document.documentElement.scrollHeight - window.innerHeight,
  };

  const onScroll = () => { realScroll = window.scrollY; };
  const onResize = () => {
    scrollState.vh = window.innerHeight;
    scrollState.docH = document.documentElement.scrollHeight - window.innerHeight;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // ─────────────────────────────────────
  // Parallax layers
  // ─────────────────────────────────────
  const parallaxEls = $$('[data-parallax]').map(e => ({
    el: e,
    factor: parseFloat(e.dataset.parallax) || 0.5,
    sectionTop: 0, sectionH: 0,
  }));
  const measureParallax = () => {
    parallaxEls.forEach(p => {
      const section = p.el.closest('[data-parallax-section]') || p.el.parentElement;
      const r = section.getBoundingClientRect();
      p.sectionTop = r.top + window.scrollY;
      p.sectionH = section.offsetHeight;
    });
  };
  window.addEventListener('load', measureParallax);
  window.addEventListener('resize', measureParallax);

  const applyParallax = () => {
    for (const p of parallaxEls) {
      const relative = (smoothScroll + scrollState.vh / 2) - (p.sectionTop + p.sectionH / 2);
      const translate = relative * (1 - p.factor);
      p.el.style.transform = `translate3d(0, ${(-translate).toFixed(2)}px, 0)`;
    }
  };

  // ─────────────────────────────────────
  // Progress / depth
  // ─────────────────────────────────────
  const progressBar = $('.progress i');
  const depthText = $('#depth-pct');
  const updateProgress = () => {
    const p = scrollState.docH > 0 ? realScroll / scrollState.docH : 0;
    scrollState.progress = p;
    if (progressBar) progressBar.style.width = (p * 100).toFixed(2) + '%';
    if (depthText)   depthText.textContent = String(Math.round(p * 100)).padStart(2, '0');
  };

  // ─────────────────────────────────────
  // STUDIO: scroll-driven spray scene
  // ─────────────────────────────────────
  const studio = $('.studio');
  const bigcan = $('.bigcan');
  const studioCaptions = $$('.studio__caption');
  const studioBlob = $('.studio__blob');
  const particlesLayer = $('.particles');

  const PARTICLES = [];
  if (particlesLayer) {
    const N = 80;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const angle = -Math.PI * (0.25 + Math.random() * 0.5); // -45° .. -135°
      const speed = 0.6 + Math.random() * 1.6;
      const size = 6 + Math.random() * 18;
      p.style.width = p.style.height = size + 'px';
      p.style.opacity = '0';
      particlesLayer.appendChild(p);
      // fire only during phase 3; fireStart 0.56-0.76 so every particle has ≥17% of scroll
      // to travel before the scene completes
      PARTICLES.push({ el: p, angle, speed, size, fireStart: 0.56 + Math.random() * 0.20 });
    }
  }

  const setCaption = (idx) => {
    studioCaptions.forEach((c, i) => c.classList.toggle('is-on', i === idx));
  };

  // Cache studio measurements for stable progress calc (no layout thrash)
  let studioTop = 0, studioRunway = 1;
  const measureStudio = () => {
    if (!studio) return;
    studioTop = studio.offsetTop;
    studioRunway = Math.max(1, studio.offsetHeight - scrollState.vh);
  };
  measureStudio();
  window.addEventListener('load', measureStudio);
  window.addEventListener('resize', measureStudio);

  // PHASES (scroll progress 0..1 across the studio runway)
  //   P1 [0.00 → 0.35]  PICK UP   — can slides in (0→0.15), settles + reads caption (0.15→0.35)
  //   P2 [0.35 → 0.55]  SHAKE     — pure visual, caption 2
  //   P3 [0.55 → 1.00]  PRESS     — staggered climax:
  //       0.55 caption swaps, can begins tilting, first hiss
  //       0.58 particles start firing from nozzle
  //       0.62 blob starts appearing
  //       0.72 second hiss (sputter)
  //       0.85 viewport fully orange, scene complete
  //       0.85→1.00 HANDOFF dwell — orange held as you cross into the next section
  const tickStudio = () => {
    if (!studio) return;
    // Drive from REAL scroll for 1:1 responsiveness
    const p = clamp((realScroll - studioTop) / studioRunway, 0, 1);

    if (bigcan) {
      // P1: slide in 0 → 0.15 (faster entry so user sees the can within the first wheel notch)
      const slideIn = mapRange(p, 0.00, 0.15, 1, 0);

      // P1 dwell: 0.15 → 0.35 — can sits at rest, caption 1 is readable
      // P2: shake — ramp up 0.35 → 0.42, decay 0.50 → 0.55
      const shakeIn   = mapRange(p, 0.35, 0.42, 0, 1);
      const shakeOut  = mapRange(p, 0.50, 0.55, 1, 0);
      const shake     = shakeIn * shakeOut;
      const shakeX    = Math.sin(p * 260) * 10 * shake;
      const shakeY    = Math.cos(p * 280) * 6 * shake;
      const shakeRot  = Math.sin(p * 340) * 4 * shake;

      // P3: tilt to point toward viewer — starts 0.55, finishes at 0.78
      const tiltRot   = mapRange(p, 0.55, 0.78, 0, -44);

      // P3 late: can shrinks as blob takes over (0.80 → 0.92)
      const scale     = mapRange(p, 0.80, 0.92, 1, 0.75);

      const translateX = slideIn * 55 + shakeX * 0.12;
      const translateY = shakeY - mapRange(p, 0.70, 0.95, 0, 60);
      const rot = -8 + shakeRot + tiltRot;

      bigcan.style.transform =
        `translate3d(${translateX.toFixed(2)}vw, ${translateY.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    }

    // PARTICLES — fire 0.58 → 0.88 (slight stagger after the caption change)
    if (PARTICLES.length && particlesLayer) {
      const rectB = bigcan ? bigcan.getBoundingClientRect() : { right: scrollState.vh, top: 100 };
      const stickyRect = studio.querySelector('.studio__sticky').getBoundingClientRect();
      const ox = (rectB.right - 60) - stickyRect.left;
      const oy = (rectB.top + 30) - stickyRect.top;

      for (const pt of PARTICLES) {
        const local = clamp((p - pt.fireStart) / (0.95 - pt.fireStart), 0, 1);
        if (local <= 0) { pt.el.style.opacity = '0'; continue; }
        const travel = local * 1400 * pt.speed;
        const gravity = local * local * 220;
        const x = ox + Math.cos(pt.angle) * travel;
        const y = oy + Math.sin(pt.angle) * travel + gravity;
        const sc = 1 + local * 0.6;
        const op = local < 0.75 ? (local * 1.6) : (1 - (local - 0.75) * 4);
        pt.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(2)})`;
        pt.el.style.opacity = clamp(op, 0, 1).toFixed(2);
      }
    }

    // BLOB — appears 0.62 → 0.82 (20% of scroll = ~400ms at normal scroll pace)
    // Scale quadratic for sudden bloom, then holds through handoff
    if (studioBlob) {
      const bp = clamp((p - 0.55) / 0.40, 0, 1);  // grows across P3 until 0.95
      const scale = lerp(0.02, 2.2, bp * bp);
      const opacity = mapRange(p, 0.62, 0.82, 0, 1);
      studioBlob.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      studioBlob.style.opacity = opacity.toFixed(2);
    }

    // CAPTIONS — P1 gets the longest dwell (reading time)
    const captionIdx = p < 0.35 ? 0 : p < 0.55 ? 1 : 2;
    setCaption(captionIdx);

    // Audio — staggered (not all at phase boundary)
    if (p > 0.56 && p < 0.59 && !studio._hissed1) { studio._hissed1 = true; sprayHiss({ duration: 1.6, volume: 0.4 }); }
    if (p > 0.72 && p < 0.75 && !studio._hissed2) { studio._hissed2 = true; sprayHiss({ duration: 0.9, volume: 0.3, pitch: 2400 }); }
    if (p < 0.50) { studio._hissed1 = false; studio._hissed2 = false; }
  };

  // ─────────────────────────────────────
  // PIXELS → PAINTINGS  (canvas particle formation)
  // ─────────────────────────────────────
  const pixelsSection = $('.pixels');
  const pixelsCanvas = $('.pixels__canvas');
  const pixCaps = $$('.pixels__caption');
  let PIX_PARTICLES = [];
  let pixReady = false;
  let pixDpr = 1;
  let pixW = 0, pixH = 0;
  let pixTop = 0, pixRunway = 1;
  let pixCtx = null;

  const measurePixels = () => {
    if (!pixelsSection) return;
    pixTop = pixelsSection.offsetTop;
    pixRunway = Math.max(1, pixelsSection.offsetHeight - scrollState.vh);
  };
  measurePixels();
  window.addEventListener('load', measurePixels);
  window.addEventListener('resize', measurePixels);

  const resizePixCanvas = () => {
    if (!pixelsCanvas) return;
    pixDpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = pixelsCanvas.getBoundingClientRect();
    pixW = Math.max(1, Math.round(rect.width));
    pixH = Math.max(1, Math.round(rect.height));
    pixelsCanvas.width  = pixW * pixDpr;
    pixelsCanvas.height = pixH * pixDpr;
    pixCtx = pixelsCanvas.getContext('2d');
    pixCtx.scale(pixDpr, pixDpr);
  };

  // sample the image pixels into particle targets
  const buildParticlesFromImage = (img) => {
    resizePixCanvas();
    const off = document.createElement('canvas');
    off.width = pixW;
    off.height = pixH;
    const octx = off.getContext('2d');
    // draw the image to the SAMPLE canvas at final display size
    octx.drawImage(img, 0, 0, pixW, pixH);
    const data = octx.getImageData(0, 0, pixW, pixH).data;
    const STEP = 4;        // sample one particle per 4x4 block
    const out = [];
    for (let y = 0; y < pixH; y += STEP) {
      for (let x = 0; x < pixW; x += STEP) {
        const i = (y * pixW + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 30) continue;
        // Particle start: random position on the canvas perimeter (offscreen)
        const side = Math.floor(Math.random() * 4);
        let sx, sy;
        if (side === 0)      { sx = -20 - Math.random() * 120; sy = Math.random() * pixH; }
        else if (side === 1) { sx = pixW + 20 + Math.random() * 120; sy = Math.random() * pixH; }
        else if (side === 2) { sx = Math.random() * pixW; sy = -20 - Math.random() * 120; }
        else                 { sx = Math.random() * pixW; sy = pixH + 20 + Math.random() * 120; }
        // brightness-weighted size (brighter = slightly larger)
        const brightness = (r + g + b) / 765;
        out.push({
          tx: x, ty: y,
          sx, sy,
          color: `rgb(${r},${g},${b})`,
          size: STEP * (0.8 + brightness * 0.6),
          // per-particle ease factor for organic arrival
          delay: Math.random() * 0.25, // 0-25% of forming phase is individual lag
        });
      }
    }
    PIX_PARTICLES = out;
    pixReady = true;
  };

  if (pixelsCanvas) {
    const img = new Image();
    img.decoding = 'async';
    img.src = 'assets/mona.jpg';
    img.onload = () => buildParticlesFromImage(img);
    img.onerror = () => console.warn('pixels: mona.jpg failed to load');
    window.addEventListener('resize', () => {
      if (pixReady) buildParticlesFromImage(img);
    });
  }

  const setPixCap = (idx) => {
    pixCaps.forEach((c, i) => c.classList.toggle('is-on', i === idx));
  };

  // Easing
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const tickPixels = () => {
    if (!pixReady || !pixCtx || !pixelsSection) return;
    const p = clamp((realScroll - pixTop) / pixRunway, 0, 1);

    // PHASES
    // 0.00-0.15  settle — caption 1 readable, particles offscreen, start fading in
    // 0.15-0.55  FORM — particles lerp to target positions (painting materializes)
    // 0.55-0.70  HOLD — painting crisp, caption 2 readable
    // 0.70-0.85  caption 3, still crisp
    // 0.85-1.00  handoff dwell (hold painting, prepare for next section)

    // formProgress: 0..1 across the formation phase
    const formProgress = clamp((p - 0.15) / 0.40, 0, 1);

    pixCtx.clearRect(0, 0, pixW, pixH);

    for (let i = 0; i < PIX_PARTICLES.length; i++) {
      const pt = PIX_PARTICLES[i];
      // per-particle delay: each particle lerps over [delay, 1] portion of form
      const local = clamp((formProgress - pt.delay) / (1 - pt.delay), 0, 1);
      const t = easeOutCubic(local);
      const x = lerp(pt.sx, pt.tx, t);
      const y = lerp(pt.sy, pt.ty, t);
      // opacity: fades in during form, holds crisp
      const alpha = 0.15 + t * 0.85;
      pixCtx.globalAlpha = alpha;
      pixCtx.fillStyle = pt.color;
      pixCtx.fillRect(x, y, pt.size, pt.size);
    }
    pixCtx.globalAlpha = 1;

    // Captions
    const capIdx = p < 0.35 ? 0 : p < 0.70 ? 1 : 2;
    setPixCap(capIdx);
  };

  // ─────────────────────────────────────
  // Master rAF loop
  // ─────────────────────────────────────
  const loop = () => {
    // Faster catch-up = snappier parallax (150ms to equilibrium instead of 400ms)
    smoothScroll += (realScroll - smoothScroll) * 0.22;
    if (Math.abs(realScroll - smoothScroll) < 0.1) smoothScroll = realScroll;
    scrollState.y = smoothScroll;
    scrollState.raw = realScroll;

    applyParallax();       // uses smoothScroll → subtle bg drift
    updateProgress();      // uses realScroll → counter is instant
    tickStudio();          // studio spray-can scene
    tickPixels();          // pixels → Mona Lisa particle formation
    tickGallerist();       // gallerist — horizontal room scroll

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // ─────────────────────────────────────
  // Kinetic text reveals
  // ─────────────────────────────────────
  // Reveal kinetic text when well into viewport (not just entering).
  // rootMargin bottom = -30% effectively shrinks the viewport so the
  // observer only fires when the element is past the lower 30% of screen.
  const kineticObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-in'); });
  }, { threshold: 0.35, rootMargin: '0px 0px -25% 0px' });
  $$('[data-kinetic]').forEach(e => kineticObs.observe(e));

  // 8-bit arcade manifesto — principles stagger when list scrolls in
  const bitsList = $('.bits__list');
  if (bitsList) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { bitsList.classList.add('is-in'); io.unobserve(bitsList); }});
    }, { threshold: 0.35 });
    io.observe(bitsList);
  }

  const splitContainers = new Set();
  $$('[data-split]').forEach(e => splitContainers.add(e.parentElement));
  splitContainers.forEach(p => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-split-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -15% 0px' });
    io.observe(p);
  });

  // manifesto foot follows kinetic--3
  const manifesto = $('.manifesto');
  if (manifesto) {
    const checkFoot = () => { if ($('.kinetic--3.is-in')) manifesto.classList.add('is-foot'); };
    $$('.kinetic').forEach(k => new MutationObserver(checkFoot).observe(k, { attributes: true, attributeFilter: ['class'] }));
  }

  // ─────────────────────────────────────
  // Contact reveal
  // ─────────────────────────────────────
  const contact = $('.contact');
  if (contact) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !contact.classList.contains('is-on')) {
          contact.classList.add('is-on');
          setTimeout(() => sprayHiss({ duration: 0.9, volume: 0.4 }), 250);
          setTimeout(() => sprayHiss({ duration: 0.5, volume: 0.25 }), 1100);
        }
      });
    }, { threshold: 0.25 });
    io.observe(contact);
  }

  // ─────────────────────────────────────
  // GALLERIST — horizontal scroll-hijack for 4 rooms
  // ─────────────────────────────────────
  const gallerist = $('.gallerist');
  const galTrack = $('#gallerist-track');
  const galCur = $('#gallerist-cur');
  const galTot = $('#gallerist-tot');

  let galTop = 0, galRunway = 1;
  const measureGal = () => {
    if (!gallerist) return;
    galTop = gallerist.offsetTop;
    galRunway = Math.max(1, gallerist.offsetHeight - scrollState.vh);
  };
  measureGal();
  window.addEventListener('load', measureGal);
  window.addEventListener('resize', measureGal);

  const buildRoomNode = (project, i) => {
    const painting = project.hasThumb
      ? el('div', { class: 'room__painting' }, [
          el('img', { src: `assets/thumb-${project.slug}.jpg`, alt: project.name }),
        ])
      : el('div', { class: 'room__painting room__painting--placeholder' }, [
          el('div', {}, [
            el('strong', { text: project.name }),
            el('em', { text: 'scan pending · awaiting url' }),
          ]),
        ]);

    const placard = el('div', { class: 'room__placard' }, [
      el('div', { class: 'room__num', text: 'No. ' + String(i + 1).padStart(2, '0') }),
      el('h3', { class: 'room__title', text: project.name }),
      el('div', { class: 'room__meta' }, [
        el('span', { class: 'mono', text: project.year }),
        el('span', { class: 'mono', text: '· ' + project.role }),
      ]),
      el('p', { class: 'room__statement', text: project.statement }),
      (() => {
        const hasUrl = project.url && project.url !== '#';
        const btn = el('a', {
          class: 'btn btn--ink room__visit',
          href: hasUrl ? project.url : '#',
          target: hasUrl ? '_blank' : '',
          rel: hasUrl ? 'noopener' : '',
        }, [
          el('span', { text: hasUrl ? 'Visit live' : 'URL coming soon' }),
          el('i', { text: '→' }),
        ]);
        if (!hasUrl) {
          btn.style.opacity = '0.5';
          btn.style.pointerEvents = 'none';
        }
        return btn;
      })(),
    ]);

    return el('article', { class: 'room' }, [painting, placard]);
  };

  if (galTrack) {
    PROJECTS.forEach((p, i) => galTrack.appendChild(buildRoomNode(p, i)));
    if (galTot) galTot.textContent = String(PROJECTS.length).padStart(2, '0');
  }

  const tickGallerist = () => {
    if (!gallerist || !galTrack) return;
    const p = clamp((realScroll - galTop) / galRunway, 0, 1);
    // Translate horizontally: 0 → -(N-1)*100vw
    const N = PROJECTS.length;
    const translate = -(N - 1) * p * window.innerWidth;
    galTrack.style.transform = `translate3d(${translate.toFixed(2)}px, 0, 0)`;
    // Current room index for pager
    const idx = Math.min(N - 1, Math.round(p * (N - 1)));
    if (galCur) galCur.textContent = String(idx + 1).padStart(2, '0');
  };

  // ─────────────────────────────────────
  // Menu
  // ─────────────────────────────────────
  const menu = $('#menu');
  const openMenu = () => {
    body.classList.add('menu-open');
    menu.setAttribute('aria-hidden', 'false');
    sprayHiss({ duration: 0.4, volume: 0.3 });
  };
  const closeMenu = () => {
    body.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true');
  };

  // ─────────────────────────────────────
  // Smooth-ish scroll to target
  // ─────────────────────────────────────
  const smoothScrollTo = (target) => {
    const node = typeof target === 'string' ? $(target) : target;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // ─────────────────────────────────────
  // Contact + waitlist submit
  // ─────────────────────────────────────
  const handleContactSubmit = (form) => {
    const status = form.querySelector('.contact__form-status');
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const msg = form.elements.message.value.trim();
    if (!name || !email || !msg) {
      status.textContent = '✗ fill in every field, one take';
      status.style.color = '#b84515';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = '✗ that email doesn\'t look right';
      status.style.color = '#b84515';
      return;
    }
    status.textContent = '✓ opening your mail client…';
    status.style.color = '#e86a2a';
    sprayHiss({ duration: 0.7, volume: 0.35 });
    const mailto = `mailto:hi@alecrj.com?subject=${encodeURIComponent('From alecrj.com — ' + name)}&body=${encodeURIComponent(msg + '\n\n— ' + name + ' <' + email + '>')}`;
    setTimeout(() => { window.location.href = mailto; form.reset(); }, 400);
  };

  const handleWaitlistSubmit = (form) => {
    const status = form.parentElement.querySelector('.foot__form-status');
    const email = form.elements.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (status) status.textContent = '✗ invalid email';
      return;
    }
    if (status) status.textContent = '✓ on the list';
    form.reset();
    sprayHiss({ duration: 0.35, volume: 0.25 });
  };

  // ─────────────────────────────────────
  // Single delegated click handler
  // ─────────────────────────────────────
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const action = t.dataset.action;
    switch (action) {
      case 'scroll-to': {
        e.preventDefault();
        closeMenu();
        smoothScrollTo(t.dataset.target);
        clickTone(400);
        break;
      }
      case 'menu-open':    e.preventDefault(); openMenu();    clickTone(600); break;
      case 'menu-close':   e.preventDefault(); closeMenu();   clickTone(400); break;
      case 'social': {
        e.preventDefault();
        const url = SOCIAL_URLS[t.dataset.social];
        if (url) {
          sprayHiss({ duration: 0.35, volume: 0.3 });
          window.open(url, '_blank', 'noopener');
        }
        break;
      }
      case 'email': { sprayHiss({ duration: 0.3, volume: 0.25 }); break; }
      case 'case-link': {
        if (t.getAttribute('href') === '#') {
          e.preventDefault();
          sprayHiss({ duration: 0.3, volume: 0.25 });
        }
        break;
      }
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-action]');
    if (!form) return;
    e.preventDefault();
    const action = form.dataset.action;
    if (action === 'contact-submit')  handleContactSubmit(form);
    if (action === 'waitlist-submit') handleWaitlistSubmit(form);
  });

  // ─────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'Escape') {
      if (body.classList.contains('menu-open')) closeMenu();
    }
    if (e.key === 'm' || e.key === 'M') {
      body.classList.contains('menu-open') ? closeMenu() : openMenu();
    }
    // Arrow keys navigate the gallerist horizontally by one room width
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && gallerist) {
      const rect = gallerist.getBoundingClientRect();
      const inView = rect.top < scrollState.vh * 0.5 && rect.bottom > scrollState.vh * 0.5;
      if (inView) {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const step = galRunway / Math.max(1, PROJECTS.length - 1);
        window.scrollTo({ top: window.scrollY + step * dir, behavior: 'smooth' });
      }
    }
  });

  // ─────────────────────────────────────
  // Custom cursor
  // ─────────────────────────────────────
  // ── Paintbrush cursor + DOM stroke trail (reliable fade) ─────────
  const cursor = $('.cursor');
  const brushLayer = $('.brush-layer');
  let mx = 0, my = 0, cx = 0, cy = 0;
  let lastStrokeX = null, lastStrokeY = null, lastStrokeT = 0;

  if (cursor && window.matchMedia('(hover: hover)').matches && window.innerWidth > 900) {
    document.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      body.classList.remove('cursor-hidden');
    });
    document.addEventListener('pointerleave', () => body.classList.add('cursor-hidden'));

    const animateCursor = () => {
      cx += (mx - cx) * 0.32;
      cy += (my - cy) * 0.32;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(animateCursor);
    };
    requestAnimationFrame(animateCursor);

    document.addEventListener('pointerover', (e) => {
      if (e.target.closest('a, button, [data-action], input, textarea')) body.classList.add('cursor-hover');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest('a, button, [data-action], input, textarea')) body.classList.remove('cursor-hover');
    });

    // DOM-based strokes: each segment is a positioned <span> that CSS-animates to opacity 0
    // over 1.4s and auto-removes. Guaranteed to fade regardless of blend mode.
    document.addEventListener('pointermove', (e) => {
      if (!brushLayer) return;
      const now = performance.now();
      if (lastStrokeX === null) { lastStrokeX = e.clientX; lastStrokeY = e.clientY; lastStrokeT = now; return; }
      if (now - lastStrokeT < 14) return;
      const dx = e.clientX - lastStrokeX;
      const dy = e.clientY - lastStrokeY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) return;
      const dt = Math.max(1, now - lastStrokeT);
      const speed = dist / dt;
      const thickness = clamp(8 - speed * 3, 2.2, 8);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      const s = document.createElement('span');
      s.className = 'brush-stroke';
      s.style.left = lastStrokeX + 'px';
      s.style.top = (lastStrokeY - thickness / 2) + 'px';
      s.style.width = dist.toFixed(1) + 'px';
      s.style.height = thickness.toFixed(1) + 'px';
      s.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      brushLayer.appendChild(s);
      setTimeout(() => s.remove(), 1400);

      lastStrokeX = e.clientX;
      lastStrokeY = e.clientY;
      lastStrokeT = now;
    });
  }

  // ─────────────────────────────────────
  // Hero headline: mouse tilt
  // ─────────────────────────────────────
  const tiltEl = $('[data-mouse-tilt]');
  if (tiltEl && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (e) => {
      const r = tiltEl.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      tiltEl.style.transform = `translate3d(${(dx * 10).toFixed(1)}px, ${(dy * 6).toFixed(1)}px, 0) rotate(${(dx * 0.6).toFixed(2)}deg)`;
    });
  }

  // ─────────────────────────────────────
  // Click-to-spray on dark sections
  // ─────────────────────────────────────
  $$('.hero, .studio, .contact, .two-things').forEach(section => {
    section.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, textarea, .dollop, [data-action]')) return;
      const x = e.clientX, y = e.clientY;
      const splat = document.createElement('span');
      splat.className = 'click-splat';
      const size = 60 + Math.random() * 80;
      const rot = (Math.random() * 40 - 20).toFixed(1);
      splat.style.left = x + 'px';
      splat.style.top  = y + 'px';
      splat.style.width = size + 'px';
      splat.style.height = size + 'px';
      splat.style.margin = `${-size/2}px 0 0 ${-size/2}px`;
      splat.style.background = 'radial-gradient(circle at 40% 40%, var(--orange-light), var(--orange) 55%, var(--orange-deep))';
      splat.style.borderRadius = '54% 46% 58% 42% / 52% 48% 52% 48%';
      splat.style.opacity = '0';
      splat.style.filter = 'url(#spray-heavy)';
      splat.style.transform = 'scale(0.2)';
      splat.style.transition = 'transform 420ms cubic-bezier(.2,.8,.2,1), opacity 700ms';
      document.body.appendChild(splat);
      requestAnimationFrame(() => {
        splat.style.opacity = '1';
        splat.style.transform = `scale(1) rotate(${rot}deg)`;
      });
      setTimeout(() => { splat.style.opacity = '0'; }, 700);
      setTimeout(() => splat.remove(), 1500);
      sprayHiss({ duration: 0.22, volume: 0.25 });
    });
  });

  // ─────────────────────────────────────
  // Palette dollops: pointer tilt
  // ─────────────────────────────────────
  $$('.dollop').forEach(d => {
    const blob = d.querySelector('.dollop__blob');
    if (!blob) return;
    d.addEventListener('pointermove', (e) => {
      const r = blob.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      blob.style.transform = `translateY(-6px) scale(1.04) rotate(${(dx*4).toFixed(2)}deg) translate(${(dx*6).toFixed(1)}px, ${(dy*4).toFixed(1)}px)`;
    });
    d.addEventListener('pointerleave', () => { blob.style.transform = ''; });
  });

  // ─────────────────────────────────────
  // Konami code
  // ─────────────────────────────────────
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiBuf = [];
  document.addEventListener('keydown', (e) => {
    konamiBuf.push(e.key);
    if (konamiBuf.length > KONAMI.length) konamiBuf.shift();
    const matched = konamiBuf.length === KONAMI.length &&
      konamiBuf.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase());
    if (matched) {
      body.classList.add('konami');
      sprayHiss({ duration: 1.8, volume: 0.5 });
      setTimeout(() => body.classList.remove('konami'), 3200);
      konamiBuf = [];
    }
  });

  window.addEventListener('load', () => {
    setTimeout(() => { measureParallax(); onResize(); }, 120);
  });

})();
