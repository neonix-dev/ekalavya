// voices.js: the instruments' sound, modelled rather than synthesised from bare oscillators.
// sitar: a plucked string (Karplus-Strong) with the jawari bridge's buzz and the taraf (sympathetic strings) tuned
//        to the raga; tanpura: a long string whose overtones swell and sweep upward (the jivari shimmer);
// tabla: each stroke from the drum's own modes (the dayan's harmonic syahi, the bayan's low membrane and its slide);
// flute: a bansuri, breath and tone, scooped into the note, the vibrato arriving late.
// Strings and drums are rendered once per pitch into buffers and kept; the flute plays live.
(function () {
  const cache = new Map();
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- a plucked string, with an optional bridge (jawari) and strings that ring in sympathy
  function string(sr, f, dur, o) {
    const N = Math.floor(sr * dur), out = new Float32Array(N);
    const L = sr / f, n = Math.max(2, Math.floor(L)), frac = L - n, line = new Float32Array(n + 2);
    // the pluck: noise, softened by how bright the mizrab is, with the comb of where it struck the string
    let lp = 0; const p = Math.max(1, Math.round(n * (o.pos || .13)));
    for (let i = 0; i < line.length; i++) { lp += (o.bright || .7) * ((Math.random() * 2 - 1) - lp); line[i] = lp; }
    for (let i = line.length - 1; i >= p; i--) line[i] -= line[i - p] * .9;
    let w = 0, prev = 0, dc = 0, dcIn = 0, buzz = 0;
    const loss = o.loss || .9965, jaw = o.jawari || 0;
    for (let t = 0; t < N; t++) {
      const r1 = line[w], r2 = line[(w + 1) % line.length];
      let v = r1 + (r2 - r1) * frac;                                // the string, read at its true length
      const a = .72 + .25 * Math.min(1, Math.abs(v) * 3);            // louder is brighter (the bridge keeps it lit)
      let y = loss * (a * v + (1 - a) * prev); prev = y;
      if (jaw) {                                                     // jawari: the string grazes a curved bridge on one side
        const th = .35 * (1 - jaw * .4), g = y - th; if (g > 0) y = th + g * (1 - jaw * .2);   // lossy: it can only take energy away
      }
      line[w] = y; w = (w + 1) % line.length;
      let o = y;
      if (jaw) o = y + jaw * 1.4 * y * Math.abs(y) - jaw * .5 * y * y * y;   // the zing: richer when loud, mellowing as it dies
      const ydc = o - dcIn + .995 * dc; dcIn = o; dc = ydc;          // keep it centred
      out[t] = ydc;
    }
    return out;
  }
  function sympathy(sr, src, fs, amount) {                          // strings that ring when the note calls them
    const out = new Float32Array(src.length);
    for (const f of fs) {
      const n = Math.max(2, Math.round(sr / f)), line = new Float32Array(n); let w = 0, prev = 0, x0 = 0, d = 0, d0 = 0;
      for (let t = 0; t < src.length; t++) {
        const v = line[w], y = .9993 * (.5 * v + .5 * prev); prev = v;
        const drive = src[t] - x0; x0 = src[t];                      // the bridge passes motion, not a steady push
        line[w] = y + drive * .05; w = (w + 1) % n;
        const yd = y - d0 + .995 * d; d0 = y; d = yd;                 // and no DC out
        out[t] += yd * amount;
      }
    }
    return out;
  }
  function norm(x, peak = .9) { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); if (m) for (let i = 0; i < x.length; i++) x[i] *= peak / m; return x; }
  function fade(x, sr, inMs = 1, outS = .08) {
    const a = Math.floor(sr * inMs / 1000), b = Math.floor(sr * outS);
    for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
    for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= i / b;
    return x;
  }
  function buffer(ctx, ch) { const b = ctx.createBuffer(ch.length, ch[0].length, ctx.sampleRate); ch.forEach((d, i) => b.copyToChannel(d, i)); return b; }

  // ---- sitar: the main string with jawari, the taraf tuned to the raga's swars an octave up
  function sitar(ctx, m, scale, sa) {
    const key = `sitar|${ctx.sampleRate}|${m}|${scale.join(",")}|${sa}`; if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate, f = hz(m);
    const main = string(sr, f, 3.4, {bright: .45, pos: .11, loss: .9997, jawari: .6});
    const taraf = sympathy(sr, main, scale.map(p => hz(sa + 12 + p)).concat([hz(sa + 24)]), .5);
    const L = new Float32Array(main.length), R = new Float32Array(main.length);
    for (let i = 0; i < main.length; i++) { L[i] = main[i] + taraf[i] * .9; R[i] = main[i] * .92 + taraf[i] * 1.1; }
    norm(L, .8); norm(R, .8); fade(L, sr); fade(R, sr);
    const b = buffer(ctx, [L, R]); cache.set(key, b); return b;
  }

  // ---- tanpura: a long string; its overtones swell in a band that sweeps upward through the note (jivari)
  function tanpura(ctx, m) {
    const key = `tanpura|${ctx.sampleRate}|${m}`; if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate, dur = 6, N = Math.floor(sr * dur), f = hz(m), K = Math.min(36, Math.floor(8000 / f)), HOP = 32;
    const L = new Float32Array(N), R = new Float32Array(N);
    for (let k = 1; k <= K; k++) {
      const fk = f * k * (1 + rnd(-.0012, .0012) + .00004 * k * k); if (fk > sr / 2.2) break;
      const base = 1 / Math.pow(k, .65), pan = .5 + .4 * Math.sin(k * 1.7), w = 6.283185307 * fk / sr;
      let c = Math.cos(Math.random() * 6.283), sn = Math.sin(Math.random() * 6.283); const cw = Math.cos(w), sw = Math.sin(w);
      for (let i0 = 0; i0 < N; i0 += HOP) {
        const t = i0 / sr, fc = f * (3 + 22 * Math.pow(Math.min(1, t / 3.2), .8));   // the band the bridge lights, rising
        const band = .6 + 4.5 * Math.exp(-Math.pow((fk - fc) / (f * 2.5), 2));
        const amp = base * band * (1 - Math.exp(-t / .012)) * Math.exp(-t / 2.6) * (1 + .15 * Math.sin(4.4 * t + k));
        const end = Math.min(N, i0 + HOP);
        for (let i = i0; i < end; i++) { const nc = c * cw - sn * sw; sn = sn * cw + c * sw; c = nc; const v = amp * sn; L[i] += v * (1 - pan); R[i] += v * pan; }
        const r = 1 / Math.hypot(c, sn); c *= r; sn *= r;
      }
    }
    norm(L, .7); norm(R, .7); fade(L, sr, 4, .5); fade(R, sr, 4, .5);
    const b = buffer(ctx, [L, R]); cache.set(key, b); return b;
  }

  // ---- tabla: each stroke a struck membrane, rendered from its modes.
  // dayan: the syahi loads the skin so its first modes fall on harmonics 1..5 (Raman); above them the skin's own
  // inharmonic modes, which die within a few tens of ms (the "skin" of the attack). bayan: a low membrane whose pitch
  // drops just after the stroke (the skin's tension relaxing) and that the wrist can push up (ghissa).
  // A stroke = the finger's contact (a soft low-passed tap whose length sets how far up it excites the modes) +
  // the modes, each with its own ring, damped where the hand stays on the skin. Levels are the drum's, not normalised.
  let VOICES_BOLS = [];
  // modes [ratio, amp, tau s]: one bank, all bent by the same pitch curve p(t); weighted by the contact (low-pass at fc)
  function bank(out, sr, f, ms, fc, gain, pitch, t0 = 0) {
    const B = 32, N = out.length, s0 = Math.floor(t0 * sr);
    for (const [r, a, tau] of ms) {
      const fk = f * r; if (!a || fk > sr * .45) continue;
      const w0 = 6.283185307 * fk / sr, amp = gain * a / (1 + (fk / fc) * (fk / fc)), dec = Math.exp(-1 / (tau * sr));
      const end = Math.min(N, s0 + Math.ceil(tau * sr * 7.5));
      let c = 1, s = 0, e = amp;                                     // sine phase: the skin starts from rest
      for (let i0 = s0; i0 < end; i0 += B) {
        const w = w0 * pitch((i0 - s0) / sr), cw = Math.cos(w), sw = Math.sin(w), stop = Math.min(end, i0 + B);
        for (let i = i0; i < stop; i++) { out[i] += e * s; const nc = c * cw - s * sw; s = s * cw + c * sw; c = nc; e *= dec; }
        const k = 1 / Math.hypot(c, s); c *= k; s *= k;
      }
    }
  }
  // the finger on the skin: noise through a two-pole low-pass at fc, rising in .3 ms, gone in a few ms
  function tap(out, sr, fc, tau, gain, t0 = 0) {
    const s0 = Math.floor(t0 * sr), n = Math.min(out.length - s0, Math.ceil(tau * sr * 7)), g = Math.min(.95, 6.283 * fc / sr);
    let a = 0, b = 0, e = 1; const dec = Math.exp(-1 / (tau * sr)), rise = sr * .0003;
    for (let i = 0; i < n; i++) {
      a += g * ((Math.random() * 2 - 1) - a); b += g * (a - b); e *= dec;
      out[s0 + i] += gain * b * e * Math.min(1, i / rise);
    }
  }
  const J = (x, d) => x * (1 + rnd(-d, d));                          // a hand never strikes twice the same
  const skin = (amp, tau, from = 5.6) => [0, 1, 2, 3, 4, 5, 6].map(k => [J(from + k * .83, .03), J(amp * (1 - k * .1), .25), J(tau, .2)]);
  // each stroke: dayan or bayan, its modes, contact fc, finger tap [fc, tau, amp], pitch drop [depth, tau], its level
  const STROKES = {
    na:  {d: 1, m: [[1, .22, .05], [2, 1, .32], [3, .75, .26], [4, .42, .17], [5, .26, .11], [6.04, .12, .06], [7.1, .07, .04]], sk: [.42, .025], fc: 3200, tap: [3000, .0018, .38], drop: [.010, .03], lvl: .78},
    ta:  {d: 1, m: [[1, .26, .05], [2, .9, .3], [3, .85, .25], [4, .4, .16], [5, .3, .11], [6.04, .14, .06], [7.1, .07, .04]], sk: [.45, .022], fc: 3400, tap: [3200, .0017, .40], drop: [.010, .03], lvl: .78},
    tin: {d: 1, m: [[1, 1, .42], [2, .55, .28], [3, .38, .2], [4, .22, .13], [5, .13, .09], [6.04, .05, .05]], sk: [.25, .02], fc: 2500, tap: [2400, .002, .24], drop: [.012, .035], lvl: .70},
    tun: {d: 1, m: [[1, 1, .62], [2, .24, .26], [3, .1, .16], [4, .05, .1]], sk: [.07, .018], fc: 1100, tap: [1300, .003, .12], drop: [.016, .05], lvl: .72},
    ti:  {d: 1, m: [[1, .45, .03], [2, .6, .026], [3, .5, .02], [4, .38, .016], [5, .28, .013]], sk: [.45, .009], fc: 2600, tap: [2300, .004, .55], drop: [.006, .02], lvl: .50},
    te:  {d: 1, m: [[1, .35, .022], [2, .55, .02], [3, .5, .017], [4, .42, .014], [5, .32, .011]], sk: [.5, .007], fc: 3000, tap: [2800, .0035, .65], drop: [.006, .02], lvl: .54},
    ra:  {d: 1, m: [[1, .45, .028], [2, .5, .022], [3, .4, .018], [4, .28, .014], [5, .2, .011]], sk: [.4, .008], fc: 2300, tap: [2000, .0035, .5], drop: [.005, .02], lvl: .42, k: .98},
    ge:  {d: 0, m: [[1, 1, .42], [1.98, .34, .16], [1.52, .14, .12], [2.95, .13, .09], [2.44, .08, .08], [3.4, .05, .06]], fc: 700, tap: [800, .004, .16], drop: [.06, .08], lvl: .80},
    ka:  {d: 0, m: [[1.3, .3, .028], [2.1, .4, .022], [2.9, .4, .017], [3.6, .35, .013], [4.4, .3, .01], [5.3, .22, .008]], fc: 1800, tap: [2000, .006, 1.6], drop: [.01, .02], lvl: .48},
  };
  // the bols: each a list of [stroke, delay in seconds]. Dayan: na/ta rim, tin open band, tun open centre, ti closed
  // (middle fingers), ra closed (index), te crisp closed. Bayan: ge open (slides: ghissa), ka closed slap.
  const BOLS = {dha: [["na", 0], ["ge", 0]], dhin: [["tin", 0], ["ge", 0]], dhun: [["tun", 0], ["ge", 0]], dhi: [["ti", 0], ["ge", 0]],
    dhe: [["ti", 0], ["ge", 0]], dhet: [["te", 0], ["ge", 0]], dhage: [["na", 0], ["ge", 0]], ghe: [["ge", 0]], ga: [["ge", 0]], gi: [["ge", 0]],
    ke: [["ka", 0]], ki: [["ka", 0]], kat: [["ka", 0]], ka: [["ka", 0]], di: [["ti", 0]], re: [["ra", 0]], tit: [["ti", 0]], tu: [["tun", 0]],
    kra: [["ka", 0], ["ta", .014]], tra: [["ti", 0], ["ta", .014]], tak: [["ta", 0], ["ka", 0]], na: [["na", 0]], ta: [["ta", 0]],
    tin: [["tin", 0]], tun: [["tun", 0]], ti: [["ti", 0]], ra: [["ra", 0]], te: [["te", 0]], ge: [["ge", 0]]};
  VOICES_BOLS = Object.keys(BOLS);
  // which drum a bol sounds on: "d" dayan, "b" bayan, "db" both (the balance is applied by the player)
  const drumOf = (bol) => { const ps = (BOLS[bol] || [[bol, 0]]).map(p => p[0]); const d = ps.some(p => p !== "ge" && p !== "ka"), b = ps.some(p => p === "ge" || p === "ka"); return d && b ? "db" : b ? "b" : "d"; };
  // one stroke alone, at its own level: modes + skin + tap, a touch of the skin's saturation
  function one(sr, p, f, B, bright, ringB, slide, at) {
    const S = STROKES[p]; if (!S) return null;
    const ring = S.d ? 1 : .45 + ringB * 1.1;                        // the bayan's ring is a setting; the dayan's is the stroke's
    const ms = S.m.map(([r, a, tau], k) => [r === 1 ? r : J(r, .002), J(k ? a * (.55 + bright * .9) : a, .12), J(tau * ring, .08)]);
    if (S.sk) ms.push(...skin(S.sk[0] * (.6 + bright * .8), S.sk[1]));
    const len = Math.min(2.8, at + .03 + 6 * Math.max(...ms.map(m => m[2]))), x = new Float32Array(Math.floor(sr * len));
    const base = (S.d ? f * (S.k || 1) : B) * (1 + rnd(-.0015, .0015)), [dd, dt] = [J(S.drop[0], .3), S.drop[1]];
    const sl = S.d || !slide ? 0 : Math.pow(2, slide / 12) - 1, sT = .08, sD = .35;
    const pitch = (t) => { let m = 1 + dd * Math.exp(-t / dt); if (sl && t > sT) { const u = Math.min(1, (t - sT) / sD); m *= 1 + sl * u * u * (3 - 2 * u); } return m; };
    const fc = S.fc * (.7 + bright * .6);
    bank(x, sr, base, ms, fc, 1, pitch, at);
    tap(x, sr, S.tap[0] * (.75 + bright * .5), J(S.tap[1], .15), J(S.tap[2], .15), at);
    let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v));
    const drive = S.d ? 1.15 : 1.6, th = Math.tanh(drive), g = 1 / (pk || 1);   // the bayan's skin is driven harder: its low boom grows overtones
    for (let i = 0; i < x.length; i++) x[i] = Math.tanh(drive * x[i] * g) / th * S.lvl;
    return x;
  }
  // o: {cents (dayan around Sa), bright 0..1, ring 0..1 (the bayan's), balance -1 dayan .. +1 bayan, slide (semitones, ge)}
  function stroke(ctx, bol, sa, bayanHz, ghissa, o = {}) {
    const v = Math.floor(Math.random() * 4), q = (x, s = .05) => Math.round((x || 0) / s) * s;   // four takes of each (round robin)
    const cents = q(o.cents, 1), bright = q(o.bright ?? .5), ring = q(o.ring ?? .5), bal = q(o.balance), slideS = q(o.slide ?? (ghissa ? ghissa : 0), .25);
    const key = `tabla|${ctx.sampleRate}|${bol}|${sa}|${Math.round(bayanHz)}|${cents}|${bright}|${ring}|${bal}|${slideS}|${v}`; if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate, f = hz(sa) * Math.pow(2, cents / 1200), B = bayanHz * (1 + rnd(-.006, .006));
    const parts = BOLS[bol] || [[bol, 0]], both = drumOf(bol) === "db";
    const dG = both ? 1 - .7 * Math.max(0, bal) : 1, bG = both ? 1 - .7 * Math.max(0, -bal) : 1;
    const xs = parts.map(([p, at]) => [one(sr, p, f, B, bright, ring, slideS, at + (both && p !== "ge" && p !== "ka" ? rnd(0, .004) : 0)), STROKES[p] && STROKES[p].d ? dG : bG * .9]).filter(z => z[0]);
    const out = new Float32Array(Math.max(1, ...xs.map(z => z[0].length)));
    for (const [x, g] of xs) for (let i = 0; i < x.length; i++) out[i] += g * x[i];
    let pk = 0; for (const s of out) pk = Math.max(pk, Math.abs(s));
    if (pk > .85) for (let i = 0; i < out.length; i++) out[i] *= .85 / pk;        // two drums at once stay under the ceiling
    let y = 0, x0 = 0; for (let i = 0; i < out.length; i++) { y = out[i] - x0 + .9987 * y; x0 = out[i]; out[i] = y; }   // no DC
    fade(out, sr, 0, Math.min(.2, out.length / sr * .3));
    const b = buffer(ctx, [out]); b.drum = drumOf(bol); cache.set(key, b); return b;
  }

  // ---- bansuri: tone and breath, live
  let wave = null;
  function flute(ctx, dest, t, m, dur, vel) {
    if (!wave) wave = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0]), new Float32Array([0, 1, .32, .11, .05, .025, .012]));
    const f = hz(m), o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    o.setPeriodicWave(wave); o.frequency.value = f;
    o.detune.setValueAtTime(-45, t); o.detune.exponentialRampToValueAtTime ? o.detune.linearRampToValueAtTime(0, t + .09) : 0;
    vib.frequency.value = rnd(4.8, 5.6); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(0, t + Math.min(.35, dur * .4));
    vg.gain.linearRampToValueAtTime(14, t + Math.min(.9, dur * .8)); vib.connect(vg).connect(o.detune);
    const len = Math.max(.2, dur), nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (len + .4)), ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const breath = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), bg = ctx.createGain(), hg = ctx.createGain();
    breath.buffer = nb; bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 9; hp.type = "highpass"; hp.frequency.value = 3500;
    breath.connect(bp).connect(bg).connect(g); breath.connect(hp).connect(hg).connect(g);
    bg.gain.value = .35; hg.gain.setValueAtTime(.06, t); hg.gain.exponentialRampToValueAtTime(.012, t + .25);
    o.connect(g); g.connect(dest);
    const peak = .22 * vel;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .08);
    g.gain.setTargetAtTime(peak * .8, t + .1, .3); g.gain.setTargetAtTime(.0001, t + len, .09);
    o.start(t); vib.start(t); breath.start(t); const end = t + len + .6; o.stop(end); vib.stop(end); breath.stop(end);
    return {src: {stop: (w) => [o, vib, breath].forEach(n => { try { n.stop(w); } catch (_) {} })}, gain: g};
  }

  // play a rendered buffer: at time t, for dur seconds (strings ring on, then let go), detune in cents
  function play(ctx, dest, buf, t, {gain = 1, dur = null, detune = 0, glideFrom = 0, glideT = .2} = {}) {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf;
    s.detune.setValueAtTime(detune + glideFrom, t); if (glideFrom) s.detune.linearRampToValueAtTime(detune, t + glideT);
    g.gain.value = gain; s.connect(g).connect(dest); s.start(t);
    if (dur !== null) { g.gain.setValueAtTime(gain, t + dur); g.gain.setTargetAtTime(.0001, t + dur, .12); s.stop(t + dur + .8); }
    return {src: s, gain: g};
  }

  // the body: a gourd's or a drum's few resonances, put on a window's output once
  function body(ctx, kind) {
    const peaks = {sitar: [[180, 1.2, 3], [900, 2, 2.5], [2600, 1.5, -2]], tanpura: [[140, 1, 3], [700, 1.5, 2]], tabla: [[250, 1, 2]], flute: [[1200, 1, 1.5]], you: [[180, 1.2, 2.5], [900, 2, 2]]}[kind] || [];
    const first = ctx.createGain(); let last = first;
    for (const [f, q, db] of peaks) { const b = ctx.createBiquadFilter(); b.type = "peaking"; b.frequency.value = f; b.Q.value = q; b.gain.value = db; last.connect(b); last = b; }
    return {input: first, output: last};
  }

  (typeof window !== "undefined" ? window : globalThis).VOICES = {sitar, tanpura, stroke, flute, play, body, hz, bols: () => VOICES_BOLS, _: {string, sympathy}};
})();
