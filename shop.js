/* Baydaar Shop · catalogue, product view, bag and cash-on-delivery checkout.
   Products and prices mirror the Baydaar app. */

const PRODUCTS = [
  { id:'gilgit-shilajit', name:'Pure Gilgit Shilajit', cat:'health', popular:true,
    short:'Authentic mountain resin from Gilgit-Baltistan',
    desc:'Hand-harvested, purified Shilajit resin from the high Karakoram. Rich in fulvic acid and trace minerals. Lab tested for purity.',
    imgs:['img/shop/shilajit-1.jpg','img/shop/shilajit-2.jpg'], sizes:[['20g',3500],['50g',7500],['100g',13000]] },
  { id:'wild-sidr-honey', name:'Wild Sidr Honey', cat:'food', popular:true,
    short:'Premium raw honey from Sidr trees',
    desc:'Raw, unprocessed Sidr honey with a rich caramel flavour. Never heated, never blended.',
    imgs:['img/shop/honey-1.jpg','img/shop/honey-2.jpg'], sizes:[['250g',2500],['500g',4500],['1kg',8000]] },
  { id:'hunza-almond-oil', name:'Hunza Almond Oil', cat:'health',
    short:'Cold-pressed almond oil from Hunza',
    desc:'Premium cold-pressed almond oil, perfect for skin, hair and cooking.',
    imgs:['img/shop/almond-1.jpg','img/shop/walnut-1.jpg'], sizes:[['100ml',900],['250ml',2000],['500ml',3800]] },
  { id:'hunza-apricot-oil', name:'Hunza Apricot Oil', cat:'health',
    short:'Kernel-pressed apricot oil',
    desc:'Traditionally pressed apricot kernel oil, prized for skin and hair care.',
    imgs:['img/shop/apricot-1.jpg','img/shop/apricot-2.jpg'], sizes:[['100ml',800],['250ml',1700]] },
  { id:'walnut-oil', name:'Cold-Pressed Walnut Oil', cat:'health',
    short:'Nutty, omega-rich walnut oil',
    desc:'Cold-pressed walnut oil from northern orchards. Great for salads and skin.',
    imgs:['img/shop/walnut-1.jpg','img/shop/almond-1.jpg'], sizes:[['100ml',1200],['250ml',2600]] },
  { id:'apple-cider-vinegar', name:'Apple Cider Vinegar', cat:'food',
    short:'Raw unfiltered apple cider vinegar',
    desc:'Naturally fermented, raw and unfiltered apple cider vinegar with the mother.',
    imgs:['img/shop/vinegar-1.jpg','img/shop/vinegar-2.jpg'], sizes:[['250ml',600],['500ml',1000],['1L',1800]] },
];
// the home page links to the app's old id for apricot oil
const ALIASES = { 'apricot-oil': 'hunza-apricot-oil' };

const B = window.BAYDAAR;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pkr = n => 'PKR ' + Math.round(n).toLocaleString('en-US');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = id => PRODUCTS.find(p => p.id === (ALIASES[id] || id));
const FREE = B.FREE_DELIVERY_OVER || 5000;

/* ---------------- bag state (kept in this browser) ---------------- */
const KEY = 'baydaar-bag';
let bag = [];
try { bag = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { bag = []; }
bag = bag.filter(l => byId(l.id) && byId(l.id).sizes.some(s => s[0] === l.size));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} };
const priceOf = l => byId(l.id).sizes.find(s => s[0] === l.size)[1];
const subtotal = () => bag.reduce((t, l) => t + priceOf(l) * l.qty, 0);
const count = () => bag.reduce((t, l) => t + l.qty, 0);

function add(id, size, qty = 1) {
  const line = bag.find(l => l.id === id && l.size === size);
  line ? line.qty += qty : bag.push({ id, size, qty });
  save(); renderBag();
  const btn = $('[data-bag-open]'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  toast(`Added ${byId(id).name} · ${size}`);
}

/* ---------------- nav ---------------- */
const nav = $('[data-nav]');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });

/* ---------------- toast ---------------- */
let tt = 0;
function toast(msg) {
  const t = $('[data-toast]'); t.textContent = msg; t.classList.add('on');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400);
}

