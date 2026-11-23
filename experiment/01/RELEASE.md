# Ekalavya · experiment 01: Ekalavya Studio, your duet companion

https://ekalavya.studio/experiment/01/, the only experiment. Unlisted: nothing on the site links here, and the pages
carry `noindex`. This release replaces the first experiment/01 (2026-11-22, 15 Indian songs) in place. experiment/02
existed only as a pull request (#2) and is folded in here.

Source: the `avartan` branch at `c69f15f`, copied as a snapshot.

## The asks it answers

- `ask.ekalavya.release.experiment-01`: the room with its songs; plays fully without MIDI; the computer keyboard
  plays notes (QWERTY by default, layout in ⚙).
- `ask.ekalavya.songs-western.01`: five catchy, loopy songs to sing or play for family; the header reads **Ekalavya
  Studio** with **Your Duet Companion** under it.
- `ask.ekalavya.iphone.01`: loads on an iPhone under reduced capacity, with no device, by touch.
- `ask.ekalavya.one-experiment.01`: works in every iPhone browser (Safari, Chrome, Firefox Focus); each backing part
  has a clear on / off; the backing is quieter; one experiment only.

## What is in

- `index.html` (the room), `parts/`, `voices.js` (synthesised tabla and tanpura), `sampler.js` (the soundfonts),
  `ai.html` / `AI.md` (the guide for an AI in the room).
- **20 songs:** the 15 Indian songs of the first release and the 5 Western ones (Stand By Me, Let It Be, Hedwig's
  Theme, Game of Thrones, Perfect). The 6 Indian songs whose ragas are marked approximate stay held back. Western songs
  carry chords, key and tempo only, approximately; the room loops chords, a bass line and a groove, never the tune.
- Out: `wireframes.html`, `research.html`, `sheets/`, `samples/` (unused recordings).

## A first visit

Opens on **Stand By Me** in **Listen** mode, not playing. MIDI off, so the browser never asks for it. On a computer,
the letter keys play notes; on a phone, the keybed is played by touch.

## The backing

The backing is the tabla, the tanpura, the manjira, the shaker, the drum kit, and the two seats beside the centre.

- **On / off:** each part has its own switch in the **Backing** panel, beside the pad. A part turned off stays off for
  every song until it is turned on again.
- **One level:** the Backing slider scales all of them. It starts at **45%**, so the backing sits well under the
  player; the centre seat keeps its own level.

## Phones and every browser

- **Who gets the phone layout:** any screen under 600px on its short side or under 760px wide, in any browser, decided
  by the visible size alone. On iPhone, Chrome and Firefox Focus use the same WebKit engine as Safari (WKWebView), and
  they get the same layout. A tablet gets the whole room scaled down.
- **What it holds:** the song chip, the three seats, the Backing panel with the pad, a keybed with finger-wide keys,
  ☰ Menu and ■ / ▶. Songs, settings and the menu rise from the bottom as sheets.
- **Touch:** several fingers can play at once.
- **Light mode** (phones, Save-Data, small memory, or ⚙ → Performance): fewer frames, smaller canvases, and only the
  notes that will play are decoded.
- **iOS sound:** opens on the first tap, and plays with the silent switch on.

## Credits

MusyngKite soundfont via midi-js-soundfonts (https://github.com/gleitz/midi-js-soundfonts), CC BY-SA 3.0, credited in
⚙. Tabla, tanpura and drum kit synthesised in the page. Fonts: Cormorant Garamond and DM Mono via Google Fonts.
