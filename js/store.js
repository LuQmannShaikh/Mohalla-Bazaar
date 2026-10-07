// ==========================================================
// store.js
// Data save aur load karne ki ek hi jagah. Abhi data phone ki
// memory (localStorage) mein jaata hai. Baad mein Supabase jodna
// ho to sirf yahi file badlegi, screens ko pata bhi nahi chalega.
//
// Use:
//   save('settings', { textSize: 'large' });
//   const s = load('settings', {});          // na mile to {} milega
//   update('savings', (list) => [...list, item], []);
//   remove('settings');
//   const id = newId('order');               // "order_lq3k9x_4f2a"
// ==========================================================

import { CONFIG } from './config.js';

const memory = new Map();   // localStorage band ho (private mode) to yahan rakhenge
let useMemory = false;

function fullKey(key) {
  return CONFIG.storagePrefix + key;
}

// ---------- Padhna ----------
export function load(key, fallback = null) {
  const k = fullKey(key);

  if (!useMemory) {
    try {
      const raw = localStorage.getItem(k);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;               // kharab data mila to app na toote
      }
    } catch (err) {
      console.warn('[store] localStorage nahi chal raha, memory use hogi', err);
      useMemory = true;
    }
  }

  return memory.has(k) ? memory.get(k) : fallback;
}

// ---------- Likhna ----------
// true = phone mein pakka save hua, false = sirf is session mein bacha
export function save(key, value) {
  const k = fullKey(key);

  if (!useMemory) {
    try {
      localStorage.setItem(k, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[store] save nahi hua, memory use hogi', err);
      useMemory = true;
    }
  }

  memory.set(k, value);
  return false;
}

// ---------- Badalna: purana padho, naya banao, save karo ----------
export function update(key, fn, fallback = null) {
  const next = fn(load(key, fallback));
  save(key, next);
  return next;
}

// ---------- Hatana ----------
export function remove(key) {
  const k = fullKey(key);
  memory.delete(k);
  try {
    localStorage.removeItem(k);
  } catch {
    /* kuch nahi karna */
  }
}

// Sirf is app ka saara data mitao (settings ke "Reset" button ke liye)
export function clearAll() {
  memory.clear();
  try {
    const mine = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CONFIG.storagePrefix)) mine.push(k);
    }
    mine.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* kuch nahi karna */
  }
}

// ---------- Nayi unique id ----------
export function newId(prefix = 'id') {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${time}_${rand}`;
}
