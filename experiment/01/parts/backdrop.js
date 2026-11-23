// backdrop.js · a song's backdrop: two quiet cycles in its raga for the side seats, written as sargam lines.
// The melody seat walks the pakad, then comes down the avaroha to Sa; the pad seat holds Sa, the vadi, the samvadi,
// and Sa again. Knows notation lines and a raga record (parts/ragas.json); no clock, no seat, no page.
// A song with chords instead (songs.json: "chords", "meter", "comp") gets a chord loop: the comp seat plays the chords
// in the song's pattern, the bass seat their roots. Never the tune: the performer brings that.
(function () {
const toks = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
function fit(t, n) {                                 // k swars spread over n beats, held between (pairs share a beat if k > n)
  while (t.length > n) { const u = []; for (let i = 0; i < t.length; i += 2) u.push(t[i] + (t[i + 1] || "")); t = u; }
  const out = Array(n).fill("-"), k = t.length;
  t.forEach((x, i) => { out[Math.floor(i * n / k)] = x; });
  return out;
}
const join = (t, vibhag) => { const o = []; let i = 0; (vibhag || [t.length]).forEach(v => { o.push(t.slice(i, i + v).join(" ")); i += v; }); return o.join(" | "); };
function lines(raga, n, vibhag) {
  const h = Math.floor(n / 2), held = (a, b) => [a, ...Array(h - 1).fill("-"), b, ...Array(n - h - 1).fill("-")];
  return {
    melody: [join(fit(toks(raga.pakad), n), vibhag), join(fit(toks(raga.avaroha), n), vibhag)],
    pad: [join(held("S", raga.vadi || "P"), vibhag), join(held(raga.samvadi || "P", "S"), vibhag)],
  };
}
const PC = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
const QUAL = {"": [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], sus4: [0, 5, 7], sus2: [0, 2, 7], aug: [0, 4, 8]};
function chord(name) {                               // "F#m" → {root: 6, tones: [0, 3, 7]}
  const x = /^([A-G])([#b♯♭]?)(.*)$/.exec(String(name).trim()); if (!x) return null;
  const root = (PC[x[1]] + (/[#♯]/.test(x[2]) ? 1 : /[b♭]/.test(x[2]) ? -1 : 0) + 12) % 12;
  return {root, tones: QUAL[x[3]] || QUAL[""], name};
}
const BAR = {"4/4": 4, "3/4": 3, "6/8": 6, "12/8": 12};
// where each chord sounds in a bar of `b` pulses (the comp), as [at, tone index (0 root, 1 third, 2 fifth, 3 octave…), length, loudness]
const COMP = {
  pulse:  (b) => Array.from({length: b}, (_, i) => [i, "all", .9, i ? .8 : 1]),
  block2: (b) => [[0, "all", b / 2 - .1, 1], [b / 2, "all", b / 2 - .1, .8]],
  waltz:  (b) => [0, 1, 2, 3, 2, 1].map((t, i) => [i * b / 6, t, b / 6 + .2, i ? .75 : 1]),
  arp6:   (b) => [0, 2, 3, 2, 4, 2].map((t, i) => [i * b / 6, t, b / 6, i ? .8 : 1]),
  pick12: (b) => [0, 2, 3, 4, 3, 2, 0, 2, 3, 4, 3, 2].map((t, i) => [i * b / 12, t, b / 12 + .3, i % 6 ? .7 : 1]),
  pad:    (b) => [[0, "all", b - .05, .8]],
};
const BASS = {
  "4/4": [[0, 0, 1.9], [2, 2, 1.9]], "3/4": [[0, 0, 2.9]], "6/8": [[0, 0, 2.9], [3, 2, 2.9]], "12/8": [[0, 0, 5.8], [6, 2, 5.8]],
};
// → {cycles, comp: [{k, at, m, d, v}], bass: [...]}: k the cycle from the loop's start; shift moves the key (semitones)
function chords(song, n, shift = 0) {
  const meter = BAR[song.meter] ? song.meter : "4/4", b = BAR[meter], bars = String(song.chords || "").split("|").map(x => x.trim()).filter(Boolean);
  const comp = [], bass = [], style = COMP[song.comp] ? song.comp : "block2";
  bars.forEach((bar, i) => {
    const names = bar.split(/\s+/).filter(Boolean), each = b / names.length;
    names.forEach((nm, j) => { const ch = chord(nm); if (!ch) return; const root = ((ch.root + shift) % 12 + 12) % 12, B0 = i * b + j * each;
      const base = 55 + ((root - 55 % 12 + 12) % 12);                     // the comp's root: from G3 up
      const tone = (t) => t === "all" ? null : base + (t < ch.tones.length ? ch.tones[t] : 12 + ch.tones[(t - ch.tones.length) % ch.tones.length]);
      COMP[style](each).forEach(([at, t, d, v]) => { const ms = t === "all" ? ch.tones.map(x => base + x) : [tone(t)];
        ms.forEach(m => comp.push({B: B0 + at, m, d, v})); });
      (names.length > 1 ? [[0, 0, each - .1]] : BASS[meter]).forEach(([at, t, d]) => bass.push({B: B0 + at, m: 36 + ((root - 36 % 12 + 12) % 12) + (t ? ch.tones[t] : 0), d, v: 1}));
    });
  });
  const total = bars.length * b, cycles = Math.max(1, Math.ceil(total / n)), place = (x) => ({k: Math.floor(x.B / n), at: +(x.B % n).toFixed(4), m: x.m, d: x.d, v: x.v});
  return {cycles, comp: comp.map(place), bass: bass.map(place)};
}
window.AVARTAN_BACKDROP = {fit, lines, chord, chords};
})();
