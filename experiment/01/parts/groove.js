// groove.js · a filler you switch on: Manjira (the small cymbals: open ring and closed chik) or Shaker. A simple groove
// on the cycle's beats; two patterns each. Sounds are made here, small and short.
(function () {
const K = window.AVARTAN_CLOCK, R = window.AVARTAN_ROOM, bufs = {};
function make(kind) {
  if (bufs[kind]) return bufs[kind]; const c = R.ctx, sr = c.sampleRate;
  if (kind === "shaker") { const len = sr * .09, b = c.createBuffer(1, len, sr), d = b.getChannelData(0); let lp = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; lp += (w - lp) * .55; const env = Math.min(1, i / (sr * .006)) * Math.exp(-i / (sr * .028)); d[i] = (w - lp) * env * .7; } return bufs[kind] = b; }
  const open = kind === "open", len = sr * (open ? 1.6 : .14), b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
  const parts = [[2630, 1], [3870, .7], [5250, .55], [6960, .4], [8410, .25]].map(([f, a]) => [f * (1 + (Math.random() - .5) * .01), a]);
  for (let i = 0; i < len; i++) { const t = i / sr; let s = 0; for (const [f, a] of parts) s += a * Math.sin(2 * Math.PI * f * t); d[i] = s * Math.exp(-t / (open ? .45 : .035)) * .16 * Math.min(1, i / (sr * .001)); }
  return bufs[kind] = b;
}
const PATTERNS = {                                 // simple → complex (the XY pad's x picks one; it changes on the next sam)
  manjira: [{name: "on sam", at: (k) => k === 0 ? [[0, "open", 1]] : []},
            {name: "on the vibhags", at: (k, vib) => vib.includes(k) ? [[0, "open", k === 0 ? 1 : .8]] : []},
            {name: "ching chak", at: (k) => [[0, k % 2 ? "closed" : "open", k % 2 ? .6 : .9]]},
            {name: "ching chak, off-beats", at: (k) => [[0, k % 2 ? "closed" : "open", k % 2 ? .6 : .9], [.5, "closed", .35]]},
            {name: "rolling", at: (k, vib) => [[0, vib.includes(k) ? "open" : "closed", vib.includes(k) ? .9 : .55], [.25, "closed", .25], [.5, "closed", .4], [.75, "closed", .25]]}],
  shaker:  [{name: "quarters", at: () => [[0, "shaker", .75]]},
            {name: "eighths", at: () => [[0, "shaker", .8], [.5, "shaker", .45]]},
            {name: "eighths, pushed", at: () => [[0, "shaker", .8], [.5, "shaker", .5], [.75, "shaker", .3]]},
            {name: "sixteenths", at: () => [[0, "shaker", .8], [.25, "shaker", .35], [.5, "shaker", .55], [.75, "shaker", .35]]},
            {name: "sixteenths, accents", at: (k, vib) => [[0, "shaker", vib.includes(k) ? 1 : .7], [.25, "shaker", .3], [.5, "shaker", .65], [.75, "shaker", .4]]}],
};
class Groove {
  constructor(kind, {pan = 0, level = .6} = {}) { Object.assign(this, {kind, pan, level}); this.on = false; this.pattern = 0; this.next = null; this.lastB = 0; this.bus = null; this.vibhag = [4, 4, 4, 4]; }
  get patterns() { return PATTERNS[this.kind]; }
  toggle() { R.open(); this.on = !this.on; this.lastB = Math.max(K.B(), K.running ? Math.ceil(K.B()) : 0); }
  setOn(on) { if (!!on !== this.on) this.toggle(); }
  busy(x) { const i = Math.round(Math.max(0, Math.min(1, x)) * (this.patterns.length - 1)); if (i === this.pattern) { this.next = null; return; } if (!this.on || !K.running) this.pattern = i; else this.next = i; }   // from the next sam
  setLevel(v) { this.level = Math.max(0, Math.min(1.5, v)); if (this.bus) this.bus.gain.gain.setTargetAtTime(this.level, R.ctx.currentTime, .04); }
  tick() {
    if (!this.on || !K.running || !R.running()) { this.lastB = K.B(); return; }
    const n = this.vibhag.reduce((a, b) => a + b, 0), starts = this.vibhag.reduce((a, v) => a.concat(a[a.length - 1] + v), [0]).slice(0, -1);
    const to = K.B() + .3 / K.beatS; if (!this.bus) this.bus = R.bus(this.pan, this.level);
    for (let B = Math.floor(Math.max(this.lastB, K.startCycle * n)); B < to; B++) {
      const k = ((B % n) + n) % n; if (k === 0 && this.next != null) { this.pattern = this.next; this.next = null; }
      for (const [off, s, g] of this.patterns[this.pattern].at(k, starts)) { const at = B + off; if (at < this.lastB || at >= to) continue; const t = K.at(at); if (t < R.ctx.currentTime - .01) continue;
        const src = R.ctx.createBufferSource(), gn = R.ctx.createGain(); src.buffer = make(s); gn.gain.value = g; src.connect(gn).connect(this.bus.input); src.start(t); }
    }
    this.lastB = to;
  }
}
window.AVARTAN_GROOVE = Groove;
})();
