// room.js · the sound room: one AudioContext, a master, a little air. Made on the first touch (a browser rule).
// Any part plays into AVARTAN_ROOM.bus(...). Nothing else lives here.
(function () {
if (window.AVARTAN_ROOM) return;
const R = window.AVARTAN_ROOM = {ctx: null, master: null, verb: null, volume: .85,
  open() {
    if (R.ctx) { if (R.ctx.state !== "running") R.ctx.resume(); return R.ctx; }
    const c = R.ctx = new AudioContext();
    R.master = c.createGain(); R.master.gain.value = Math.pow(R.volume, 1.6);
    const lim = c.createDynamicsCompressor(); lim.threshold.value = -8; lim.ratio.value = 8; lim.attack.value = .004; lim.release.value = .25;
    R.master.connect(lim).connect(c.destination);
    R.verb = c.createConvolver(); const len = c.sampleRate * 1.8, b = c.createBuffer(2, len, c.sampleRate);
    for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    R.verb.buffer = b; const wet = c.createGain(); wet.gain.value = .12; R.verb.connect(wet).connect(R.master);
    c.resume(); return c;
  },
  running() { return !!R.ctx && R.ctx.state === "running"; },
  // a seat in the room: its body (voices.js), its place, its level
  bus(pan = 0, level = 1, body = null) {
    const c = R.open(), g = c.createGain(), p = c.createStereoPanner(), send = c.createGain();
    g.gain.value = level; p.pan.value = pan; send.gain.value = .5;
    let input = g; if (body && window.VOICES) { const bd = VOICES.body(c, body); bd.output.connect(g); input = bd.input; }
    g.connect(p).connect(R.master); p.connect(send).connect(R.verb);
    return {input, gain: g, pan: p};
  },
  setVolume(v) { R.volume = v; if (R.master) R.master.gain.setTargetAtTime(Math.pow(v, 1.6), R.ctx.currentTime, .03); },
};
})();
