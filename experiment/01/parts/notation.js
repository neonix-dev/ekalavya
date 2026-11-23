// notation.js · sargam lines, one cycle each: the language every melodic part reads and writes.
// A beat is one token: a swar (S r R g G m M P d D n N; ' an octave up, , down), several sharing the beat (SRGm),
// - holding the last swar, . a rest. Vibhags with " | ", only for the eye. Knows no instrument, no clock, no page.
(function () {
const SW = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
const SWAR = /[SrRgGmMPdDnN][',]*/g, HAS = /[SrRgGmMPdDnN]/;
const swarOf = (n) => { const o = Math.floor(n / 12); return SW[n - 12 * o] + (o > 0 ? "'".repeat(o) : ",".repeat(-o)); };
const semOf = (s) => SW.indexOf(s[0]) + 12 * ((s.match(/'/g) || []).length - (s.match(/,/g) || []).length);
const swarsIn = (tk) => tk.match(SWAR) || [];
const lineOk = (l) => HAS.test(l);
const tokens = (line, n) => { const t = String(line).replace(/\|/g, " ").trim().split(/\s+/).filter(Boolean); while (t.length < n) t.push("."); return t.slice(0, n); };
const group = (t, vibhag) => { const out = []; let i = 0; vibhag.forEach(v => { out.push(t.slice(i, i + v).join(" ")); i += v; }); return out.join(" | "); };
function parse(line, n) {                         // a line → notes {b beat, n semitones from Sa, d beats}
  const notes = []; let last = null;
  tokens(line, n).forEach((tk, k) => {
    if (tk === "-") { if (last) last.d += 1; return; }
    const ss = swarsIn(tk); if (!ss.length) { last = null; return; }
    ss.forEach((s, i) => { last = {b: k + i / ss.length, n: semOf(s), d: 1 / ss.length}; notes.push(last); });
  });
  return notes;
}
function format(notes, n, vibhag) {                // notes (beats from the sam) → a line
  const t = Array(n).fill("."), by = Array.from({length: n}, () => []);
  for (const x of notes) { const k = Math.floor(x.b + .2); if (k >= 0 && k < n) by[k].push(x); }   // a hair early is on the beat
  let until = -1;
  for (let k = 0; k < n; k++) {
    if (by[k].length) { by[k].sort((a, b) => a.b - b.b); t[k] = by[k].slice(0, 4).map(x => swarOf(x.n)).join(""); until = Math.max(until, ...by[k].map(x => x.b + x.d)); }
    else if (until > k + .3) t[k] = "-";
  }
  return group(t, vibhag);
}
const scaleOf = (lines, n) => { const s = new Set([0]); lines.forEach(l => tokens(l, n).forEach(tk => swarsIn(tk).forEach(x => s.add(((semOf(x) % 12) + 12) % 12)))); return [...s].sort((a, b) => a - b); };
function step(x, k, sc) { const o = Math.floor(x / 12), pc = x - 12 * o; let i = sc.indexOf(pc); if (i < 0) i = sc.reduce((b, y, j) => Math.abs(y - pc) < Math.abs(sc[b] - pc) ? j : b, 0); const j = i + k, L = sc.length; return sc[((j % L) + L) % L] + 12 * (o + Math.floor(j / L)); }
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const KINDS = ["ornament", "dugun", "answer", "higher"];
function improvise(lines, kind, seed, n, vibhag) {   // a variation on a piece, in the raga it uses (the rule stand-in for a reader)
  const sc = scaleOf(lines, n), r = rng(seed), all = lines.flatMap(l => tokens(l, n).flatMap(swarsIn).map(semOf)); if (!all.length) return [];
  return lines.map((line, li) => {
    const t = tokens(line, n), sw = t.flatMap(swarsIn).map(semOf);
    const lastSwar = (k) => { for (let i = k - 1; i >= 0; i--) { const s = swarsIn(t[i]); if (s.length) return semOf(s[s.length - 1]); } return sw[0] ?? 0; };
    if (kind === "ornament") { const dir = r() < .5 ? 1 : -1; return group(t.map((tk, k) => tk === "-" && k > 0 && t[k - 1] !== "-" ? swarOf(step(lastSwar(k), dir, sc)) + swarOf(lastSwar(k)) : tk), vibhag); }
    if (kind === "dugun") { const src = sw.length ? sw : all, rot = Math.floor(r() * src.length), seq = src.slice(rot).concat(src.slice(0, rot));
      return group(t.map((tk, k) => k < n / 2 ? swarOf(seq[(2 * k) % seq.length]) + swarOf(seq[(2 * k + 1) % seq.length]) : tk), vibhag); }
    if (kind === "answer") { const sh = r() < .5 ? 2 : -2, rev = sw.slice().reverse().map(x => step(x, sh, sc)); let i = 0;
      const out = t.map(tk => swarsIn(tk).length ? swarsIn(tk).map(() => swarOf(rev[i++ % rev.length])).join("") : tk);
      if (li === lines.length - 1) for (let k = n - 1; k >= 0; k--) if (swarsIn(out[k]).length) { out[k] = "S"; break; }
      return group(out, vibhag); }
    return group(t.map(tk => swarsIn(tk).length ? swarsIn(tk).map(s => swarOf(step(semOf(s), 2, sc))).join("") : tk), vibhag);
  });
}
window.AVARTAN_NOTATION = {SW, swarOf, semOf, swarsIn, lineOk, tokens, group, parse, format, scaleOf, improvise, KINDS};
})();
