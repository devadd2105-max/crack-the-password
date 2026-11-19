import { analyze, personalTokens, humanTime, timeClass, typeTitle, SCENARIOS, HEADLINE_SCENARIO, levelFor } from './engine.js';
import { passphrase, randomChars, describe } from './gen.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const LEVEL_COLOR = { veryweak: 'var(--alarm)', weak: 'var(--orange)', fair: 'var(--amber)', good: 'var(--lime)', strong: 'var(--safe)', excellent: 'var(--deep)' };

const pwInput = $('#password');
const form = $('#details');

function details() {
  const d = {}; for (const f of new FormData(form).keys()) d[f] = form.elements[f].value.trim();
  return d;
}
const hasDetails = (d) => Object.values(d).some(Boolean);

// ------------------------------------------------------------------ number formatting
const UNITS = [[1e15, 'quadrillion'], [1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
function compact(n) {
  if (n < 1000) return String(Math.max(1, Math.round(n)));
  if (n >= 1e18) return '10^' + Math.floor(Math.log10(n));
  for (const [v, name] of UNITS) if (n >= v) { const x = n / v; return `${x < 10 ? Math.round(x * 10) / 10 : Math.round(x)} ${name}`; }
  return String(Math.round(n));
}

// ------------------------------------------------------------------ the checker
let announceT = 0;
function update() {
  const pw = pwInput.value; const d = details();
  const a = analyze(pw, hasDetails(d) ? d : null);
  const block = $('#meter-block');

  if (a.empty) {
    block.dataset.level = 'none'; $('#bits').textContent = '0'; $('#level').textContent = 'Waiting for a password';
    $('#fill').style.width = '0'; $('#meter').setAttribute('aria-valuenow', '0'); $('#theory').style.visibility = 'hidden';
    const v = $('#verdict'); v.dataset.state = 'none';
    $('#v-kicker').textContent = 'The Cracker is waiting'; $('#v-head').textContent = 'Type a password to start.';
    $('#v-sub').textContent = 'The attack is a stolen database protected by a fast hash. That is how most real passwords are lost.';
    for (const id of ['parts-card', 'times-card', 'found-card']) $('#' + id).hidden = true;
    return;
  }

  // entropy meter
  block.dataset.level = a.level.id;
  $('#bits').textContent = String(Math.round(a.bits));
  $('#level').textContent = a.level.name;
  $('#fill').style.width = Math.min(100, a.bits) + '%';
  $('#meter').setAttribute('aria-valuenow', String(Math.min(100, Math.round(a.bits))));
  const th = $('#theory'); th.style.visibility = 'visible'; th.style.left = Math.min(100, a.theoretical) + '%';
  th.classList.toggle('flip', a.theoretical > 78); $('#theory-bits').textContent = Math.round(a.theoretical) + ' bits';

  // verdict
  const sc = SCENARIOS.find((s) => s.id === HEADLINE_SCENARIO);
  const secs = a.times[HEADLINE_SCENARIO].knows; const cls = timeClass(secs); const t = humanTime(secs);
  const v = $('#verdict'); v.dataset.state = cls;
  let head;
  if (cls === 'safe') head = t.startsWith('longer') ? `Safe for ${t}` : `Would take ${t}`;
  else head = t === 'instantly' ? 'Cracked instantly' : `Cracked in ${t}`;
  $('#v-kicker').textContent = cls === 'safe' ? 'The Cracker gives up' : 'The Cracker gets in';
  $('#v-head').textContent = head;
  const who = a.usedPersonal ? 'by someone who knows you' : (hasDetails(d) ? 'by someone who knows you (your details did not help them here)' : 'by a stranger');
  let sub = `${sc.name}, ${who}.`;
  if (a.usedPersonal) sub += ` A stranger would need ${humanTime(a.times[HEADLINE_SCENARIO].stranger)}. Your own details cut that down.`;
  if (a.truncated) sub += ' Only the first 128 characters were checked.';
  $('#v-sub').textContent = sub;
  clearTimeout(announceT);
  announceT = setTimeout(() => { $('#status').textContent = `${a.level.name}, ${Math.round(a.bits)} bits. ${head}.`; }, 700);

  // the password, taken apart (adjacent brute-force pieces read as one)
  const parts = $('#parts'); parts.replaceChildren();
  const merged = [];
  for (const s of a.segments) {
    const last = merged[merged.length - 1];
    if (s.type === 'brute' && last && last.type === 'brute') { last.j = s.j; last.guesses *= s.guesses; } else merged.push({ ...s });
  }
  for (const s of merged) {
    const p = el('div', 'part'); p.dataset.type = s.type;
    p.append(el('div', 'tok', pwInput.value.slice(s.i, s.j)));
    const cap = el('div', 'cap', s.type === 'personal' ? s.label.replace(/^your /, 'Your ') : typeTitle(s.type));
    cap.append(el('small', null, `≈ ${compact(s.guesses)} guess${s.guesses < 1.5 ? '' : 'es'}`));
    p.append(cap); parts.append(p);
  }

  // times
  const tb = $('#times'); tb.replaceChildren();
  $('#times-card').classList.toggle('nopersonal', !hasDetails(d));
  for (const s of SCENARIOS) {
    const tr = el('tr'); const n = el('td', null, s.name); n.append(el('small', null, s.note)); tr.append(n);
    for (const k of ['stranger', 'knows']) { const sec = a.times[s.id][k]; const td = el('td', 't', humanTime(sec)); td.dataset.c = timeClass(sec); if (k === 'knows' && !hasDetails(d)) td.className = 't hide'; tr.append(td); }
    tb.append(tr);
  }

  // reasons and tips
  const r = $('#reasons'); r.replaceChildren(); for (const x of a.reasons) { const li = el('li', null, x.text); li.dataset.t = x.type; r.append(li); }
  const tp = $('#tips'); tp.replaceChildren(); for (const x of a.tips) tp.append(el('li', null, x));
  for (const id of ['parts-card', 'times-card', 'found-card']) $('#' + id).hidden = false;
}

// ------------------------------------------------------------------ generator
const gen = { phrase: null, chars: null };
function showGenerated(kind) {
  const g = gen[kind]; const d = describe(g.bits);
  $('#out-' + kind).textContent = g.text;
  const bar = $('#gm-' + kind); bar.style.width = Math.min(100, g.bits) + '%'; bar.style.background = LEVEL_COLOR[d.level.id];
  $('#gl-' + kind).textContent = `${Math.round(g.bits)} bits · ${d.level.name} · cracking it would take ${d.text}, even from a stolen database.`;
}
function makePhrase() {
  const d = details(); gen.phrase = passphrase({ words: +$('#words').value, extras: $('#extras').checked, details: hasDetails(d) ? d : null });
  $('#wcount').textContent = $('#words').value; showGenerated('phrase');
}
function makeChars() {
  const d = details(); gen.chars = randomChars({ length: +$('#length').value, symbols: $('#symbols').checked, details: hasDetails(d) ? d : null });
  $('#lcount').textContent = $('#length').value; showGenerated('chars');
}

async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch (_) {
    const ta = el('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
    try { document.execCommand('copy'); } catch (_e) { /* nothing more to try */ } ta.remove();
  }
  const old = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = old; }, 1300);
}
function testIt(text) { pwInput.value = text; update(); pwInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); pwInput.focus(); }

