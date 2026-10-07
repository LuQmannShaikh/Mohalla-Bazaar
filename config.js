// ==========================================================
// config.js
// App ki saari settings ek jagah. Naam, bhasha, features on/off
// karne ke liye sirf yahi file badlo, baaki code ko chhue bina.
// ==========================================================

export const CONFIG = Object.freeze({
  // ---------- App ----------
  appName: 'Mohalla Bazaar',
  version: '0.1.0',
  storagePrefix: 'mohalla:',     // phone ki memory mein data ka naam-prefix
  currency: 'INR',
  defaultRoute: 'home',          // app khulne par pehli screen

  // ---------- Bhasha ----------
  // Nayi bhasha jodne ke 2 kadam:
  //   1) locales/<code>.json file banao (jaise locales/mr.json)
  //   2) neeche list mein ek line jodo
  defaultLang: 'hi',
  fallbackLang: 'en',            // jo text kisi bhasha mein na mile, wo yahan se aayega
  languages: [
    { code: 'hi', name: 'हिन्दी', locale: 'hi-IN' },
    { code: 'en', name: 'English', locale: 'en-IN' },
    // { code: 'mr', name: 'मराठी', locale: 'mr-IN' },   // mr.json banane ke baad // hata do
  ],

  // ---------- Look (user settings ke default) ----------
  defaultTheme: 'auto',          // 'auto' | 'light' | 'dark'
  defaultTextSize: 'normal',     // 'normal' | 'large' | 'xlarge'

  // ---------- Features on/off ----------
  features: {
    rates: true,                 // roz ke rate
    groups: true,                // padosiyon ke saath group order
    savings: true,               // bachat counter
    voiceHelp: true,             // speaker button (awaaz mein madad)
  },

  // ---------- Data kahan se aaye ----------
  // 'demo'     = data/demo-rates.json aur phone ki memory (abhi testing ke liye)
  // 'supabase' = asli online database (baad mein)
  dataSource: 'demo',

  // Sirf PUBLIC (anon) key yahan aa sakti hai. Koi secret key ya password
  // kabhi mat daalo, kyunki GitHub repo public hoti hai.
  supabase: {
    url: '',
    anonKey: '',
  },
});
