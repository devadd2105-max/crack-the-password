// The Cracker: estimates how many guesses a password survives, in the style of zxcvbn.
// Pure functions, no DOM, so it can be tested in Node.
import { COMMON, WORDS, PASSPHRASE, KEYBOARD } from './data.js';
import BIG from './bigwords.js';

export const SCENARIOS = [
  { id: 'online_slow', name: 'Website login with lockouts', note: '100 guesses an hour', rate: 100 / 3600 },
  { id: 'online_fast', name: 'Website login, no limits', note: '10 guesses a second', rate: 10 },
  { id: 'offline_slow', name: 'Stolen database, slow hash (bcrypt)', note: '10,000 guesses a second', rate: 1e4 },
  { id: 'offline_fast', name: 'Stolen database, fast hash (MD5 on a GPU rig)', note: '10 billion guesses a second', rate: 1e10 },
];
export const HEADLINE_SCENARIO = 'offline_fast';
const MAX_LEN = 128;
const COMMON_SYMBOLS = '!@#$%^&*-_.?+= ,';

// ------------------------------------------------------------------ dictionaries
const DICT = new Map();
COMMON.forEach((w, i) => { if (!DICT.has(w)) DICT.set(w, { rank: i + 1, kind: 'common' }); });
[...WORDS, ...PASSPHRASE].forEach((w, i) => { if (!DICT.has(w)) DICT.set(w, { rank: 300 + i * 2, kind: 'word' }); });
// a full English dictionary: an attacker's list is ordered by popularity, ours by length (longer words are rarer)
for (const w of BIG.split('\n')) { if (w.length >= 3 && !DICT.has(w)) DICT.set(w, { rank: 4000 * (w.length - 2), kind: 'word' }); }
const MAX_WORD = Math.max(...[...DICT.keys()].map((k) => k.length));

const LEET_A = { '@': 'a', 4: 'a', 8: 'b', 3: 'e', 6: 'g', 9: 'g', 1: 'i', '!': 'i', '|': 'i', 0: 'o', $: 's', 5: 's', 7: 't', '+': 't', '(': 'c', 2: 'z' };
const LEET_B = { ...LEET_A, 1: 'l', '!': 'l', '|': 'l' };

function leetVariants(s) {
  const out = [{ str: s, subs: 0 }];
  for (const map of [LEET_A, LEET_B]) {
    let subs = 0; let str = '';
    for (const ch of s) { if (map[ch] !== undefined) { str += map[ch]; subs++; } else str += ch; }
    if (subs > 0 && !out.some((o) => o.str === str && o.subs === subs)) out.push({ str, subs });
  }
  return out;
}

const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
function caseMult(s) {
  const U = (s.match(/[A-Z]/g) || []).length; const L = (s.match(/[a-z]/g) || []).length;
  if (U === 0) return 1;
  if (/^[A-Z][^A-Z]+$/.test(s) || /^[^a-z]*[A-Z]+[^a-z]*$/.test(s) && L === 0 || /^[^A-Z]+[A-Z]$/.test(s)) return 2;
  let sum = 0; for (let k = 1; k <= Math.min(U, L); k++) sum += binom(U + L, k);
  return Math.max(2, sum);
}

// ------------------------------------------------------------------ personal details
const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** The things a stranger can read off your social media: names, pets, teams, dates. */
export function personalTokens(d) {
  if (!d) return [];
  const out = []; const seen = new Set();
  const add = (text, label) => { text = clean(text); if (text.length < 3 || seen.has(text)) return; seen.add(text); out.push({ text, label }); };
  const addText = (value, label) => {
    const raw = String(value || '').trim(); if (!raw) return;
    const parts = raw.split(/[\s,.\-_/]+/).filter(Boolean);
    add(raw, label);
    parts.forEach((p) => add(p, label));
    if (parts.length > 1) add(parts.map((p) => p[0]).join(''), label + ' (initials)');
    for (const p of parts) { const c = clean(p); if (c.length >= 6) { add(c.slice(0, 3), label + ' (short form)'); add(c.slice(0, 4), label + ' (short form)'); } }
  };
  addText(d.nick, 'your nickname');
  addText(d.first, 'your first name');
  addText(d.last, 'your family name');
  addText(d.pet, "your pet's name");
  addText(d.team, 'your favourite team');
  addText(d.school, 'your school or CCA');
  addText(d.hobby, 'your hobby');
  addText(d.other, 'a word that matters to you');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.birth || '');
  if (m) {
    const [, y, mo, da] = m; const yy = y.slice(2); const dn = String(+da); const mn = String(+mo);
    const mname = MONTHS[+mo - 1] || '';
    [y, da + mo, mo + da, dn + mn, da + mo + y, da + mo + yy, mo + da + y, mo + da + yy, dn + mn + y, dn + mn + yy, y + mo + da, yy + mo + da, da + mo + y.slice(2)]
      .forEach((t) => add(t, 'your birthday'));
    if (mname) { add(da + mname.slice(0, 3), 'your birthday'); add(mname.slice(0, 3) + y, 'your birthday'); add(mname, 'your birth month'); }
  }
  return out;
}

