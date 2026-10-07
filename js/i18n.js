// ==========================================================
// i18n.js
// Bhasha badalne ka system. Text kabhi code mein mat likho,
// hamesha t('home.title') jaisa key use karo. Asli text
// locales/hi.json, locales/en.json aadi mein rehta hai.
//
// Screens mein use:
//   t('rates.title')                      -> text
//   t('savings.total', { amount: 840 })   -> "Aapne {amount} bachaye"
//   money(1250)                           -> "₹1,250"
//   HTML mein: <span data-i18n="nav.home">Home</span>
//
// Bhasha badalne par document par 'languagechange' event aata hai,
// screens isse sun kar apne aap dobara ban jaati hain.
// ==========================================================

import { CONFIG } from './config.js';
import { load, save } from './store.js';

const dictionaries = {};          // { hi: {...}, en: {...} }
let current = CONFIG.defaultLang;

// ---------- Bhasha ki file load karna ----------
async function loadDictionary(code) {
  if (dictionaries[code]) return dictionaries[code];
  try {
    const res = await fetch(`locales/${code}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dictionaries[code] = await res.json();
    return dictionaries[code];
  } catch (err) {
    // File na mile ya net na ho to app band nahi hoti, fallback bhasha chalti hai
    console.warn(`[i18n] ${code}.json load nahi hui`, err);
    return {};
  }
}

// 'home.title' jaise key se nested text nikalna
function lookup(dict, key) {
  return key.split('.').reduce(
    (obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined),
    dict
  );
}

// ---------- Text lena ----------
export function t(key, vars = {}) {
  let text = lookup(dictionaries[current], key);
  if (typeof text !== 'string') text = lookup(dictionaries[CONFIG.fallbackLang], key);
  if (typeof text !== 'string') return key;       // kahin bhi na mile to key hi dikhegi
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? vars[name] : match
  );
}

// ---------- Paisa dikhana (₹1,250) ----------
export function money(amount) {
  return new Intl.NumberFormat(getLanguageInfo().locale, {
    style: 'currency',
    currency: CONFIG.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------- Bhasha ki jaankari ----------
export function getLanguage() {
  return current;
}

export function getLanguages() {
  return CONFIG.languages;
}

function getLanguageInfo() {
  return (
    CONFIG.languages.find((l) => l.code === current) || CONFIG.languages[0]
  );
}

// ---------- HTML ke data-i18n wale hisse badalna ----------
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = t(el.dataset.i18n);
    if (text !== el.dataset.i18n) el.textContent = text;   // key na mile to purana text rehne do
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const text = t(el.dataset.i18nPlaceholder);
    if (text !== el.dataset.i18nPlaceholder) el.placeholder = text;
  });
  root.querySelectorAll('[data-i18n-label]').forEach((el) => {
    const text = t(el.dataset.i18nLabel);
    if (text !== el.dataset.i18nLabel) el.setAttribute('aria-label', text);
  });
}

// Upar ke "🌐 हिन्दी" button ka text
function updateLangButton() {
  const btn = document.getElementById('lang-btn');
  if (!btn) return;
  btn.textContent = `🌐 ${getLanguageInfo().name}`;
  const label = t('lang.change');
  if (label !== 'lang.change') btn.setAttribute('aria-label', label);
}

// ---------- Bhasha badalna ----------
export async function setLanguage(code, { remember = true } = {}) {
  if (!CONFIG.languages.some((l) => l.code === code)) code = CONFIG.defaultLang;

  await Promise.all([
    loadDictionary(CONFIG.fallbackLang),
    loadDictionary(code),
  ]);

  current = code;
  if (remember) save('lang', code);

  document.documentElement.lang = code;
  applyTranslations();
  updateLangButton();
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { code } }));
}

// Button dabane par agli bhasha (hi -> en -> hi ...)
export function nextLanguage() {
  const codes = CONFIG.languages.map((l) => l.code);
  const next = codes[(codes.indexOf(current) + 1) % codes.length];
  return setLanguage(next);
}

// ---------- App shuru hone par ek baar ----------
export async function initI18n() {
  const saved = load('lang', null);
  await setLanguage(saved || CONFIG.defaultLang, { remember: false });
}
