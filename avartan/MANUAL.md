# avartan — user manual

The controller holds the taal; you sit in the centre with the MIDI keyboard. What you play is written as a score,
held when you have played it the same way enough times, and sent to any instrument, which plays it in its own sound.
Demonstration: performance.neonix.02.

## Start

| you want | do |
|---|---|
| on the Mac, with the PAD19Pro, the Pico and the MIDI keyboard | the cockpit kernel running (`tools/web.py`), then open **http://localhost:8300/ensemble** |
| on the web: **https://ekalavya.studio/avartan/** | MIDI works there directly (https). With the cockpit kernel running on the same Mac, the PAD19Pro and the Pico come in too (Chrome may ask once to allow it to reach this computer) |
| the whole M32, live | **m32.html** next to this page: every control lit as you use it; teach it what it does not know |
| anywhere, nothing real | `python3 tools/web.py --demo`, then http://127.0.0.1:8300/ensemble (the computer keyboard plays the PAD's part) |

A browser lets a page use a MIDI keyboard only from `localhost` (or https). Nothing to install: a USB MIDI keyboard
needs no driver. **Touch anywhere once** to hear it (a browser rule); the cycle was already running. Chrome asks
once to allow MIDI.

## What you see

```
 ● avartan   raga · Sa · laya                                  PAD19Pro · Pico · MIDI   manual
 [ THE SCORE: 1 | 2 | 3 earned lines ............. lingering: ● ● ○ ]
 ┌──────────┐ ┌─────────────────────────────────────────────────────────────────────────┐
 │  chakra  │ │ YOU   the prompt: where you go next (lime)                         सा  │
 │ 16 beats │ │ your line: now (lime) · held (white) · last take (grey)                 │
 │ as 4 × 4 │ │ send → sitar flute tabla tanpura · all back to their own   drop a MIDI  │
 └──────────┘ └─────────────────────────────────────────────────────────────────────────┘
 [ SITAR ]        [ FLUTE ]         [ TABLA ]         [ TANPURA ]      a colour each
 [ at the next sam ]   [ Pico: laya · tabla · Sa · answer · room ]   [ ● rec: the stream ]
```

- **One colour means "go here": lime.** The prompt, the beat you are on, what will land at the next sam, the
  window you picked. Everything else is black, white and grey; each instrument has its own colour.
- **The chakra**: 16 beats drawn as four groups of four, the sam at the top. The middle says bar · beat, and
  "sam in 4…1" as it comes. The sam flashes.
- **On open, only the tanpura plays, at Sa.** Every other window says WAITS FOR YOU and composes nothing. Your first note brings everyone in on the
  next sam. **The raga follows you**: the swars you play (the last 40 notes) are the scale everyone plays in; if
  they are a raga it knows, it is named. PAD 9 holds the raga where it is (and lets it follow you again).
- **The windows**: name, what it is doing (PLAYS, FOLLOWS YOU, YOUR LINE, REST, WAITS FOR YOU), a level meter,
  its own roll.
