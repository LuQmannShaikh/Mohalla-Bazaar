// ==========================================================
// data.js
// Saman aur bhav ka data yahin se aata hai. Screens sirf in
// functions ko bulaati hain, unhe pata nahi data kahan se aaya.
// Baad mein Supabase jodna ho to sirf yahi file badlegi.
//
//   const items = await getItems();      // saman ki list (items.json)
//   const data  = await getRates();      // { area, updatedAt, rates: [...] }
//   addRateReport({ item, price, shop }) // user ka bataya bhav save karo
// ==========================================================

import { CONFIG } from './config.js';
import { load, update, newId } from './store.js';

const cache = {};

async function fetchJson(path) {
  if (cache[path]) return cache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} nahi mili (HTTP ${res.status})`);
  cache[path] = await res.json();
  return cache[path];
}

function warnIfNotDemo() {
  if (CONFIG.dataSource !== 'demo') {
    console.warn('[data] Supabase abhi jura nahi hai, demo data use ho raha hai');
  }
}

function isToday(isoText) {
  return new Date(isoText).toDateString() === new Date().toDateString();
}

// ---------- Saman ki list ----------
export async function getItems() {
  const file = await fetchJson('data/items.json');
  return file.items;
}

// ---------- Aaj ke bhav ----------
// Agar user ne aaj kisi saman ka bhav bataya hai, to wahi list mein dikhega
// (demo mein kam se kam apna kiya hua kaam dikhe, isliye).
export async function getRates() {
  warnIfNotDemo();
  const base = await fetchJson('data/demo-rates.json');
  const mine = load('reports', []).filter((r) => isToday(r.at));

  const rates = base.rates.map((rate) => {
    const last = [...mine].reverse().find((r) => r.item === rate.item);
    if (!last) return rate;
    return {
      ...rate,
      today: last.price,
      cheapest: Math.min(rate.cheapest, last.price),
    };
  });

  return {
    area: base.area,
    updatedAt: new Date(Date.now() - base.updated_minutes_ago * 60000),
    rates,
  };
}

// ---------- User ka bataya bhav save karna ----------
export function addRateReport({ item, price, shop = '' }) {
  const report = {
    id: newId('rate'),
    item,
    price: Number(price),
    shop: String(shop).slice(0, 60),    // dikhate waqt text ko escape zaroor karna
    at: new Date().toISOString(),
  };
  update('reports', (list) => [...list, report].slice(-200), []);
  return report;
}
