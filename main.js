/* Baydaar Experiences · site script
   Everything the client edits lives in CONFIG. The rest is behaviour. */

const CONFIG = {
  // WhatsApp number in international format, digits only (e.g. '923001234567').
  // Leave empty and the site falls back to email.
  WHATSAPP: '',
  EMAIL: 'baydaartravels@gmail.com',
  // DTS / tourism licence number. Shown in the trust line only when filled.
  LICENCE: '',
  APP_URL: 'https://baydaarexperiences.com/app/',

  // SAMPLE DEPARTURES — replace with the live schedule from the Baydaar app.
  // Departures in the past are hidden automatically.
  TRIPS: [
    { id:'hunza-valley-adventure', t:'Hunza Valley Adventure', w:'Hunza, Gilgit-Baltistan', d:7, p:75000, k:'domestic', img:'img/eagle.jpg',
      deps:[['2026-10-10',4],['2026-10-24',9],['2026-11-07',12]] },
    { id:'skardu-expedition', t:'Skardu Expedition', w:'Skardu, Gilgit-Baltistan', d:6, p:68000, k:'domestic', img:'img/katpana.jpg',
      deps:[['2026-10-17',6],['2026-10-31',11]] },
    { id:'swat-valley-heritage', t:'Swat Valley Heritage Tour', w:'Swat, Khyber Pakhtunkhwa', d:4, p:45000, k:'domestic', img:'img/swat.jpg',
      deps:[['2026-10-03',3],['2026-10-23',10]] },
    { id:'white-water-rafting-kunhar', t:'White Water Rafting, Kunhar', w:'Kaghan Valley, KPK', d:2, p:25000, k:'domestic', img:'img/rafting.jpg',
      deps:[['2026-10-04',7],['2026-10-11',12]] },
    { id:'turkey-cultural-journey', t:'Turkey Cultural Journey', w:'Istanbul & Cappadocia', d:10, p:350000, k:'international', img:'img/cappadocia.jpg',
      deps:[['2026-11-12',8],['2026-12-10',12]] },
    { id:'azerbaijan-baku-escape', t:'Baku City Escape', w:'Baku, Azerbaijan', d:5, p:180000, k:'international', img:'img/baku.jpg',
      deps:[['2026-12-18',10]] },
  ],
  SEATS_PER_DEPARTURE: 14,

  PLACES: [
    { n:'Hunza', a:'2,438 m · Karimabad', img:'img/eagle.jpg', k:'Pakistan', s:'Apricot orchards under Rakaposhi and Ultar. Come in late October, when the poplars turn gold.' },
    { n:'Attabad Lake', a:'2,560 m · Gojal', img:'img/attabad.jpg', k:'Pakistan', s:'A landslide made it in 2010. The water really is that colour.' },
    { n:'Rakaposhi', a:'7,788 m · Nagar', img:'img/rakaposhi.jpg', k:'Pakistan', s:'A wall of ice that rises almost straight out of green wheat fields.' },
    { n:'Passu', a:'7,611 m · Shispare', img:'img/passu.jpg', k:'Pakistan', s:'A glacier you can walk to from the Karakoram Highway.' },
    { n:'Katpana Desert', a:'2,226 m · Skardu', img:'img/katpana.jpg', k:'Pakistan', s:'Sand dunes with snow peaks behind them. A cold desert, and a strange one.' },
    { n:'Deosai Plains', a:'4,114 m · Baltistan', img:'img/deosai.jpg', k:'Pakistan', s:'One of the highest plateaus on earth. Wildflowers, brown bears and no phone signal.' },
    { n:'Cappadocia', a:'1,000 m · Turkey', img:'img/cappadocia.jpg', k:'Beyond', s:'Sunrise from a balloon basket, with a hundred more around you.' },
    { n:'Istanbul', a:'39 m · Turkey', img:'img/turkey.jpg', k:'Beyond', s:'Two continents and one ferry ride. The Blue Mosque at golden hour.' },
    { n:'Baku', a:'−28 m · Azerbaijan', img:'img/baku.jpg', k:'Beyond', s:'The Flame Towers and the Caspian. The only stop on our map below sea level.' },
  ],
};

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pkr = n => 'PKR ' + Math.round(n).toLocaleString('en-US');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const today = new Date(); today.setHours(0,0,0,0);
const toDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const fmt = dt => `${dt.getDate()} ${MON[dt.getMonth()]}`;
const daysUntil = dt => Math.round((dt - today) / 864e5);
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

