# Crack the Password

A browser lab that shows how fast a password falls, and how to build one that holds. Built for the Infocomm Club's Discovery Fortnight session, where students write their own password checker in Python.

**Live:** https://devadd2105-max.github.io/crack-the-password/

## What it does

- **Tell the Cracker about you.** Name, nickname, birthday, pet, school, team, hobby. These are what a stranger can read off your social media, and the Cracker tries them first.
- **Live entropy meter.** Updates on every keystroke. The bar is the *effective* entropy, the work a smart attacker needs. The marker above it is the *theoretical* entropy from length and character types alone. The gap between the two is the lesson.
- **How long it would take**, under four attacks (a website with lockouts, a website with no limits, a stolen database with a slow hash, a stolen database with a fast hash), for a stranger and for someone who knows you.
- **Taken apart.** The password is split into the pieces the Cracker prices separately: your details, common passwords, words, years and dates, sequences, keyboard walks, repeats, and brute force.
- **A password that holds.** Random words, or random characters, from the browser's secure random generator, never using anything from your details.
- **How it works**, with a starter Python checker for the exercise.

Everything runs in the browser. Nothing is sent anywhere or stored.

## How the Cracker estimates

It prices every way of splitting the password into pieces and keeps the cheapest, in the style of [zxcvbn](https://github.com/dropbox/zxcvbn). Each piece has a guess count: its rank in a common-password list, a dictionary of about 57,000 English words (with capital-letter and letter-swap variants), your own details, dates, sequences, keyboard walks and repeats, or brute force over the character set the password uses. The product of the pieces is the guess count. Divide by an attacker's speed for the time.

It is a set of rules, not machine learning, so every number can be explained. The estimates are rough: real attackers use larger lists, and hash speeds vary by hardware.

## Run it

No build step.

```sh
python3 -m http.server 8000   # then open http://localhost:8000
node --test tests/engine.test.mjs
```

## Layout

| File | What it holds |
| --- | --- |
| `js/engine.js` | The Cracker: matchers, cheapest-split search, crack times, explanations |
| `js/gen.js` | Secure password and passphrase generator |
| `js/data.js` | Common passwords, word lists, keyboard rows |
| `js/bigwords.js` | English dictionary (see `NOTICE`) |
| `js/app.js` | The interface |
| `tests/engine.test.mjs` | Unit tests |

## Credits

The English dictionary is a filtered copy of SCOWL (Spell Checker Oriented Word Lists), Copyright 2000-2011 Kevin Atkinson. See `NOTICE`.

MIT licence.