// ------------------------------------------------------------------ matchers
function cardinality(s) {
  let c = 0;
  if (/[a-z]/.test(s)) c += 26; if (/[A-Z]/.test(s)) c += 26; if (/[0-9]/.test(s)) c += 10;
  if (/[ -/:-@[-`{-~]/.test(s)) c += 33; if (/[^\x00-\x7f]/.test(s)) c += 100;
  return c || 10;
}
// an attacker who must brute force part of a password searches the whole character set it uses
let CARD = 10;
const brute = (s) => Math.pow(CARD, s.length);

function findMatches(pw, personalMap) {
  const n = pw.length; const lower = pw.toLowerCase(); const M = [];
  const maxLen = Math.max(MAX_WORD, ...(personalMap ? [...personalMap.keys()].map((k) => k.length) : [0]));

  // dictionary, personal and leetspeak
  for (let i = 0; i < n; i++) {
    for (let j = i + 3; j <= Math.min(n, i + maxLen); j++) {
      const sub = lower.slice(i, j); const orig = pw.slice(i, j);
      for (const v of leetVariants(sub)) {
        const lm = v.subs ? Math.max(2, Math.pow(2, v.subs)) : 1; const cm = caseMult(orig);
        const p = personalMap && personalMap.get(v.str);
        if (p) M.push({ i, j, type: 'personal', token: v.str, label: p.label, guesses: p.rank * cm * lm, subs: v.subs });
        const d = DICT.get(v.str);
        if (d) M.push({ i, j, type: d.kind, token: v.str, guesses: d.rank * cm * lm, subs: v.subs });
      }
    }
  }
  // dates and years
  for (const m of pw.matchAll(/\d{4,8}/g)) {
    for (let a = m.index; a < m.index + m[0].length; a++) for (let b = a + 4; b <= Math.min(m.index + m[0].length, a + 8); b++) {
      const s = pw.slice(a, b);
      if (b - a === 4) {
        if (+s >= 1900 && +s <= 2039) M.push({ i: a, j: b, type: 'year', token: s, guesses: 120 });
        else if (validDM(s.slice(0, 2), s.slice(2)) || validDM(s.slice(2), s.slice(0, 2))) M.push({ i: a, j: b, type: 'date', token: s, guesses: 400 });
      } else if (b - a === 6 || b - a === 8) {
        if (looksLikeDate(s)) M.push({ i: a, j: b, type: 'date', token: s, guesses: 365 * 110 });
      }
    }
  }
  // sequences: abc, 4321, ghi
  for (let i = 0; i < n - 2; i++) {
    const delta = pw.charCodeAt(i + 1) - pw.charCodeAt(i);
    if (Math.abs(delta) !== 1) continue;
    let j = i + 1; while (j < n && pw.charCodeAt(j) - pw.charCodeAt(j - 1) === delta) j++;
    for (let a = i; a < j; a++) for (let b = a + 3; b <= j; b++) {
      const s = pw.slice(a, b); const first = s[0];
      const base = /[aAzZ019]/.test(first) ? 4 : /\d/.test(first) ? 10 : 26;
      M.push({ i: a, j: b, type: 'sequence', token: s, guesses: base * (b - a) * (delta < 0 ? 2 : 1) });
    }
    i = j - 2;
  }
  // keyboard walks
  for (const row of KEYBOARD) for (const dir of [row, [...row].reverse().join('')]) {
    for (let a = 0; a <= dir.length - 4; a++) for (let b = a + 4; b <= dir.length; b++) {
      const s = dir.slice(a, b); let at = lower.indexOf(s);
      while (at !== -1) { M.push({ i: at, j: at + s.length, type: 'keyboard', token: s, guesses: 90 * s.length * (dir === row ? 1 : 2) }); at = lower.indexOf(s, at + 1); }
    }
  }
  // repeats: aaaa, abcabc
  for (let i = 0; i < n; i++) for (let u = 1; u <= 6 && i + u * 2 <= n; u++) {
    const unit = pw.slice(i, i + u); let k = 1;
    while (pw.slice(i + k * u, i + (k + 1) * u) === unit) k++;
    if (k >= 2 && u * k >= 3) M.push({ i, j: i + u * k, type: 'repeat', token: unit, count: k, guesses: Math.min(brute(unit), 10000) * k });
  }
  return M;
}
function validDM(a, b) { const d = +a, m = +b; return d >= 1 && d <= 31 && m >= 1 && m <= 12; }
function looksLikeDate(s) {
  const t = s.length === 6 ? [[s.slice(0, 2), s.slice(2, 4), s.slice(4)], [s.slice(0, 2), s.slice(2, 4), s.slice(4)]] : [[s.slice(0, 2), s.slice(2, 4), s.slice(4)], [s.slice(0, 4), s.slice(4, 6), s.slice(6)]];
  const ok = (d, m) => validDM(d, m);
  if (s.length === 6) return ok(s.slice(0, 2), s.slice(2, 4)) || ok(s.slice(2, 4), s.slice(0, 2)) || ok(s.slice(4), s.slice(2, 4)) && true;
  const y1 = +s.slice(4); const y2 = +s.slice(0, 4);
  return ((y1 >= 1900 && y1 <= 2039) && (ok(s.slice(0, 2), s.slice(2, 4)) || ok(s.slice(2, 4), s.slice(0, 2)))) || ((y2 >= 1900 && y2 <= 2039) && (ok(s.slice(4, 6), s.slice(6)) || ok(s.slice(6), s.slice(4, 6))));
}

// ------------------------------------------------------------------ the search for the cheapest way to guess it
function cheapest(pw, personalMap) {
  const n = pw.length; CARD = cardinality(pw);
  const byEnd = Array.from({ length: n + 1 }, () => []);
  for (const m of findMatches(pw, personalMap)) byEnd[m.j].push(m);
  // every stretch can also be brute forced
  for (let j = 1; j <= n; j++) for (let i = 0; i < j; i++) {
    const s = pw.slice(i, j);
    // a lone common symbol (a separator between words, a trailing !) is among the first things tried
    const common = j - i === 1 && COMMON_SYMBOLS.includes(s);
    byEnd[j].push({ i, j, type: 'brute', token: s, guesses: common ? 12 : brute(s) });
  }
  // opt[k][l] = cheapest product of guesses to cover the first k characters with exactly l pieces
  const opt = Array.from({ length: n + 1 }, () => new Map()); opt[0].set(0, { cost: 1 });
  for (let k = 1; k <= n; k++) {
    for (const m of byEnd[k]) {
      for (const [l, prev] of opt[m.i]) {
        const cost = prev.cost * m.guesses; const cur = opt[k].get(l + 1);
        if (!cur || cost < cur.cost) opt[k].set(l + 1, { cost, m, from: l });
      }
    }
  }
  let best = null;
  for (const [l, e] of opt[n]) {
    const total = e.cost;
    if (!best || total < best.total) best = { total, l };
  }
  const segs = []; let k = n; let l = best.l;
  while (k > 0) { const e = opt[k].get(l); segs.unshift(e.m); k = e.m.i; l = e.from; }
  return { guesses: Math.max(1, best.total), segs };
}

// ------------------------------------------------------------------ public API
export function theoreticalBits(pw) { return pw.length ? pw.length * Math.log2(cardinality(pw)) : 0; }

function personalMapFrom(details) {
  const toks = personalTokens(details); if (!toks.length) return null;
  const m = new Map(); toks.forEach((t, i) => { if (!m.has(t.text)) m.set(t.text, { rank: i + 1, label: t.label }); });
  return m;
}

export function analyze(password, details = null) {
  const pw = String(password || '').slice(0, MAX_LEN);
  if (!pw) return { empty: true };
  const pm = personalMapFrom(details);
  const stranger = cheapest(pw, null);
  const knows = pm ? cheapest(pw, pm) : stranger;
  const times = {}; for (const s of SCENARIOS) times[s.id] = { stranger: stranger.guesses / s.rate, knows: knows.guesses / s.rate };
  const bits = Math.log2(knows.guesses);
  return {
    empty: false, length: pw.length, truncated: String(password).length > MAX_LEN,
    guesses: { stranger: stranger.guesses, knows: knows.guesses },
    times, bits, strangerBits: Math.log2(stranger.guesses), theoretical: theoreticalBits(pw),
    level: levelFor(bits), segments: knows.segs, usedPersonal: knows.segs.some((s) => s.type === 'personal'),
    reasons: reasons(pw, knows.segs, stranger.guesses, knows.guesses), tips: tips(pw, knows.segs, bits),
  };
}

export const LEVELS = [
  { id: 'veryweak', name: 'Very weak', max: 28 }, { id: 'weak', name: 'Weak', max: 36 }, { id: 'fair', name: 'Fair', max: 50 },
  { id: 'good', name: 'Good', max: 64 }, { id: 'strong', name: 'Strong', max: 80 }, { id: 'excellent', name: 'Excellent', max: Infinity },
];
export const levelFor = (bits) => LEVELS.find((l) => bits < l.max);

export function humanTime(sec) {
  const y = sec / 31557600;
  const f = (n, unit) => { const r = n < 10 ? Math.round(n * 10) / 10 : Math.round(n); return `${r} ${unit}${r === 1 ? '' : 's'}`; };
  if (sec < 0.001) return 'instantly';
  if (sec < 1) return 'less than a second';
  if (sec < 60) return f(sec, 'second');
  if (sec < 3600) return f(sec / 60, 'minute');
  if (sec < 86400) return f(sec / 3600, 'hour');
  if (sec < 86400 * 31) return f(sec / 86400, 'day');
  if (y < 1) return f(sec / 2629800, 'month');
  if (y < 100) return f(y, 'year');
  if (y < 1000) return f(y / 100, 'century').replace('centurys', 'centuries');
  if (y < 1e6) return f(y / 1000, 'thousand year');
  if (y < 1e9) return f(y / 1e6, 'million year');
  if (y < 1.38e10) return f(y / 1e9, 'billion year');
  return 'longer than the universe has existed';
}
export function timeClass(sec) {
  if (sec < 60) return 'instant'; if (sec < 86400 * 31) return 'quick'; if (sec < 31557600 * 5) return 'slow'; return 'safe';
}

// ------------------------------------------------------------------ explanations
const TYPE_TITLE = {
  personal: 'About you', common: 'Common password', word: 'Ordinary word', year: 'Year', date: 'Date',
  sequence: 'Sequence', keyboard: 'Keyboard walk', repeat: 'Repeat', brute: 'Brute force',
};
export const typeTitle = (t) => TYPE_TITLE[t] || t;

function reasons(pw, segs, stranger, knows) {
  const out = [];
  for (const s of segs) {
    const shown = pw.slice(s.i, s.j);
    if (s.type === 'personal') out.push({ type: 'personal', text: `“${shown}” is ${s.label}. Anyone who has seen your profile tries it in the first ${Math.round(s.guesses).toLocaleString('en')} guesses.` });
    else if (s.type === 'common') out.push({ type: 'common', text: `“${shown}” is on every cracker’s list of most-used passwords.` });
    else if (s.type === 'word') out.push({ type: 'word', text: `“${shown}” is an ordinary word. Dictionary attacks go through these first.` });
    else if (s.type === 'year') out.push({ type: 'pattern', text: `“${shown}” looks like a year. There are only about 140 to try.` });
    else if (s.type === 'date') out.push({ type: 'pattern', text: `“${shown}” looks like a date. Fewer than 40,000 dates exist, so every one is tried.` });
    else if (s.type === 'sequence') out.push({ type: 'pattern', text: `“${shown}” is a run of neighbouring characters, an old favourite.` });
    else if (s.type === 'keyboard') out.push({ type: 'pattern', text: `“${shown}” is a walk along the keyboard. These are in the first few hundred guesses.` });
    else if (s.type === 'repeat') out.push({ type: 'pattern', text: `“${shown}” repeats “${s.token}”, so it adds almost no strength.` });
    if (s.subs) out.push({ type: 'leet', text: `Swapping symbols for letters in “${shown}” (like @ for a, 0 for o) is a trick every cracker already knows.` });
  }
  const bruteSegs = segs.filter((s) => s.type === 'brute');
  if (bruteSegs.length) out.push({ type: 'brute', text: `Only ${bruteSegs.map((s) => `“${pw.slice(s.i, s.j)}”`).join(', ')} has to be guessed blindly, and that is where all of your real strength comes from.` });
  if (knows < stranger / 100) out.push({ type: 'personal', text: `Your own details cut the attacker’s work by a factor of about ${Math.round(stranger / knows).toLocaleString('en')}.` });
  return out;
}

function tips(pw, segs, bits) {
  const t = [];
  if (segs.some((s) => s.type === 'personal')) t.push('Never build a password out of your name, pet, team or birthday. Those are the first things an attacker looks up.');
  if (pw.length < 12) t.push(`Make it longer. Every extra character multiplies the attacker’s work by around 70, and yours has ${pw.length}.`);
  if (segs.some((s) => ['common', 'word'].includes(s.type)) && bits < 64) t.push('Swapping letters for symbols (a to @) barely helps. Use several unrelated random words instead.');
  if (segs.some((s) => ['year', 'date', 'sequence', 'keyboard', 'repeat'].includes(s.type))) t.push('Patterns like years, 123 or qwerty are guessed in the first moments. Randomness beats cleverness.');
  if (bits >= 64 && !t.length) t.push('This would hold up well. Use a different password for every account, and a password manager to remember them.');
  if (bits < 64) t.push('Try one of the generated passwords below, then paste it in here to see how it scores.');
  return t.slice(0, 4);
}
