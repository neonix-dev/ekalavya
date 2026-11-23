# Ekalavya · experiment 01: Avartan, the riyaz room, with songs

Released 2026-11-22 at https://ekalavya.studio/experiment/01/ — unlisted (nothing on the site links here; the pages
carry `noindex`).

Ask: `ask.ekalavya.release.experiment-01`. neonix asked for the current version with the songs, asked for picks first,
added that it must work fully without MIDI (keyboard layout chosen in ⚙, QWERTY by default), then said yes to every
pick.

Source: the `avartan` branch at `6f7b5cf`, copied as a frozen snapshot. `avartan` stays the workshop; a later
experiment is a new folder (`experiment/02/`), and this one does not change.

## What is in

- `index.html`: the room. Tabla and tanpura keep the taal; three seats (piano, sitar, bansuri) left, centre, right;
  the Manjira + Shaker pad; the page docked on a drawing of the NI Komplete Kontrol M32.
- `parts/`: the clock, room, tabla, tanpura, stage, notation, keys, ear, groove, backdrop; `songs.json`, `ragas.json`.
- `voices.js` (the synthesised tabla and tanpura), `sampler.js` (loads the instrument soundfonts).
- `ai.html`, `AI.md`: the guide for an AI in the room (the score lives in the DOM).

## Songs: 15 in, 6 held back

Each song is metadata only: title, artist, raga, taal, theka, laya, a source link. No song's melody or lyrics are
here; the backdrop is drawn from the raga's grammar (`ragas.json`). Every song starts on Sa = C♯ (keys not sourced; set
Sa by ear in ☰ Menu).

In: Eri Aali Piya Bina (Yaman) · Jaa Jaa Re Apne Mandirva (Bhimpalasi) · Tori Jai Jai Kartar (Puriya Dhanashri) ·
Paga Laagana De (Malkauns, vilambit) · Man Tarpat Hari Darshan Ko (Malkauns) · Jhanak Jhanak Tori Baaje Payaliya
(Darbari) · Om Jai Jagadish Hare (Desh) · Jai Radha Madhav Jai Kunj Bihari (Darbari) · Vaishnav Jan To (Khamaj) ·
Chadariya Jhini Re Jhini (Desh) · Karam Ki Gati Nyari (Hamsadhwani) · Hangama Hai Kyon Barpa (Darbari) · Mehfil Mein
Baar Baar (Megh) · Chura Liya Hai Tumne Jo Dil Ko (Pilu) · Chingari Koi Bhadke (Bhairavi).

Held back (their ragas are marked approximate in `ragas.json`): Ketaki Gulab Juhi (Basant Bahar) · Payoji Maine
(Pahadi) · Chaudhvin Ka Chand Ho (Pahadi) · Raghupati Raghav (Gara) · Maili Chadar (Hem Kalyan) · Ab Ke Hum Bichhde
(Bhupeshwari).

## Stays out

`wireframes.html`, `research.html`, `sheets/`, the drawing sheets, and `samples/` (freesound tabla recordings, unused:
the synthesised tabla is the one chosen). The ⚙ Wireframes link is removed.

## A first visit

- Opens on **Eri Aali Piya Bina** in **Listen** mode, not playing (`songs.json` → `first`). Press ▶ or Space.
- **No MIDI needed.** MIDI is off; the browser never asks for it. ⚙ → MIDI → On turns it on (Chrome or Edge).
- **The computer's keys play notes**: the Z row is the keybed's first octave from C, the Q row the next, up to the top
  G; their letters are drawn on the keybed. Space plays / pauses, ← → bring a seat to the centre, ↑ ↓ tempo, Enter
  pins a phrase, `/` opens the songs. The mouse plays the keybed and turns the knobs.
- ⚙ → Keys: Play notes (default) or Riyaz controls (the letter moves, no notes). ⚙ → Layout: QWERTY (default),
  AZERTY, QWERTZ, Dvorak, Colemak, or detect from this computer. Notes follow where a key sits, so the layout only
  changes the letters drawn.

## Changes from the source, release-only

- `parts/songs.json`: the 6 held-back songs removed; `first` added.
- `index.html`: the header's EKALAVYA links home with "experiment 01"; ⚙ credits line instead of Wireframes;
  `noindex`.
- `ai.html`: `noindex`.

## Credits

- Melodic instruments: MusyngKite soundfont via midi-js-soundfonts (https://github.com/gleitz/midi-js-soundfonts),
  CC BY-SA 3.0, fetched by the browser at runtime. Credited in ⚙.
- Tabla and tanpura: synthesised in the page (`voices.js`).
- Fonts: Cormorant Garamond and DM Mono via Google Fonts.

## Checked

1. Preview (Cloudflare Pages branch preview of `release/experiment-01`): loads with no console errors; first visit on
   Eri Aali Piya Bina, Listen; MIDI off and no permission prompt; computer keys play; ⚙ layout switch; songs list 15.
2. Live, after the push to `main`: the same at https://ekalavya.studio/experiment/01/.
