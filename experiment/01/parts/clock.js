// clock.js · the cycle: beats on the wall clock. Paused, it holds still; it always starts on sam.
// Parts read it (B, cycle, at) and never own it. Nothing else lives here.
(function () {
if (window.AVARTAN_CLOCK) return;
const K = window.AVARTAN_CLOCK = {bpm: 80, beats: 16, running: false, B0: 0, w0: 0, startCycle: 0, heard: [],
  get beatS() { return 60 / this.bpm; },
  B(w = performance.now()) { return this.running ? this.B0 + (w - this.w0) / 1000 / this.beatS : this.B0; },
  wallOf(B) { return this.w0 + (B - this.B0) * this.beatS * 1000; },
  cycle() { return Math.floor(this.B() / this.beats); },
  // the audio time of beat B (needs the room)
  at(B) { const c = window.AVARTAN_ROOM && AVARTAN_ROOM.ctx; return c ? c.currentTime + (this.wallOf(B) - performance.now()) / 1000 : 0; },
  setBpm(b) { const now = performance.now(); if (this.running) { this.B0 = this.B(now); this.w0 = now; } this.bpm = Math.max(20, Math.min(400, b)); this.tell("bpm"); },
  setBeats(n) { if (this.running) this.stop(); this.beats = n; this.B0 = 0; this.tell("beats"); },
  start() { this.B0 = Math.ceil(this.B0 / this.beats - 1e-9) * this.beats; this.w0 = performance.now() + 80; this.running = true; this.startCycle = this.B0 / this.beats; this.tell("start"); },
  stop() { this.B0 = this.B(); this.running = false; this.tell("stop"); },
  taps: [],
  tap() {                                         // tap 3 or more times at the new speed (RiyazStudio's B)
    const t = performance.now(); this.taps = this.taps.filter(x => t - x < 2500).concat(t);
    const g = this.taps.slice(1).map((x, i) => x - this.taps[i]).filter(g => g > 150 && g < 2000);
    if (this.taps.length >= 3 && g.length) this.setBpm(Math.round(60000 / (g.reduce((a, b) => a + b, 0) / g.length)));
  },
  toggle() { if (this.running) this.stop(); else this.start(); },
  on(fn) { this.heard.push(fn); }, tell(what) { this.heard.forEach(f => { try { f(what); } catch (_) {} }); },
};
})();
