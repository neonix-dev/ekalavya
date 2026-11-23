// stage.js · the score and the seats. The score lives in the DOM; whatever is written there plays.
//
//   <main id="stage" data-cycle data-beat data-beats data-running data-bpm data-sa>      where the cycle is, always
//     <section data-seat="sitar" data-at="left|center|right" data-sound="sitar"
//              data-loop-seat data-loop-from data-loop-to data-loop-anchor data-muted>    a seat and its place
//       <ol data-score="sitar">
//         <li data-c="41" data-at="2.5" data-m="61" data-d="1" data-v="0.8" data-by="hand|loop|claude|…">S</li>
//
// A note is an li: cycle (data-c), beat in the cycle from sam (data-at, decimals between beats), pitch (data-m, MIDI;
// or data-swar "S" "P," "S'" read from the page's Sa), length in beats (data-d), loudness 0..1 (data-v). The player
// plays every li when the clock reaches it: write one for an avartan still ahead and it plays then, paused or live.
// data-by="hand" is what his MIDI played (heard already, never replayed); data-by="loop" are copies the looper writes.
//
// Seats: whatever sits at center takes his MIDI hand; what he plays there is written to that seat's score. Move a seat
// (set its data-at; the one already there takes the place it left) and its score goes with it. A seat with a loop
// keeps playing it, wherever it is, by writing the loop's notes into its own score a little ahead; anything else written
// takes the loop's place (an AI's note: the rest of that cycle; his hand: from its beat until 4 beats after he lets go).
// Leaving the centre, a seat loops the newest phrase played on it. Knows no page layout, no tabla, no knobs.
(function () {
const K = window.AVARTAN_CLOCK, R = window.AVARTAN_ROOM, N = window.AVARTAN_NOTATION, E = window.AVARTAN_EAR;
const PLACES = ["left", "center", "right"], PAN = {left: -.45, center: 0, right: .45};
const SF = (s) => (E.SOUND[s] || E.SOUND.piano);

class Seat {
  constructor(el, stage) {
    this.el = el; this.stage = stage; this.ol = el.querySelector("ol[data-score]"); this.idx = []; this.dirty = true;
    this.lastB = null; this.bus = null; this.level = .8; this.mul = 1; this.srcs = []; this.loopDone = new Set(); this.open = new Map();
    new MutationObserver((ms) => { this.dirty = true; stage.wrote(this, ms); }).observe(this.ol, {childList: true, subtree: true, attributes: true, characterData: true});
  }
  get name() { return this.el.dataset.seat; }
  get at() { return this.el.dataset.at; }
  get sound() { return this.el.dataset.sound || "piano"; }
  get oct() { return +this.el.dataset.oct || 0; }
  get muted() { return this.el.dataset.muted === "1"; }
  get loop() { const d = this.el.dataset; if (d.loopFrom == null || d.loopFrom === "") return null; return {seat: d.loopSeat || this.name, from: +d.loopFrom, to: +d.loopTo, anchor: d.loopAnchor != null && d.loopAnchor !== "" ? +d.loopAnchor : +d.loopTo + 1}; }
  setLoop(l) { const d = this.el.dataset; this.loopDone.clear();
    if (!l) { ["loopSeat", "loopFrom", "loopTo", "loopAnchor"].forEach(k => delete d[k]); this.clearLoopAhead(); return; }
    d.loopSeat = l.seat || this.name; d.loopFrom = l.from; d.loopTo = l.to; d.loopAnchor = l.anchor != null ? l.anchor : l.to + 1; this.clearLoopAhead(); }
  read(li) {
    const n = this.stage.beats, c = +li.dataset.c, at = +li.dataset.at; if (!isFinite(c) || !isFinite(at)) return null;
    let m = li.dataset.m !== undefined && li.dataset.m !== "" ? +li.dataset.m : NaN;
    if (!isFinite(m) && li.dataset.swar) m = E.sa + this.oct + N.semOf(li.dataset.swar.trim());
    if (!isFinite(m)) return null;
    return {B: c * n + at, c, at, m, d: Math.max(.05, +li.dataset.d || .5), v: li.dataset.v ? Math.max(0, Math.min(1, +li.dataset.v)) : .8, by: li.dataset.by || "", li};
  }
  notes() { if (this.dirty) { this.idx = [...this.ol.children].map(li => this.read(li)).filter(Boolean).sort((a, b) => a.B - b.B); this.dirty = false; } return this.idx; }
  inCycle(c) { return this.notes().filter(x => x.c === c); }
  write(x) {                                         // a note → an li (its text is the swar, for the eye)
    const li = document.createElement("li"), d = li.dataset;
    d.c = x.c; d.at = +(+x.at).toFixed(3); if (x.m != null) d.m = Math.round(x.m); if (x.swar) d.swar = x.swar; d.d = +(+(x.d ?? .5)).toFixed(3); d.v = +(+(x.v ?? .8)).toFixed(2); d.by = x.by || "page";
    li.textContent = x.swar || (x.m != null ? N.swarOf(Math.round(x.m) - E.sa) : "");
    this.ol.append(li);
    // written after the player passed its moment (just ahead, or a moment late: a seat moved on the sam): send it ourselves
    if (d.by !== "hand" && K.running && R.running() && this.lastB !== null) { const B = x.c * this.stage.beats + +x.at, nowB = K.B();
      if (B < this.lastB && B > nowB - .5) { const y = this.read(li), t = Math.max(R.ctx.currentTime + .005, K.at(B));   // the player has passed it: send it ourselves
        if (y) { const h = SAMPLER.play(R.ctx, this.busNode(), SF(this.sound), y.m, t, {gain: (.35 + .65 * y.v) * 2.4, dur: Math.max(.05, y.d - Math.max(0, nowB - B)) * K.beatS, detune: this.stage.cents}); if (h) this.srcs.push({t, h, li}); } } }
    return li;
  }
  quiet(B0, B1) {                                    // the loop keeps away from B0 to B1 (its notes go, and any already sent to the speakers)
    const gone = new Set(); for (const x of this.notes()) if (x.by === "loop" && x.B >= B0 && x.B < B1) { gone.add(x.li); x.li.remove(); }
    if (gone.size && R.ctx) { const now = R.ctx.currentTime; this.srcs.forEach(x => { if (gone.has(x.li) && x.t > now - .02) try { x.h.src.stop(0); } catch (_) {} }); }
  }
  clearLoopAhead() { const now = K.B(); for (const x of this.notes()) if (x.by === "loop" && x.B >= now) x.li.remove(); }
  vol() { return this.muted ? 0 : this.level * this.mul; }
  apply() { if (!this.bus) return; const t = R.ctx.currentTime; this.bus.gain.gain.setTargetAtTime(this.vol(), t, .06); this.bus.pan.pan.setTargetAtTime(PAN[this.at] ?? 0, t, .1); }
  busNode() { if (!this.bus) { this.bus = R.bus(PAN[this.at] ?? 0, this.vol()); } return this.bus.input; }
  // ---- the looper: a beat before each cycle, write the loop's notes into it (unless something else plays there)
  looper() {
    const l = this.loop; if (!l || !K.running) return; const n = this.stage.beats, src = this.stage.seat(l.seat) || this, len = l.to - l.from + 1; if (len < 1) return;
    const upto = Math.floor((K.B() + 2 + .5 / K.beatS) / n);   // written well before the player reaches it
    for (let k = Math.max(K.cycle(), l.anchor); k <= upto; k++) {
      if (this.loopDone.has(k)) continue; this.loopDone.add(k);
      if (src === this && k >= l.from && k <= l.to) continue;
      if (this.notes().some(x => x.c === k && x.by !== "loop" && x.by !== "hand")) continue;   // something written there (an AI): that cycle is its
      const from = l.from + (((k - l.anchor) % len) + len) % len;
      for (const x of src.inCycle(from)) this.write({c: k, at: x.at, m: x.m, d: x.d, v: x.v, by: "loop"});
    }
    if (this.loopDone.size > 256) this.loopDone = new Set([...this.loopDone].slice(-64));
  }
  // ---- the player: every li the clock reaches (his hand's notes were heard as he played them)
  tick() {
    if (!K.running || !R.running()) { this.lastB = K.B(); return; }
    if (this.lastB === null) this.lastB = K.B();
    const to = K.B() + .3 / K.beatS, ns = this.notes(), sf = SF(this.sound), dest = this.busNode(), now = R.ctx.currentTime;
    let lo = 0, hi = ns.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (ns[mid].B < this.lastB) lo = mid + 1; else hi = mid; }
    for (let i = lo; i < ns.length && ns[i].B < to; i++) { const x = ns[i]; if (x.by === "hand") continue; const t = K.at(x.B); if (t < now - .01) continue;
      const h = SAMPLER.play(R.ctx, dest, sf, x.m, t, {gain: (.35 + .65 * x.v) * 2.4, dur: x.d * K.beatS, detune: this.stage.cents}); if (h) this.srcs.push({t, h, li: x.li}); }
    this.lastB = to; this.srcs = this.srcs.filter(x => x.t > now - 8);
  }
  cut() { const n = R.ctx ? R.ctx.currentTime : 0; this.srcs.forEach(x => { try { if (x.t > n) x.h.src.stop(0); else x.h.gain.gain.setTargetAtTime(.0001, n, .08); } catch (_) {} }); this.srcs = []; this.lastB = null; }
  // the newest phrase played here (not by the looper): a run of cycles one after another
  phrase() { const cs = [...new Set(this.notes().filter(x => x.by !== "loop").map(x => x.c))].sort((a, b) => a - b); if (!cs.length) return null;
    let to = cs[cs.length - 1], from = to; for (let i = cs.length - 2; i >= 0 && cs[i] === from - 1; i--) from = cs[i]; return {from, to}; }
  phrases() { const cs = [...new Set(this.notes().filter(x => x.by !== "loop").map(x => x.c))].sort((a, b) => a - b), out = [];
    for (const c of cs) { const l = out[out.length - 1]; if (l && c === l.to + 1) l.to = c; else out.push({from: c, to: c}); } return out; }
  lines(from, to) { const n = this.stage.beats, out = []; for (let c = from; c <= to; c++) out.push(N.format(this.inCycle(c).map(x => ({b: x.at, n: x.m - E.sa - this.oct, d: x.d})), n, this.stage.vibhag)); return out; }
  setLines(from, lines) {                            // sargam text back into the score, a line a cycle (replacing those cycles)
    const n = this.stage.beats; lines.forEach((l, i) => { const c = from + i; this.inCycle(c).forEach(x => x.li.remove());
      N.parse(l, n).forEach(x => this.write({c, at: x.b, m: E.sa + this.oct + x.n, d: x.d, v: .8, by: "edit"})); });
  }
  removeCycle(c) { this.inCycle(c).forEach(x => x.li.remove()); }
  state() { const l = this.loop, held = this.at === "center" && E.held.size;
    return {seat: this.name, at: this.at, sound: this.sound, muted: this.muted, loop: l, doing: this.muted ? "muted" : held ? "your hand" : l ? `loops ${l.to - l.from + 1} cycle${l.to > l.from ? "s" : ""}` : this.at === "center" ? "your hand" : "empty"}; }
}

const S = window.AVARTAN_STAGE = {
  el: null, seats: [], vibhag: [4, 4, 4, 4], cents: 0, heard: [],
  get beats() { return this.vibhag.reduce((a, b) => a + b, 0); },
  attach(el) {
    this.el = el; this.seats = [...el.querySelectorAll("[data-seat]")].map(x => new Seat(x, this)); this.prevAt = new Map(this.seats.map(s => [s, s.at]));
    new MutationObserver((ms) => ms.forEach(m => { const s = this.seats.find(x => x.el === m.target); if (s && m.attributeName === "data-at") this.placed(s, m.oldValue); if (s && m.attributeName === "data-muted") s.apply(); }))
      .observe(el, {attributes: true, subtree: true, attributeOldValue: true, attributeFilter: ["data-at", "data-muted"]});
    E.dest = () => { const c = this.center(); return c ? c.busNode() : null; };
    this.route(); return this;
  },
  on(f) { this.heard.push(f); }, tell(w) { this.heard.forEach(f => { try { f(w); } catch (_) {} }); },
  seat(name) { return this.seats.find(s => s.name === name); },
  atPlace(p) { return this.seats.find(s => s.at === p); },
  center() { return this.atPlace("center"); },
  // a seat moved (its data-at changed): the seat that was there takes the place it left; scores travel with seats
  placed(s, from) {
    if (this.fixing) return; const to = s.at; if (!PLACES.includes(to)) { this.fixing = true; s.el.dataset.at = from; this.fixing = false; return; }
    const other = this.seats.find(x => x !== s && x.at === to); this.fixing = true; if (other) other.el.dataset.at = from; this.fixing = false;
    for (const x of [s, other].filter(Boolean)) { if (this.prevAt.get(x) === "center" && x.at !== "center") this.leaveCenter(x); this.prevAt.set(x, x.at); x.apply(); }
    this.route(); this.tell("moved");
  },
  leaveCenter(s) {                                   // leaving the centre: it loops the newest phrase played on it
    const p = s.phrase(), l = s.loop; if (p && (!l || l.seat !== s.name || p.to > l.to)) s.setLoop({seat: s.name, from: p.from, to: p.to, anchor: p.to + 1});
  },
  route() { const c = this.center(); if (c) E.sound = c.sound; },
  move(name, to) { const s = this.seat(name); if (s && PLACES.includes(to)) s.el.dataset.at = to; },
  swap(a, b) { const x = this.seat(a), y = this.seat(b); if (x && y) x.el.dataset.at = y.at; },
  rotate(dir = 1) { const order = PLACES.map(p => this.atPlace(p)); order.forEach((s, i) => { this.fixing = true; s.el.dataset.at = PLACES[(i + dir + 3) % 3]; this.fixing = false; });
    for (const s of order) { if (this.prevAt.get(s) === "center" && s.at !== "center") this.leaveCenter(s); this.prevAt.set(s, s.at); s.apply(); } this.route(); this.tell("moved"); },
  // something was written into a score: anything not the looper's takes the loop's place. His hand: from its beat until
  // a vibhag (4 beats) after he lets go; then the loop comes straight back. Anything else: the rest of that cycle.
  wrote(seat, ms) {
    for (const m of ms) for (const li of m.addedNodes || []) {
      if (li.nodeType !== 1 || li.dataset.by === "loop") continue; const c = +li.dataset.c, at = +li.dataset.at || 0; if (!isFinite(c)) continue;
      if (li.dataset.by === "hand") seat.quiet(c * this.beats + at - .05, c * this.beats + at + 4);
      else for (const x of seat.notes()) if (x.by === "loop" && x.c === c && x.at >= at - .05) x.li.remove();
    }
    this.tell("wrote");
  },
  // his hand: what the centre seat's MIDI plays, written as it is played
  hand(e) {
    const s = this.center(); if (!s || !K.running) return; const n = this.beats;
    if (e.type === "on") { const c = Math.floor((e.B + .15) / n), li = s.write({c, at: Math.max(0, e.B - c * n), m: e.m, d: .25, v: e.v, by: "hand"}); s.open.set(e.m, {li, B: e.B}); }
    if (e.type === "off") { for (const x of this.seats) { const o = x.open.get(e.m); if (o) { o.li.dataset.d = Math.max(.1, +(e.B - o.B).toFixed(3)); x.open.delete(e.m); x.quiet(K.B(), K.B() + 4); } } }
  },
  tick() { for (const s of this.seats) { s.looper(); if (s.open.size && K.running) s.quiet(K.B(), K.B() + 4); s.tick(); } },   // a held note keeps the loop away
  stop() { this.seats.forEach(s => { s.cut(); s.open.clear(); }); },
  prune(keep = 96) { const c0 = K.cycle() - keep; for (const s of this.seats) for (const x of s.notes()) if (x.by === "loop" && x.c < c0) x.li.remove(); },
  // the whole stage as MIDI: a channel a seat, silent stretches squeezed to one empty cycle
  midi() {
    const n = this.beats, all = this.seats.flatMap((s, ch) => s.notes().map(x => ({...x, ch}))), cycles = [...new Set(all.map(x => x.c))].sort((a, b) => a - b), map = new Map(); let k = 0, prev = null;
    for (const c of cycles) { if (prev !== null && c > prev + 1) k++; map.set(c, k++); prev = c; }
    const PPQ = 480, ev = [];
    for (const x of all) { const b = map.get(x.c) * n + x.at, t0 = Math.max(0, Math.round(b * PPQ)), t1 = Math.round((b + x.d) * PPQ); ev.push([t0, 0x90 | x.ch, x.m, Math.max(1, Math.round(x.v * 127))], [t1, 0x80 | x.ch, x.m, 0]); }
    ev.sort((a, b) => a[0] - b[0] || ((a[1] & 0xf0) === 0x80 ? -1 : 1));
    const vlq = (v) => { const b = [v & 127]; while ((v >>= 7)) b.unshift((v & 127) | 128); return b; };
    const us = Math.round(60e6 / K.bpm), body = [0, 0xff, 0x51, 3, us >> 16 & 255, us >> 8 & 255, us & 255]; let t = 0;
    for (const [tt, st, d1, d2] of ev) { body.push(...vlq(tt - t), st, d1, d2); t = tt; } body.push(0, 0xff, 0x2f, 0);
    const len = body.length, hdr = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, PPQ >> 8, PPQ & 255, 0x4d, 0x54, 0x72, 0x6b, len >>> 24 & 255, len >> 16 & 255, len >> 8 & 255, len & 255];
    return new Uint8Array(hdr.concat(body));
  },
  // what any seat (an AI) needs to know, also written on the stage element as data-*
  now() { const n = this.beats, B = K.B(), c = Math.floor(B / n); return {running: K.running, cycle: c, beat: Math.floor(B - c * n) + 1, at: +(B - c * n).toFixed(3), beats: n, vibhag: this.vibhag, bpm: Math.round(K.bpm), sa: E.sa}; },
};
E.on((e) => S.hand(e));
K.on((w) => { if (w === "stop") S.stop(); if (w === "start") S.seats.forEach(s => { s.lastB = null; s.loopDone.clear(); }); });
setInterval(() => S.tick(), 25);
setInterval(() => S.prune(), 10000);
})();
