// ear.js · you: the MIDI keyboard (every input but the Pico) and any on-screen piano, heard through a sampled sound.
// It tells whoever listens (on) about every note, with its beat on the clock. It keeps nothing.
(function () {
const R = window.AVARTAN_ROOM, K = window.AVARTAN_CLOCK;
const SOUND = {piano: "acoustic_grand_piano", sitar: "sitar", santoor: "dulcimer", bansuri: "flute", harmonium: "reed_organ", shehnai: "shanai", guitar: "acoustic_guitar_nylon"};
const E = window.AVARTAN_EAR = {sound: "piano", level: .9, sa: 61, cents: 0, held: new Map(), heard: [], bus: null, inputs: [],
  SOUND,
  on(fn) { this.heard.push(fn); },
  tell(e) { this.heard.forEach(f => { try { f(e); } catch (_) {} }); },
  noteOn(m, v = .8) {
    R.open(); if (this.held.has(m)) this.noteOff(m);
    if (!this.bus) this.bus = R.bus(0, this.level);
    const out = (this.dest && this.dest()) || this.bus.input;   // the stage routes your hand into the seat in the centre
    const h = R.running() ? SAMPLER.play(R.ctx, out, SOUND[this.sound] || SOUND.piano, m, R.ctx.currentTime, {gain: (.35 + .65 * v) * 2.4, detune: this.cents}) : null;
    const e = {type: "on", m, v, B: K.B(), at: performance.now()}; this.held.set(m, {h, e}); this.tell(e);
  },
  noteOff(m) {
    const o = this.held.get(m); if (!o) return; this.held.delete(m);
    if (o.h) { const t = R.ctx.currentTime; o.h.gain.gain.setTargetAtTime(.0001, t + .02, .15); try { o.h.src.stop(t + 1.2); } catch (_) {} }
    this.tell({type: "off", m, B: K.B(), at: performance.now(), on: o.e});
  },
  setLevel(v) { this.level = Math.max(0, Math.min(1.5, v)); if (this.bus) this.bus.gain.gain.setTargetAtTime(this.level, R.ctx.currentTime, .04); },
  warm() { if (!R.ctx) return; const ns = []; for (let m = this.sa - 12; m <= this.sa + 24; m++) ns.push(m); SAMPLER.warm(R.ctx, SOUND[this.sound] || SOUND.piano, ns); },
  async midi() {                                    // → the names of the keyboards heard ("" if none, null if no MIDI here)
    if (!navigator.requestMIDIAccess) return null;
    const acc = await navigator.requestMIDIAccess();
    const bind = () => { this.inputs = [];
      acc.inputs.forEach(inp => { if (/pico/i.test(inp.name)) { this.pico = inp.name; inp.onmidimessage = (e) => { const [st, d1, d2] = e.data; this.tell({type: "pico", st, d1, d2}); }; return; }   // the Pico is a panel: its turns and presses go to whoever listens
        this.inputs.push(inp.name.replace(/^KOMPLETE KONTROL /i, ""));
        inp.onmidimessage = (e) => { const [st, d1, d2] = e.data, k = st & 0xf0; if (k === 0x90 && d2 > 0) this.noteOn(d1, d2 / 127); else if (k === 0x80 || k === 0x90) this.noteOff(d1);
          else if (k === 0xb0) this.tell({type: "cc", ch: st & 15, cc: d1, v: d2, input: inp.name}); }; });   // knobs and the wheel: whoever listens maps them
      this.tell({type: "inputs", names: this.inputs}); };
    bind(); acc.onstatechange = bind; return this.inputs.join(", ");
  }};
})();