// ------------------------------------------------------------------ wiring
pwInput.addEventListener('input', update);
form.addEventListener('input', () => { update(); });
form.addEventListener('change', () => { makePhrase(); makeChars(); });
for (const b of document.querySelectorAll('.samples .chip')) b.addEventListener('click', () => { pwInput.value = b.dataset.pw; update(); pwInput.focus(); });
$('#toggle').addEventListener('click', (e) => {
  const hidden = pwInput.type === 'password'; pwInput.type = hidden ? 'text' : 'password';
  e.currentTarget.textContent = hidden ? 'Hide' : 'Show'; e.currentTarget.setAttribute('aria-pressed', String(!hidden));
});
$('#example').addEventListener('click', () => {
  const ex = { first: 'Aiden', nick: 'Ace', last: 'Tan', birth: '2008-03-14', pet: 'Mochi', school: 'SAJC', team: 'Liverpool', hobby: 'Minecraft', other: 'Sentosa' };
  for (const [k, v] of Object.entries(ex)) form.elements[k].value = v;
  update(); makePhrase(); makeChars();
});
$('#clear').addEventListener('click', () => { form.reset(); update(); makePhrase(); makeChars(); });
$('#new-phrase').addEventListener('click', makePhrase); $('#new-chars').addEventListener('click', makeChars);
$('#words').addEventListener('input', makePhrase); $('#extras').addEventListener('change', makePhrase);
$('#length').addEventListener('input', makeChars); $('#symbols').addEventListener('change', makeChars);
$('#copy-phrase').addEventListener('click', (e) => copy(gen.phrase.text, e.currentTarget));
$('#copy-chars').addEventListener('click', (e) => copy(gen.chars.text, e.currentTarget));
$('#test-phrase').addEventListener('click', () => testIt(gen.phrase.text));
$('#test-chars').addEventListener('click', () => testIt(gen.chars.text));
$('#copy-code').addEventListener('click', (e) => copy($('#code').textContent, e.currentTarget));

// ------------------------------------------------------------------ the explainers use the real engine
function demoRow(code, a) {
  const row = el('div', 'demo-row'); row.append(el('code', null, code));
  row.append(el('span', 'r', `${humanTime(a.times[HEADLINE_SCENARIO].knows)}`));
  return row;
}
function fillExplainers() {
  const gap = $('#demo-gap');
  for (const pw of ['Password1!', 'Summer2008#', 'x7!Kp']) {
    const a = analyze(pw); const row = el('div', 'demo-row'); row.append(el('code', null, pw)); row.append(el('span', 'r', `looks like ${Math.round(a.theoretical)} bits, really ${Math.round(a.bits)}`));
    gap.append(row);
  }
  gap.append(el('p', null, 'The first two look strong to a form that counts letters, numbers and symbols. The Cracker sees a common word with a pattern stuck on. The third is short but truly random, so it scores what it looks like.'));
  const len = $('#demo-length');
  for (const pw of ['P@ssw0rd!', 'Zq7#mV2!', 'purple-elephant-sings-quietly']) {
    const a = analyze(pw); const row = demoRow(pw, a);
    row.append(el('span', 'm', `${pw.length} characters · ${Math.round(a.bits)} bits`)); len.append(row);
  }
  const sp = $('#speeds');
  for (const s of SCENARIOS) { const tr = el('tr'); tr.append(el('td', null, s.name), el('td', null, s.note.replace(' guesses an hour', ' / hour').replace(' guesses a second', ' / second'))); sp.append(tr); }
}

// Wide screens: the details card is a fixed side column, so keep it open (no collapsing).
// Narrow screens: it stacks above the lab, so start it closed and let people toggle it.
const narrow = matchMedia('(max-width: 900px)');
const you = $('#you');
function syncYou() { you.classList.toggle('pinned', !narrow.matches); you.open = !narrow.matches; }
you.querySelector('summary').addEventListener('click', (e) => { if (!narrow.matches) e.preventDefault(); });
narrow.addEventListener('change', syncYou);
syncYou();
fillExplainers(); makePhrase(); makeChars(); update();

// handy for tests and for the presentation
window.__lab = { analyze, personalTokens, levelFor };
