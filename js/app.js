// ==========================================================
// app.js
// App yahin se shuru hoti hai (index.html isi file ko chalata hai).
// Kaam: bhasha tayyar karo -> router chalao -> offline support lagao.
// Is file mein bas shuruaat ka code rakho, baaki sab apni file mein.
// ==========================================================

import { initI18n, nextLanguage, t } from './i18n.js';
import { initRouter } from './router.js';

// Browser tab ka title bhasha ke hisaab se
function updateTitle() {
  document.title = t('app.name');
}

// Offline chalane ke liye (sw.js file jab ban jaaye)
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('sw.js')
    .catch((err) => console.warn('[app] sw.js register nahi hui', err));
}

// Shuruaat mein hi kuch toot jaye to khaali screen ki jagah galti dikhao.
// (Yahan text seedha likha hai kyunki ho sakta hai bhasha ki file hi na khuli ho.)
function showFatalError(container, err) {
  const card = document.createElement('div');
  card.className = 'card';

  const msg = document.createElement('p');
  msg.textContent = 'App shuru nahi ho paayi. Page dobara kholein.';

  const detail = document.createElement('p');
  detail.className = 'muted';
  detail.textContent = String(err && err.message ? err.message : err);

  card.append(msg, detail);
  container.replaceChildren(card);
}

async function start() {
  const container = document.getElementById('app');
  try {
    document.addEventListener('languagechange', updateTitle);
    await initI18n();

    const langBtn = document.getElementById('lang-btn');
    if (langBtn) langBtn.addEventListener('click', () => nextLanguage());

    await initRouter(container);
    registerServiceWorker();
  } catch (err) {
    console.error('[app] start nahi hua', err);
    showFatalError(container, err);
  }
}

start();
