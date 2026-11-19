import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, humanTime, personalTokens, theoreticalBits, levelFor } from '../js/engine.js';
import { randomChars, passphrase, describe, randomInt } from '../js/gen.js';
import { PASSPHRASE } from '../js/data.js';

const me = { first: 'Devadarshan', nick: 'Deva', birth: '2005-05-21', pet: 'Mochi', school: 'SAJC', team: 'Liverpool' };
const bits = (pw, d) => analyze(pw, d).bits;

test('the worst passwords fall instantly', () => {
  for (const pw of ['password', '123456', 'qwerty', 'iloveyou', 'letmein', 'admin123']) {
    const a = analyze(pw); assert.ok(a.guesses.knows < 1000, `${pw}: ${a.guesses.knows}`); assert.equal(a.level.id, 'veryweak');
  }
});

test('letter swaps do not rescue a common password', () => {
  assert.ok(analyze('p@ssw0rd').guesses.knows < 1e4);
  assert.ok(analyze('P@ssw0rd!').guesses.knows < 1e7);
});

test('patterns are cheap: sequences, keyboard walks, repeats, years', () => {
  assert.ok(analyze('abcdefgh').guesses.knows < 1e5);
  assert.ok(analyze('qwertyuiop').guesses.knows < 1e5);
  assert.ok(analyze('aaaaaaaaaa').guesses.knows < 1e5);
  assert.ok(analyze('1998').guesses.knows < 1e3);
  assert.ok(analyze('21052005').guesses.knows < 1e5);
});

test('your own details make the same password far weaker', () => {
  const a = analyze('Deva2005', me);
  assert.ok(a.usedPersonal);
  assert.ok(a.guesses.knows < a.guesses.stranger / 100, `${a.guesses.knows} vs ${a.guesses.stranger}`);
  assert.ok(a.bits < 20);
  assert.ok(analyze('Mochi21052005', me).guesses.knows < 1e6);
  assert.ok(analyze('liverpool!', me).guesses.knows < 1e5);
});

test('personal details are not used when none are given', () => {
  const a = analyze('Deva2005'); assert.equal(a.guesses.knows, a.guesses.stranger); assert.equal(a.usedPersonal, false);
});

test('personal tokens cover names, initials, birthday forms', () => {
  const t = personalTokens(me).map((x) => x.text);
  for (const want of ['deva', 'devadarshan', 'mochi', 'sajc', '2005', '21052005', '210505', '2105', '0521']) assert.ok(t.includes(want), want);
});

test('long random strings are strong', () => {
  for (const pw of ['q8Zr!n2vK#p4Lm9X', 'correct-horse-battery-staple-orbit', 'T7#vQ2$kLp9@xW4n']) assert.ok(analyze(pw, me).bits > 60, `${pw} ${analyze(pw, me).bits}`);
});

test('length wins: an extra character never makes a password easier', () => {
  let s = ''; let prev = 0;
  for (const ch of 'k3X!m9Qz2vB7') { s += ch; const b = bits(s); assert.ok(b >= prev - 0.5, `${s}: ${b} < ${prev}`); prev = b; }
});

test('empty input is handled', () => {
  assert.equal(analyze('').empty, true); assert.equal(analyze(null).empty, true);
  assert.ok(analyze('x').guesses.knows >= 1);
});

test('very long input is capped and does not hang', () => {
  const t0 = Date.now(); const a = analyze('aZ9!'.repeat(200)); assert.ok(Date.now() - t0 < 3000); assert.ok(a.truncated);
});

test('hostile input does not crash', () => {
  for (const pw of ['\u0000\u0001', '😀😀😀😀', ' '.repeat(20), '<script>alert(1)</script>', 'ａｂｃ', '\\\\', '%s%s%s', '_'.repeat(50), 'ñandú1ñandú1']) {
    const a = analyze(pw, me); assert.ok(Number.isFinite(a.bits), pw);
  }
});

test('times are formatted for people', () => {
  assert.equal(humanTime(0), 'instantly');
  assert.equal(humanTime(0.5), 'less than a second');
  assert.equal(humanTime(30), '30 seconds');
  assert.equal(humanTime(3600 * 5), '5 hours');
  assert.equal(humanTime(86400 * 3), '3 days');
  assert.match(humanTime(31557600 * 250), /centur/);
  assert.match(humanTime(31557600 * 5e6), /million years/);
  assert.equal(humanTime(1e30), 'longer than the universe has existed');
});

test('levels line up with bits', () => {
  assert.equal(levelFor(10).id, 'veryweak'); assert.equal(levelFor(40).id, 'fair'); assert.equal(levelFor(70).id, 'strong'); assert.equal(levelFor(120).id, 'excellent');
});

test('theoretical bits ignore patterns, the real number does not', () => {
  assert.ok(theoreticalBits('Password1!') > 55);
  assert.ok(bits('Password1!') < 25);
});

test('generated random passwords are long, mixed and avoid your details', () => {
  for (let i = 0; i < 200; i++) {
    const g = randomChars({ length: 16, details: me });
    assert.equal(g.text.length, 16);
    assert.match(g.text, /[a-z]/); assert.match(g.text, /[A-Z]/); assert.match(g.text, /[0-9]/); assert.match(g.text, /[^A-Za-z0-9]/);
    assert.ok(analyze(g.text, me).bits > 60, g.text);
  }
});

test('generated passphrases are random words with honest entropy', () => {
  const g = passphrase({ words: 7 });
  assert.equal(g.text.split('-').length, 7);
  assert.ok(Math.abs(g.bits - 7 * Math.log2(PASSPHRASE.length)) < 1e-9);
  assert.ok(g.bits > 60);
  const e = passphrase({ words: 6, extras: true });
  assert.ok(e.bits > 6 * Math.log2(PASSPHRASE.length) + 8);
  assert.match(e.text, /\d\d[^A-Za-z0-9]$/);
});

test('the generator never uses personal words', () => {
  for (let i = 0; i < 300; i++) {
    const t = passphrase({ words: 3, details: { first: PASSPHRASE[i % 50], pet: PASSPHRASE[(i * 7) % 90] } }).text.toLowerCase();
    assert.ok(!t.includes(PASSPHRASE[i % 50]) && !t.includes(PASSPHRASE[(i * 7) % 90]));
  }
});

test('random integers are unbiased enough and in range', () => {
  const n = 7; const counts = new Array(n).fill(0);
  for (let i = 0; i < 70000; i++) { const r = randomInt(n); assert.ok(r >= 0 && r < n); counts[r]++; }
  for (const c of counts) assert.ok(c > 9000 && c < 11000, counts.join());
});

test('describe() turns bits into a crack time', () => {
  const d = describe(80); assert.equal(d.level.id, 'excellent'); assert.match(d.text, /year|century|thousand|million|billion|universe/);
  assert.equal(describe(20).text, 'instantly');
});

test('the passphrase list has no duplicates and is a sensible size', () => {
  assert.equal(new Set(PASSPHRASE).size, PASSPHRASE.length); assert.ok(PASSPHRASE.length > 500);
});
