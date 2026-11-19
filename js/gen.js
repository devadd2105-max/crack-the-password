// Password generator. Uses the browser's cryptographic random source (never Math.random).
import { PASSPHRASE } from './data.js';
import { personalTokens, SCENARIOS, humanTime, levelFor } from './engine.js';

const cryptoSrc = () => (globalThis.crypto && globalThis.crypto.getRandomValues ? globalThis.crypto : null);

/** Unbiased random integer in [0, n). */
export function randomInt(n) {
  const c = cryptoSrc(); if (!c) throw new Error('No secure random source available');
  const limit = Math.floor(0x100000000 / n) * n; const buf = new Uint32Array(1);
  do { c.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % n;
}
const pick = (arr) => arr[randomInt(arr.length)];

const LOWER = 'abcdefghijkmnopqrstuvwxyz';      // no l
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';       // no I, O
const DIGIT = '23456789';                        // no 0, 1
const SYMBOL = '!@#$%^&*?-_+=';

function avoids(text, details) {
  const low = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return !personalTokens(details).some((t) => t.text.length >= 3 && low.includes(t.text));
}

/** Random characters. */
export function randomChars({ length = 16, symbols = true, details = null } = {}) {
  const sets = [LOWER, UPPER, DIGIT]; if (symbols) sets.push(SYMBOL);
  const pool = sets.join('');
  for (let tries = 0; tries < 200; tries++) {
    let s = ''; for (let i = 0; i < length; i++) s += pick(pool);
    if (sets.every((set) => [...s].some((ch) => set.includes(ch))) && avoids(s, details)) {
      return { text: s, bits: length * Math.log2(pool.length), style: 'random' };
    }
  }
  throw new Error('Could not generate');
}

/** Random words joined with hyphens. */
export function passphrase({ words = 8, extras = false, details = null } = {}) {
  for (let tries = 0; tries < 200; tries++) {
    const w = Array.from({ length: words }, () => pick(PASSPHRASE)).map((x) => x[0].toUpperCase() + x.slice(1));
    let text = w.join('-'); let bits = words * Math.log2(PASSPHRASE.length);
    if (extras) { text += '-' + (10 + randomInt(90)) + pick(SYMBOL); bits += Math.log2(90) + Math.log2(SYMBOL.length); }
    if (avoids(text, details)) return { text, bits, style: 'passphrase' };
  }
  throw new Error('Could not generate');
}

/** How a generated password stands up, from its known entropy (the attacker must try about half the space). */
export function describe(bits) {
  const guesses = Math.pow(2, bits);
  const times = {}; for (const s of SCENARIOS) times[s.id] = guesses / s.rate;
  return { bits, level: levelFor(bits), times, text: humanTime(times.offline_fast) };
}