- **At the next sam**: every change you make shows there at once and clears when it lands.
- **The rec strip**: you never need to read it. It is the stream being kept, western staff above and Bhatkhande
  below, now at the right; every cycle you play in is written down (http://localhost:8300/ensemble/takes).

## Two records: the stream and the score

- **The stream** (the rec strip at the bottom) is every note you play, kept as played. Nothing is left out and you
  never need to look at it.
- **The score** (the band at the top) holds only what is **earned**. Play a line; it **lingers** at the end of the
  score, dim, with a meter: ● ○ ○. Play it the same way again (swar by swar): ● ● ○. The third time it is
  **earned**: it flashes, locks into the score in order, and stays. A different line starts its own meter.
  Nothing gets into the score any other way. **bksp** takes the last earned line back out.

## HIT

**HIT** (the lime button in your panel, or the PAD's wide **0**) listens to what has been tried (your recent takes
and the earned score) and plays a phrase made from it, in the raga, landing on Sa at the sam, for two cycles. It
falls on the keyboard in lime: follow it a bit, then improvise. What you play over it goes into the stream, and
earns its way into the score like anything else.

## Sending a line

The last earned line can go to any window: drag it from your panel onto a window, click a window's name under your
panel, or pick on the PAD and press enter. From the next sam that window plays it in its own voice, every cycle.
**all back to their own** undoes every send. A MIDI file dropped on your panel is a composition: it goes straight
into the score as earned.

## The three hands

**Pico: the room you play in.** Time on the left, Sa in the centre, space on the right. The strip at the bottom
lights each knob as you turn it, with its value.

| knob | changes |
|---|---|
| L (A) | laya, 2 bpm a step |
| L2 (B) | the tabla's layakari: thah, filled, dugun, tigun, chaugun |
| C | Sa, a semitone a step |
| R2 (D) | how much the sitar and flute answer you: sparse to busy |
| R (E) | the room: dry to wide (at once) |

**PAD19Pro: the left hand.** The picks sit where the windows sit.

```
 ┌────────┬────────┬────────┬────────┐
 │ bksp   │  Fn    │        │  mute  │
 │ undo   │ never  │        │ Mac's  │
 ├────────┼────────┼────────┼────────┤
 │numlock │   /    │   *    │   −    │
 │rest/in │tabla − │tabla + │ softer │
 ├────────┼────────┼────────┼────────┤
 │   7    │   8    │   9    │   +    │
 │ riyaz  │ tihai  │raga    │ louder │
 │        │        │hold    │        │
 ├────────┼────────┼────────┤        │
 │   4    │   5    │   6    │        │
 │ sitar  │  you   │ flute  │        │
 ├────────┼────────┼────────┼────────┤
 │   1    │   2    │   3    │ enter  │
 │ tabla  │  all   │tanpura │ send → │
 ├────────┴────────┼────────┤        │
 │   0   HIT       │ . keys │        │
 └─────────────────┴────────┴────────┘
```

- A pick (4 6 1 3, 5 you, 2 all) only picks. **num lock** rests the picked or brings it in (with 5 picked: clears
  your line). **enter** sends the last earned line to the picked.
  **bksp** takes the last earned line out of the score. **+ / −** the picked louder or softer.
- **/ \*** the tabla's layakari down or up. **7** riyaz Set I. **8** a tihai. **9** hold the raga / follow you.
- **0** is HIT. **.** shows the keys in a corner. Never press **Fn + bksp**: it erases the keypad's settings. The PAD's knob is
  the Mac's volume.

**MIDI keyboard: the right hand.** Keys: your line. Pitch bend: meend. Mod: gamak. Its first five knobs: the levels
of sitar, flute, tabla, tanpura (as they sit) and you. Nothing else on it moves anything. (The knobs are taken as
CC 14 to 18, the keyboard's MIDI mode; to be confirmed when we calibrate it.)

The KB21 is not used here.

## Riyaz: Set I

PAD 7 starts it on the next sam. The centre plays it in your voice; the
tanpura and tabla keep the cycle; the sitar and flute follow you (or rest). Each step loops 5 cycles.

| step | cycles | what |
|---|---|---|
| 1 | 15 | one swar on each sam: Sa Re Ga Ma Pa Dha Ni Sa', and back down to Sa, once |
| 2 to 6 | 5 each | Sa, halved each step: once in the cycle, 2, 4, 8, then on every beat |
| 7 | 5 | four Sas on one beat, then resume: Re Ga Ma Pa Dha Ni Sa' Sa' Ni … Re Sa, one a beat |
| 8 | 20 | Sa Re Sa Re, Re Ga Re Ga … in pairs up to Sa', and back down (4 cycles, 5 times) |

After Set I clears you: one gat. Play it again and again until it is held.

## What it shows that matters

- The cycle never stops or stretches, whatever anyone does: thehrav.
- Your line is held only when you have played it the same way: the score is what you meant, not one slip.
- One line, many voices: MIDI decides what is played, each window how it sounds.
