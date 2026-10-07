/* Baydaar · settings shared by every page. Edit here, nowhere else. */
window.BAYDAAR = {
  // Business WhatsApp in international format, digits only (e.g. '923001234567').
  // Empty = WhatsApp buttons fall back to email / the call form.
  WHATSAPP: '923483303591',
  INSTAGRAM: 'https://www.instagram.com/baydaarexperiences/',
  EMAIL: 'baydaartravels@gmail.com',
  APP_URL: 'https://baydaarexperiences.com/app/',
  // DTS / tourism licence number. Shown in the trust line only when filled.
  LICENCE: '',
  FREE_DELIVERY_OVER: 5000,
};

/* ---- shared UI: floating buttons, mobile menu, message links ---- */
(function () {
  const B = window.BAYDAAR;
  B.waLink = text => B.WHATSAPP ? `https://wa.me/${B.WHATSAPP}?text=${encodeURIComponent(text)}` : '';
  B.mailLink = (subject, body) => `mailto:${B.EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  B.pkr = n => 'PKR ' + Math.round(n).toLocaleString('en-US');

  document.addEventListener('DOMContentLoaded', () => {
    // floating WhatsApp: no number yet → jump to the call form (or email on pages without it)
    const wa = document.querySelector('[data-fab-wa]');
    if (wa) {
      const hello = 'Assalam o Alaikum Baydaar! I have a question about ';
      if (B.WHATSAPP) wa.href = B.waLink(hello);
      else if (document.getElementById('call')) wa.href = '#call';
      else wa.href = B.mailLink('Question for Baydaar', hello);
      if (B.WHATSAPP) { wa.target = '_blank'; wa.rel = 'noopener'; }
    }
    const ig = document.querySelector('[data-fab-ig]');
    if (ig) ig.href = B.INSTAGRAM;

    // on phones the buttons wait until the hero is passed, so they never cover its CTAs
    const fab = document.querySelector('.fab');
    if (fab) {
      const mq = matchMedia('(max-width: 640px)');
      const tick = () => fab.classList.toggle('away', mq.matches && scrollY < innerHeight * 0.7);
      addEventListener('scroll', tick, { passive: true }); mq.addEventListener?.('change', tick); tick();
    }

    // mobile menu
    const btn = document.querySelector('[data-menu-btn]'), menu = document.querySelector('[data-menu]');
    if (btn && menu) {
      const set = open => {
        menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
        document.documentElement.classList.toggle('menu-open', open);
      };
      btn.addEventListener('click', () => set(!menu.classList.contains('open')));
      menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
      addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    }
  });
})();