/* ---------------- catalogue ---------------- */
const grid = $('[data-grid]');
let cat = 'all', sort = 'pop';
$$('[data-cat-tabs] button').forEach(b => {
  const n = b.dataset.cat === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === b.dataset.cat).length;
  $('span', b).textContent = n;
  b.addEventListener('click', () => {
    cat = b.dataset.cat;
    $$('[data-cat-tabs] button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    renderGrid();
  });
});
$('[data-sort]').addEventListener('change', e => { sort = e.target.value; renderGrid(); });

function renderGrid() {
  let list = PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
  if (sort === 'lo') list = [...list].sort((a, b) => a.sizes[0][1] - b.sizes[0][1]);
  if (sort === 'hi') list = [...list].sort((a, b) => b.sizes[0][1] - a.sizes[0][1]);
  if (sort === 'pop') list = [...list].sort((a, b) => (b.popular | 0) - (a.popular | 0));
  grid.innerHTML = list.map((p, i) => `
    <article class="card" style="--d:${i * 70}ms">
      <button class="card-media" type="button" data-open-product="${p.id}" aria-label="View ${p.name}">
        <img src="${p.imgs[0]}" alt="${p.name}" loading="lazy">
        <img class="alt" src="${p.imgs[1]}" alt="" loading="lazy">
        ${p.popular ? '<span class="badge">Bestseller</span>' : ''}
      </button>
      <div class="card-body">
        <p class="card-cat">${p.cat === 'health' ? 'Health' : 'Food'}</p>
        <h3><button type="button" data-open-product="${p.id}">${p.name}</button></h3>
        <p class="card-short">${p.short}</p>
        <div class="card-foot">
          <p class="card-price"><small>from</small> ${pkr(p.sizes[0][1])}</p>
          <button class="quick" type="button" data-quick="${p.id}" aria-label="Add ${p.sizes[0][0]} ${p.name} to bag">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            <span>Add ${p.sizes[0][0]}</span>
          </button>
        </div>
      </div>
    </article>`).join('');
}
grid.addEventListener('click', e => {
  const q = e.target.closest('[data-quick]');
  if (q) { const p = byId(q.dataset.quick); add(p.id, p.sizes[0][0]); }
});
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open-product]');
  if (o) openProduct(o.dataset.openProduct);
});

/* ---------------- modal helpers ---------------- */
function openLayer(el) {
  el.hidden = false; requestAnimationFrame(() => el.classList.add('in'));
  document.documentElement.classList.add('modal-open');
}
function closeLayer(el) {
  el.classList.remove('in');
  setTimeout(() => { el.hidden = true; if ($$('.pdp.in,.bag.in').length === 0) document.documentElement.classList.remove('modal-open'); }, 380);
}
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('[data-bag]').hidden) closeLayer($('[data-bag]'));
  else if (!$('[data-pdp]').hidden) closePdp();
});

