// ==========================================================
// screens/rates.js
// Rate screen. Teen roop:
//   #/rates         -> bhav ki list (search + category chips)
//   #/rates/add     -> "भाव बताएँ" form   (#/rates/add/atta = atta pehle se chuna)
//   #/rates/thanks  -> list, upar "धन्यवाद" ke saath
// ==========================================================

import { CONFIG } from '../config.js';
import { t, money, getLanguage, getLanguages } from '../i18n.js';
import { navigate } from '../router.js';
import { getItems, getRates, addRateReport } from '../data.js';

// ---------- Chhote helpers ----------
function currentLocale() {
  const lang = getLanguages().find((l) => l.code === getLanguage());
  return lang ? lang.locale : 'hi-IN';
}

// User ya database se aaya text HTML mein daalne se pehle isse guzaro
function esc(text) {
  return String(text).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function timeAgo(date) {
  const rtf = new Intl.RelativeTimeFormat(currentLocale(), { numeric: 'auto' });
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

// (Home screen jaisa hi. Groups screen banate waqt dono ko ek shared file mein le jayenge.)
function speak(text) {
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = currentLocale();
  voice.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(voice);
  window.addEventListener('hashchange', () => window.speechSynthesis.cancel(), { once: true });
}

// ---------- Bhav ki ek line ----------
function trendHtml(today, yesterday) {
  const diff = today - yesterday;
  if (diff > 0) return `<span class="trend trend--up">▲ ${money(diff)} ${t('rates.up')}</span>`;
  if (diff < 0) return `<span class="trend trend--down">▼ ${money(-diff)} ${t('rates.down')}</span>`;
  return `<span class="trend">${t('rates.same')}</span>`;
}

function rowHtml(item, rate) {
  const unit = t(`units.${item.unit}`);
  return `
    <li class="rate-row">
      <span class="rate-row__icon" aria-hidden="true">${item.icon}</span>
      <div>
        <div class="rate-row__name">${t(`items.${item.id}`)}</div>
        <div class="rate-row__unit">
          ${t('rates.per', { unit })} · ${t('groups.price_each', { price: money(rate.group) })}
        </div>
      </div>
      <div class="rate-row__price">
        ${money(rate.today)}<br>${trendHtml(rate.today, rate.yesterday)}
      </div>
    </li>`;
}

// ---------- Bhav ki list ----------
function renderList(container, items, data, showThanks) {
  const state = { category: 'all', query: '' };
  const rateOf = new Map(data.rates.map((r) => [r.item, r]));
  const categories = ['all', ...new Set(items.map((i) => i.category))];

  const canListen = CONFIG.features.voiceHelp && 'speechSynthesis' in window;

  container.innerHTML = `
    ${showThanks ? `<section class="card"><h3 class="section-title">✅ ${t('rates.thanks')}</h3></section>` : ''}

    <section class="card">
      <h2 class="section-title">${t('rates.title')}</h2>
      <p class="muted">
        ${t('rates.area', { area: esc(data.area) })} · ${t('rates.updated', { when: timeAgo(data.updatedAt) })}
      </p>
      ${canListen ? `<button class="btn btn--accent btn--block" type="button" data-speak>🔊 ${t('common.listen')}</button>` : ''}
      <input class="field__input" type="search" data-search
             placeholder="${t('rates.search_placeholder')}" aria-label="${t('common.search')}">
      <div class="chips" data-chips>
        ${categories.map((c) => `
          <button class="chip" type="button" data-cat="${c}" aria-pressed="false">${t(`categories.${c}`)}</button>`).join('')}
      </div>
    </section>

    <section class="card"><ul class="rate-list" data-list></ul></section>

    <a class="btn btn--block" href="#/rates/add">✏️ ${t('rates.add_title')}</a>
  `;

  const listEl = container.querySelector('[data-list]');
  const chipsEl = container.querySelector('[data-chips]');

  // Sirf list dobara banti hai, taaki search ka keyboard band na ho
  function draw() {
    const query = state.query.trim().toLowerCase();
    const rows = items.filter((i) =>
      rateOf.has(i.id) &&
      (state.category === 'all' || i.category === state.category) &&
      t(`items.${i.id}`).toLowerCase().includes(query)
    );

    listEl.innerHTML = rows.length
      ? rows.map((i) => rowHtml(i, rateOf.get(i.id))).join('')
      : `<li class="empty"><div class="empty__icon" aria-hidden="true">🔎</div><p>${t('rates.empty')}</p></li>`;

    chipsEl.querySelectorAll('.chip').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.category));
    });
  }

  chipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.category = chip.dataset.cat;
    draw();
  });

  container.querySelector('[data-search]').addEventListener('input', (e) => {
    state.query = e.target.value;
    draw();
  });

  const listenBtn = container.querySelector('[data-speak]');
  if (listenBtn) listenBtn.addEventListener('click', () => speak(t('rates.help')));

  draw();
}

// ---------- "भाव बताएँ" form ----------
function renderAddForm(container, items, preselect) {
  const options = items
    .map((i) => `<option value="${i.id}"${i.id === preselect ? ' selected' : ''}>${i.icon} ${t(`items.${i.id}`)}</option>`)
    .join('');

  container.innerHTML = `
    <form class="card" data-form novalidate>
      <h2 class="section-title">${t('rates.add_title')}</h2>

      <label class="field">
        <span class="field__label">${t('rates.item')}</span>
        <select class="field__input" name="product">${options}</select>
      </label>

      <label class="field">
        <span class="field__label">${t('rates.price')}</span>
        <input class="field__input" name="price" type="number" inputmode="decimal" min="0" step="any">
      </label>

      <label class="field">
        <span class="field__label">${t('rates.shop')}</span>
        <input class="field__input" name="shop" type="text" maxlength="60" autocomplete="off">
      </label>

      <p class="trend trend--up" data-error hidden></p>

      <button class="btn btn--block" type="submit">${t('common.save')}</button>
      <a class="btn btn--ghost btn--block" href="#/rates">${t('common.cancel')}</a>
    </form>
  `;

  const form = container.querySelector('[data-form]');
  const errorEl = container.querySelector('[data-error]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = new FormData(form);
    const price = Number(values.get('price'));

    if (!(price > 0)) {
      errorEl.textContent = t('errors.price_invalid');
      errorEl.hidden = false;
      form.querySelector('[name="price"]').focus();
      return;
    }

    addRateReport({
      item: values.get('product'),
      price,
      shop: String(values.get('shop') || '').trim(),
    });
    navigate('rates/thanks');
  });
}

// ---------- Router yahin se bulata hai ----------
export async function render(container, params) {
  const [items, data] = await Promise.all([getItems(), getRates()]);

  if (params[0] === 'add') renderAddForm(container, items, params[1]);
  else renderList(container, items, data, params[0] === 'thanks');
}