// only future departures; trips with none drop off the board
const TRIPS = CONFIG.TRIPS.map(t => ({ ...t, deps: t.deps.map(([d,s]) => ({ date: toDate(d), seats: s })).filter(x => x.date > today) }))
  .filter(t => t.deps.length);

/* run a canvas loop only while it is on screen */
function whenVisible(el, start, stop) {
  if (!('IntersectionObserver' in window)) { start(); return; }
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { rootMargin: '100px' }).observe(el);
}
function fitCanvas(c) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = c.getBoundingClientRect();
  c.width = Math.max(1, r.width * dpr); c.height = Math.max(1, r.height * dpr);
  const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}
function loop(draw) {
  let raf = 0, on = false;
  const tick = t => { draw(t); if (on) raf = requestAnimationFrame(tick); };
  return {
    start() { if (on) return; on = true; raf = requestAnimationFrame(tick); },
    stop() { on = false; cancelAnimationFrame(raf); },
  };
}

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!reduce && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  document.documentElement.classList.add('lenis');
  if (hasGsap) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: id === '#top' ? 0 : -10 });
  }));
}
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ---------------- nav + altimeter ---------------- */
const nav = $('[data-nav]');
const altSections = $$('[data-alti]');
const altM = $('[data-alti-m]'), altPlace = $('[data-alti-place]'), altFill = $('.alti-fill');
const ALT_MIN = 540, ALT_MAX = 4693;
let shownAlt = 540;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  const mid = y + 90; // just under the nav
  let alt = ALT_MIN, place = altSections[0].dataset.place;
  for (let i = 0; i < altSections.length; i++) {
    const s = altSections[i], top = s.offsetTop, h = s.offsetHeight;
    if (mid >= top) {
      const a0 = +s.dataset.alti, next = altSections[i + 1];
      const a1 = next ? +next.dataset.alti : a0;
      const p = Math.min(1, Math.max(0, (mid - top) / h));
      alt = a0 + (a1 - a0) * p; place = s.dataset.place;
    }
  }
  shownAlt += (alt - shownAlt) * 0.35;
  altM.textContent = Math.round(shownAlt).toLocaleString('en-US');
  altPlace.textContent = place;
  altFill.style.height = ((shownAlt - ALT_MIN) / (ALT_MAX - ALT_MIN) * 100) + '%';
}
if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
setInterval(onScroll, 120); // lets the number settle after scrolling stops
onScroll();

/* ---------------- hero ---------------- */
(function hero() {
  const next = TRIPS.flatMap(t => t.deps.map(d => ({ t, d }))).sort((a, b) => a.d.date - b.d.date)[0];
  if (next) {
    $('[data-next-name]').textContent = next.t.t.replace(/ (Adventure|Expedition|Heritage Tour|Cultural Journey|City Escape)$/, '');
    $('[data-next-meta]').textContent = `${fmt(next.d.date)} · ${next.d.seats} seats left`;
  } else $('[data-next-dep]').hidden = true;

  if (hasGsap && !reduce) {
    gsap.from('.hero-title span', { yPercent: 110, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .15 });
    gsap.from('.hero .urdu, .hero .eyebrow', { y: 20, opacity: 0, duration: 1, ease: 'power3.out', delay: .05 });
    gsap.from('.hero .lede, .hero .cta-row, .hero .proof li', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .55 });
    gsap.from('.next-dep', { x: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 1 });
    // scroll: image sinks, copy lifts away
    gsap.to('[data-hero-media]', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-inner', { y: -80, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
  }
  // pointer parallax on the photo
  const media = $('[data-hero-media]');
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    $('.hero').addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * -22; ty = (e.clientY / innerHeight - .5) * -14; });
    (function f() { cx += (tx - cx) * .06; cy += (ty - cy) * .06; media.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(f); })();
  }
})();