/* ---------------- product view ---------------- */
const pdp = $('[data-pdp]');
const P = { p: null, size: null, qty: 1 };
function openProduct(id) {
  const p = byId(id); if (!p) return;
  P.p = p; P.size = p.sizes[0][0]; P.qty = 1;
  $('[data-pdp-img]').src = p.imgs[0]; $('[data-pdp-img]').alt = p.name;
  $('[data-pdp-thumbs]').innerHTML = p.imgs.map((src, i) => `<button type="button" class="${i ? '' : 'on'}" data-src="${src}" aria-label="Photo ${i + 1}"><img src="${src}" alt=""></button>`).join('');
  $('[data-pdp-cat]').textContent = p.cat === 'health' ? 'Health' : 'Food';
  $('[data-pdp-name]').textContent = p.name;
  $('[data-pdp-short]').textContent = p.short;
  $('[data-pdp-desc]').textContent = p.desc;
  $('[data-pdp-sizes]').innerHTML = p.sizes.map(([s, pr], i) => `
    <button type="button" class="size" role="radio" aria-checked="${i === 0}" data-size="${s}"><b>${s}</b><small>${pkr(pr)}</small></button>`).join('');
  paintPdp();
  openLayer(pdp);
  history.replaceState(null, '', '#' + p.id);
  setTimeout(() => $('.size', pdp)?.focus({ preventScroll: true }), 60);
}
function paintPdp() {
  const pr = P.p.sizes.find(s => s[0] === P.size)[1];
  $('[data-pdp-price]').textContent = pkr(pr * P.qty);
  $('[data-pdp-unit]').textContent = P.qty > 1 ? `${P.qty} × ${pkr(pr)}` : P.size;
  $('[data-pdp-qty]').textContent = P.qty;
  const after = subtotal() + pr * P.qty;
  $('[data-pdp-free]').textContent = after >= FREE ? 'This order qualifies for free delivery.' : `Add ${pkr(FREE - after)} more for free delivery.`;
}
function closePdp() { closeLayer(pdp); history.replaceState(null, '', location.pathname); }
$('[data-pdp-sizes]').addEventListener('click', e => {
  const b = e.target.closest('.size'); if (!b) return;
  P.size = b.dataset.size; $$('.size', pdp).forEach(x => x.setAttribute('aria-checked', String(x === b))); paintPdp();
});
$('[data-pdp-thumbs]').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const img = $('[data-pdp-img]'); img.classList.add('swap');
  setTimeout(() => { img.src = b.dataset.src; img.classList.remove('swap'); }, 180);
  $$('button', b.parentElement).forEach(x => x.classList.toggle('on', x === b));
});
$('[data-pdp-minus]').addEventListener('click', () => { P.qty = Math.max(1, P.qty - 1); paintPdp(); });
$('[data-pdp-plus]').addEventListener('click', () => { P.qty = Math.min(20, P.qty + 1); paintPdp(); });
$('[data-pdp-add]').addEventListener('click', () => { add(P.p.id, P.size, P.qty); closePdp(); setTimeout(() => openBag(), 250); });
$$('[data-pdp-close]').forEach(b => b.addEventListener('click', closePdp));

/* ---------------- bag ---------------- */
const bagEl = $('[data-bag]');
function view(name) { $$('.bag-view', bagEl).forEach(v => v.hidden = v.dataset.view !== name); $('.bag-panel').scrollTop = 0; }
function openBag() { view('cart'); renderBag(); openLayer(bagEl); }
$('[data-bag-open]').addEventListener('click', openBag);
$$('[data-bag-close]').forEach(b => b.addEventListener('click', () => closeLayer(bagEl)));

function renderBag() {
  const n = count(), sub = subtotal();
  $('[data-bag-count]').textContent = n;
  $('[data-bag-open]').classList.toggle('has', n > 0);
  $('[data-bag-title]').textContent = n ? `Your bag (${n})` : 'Your bag';
  $('[data-empty]').hidden = n > 0;
  $('[data-bag-foot]').hidden = n === 0;
  $('[data-free]').hidden = n === 0;
  const pct = Math.min(100, sub / FREE * 100);
  $('[data-free-fill]').style.width = pct + '%';
  $('[data-free-msg]').innerHTML = sub >= FREE ? '<b>Free delivery</b> unlocked.' : `You're <b>${pkr(FREE - sub)}</b> away from free delivery.`;
  $('[data-lines]').innerHTML = bag.map((l, i) => {
    const p = byId(l.id);
    return `<li class="line">
      <img src="${p.imgs[0]}" alt="">
      <div class="line-info"><b>${p.name}</b><small>${l.size} · ${pkr(priceOf(l))}</small>
        <div class="qty sm"><button type="button" data-dec="${i}" aria-label="One fewer">−</button><output>${l.qty}</output><button type="button" data-inc="${i}" aria-label="One more">+</button></div>
      </div>
      <div class="line-end"><b>${pkr(priceOf(l) * l.qty)}</b><button class="linkish" type="button" data-rm="${i}">Remove</button></div>
    </li>`;
  }).join('');
  $('[data-subtotal]').textContent = pkr(sub);
  $('[data-delivery]').textContent = sub >= FREE ? 'Free' : 'Confirmed on call';
  $('[data-total]').textContent = pkr(sub);
  $('[data-co-total]').textContent = pkr(sub) + (sub >= FREE ? '' : ' + delivery');
}
$('[data-lines]').addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.inc) bag[+t.dataset.inc].qty = Math.min(20, bag[+t.dataset.inc].qty + 1);
  if (t.dataset.dec) { const l = bag[+t.dataset.dec]; l.qty--; if (l.qty < 1) bag.splice(+t.dataset.dec, 1); }
  if (t.dataset.rm) bag.splice(+t.dataset.rm, 1);
  save(); renderBag();
});

