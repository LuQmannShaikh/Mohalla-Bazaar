// ==========================================================
// screens/home.js
// Home screen: namaste, 4 bade buttons aur "सुनें" button jo
// screen ki madad awaaz mein bolta hai (unpadh logon ke liye).
//
// Har screen ki file mein sirf ye ek function hona chahiye:
//   export function render(container, params) { ... }
// ==========================================================

import { CONFIG } from '../config.js';
import { t, getLanguage, getLanguages } from '../i18n.js';

// ---------- Awaaz mein bolna ----------
// Phone mein jo awaaz (voice) installed hai wahi bolegi. Android Chrome
// mein aam taur par Hindi aur English dono hoti hain.
function canSpeak() {
  return 'speechSynthesis' in window;
}

function speak(text) {
  const lang = getLanguages().find((l) => l.code === getLanguage());
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = lang ? lang.locale : 'hi-IN';
  voice.rate = 0.9;                     // thoda dheere, taaki samajhna aasaan ho
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(voice);

  // Dusri screen par jaate hi bolna band
  window.addEventListener('hashchange', () => window.speechSynthesis.cancel(), {
    once: true,
  });
}

// ---------- Screen banana ----------
export function render(container) {
  const f = CONFIG.features;

  // Naya button jodna ho to yahan ek line badhao
  const actions = [
    { href: '#/rates',     icon: '🏷️', key: 'home.action_rates',   show: f.rates },
    { href: '#/groups',    icon: '👥', key: 'home.action_groups',  show: f.groups },
    { href: '#/savings',   icon: '💰', key: 'home.action_savings', show: f.savings },
    { href: '#/rates/add', icon: '✏️', key: 'home.action_add_rate', show: f.rates },
  ].filter((a) => a.show);

  const actionsHtml = actions
    .map(
      (a) => `
      <a class="big-action" href="${a.href}">
        <span class="big-action__icon" aria-hidden="true">${a.icon}</span>
        <span>${t(a.key)}</span>
      </a>`
    )
    .join('');

  const showListen = f.voiceHelp && canSpeak();
  const listenHtml = showListen
    ? `<button class="btn btn--accent btn--block" type="button" data-speak>
         🔊 ${t('common.listen')}
       </button>`
    : '';

  container.innerHTML = `
    <section class="card">
      <h2 class="section-title">${t('home.greeting')} 👋</h2>
      <p>${t('home.question')}</p>
      ${listenHtml}
    </section>

    <section class="grid-2">${actionsHtml}</section>
  `;

  const listenBtn = container.querySelector('[data-speak]');
  if (listenBtn) {
    listenBtn.addEventListener('click', () => speak(t('home.help')));
  }
}
