// keys.js · the computer's keys: notes on a piano-shaped pair of rows (the default), or RiyazStudio's moves. It knows no part: it is handed a
// map of move names to functions and calls them. A key a page does not hand a move for does nothing.
//   space play · B tap ×3 · ← → bring the left / right seat to the centre · [ ] mute it · enter pin the centre's newest phrase · ↑ ↓ (L K) faster / slower (shift ×5, ctrl ×½) · P hold · N next · T tihai
//   Z X tabla softer / louder · − + tune (ctrl: finer) · D tanpura · F fade · A S tanpura softer / louder · 1…0 swars
(function () {
const MAP = {Space: "play", KeyB: "tap", ArrowUp: "faster", KeyL: "faster", ArrowDown: "slower", KeyK: "slower", KeyP: "hold", KeyN: "next", KeyT: "tihai",
             KeyZ: "softer", KeyX: "louder", Minus: "flatter", Equal: "sharper", KeyD: "tanpura", KeyF: "fade", KeyA: "tanpuraSofter", KeyS: "tanpuraLouder",
             ArrowLeft: "giveLeft", ArrowRight: "giveRight", Enter: "pin", Escape: "stopAll", BracketLeft: "left", BracketRight: "right", KeyM: "mute", Slash: "songs"};
// Keys play notes (the default, so the room needs no MIDI): two rows laid like a piano, by where a key sits, not what
// is printed on it (e.code), so it is the same shape on every layout. The bottom row from Z is the keybed's first
// octave (C up), the top row from Q the next, up to the keybed's last G. The layout only changes the letters drawn.
const PLAY = {KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11, Comma: 12, KeyL: 13, Period: 14, Semicolon: 15,
              KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21, Digit7: 22, KeyU: 23,
              KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28, BracketLeft: 29, Equal: 30, BracketRight: 31};
// with the letters playing, the moves keep the keys that print no letter
const PLAY_MAP = {Space: "play", ArrowUp: "faster", ArrowDown: "slower", ArrowLeft: "giveLeft", ArrowRight: "giveRight", Enter: "pin", Escape: "stopAll", Slash: "songs"};
const QWERTY = {KeyZ: "Z", KeyS: "S", KeyX: "X", KeyD: "D", KeyC: "C", KeyV: "V", KeyG: "G", KeyB: "B", KeyH: "H", KeyN: "N", KeyJ: "J", KeyM: "M", Comma: ",", KeyL: "L", Period: ".", Semicolon: ";",
                KeyQ: "Q", Digit2: "2", KeyW: "W", Digit3: "3", KeyE: "E", KeyR: "R", Digit5: "5", KeyT: "T", Digit6: "6", KeyY: "Y", Digit7: "7", KeyU: "U", KeyI: "I", Digit9: "9", KeyO: "O", Digit0: "0", KeyP: "P", BracketLeft: "[", Equal: "=", BracketRight: "]"};
const LAYOUTS = {
  qwerty: ["QWERTY", {}],
  azerty: ["AZERTY (French)", {KeyQ: "A", KeyW: "Z", KeyZ: "W", KeyM: ",", Comma: ";", Period: ":", Semicolon: "M", Digit2: "é", Digit3: "\"", Digit5: "(", Digit6: "-", Digit7: "è", Digit9: "ç", Digit0: "à", BracketLeft: "^", BracketRight: "$"}],
  qwertz: ["QWERTZ (German)", {KeyZ: "Y", KeyY: "Z", Semicolon: "Ö", BracketLeft: "Ü", BracketRight: "+", Equal: "´"}],
  dvorak: ["Dvorak", {KeyQ: "'", KeyW: ",", KeyE: ".", KeyR: "P", KeyT: "Y", KeyY: "F", KeyU: "G", KeyI: "C", KeyO: "R", KeyP: "L", BracketLeft: "/", BracketRight: "=", Equal: "]",
                      KeyS: "O", KeyD: "E", KeyG: "I", KeyH: "D", KeyJ: "H", KeyL: "N", Semicolon: "S", KeyZ: ";", KeyX: "Q", KeyC: "J", KeyV: "K", KeyB: "X", KeyN: "B", Comma: "W", Period: "V"}],
  colemak: ["Colemak", {KeyE: "F", KeyR: "P", KeyT: "G", KeyY: "J", KeyU: "L", KeyI: "U", KeyO: "Y", KeyP: ";", KeyS: "R", KeyD: "S", KeyG: "D", KeyJ: "N", KeyL: "I", Semicolon: "O", KeyN: "K"}],
};
const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== "range";
window.AVARTAN_KEYS = {MAP, PLAY, PLAY_MAP, LAYOUTS,
  mode: "play",                                     // "play": the letters are notes · "riyaz": RiyazStudio's moves, no notes
  layout: "qwerty", detected: null,                 // detected: the browser's own layout map, when asked for ("auto")
  label(code) { if (this.layout === "auto" && this.detected) { const c = this.detected.get(code); if (c) return c.toUpperCase(); }
    const L = LAYOUTS[this.layout]; return (L && L[1][code]) || QWERTY[code] || ""; },
  async detect() { try { this.detected = navigator.keyboard && navigator.keyboard.getLayoutMap ? await navigator.keyboard.getLayoutMap() : null; } catch (_) { this.detected = null; } return !!this.detected; },
  bind(moves, notes) {                              // notes: {on(i), off(i)}: i the key's place on the keybed, 0 its first C
    const down = new Map();
    addEventListener("keydown", (e) => {
      if (typing(e) || e.metaKey) return;
      if (this.mode === "play" && e.code in PLAY && !e.ctrlKey && !e.altKey) { e.preventDefault(); if (e.repeat || down.has(e.code)) return; down.set(e.code, PLAY[e.code]); notes && notes.on(PLAY[e.code]); return; }
      if (e.repeat) return;
      const name = (this.mode === "play" ? PLAY_MAP : MAP)[e.code], f = name && moves[name]; if (!f) return;
      if ((e.code === "Space" || e.code === "Enter") && e.target.tagName === "BUTTON" && !e.target.dataset.move) return;   // a focused button keeps its own keys
      e.preventDefault(); f({shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey});
    });
    addEventListener("keyup", (e) => { if (!down.has(e.code)) return; const i = down.get(e.code); down.delete(e.code); notes && notes.off(i); });
    addEventListener("blur", () => { down.forEach(i => notes && notes.off(i)); down.clear(); });   // a key held while the window loses focus lets go
  }};
})();
