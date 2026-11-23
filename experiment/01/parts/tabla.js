// tabla.js · the tabla, as one part.
// It plays what its box on the page says and nothing else:
//   <ol data-box="avartan.wire.tabla">  <li data-name="theka">dha dhin dhin dha | dha dhin dhin dha | …</li> … </ol>
// A li is one cycle (one avartan): its name, and its line of bols. Matras are separated by spaces, "|" is only for
// the eye, bols sharing a matra are joined with "-" (ti-ra-ki-ta), "." is a rest. Several li with the same name, one
// after the other, are one variation of several cycles.
// What order they play in is the program (RiyazStudio's way), read from [data-role="program"] next to the box:
//   (empty)        the first variation, round and round        2x1 2x3      two cycles of no. 1, then two of no. 3, repeat
//   2xtheka 1xtihai  by name                                    1  /  2     one / two cycles of each variation in turn
//   1xp            a cycle of rest      3xs  the next variation in order     4xr  a random one
//   150bpm +2bpm -1bpm   the laya        5( … )  five times    n( … )  round and round until N
// Live: hold (P) keeps the variation playing, next (N) leaves an n( ) loop, tihai (T) puts a tihai into the next
// cycle, landing on sam. It reads the clock (clock.js) and plays into the room (room.js) with voices.js's strokes.
(function () {
const K = window.AVARTAN_CLOCK, R = window.AVARTAN_ROOM;

// ---------------------------------------------------------------- taals
const TAALS = {
  teentaal: {name: "Teentaal", vibhag: [4, 4, 4, 4], marks: ["X", "2", "0", "3"], theka: "dha dhin dhin dha | dha dhin dhin dha | dha tin tin ta | ta dhin dhin dha"},
  ektaal:   {name: "Ektaal", vibhag: [2, 2, 2, 2, 2, 2], marks: ["X", "0", "2", "0", "3", "4"], theka: "dhin dhin | dhage ti-ra-ki-ta | tu na | kat ta | dhage ti-ra-ki-ta | dhi na"},
  jhaptaal: {name: "Jhaptaal", vibhag: [2, 3, 2, 3], marks: ["X", "2", "0", "3"], theka: "dhi na | dhi dhi na | ti na | dhi dhi na"},
  rupak:    {name: "Rupak", vibhag: [3, 2, 2], marks: ["0", "1", "2"], theka: "tin tin na | dhi na | dhi na"},
  keherwa:  {name: "Keherwa", vibhag: [4, 4], marks: ["X", "0"], theka: "dha ge na ti | na ka dhi na"},
  dadra:    {name: "Dadra", vibhag: [3, 3], marks: ["X", "0"], theka: "dha dhi na | dha ti na"},
  dadra12:  {name: "Dadra 12", vibhag: [3, 3, 3, 3], marks: ["X", "0", "2", "0"], theka: "dha dhi na | dha ti na | dha dhi na | dha ti na"},   // a 12/8 bar: Dadra twice
  bhajani:  {name: "Bhajani", vibhag: [4, 4], marks: ["X", "0"], theka: "dhi-. .-na .-dhin dhin-na | tin-. .-na .-tin tin-na"},   // neonix's description, read onto 16 places; he places it exactly in the grid
  laggi:    {name: "Laggi", vibhag: [4, 4], marks: ["X", "0"], theka: "dha-ge na-ti na-ka dhi-na | ta-ke na-ti na-ka dhi-na"},
};
const beatsOf = (t) => t.vibhag.reduce((a, b) => a + b, 0);
const startsOf = (t) => t.vibhag.reduce((a, v) => a.concat(a[a.length - 1] + v), [0]).slice(0, -1);

// ---------------------------------------------------------------- bols
const matras = (line, n) => { const t = String(line).replace(/\|/g, " ").trim().split(/\s+/).filter(Boolean); while (t.length < n) t.push("."); return t.slice(0, n); };
function strokes(line, n) {                     // → [{b: beat within the cycle, bol, first: on the matra}]
  const out = [];
  matras(line, n).forEach((tk, m) => { const subs = tk.split("-"); subs.forEach((s, i) => { s = s.trim().toLowerCase(); if (s && s !== ".") out.push({b: m + i / subs.length, bol: s, first: i === 0, m}); }); });
  return out;
}
function lineOf(ev, taal) {                     // strokes → a line, each matra on the smallest even grid that holds it
  const n = beatsOf(taal), cells = [];
  for (let m = 0; m < n; m++) {
    const here = ev.filter(e => e.b >= m - 1e-6 && e.b < m + 1 - 1e-6), g = [1, 2, 4, 8].find(g => here.every(e => Math.abs((e.b - m) * g - Math.round((e.b - m) * g)) < 1e-6)) || 8;
    const slots = Array(g).fill("."); here.forEach(e => slots[Math.round((e.b - m) * g)] = e.bol);
    cells.push(here.length ? slots.join("-") : ".");
  }
  const st = startsOf(taal); return taal.vibhag.map((v, i) => cells.slice(st[i], st[i] + v).join(" ")).join(" | ");
}
// a tihai into the next sam: the line until it starts, then dha ti-ra-ki-ta dha three times; the third dha is the sam
function tihaiOf(base, taal) {
  const n = beatsOf(taal), u = n >= 12 ? 1 : .5, s0 = n - 8 * u, ev = strokes(base, n).filter(e => e.b < s0 - 1e-9);
  for (let p = 0; p < 3; p++) { const s = s0 + p * 3 * u; ev.push({b: s, bol: "dha"}, ...["ti", "ra", "ki", "ta"].map((x, i) => ({b: s + u + i * u / 4, bol: x}))); if (p < 2) ev.push({b: s + 2 * u, bol: "dha"}); }
  return lineOf(ev.sort((a, b) => a.b - b.b), taal);
}

// ---------------------------------------------------------------- the program (RiyazStudio's syntax)
function parseProgram(src) {
  const toks = String(src || "").match(/\d+\s*\(|n\s*\(|\(|\)|[^\s()]+/gi) || []; let i = 0;
  const seq = () => { const out = []; while (i < toks.length && toks[i] !== ")") { const t = toks[i++];
    if (/^(\d+|n)\s*\($/i.test(t)) { const body = seq(); i++; out.push(/^n/i.test(t) ? {loop: body} : {rep: +t.replace(/\D/g, ""), body}); }
    else if (t === "(") { const body = seq(); i++; out.push({rep: 1, body}); }
    else out.push({tok: t}); } return out; };
  const tree = seq(), ops = []; let loops = 0;
  const emit = (nodes) => nodes.forEach(nd => {
    if (nd.loop) { const id = loops++; ops.push({start: id}); emit(nd.loop); ops.push({end: id}); }
    else if (nd.body) for (let k = 0; k < nd.rep; k++) emit(nd.body);
    else { const t = nd.tok, m = t.match(/^(\d+)x(.+)$/i), b = t.match(/^([+-]?)(\d+(?:\.\d+)?)(bpm|b)$/i);
      if (m) ops.push({n: +m[1], v: m[2]}); else if (b) ops.push(b[1] ? {bpm: (b[1] === "-" ? -1 : 1) * +b[2], delta: true} : {bpm: +b[2]}); else ops.push({bad: t}); }
  });
  if (toks.length === 1 && /^[12]$/.test(toks[0])) return {each: +toks[0], ops: []};   // "1" / "2": each variation in turn
  emit(tree); return {ops};
}
class Runner {                                   // hands out the next cycle, as the program says
  constructor(prog, items) { this.prog = prog; this.items = items; this.pc = 0; this.queue = []; this.stack = []; this.serial = -1; this.breakNext = false; }
  variations() { const out = []; this.items.forEach((it, i) => { const last = out[out.length - 1]; if (last && last.name === it.name && last.end === i - 1) { last.cycles.push(i); last.end = i; last.off = last.off && it.off; } else out.push({name: it.name, cycles: [i], end: i, off: it.off}); }); return out; }
  checked() { const v = this.variations().filter(x => !x.off); return v.length ? v : this.variations(); }
  find(v) {
    const V = this.variations();
    if (/^\d+$/.test(v)) { const it = this.items[+v - 1]; return it ? [+v - 1] : null; }
    const byName = V.find(x => x.name.toLowerCase() === v.toLowerCase()); return byName ? byName.cycles : null;
  }
  next(onBpm) {
    const V = this.checked(); if (!this.variations().length) return null;
    if (this.prog.each) { if (!this.queue.length) { this.serial = (this.serial + 1) % V.length; for (let k = 0; k < this.prog.each; k++) V[this.serial].cycles.forEach((c, j) => this.queue.push({i: c, rep: k + 1, of: this.prog.each})); } return this.queue.shift(); }
    const ops = this.prog.ops;
    if (!ops.length) { if (!this.queue.length) V[0].cycles.forEach(c => this.queue.push({i: c, rep: 1, of: 1})); return this.queue.shift(); }
    for (let guard = 0; !this.queue.length && guard < ops.length * 3 + 3; guard++) {
      if (this.pc >= ops.length) this.pc = 0;
      const op = ops[this.pc++];
      if (op.bpm !== undefined) { onBpm && onBpm(op); continue; }
      if (op.start !== undefined) continue;
      if (op.end !== undefined) { if (this.breakNext) this.breakNext = false; else this.pc = ops.findIndex(o => o.start === op.end) + 1; continue; }
      if (op.bad) continue;
      const v = op.v.toLowerCase();
      if (v === "p") { for (let k = 0; k < op.n; k++) this.queue.push({rest: true, rep: k + 1, of: op.n}); continue; }
      let cyc = null;
      if (v === "s") { this.serial = (this.serial + 1) % V.length; cyc = V[this.serial].cycles; }
      else if (v === "r") cyc = V[Math.floor(Math.random() * V.length)].cycles;
      else cyc = this.find(op.v);
      if (!cyc) continue;
      for (let k = 0; k < op.n; k++) cyc.forEach(c => this.queue.push({i: c, rep: k + 1, of: op.n}));
    }
    return this.queue.shift() || {i: 0, rep: 1, of: 1};
  }
}

// ---------------------------------------------------------------- the part
class Tabla {
  constructor(root) {
    this.root = root; this.box = root.querySelector('[data-box="avartan.wire.tabla"]'); this.prog = root.querySelector('[data-role="program"]') || document.querySelector(`[data-role="program"][data-for="${root.id}"]`);
    this.taalKey = root.dataset.taal || "teentaal"; this.on = true; this.hold = false; this.tihaiArmed = false;
    this.level = .8; this.sa = 61; this.cents = 0; this.feelAmount = .6; this.lastBol = null; this.plan = new Map(); this.lastB = 0; this.bus = null; this.srcs = [];
    if (!this.box.querySelector("li")) this.write([{name: "theka", line: this.taal.theka}]);
    this.reset();
    if (this.prog) this.prog.addEventListener("change", () => this.reset(true));
    new MutationObserver(() => this.reset(true)).observe(this.box, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-name", "data-off"]});   // the bols, not how they are lit
    K.setBeats(beatsOf(this.taal)); K.on((w) => { if (w === "start") { this.plan.clear(); this.reset(); this.lastB = K.B0; } if (w === "stop") this.silence(); });
    setInterval(() => this.tick(), 25);
  }
  get taal() { return TAALS[this.taalKey] || TAALS.teentaal; }
  items() { return [...this.box.querySelectorAll("li")].map(li => ({name: (li.dataset.name || "").trim() || "cycle", line: li.textContent.trim(), off: li.dataset.off === "1", li})).filter(x => /[a-z]/i.test(x.line)); }
  write(items) { this.box.innerHTML = ""; items.forEach(x => { const li = document.createElement("li"); li.dataset.name = x.name || "cycle"; li.textContent = x.line; this.box.append(li); }); }
  reset(soft) {                                  // the program or the box changed: from the next cycle not yet planned
    this.runner = new Runner(parseProgram(this.prog ? this.prog.value : ""), this.items());
    if (soft) { const now = K.cycle(); for (const c of [...this.plan.keys()]) if (c > now) this.plan.delete(c); }
  }
  setTaal(k) { if (!TAALS[k]) return; this.taalKey = k; this.root.dataset.taal = k; this.plan.clear(); K.setBeats(beatsOf(this.taal)); this.write([{name: "theka", line: this.taal.theka}]); this.reset(); }
  planFor(c) {                                   // what plays in cycle c (decided once, in order; nothing before the first sam)
    c = Math.max(c, K.startCycle);
    if (this.plan.has(c)) return this.plan.get(c);
    const prev = this.plan.get(c - 1), items = this.items();
    let p;
    if (this.forced != null && items[this.forced]) { const i = this.forced; this.forced = null; p = {...items[i], i, rep: 1, of: 1}; }
    else if (this.tihaiArmed) { this.tihaiArmed = false; const base = prev && !prev.rest && !prev.tihai ? prev.line : (items[0] || {line: this.taal.theka}).line; p = {line: tihaiOf(base, this.taal), name: "tihai", tihai: true}; }
    else if (this.hold && prev && !prev.tihai) p = {...prev};
    else { const s = this.runner.next((op) => K.setBpm(op.delta ? K.bpm + op.bpm : op.bpm)); p = !s ? {line: this.taal.theka, name: "theka"} : s.rest ? {rest: true, name: "rest", line: "", rep: s.rep, of: s.of} : {...items[s.i], li: items[s.i].li, i: s.i, rep: s.rep, of: s.of}; }
    this.plan.set(c, p); if (this.plan.size > 64) this.plan.delete(Math.min(...this.plan.keys()));
    return p;
  }
  tick() {
    if (!K.running || !R.running() || !this.on) { this.lastB = K.B(); return; }
    const to = K.B() + .3 / K.beatS, n = beatsOf(this.taal), st = startsOf(this.taal), khali = this.taal.marks.map((m, i) => m === "0" ? st[i] : -1);
    if (!this.bus) this.bus = R.bus(-.05, this.level, "tabla");
    this.lastB = Math.max(this.lastB, K.startCycle * n);
    for (let c = Math.floor(this.lastB / n); c * n < to; c++) {
      const p = this.planFor(c); if (p.rest) continue;
      for (const e of strokes(p.line, n)) {
        const B = c * n + e.b; if (B < this.lastB || B >= to) continue;
        const t = K.at(B); if (t < R.ctx.currentTime - .01) continue;
        const acc = !e.first ? .62 : e.m === 0 ? 1 : st.includes(e.m) && !khali.includes(e.m) ? .85 : .72;
        const f = this.feel(e, acc, n, st, khali);
        try {   // the sound is made once per bol (and two ring / slide settings); the hand is a gain and a tone filter per stroke
          const at = Math.max(R.ctx.currentTime, t + f.dt), tone = R.ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = f.tone; tone.Q.value = .5; tone.connect(this.bus.input);
          const h = VOICES.play(R.ctx, tone, VOICES.stroke(R.ctx, e.bol, this.sa, VOICES.hz(this.sa - 19), 0, {cents: this.cents, ring: f.ring, slide: f.slide}), at, {gain: f.gain}); this.srcs.push({t, src: h.src});
        } catch (_) {}
      }
    }
    this.lastB = to; const now = R.ctx.currentTime; this.srcs = this.srcs.filter(x => x.t > now - 3);
  }
  // how a player plays what is written: the bols never change, only the hand. feel 0 is a machine, 1 is loose.
  //   a build toward sam, a lift on khali, sam exactly on time; a repeated bol a touch softer; no two strokes alike;
  //   sub-bols a hair behind; the bayan rings more toward sam and slides into it on the last matra
  feel(e, acc, n, st, khali) {
    const k = this.feelAmount ?? .6, pos = e.b / n, inKhali = khali.some((s0, i) => s0 >= 0 && e.m >= s0 && e.m < s0 + this.taal.vibhag[i]);
    const r = () => Math.random() * 2 - 1, gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    let gain = acc * (1 + k * .10 * pos * pos) * (inKhali ? 1 - .08 * k : 1) * (1 + k * .07 * r());
    if (e.first && this.lastBol === e.bol) gain *= 1 - .1 * k;
    this.lastBol = e.first ? e.bol : this.lastBol;
    const sam = e.first && e.m === 0, dt = sam ? 0 : k * (gauss() * .006 + (e.first ? 0 : .008));
    const bayan = /^(dha|dhin|dhi|dhun|ge|ga|ghe|dhage)$/.test(e.bol);
    return {gain, dt, tone: 2600 + 9000 * Math.max(0, Math.min(1, (gain - .5) / .6)),
            ring: bayan && pos >= .75 && k > .2 ? .65 : .5, slide: bayan && e.first && e.m === n - 1 && k > .2 ? .5 : 0};
  }
  silence() { const n = R.ctx ? R.ctx.currentTime : 0; this.srcs.forEach(x => { try { if (x.t > n) x.src.stop(0); } catch (_) {} }); this.srcs = []; }
  setLevel(v) { this.level = Math.max(0, Math.min(1.5, v)); if (this.bus) this.bus.gain.gain.setTargetAtTime(this.level, R.ctx.currentTime, .04); }
  // ---- moves (what a page, the keys, or an AI may do) and the state (what they may read)
  holdRow(i) {                                    // this row from the next cycle, held; the same row again lets the program go on
    if (this.hold && this.heldIndex === i) { this.hold = false; this.heldIndex = null; return; }
    const it = this.items()[i]; if (!it) return;
    this.heldIndex = i; this.hold = true;
    const c = K.running ? K.cycle() + 1 : Math.max(K.startCycle, Math.ceil(K.B0 / K.beats - 1e-9));
    for (const k of [...this.plan.keys()]) if (k >= c) this.plan.delete(k);
    this.plan.set(c, {...it, i, rep: 1, of: 1});
  }
  toggleHold() { this.hold = !this.hold; this.heldIndex = null; }
  setChecked(i, on) {                             // RiyazStudio's checkbox: unchecked is skipped unless the program names it; re-checked plays next
    const it = this.items()[i]; if (!it) return;
    if (on) { delete it.li.dataset.off; this.forced = i; const c = K.running ? K.cycle() : K.startCycle; for (const k of [...this.plan.keys()]) if (k > c) this.plan.delete(k); }
    else it.li.dataset.off = "1";
  }
  next() { this.runner.breakNext = true; }
  tihai() { this.tihaiArmed = true; }
  addTihai() { const first = this.items()[0]; const li = document.createElement("li"); li.dataset.name = "tihai"; li.textContent = tihaiOf(first ? first.line : this.taal.theka, this.taal); this.box.append(li); }
  setProgram(src) { if (this.prog) this.prog.value = src; this.reset(true); }
  state() {
    const n = this.now(), p = n.plan, t = this.taal;
    return {playing: K.running, bpm: Math.round(K.bpm), cycle: K.running ? n.cycle - K.startCycle + 1 : null, beat: K.running ? n.beat : null,
            taal: {key: this.taalKey, name: t.name, beats: beatsOf(t), vibhag: t.vibhag, marks: t.marks},
            line: p ? (p.rest ? "" : p.line) : (this.items()[0] || {line: t.theka}).line, name: p ? (p.rest ? "rest" : p.name) : null,
            row: p && p.i !== undefined ? p.i : null, rep: p ? p.rep : null, of: p ? p.of : null, tihai: !!(p && p.tihai),
            held: this.hold, heldRow: this.heldIndex ?? null, tihaiArmed: this.tihaiArmed, level: this.level, sa: this.sa, cents: this.cents,
            program: this.prog ? this.prog.value : "", rows: this.items().map(({name, line, off}) => ({name, line, off}))};
  }
  now() { const c = Math.max(K.cycle(), K.startCycle), B = Math.max(K.B(), K.startCycle * beatsOf(this.taal)); return {cycle: c, beat: Math.floor(B - c * beatsOf(this.taal)), plan: K.running ? this.planFor(c) : null}; }
}

window.AVARTAN_TABLA = {TAALS, beatsOf, startsOf, matras, strokes, tihaiOf, lineOf, parseProgram, Runner, Tabla};
})();
