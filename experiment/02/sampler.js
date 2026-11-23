// sampler.js: real recorded instruments (General MIDI soundfonts, MusyngKite set by Benjamin Gleitzman's
// midi-js-soundfonts, CC BY-SA 3.0), loaded once by the browser, decoded note by note as they are needed.
(function () {
const BASE = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/";
const NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const noteName = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const banks = {};                                    // name → {raw: {A0: dataURL}, buf: {midi: AudioBuffer}, pending: {midi: Promise}, ready, error}

function load(name) {
  if (banks[name]) return banks[name].loading;
  const b = banks[name] = {raw: null, buf: {}, pending: {}, ready: false, error: null};
  b.loading = fetch(BASE + name + "-mp3.js").then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).then(t => {
    const raw = {}, re = /"([A-G]b?-?\d)":\s*"(data:audio\/[^"]+)"/g; let m;
    while ((m = re.exec(t))) raw[m[1]] = m[2];
    b.raw = raw; b.ready = true;
  }).catch(e => { b.error = e; });
  return b.loading;
}
function decode(ctx, name, m) {
  const b = banks[name]; if (!b || !b.ready) return null;
  if (b.buf[m]) return Promise.resolve(b.buf[m]);
  if (b.pending[m]) return b.pending[m];
  const url = b.raw[noteName(m)]; if (!url) return null;
  const bin = atob(url.slice(url.indexOf(",") + 1)), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return b.pending[m] = ctx.decodeAudioData(u.buffer).then(x => (b.buf[m] = x));
}
// get the notes ready before they are needed
function warm(ctx, name, notes) { return load(name).then(() => Promise.all([...new Set(notes)].map(m => decode(ctx, name, m)).filter(Boolean))); }
// play midi note m at time t; dur seconds (null: until stopped). Returns {src, gain} or null when not decoded yet.
function play(ctx, dest, name, m, t, {gain = 1, dur = null, release = .35, detune = 0} = {}) {
  const b = banks[name]; if (!b || !b.buf[m]) { if (b && b.ready) decode(ctx, name, m); else load(name); return null; }
  const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b.buf[m]; s.detune.value = detune;   // fine tuning, in cents
  g.gain.setValueAtTime(gain, t); s.connect(g).connect(dest); s.start(t);
  if (dur !== null) { g.gain.setValueAtTime(gain, t + dur); g.gain.setTargetAtTime(.0001, t + dur, release / 3); s.stop(t + dur + release * 2); }
  return {src: s, gain: g};
}
const status = (name) => !banks[name] ? "not loaded" : banks[name].error ? "could not load" : banks[name].ready ? "ready" : "loading";
window.SAMPLER = {load, warm, play, status};
})();
