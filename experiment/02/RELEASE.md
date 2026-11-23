# Ekalavya · experiment 02: five songs to sing or play for family; Ekalavya Studio, your duet companion

At https://ekalavya.studio/experiment/02/ once the PR is merged. Unlisted, like 01: nothing on the site links here and
the pages carry `noindex`. experiment/01 stays frozen.

Ask: `ask.ekalavya.songs-western.01`. neonix asked for 5 catchy, loopy songs, not Indian classical, easy to perform
solo in front of family: he sings with his own voice (the system never hears it) or plays the tune on MIDI, guitar or
live sitar while the room carries the loop; an approximate score is fine. He asked to deliver it as a PR with numbered
test steps and screenshots. Mid-build he added: the header reads **Ekalavya Studio**, with **Your Duet Companion**
under it. His answers to the questions asked first:

1. Ship as **experiment/02**; 01 stays frozen.
2. The beat: **both, selectable**: a synthesised drum kit by default for these songs, the tabla one click away.
3. **Recorded keys** (approximate).
4. **New sounds**: bass, strings, celesta, cello (the same MusyngKite soundfont, already credited).

Source: the `avartan` branch at `954a205`, copied as a frozen snapshot.

## The five songs

The room loops the **chords and a bass line** in the song's metre, with a drum kit. **The tune is never written into
the room**: these are copyrighted songs, and the performer brings the melody. Keys, tempos and chords are approximate,
from the well-known recordings.

| Song | Key | Metre · tempo | Chords (one loop) | Backing |
|---|---|---|---|---|
| Stand By Me (Ben E. King) | A major | 4/4 · 118 | A │ A │ F♯m │ F♯m │ D │ E │ A │ A | guitar, bass, kit steady, shaker |
| Let It Be (The Beatles) | C major | 4/4 · 72 | C G │ Am F │ C G │ F C | piano on every beat, bass, kit light |
| Hedwig's Theme (John Williams) | E minor | 3/4 · 160 | Em │ Em │ G │ Em │ Am │ Em │ B7 │ Em | celesta arpeggio, strings, kit light |
| Game of Thrones (Ramin Djawadi) | C minor | 6/8 · 255 eighths | Cm │ Cm │ C │ C | cello arpeggio, strings, kit steady |
| Perfect (Ed Sheeran) | A♭ major | 12/8 · 189 eighths (63 a dotted beat) | A♭ │ Fm │ D♭ │ E♭ | guitar picking, bass, kit light |

Cycles: 4/4 runs on Keherwa (8 = two bars), 3/4 on Dadra (6 = two bars), 6/8 on Dadra (one bar of eighths), 12/8 on
the new Dadra 12 (one bar of eighths). The tabla option plays that taal's theka.

## What changed in the room (from experiment/01)

- **Header:** Ekalavya Studio, with Your Duet Companion under it (links home).
- **Chord songs:** `songs.json` entries with `chords`, `meter`, `comp`, `sounds`, `scale`. The left seat loops the
  chords, the right seat the bass; moving Sa in the editor moves them. The centre stays silent for the performer.
- **Drum kit:** a third puck **K** on the pad (synthesised kick, snare, hats), light / steady / full by the puck's x,
  loudness by y, in the song's metre. With the kit on, the tabla rests (its program is `1xp`, a cycle of rest; clear it and the theka plays).
- **Song editor:** Scale shows the chords for these songs; Groove is Drum kit / Tabla; Drone can be Off (these songs
  load with the tanpura off).
- **Fix:** the kit's clock follows a reset (a song sets the clock back).
- Indian songs give the side seats their own sounds back after a Western song.

## What is in, what stays out

Same as experiment/01: the room, `parts/`, `voices.js`, `sampler.js`, the AI guide; 15 Indian songs + these 5 = 20.
The 6 songs with approximate ragas stay held back. `wireframes.html`, `research.html`, `sheets/`, `samples/` stay out.

## A first visit

Opens on **Stand By Me** in **Listen** mode, not playing. MIDI off (the browser never asks); the computer's keys play
notes (QWERTY by default; ⚙ → Layout).

## Credits

MusyngKite soundfont via midi-js-soundfonts (https://github.com/gleitz/midi-js-soundfonts), CC BY-SA 3.0, in ⚙. Tabla,
tanpura and drum kit synthesised in the page. Fonts: Cormorant Garamond and DM Mono via Google Fonts.

## Follow-up: an iPhone, under reduced capacity, by touch alone

Ask: `ask.ekalavya.iphone.01`. neonix accepted PR #2 with a caveat: a follow-up PR that ensures the site loads under
reduced capacity on an iPhone, and works with no connected device, by touch. Source: `avartan` at `0fa735a`.

- **A phone layout** (a touch screen whose short side is under 600px; `?phone` forces it): the song chip, the three
  seats, the pad, a keybed a finger wide (from the Pa below Sa, 8–19 keys by width), ☰ Menu, ■ and ▶. The tanpura
  and taal panels, the M32's controls and the knobs wait: the song sets them, the tanpura switch is in ☰, levels are
  the phone's volume. On its side: one row of seats and the pad, the keybed under them.
- **Touch:** each finger holds its own key and can slide; a tap turns a pad puck on or off, a drag moves it. Songs,
  settings and the menu rise as sheets from the bottom; in songs a tap loads, **Edit ›** opens the editor, **‹ Songs**
  goes back. No keyboard pops up.
- **No device:** iPhone Safari has no Web MIDI; ⚙ says so and the MIDI choice is off. Pico and M32 rows are hidden on
  a phone; the computer-keyboard rows (Keys, Layout) too.
- **Reduced capacity, light mode** (phones, Save-Data, 4 GB or less, or ⚙ → Performance → Light): about 30 frames a
  second, canvases at most 2 pixels a point, the AI state once a second, and only the notes that will play are decoded.
  Measured on Stand By Me after the first touch: 55 notes decoded (0.9 MB of audio) against 261 (4.8 MB) in full.
  The tabla, tanpura and drum kit are synthesised, so the room keeps time before any instrument file arrives.
- **iOS sound:** opens on touchend and click as well as pointerdown; `navigator.audioSession.type = "playback"` so
  it sounds with the silent switch on; ▶ drawn as text, not emoji.