/* ---------------- leaves: a swaying branch and falling poplar leaves ---------------- */
(function leaves() {
  const c = $('[data-leaves]'); if (!c || reduce) return;
  let S = fitCanvas(c), wind = 0, windT = 0, px = -1;
  addEventListener('resize', () => { S = fitCanvas(c); build(); });
  $('.hero').addEventListener('pointermove', e => { if (px >= 0) windT = Math.max(-3, Math.min(3, (e.clientX - px) * .15)); px = e.clientX; });
  const GOLD = ['#E7B04A', '#D9962A', '#F2C861', '#C47F1F', '#EDBB55'];
  const leafPath = (ctx, s) => { // poplar leaf: broad, pointed
    ctx.beginPath(); ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * .9, -s * .55, s * .8, s * .45, 0, s * .8);
    ctx.bezierCurveTo(-s * .8, s * .45, -s * .9, -s * .55, 0, -s); ctx.closePath();
  };
  let falling = [], branch = [];
  function build() {
    const n = Math.round(Math.min(46, S.w / 30));
    falling = Array.from({ length: n }, () => spawn(true));
    // branch hanging in from the top-right corner
    const bx = S.w + 20, by = -10, len = Math.min(520, S.w * .42);
    branch = [];
    for (let i = 0; i < 38; i++) {
      const t = i / 37;
      const x = bx - t * len, y = by + Math.sin(t * 2.2) * len * .28 + t * 60;
      branch.push({ t, x, y, s: 9 + Math.random() * 7, a: Math.random() * 6.28, side: i % 2 ? 1 : -1, col: GOLD[i % GOLD.length], ph: Math.random() * 6.28 });
    }
  }
  function spawn(init) {
    return { x: Math.random() * S.w, y: init ? Math.random() * S.h : -20, s: 5 + Math.random() * 7, vy: .35 + Math.random() * .7,
      ph: Math.random() * 6.28, spin: (Math.random() - .5) * .04, a: Math.random() * 6.28, col: GOLD[(Math.random() * GOLD.length) | 0], flip: Math.random() * 6.28, z: .5 + Math.random() * .7 };
  }
  build();
  const L = loop(t => {
    const { ctx, w, h } = S; ctx.clearRect(0, 0, w, h);
    windT *= .96; wind += (windT - wind) * .05;
    const breeze = Math.sin(t / 2400) * .6 + wind;
    // branch
    const len = branch.length;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30,20,10,.85)'; ctx.lineWidth = 5;
    ctx.beginPath();
    branch.forEach((b, i) => {
      const sway = Math.sin(t / 1300 + b.t * 2) * 10 * b.t + breeze * 8 * b.t;
      b.cx = b.x + sway; b.cy = b.y + Math.cos(t / 1500 + b.t) * 4 * b.t;
      i ? ctx.lineTo(b.cx, b.cy) : ctx.moveTo(b.cx, b.cy);
    });
    ctx.stroke();
    branch.forEach(b => {
      const flut = Math.sin(t / 380 + b.ph) * .35 + breeze * .2;
      ctx.save(); ctx.translate(b.cx, b.cy); ctx.rotate(b.side * 1.1 + flut + .6);
      ctx.strokeStyle = 'rgba(30,20,10,.8)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, b.s * .9); ctx.stroke();
      ctx.translate(0, b.s * 1.7);
      ctx.scale(Math.cos(t / 500 + b.ph) * .25 + .85, 1);
      leafPath(ctx, b.s); ctx.fillStyle = b.col; ctx.fill();
      ctx.strokeStyle = 'rgba(90,50,10,.45)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, -b.s * .9); ctx.lineTo(0, b.s * .7); ctx.stroke();
      ctx.restore();
    });
    // falling leaves
    falling.forEach((p, i) => {
      p.y += p.vy * p.z * 1.2; p.x += Math.sin(t / 900 + p.ph) * .6 * p.z + breeze * .9 * p.z;
      p.a += p.spin + breeze * .004; p.flip += .03;
      if (p.y > h + 20 || p.x < -40 || p.x > w + 40) falling[i] = spawn(false);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(Math.cos(p.flip), 1);
      ctx.globalAlpha = .55 + p.z * .4; leafPath(ctx, p.s * p.z); ctx.fillStyle = p.col; ctx.fill(); ctx.restore();
    });
    ctx.globalAlpha = 1;
  });
  whenVisible(c, L.start, L.stop);
})();

