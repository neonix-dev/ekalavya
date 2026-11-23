// tanpura.js · the tanpura: its own steady pace from on to off, never the tabla's. Pa (or Ma, Ni) · Sa · Sa · kharaj Sa,
// 1.15 s apart, a breath after the low string. Knows the room and voices.js; not the clock.
(function () {
const R = window.AVARTAN_ROOM, GAPS = [1.15, 1.15, 1.15, 2.0], FIRST = {Pa: -5, Ma: -7, Ni: -1};
window.AVARTAN_TANPURA = {on: false, first: "Pa", sa: 61, level: .5, next: 0, k: 0, bus: null, srcs: [],
  toggle() { R.open(); this.on = !this.on; if (this.on) { this.next = 0; this.k = 0; } else this.silence(); },
  silence() { const n = R.ctx ? R.ctx.currentTime : 0; this.srcs.forEach(x => { try { x.gain.gain.setTargetAtTime(.0001, n, .3); } catch (_) {} }); this.srcs = []; },
  setLevel(v) { this.level = Math.max(0, Math.min(1.5, v)); if (this.bus) this.bus.gain.gain.setTargetAtTime(this.level, R.ctx.currentTime, .05); },
  tick() {
    if (!this.on || !R.running()) return;
    if (!this.bus) this.bus = R.bus(.25, this.level, "tanpura");
    const now = R.ctx.currentTime; if (this.next < now) { this.next = now + .05; this.k = 0; }
    const order = [FIRST[this.first] ?? -5, 0, 0, -12];
    while (this.next < now + .3) {
      try { this.srcs.push(VOICES.play(R.ctx, this.bus.input, VOICES.tanpura(R.ctx, this.sa - 12 + order[this.k % 4]), this.next, {gain: .5})); } catch (_) {}
      this.next += GAPS[this.k % 4]; this.k++; this.srcs = this.srcs.slice(-8);
    }
  }};
setInterval(() => window.AVARTAN_TANPURA.tick(), 40);
})();