/* ---------------- checkout ---------------- */
$('[data-checkout]').addEventListener('click', () => view('checkout'));
$('[data-co-back]').addEventListener('click', () => view('cart'));
$('[data-co-form]').addEventListener('submit', e => {
  e.preventDefault();
  const err = $('[data-co-err]');
  const f = { name: $('#co-name'), phone: $('#co-phone'), addr: $('#co-addr') };
  const bad = (el, m) => { err.textContent = m; err.hidden = false; el.focus(); el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 500); };
  if (f.name.value.trim().length < 3) return bad(f.name, 'Add the name the parcel should go to.');
  if (!/^[0-9+ ]{10,15}$/.test(f.phone.value.trim())) return bad(f.phone, 'Add a phone number the courier can call, like 0300 1234567.');
  if (f.addr.value.trim().length < 10) return bad(f.addr, 'Add the full address with area and a landmark.');
  err.hidden = true;

  const ref = 'BO-' + (Date.now() % 1e6).toString(36).toUpperCase().padStart(4, '0');
  const sub = subtotal();
  const items = bag.map(l => `• ${byId(l.id).name} ${l.size} × ${l.qty} = ${pkr(priceOf(l) * l.qty)}`).join('\n');
  const notes = $('#co-notes').value.trim();
  const msg = `Assalam o Alaikum Baydaar! New shop order ${ref}\n\n${items}\n\nSubtotal: ${pkr(sub)}\nDelivery: ${sub >= FREE ? 'Free' : 'to be confirmed'}\nPayment: Cash on delivery\n\nName: ${f.name.value.trim()}\nPhone: ${f.phone.value.trim()}\nCity: ${$('#co-city').value}\nAddress: ${f.addr.value.trim()}${notes ? '\nNotes: ' + notes : ''}`;
  const send = $('[data-order-send]');
  if (B.WHATSAPP) { send.href = B.waLink(msg); send.textContent = 'Send order on WhatsApp'; }
  else { send.href = B.mailLink(`Shop order ${ref}`, msg); send.textContent = 'Send order by email'; }
  $('[data-order-ref]').textContent = ref;
  $('[data-placed-msg]').textContent = `${count()} ${count() > 1 ? 'items' : 'item'}, ${pkr(sub)} to pay in cash on delivery. Send the order below and we'll call ${f.phone.value.trim()} to confirm it.`;
  view('placed');
});
// the bag empties once the order message is on its way
$('[data-order-send]').addEventListener('click', () => { bag = []; save(); setTimeout(renderBag, 400); });

/* ---------------- golden dust in the hero ---------------- */
(function dust() {
  const c = $('[data-dust]'); if (!c || reduce) return;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2), r = c.getBoundingClientRect(); c.width = r.width * d; c.height = r.height * d; const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return { x, w: r.width, h: r.height }; };
  let S = fit(); addEventListener('resize', () => S = fit());
  const pts = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 2.2, v: .0001 + Math.random() * .0003, ph: Math.random() * 6.28 }));
  let on = true;
  new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) requestAnimationFrame(f); }).observe(c);
  function f(t) {
    const { x: ctx, w, h } = S; ctx.clearRect(0, 0, w, h);
    pts.forEach(p => {
      p.y -= p.v; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
      const x = (p.x + Math.sin(t / 3000 + p.ph) * .01) * w, y = p.y * h, a = .25 + .35 * Math.sin(t / 700 + p.ph) ** 2;
      const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4); g.addColorStop(0, `rgba(243,178,74,${a})`); g.addColorStop(1, 'rgba(243,178,74,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 4, 0, 6.28); ctx.fill();
    });
    if (on) requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
})();

/* ---------------- start ---------------- */
renderGrid(); renderBag();
const deep = location.hash.slice(1);
if (deep && byId(deep)) setTimeout(() => openProduct(deep), 350);
addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId(id) && pdp.hidden) openProduct(id); });