/* ---------------- contour lines behind the departure board ---------------- */
(function contours() {
  const c = $('[data-contours]'); if (!c) return;
  let S = fitCanvas(c); addEventListener('resize', () => S = fitCanvas(c));
  const draw = t => {
    const { ctx, w, h } = S; ctx.clearRect(0, 0, w, h);
    const n = 22, T = t / 9000;
    for (let i = 0; i < n; i++) {
      const base = h * (i + .5) / n;
      ctx.beginPath();
      for (let x = 0; x <= w + 10; x += 10) {
        const u = x / w;
        const y = base + Math.sin(u * 5.2 + T * 2 + i * .45) * 26 + Math.sin(u * 11.3 - T * 3 + i * .9) * 9 + Math.sin(u * 2.1 + i * .2 + T) * 40 * Math.sin(i / n * 3.14);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      const major = i % 5 === 0;
      ctx.strokeStyle = major ? 'rgba(60,208,215,.32)' : 'rgba(60,208,215,.12)';
      ctx.lineWidth = major ? 1.3 : 1; ctx.stroke();
    }
  };
  if (reduce) { draw(0); return; }
  const L = loop(draw); whenVisible(c, L.start, L.stop);
})();

/* ---------------- departure board ---------------- */
(function board() {
  const el = $('[data-board]'); if (!el) return;
  const rows = TRIPS.map(t => ({ t, d: t.deps[0] })).sort((a, b) => a.d.date - b.d.date);
  const flapHTML = s => [...s].map(ch => ch === ' ' ? '<span class="flap sp"> </span>' : `<span class="flap" data-ch="${ch}">${ch}</span>`).join('');
  const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function render(f) {
    el.innerHTML = rows.filter(r => f === 'all' || r.t.k === f).map(({ t, d }) => {
      const left = d.seats, pct = Math.max(6, (1 - left / CONFIG.SEATS_PER_DEPARTURE) * 100), low = left <= 5;
      const label = `${String(d.date.getDate()).padStart(2, '0')} ${MON[d.date.getMonth()].toUpperCase()}`;
      return `<a class="dep" role="listitem" href="#book" data-trip="${t.id}" data-date="${+d.date}" aria-label="${t.t}, departs ${fmt(d.date)}, ${left} seats left, ${pkr(t.p)} per person">
        <span class="flaps" aria-hidden="true">${flapHTML(label)}</span>
        <span class="dep-name"><b>${t.t}</b><span>${t.w}</span></span>
        <span class="dep-days">${t.d} DAYS</span>
        <span class="dep-seats${low ? ' low' : ''}"><span>${left} of ${CONFIG.SEATS_PER_DEPARTURE} seats left</span><span class="bar"><i style="width:${pct}%"></i></span></span>
        <span class="dep-price">${pkr(t.p)}<small>per person</small></span>
        <span class="dep-go">${arrow}</span>
      </a>`;
    }).join('');
    flip();
  }
  // split-flap: each character shuffles, then lands
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function flip() {
    if (reduce) return;
    $$('.flap[data-ch]', el).forEach((f, i) => {
      const real = f.dataset.ch; let n = 6 + (i % 5) * 2 + Math.floor(i / 6) * 2;
      const iv = setInterval(() => {
        f.textContent = n-- > 0 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : real;
        if (n < 0) clearInterval(iv);
      }, 55);
    });
  }
  render('all');
  $$('.board-tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.board-tabs button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    render(b.dataset.f);
  }));
  // replay the flaps the first time the board scrolls into view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { flip(); io.disconnect(); } }, { threshold: .3 });
    io.observe(el);
  }
  el.addEventListener('click', e => {
    const a = e.target.closest('.dep'); if (!a) return;
    window.dispatchEvent(new CustomEvent('baydaar:pick', { detail: { id: a.dataset.trip, date: +a.dataset.date } }));
  });
})();

