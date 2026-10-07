// ==========================================================
// router.js
// Tabs ke hisaab se screen badalna. Har screen ki apni file hoti
// hai: js/screens/<naam>.js, jisme ek function hona chahiye:
//
//   export async function render(container, params) { ... }
//
// Agar screen ki file abhi bani nahi, to "jald aa raha hai" wali
// screen dikhti hai, isliye ek-ek screen jodte hue test kar sakte ho.
//
// Naya screen jodna ho to:
//   1) neeche ROUTES mein naam likho
//   2) js/screens/<naam>.js banao
//   3) index.html ke tabbar mein ek link jodo (data-route="<naam>")
// ==========================================================

import { CONFIG } from './config.js';
import { t, applyTranslations } from './i18n.js';

const ROUTES = ['home', 'rates', 'groups', 'savings'];

let container = null;
let renderToken = 0;          // purani, der se aayi screen ko ignore karne ke liye

// ---------- Address padhna: #/groups/abc -> { name: 'groups', params: ['abc'] } ----------
function safeDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function isEnabled(route) {
  return route === 'home' || CONFIG.features[route] !== false;
}

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const valid = ROUTES.includes(parts[0]) && isEnabled(parts[0]);
  return {
    name: valid ? parts[0] : CONFIG.defaultRoute,
    params: valid ? parts.slice(1).map(safeDecode) : [],
  };
}

// ---------- Neeche ki tabs ----------
function setupTabbar() {
  const tabs = [...document.querySelectorAll('.tabbar__item')];
  tabs.forEach((tab) => {
    if (!isEnabled(tab.dataset.route)) tab.style.display = 'none';
  });
  const visible = tabs.filter((tab) => tab.style.display !== 'none').length;
  const bar = document.querySelector('.tabbar');
  if (bar) bar.style.gridTemplateColumns = `repeat(${visible}, 1fr)`;
}

function setActiveTab(name) {
  document.querySelectorAll('.tabbar__item').forEach((tab) => {
    if (tab.dataset.route === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
}

// ---------- Beech mein message dikhana (jald aa raha hai / galti) ----------
function showMessage({ icon, title, text, onRetry }) {
  const wrap = document.createElement('div');
  wrap.className = 'empty';

  const iconEl = document.createElement('div');
  iconEl.className = 'empty__icon';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;

  const titleEl = document.createElement('h2');
  titleEl.className = 'section-title';
  titleEl.textContent = title;

  const textEl = document.createElement('p');
  textEl.textContent = text;

  wrap.append(iconEl, titleEl, textEl);

  if (onRetry) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = t('common.retry');
    btn.addEventListener('click', onRetry);
    wrap.append(btn);
  }

  container.replaceChildren(wrap);
}

function showComingSoon(name) {
  // 'common.coming_soon' key locale files mein jod do to wahi dikhega,
  // warna abhi ke liye "थोड़ा रुकिए..." dikhega
  const soon = t('common.coming_soon');
  showMessage({
    icon: '🚧',
    title: t(`nav.${name}`),
    text: soon === 'common.coming_soon' ? t('common.loading') : soon,
  });
}

// ---------- Screen dikhana ----------
async function renderCurrent({ focus = false } = {}) {
  const { name, params } = parseHash();
  const token = ++renderToken;
  setActiveTab(name);

  let screen;
  try {
    screen = await import(`./screens/${name}.js`);
  } catch (err) {
    console.warn(`[router] screens/${name}.js nahi mili`, err);
    if (token === renderToken) showComingSoon(name);
    return;
  }
  if (token !== renderToken) return;

  try {
    container.replaceChildren();
    await screen.render(container, params);
    if (token !== renderToken) return;
    applyTranslations(container);
  } catch (err) {
    console.error(`[router] ${name} screen mein galti`, err);
    if (token === renderToken) {
      showMessage({
        icon: '⚠️',
        title: t('errors.generic'),
        text: String(err && err.message ? err.message : err),   // testing ke baad hata dena
        onRetry: () => renderCurrent(),
      });
    }
    return;
  }

  if (focus) {
    window.scrollTo(0, 0);
    container.focus({ preventScroll: true });
  }
}

// ---------- Bahar se use hone wale functions ----------
export function navigate(path) {
  location.hash = `#/${path}`;
}

// Data badalne ke baad screen dobara banane ke liye
export function refresh() {
  return renderCurrent();
}

export function initRouter(el) {
  container = el;
  setupTabbar();
  window.addEventListener('hashchange', () => renderCurrent({ focus: true }));
  document.addEventListener('languagechange', () => renderCurrent());
  return renderCurrent();
}
