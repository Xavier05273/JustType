// JustType — original typing engine (modes align with TypeMate categories,
// UI/code are original). Data in data.json: words / sentences.
(function () {
  "use strict";
  const LS_BEST = "tp-lite-best-v1";
  const LS_HIST = "tp-lite-history-v1";
  const LS_FONT = "tp-lite-font-v1";
  const LS_LAST = "tp-lite-last-v1";
  const LS_AUTO_NEXT = "tp-lite-auto-next-v1";
  const LS_THEME = "tp-lite-theme-v1";
  const LS_ENDLESS = "tp-lite-endless-v1";
  const LS_ONKB = "tp-lite-onkb-v1";
  const LS_DECOMP = "tp-lite-decomp-v1"; // 右上角拆字顯示: cangjie|boshiamy|sucheng

  // Standard ANSI Physical Keyboard Layout (5 rows, exact 15.0u width per row).
  // Matches real physical keyboards in Taiwan (Bopomofo + QWERTY).
  const ANSI_KEYBOARD_ROWS = [
    // Row 1 (Number row, 14 keys, sum = 15.0u)
    [
      { id: "Backquote", key: "`", shift: "~", mainZh: "`", sub: "~", u: 1.0 },
      { id: "Digit1", key: "1", shift: "!", mainZh: "ㄅ", sub: "1", u: 1.0 },
      { id: "Digit2", key: "2", shift: "@", mainZh: "ㄉ", sub: "2", u: 1.0 },
      { id: "Digit3", key: "3", shift: "#", mainZh: "ˇ", sub: "3", u: 1.0, isTone: true, toneSym: "ˇ" },
      { id: "Digit4", key: "4", shift: "$", mainZh: "ˋ", sub: "4", u: 1.0, isTone: true, toneSym: "ˋ" },
      { id: "Digit5", key: "5", shift: "%", mainZh: "ㄓ", sub: "5", u: 1.0 },
      { id: "Digit6", key: "6", shift: "^", mainZh: "ˊ", sub: "6", u: 1.0, isTone: true, toneSym: "ˊ" },
      { id: "Digit7", key: "7", shift: "&", mainZh: "˙", sub: "7", u: 1.0, isTone: true, toneSym: "˙" },
      { id: "Digit8", key: "8", shift: "*", mainZh: "ㄚ", sub: "8", u: 1.0 },
      { id: "Digit9", key: "9", shift: "(", mainZh: "ㄞ", sub: "9", u: 1.0 },
      { id: "Digit0", key: "0", shift: ")", mainZh: "ㄢ", sub: "0", u: 1.0 },
      { id: "Minus", key: "-", shift: "_", mainZh: "ㄦ", sub: "-", u: 1.0 },
      { id: "Equal", key: "=", shift: "+", mainZh: "=", sub: "+", u: 1.0 },
      { id: "Backspace", label: "Backspace", type: "back", isFn: true, u: 2.0 },
    ],
    // Row 2 (Tab / QWERTY row, 14 keys, sum = 15.0u)
    [
      { id: "Tab", label: "Tab", type: "tab", isFn: true, u: 1.5 },
      { id: "KeyQ", key: "q", shift: "Q", mainZh: "ㄆ", sub: "Q", u: 1.0 },
      { id: "KeyW", key: "w", shift: "W", mainZh: "ㄊ", sub: "W", u: 1.0 },
      { id: "KeyE", key: "e", shift: "E", mainZh: "ㄍ", sub: "E", u: 1.0 },
      { id: "KeyR", key: "r", shift: "R", mainZh: "ㄐ", sub: "R", u: 1.0 },
      { id: "KeyT", key: "t", shift: "T", mainZh: "ㄔ", sub: "T", u: 1.0 },
      { id: "KeyY", key: "y", shift: "Y", mainZh: "ㄗ", sub: "Y", u: 1.0 },
      { id: "KeyU", key: "u", shift: "U", mainZh: "ㄧ", sub: "U", u: 1.0 },
      { id: "KeyI", key: "i", shift: "I", mainZh: "ㄛ", sub: "I", u: 1.0 },
      { id: "KeyO", key: "o", shift: "O", mainZh: "ㄟ", sub: "O", u: 1.0 },
      { id: "KeyP", key: "p", shift: "P", mainZh: "ㄣ", sub: "P", u: 1.0 },
      { id: "BracketLeft", key: "[", shift: "{", mainZh: "「", sub: "[", u: 1.0 },
      { id: "BracketRight", key: "]", shift: "}", mainZh: "」", sub: "]", u: 1.0 },
      { id: "Backslash", key: "\\", shift: "|", mainZh: "、", sub: "\\", u: 1.5 },
    ],
    // Row 3 (Home row, 13 keys, sum = 15.0u)
    [
      { id: "CapsLock", label: "Caps", type: "caps", isFn: true, u: 1.75 },
      { id: "KeyA", key: "a", shift: "A", mainZh: "ㄇ", sub: "A", u: 1.0 },
      { id: "KeyS", key: "s", shift: "S", mainZh: "ㄋ", sub: "S", u: 1.0 },
      { id: "KeyD", key: "d", shift: "D", mainZh: "ㄎ", sub: "D", u: 1.0 },
      { id: "KeyF", key: "f", shift: "F", mainZh: "ㄑ", sub: "F", u: 1.0 },
      { id: "KeyG", key: "g", shift: "G", mainZh: "ㄕ", sub: "G", u: 1.0 },
      { id: "KeyH", key: "h", shift: "H", mainZh: "ㄘ", sub: "H", u: 1.0 },
      { id: "KeyJ", key: "j", shift: "J", mainZh: "ㄨ", sub: "J", u: 1.0 },
      { id: "KeyK", key: "k", shift: "K", mainZh: "ㄜ", sub: "K", u: 1.0 },
      { id: "KeyL", key: "l", shift: "L", mainZh: "ㄠ", sub: "L", u: 1.0 },
      { id: "Semicolon", key: ";", shift: ":", mainZh: "ㄤ", sub: ";", u: 1.0 },
      { id: "Quote", key: "'", shift: "\"", mainZh: "號", sub: "'", u: 1.0 },
      { id: "Enter", label: "Enter", type: "enter", isFn: true, u: 2.25 },
    ],
    // Row 4 (Bottom row, 12 keys, sum = 15.0u)
    [
      { id: "ShiftLeft", label: "Shift", type: "shift", isFn: true, u: 2.25 },
      { id: "KeyZ", key: "z", shift: "Z", mainZh: "ㄈ", sub: "Z", u: 1.0 },
      { id: "KeyX", key: "x", shift: "X", mainZh: "ㄌ", sub: "X", u: 1.0 },
      { id: "KeyC", key: "c", shift: "C", mainZh: "ㄏ", sub: "C", u: 1.0 },
      { id: "KeyV", key: "v", shift: "V", mainZh: "ㄒ", sub: "V", u: 1.0 },
      { id: "KeyB", key: "b", shift: "B", mainZh: "ㄖ", sub: "B", u: 1.0 },
      { id: "KeyN", key: "n", shift: "N", mainZh: "ㄙ", sub: "N", u: 1.0 },
      { id: "KeyM", key: "m", shift: "M", mainZh: "ㄩ", sub: "M", u: 1.0 },
      { id: "Comma", key: ",", shift: "<", mainZh: "ㄝ", sub: ",", u: 1.0 },
      { id: "Period", key: ".", shift: ">", mainZh: "ㄡ", sub: ".", u: 1.0 },
      { id: "Slash", key: "/", shift: "?", mainZh: "ㄥ", sub: "/", u: 1.0 },
      { id: "ShiftRight", label: "Shift", type: "shift", isFn: true, u: 2.75 },
    ],
    // Row 5 (Space row, 8 keys, sum = 15.0u)
    [
      { id: "ControlLeft", label: "Ctrl", type: "ctrl", isFn: true, u: 1.25 },
      { id: "MetaLeft", label: "Win", type: "win", isFn: true, u: 1.25 },
      { id: "AltLeft", label: "Alt", type: "alt", isFn: true, u: 1.25 },
      { id: "Space", label: "Space 空白", key: " ", type: "space", mainZh: "空白", sub: "一聲", isSpace: true, isTone: true, toneSym: "一聲", u: 6.25 },
      { id: "AltRight", label: "Alt", type: "alt", isFn: true, u: 1.25 },
      { id: "MetaRight", label: "Win", type: "win", isFn: true, u: 1.25 },
      { id: "ContextMenu", label: "Fn", type: "menu", isFn: true, u: 1.25 },
      { id: "ControlRight", label: "Ctrl", type: "ctrl", isFn: true, u: 1.25 },
    ],
  ];

  // Zhuyin symbol to physical key mapping
  const BOPOMOFO_TO_KEY = {
    // 聲母
    "ㄅ": "1", "ㄉ": "2", "ㄓ": "5", "ㄚ": "8", "ㄞ": "9", "ㄢ": "0", "ㄦ": "-",
    "ㄆ": "q", "ㄊ": "w", "ㄍ": "e", "ㄐ": "r", "ㄔ": "t", "ㄗ": "y",
    "ㄇ": "a", "ㄋ": "s", "ㄎ": "d", "ㄑ": "f", "ㄕ": "g", "ㄘ": "h",
    "ㄈ": "z", "ㄌ": "x", "ㄏ": "c", "ㄒ": "v", "ㄖ": "b", "ㄙ": "n",
    // 介母 & 韻母
    "ㄧ": "u", "ㄛ": "i", "ㄟ": "o", "ㄣ": "p",
    "ㄨ": "j", "ㄜ": "k", "ㄠ": "l", "ㄤ": ";",
    "ㄩ": "m", "ㄝ": ",", "ㄡ": ".", "ㄥ": "/",
    // 聲調 (二聲 ˊ / 三聲 ˇ / 四聲 ˋ / 輕聲 ˙)
    "ˊ": "6",
    "ˇ": "3",
    "ˋ": "4",
    "˙": "7",
  };

  // Physical code -> key char (for tracking typed keys during IME composition,
  // where e.key is often "Process" and only e.code is reliable).
  const CODE_TO_KEY = {};
  ANSI_KEYBOARD_ROWS.forEach((row) => row.forEach((item) => {
    if (item.key) CODE_TO_KEY[item.id] = item.key;
  }));

  // Cangjie (倉頡) code letter -> radical （字根）. cangjie.json 存小寫碼，
  // 例如 半=fq（火手）、謝=yrhhi（卜口竹竹戈）。x=難（難字）、z=重（重碼鍵）。
  const CANGJIE_RADICAL = {
    a: "日", b: "月", c: "金", d: "木", e: "水", f: "火", g: "土",
    h: "竹", i: "戈", j: "十", k: "大", l: "中", m: "一", n: "弓",
    o: "人", p: "心", q: "手", r: "口", s: "尸", t: "廿", u: "山",
    v: "女", w: "田", x: "難", y: "卜", z: "重",
  };
  // 反查：字根 -> 倉頡碼字母（供倉頡版面鍵盤由字根反推已打進度）
  const CANGJIE_RADICAL_TO_KEY = {};
  Object.keys(CANGJIE_RADICAL).forEach((k) => { CANGJIE_RADICAL_TO_KEY[CANGJIE_RADICAL[k]] = k; });

  // Punctuation physical key mapping for Taiwanese keyboard IME
  const PUNCT_KEY_MAP = {
    "，": { key: ",", shift: false, label: "，(,)" },
    "。": { key: ".", shift: false, label: "。(.)" },
    "！": { key: "1", shift: true, label: "！(Shift+1)" },
    "？": { key: "/", shift: true, label: "？(Shift+/)" },
    "：": { key: ";", shift: true, label: "：(Shift+;)" },
    "；": { key: ";", shift: false, label: "；(;)" },
    "「": { key: "[", shift: false, label: "「([)" },
    "」": { key: "]", shift: false, label: "」(])" },
    "、": { key: "\\", shift: false, label: "、(\\)" },
    "—": { key: "-", shift: true, label: "—(Shift+-)" },
    "（": { key: "9", shift: true, label: "（(Shift+9)" },
    "）": { key: "0", shift: true, label: "）(Shift+0)" },
    ",": { key: ",", shift: false, label: "," },
    ".": { key: ".", shift: false, label: "." },
    "!": { key: "1", shift: true, label: "!" },
    "?": { key: "/", shift: true, label: "?" },
    ":": { key: ";", shift: true, label: ":" },
    ";": { key: ";", shift: false, label: ";" },
  };

  // Finite round sizes: words settle after 10 items, sentences after 5.
  // Articles are one item per round. Endless mode disables settlement.
  // Endless is offered for every mode (words / sentences)
  // but is always off by default (LS_ENDLESS only true if user set it).
  const ROUND_TARGET = { words: 10, sentences: 5 };

  const MODES = [
    { key: "words", title: "單字", desc: "萬丈高樓平地起", dataKey: "words", color: "blue" },
    { key: "sentences", title: "句子", desc: "小有所成，切勿驕縱", dataKey: "sentences", color: "emerald" },
    { key: "articles_punct", title: "小短文", desc: "萬水千山走遍", dataKey: "articles_punct", color: "violet" },
  ];

  const $ = (s) => document.querySelector(s);
  const homeView = $("#homeView");
  const practiceView = $("#practiceView");
  const modeGrid = $("#modeGrid");
  const resultOverlay = $("#resultOverlay");
  const autoAdvanceCheck = $("#autoAdvanceCheck");
  const endlessCheck = $("#endlessCheck");
  const endlessLabel = $("#endlessLabel");
  const carouselViewport = $("#carouselViewport");
  const carouselDots = $("#carouselDots");
  const carouselPrev = $("#carouselPrev");
  const carouselNext = $("#carouselNext");
  const onKeyboardCheck = $("#onKeyboardCheck");
  const onKeyboardWrap = $("#onKeyboardWrap");
  const onKeyboard = $("#onKeyboard");
  const layoutSelect = $("#layoutSelect");
  const cangjieHint = $("#cangjieHint");
  const statsOverlay = $("#statsOverlay");
  const statsBtn = $("#statsBtn");
  const closeStatsBtn = $("#closeStatsBtn");
  const closeStatsBtnBottom = $("#closeStatsBtnBottom");

  let DATA = null;
  let ZHUYIN = null;
  let CANGJIE = null;
  let BOSHIAMY = null;
  let decompMethod = "cangjie"; // 右上角拆字顯示方法: cangjie(倉頡) | boshiamy(嘸蝦米) | sucheng(速成)
  let state = null;
  let carousel = null;
  let carouselIndex = 0; // last centered mode, persists across home visits
  let resultTimeoutId = null;
  let currentExpectedKey = null; // {key, isSpace, label} — updated by paintOnKeyboard
  let flashTimeoutIds = {}; // keyEl -> timeout for cleaning flash classes

  // Speed sanity: IME needs time to select each char. If measured time is far
  // below per-char minimum, it's paste/instant input or timer started late.
  // Effective seconds floor prevents absurd 1920+ displays and best-record pollution.
  function effectiveStats(totalTyped, totalCorrect, rawSec) {
    const floorSec = Math.max(1.0, totalCorrect * 0.20);
    const effSec = Math.max(rawSec || 0, floorSec);
    const anomalous = (rawSec || 0) < floorSec * 0.6 && totalCorrect >= 5;
    const cpm = effSec > 0 ? Math.round(totalCorrect / (effSec / 60)) : 0;
    const acc = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 1000) / 10 : 100;
    return { sec: effSec, rawSec: rawSec || 0, cpm, acc, anomalous, totalTyped, totalCorrect };
  }

  // Half-width -> full-width normalization for comparison (lenient punctuation).
  const PUNCT_MAP = { ",": "，", ".": "。", "!": "！", "?": "？", ";": "；", ":": "：" };
  function norm(ch) { return PUNCT_MAP[ch] || ch; }

  function loadJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  // Theme Management
  function getSavedTheme() {
    return loadJSON(LS_THEME, "system");
  }

  function applyTheme(theme) {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    const icon = $("#themeIcon");
    const text = $("#themeText");
    if (icon) icon.textContent = isDark ? "🌙" : "☀️";
    if (text) text.textContent = isDark ? "深色" : "淺色";
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", isDark ? "#0f172a" : "#2563eb");
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    saveJSON(LS_THEME, next);
    applyTheme(next);
  }

  // Load and sanitize personal best to purge any corrupted values (e.g. 2040 bug)
  function loadBest() {
    const best = loadJSON(LS_BEST, {});
    let dirty = false;
    for (const k of ["words", "sentences"]) {
      if (best[k] && (best[k].wpm > 450 || best[k].wpm <= 0 || !Number.isFinite(best[k].wpm))) {
        delete best[k];
        dirty = true;
      }
    }
    if (dirty) saveJSON(LS_BEST, best);
    return best;
  }

  function loadHist() {
    const hist = loadJSON(LS_HIST, []);
    const cleaned = hist.filter((h) => h && h.wpm <= 450 && h.wpm > 0);
    if (cleaned.length !== hist.length) saveJSON(LS_HIST, cleaned);
    return cleaned;
  }

  function isAutoNextEnabled(modeKey) {
    const pref = loadJSON(LS_AUTO_NEXT, null);
    if (pref && typeof pref[modeKey] === "boolean") {
      return pref[modeKey];
    }
    // Default: words and sentences auto-advance without popup; articles show popup
    return modeKey === "words" || modeKey === "sentences";
  }

  function setAutoNextEnabled(modeKey, val) {
    const pref = loadJSON(LS_AUTO_NEXT, {});
    pref[modeKey] = val;
    saveJSON(LS_AUTO_NEXT, pref);
  }

  function syncAutoAdvanceCheck() {
    if (!autoAdvanceCheck || !state) return;
    autoAdvanceCheck.checked = isAutoNextEnabled(state.modeKey);
  }

  function isShortMode(modeKey) {
    return modeKey === "words" || modeKey === "sentences";
  }
  // Endless （無盡模式） is available in every mode, including the article
  // mode. It is per-mode and off by default: isEndlessEnabled only returns
  // true when the user explicitly checked the box (LS_ENDLESS[modeKey]===true).
  function isEndlessApplicable(modeKey) {
    return MODES.some((m) => m.key === modeKey);
  }
  function isEndlessEnabled(modeKey) {
    const pref = loadJSON(LS_ENDLESS, null);
    return pref && pref[modeKey] === true;
  }
  function setEndlessEnabled(modeKey, val) {
    const pref = loadJSON(LS_ENDLESS, {});
    pref[modeKey] = val;
    saveJSON(LS_ENDLESS, pref);
  }
  function syncEndlessCheck() {
    if (!state || !endlessCheck) return;
    const show = isEndlessApplicable(state.modeKey);
    endlessCheck.checked = isEndlessEnabled(state.modeKey);
    endlessCheck.disabled = !show;
    if (endlessLabel) {
      endlessLabel.style.display = show ? "" : "none";
      endlessLabel.title = show
        ? "開啟後不結算，持續自動跳下一題（小短文亦同；預設關閉）"
        : "無盡模式適用所有模式";
    }
  }

  async function init() {
    applyTheme(getSavedTheme());
    applyFontSize(loadJSON(LS_FONT, "md"));
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (getSavedTheme() === "system") {
          applyTheme("system");
        }
      });
    }

    // 1. First fetch core question data (data.json) to render home view immediately
    const res = await fetch("data.json");
    DATA = await res.json();

    decompMethod = ["cangjie", "boshiamy", "sucheng"].includes(loadJSON(LS_DECOMP, "cangjie"))
      ? loadJSON(LS_DECOMP, "cangjie") : "cangjie";
    renderHome();
    bindGlobal();

    // 2. Fetch large dictionaries asynchronously in parallel in background
    Promise.all([
      fetch("zhuyin.json").then((r) => r.json()).then((d) => { ZHUYIN = d; }).catch(() => { ZHUYIN = null; }),
      fetch("cangjie.json").then((r) => r.json()).then((d) => { CANGJIE = d; }).catch(() => { CANGJIE = null; }),
      fetch("boshiamy.json").then((r) => r.json()).then((d) => { BOSHIAMY = d; }).catch(() => { BOSHIAMY = null; }),
    ]).then(() => {
      // If currently practicing, refresh key hints and decomposition wheel once dictionaries are loaded
      if (state && !state.finished) {
        paintOnKeyboard();
        paintCangjieHint();
      }
    });
  }

  function renderHome() {
    const best = loadBest();
    modeGrid.innerHTML = "";
    // 3D hit-test fix: .mode-carousel has preserve-3d and covers the whole
    // viewport, so in Chromium it intercepts clicks meant for side cards
    // pushed to translateZ(-180px) (elementFromPoint returns the container,
    // the card's click never fires). Taking the container out of hit-testing
    // lets clicks reach the cards themselves; paintCarousel already sets
    // each card's pointerEvents to auto (near) / none (far).
    modeGrid.style.pointerEvents = "none";
    if (carouselDots) carouselDots.innerHTML = "";
    const cards = [];
    MODES.forEach((m, idx) => {
      const items = DATA[m.dataKey].texts;
      const b = best[m.key];
      const card = document.createElement("button");
      card.className = "mode-card m-" + m.key;
      card.type = "button";
      card.dataset.modeKey = m.key;
      card.dataset.index = idx;
      card.setAttribute("aria-label", m.title + "，點擊開始練習");
      card.innerHTML =
        `<span class="mode-card-bar" aria-hidden="true"></span>` +
        `<h3>${m.title}</h3><p>${m.desc}</p>` +
        `<div class="mode-meta"><span>題庫 <strong>${items.length} 題</strong></span>` +
        `<span>個人最佳 <strong>${b ? b.wpm + " 字/分 · " + b.acc + "%" : "—"}</strong></span></div>` +
        `<span class="mode-card-go">開始挑戰 →</span>` +
        `<span class="mode-glare" aria-hidden="true"></span>`;
      card.addEventListener("click", () => onCardClicked(idx));
      modeGrid.appendChild(card);
      cards.push(card);
      if (carouselDots) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", "切換到" + m.title);
        dot.addEventListener("click", () => setCarouselTarget(idx));
        carouselDots.appendChild(dot);
      }
    });
    carousel = {
      cards,
      pos: carouselIndex,
      target: carouselIndex,
      selected: carouselIndex,
      raf: null,
      dragging: false,
      moved: false,
      dragStartX: 0,
      dragStartPos: 0,
      lastX: 0,
      lastT: 0,
      velocity: 0, // cards per second
      wheelLockedUntil: 0,
    };
    bindCarousel();
    // Sync overall page theme (accent) to the currently centered mode so
    // the whole site follows the level selection, not just the practice view.
    if (MODES[carousel.selected]) {
      document.body.dataset.mode = MODES[carousel.selected].key;
    }
    queueCarouselFrame();
  }

  // Keep the global accent theme in sync with the carousel selection.
  // Only affects the home view; practice view sets body[data-mode] itself.
  function syncHomeTheme() {
    if (!carousel) return;
    if (homeView && homeView.classList.contains("hidden")) return;
    const mode = MODES[carousel.selected];
    if (mode) document.body.dataset.mode = mode.key;
  }

  function carouselSpacing() {
    const card = carousel && carousel.cards[0];
    const w = card ? card.offsetWidth : 320;
    return Math.max(180, w * 0.88);
  }

  function queueCarouselFrame() {
    if (carousel && carousel.raf == null) {
      carousel.raf = requestAnimationFrame(carouselFrame);
    }
  }

  function carouselFrame() {
    if (!carousel) return;
    if (!carousel.dragging) {
      // Exponential approach = non-linear deceleration (ease-out feel).
      const diff = carousel.target - carousel.pos;
      if (Math.abs(diff) > 0.0008) {
        carousel.pos += diff * 0.16;
      } else {
        carousel.pos = carousel.target;
      }
    }
    paintCarousel();
    const settled = !carousel.dragging && Math.abs(carousel.target - carousel.pos) <= 0.0008;
    carousel.raf = settled ? null : requestAnimationFrame(carouselFrame);
  }

  function paintCarousel() {
    const { cards, pos } = carousel;
    const spacing = carouselSpacing();
    cards.forEach((card, i) => {
      const off = i - pos;
      const ao = Math.abs(off);
      // Golden params: center 100%/0°/0; ±1 ≈ 82%/±42°/-180/0.66; outer 60%/±60°/-400/faded
      const rot = Math.max(-60, Math.min(60, -off * 42));
      const z = -Math.min(ao * 180, 400);
      const scale = Math.max(0.6, 1 - 0.19 * ao);
      const opacity = Math.max(0.12, 1 - 0.34 * ao);
      card.style.transform =
        `translate(-50%,-50%) translateX(${(off * spacing).toFixed(1)}px) ` +
        `translateZ(${z.toFixed(1)}px) rotateY(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(2);
      // Depth sorting: center card always on top, side cards slide behind it.
      card.style.zIndex = String(100 - Math.round(ao * 10));
      card.style.visibility = opacity < 0.16 ? "hidden" : "visible";
      card.style.pointerEvents = ao <= 1.6 ? "auto" : "none";
      card.classList.toggle("is-center", ao < 0.5);
      const glare = card.querySelector(".mode-glare");
      if (glare) glare.style.opacity = ao < 0.5 ? "1" : Math.max(0, 0.4 - ao * 0.2).toFixed(2);
    });
    const sel = Math.max(0, Math.min(cards.length - 1, Math.round(pos)));
    if (sel !== carousel.selected) {
      carousel.selected = sel;
      carouselIndex = sel;
      const card = cards[sel];
      if (card) {
        card.classList.remove("just-centered");
        void card.offsetWidth; // restart the glint sweep
        card.classList.add("just-centered");
      }
      syncHomeTheme();
    }
    if (carouselDots) {
      Array.from(carouselDots.children).forEach((d, i) =>
        d.classList.toggle("active", i === carousel.selected));
    }
    if (carouselPrev) carouselPrev.disabled = carousel.selected <= 0;
    if (carouselNext) carouselNext.disabled = carousel.selected >= cards.length - 1;
  }

  function setCarouselTarget(idx) {
    if (!carousel) return;
    carousel.target = Math.max(0, Math.min(carousel.cards.length - 1, idx));
    // Immediately reflect the target mode's theme on the home page so the
    // whole site changes at once (animation then follows).
    if (homeView && !homeView.classList.contains("hidden")) {
      const mode = MODES[carousel.target];
      if (mode) document.body.dataset.mode = mode.key;
    }
    queueCarouselFrame();
  }

  function onCardClicked(idx) {
    if (!carousel) return;
    if (carousel.dragging || carousel.moved) {
      carousel.moved = false;
      return; // it was a drag, not a click
    }
    if (idx === carousel.selected) {
      // Center card: start the round
      startRound(MODES[idx].key);
    } else {
      // Side card: navigate carousel to bring that card to center
      setCarouselTarget(idx);
    }
  }

  function bindCarousel() {
    if (!carouselViewport || carouselViewport.dataset.bound) return;
    carouselViewport.dataset.bound = "1";

    carouselViewport.addEventListener("pointerdown", (e) => {
      if (!carousel) return;
      carousel.dragging = true;
      carousel.moved = false;
      carousel.dragStartX = e.clientX;
      carousel.dragStartPos = carousel.pos;
      carousel.lastX = e.clientX;
      carousel.lastT = performance.now();
      carousel.velocity = 0;
      carouselViewport.classList.add("dragging");
    });
    window.addEventListener("pointermove", (e) => {
      if (!carousel || !carousel.dragging) return;
      const spacing = carouselSpacing();
      const dx = e.clientX - carousel.dragStartX;
      if (Math.abs(dx) > 6) carousel.moved = true;
      const max = carousel.cards.length - 1;
      let raw = carousel.dragStartPos - dx / spacing;
      // Soft edge resistance (rubber band) past first/last card.
      if (raw < 0) raw *= 0.3;
      else if (raw > max) raw = max + (raw - max) * 0.3;
      carousel.pos = raw;
      const now = performance.now();
      const dt = Math.max(1, now - carousel.lastT) / 1000;
      carousel.velocity = (-(e.clientX - carousel.lastX) / spacing) / dt;
      carousel.lastX = e.clientX;
      carousel.lastT = now;
      queueCarouselFrame();
    });
    const endDrag = () => {
      if (!carousel || !carousel.dragging) return;
      carousel.dragging = false;
      carouselViewport.classList.remove("dragging");
      if (carousel.moved) {
        // Inertia projection, then snap to nearest card.
        const projected = carousel.pos + carousel.velocity * 0.18;
        setCarouselTarget(Math.round(projected));
        queueCarouselFrame();
      }
      // Non-drag click: do nothing here. The card click handler
      // (onCardClicked) runs after pointerup and decides start vs navigate.
      // The old setCarouselTarget(Math.round(carousel.pos)) snap-back could
      // clobber the target that click just set if event ordering differed.
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    carouselViewport.addEventListener("wheel", (e) => {
      if (!carousel) return;
      const now = performance.now();
      if (now < carousel.wheelLockedUntil) return;
      const delta = e.deltaY + e.deltaX;
      if (Math.abs(delta) < 4) return;
      carousel.wheelLockedUntil = now + 400; // one card per flick
      setCarouselTarget(carousel.selected + (delta > 0 ? 1 : -1));
      e.preventDefault();
    }, { passive: false });

    if (carouselPrev) carouselPrev.addEventListener("click", () =>
      setCarouselTarget((carousel ? carousel.selected : 0) - 1));
    if (carouselNext) carouselNext.addEventListener("click", () =>
      setCarouselTarget((carousel ? carousel.selected : 0) + 1));

    document.addEventListener("keydown", (e) => {
      if (!carousel || homeView.classList.contains("hidden")) return;
      if (e.key === "ArrowLeft") setCarouselTarget(carousel.selected - 1);
      else if (e.key === "ArrowRight") setCarouselTarget(carousel.selected + 1);
    });
  }

  function pick(modeKey) {
    const items = DATA[MODES.find((m) => m.key === modeKey).dataKey].texts;
    let idx = Math.floor(Math.random() * items.length);
    const last = loadJSON(LS_LAST, {});
    if (last[modeKey] != null && items.length > 1) {
      let guard = 0;
      while (items[idx].id === last[modeKey] && guard++ < 20) {
        idx = Math.floor(Math.random() * items.length);
      }
    }
    last[modeKey] = items[idx].id;
    saveJSON(LS_LAST, last);
    return items[idx];
  }

  function startRound(modeKey) {
    // Fix timer leak: clear old interval before replacing state
    if (state && state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    if (state && state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
    if (resultTimeoutId) {
      clearTimeout(resultTimeoutId);
      resultTimeoutId = null;
    }
    const mode = MODES.find((m) => m.key === modeKey);
    const item = pick(modeKey);
    const sameMode = state && state.modeKey === modeKey;
    const prevCount = sameMode ? (state.sessionCompleted || 0) : 0;
    const prevRoundTyped = sameMode && prevCount > 0 ? (state.roundTotalTyped || 0) : 0;
    const prevRoundCorrect = sameMode && prevCount > 0 ? (state.roundTotalCorrect || 0) : 0;
    const prevRoundElapsed = sameMode && prevCount > 0 ? (state.roundElapsed || 0) : 0;
    const prevRoundStartedAt = sameMode && prevCount > 0 ? (state.roundStartedAt || null) : null;
    state = {
      modeKey, mode, item,
      lines: [item.text],
      lineIdx: 0,
      inputs: [], // committed string per line
      currentInputEl: null,
      composing: false,
      composingText: "",
      composingRawText: "",
      composingKeys: [],
      composingKeysBase: 0, // composingKeys indices < base belong to committed chars (phrase composition)
      lastHintCharIdx: 0, // charIdx at last paintOnKeyboard (detects commits within one composition)
      lastKeySeqIdx: null, // last hinted position {charIdx, layout} — detects state recreation below
      frozenCangjieHint: null,
      frozenCangjieInfo: null,
      lastKeyError: null, // wrong physical key label that currently shows red frame
      startedAt: null,
      elapsed: 0,
      timerId: null,
      finished: false,
      totalTyped: 0,
      totalCorrect: 0,
      sessionCompleted: prevCount,
      roundTotalTyped: prevRoundTyped,
      roundTotalCorrect: prevRoundCorrect,
      roundElapsed: prevRoundElapsed,
      roundStartedAt: prevRoundStartedAt,
      autoNextTimer: null,
    };
    state.inputs = state.lines.map(() => "");
    showPractice();
    renderPractice();
    focusCurrent();
  }

  function showPractice() {
    document.body.dataset.mode = state.modeKey;
    homeView.classList.add("hidden");
    practiceView.classList.remove("hidden");
    resultOverlay.classList.add("hidden");
    $("#practiceTitle").textContent = state.mode.title;
  }

  function showHome() {
    // Cancel any pending result modal that would reappear after going home
    if (resultTimeoutId) {
      clearTimeout(resultTimeoutId);
      resultTimeoutId = null;
    }
    if (state && state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
    // Keep overall theme in sync with the last selected mode instead of clearing it.
    // renderHome() below also re-asserts the mode from carouselIndex.
    // Abort an unfinished finite round: next entry starts a fresh round.
    if (state && isShortMode(state.modeKey) && !isEndlessEnabled(state.modeKey)) {
      state.sessionCompleted = 0;
      state.roundTotalTyped = 0;
      state.roundTotalCorrect = 0;
      state.roundElapsed = 0;
      state.roundStartedAt = null;
    }
    resultOverlay.classList.add("hidden");
    practiceView.classList.add("hidden");
    homeView.classList.remove("hidden");
    stopTimer();
    renderHome();
  }

  // English input protection: if 2 English letters typed in 'words' mode, skip question
  function checkEnglishProtection(val) {
    if (!state || state.modeKey !== "words" || state.finished) return false;
    if (state.composing) return false;

    const letters = (val || "").match(/[a-zA-Z]/g);
    if (letters && letters.length >= 2) {
      triggerEnglishProtection();
      return true;
    }
    return false;
  }

  function triggerEnglishProtection() {
    if (!state || state.finished) return;
    state.finished = true;
    stopTimer();
    state.startedAt = null;

    if (state.currentInputEl) {
      state.currentInputEl.value = "";
      state.currentInputEl.disabled = true;
    }

    hint("⚠️ 偵測到英文輸入法，請切換至中文輸入法！（已自動跳下一題）");

    setTimeout(() => {
      if (state && state.modeKey === "words") {
        startRound("words");
        hint("⚠️ 已自動跳下一題，請確認鍵盤已切換為中文輸入法。");
      }
    }, 450);
  }

  function renderPractice() {
    clearKeyError();
    const box = $("#targetBox");
    const inBox = $("#inputBox");
    box.innerHTML = "";
    inBox.innerHTML = "";

    // 1. Render target lines (all lines visible for reading context)
    state.lines.forEach((line, li) => {
      const div = document.createElement("div");
      div.className = "target-line" + (li === state.lineIdx ? " current-line" : "");
      div.dataset.line = li;
      Array.from(line).forEach((ch, ci) => {
        const s = document.createElement("span");
        s.className = "char pending";
        s.dataset.line = li; s.dataset.pos = ci;
        s.textContent = ch === " " ? "\u00a0" : ch;
        div.appendChild(s);
      });
      box.appendChild(div);
    });

    // 2. Render ONLY ONE active input bar at a time (even for multi-line articles)
    const li = state.lineIdx;
    const active = !state.finished;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = state.inputs[li] || "";
    if (state.lines.length > 1) {
      const isLastLine = li >= state.lines.length - 1;
      inp.placeholder = active
        ? `第 ${li + 1} / ${state.lines.length} 行：在此輸入…（${isLastLine ? "打對即完成" : "打對自動換行"}）`
        : "（已完成）";
    } else {
      inp.placeholder = active ? "在此輸入…" : "（已完成）";
    }
    inp.disabled = !active;
    inp.autocomplete = "off"; inp.autocorrect = "off"; inp.autocapitalize = "off"; inp.spellcheck = false;
    inp.setAttribute("aria-label", `第 ${li + 1} 行輸入`);
    inp.dataset.line = li;

    inp.addEventListener("compositionstart", () => {
      ensureTimerStarted();
      state.composing = true;
      state.composingText = "";
      state.composingRawText = "";
      state.composingKeys = [];
      state.composingKeysBase = 0;
      // Freeze ONLY the top-right decomposition until the user presses
      // Space (or otherwise commits the composition). The bottom key hint
      // must keep progressing one key at a time (see paintOnKeyboard).
      state.frozenCangjieHint = cangjieHint ? cangjieHint.innerHTML : null;
      state.frozenCangjieInfo = getCurrentPosInfo();
      paint();
    });
    inp.addEventListener("compositionupdate", (e) => {
      ensureTimerStarted();
      state.composingRawText = e.data || state.composingRawText;
      state.composingText = e.data || state.composingText;
      paint();
    });
    inp.addEventListener("compositionend", (e) => {
      ensureTimerStarted();
      state.composing = false;
      state.composingText = "";
      state.composingRawText = "";
      state.composingKeys = [];
      state.composingKeysBase = 0;
      state.frozenCangjieHint = null;
      state.frozenCangjieInfo = null;
      if (checkEnglishProtection(e.target.value)) return;
      state.inputs[li] = e.target.value;
      onCommitted(li);
      paint();
      maybeFinish();
      focusCurrent();
    });
    inp.addEventListener("input", (e) => {
      ensureTimerStarted();
      if (checkEnglishProtection(e.target.value)) return;
      if (e.inputType === "deleteContentBackward" || e.inputType === "deleteContentForward") {
        clearKeyError();
        setHintDefault();
      }
      if (state && typeof state.lastInputVal === "string" && e.target.value.length < state.lastInputVal.length) {
        clearKeyError();
        setHintDefault();
      }
      if (state) state.lastInputVal = e.target.value;
      const info = getCurrentPosInfo();
      const completedStr = info && info.completed ? info.completed.join("") : "";
      if (completedStr.length > (state.inputs[li] || "").length) {
        state.inputs[li] = completedStr;
        onCommitted(li);
        maybeFinish();
      }

      if (state.composing) {
        const val = e.target.value;
        // Only treat the live value as preedit when it actually ends with
        // preedit for the current layout. The Cangjie-radical set must NOT
        // apply to Zhuyin: a committed hanzi like 中/一/人 matches it, and
        // overwriting composingText with hanzi-only val destroys the
        // preedit from compositionupdate -> hint freezes on the first key.
        const layoutNow = getCurrentLayout();
        const isCodeNow = layoutNow === "cangjie" || layoutNow === "boshiamy" || layoutNow === "sucheng";
        const hasTrailingPreedit = isCodeNow
          ? /[a-zA-Z日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜重]$/.test(val)
          : /[ㄅ-ㄩˊˇˋ˙]$/.test(val);
        if (hasTrailingPreedit) {
          state.composingText = val;
          state.composingRawText = val;
        } else {
          state.composingText = "";
          state.composingRawText = "";
        }
        // If the DOM value does not expose the preedit (common for Cangjie:
        // value stays "" / committed-only while letters live only in
        // compositionupdate), preserve compositionupdate's data. Overwriting
        // it with the empty value was why the key hint stuck on key #1.
        paint();
        return;
      }
      state.inputs[li] = e.target.value;
      onCommitted(li);
      paint();
      maybeFinish();
    });
    inp.addEventListener("keydown", (e) => {
      const ignoreCodes = new Set([
        "Tab", "Escape", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
        "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "PageUp", "PageDown", "Insert", "Delete",
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
        "ContextMenu", "NumLock", "ScrollLock", "Pause"
      ]);
      const ignoreKeys = new Set([
        "Tab", "Escape", "Shift", "Control", "Alt", "Meta", "CapsLock",
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Home", "End", "PageUp", "PageDown", "Insert", "Delete",
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"
      ]);
      const isModifierOrNav = ignoreCodes.has(e.code) || ignoreKeys.has(e.key) || e.ctrlKey || e.altKey || e.metaKey;

      const isBackspace = e.key === "Backspace" || e.code === "Backspace" || e.keyCode === 8;
      const isEnter = e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;

      if (isBackspace) {
        clearKeyError();
        setHintDefault();
      }

      // Flash feedback for on-screen keyboard: white = correct, red = wrong (persist until Backspace)
      if (onKeyboard && !onKeyboardWrap.classList.contains("hidden") && currentExpectedKey && !isBackspace && !isEnter && !isModifierOrNav) {
        let pressedEl = null;
        if (e.code) {
          pressedEl = onKeyboard.querySelector(`.on-kb-key[data-code="${e.code}"]`);
        }
        if (!pressedEl && e.key && e.key !== "Process") {
          const k = e.key.toLowerCase();
          pressedEl = k === " "
            ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
            : findOnKbKey(k);
        }

        if (pressedEl) {
          const expected = currentExpectedKey;
          const isSpacePress = e.code === "Space" || (expected.isSpace && (e.code === "Digit1" || e.key === "1")) || (e.key === " " && e.key !== "Process");
          let isCorrect = false;

          if (expected.isSpace) {
            isCorrect = isSpacePress;
          } else if (isSpacePress) {
            isCorrect = false;
          } else {
            isCorrect = (
              (expected.code && pressedEl.dataset.code === expected.code) ||
              (expected.el && pressedEl === expected.el) ||
              (expected.key && pressedEl.dataset.key && pressedEl.dataset.key.toLowerCase() === expected.key.toLowerCase())
            );
          }

          if (isCorrect) {
            flashKeyElement(pressedEl, "white");
            clearKeyError();
            setHintDefault();
          } else {
            flashKeyElement(pressedEl, "red");
            onKeyboard.querySelectorAll(".is-error").forEach((k) => k.classList.remove("is-error"));
            pressedEl.classList.add("is-error");
            state.lastKeyError = pressedEl.dataset.code || pressedEl.dataset.key || "error";
            hint("❌ 按錯鍵 — 請按 Backspace 修改");
          }
        }
      }

      if (!isModifierOrNav) {
        if (!(isBackspace && !e.target.value && !state.composing)) {
          ensureTimerStarted();
        }
      }
      if (state.composing) {
        let pressedLetter = null;
        if (e.key && /^[a-zA-Z]$/.test(e.key)) {
          pressedLetter = e.key.toLowerCase();
        } else if (e.code && CODE_TO_KEY[e.code]) {
          // During IME composition e.key is often "Process"; e.code carries
          // the physical key, including digits (tones) and punctuation.
          pressedLetter = CODE_TO_KEY[e.code];
        }
        if (pressedLetter) state.composingKeys.push(pressedLetter);
        else if (isBackspace) state.composingKeys.pop();
      } else if (!isBackspace && !isModifierOrNav && e.key && e.key !== "Process") {
        // No composition events at all (rare IME/browser combos). Track
        // physical keys anyway so the key hint can advance from them.
        if (/^[a-zA-Z]$/.test(e.key)) {
          state.composingKeys.push(e.key.toLowerCase());
        } else if (e.code && CODE_TO_KEY[e.code]) {
          state.composingKeys.push(CODE_TO_KEY[e.code]);
        }
      }
      if (isEnter) {
        e.preventDefault();
        if (state.composing) return; // Enter during IME selection must not advance
        const targetLen = Array.from(state.lines[li]).length;
        const cur = Array.from(state.inputs[li] || "").length;
        if (cur < targetLen) {
          hint("本行還沒打完（" + cur + "/" + targetLen + "）。打滿按 Enter。");
          return;
        }
        advance(li);
      }
    });

    inBox.appendChild(inp);
    state.currentInputEl = inp;
    // Extra timer-start catches for IMEs that don't fire compositionstart/keydown reliably
    inp.addEventListener("keyup", () => ensureTimerStarted());
    inp.addEventListener("beforeinput", () => ensureTimerStarted());

    updateHud();
    setHintDefault();
    syncAutoAdvanceCheck();
    syncEndlessCheck();
    renderOnKeyboard();
    paintCangjieHint();
  }

  // ---- On-screen key hint keyboard (鍵位提示) ----
  // Matches physical ANSI Taiwan keyboard layout.
  function isOnKeyboardEnabled() {
    return onKeyboardCheck ? onKeyboardCheck.checked : false;
  }

  function buildOnKeyboard(layout) {
    if (!onKeyboard) return;
    onKeyboard.innerHTML = "";
    onKeyboard.dataset.layout = layout;
    const isBopomofo = layout === "bopomofo";
    const isCangjie = layout === "cangjie";
    const isBoshiamy = layout === "boshiamy";
    const isSucheng = layout === "sucheng";
    const isCodeLayout = isCangjie || isBoshiamy || isSucheng;

    ANSI_KEYBOARD_ROWS.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "on-kb-row";
      row.forEach((item) => {
        const key = document.createElement("button");
        key.type = "button";
        key.className = "on-kb-key" + (item.isFn ? " is-fn" : "") + (item.isSpace ? " is-space" : "");
        key.style.setProperty("--u", String(item.u || 1.0));
        key.dataset.code = item.id;
        if (item.key) key.dataset.key = item.key;
        if (item.shift) key.dataset.shift = item.shift;
        if (item.mainZh) key.dataset.zh = item.mainZh;

        if (isCangjie) {
          // 倉頡版面：鍵面主字 = 字根（A=日 … Y=卜，X=難，Z=重），副字 = 英文字母；
          // 非字母鍵（數字/標點）無字根，退回英數面；空白鍵副字為「選字」。
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">${item.label}</span><span class="k-sub">選字</span>`;
          } else if (item.key && CANGJIE_RADICAL[item.key.toLowerCase()]) {
            key.innerHTML = `<span class="k-main">${CANGJIE_RADICAL[item.key.toLowerCase()]}</span><span class="k-sub">${item.key.toUpperCase()}</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.shift || (item.key || "").toUpperCase()}</span><span class="k-sub">${item.key || ""}</span>`;
          }
        } else if (isBoshiamy || isSucheng) {
          // 嘸蝦米／速成版面：鍵面只顯示大寫英文字母（使用者要求：不要部首）。
          // 嘸蝦米本來就只有 26 個英文字母鍵位；速成的鍵位與倉頡同（取首尾碼），
          // 鍵面一樣只印字母，避免與右上角拆字混淆。空白鍵副字為「選字」。
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">${item.label}</span><span class="k-sub">選字</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.shift || (item.key || "").toUpperCase()}</span><span class="k-sub">${item.key || ""}</span>`;
          }
        } else if (isBopomofo) {
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">${item.label}</span><span class="k-sub">${item.sub}</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.mainZh || ""}</span><span class="k-sub">${item.sub || ""}</span>`;
          }
        } else {
          // Fallback（舊值 qwerty 相容）：等同英數面
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">Space</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.shift || item.key.toUpperCase()}</span><span class="k-sub">${item.key || ""}</span>`;
          }
        }

        key.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (item.type === "back") {
            clearKeyError();
            setHintDefault();
            const inp = state && state.currentInputEl;
            if (inp && !inp.disabled) {
              inp.value = Array.from(inp.value).slice(0, -1).join("");
              inp.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } else if (item.type === "space") {
            typeOnKeyboardKey(" ", key);
          } else if (item.type === "enter") {
            const inp = state && state.currentInputEl;
            if (inp && !inp.disabled) {
              inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            }
          } else if (!isBopomofo && item.key) {
            typeOnKeyboardKey(item.key, key);
          } else {
            focusCurrent();
          }
        });

        rowEl.appendChild(key);
      });
      onKeyboard.appendChild(rowEl);
    });
  }

  function renderOnKeyboard() {
    if (!onKeyboardWrap || !onKeyboard) return;
    const show = isOnKeyboardEnabled() && state && !state.finished;
    onKeyboardWrap.classList.toggle("hidden", !show);
    if (!show) return;
    const layout = (loadJSON(LS_ONKB, {}) || {}).layout || (layoutSelect ? layoutSelect.value : "bopomofo");
    if (onKeyboard.dataset.layout !== layout) buildOnKeyboard(layout);
    paintOnKeyboard();
  }

  function typeOnKeyboardKey(text, keyEl) {
    if (!state || !state.currentInputEl || state.currentInputEl.disabled) return;
    ensureTimerStarted();

    if (keyEl && onKeyboard && currentExpectedKey) {
      const expected = currentExpectedKey;
      const isSpacePress = text === " " || keyEl.dataset.code === "Space";
      let isCorrect = false;

      if (expected.isSpace) {
        isCorrect = isSpacePress;
      } else if (isSpacePress) {
        isCorrect = false;
      } else {
        isCorrect = (
          (expected.code && keyEl.dataset.code === expected.code) ||
          (expected.el && keyEl === expected.el) ||
          (expected.key && keyEl.dataset.key && keyEl.dataset.key.toLowerCase() === expected.key.toLowerCase())
        );
      }

      if (isCorrect) {
        flashKeyElement(keyEl, "white");
        clearKeyError();
        setHintDefault();
      } else {
        flashKeyElement(keyEl, "red");
        onKeyboard.querySelectorAll(".is-error").forEach((k) => k.classList.remove("is-error"));
        keyEl.classList.add("is-error");
        state.lastKeyError = keyEl.dataset.code || keyEl.dataset.key || "error";
        hint("❌ 按錯鍵 — 請按 Backspace 修改");
      }
    }

    state.currentInputEl.value = (state.currentInputEl.value || "") + text;
    state.currentInputEl.dispatchEvent(new Event("input", { bubbles: true }));
    paintOnKeyboard();
    focusCurrent();
  }

  // Look up character in the Chinese Character Zhuyin Dictionary (字庫).
  // Dynamic query: detects current character, checks phrase context, falls back to char dictionary.
  function lookupZhuyinForChar(ch, contextLine, charIdx) {
    if (!ch || !ZHUYIN) return null;
    const charsDict = ZHUYIN.chars || ZHUYIN;
    const phrasesDict = ZHUYIN.phrases || {};

    // 1. Context phrase matching (for polyphonic characters / 破音字)
    if (contextLine && typeof charIdx === "number") {
      const lineChars = Array.from(contextLine);
      for (let len = 4; len >= 2; len--) {
        for (let start = Math.max(0, charIdx - len + 1); start <= charIdx && start + len <= lineChars.length; start++) {
          const phrase = lineChars.slice(start, start + len).join("");
          if (phrasesDict[phrase]) {
            const offset = charIdx - start;
            if (phrasesDict[phrase][offset]) {
              return phrasesDict[phrase][offset];
            }
          }
        }
      }
    }

    // 2. Direct character lookup in the dictionary
    if (charsDict[ch]) {
      return charsDict[ch];
    }
    return null;
  }

  function getCurrentLayout() {
    return (onKeyboard && onKeyboard.dataset.layout) ||
           (layoutSelect ? layoutSelect.value : "") ||
           ((loadJSON(LS_ONKB, {}) || {}).layout) ||
           "bopomofo";
  }

  function getCurrentPosInfo() {
    if (!state || state.finished || !state.lines) return null;
    const lineIdx = state.lineIdx;
    const targetLine = state.lines[lineIdx] || "";
    const targetChars = Array.from(targetLine);

    const layout = getCurrentLayout();
    const liveVal = (state.currentInputEl ? state.currentInputEl.value : state.inputs[lineIdx]) || "";
    const liveChars = Array.from(liveVal);

    let completedChars = [];
    let composingSlice = "";

    if (layout === "bopomofo") {
      const bopomofoRegex = /[ㄅ-ㄩˊˇˋ˙]/;
      let bopomofoStart = liveChars.length;
      while (bopomofoStart > 0 && bopomofoRegex.test(liveChars[bopomofoStart - 1])) {
        bopomofoStart--;
      }

      composingSlice = liveChars.slice(bopomofoStart).join("");
      // Some IMEs keep the preedit only in composition events, not in value.
      if (!composingSlice && state.composingText) {
        const rawComp = Array.from(state.composingText);
        let cStart = rawComp.length;
        while (cStart > 0 && bopomofoRegex.test(rawComp[cStart - 1])) {
          cStart--;
        }
        composingSlice = rawComp.slice(cStart).join("");
      }

      completedChars = liveChars.slice(0, bopomofoStart);
    } else if (layout === "boshiamy") {
      let bStart = liveChars.length;
      while (bStart > 0 && (liveChars.length - bStart) < 5 && /^[a-zA-Z]$/.test(liveChars[bStart - 1])) {
        bStart--;
      }
      composingSlice = liveChars.slice(bStart).join("");
      if (!composingSlice && state.composingRawText) composingSlice = state.composingRawText;
      if (!composingSlice && state.composingText) composingSlice = state.composingText;
      completedChars = liveChars.slice(0, bStart);
    } else {
      // 倉頡 (cangjie) / 速成 (sucheng)
      // 只有英文字母 [a-zA-Z] 或 24 個倉頡字根 [日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜重]
      // 才可能是組字區的字根代碼。任何非字根漢字（如「功」、「有」、「這」、「個」、「能」、「打」等）或標點符號，
      // 絕不可能為組字碼，必定是已送出的確定文字。
      const isCjPreeditChar = (c) => /^[a-zA-Z日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜重]$/.test(c);
      const maxPreedit = (layout === "sucheng") ? 2 : 5;
      let pStart = liveChars.length;
      while (
        pStart > 0 &&
        (liveChars.length - pStart) < maxPreedit &&
        isCjPreeditChar(liveChars[pStart - 1])
      ) {
        pStart--;
      }

      // 若目標文字本身剛好是字根漢字（例如「一」、「大」、「中」），
      // 且使用者先前已送出該字，後方接續的是新字的字根，需向後推進已確定字數。
      while (pStart < liveChars.length) {
        const targetIdx = pStart;
        if (targetIdx >= targetChars.length) break;
        const curCh = liveChars[pStart];
        const tgtCh = targetChars[targetIdx];
        if (curCh === tgtCh) {
          if (pStart < liveChars.length - 1) {
            pStart++;
            continue;
          }
          if (!state.composing) {
            pStart++;
            continue;
          }
        }
        break;
      }

      composingSlice = liveChars.slice(pStart).join("");
      if (!composingSlice && state.composingRawText) {
        composingSlice = state.composingRawText;
      }
      if (!composingSlice && state.composingText) {
        composingSlice = state.composingText;
      }

      completedChars = liveChars.slice(0, pStart);
    }

    const currentCharIdx = completedChars.length;
    if (currentCharIdx >= targetChars.length) return null;
    const ch = targetChars[currentCharIdx];

    const zhuyin = lookupZhuyinForChar(ch, targetLine, currentCharIdx);
    return { char: ch, zhuyin, lineIdx, charIdx: currentCharIdx, composingSlice, completed: completedChars };
  }

  // Extract Cangjie code letters from IME preedit fragments.
  function lettersFromPreedit(text) {
    return Array.from(text || "")
      .map((s) => {
        const low = s.toLowerCase();
        if (CANGJIE_RADICAL[low]) return low;
        if (CANGJIE_RADICAL_TO_KEY[s]) return CANGJIE_RADICAL_TO_KEY[s];
        return null;
      })
      .filter(Boolean);
  }

  // Look up a character's Cangjie code in cangjie.json (flat {字: 小寫碼}).
  // Generated by build_cangjie.py from Jackchows/Cangjie5 Cangjie5_TC.txt.
  function lookupCangjieForChar(ch) {
    if (!ch || !CANGJIE) return null;
    return CANGJIE[ch] || null;
  }

  function radicalsForCode(code) {
    return Array.from(code || "").map((c) => CANGJIE_RADICAL[c] || c).join(" ");
  }

  // 嘸蝦米只顯示英文字母（使用者要求：不要部首/字根漢字）。
  // 嘸蝦米本來就只有 26 個英文字母鍵位，字根是靠形/音/義聯想，不需要
  // 在提示裡再印漢字部首；這裡只回傳小寫碼，前端以大寫字母顯示。
  // 例：炒=fsp -> 顯示 F S P（原倉頡 ffh 為 火 尸 心，完全不同套）。

  // ---- 拆字三法：倉頡 / 嘸蝦米 / 速成（右上角橫向反向環滾輪）----
  // 使用者要的不是頁籤，而是「整顆小長方形」：三個完整方塊並排，
  // 每塊寫「倉頡 一：一 m」/「嘸蝦米 一：E」/「速成 一：一 m」這種格式，
  // 用橫向滾輪切換，角度與首頁反向（原始第一版即此樣子）。
  // 首頁 coverflow: translateX(off*spacing) + rotateY(-off*42deg)。
  // 這裡: 圓柱 sin/cos 投影 + rotateY(+off*26deg)（反向環，非平面直線）。
  const DECOMP_METHODS = [
    { key: "cangjie", label: "倉頡", dataKey: "cangjie" },
    { key: "boshiamy", label: "嘸蝦米", dataKey: "boshiamy" },
    { key: "sucheng", label: "速成", dataKey: "sucheng" },
  ];
  const DECOMP_RING_STEP = 26;
  const DECOMP_RING_RADIUS = 88;
  let decompWheel = null;
  let decompWheelChar = null;
  let decompWheelBody = null;
  let decompWheelInfo = null;

  function methodLabel(key) {
    const m = DECOMP_METHODS.find((x) => x.key === key);
    return m ? m.label : key;
  }

  // 速成 = 倉頡碼取首碼＋尾碼（1–2 碼原樣；3 碼以上取首尾，如謝 yrhhi→yi）。
  // Windows 速成另有微調，但「首＋尾」是標準教法，練習提示用此即可。
  function suchengCodeForChar(ch) {
    const cj = lookupCangjieForChar(ch);
    if (!cj) return null;
    if (cj.length <= 2) return cj;
    return cj[0] + cj[cj.length - 1];
  }

  function decompositionFor(ch, method) {
    if (!ch) return null;
    if (method === "boshiamy") {
      if (!BOSHIAMY) return { missing: "字庫未載入" };
      const code = BOSHIAMY[ch] || null;
      if (!code) return { missing: "查無拆字" };
      // 嘸蝦米只顯示英文字母，不顯示部首/字根漢字（使用者要求）。
      return { code, radicals: null, lettersOnly: true };
    }
    if (method === "sucheng") {
      if (!CANGJIE) return { missing: "字庫未載入" };
      const code = suchengCodeForChar(ch);
      if (!code) return { missing: "查無拆字" };
      return { code, radicals: radicalsForCode(code) };
    }
    // cangjie
    if (!CANGJIE) return { missing: "字庫未載入" };
    const code = lookupCangjieForChar(ch);
    if (!code) return { missing: "查無拆字" };
    return { code, radicals: radicalsForCode(code) };
  }

  // ---- 拆字環滾輪（右上角整顆小長方形）----
  // 三個完整方塊：倉頡 一：一 m / 嘸蝦米 一：E / 速成 一：一 m
  // （格式：輸入法名 + 目前字 + ： + 拆字；嘸蝦米只顯示大寫字母，
  //  倉頡/速成顯示字根 + 小寫碼）。橫向反向環切換：可拖曳、滾輪、
  // 點側邊方塊、點左右箭頭。中央方塊為目前選中的輸入法。
  // 角度與首頁反向：首頁 rotateY(-off*42deg)，此處 rotateY(+off*26deg)
  // 配 sin/cos 圓柱投影，側卡繞環往後收，不是平面直線排法。

  function methodIndex(key) {
    return DECOMP_METHODS.findIndex((m) => m.key === key);
  }

  function decompositionCardHTML(ch, methodKey) {
    const label = methodLabel(methodKey);
    if (!ch) return `<span class="decomp-name">${label}</span> ： —`;
    if (PUNCT_KEY_MAP[ch] || /^[\x00-\x7F]$/.test(ch)) {
      return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： 照打`;
    }
    const dec = decompositionFor(ch, methodKey);
    if (dec && dec.missing) {
      return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： ${dec.missing}`;
    }
    if (dec.lettersOnly) {
      const letters = Array.from(dec.code).map((c) => c.toUpperCase()).join(" ");
      return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： <span class="cj-letters">${letters}</span>`;
    }
    return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： <span class="cj-radicals">${dec.radicals}</span> <span class="cj-code">${dec.code}</span>`;
  }

  function clearDecompWheel() {
    if (decompWheel && decompWheel.raf != null) cancelAnimationFrame(decompWheel.raf);
    decompWheel = null;
    decompWheelChar = null;
    decompWheelBody = null;
    decompWheelInfo = null;
  }

  function queueDecompWheelFrame() {
    if (!decompWheel || decompWheel.raf != null) return;
    decompWheel.raf = requestAnimationFrame(decompWheelFrame);
  }

  function decompWheelFrame() {
    if (!decompWheel) return;
    decompWheel.raf = null;
    if (!decompWheel.dragging) {
      const diff = decompWheel.target - decompWheel.pos;
      if (Math.abs(diff) > 0.001) {
        decompWheel.pos += diff * 0.18;
      } else {
        decompWheel.pos = decompWheel.target;
      }
    }
    paintDecompWheel();
    const settled = !decompWheel.dragging && Math.abs(decompWheel.target - decompWheel.pos) <= 0.001;
    if (settled) {
      const n = decompWheel.cards.length;
      const wrapped = ((decompWheel.pos % n) + n) % n;
      decompWheel.pos = wrapped;
      decompWheel.target = wrapped;
      paintDecompWheel();
      decompWheel.raf = null;
    } else {
      queueDecompWheelFrame();
    }
  }

  function paintDecompWheel() {
    if (!decompWheel) return;
    const n = decompWheel.cards.length;
    const spacing = decompWheel.viewport
      ? Math.max(220, decompWheel.viewport.clientWidth * 0.95)
      : 245;
    decompWheel.cards.forEach((card, i) => {
      let raw = i - decompWheel.pos;
      // Continuous wrap into [-n/2, n/2]
      let off = ((raw + n / 2) % n + n) % n - n / 2;
      const ao = Math.abs(off);
      const angle = Math.max(-28, Math.min(28, -off * 20));
      const x = off * spacing;
      const z = -Math.min(ao * 50, 100);
      const scale = Math.max(0.86, 1 - 0.14 * ao);
      // Center card has full opacity; non-center cards fade out cleanly so they never overlap or clutter
      const opacity = ao <= 0.85 ? Math.max(0, 1 - 1.18 * ao) : 0;
      card.style.transform =
        `translate(-50%,-50%) translateX(${x.toFixed(1)}px) ` +
        `translateZ(${z.toFixed(1)}px) rotateY(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(2);
      card.style.zIndex = String(100 - Math.round(ao * 20));
      card.style.visibility = opacity <= 0.01 ? "hidden" : "visible";
      card.style.pointerEvents = ao < 0.5 ? "auto" : "none";
      card.classList.toggle("is-center", ao < 0.5);
    });
    const sel = ((Math.round(decompWheel.pos) % n) + n) % n;
    decompWheel.selected = sel;
    const newKey = DECOMP_METHODS[sel].key;
    if (newKey !== decompMethod) {
      decompMethod = newKey;
      saveJSON(LS_DECOMP, newKey);
    }
  }

  function setDecompWheelTarget(idx) {
    if (!decompWheel) return;
    decompWheel.target = idx;
    queueDecompWheelFrame();
  }

  function buildDecompWheel(ch, bodyHTML) {
    const startIdx = Math.max(0, methodIndex(decompMethod));
    cangjieHint.innerHTML =
      `<span class="decomp-wheel" role="group" aria-label="拆字輸入法滾輪：倉頡、嘸蝦米、速成">` +
      `<span class="decomp-wheel-track"></span></span>` +
      `<span class="decomp-wheel-nav">` +
      `<button type="button" class="decomp-wheel-prev" aria-label="上一個輸入法" tabindex="-1">‹</button>` +
      `<button type="button" class="decomp-wheel-next" aria-label="下一個輸入法" tabindex="-1">›</button>` +
      `</span>`;
    const viewport = cangjieHint.querySelector(".decomp-wheel");
    const track = cangjieHint.querySelector(".decomp-wheel-track");
    const cards = DECOMP_METHODS.map((m) => {
      const card = document.createElement("span");
      card.className = "decomp-wheel-card";
      card.dataset.method = m.key;
      card.innerHTML = decompositionCardHTML(ch, m.key);
      track.appendChild(card);
      return card;
    });
    decompWheel = {
      cards,
      viewport,
      bodyEl: null,
      pos: startIdx,
      target: startIdx,
      selected: startIdx,
      raf: null,
      dragging: false,
      moved: false,
      dragStartX: 0,
      dragStartPos: 0,
      lastX: 0,
      lastT: 0,
      velocity: 0,
      wheelLockedUntil: 0,
    };
    decompWheelChar = ch;
    decompWheelBody = bodyHTML;
    decompWheelInfo = true;
    paintDecompWheel();
    queueDecompWheelFrame();
  }

  function updateDecompWheelCardText() {
    if (!decompWheel) return;
    decompWheel.cards.forEach((card) => {
      card.innerHTML = decompositionCardHTML(decompWheelChar, card.dataset.method);
    });
  }

  function bindDecompWheel() {
    if (!cangjieHint || cangjieHint.dataset.decompBound) return;
    cangjieHint.dataset.decompBound = "1";

    // Nav buttons click (‹ / ›)
    cangjieHint.addEventListener("click", (e) => {
      const prev = e.target.closest(".decomp-wheel-prev");
      const next = e.target.closest(".decomp-wheel-next");
      if (prev) {
        e.preventDefault();
        setDecompWheelTarget(Math.round(decompWheel ? decompWheel.target : 0) - 1);
        focusCurrent();
        return;
      }
      if (next) {
        e.preventDefault();
        setDecompWheelTarget(Math.round(decompWheel ? decompWheel.target : 0) + 1);
        focusCurrent();
        return;
      }
    });

    // Pointer events on the wheel (drag & tap/click)
    cangjieHint.addEventListener("pointerdown", (e) => {
      const vp = e.target.closest(".decomp-wheel");
      if (!vp || !decompWheel) return;
      decompWheel.dragging = true;
      decompWheel.moved = false;
      decompWheel.dragStartX = e.clientX;
      decompWheel.dragStartPos = decompWheel.pos;
      decompWheel.lastX = e.clientX;
      decompWheel.lastT = performance.now();
      decompWheel.velocity = 0;
      vp.classList.add("dragging");
    });

    window.addEventListener("pointermove", (e) => {
      if (!decompWheel || !decompWheel.dragging) return;
      const dx = e.clientX - decompWheel.dragStartX;
      if (Math.abs(dx) > 5) decompWheel.moved = true;
      const dragScale = decompWheel.viewport ? decompWheel.viewport.clientWidth * 0.75 : 180;
      decompWheel.pos = decompWheel.dragStartPos - dx / dragScale;
      const now = performance.now();
      const dt = Math.max(1, now - decompWheel.lastT) / 1000;
      decompWheel.velocity = Math.max(-6, Math.min(6, (-(e.clientX - decompWheel.lastX) / dragScale) / dt));
      decompWheel.lastX = e.clientX;
      decompWheel.lastT = now;
      queueDecompWheelFrame();
    });

    const endDrag = (e) => {
      if (!decompWheel || !decompWheel.dragging) return;
      decompWheel.dragging = false;
      if (decompWheel.viewport) decompWheel.viewport.classList.remove("dragging");
      if (decompWheel.moved) {
        // Drag momentum
        setDecompWheelTarget(Math.round(decompWheel.pos + decompWheel.velocity * 0.15));
      } else if (e) {
        // Tap / click without drag
        const card = e.target.closest(".decomp-wheel-card");
        const vp = e.target.closest(".decomp-wheel");
        if (card) {
          const targetMethod = card.dataset.method;
          const targetIdx = methodIndex(targetMethod);
          if (targetIdx !== -1) {
            let diff = targetIdx - (((decompWheel.pos % 3) + 3) % 3);
            diff = ((diff + 1.5) % 3 + 3) % 3 - 1.5;
            if (Math.abs(diff) < 0.2 && vp) {
              const rect = vp.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              if (e.clientX < cx - 40) setDecompWheelTarget(Math.round(decompWheel.pos) - 1);
              else if (e.clientX > cx + 40) setDecompWheelTarget(Math.round(decompWheel.pos) + 1);
            } else {
              setDecompWheelTarget(Math.round(decompWheel.pos + diff));
            }
          }
        } else if (vp) {
          const rect = vp.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          if (e.clientX < cx - 35) setDecompWheelTarget(Math.round(decompWheel.pos) - 1);
          else if (e.clientX > cx + 35) setDecompWheelTarget(Math.round(decompWheel.pos) + 1);
        }
      }
      focusCurrent();
      setTimeout(() => { if (decompWheel) decompWheel.moved = false; }, 0);
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // Mouse wheel (scroll wheel)
    cangjieHint.addEventListener("wheel", (e) => {
      if (!decompWheel) return;
      const now = performance.now();
      if (now < decompWheel.wheelLockedUntil) { e.preventDefault(); return; }
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 4) return;
      decompWheel.wheelLockedUntil = now + 180;
      setDecompWheelTarget(Math.round(decompWheel.target) + (delta > 0 ? 1 : -1));
      e.preventDefault();
    }, { passive: false });
  }

  // 右上角提示：三方塊橫向反向環滾輪（倉頡／嘸蝦米／速成）。
  // 一律顯示，不依賴「鍵位提示」勾選；隨 paint() 每次打字都刷新。
  // 組字時凍結（ compositionstart 存 innerHTML，送出前不重算），避免跳動。
  function paintCangjieHint() {
    if (!cangjieHint) return;
    bindDecompWheel();
    cangjieHint.classList.remove("is-done");
    if (!state || state.finished) {
      clearDecompWheel();
      cangjieHint.textContent = state ? "拆字：完成！" : "拆字：—";
      if (state) cangjieHint.classList.add("is-done");
      return;
    }
    const info = getCurrentPosInfo();
    if (!info) {
      clearDecompWheel();
      cangjieHint.textContent = "拆字：—";
      return;
    }
    // Freeze the top-right wheel during composition of the SAME character.
    // If the character advanced (e.g. continuous composition session),
    // unfreeze and update the wheel to the new character.
    if (state.composing && state.frozenCangjieHint && state.frozenCangjieInfo && state.frozenCangjieInfo.char === info.char) {
      cangjieHint.classList.remove("is-done");
      return;
    }
    state.frozenCangjieHint = cangjieHint.innerHTML;
    state.frozenCangjieInfo = info;
    const ch = info.char;
    // If wheel already exists, update cards in place without DOM reconstruction or jump
    if (decompWheel) {
      decompWheelChar = ch;
      updateDecompWheelCardText();
      return;
    }
    buildDecompWheel(ch, `${methodLabel(decompMethod)} ${ch}`);
  }

  function flashKeyElement(keyEl, kind) {
    if (!keyEl) return;
    const idKey = keyEl.dataset.code || keyEl.dataset.key || "key";
    if (flashTimeoutIds[idKey]) {
      clearTimeout(flashTimeoutIds[idKey]);
      delete flashTimeoutIds[idKey];
    }
    // Remove classes and force reflow to reliably restart animations on fast repeats
    keyEl.classList.remove("flash-white", "flash-red");
    void keyEl.offsetWidth;
    keyEl.classList.add(kind === "white" ? "flash-white" : "flash-red");
    flashTimeoutIds[idKey] = setTimeout(() => {
      keyEl.classList.remove("flash-white", "flash-red");
      delete flashTimeoutIds[idKey];
    }, 320);
  }

  function clearKeyError() {
    if (onKeyboard) {
      onKeyboard.querySelectorAll(".is-error").forEach((k) => k.classList.remove("is-error"));
    }
    if (state) state.lastKeyError = null;
  }

  // Find an on-screen key by its data-key WITHOUT building a CSS selector
  // from the key name (a backslash key like 、 would make an invalid
  // selector and silently never match).
  function findOnKbKey(k) {
    if (!onKeyboard || k == null) return null;
    const keys = onKeyboard.querySelectorAll(".on-kb-key[data-key]");
    for (const el of keys) {
      if (el.dataset.key === k) return el;
    }
    return null;
  }

  function setExpectedKey(keyEl, isSpace, keyChar) {
    if (keyEl) {
      keyEl.classList.add("is-next");
      currentExpectedKey = {
        code: keyEl.dataset.code,
        key: keyChar || keyEl.dataset.key || "",
        isSpace: !!isSpace || keyEl.dataset.code === "Space",
        el: keyEl
      };
    }
  }

  function paintOnKeyboard() {
    if (!state || !onKeyboard || !onKeyboardWrap || onKeyboardWrap.classList.contains("hidden")) {
      currentExpectedKey = null;
      return;
    }
    const layout = onKeyboard.dataset.layout || (layoutSelect ? layoutSelect.value : "bopomofo");
    const isBopomofo = layout === "bopomofo";
    const isCangjie = layout === "cangjie";
    const isBoshiamy = layout === "boshiamy";
    const isSucheng = layout === "sucheng";
    const isCodeLayout = isCangjie || isBoshiamy || isSucheng;

    // Clear previous highlights: only the next key stays highlighted,
    // already-typed keys leave no trace on the keyboard.
    onKeyboard.querySelectorAll(".on-kb-key").forEach((k) => {
      k.classList.remove("is-next");
    });
    currentExpectedKey = null;

    const info = getCurrentPosInfo();
    if (!info) {
      return;
    }

    // Anti-staleness: if the hinted position moved BACKWARD (or the layout
    // changed) while the live value grew, the state was recreated (new
    // question) or composition restarted — old key history is invalid.
    // In particular, a stale composingKeys from the previous question
    // otherwise pins the hint on the previous char's first key forever.
    // Reset conservatively; the typed-step derivations below rebuild from
    // the live value / composition data.
    if (
      state.lastKeySeqIdx &&
      (info.charIdx < state.lastKeySeqIdx.charIdx ||
        (info.charIdx === state.lastKeySeqIdx.charIdx && layout !== state.lastKeySeqIdx.layout))
    ) {
      state.composingKeys = [];
      state.composingKeysBase = 0;
      state.composingRawText = "";
      state.composingText = "";
    }
    state.lastKeySeqIdx = { charIdx: info.charIdx, layout };

    // Phrase composition (one session spanning many chars) keeps appending
    // to composingKeys. When the current char index moved, all keys so far
    // belong to committed chars — rebase so the fallback below only sees
    // the current syllable's keys.
    if (state.lastHintCharIdx !== info.charIdx) {
      state.composingKeysBase = (state.composingKeys || []).length;
      state.lastHintCharIdx = info.charIdx;
    }
    const curKeys = (state.composingKeys || []).slice(state.composingKeysBase || 0);

    const curChar = info.char;
    const zhuyin = info.zhuyin;

    if (isCodeLayout) {
      // 倉頡／嘸蝦米／速成版面：逐步高亮（和注音同規則——一次只亮下一鍵，已打鍵不留痕）。
      // 序列 = 拆字碼字母逐鍵 + 最後空白鍵（選字）。碼來源依版面：
      // 倉頡=cangjie.json、速成=倉頡首尾碼、嘸蝦米=boshiamy.json（只提示字母）。
      // 已打進度由組字區的字母（fq…）或字根反推；IME 不把 preedit 放進 value 時
      // 進度停在第一鍵，打完字送出後自動跳下一字。
      let code = null;
      const isPunctOrAscii = PUNCT_KEY_MAP[curChar] || /^[\x00-\x7F]$/.test(curChar);
      if (!isPunctOrAscii) {
        if (isBoshiamy) {
          code = BOSHIAMY ? (BOSHIAMY[curChar] || null) : null;
        } else if (isSucheng) {
          code = suchengCodeForChar(curChar);
        } else {
          code = lookupCangjieForChar(curChar);
        }
      }
      if (code) {
        // 嘸蝦米鍵面只有字母，不顯示字根漢字；倉頡／速成才有 sym（內部用，不顯示）。
        const keySequence = Array.from(code).map((letter) => ({
          sym: isBoshiamy ? letter.toUpperCase() : (CANGJIE_RADICAL[letter] || letter),
          key: letter,
          label: isBoshiamy
            ? letter.toUpperCase()
            : `${CANGJIE_RADICAL[letter] || letter} (${letter.toUpperCase()})`,
        }));
        keySequence.push({ sym: "空白", key: " ", isSpace: true, label: "空白 (選字)" });

        let typedSteps = 0;
        {
          // 嘸蝦米/速成組字區裡的字母直接比對；倉頡另需字根反查才算已打。
          const validLetters = isBoshiamy
            ? (l) => /^[a-z]$/.test(l)
            : (l) => CANGJIE_RADICAL[l];
          let typedLetters = lettersFromPreedit(info.composingSlice).filter(validLetters);
          const isSameCharComp = state.frozenCangjieInfo && state.frozenCangjieInfo.char === curChar;
          if (!typedLetters.length && isSameCharComp && state.composingRawText) {
            typedLetters = lettersFromPreedit(state.composingRawText).filter(validLetters);
          }
          if (!typedLetters.length && isSameCharComp && state.composingText) {
            typedLetters = lettersFromPreedit(state.composingText).filter(validLetters);
          }
          if (!typedLetters.length && curKeys.length) {
            typedLetters = curKeys.filter(validLetters);
          }
          while (
            typedSteps < typedLetters.length &&
            typedSteps < keySequence.length &&
            !keySequence[typedSteps].isSpace &&
            typedLetters[typedSteps] === keySequence[typedSteps].key
          ) {
            typedSteps++;
          }
        }

        const nextItem = typedSteps < keySequence.length ? keySequence[typedSteps] : null;
        if (nextItem) {
          const keyEl = nextItem.isSpace
            ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
            : findOnKbKey(nextItem.key);
          setExpectedKey(keyEl, nextItem.isSpace, nextItem.key);
        }
      } else if (PUNCT_KEY_MAP[curChar]) {
        const pInfo = PUNCT_KEY_MAP[curChar];
        const keyEl = findOnKbKey(pInfo.key);
        setExpectedKey(keyEl, false, pInfo.key);
        if (pInfo.shift) {
          const shiftEl = onKeyboard.querySelector(`.on-kb-key[data-code="ShiftLeft"]`);
          if (shiftEl) shiftEl.classList.add("is-next");
        }
      } else {
        const lower = curChar.toLowerCase();
        const keyEl = lower === " "
          ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
          : findOnKbKey(lower);
        setExpectedKey(keyEl, lower === " ", lower);
      }
    } else if (isBopomofo) {
      if (zhuyin && /[ㄅ-ㄩ]/.test(zhuyin)) {
        // Parse individual Bopomofo symbols
        const rawSymbols = Array.from(zhuyin);
        const keySequence = [];
        let hasTone = false;
        rawSymbols.forEach((sym) => {
          if (BOPOMOFO_TO_KEY[sym]) {
            const keyChar = BOPOMOFO_TO_KEY[sym];
            if (/[ˊˇˋ˙]/.test(sym)) hasTone = true;
            keySequence.push({ sym, key: keyChar, label: `${sym} (${keyChar.toUpperCase()})` });
          }
        });
        // Taiwan Zhuyin IME: 1st tone (一聲) has no tone mark and is typed using Space
        if (!hasTone) {
          keySequence.push({ sym: "空白", key: " ", isSpace: true, label: "空白 (一聲)" });
        }

        // Step-by-step hint: only the NEXT key is highlighted.
        // Progress comes from the preedit slice, falling back to the
        // physical keys pressed during this syllable (curKeys).
        let typedSteps = 0;
        if (info.composingSlice) {
          const typedSymbols = Array.from(info.composingSlice).filter((s) => BOPOMOFO_TO_KEY[s]);
          while (
            typedSteps < typedSymbols.length &&
            typedSteps < keySequence.length &&
            !keySequence[typedSteps].isSpace &&
            typedSymbols[typedSteps] === keySequence[typedSteps].sym
          ) {
            typedSteps++;
          }
        }
        if (typedSteps === 0 && curKeys.length) {
          while (
            typedSteps < curKeys.length &&
            typedSteps < keySequence.length &&
            !keySequence[typedSteps].isSpace &&
            curKeys[typedSteps] === keySequence[typedSteps].key
          ) {
            typedSteps++;
          }
        }

        const nextItem = typedSteps < keySequence.length ? keySequence[typedSteps] : null;
        if (nextItem) {
          const keyEl = nextItem.isSpace
            ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
            : findOnKbKey(nextItem.key);
          setExpectedKey(keyEl, nextItem.isSpace, nextItem.key);
        }
      } else if (PUNCT_KEY_MAP[curChar]) {
        // Punctuation key mapping
        const pInfo = PUNCT_KEY_MAP[curChar];
        const keyEl = findOnKbKey(pInfo.key);
        setExpectedKey(keyEl, false, pInfo.key);
        if (pInfo.shift) {
          const shiftEl = onKeyboard.querySelector(`.on-kb-key[data-code="ShiftLeft"]`);
          if (shiftEl) shiftEl.classList.add("is-next");
        }
      } else {
        // ASCII / other
        const lower = curChar.toLowerCase();
        const keyEl = lower === " "
          ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
          : findOnKbKey(lower);
        setExpectedKey(keyEl, lower === " ", lower);
      }
    } else {
      // QWERTY mode
      const lower = curChar.toLowerCase();
      let keyEl = lower === " "
        ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
        : findOnKbKey(lower);
      if (!keyEl && PUNCT_KEY_MAP[curChar]) {
        keyEl = findOnKbKey(PUNCT_KEY_MAP[curChar].key);
      }
      setExpectedKey(keyEl, lower === " ", lower);
    }

  }

  function setHintDefault() {
    // Default hint intentionally empty: practice view no longer shows
    // the instructional lines (e.g. "看上方目標字，照著打…").
    // hintLine remains for dynamic feedback (warnings, completion, etc.).
    hint("");
  }
  function hint(msg) { $("#hintLine").textContent = msg; }

  function focusCurrent() {
    if (state && state.currentInputEl && !state.currentInputEl.disabled) {
      state.currentInputEl.focus();
    }
  }

  function displayFor(li) {
    if (li === state.lineIdx) {
      const info = getCurrentPosInfo();
      if (info && info.completed) {
        return info.completed.join("");
      }
      const el = state.currentInputEl;
      if (el) return el.value;
    }
    return state.inputs[li] || "";
  }

  function paint() {
    const tgtChars = [];
    state.lines.forEach((line, li) => {
      Array.from(line).forEach((ch, pos) => tgtChars.push({ ch, line: li, pos }));
    });
    let curFound = false;
    tgtChars.forEach((t) => {
      const el = document.querySelector(`.char[data-line="${t.line}"][data-pos="${t.pos}"]`);
      if (!el) return;
      const typed = Array.from(displayFor(t.line));
      let status;
      if (t.pos < typed.length) {
        status = norm(t.ch) === norm(typed[t.pos]) ? "correct" : "error";
      } else if (!curFound && t.line === state.lineIdx && !state.finished) {
        status = "current"; curFound = true;
      } else {
        status = "pending";
      }
      el.className = "char " + status;
    });

    // Input border state
    const el = state.currentInputEl;
    if (el) {
      const typed = Array.from(displayFor(state.lineIdx));
      const tgt = Array.from(state.lines[state.lineIdx]);
      el.classList.toggle("done", typed.length >= tgt.length);
    }
    updateHud();
    // Keep the on-screen key hint in sync while typing (fix: it used to
    // only paint on renderPractice, so it stuck on the first character).
    paintOnKeyboard();
    // 倉頡拆字提示同理：每次打字都偵測目前字並刷新右上角。
    paintCangjieHint();
  }

  function ensureTimerStarted() {
    if (!state || state.finished) return;
    if (state.roundStartedAt === null) state.roundStartedAt = Date.now();
    if (state.startedAt !== null) return;
    state.startedAt = Date.now();
    startTimer();
  }

  function onCommitted(li) {
    let totalTyped = 0, totalCorrect = 0;
    state.lines.forEach((line, i) => {
      const typed = Array.from(state.inputs[i] || "");
      const tgt = Array.from(line);
      totalTyped += typed.length;
      for (let p = 0; p < Math.min(typed.length, tgt.length); p++) {
        if (norm(tgt[p]) === norm(typed[p])) totalCorrect++;
      }
    });
    if (totalTyped > 0) {
      ensureTimerStarted();
    }
    state.totalTyped = totalTyped;
    state.totalCorrect = totalCorrect;
  }

  function advance(li) {
    if (li !== state.lineIdx) return;
    const isLast = li >= state.lines.length - 1;
    if (isLast) {
      maybeFinish();
      return;
    }
    clearKeyError();
    setHintDefault();
    state.lineIdx = li + 1;
    renderPractice();
    paint();
    focusCurrent();
  }

  function maybeFinish() {
    if (state.finished) return;
    const allFull = state.lines.every((line, i) => Array.from(state.inputs[i] || "").length >= Array.from(line).length);
    if (!allFull) return;

    state.elapsed = elapsedNow();
    state.finished = true;
    stopTimer();
    paintCangjieHint(); // finished -> 右上角顯示「完成！」而非停在上一字

    if (state.currentInputEl) state.currentInputEl.disabled = true;

    state.sessionCompleted = (state.sessionCompleted || 0) + 1;

    const modeKey = state.modeKey;
    const target = ROUND_TARGET[modeKey];
    const finiteShort = isShortMode(modeKey) && !isEndlessEnabled(modeKey);

    if (finiteShort) {
      state.roundTotalTyped = (state.roundTotalTyped || 0) + state.totalTyped;
      state.roundTotalCorrect = (state.roundTotalCorrect || 0) + state.totalCorrect;
      state.roundElapsed = (state.roundElapsed || 0) + state.elapsed;
      // Continuous round time: from first keystroke of the round to now,
      // including inter-item gaps and reading time between items.
      const continuousSec = state.roundStartedAt
        ? (Date.now() - state.roundStartedAt) / 1000
        : state.roundElapsed;

      if (state.sessionCompleted < target) {
        // Mid-round: feedback only, auto-advance; settlement waits for target.
        const fb = peekStats(state.roundTotalTyped, state.roundTotalCorrect, continuousSec);
        showAutoNextFeedback(fb, { progress: `${state.sessionCompleted}/${target}` });
        state.autoNextTimer = setTimeout(() => {
          state.autoNextTimer = null;
          startRound(state.modeKey);
        }, 300);
        return;
      }
      const stats = recordStats({
        totalTyped: state.roundTotalTyped,
        totalCorrect: state.roundTotalCorrect,
        sec: continuousSec,
      });
      state.sessionCompleted = 0;
      state.roundTotalTyped = 0;
      state.roundTotalCorrect = 0;
      state.roundElapsed = 0;
      state.roundStartedAt = null;
      resultTimeoutId = setTimeout(() => { resultTimeoutId = null; showResultModal(stats); }, 250);
      return;
    }

    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    const stats = recordStats();

    // Endless means "never settle, keep going" in every mode, so it forces
    // auto-advance even if 「自動跳下一題」 is unchecked (articles default
    // to popup, which would otherwise contradict endless).
    const autoNext = isAutoNextEnabled(modeKey) || isEndlessEnabled(modeKey);
    if (autoNext) {
      showAutoNextFeedback(stats);
      state.autoNextTimer = setTimeout(() => {
        state.autoNextTimer = null;
        startRound(state.modeKey);
      }, 300);
    } else {
      resultTimeoutId = setTimeout(() => { resultTimeoutId = null; showResultModal(stats); }, 250);
    }
  }

  function peekStats(totalTyped, totalCorrect, sec) {
    return effectiveStats(totalTyped, totalCorrect, sec);
  }

  function recordStats(override) {
    const totalTyped = override ? override.totalTyped : state.totalTyped;
    const totalCorrect = override ? override.totalCorrect : state.totalCorrect;
    const rawSec = override ? override.sec : state.elapsed;
    const eff = effectiveStats(totalTyped, totalCorrect, rawSec);
    const sec = eff.sec;
    const cpm = eff.cpm;
    const acc = eff.acc;

    // Guard against anomalous speeds (sub-second paste or zero-elapsed glitch)
    const isAnomalous = eff.anomalous || cpm > 450;

    const best = loadBest();
    const prev = best[state.modeKey];
    const isRecord = !isAnomalous && (!prev || cpm > prev.wpm) && cpm > 0;
    if (isRecord) {
      best[state.modeKey] = { wpm: cpm, acc, sec: Math.round(sec) };
      saveJSON(LS_BEST, best);
    }
    if (!isAnomalous) {
      const hist = loadHist();
      hist.unshift({
        mode: state.modeKey,
        wpm: cpm,
        acc,
        sec: Math.round(sec),
        id: state.item.id,
        typed: totalTyped,
        correct: totalCorrect,
        time: Date.now()
      });
      saveJSON(LS_HIST, hist.slice(0, 50));
    }

    return { sec, rawSec: eff.rawSec, cpm, acc, isRecord, isAnomalous, totalTyped, totalCorrect };
  }

  function showAutoNextFeedback(stats, opts) {
    const progress = opts && opts.progress ? `（${opts.progress}）` : "";
    if (stats.isRecord) {
      hint(`★ 新紀錄！速度 ${stats.cpm} 字/分 · 正確率 ${stats.acc}%${progress} · 進入下一題…`);
    } else {
      hint(`完成！速度 ${stats.cpm} 字/分 · 正確率 ${stats.acc}%${progress} · 進入下一題…`);
    }
    $("#hudTime").textContent = fmtTime(stats.sec);
    $("#hudWpm").textContent = stats.cpm;
    $("#hudAcc").textContent = stats.acc + "%";
    $("#hudProg").textContent = "100%";
    $("#progressBar").style.width = "100%";
  }

  function showResultModal(stats) {
    // Guard: if user already went home, don't resurrect the modal
    if (practiceView.classList.contains("hidden")) return;
    const grid = $("#resultGrid");
    const correct = stats.totalCorrect != null ? stats.totalCorrect : state.totalCorrect;
    const typed = stats.totalTyped != null ? stats.totalTyped : state.totalTyped;
    grid.innerHTML = `
      <div class="cell"><div class="k">速度（字/分鐘）</div><div class="v">${stats.cpm}</div></div>
      <div class="cell"><div class="k">正確率</div><div class="v">${stats.acc}%</div></div>
      <div class="cell"><div class="k">用時</div><div class="v">${fmtTime(stats.sec)}</div></div>
      <div class="cell"><div class="k">答對字數</div><div class="v">${correct}/${typed}</div></div>`;
    const warn = $("#anomalyLine");
    if (warn) {
      warn.classList.toggle("hidden", !stats.isAnomalous);
      if (stats.isAnomalous) warn.textContent = "⚠️ 計時異常（完成時間過短，疑似貼上或瞬間輸入），速度未計入最佳紀錄。";
    }
    $("#newRecordLine").classList.toggle("hidden", !stats.isRecord);
    resultOverlay.classList.remove("hidden");
  }

  function elapsedNow() {
    if (!state || state.startedAt === null) return 0;
    if (state.finished) return state.elapsed;
    return (Date.now() - state.startedAt) / 1000;
  }
  function startTimer() {
    stopTimer();
    state.timerId = setInterval(updateHud, 250);
  }
  function stopTimer() {
    if (state && state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    if (state && state.startedAt !== null && !state.finished) state.elapsed = elapsedNow();
  }

  function updateHud() {
    if (!state) return;
    const sec = elapsedNow();
    // Live HUD: use continuous round time if available so short-item speed
    // doesn't spike between items, and floor by per-char minimum.
    let rawSec = sec;
    if (state.roundStartedAt && isShortMode(state.modeKey)) {
      const cont = (Date.now() - state.roundStartedAt) / 1000;
      const typedSoFar = (state.roundTotalCorrect || 0) + state.totalCorrect;
      const typedAll = (state.roundTotalTyped || 0) + state.totalTyped;
      rawSec = Math.max(cont, 0);
      const eff = effectiveStats(typedAll, typedSoFar, rawSec);
      $("#hudTime").textContent = fmtTime(eff.sec);
      $("#hudWpm").textContent = eff.cpm;
    } else {
      const eff = effectiveStats(state.totalTyped, state.totalCorrect, sec);
      $("#hudTime").textContent = fmtTime(sec);
      $("#hudWpm").textContent = eff.cpm;
    }
    const acc = state.totalTyped > 0 ? Math.round((state.totalCorrect / state.totalTyped) * 100) : 100;
    $("#hudAcc").textContent = acc + "%";
    const totalChars = state.lines.join("").replace(/\n/g, "").length;
    const typedProg = totalChars > 0 ? Math.min(100, Math.round((state.totalTyped / totalChars) * 100)) : 0;
    $("#hudProg").textContent = typedProg + "%";
    $("#progressBar").style.width = typedProg + "%";
  }

  function applyFontSize(v) {
    const map = { sm: "18px", md: "22px", lg: "26px" };
    document.documentElement.style.setProperty("--font-size", map[v] || "22px");
    $("#fontSizeSelect").value = v;
  }

  function bindGlobal() {
    bindDecompWheel();
    const themeBtn = $("#themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
    }
    $("#fontSizeSelect").addEventListener("change", (e) => {
      saveJSON(LS_FONT, e.target.value);
      applyFontSize(e.target.value);
    });
    function openStatsModal() {
      if (!statsOverlay) return;
      renderStatsModal();
      statsOverlay.classList.remove("hidden");
    }

    function closeStatsModal() {
      if (!statsOverlay) return;
      statsOverlay.classList.add("hidden");
    }

    function renderStatsModal() {
      const hist = loadHist();
      const best = loadBest();
      const overviewEl = $("#statsOverview");
      const bestGridEl = $("#statsBestGrid");
      const histListEl = $("#statsHistList");

      // 1. Calculate overview metrics
      const totalRounds = hist.length;
      let totalWpm = 0;
      let totalAcc = 0;
      let totalTypedChars = 0;
      hist.forEach((h) => {
        totalWpm += (h.wpm || 0);
        totalAcc += (h.acc || 0);
        totalTypedChars += (h.typed || h.correct || 0);
      });
      const avgWpm = totalRounds > 0 ? Math.round(totalWpm / totalRounds) : 0;
      const avgAcc = totalRounds > 0 ? (totalAcc / totalRounds).toFixed(1) : "100";

      if (overviewEl) {
        overviewEl.innerHTML = `
          <div class="cell"><div class="k">累計練習</div><div class="v">${totalRounds} <span style="font-size:12px;font-weight:normal;color:var(--muted)">局</span></div></div>
          <div class="cell"><div class="k">平均速度</div><div class="v">${avgWpm} <span style="font-size:12px;font-weight:normal;color:var(--muted)">字/分</span></div></div>
          <div class="cell"><div class="k">平均正確率</div><div class="v">${avgAcc}%</div></div>
        `;
      }

      // 2. Render Personal Best for all modes
      if (bestGridEl) {
        bestGridEl.innerHTML = "";
        MODES.forEach((m) => {
          const b = best[m.key];
          const card = document.createElement("div");
          card.className = "stats-best-card";
          card.innerHTML = `
            <div class="mode-name">${m.title}</div>
            <div class="best-wpm">${b ? b.wpm + " 字/分" : "—"}</div>
            <div class="best-sub">${b ? `正確率 ${b.acc}% · 用時 ${fmtTime(b.sec)}` : "尚未挑戰"}</div>
          `;
          bestGridEl.appendChild(card);
        });
      }

      // 3. Render recent history list
      if (histListEl) {
        if (!hist.length) {
          histListEl.innerHTML = `<div class="stats-empty">目前尚無練習紀錄，開始一局練習吧！</div>`;
        } else {
          histListEl.innerHTML = hist.slice(0, 30).map((h) => {
            const m = MODES.find((x) => x.key === h.mode);
            const mTitle = m ? m.title : h.mode;
            let timeStr = "";
            if (h.time) {
              const d = new Date(h.time);
              const pad = (n) => String(n).padStart(2, "0");
              timeStr = `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            }
            return `
              <div class="stats-hist-item">
                <span class="hist-mode">${mTitle}</span>
                <span class="hist-wpm">${h.wpm} 字/分</span>
                <span class="hist-meta">${h.acc}% · ${fmtTime(h.sec)}</span>
                <span class="hist-meta">${timeStr}</span>
              </div>
            `;
          }).join("");
        }
      }
    }

    if (statsBtn) statsBtn.addEventListener("click", openStatsModal);
    if (closeStatsBtn) closeStatsBtn.addEventListener("click", closeStatsModal);
    if (closeStatsBtnBottom) closeStatsBtnBottom.addEventListener("click", closeStatsModal);
    if (statsOverlay) {
      statsOverlay.addEventListener("click", (e) => {
        if (e.target === statsOverlay) closeStatsModal();
      });
    }

    $("#resetStatsBtn").addEventListener("click", () => {
      if (confirm("確定要清除所有練習紀錄與個人最佳成績嗎？此動作無法復原。")) {
        localStorage.removeItem(LS_BEST);
        localStorage.removeItem(LS_HIST);
        renderHome();
        if (statsOverlay && !statsOverlay.classList.contains("hidden")) {
          renderStatsModal();
        }
      }
    });
    $("#backHomeBtn").addEventListener("click", showHome);
    $("#restartBtn").addEventListener("click", () => startRound(state.modeKey));
    $("#againBtn").addEventListener("click", () => startRound(state.modeKey));
    $("#homeBtn").addEventListener("click", showHome);
    $("#targetBox").addEventListener("click", focusCurrent);
    if (autoAdvanceCheck) {
      autoAdvanceCheck.addEventListener("change", (e) => {
        if (state) {
          setAutoNextEnabled(state.modeKey, e.target.checked);
        }
      });
    }
    if (endlessCheck) {
      endlessCheck.addEventListener("change", (e) => {
        if (!state) return;
        setEndlessEnabled(state.modeKey, e.target.checked);
        // Toggle mid-round starts a fresh round under the new setting.
        state.sessionCompleted = 0;
        state.roundTotalTyped = 0;
        state.roundTotalCorrect = 0;
        state.roundElapsed = 0;
        showPractice();
        setHintDefault();
        focusCurrent();
      });
    }
    if (onKeyboardCheck) {
      onKeyboardCheck.checked = (loadJSON(LS_ONKB, {}) || {}).show === true;
      if (layoutSelect) {
        const pref = loadJSON(LS_ONKB, {}) || {};
        const savedLayout = pref.layout;
        // 舊值 qwerty（英數）已移除，自動對應到嘸蝦米（英文字母鍵位），並寫回。
        const migrated = savedLayout === "qwerty" ? "boshiamy" : savedLayout;
        layoutSelect.value = migrated || "bopomofo";
        if (savedLayout === "qwerty") {
          pref.layout = "boshiamy";
          saveJSON(LS_ONKB, pref);
        }
      }
      onKeyboardCheck.addEventListener("change", (e) => {
        const pref = loadJSON(LS_ONKB, {});
        pref.show = e.target.checked;
        saveJSON(LS_ONKB, pref);
        renderOnKeyboard();
        focusCurrent();
      });
    }
    if (layoutSelect) {
      layoutSelect.addEventListener("change", (e) => {
        const pref = loadJSON(LS_ONKB, {});
        pref.layout = e.target.value;
        saveJSON(LS_ONKB, pref);
        if (onKeyboard) onKeyboard.dataset.layout = "";
        renderOnKeyboard();
        const mIdx = methodIndex(e.target.value);
        if (mIdx !== -1 && decompWheel) {
          let diff = mIdx - (((decompWheel.pos % 3) + 3) % 3);
          diff = ((diff + 1.5) % 3 + 3) % 3 - 1.5;
          setDecompWheelTarget(Math.round(decompWheel.pos + diff));
        }
      });
    }
  }

  init().catch((e) => {
    document.body.insertAdjacentHTML("afterbegin",
      `<div style="padding:12px 18px;background:#fee2e2;color:#7f1d1d">data.json 讀取失敗：${e.message}。請用 serve.py 開（直接開 index.html 的 fetch 可能被擋）。</div>`);
  });
})();