/* ---------------- places: horizontal journey ---------------- */
(function places() {
  const track = $('[data-places-track]'); if (!track) return;
  track.innerHTML = CONFIG.PLACES.map(p => `
    <article class="place">
      <img src="${p.img}" alt="${p.n}" loading="lazy">
      <span class="tag">${p.k}</span>
      <div class="body"><span class="alt">${p.a}</span><h3>${p.n}</h3><p>${p.s}</p></div>
    </article>`).join('');
  if (!hasGsap || reduce) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', () => {
    const pin = $('[data-places-pin]'), row = $('[data-places-row]');
    const dist = () => Math.max(0, row.scrollWidth - innerWidth);
    const tween = gsap.to(row, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.place img', track).forEach(img => {
      gsap.fromTo(img, { xPercent: 8 }, { xPercent: -8, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 980px)', () => {
    gsap.from($$('.place', track), { y: 40, opacity: 0, stagger: .08, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: track, start: 'top 85%' } });
  });
})();

/* ---------------- booking web app ---------------- */
(function webapp() {
  const form = $('[data-wa-form]'); if (!form) return;
  const sel = $('[data-wa-trip]'), datesEl = $('[data-wa-dates]'), paxEl = $('[data-wa-pax]');
  const state = { trip: TRIPS[0], dep: TRIPS[0]?.deps[0], pax: 2 };
  sel.innerHTML = TRIPS.map(t => `<option value="${t.id}">${t.t} · ${t.d} days</option>`).join('');

  function setTrip(id, dateMs) {
    state.trip = TRIPS.find(t => t.id === id) || TRIPS[0];
    state.dep = state.trip.deps.find(d => +d.date === dateMs) || state.trip.deps[0];
    sel.value = state.trip.id;
    const img = $('[data-wa-img]');
    img.style.opacity = 0;
    setTimeout(() => { img.src = state.trip.img; img.onload = () => img.style.opacity = 1; }, 180);
    $('[data-wa-title]').textContent = state.trip.t;
    $('[data-wa-where]').textContent = `${state.trip.w} · ${state.trip.d} days`;
    datesEl.innerHTML = state.trip.deps.map(d => `
      <button type="button" class="chip" role="radio" aria-checked="${d === state.dep}" data-ms="${+d.date}">
        ${DOW[d.date.getDay()]} ${fmt(d.date)}<small>${d.seats} seats left</small></button>`).join('');
    update();
  }
  function update() {
    const { trip, dep } = state;
    state.pax = Math.max(1, Math.min(dep.seats, state.pax));
    paxEl.textContent = state.pax;
    $('[data-wa-seats]').textContent = `${dep.seats} seats left`;
    const total = trip.p * state.pax, adv = total / 2;
    $('[data-wa-total]').textContent = pkr(total);
    $('[data-wa-adv]').textContent = pkr(adv);
    const dleft = daysUntil(dep.date);
    const tiers = [
      { pct: .5, when: 'More than 15 days out', on: dleft > 15 },
      { pct: .25, when: '10 to 14 days out', on: dleft >= 10 && dleft <= 15 },
      { pct: 0, when: 'Under 10 days', on: dleft < 10 },
    ];
    $('[data-wa-tiers]').innerHTML = tiers.map(x => `<div class="tier${x.on ? ' now' : ''}"><b>${pkr(adv * x.pct)}</b>${x.when}${x.on ? ' · today' : ''}</div>`).join('');
  }
  sel.addEventListener('change', () => setTrip(sel.value));
  datesEl.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    state.dep = state.trip.deps.find(d => +d.date === +b.dataset.ms);
    $$('.chip', datesEl).forEach(c => c.setAttribute('aria-checked', String(c === b)));
    update();
  });
  $('[data-wa-minus]').addEventListener('click', () => { state.pax--; update(); });
  $('[data-wa-plus]').addEventListener('click', () => { state.pax++; update(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const { trip, dep, pax } = state, total = trip.p * pax;
    $('[data-wa-summary]').textContent = `${trip.t}, leaving ${DOW[dep.date.getDay()]} ${fmt(dep.date)}, for ${pax} ${pax > 1 ? 'people' : 'person'}. Trip total ${pkr(total)}, advance ${pkr(total / 2)}. Sign in to send the request and a planner will call you to confirm.`;
    $('[data-wa-open]').href = `${CONFIG.APP_URL}experience/${trip.id}`;
    const w = $('[data-wa-whats]');
    if (CONFIG.WHATSAPP) {
      const msg = `Assalam o Alaikum Baydaar! I'd like to reserve ${pax} seat(s) on ${trip.t}, departing ${fmt(dep.date)}. Total ${pkr(total)}.`;
      w.href = `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`; w.hidden = false;
    }
    form.hidden = true; $('[data-wa-done]').hidden = false;
    $('.wa-done h3').textContent = 'Your seats are priced.';
  });
  $('[data-wa-reset]').addEventListener('click', () => { form.hidden = false; $('[data-wa-done]').hidden = true; });
  window.addEventListener('baydaar:pick', e => { setTrip(e.detail.id, e.detail.date); form.hidden = false; $('[data-wa-done]').hidden = true; });
  setTrip(state.trip.id);

  if (hasGsap && !reduce) {
    gsap.from('[data-webapp]', { y: 80, rotate: 2, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.book', start: 'top 70%' } });
    gsap.from('.steps li', { x: -20, opacity: 0, stagger: .1, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 80%' } });
  }
})();

/* ---------------- app features ---------------- */
(function appFeatures() {
  const feats = $$('[data-feat]'); if (!feats.length) return;
  let cur = 0, timer = 0;
  function show(i) {
    cur = i;
    feats.forEach((f, k) => f.classList.toggle('is-on', k === i));
    $$('[data-scr]').forEach((s, k) => s.classList.toggle('is-on', k === i));
    $$('[data-float]').forEach((s, k) => s.classList.toggle('is-on', k === i));
  }
  const auto = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % feats.length), 4800); };
  feats.forEach((f, i) => {
    f.tabIndex = 0;
    f.addEventListener('click', () => { show(i); auto(); });
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); auto(); } });
  });
  show(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? auto() : clearInterval(timer)), { threshold: .3 }).observe($('.app'));
  } else auto();
  if (hasGsap && !reduce) {
    gsap.from('[data-phone]', { y: 120, rotate: -6, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.app', start: 'top 75%' } });
  }
})();

