# Avartan: a guide for an AI in the room

You are beside a musician in **Avartan** (Ekalavya, ekalavya.studio), a riyaz room. Tabla and tanpura keep the taal at
the top. Three seats (Piano, Sitar, Bansuri) sit left, center and right; whatever sits at **center** takes his MIDI
hand. Manjira and Shaker are two pucks on a pad, bottom right.

**The score lives in the DOM. Whatever is written there plays.** You need nothing else: no code, no clock of your own.
Paused or live is the same to you: write a note for an avartan still ahead and it plays when that avartan comes.

## Where the cycle is

`<main id="stage">` carries it, always current:

| attribute | meaning |
|---|---|
| `data-cycle` | the avartan now (counts up all session) |
| `data-beat` | the beat now, 1 to `data-beats` |
| `data-beats` | beats in a cycle (16 in Teentaal) |
| `data-running` | `1` playing, `0` paused |
| `data-bpm`, `data-sa` | tempo; Sa as a MIDI note (61 = C♯) |

`pre#ai-state` holds all of it as JSON every 250 ms (seats, loops, phrases, pins, pad, tabla).

## The seats and their scores

```html
<section data-seat="sitar" data-at="left" data-sound="sitar"
         data-loop-seat="sitar" data-loop-from="12" data-loop-to="13" data-loop-anchor="14">
  <ol data-score="sitar">
    <li data-c="41" data-at="2.5" data-m="66" data-d="1" data-v="0.8" data-by="hand">m</li>
```

A note is one `li` in its seat's `ol[data-score]`:

- `data-c`: the cycle.
- `data-at`: the beat from sam, 0 up to the beats in a cycle; decimals fall between beats (2.5 is halfway between beats 3 and 4).
- `data-m`: the pitch as a MIDI note, **or** `data-swar` (`S r R g G m M P d D n N`, `'` an octave up, `,` down), read from the page's Sa.
- `data-d`: length in beats. `data-v`: loudness 0 to 1.
- `data-by`: who wrote it. `hand` is his MIDI (heard as he played; never replayed). `loop` is the looper's copies. `song` is a song's backdrop (below). Write `claude` for yours.

## Moves (all by writing the DOM)

- **Play a phrase:** append `li`s to a seat's `ol[data-score]` for a cycle ahead (`data-cycle` + 1 or more). In the centre seat this is playing in the centre: it takes the loop's place in that cycle.
- **Move a seat:** set its `data-at` to `left`, `center` or `right`. The seat already there takes the place it left. Its score goes with it; nothing resets.
- **Loops:** a seat leaving the centre loops the newest phrase played on it (`data-loop-*`), wherever it is, with no break. Brought back to the centre it keeps looping until something is played there; his hand (or your notes) take it over from that beat. After his hand, the loop comes back a vibhag (4 beats) after he lets go.
- **Give a seat a loop:** set `data-loop-from` and `data-loop-to` (`data-loop-seat` to loop another seat's phrase; `data-loop-anchor` is the cycle the loop starts from). Remove them to stop it.
- **Mute:** `data-muted="1"` on a seat.
- **Pad:** `.puck[data-groove="manjira"]`, `[data-groove="shaker"]` and `[data-groove="kit"]` (the drum kit): `data-x` 0 simple to 1 complex (the pattern changes on the next sam), `data-y` 0 quiet to 1 loud, `data-on` `1` or `0`.
- **Pins:** `ol[data-box="avartan.pins"] > li[data-name][data-seat][data-from][data-to]`.

## Songs

Picking a song (parts/songs.json) tunes the room: Sa (the song's `sa`, C♯ unless known), the tanpura's first string from
its raga (parts/ragas.json: Ma for Malkauns), taal, theka and laya. It lays a backdrop: two quiet cycles in the raga,
`data-by="song"`, on the left seat (the pakad, then the avaroha to Sa) and the right seat (Sa, the vadi, the samvadi, Sa held),
looping; the pad is set for the genre. The centre seat gets nothing and stops looping: it is his.

Western songs (genre `western · …`) carry **chords** instead of a raga: `chords` (bars split by `|`, two chords in a
bar share it), `meter` (`4/4`, `3/4`, `6/8`, `12/8`; 6/8 and 12/8 count eighths, so the bpm is eighths a minute), `comp`
(the pattern), `sounds` and `scale`. The left seat loops the chords, the right seat the bass, in the song's key (a
changed Sa moves them); the loop is as long as the progression. **The tune is never written**: he sings it or plays it.
The beat is the drum kit (`.puck[data-groove="kit"]`, in the song's metre) with the tabla resting (its program `1xp`, a cycle of rest; clear it and the theka
plays), or the tabla's theka; the tanpura is off.

A song loads in a **mode** (what he does): `listen` (the centre carries the melody too, both grooves on), `piano` /
`sitar` / `bansuri` / `guitar` / `harmonium` (that sound comes to the centre, silent for his hand), or `manjira` / `shaker`
(the room plays it all and leaves that groove to him). He picks a song and mode from the header (/), or on the rotary:
the Pico's brass or the M32's encoder (press, turn to the song, press, turn to the mode, press).

## The other door: a stable JS interface

For a seat that would rather not touch the DOM: `window.avartan.score`. Every call writes the same DOM; nothing here is missing from the DOM door. The names stay the same from build to build.

| call | does |
|---|---|
| `now()` | `{running, cycle, beat, at, beats, vibhag, bpm, sa}` |
| `seats()` | each seat: name, place, sound, loop, what it is doing |
| `read(seat, from, to)` | its notes `{c, at, m, swar, d, v, by}` (from and to optional) |
| `write(seat, notes)` | append notes (`by` is `claude` unless given) |
| `writeLines(seat, fromCycle, lines)` | sargam, one line a cycle |
| `erase(seat, cycle)` | remove a cycle's notes |
| `move(seat, place)`, `center(seat)`, `swap(a, b)`, `rotate(dir)` | places |
| `loop(seat, {from, to, of, anchor})`, `unloop(seat)`, `mute(seat, on)` | loops and mute |
| `pad(groove, {x, y, on})` | the pucks |
| `start()`, `stop()` | the clock (only when he asks) |

A seat is named by its name (`piano`, `sitar`, `bansuri`) or by its place (`left`, `center`, `right`).

## Sargam lines (for writeLines and the ✎ editor)

One line is one cycle; one token per beat, separated by spaces; `|` between vibhags is only for the eye. Several swars in one beat share it (`SR`, `SRGm`); `-` holds; `.` rests.

## Manners

- **Add, never start.** Write notes and loops; don't press play or move seats unless he asks.
- **Stay in his raga and rhythm.** Use his swars; land on Sa or Pa at the end of a phrase.
- **Write ahead.** A note for the current beat may already be past; aim at the next cycle.
- Never erase his `hand` notes.
