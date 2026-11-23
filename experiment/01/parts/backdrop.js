// backdrop.js · a song's backdrop: two quiet cycles in its raga for the side seats, written as sargam lines.
// The melody seat walks the pakad, then comes down the avaroha to Sa; the pad seat holds Sa, the vadi, the samvadi,
// and Sa again. Knows notation lines and a raga record (parts/ragas.json); no clock, no seat, no page.
(function () {
const toks = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
function fit(t, n) {                                 // k swars spread over n beats, held between (pairs share a beat if k > n)
  while (t.length > n) { const u = []; for (let i = 0; i < t.length; i += 2) u.push(t[i] + (t[i + 1] || "")); t = u; }
  const out = Array(n).fill("-"), k = t.length;
  t.forEach((x, i) => { out[Math.floor(i * n / k)] = x; });
  return out;
}
const join = (t, vibhag) => { const o = []; let i = 0; (vibhag || [t.length]).forEach(v => { o.push(t.slice(i, i + v).join(" ")); i += v; }); return o.join(" | "); };
function lines(raga, n, vibhag) {
  const h = Math.floor(n / 2), held = (a, b) => [a, ...Array(h - 1).fill("-"), b, ...Array(n - h - 1).fill("-")];
  return {
    melody: [join(fit(toks(raga.pakad), n), vibhag), join(fit(toks(raga.avaroha), n), vibhag)],
    pad: [join(held("S", raga.vadi || "P"), vibhag), join(held(raga.samvadi || "P", "S"), vibhag)],
  };
}
window.AVARTAN_BACKDROP = {fit, lines};
})();