/* ---------------- shop: golden dust + tilt ---------------- */
(function shop() {
  const c = $('[data-dust]');
  if (c && !reduce) {
    let S = fitCanvas(c); addEventListener('resize', () => S = fitCanvas(c));
    const P = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 2.2, v: .00008 + Math.random() * .00025, ph: Math.random() * 6.28 }));
    const L = loop(t => {
      const { ctx, w, h } = S; ctx.clearRect(0, 0, w, h);
      P.forEach(p => {
        p.y -= p.v; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        const x = (p.x + Math.sin(t / 3000 + p.ph) * .01) * w, y = p.y * h;
        const a = .25 + .35 * Math.sin(t / 700 + p.ph) ** 2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
        g.addColorStop(0, `rgba(243,178,74,${a})`); g.addColorStop(1, 'rgba(243,178,74,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 4, 0, 6.28); ctx.fill();
      });
    });
    whenVisible(c, L.start, L.stop);
  }
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }
})();

/* ---------------- stars over the pass ---------------- */
(function stars() {
  const c = $('[data-stars]'); if (!c) return;
  let S = fitCanvas(c), st = [], shoot = null;
  const build = () => { st = Array.from({ length: Math.round(S.w * S.h / 2600) }, () => ({ x: Math.random() * S.w, y: Math.random() * S.h * .85, r: Math.random() * 1.3 + .2, ph: Math.random() * 6.28, sp: .5 + Math.random() * 2 })); };
  addEventListener('resize', () => { S = fitCanvas(c); build(); }); build();
  const draw = t => {
    const { ctx, w, h } = S; ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#03080C'); g.addColorStop(.7, '#0A1B24'); g.addColorStop(1, '#12303A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    st.forEach(s => { ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(t / 1000 * s.sp * .6 + s.ph)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); });
    ctx.globalAlpha = 1;
    if (!shoot && Math.random() < .004) shoot = { x: Math.random() * w * .8 + w * .1, y: Math.random() * h * .3, l: 0 };
    if (shoot) {
      shoot.l += 14; const x2 = shoot.x - shoot.l, y2 = shoot.y + shoot.l * .45;
      const gr = ctx.createLinearGradient(shoot.x - shoot.l + 90, y2 - 40, x2, y2);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.9)');
      ctx.strokeStyle = gr; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x2 + 90, y2 - 40.5); ctx.lineTo(x2, y2); ctx.stroke();
      if (shoot.l > 380) shoot = null;
    }
  };
  if (reduce) { draw(0); return; }
  const L = loop(draw); whenVisible(c, L.start, L.stop);
})();

/* ---------------- 15-minute call scheduler ---------------- */
(function meet() {
  const form = $('[data-meet]'); if (!form) return;
  const daysEl = $('[data-days]'), slotsEl = $('[data-slots]');
  const SLOTS = ['11:00 am', '1:00 pm', '3:00 pm', '5:00 pm', '7:00 pm', '9:00 pm'];
  const days = []; for (let i = 1; days.length < 6; i++) { const d = new Date(today); d.setDate(d.getDate() + i); days.push(d); }
  let pick = { day: days[0], slot: SLOTS[3] };
  daysEl.innerHTML = days.map((d, i) => `<button type="button" class="day" role="radio" aria-checked="${i === 0}" data-i="${i}"><small>${DOW[d.getDay()]}</small>${d.getDate()}<small>${MON[d.getMonth()]}</small></button>`).join('');
  slotsEl.innerHTML = SLOTS.map(s => `<button type="button" class="chip" role="radio" aria-checked="${s === pick.slot}" data-s="${s}">${s}</button>`).join('');
  daysEl.addEventListener('click', e => { const b = e.target.closest('.day'); if (!b) return; pick.day = days[+b.dataset.i]; $$('.day', daysEl).forEach(x => x.setAttribute('aria-checked', String(x === b))); });
  slotsEl.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; pick.slot = b.dataset.s; $$('.chip', slotsEl).forEach(x => x.setAttribute('aria-checked', String(x === b))); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#m-name').value.trim(), phone = $('#m-phone').value.trim(), want = $('#m-want').value;
    const when = `${DOW[pick.day.getDay()]} ${fmt(pick.day)} at ${pick.slot}`;
    const msg = `Assalam o Alaikum Baydaar! I'd like a 15-minute call on ${when} (PKT).\nName: ${name}\nWhatsApp: ${phone}\nThinking about: ${want}`;
    const w = $('[data-meet-whats]');
    if (CONFIG.WHATSAPP) {
      w.href = `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`; w.textContent = 'Send on WhatsApp to confirm';
    } else {
      w.href = `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('15-minute call: ' + when)}&body=${encodeURIComponent(msg)}`; w.textContent = 'Send by email to confirm';
    }
    w.hidden = false;
    $('.meet-done h3').textContent = 'Almost there, ' + (name.split(' ')[0] || 'friend') + '.';
    $('[data-meet-summary]').textContent = `${when}, Pakistan time. Send the message below and a planner will call ${phone} on WhatsApp.`;
    $('[data-meet-form]').hidden = true; $('[data-meet-done]').hidden = false;
  });
  $('[data-meet-reset]').addEventListener('click', () => { $('[data-meet-form]').hidden = false; $('[data-meet-done]').hidden = true; });
  if (CONFIG.LICENCE) { const l = $('[data-licence]'); l.textContent = ' · Licence ' + CONFIG.LICENCE; l.hidden = false; }
})();

/* ---------------- section headings rise in ---------------- */
if (hasGsap && !reduce) {
  $$('.sec-head, .book-copy > h2, .app-copy > h2, .call-copy > h2, .places-intro').forEach(h => {
    gsap.from(h, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  addEventListener('load', () => ScrollTrigger.refresh());
}
