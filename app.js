// JustType — original typing engine (modes align with TypeMate categories,
// UI/code are original). Data in data.json: words / sentences.
(function () {
  "use strict";
  const LS_BEST = "tp-lite-best-v1";
  const LS_HIST = "tp-lite-history-v1";
  const LS_FONT = "tp-lite-font-v1";
  const LS_LAST = "tp-lite-last-v1";
  const LS_THEME = "tp-lite-theme-v1";
  const LS_ENDLESS = "tp-lite-endless-v1";
  const LS_ENDLESS_DEFAULT_OFF_DONE = "tp-lite-endless-default-off-v2";
  const LS_ONKB = "tp-lite-onkb-v1";
  const LS_ONKB_DEFAULT_OFF_DONE = "tp-lite-onkb-default-off-v1";
  const LS_DECOMP = "tp-lite-decomp-v1"; // 右上角拆字顯示: cangjie|boshiamy|sucheng
  const LS_CUSTOM_TEXT = "justtype_custom_text"; // 使用者自訂練習文本

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
    "(": { key: "9", shift: true, label: "(" },
    ")": { key: "0", shift: true, label: ")" },
    "%": { key: "5", shift: true, label: "%" },
    "_": { key: "-", shift: true, label: "_" },
    "-": { key: "-", shift: false, label: "-" },
    "/": { key: "/", shift: false, label: "/" },
    "\\": { key: "\\", shift: false, label: "\\" },
    "<": { key: ",", shift: true, label: "<" },
    ">": { key: ".", shift: true, label: ">" },
    "=": { key: "=", shift: false, label: "=" },
    "+": { key: "=", shift: true, label: "+" },
    "'": { key: "'", shift: false, label: "'" },
    "\"": { key: "'", shift: true, label: "\"" },
    "*": { key: "8", shift: true, label: "*" },
    "&": { key: "7", shift: true, label: "&" },
    "@": { key: "2", shift: true, label: "@" },
    "#": { key: "3", shift: true, label: "#" },
    "$": { key: "4", shift: true, label: "$" },
    "^": { key: "6", shift: true, label: "^" },
    "|": { key: "\\", shift: true, label: "|" },
    "{": { key: "[", shift: true, label: "{" },
    "}": { key: "]", shift: true, label: "}" },
    "~": { key: "`", shift: true, label: "~" },
    "`": { key: "`", shift: false, label: "`" },
  };

  // Finite round sizes (endless off): words settle after 10 items, sentences
  // after 5. Every other mode (articles, long articles, life situations, mixed,
  // classical, general/litigation legal docs) settles after 1 item.
  // Endless mode disables settlement in every mode. It is off by default
  // (LS_ENDLESS only true if the user explicitly checked it; legacy prefs are
  // purged once on load so all modes start from the default-off state).
  const ROUND_TARGET = { words: 10, sentences: 5 };

  // 抽題隊列（2026-11-09）：每模式一份 memory-only queue，進練習前就 Fisher-Yates
  // 洗好整副不重複序列，整輪照序抽出，洗完才重洗。Queue 只活在記憶體，
  // 重整網頁後全部清零、該模式首次進練習時重洗（刻意取捨：簡單、可隨時重整重洗）。
  // Queue 生命週期：僅在 nextFromQueue 發現空 queue / cursor 超界時重洗。
  // restartBtn、againBtn、無盡／有限輪自動跳題、回首頁一律不重洗——重洗只由 queue 吃完觸發。
  // LS_LAST 只負責跨 queue 邊界擋連續重複（重洗後首題與上一題同 id 時 skip 一個）。
  const QUEUE = {}; // modeKey -> { order: [itemId,...], cursor: n }

  const MODES = [
    { key: "words", title: "單字", desc: "萬丈高樓平地起", dataKey: "words", color: "blue" },
    { key: "sentences", title: "句子", desc: "小有所成，切勿驕縱", dataKey: "sentences", color: "emerald" },
    { key: "articles_punct", title: "小短文", desc: "萬水千山走遍", dataKey: "articles_punct", color: "violet" },
    { key: "long_articles", title: "長文章", desc: "厚積薄發", dataKey: "long_articles", color: "amber" },
    { key: "life_situations", title: "生活情境題", desc: "柴米油鹽", dataKey: "life_situations", color: "rose" },
    { key: "mixed_zh_en", title: "中英雜燴", desc: "中西合璧", dataKey: "mixed_zh_en", color: "cyan" },
    { key: "classical_texts", title: "文言文", desc: "文以載道", dataKey: "classical_texts", color: "red" },
    { key: "general_legal_docs", title: "一般法律公文", desc: "法者，天子所與天下公共也", dataKey: "general_legal_docs", color: "slate" },
    { key: "litigation_legal_docs", title: "訴訟法律公文", desc: "你的夢想是成為書記官嗎", dataKey: "litigation_legal_docs", color: "orange" },
    { key: "custom_text", title: "自訂文本", desc: "貼上自選文章或法條練習", dataKey: "custom_text", color: "purple" },
  ];

  // Pre-2026-11-09-restructure mode keys, kept only for history display.
  const LEGACY_MODE_TITLES = {
    legal_texts: "法律條文（舊）",
    official_docs: "正式公文（舊）",
  };

  const $ = (s) => document.querySelector(s);
  const homeView = $("#homeView");
  const practiceView = $("#practiceView");
  const modeGrid = $("#modeGrid");
  const resultOverlay = $("#resultOverlay");
  const endlessCheck = $("#endlessCheck");
  const endlessLabel = $("#endlessLabel");
  const carouselViewport = $("#carouselViewport");
  const carouselDots = $("#carouselDots");
  const carouselPrev = $("#carouselPrev");
  const carouselNext = $("#carouselNext");
  const onKeyboardCheck = $("#onKeyboardCheck");
  const layoutLabel = $("#layoutLabel");
  const onKeyboardWrap = $("#onKeyboardWrap");
  const onKeyboard = $("#onKeyboard");
  const layoutSelect = $("#layoutSelect");
  const cangjieHint = $("#cangjieHint");
  const statsOverlay = $("#statsOverlay");
  const boshiamyImportOverlay = $("#boshiamyImportOverlay");
  const closeBoshiamyModalBtn = $("#closeBoshiamyModalBtn");
  const cancelBoshiamyBtn = $("#cancelBoshiamyBtn");
  const boshiamyDropzone = $("#boshiamyDropzone");
  const boshiamyFileInput = $("#boshiamyFileInput");
  const selectBoshiamyFileBtn = $("#selectBoshiamyFileBtn");
  const boshiamyStatusMsg = $("#boshiamyStatusMsg");
  const statsBtn = $("#statsBtn");
  const closeStatsBtn = $("#closeStatsBtn");
  const exportStatsBtn = $("#exportStatsBtn");
  const importStatsBtn = $("#importStatsBtn");
  const statsFileInput = $("#statsFileInput");
  const statsMsg = $("#statsMsg");
  const backHomeBtn = $("#backHomeBtn");
  const changeCustomTextBtn = $("#changeCustomTextBtn");
  const resultChangeCustomBtn = $("#resultChangeCustomBtn");
  const customTextOverlay = $("#customTextOverlay");
  const closeCustomTextBtn = $("#closeCustomTextBtn");
  const cancelCustomBtn = $("#cancelCustomBtn");
  const startCustomBtn = $("#startCustomBtn");
  const customTextInput = $("#customTextInput");
  const customCharCount = $("#customCharCount");
  const toggleJsonModeBtn = $("#toggleJsonModeBtn");
  const customErrorMsg = $("#customErrorMsg");
  const customModalSub = $("#customModalSub");

  let isCustomJsonMode = false;
  let openCustomTextModal = null;
  let closeCustomTextModal = null;
  let openBoshiamyModal = null;
  let closeBoshiamyModal = null;
  let escConfirmTimer = null;
  let escConfirmActive = false;

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
  // ---- 生活情境題：LINE 回合動畫 ----
  // Each level runs at least 2 opponent↔user cycles:
  //   idle → opponent_entering → user_typing → (Enter) → user_sent
  //        → pause_brief (typing dots) → opponent_entering → … → completed
  const ANIMATION_PHASE = {
    IDLE: "idle",
    OPPONENT_ENTERING: "opponent_entering",
    USER_TYPING: "user_typing",
    USER_SENT: "user_sent",
    PAUSE_BRIEF: "pause_brief",
    COMPLETED: "completed",
  };

  function lifeSchedule(fn, ms) {
    if (state.animTimer) clearTimeout(state.animTimer);
    state.animTimer = setTimeout(() => {
      state.animTimer = null;
      if (!state || state.finished) return;
      fn();
    }, ms);
  }

  function lifeKick() {
    if (!state || state.modeKey !== "life_situations") return;
    state.animationPhase = ANIMATION_PHASE.IDLE;
    renderPractice();
    paint();
    lifeSchedule(lifeOpponentEnter, 700);
  }

  function lifeOpponentEnter() {
    const next = state.chatSegs[state.chatVisible];
    if (next && !next.isMe) {
      state.chatVisible++;
      state.animationPhase = ANIMATION_PHASE.OPPONENT_ENTERING;
      renderPractice();
      paint();
      lifeSchedule(lifeUserTyping, 1000);
    } else {
      lifeUserTyping();
    }
  }

  function lifeUserTyping() {
    if (state.lineIdx >= state.lines.length) { lifeCompleted(); return; }
    state.animationPhase = ANIMATION_PHASE.USER_TYPING;
    renderPractice();
    paint();
    focusCurrent();
  }

  // Called by the Enter handler once the current user bubble is fully typed.
  function lifeUserSent() {
    state.chatVisible++;
    state.turnCycles++;
    if (state.lineIdx + 1 < state.lines.length) state.lineIdx++;
    else state.lineIdx = state.lines.length; // no more user turns: next typing phase completes
    state.animationPhase = ANIMATION_PHASE.USER_SENT;
    renderPractice();
    paint();
    lifeSchedule(lifePause, 1100);
  }

  function lifePause() {
    state.animationPhase = ANIMATION_PHASE.PAUSE_BRIEF;
    renderPractice();
    paint();
    lifeSchedule(lifeOpponentEnter, 1300);
  }

  function lifeCompleted() {
    state.animationPhase = ANIMATION_PHASE.COMPLETED;
    renderPractice();
    paint();
    maybeFinish();
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
    for (const k of Object.keys(best)) {
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

  // 「自動跳下一題（不彈窗）」已移除：它的效果與「無盡模式」相同，只保留無盡模式。
  // 有限輪（無盡關閉）一律在輪滿時結算：單字 10 題、句子 5 題、其他模式 1 題。

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
        ? "開啟後不結算，持續自動跳下一題（所有模式皆同；預設關閉）"
        : "無盡模式適用所有模式";
    }
  }

  async function init() {
    // 一次性清除舊設定：移除已刪除的「自動跳下一題」偏好，並讓所有模式的
    // 無盡模式回到預設關閉（此後使用者再勾選才會依模式存檔）。
    // 同理讓鍵位提示回到預設關閉（版面選擇保留，只清 show 旗標）。
    try {
      if (!localStorage.getItem(LS_ENDLESS_DEFAULT_OFF_DONE)) {
        localStorage.removeItem(LS_ENDLESS);
        localStorage.setItem(LS_ENDLESS_DEFAULT_OFF_DONE, "1");
      }
      localStorage.removeItem("tp-lite-auto-next-v1");
      if (!localStorage.getItem(LS_ONKB_DEFAULT_OFF_DONE)) {
        try {
          const pref = loadJSON(LS_ONKB, null);
          if (pref && typeof pref === "object") {
            delete pref.show;
            saveJSON(LS_ONKB, pref);
          }
        } catch {}
        localStorage.setItem(LS_ONKB_DEFAULT_OFF_DONE, "1");
      }
    } catch {}
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
    const res = await fetch("data/data.json");
    DATA = await res.json();
    ensureCustomData();

    decompMethod = ["cangjie", "boshiamy", "sucheng"].includes(loadJSON(LS_DECOMP, "cangjie"))
      ? loadJSON(LS_DECOMP, "cangjie") : "cangjie";
    renderHome();
    bindGlobal();

    // 2. Fetch large dictionaries asynchronously in parallel in background
    Promise.all([
      fetch("data/zhuyin.json").then((r) => r.json()).then((d) => { ZHUYIN = d; }).catch(() => { ZHUYIN = null; }),
      fetch("data/cangjie.json").then((r) => r.json()).then((d) => { CANGJIE = d; }).catch(() => { CANGJIE = null; }),
      loadBoshiamyFromIDB().then((d) => { BOSHIAMY = d; }).catch(() => { BOSHIAMY = null; }),
    ]).then(() => {
      // If currently practicing, refresh key hints and decomposition wheel once dictionaries are loaded
      if (state && !state.finished) {
        paintOnKeyboard();
        paintCangjieHint();
      }
    });
  }

    // ---- IndexedDB Helper for Boshiamy Table ----
  const IDB_NAME = "justtype_db";
  const IDB_VERSION = 1;
  const IDB_STORE = "tables";
  const IDB_KEY_BOSHIAMY = "boshiamy";

  function openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB 不支援"));
        return;
      }
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadBoshiamyFromIDB() {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_KEY_BOSHIAMY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async function saveBoshiamyToIDB(table) {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(table, IDB_KEY_BOSHIAMY);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // Parse .cin file or table text to { char: shortest_code }
  function parseCinTable(text) {
    if (!text || typeof text !== "string") return null;
    const table = {};
    const lines = text.split(/\r?\n/);
    let inChardef = false;
    const hasChardefBlock = lines.some((l) => l.trim().startsWith("%chardef begin"));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      if (line.startsWith("%chardef begin")) {
        inChardef = true;
        continue;
      }
      if (line.startsWith("%chardef end")) {
        inChardef = false;
        continue;
      }

      if (hasChardefBlock && !inChardef) continue;

      // Skip other header commands starting with %
      if (line.startsWith("%")) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      let code = parts[0].toLowerCase();
      let ch = parts[1];

      // Support swapped columns (e.g. char code)
      if (code.length === 1 && !/^[a-z]+$/.test(code) && /^[a-z]+$/i.test(ch)) {
        const tmp = code;
        code = ch.toLowerCase();
        ch = tmp;
      }

      // We only index single characters with a-z keys
      if (Array.from(ch).length !== 1) continue;
      if (!/^[a-z]+$/.test(code)) continue;

      // Shortest code takes precedence; if same length, keep first seen
      if (!table[ch] || code.length < table[ch].length) {
        table[ch] = code;
      }
    }

    return Object.keys(table).length > 0 ? table : null;
  }

  function getCustomTextRaw() {
    return localStorage.getItem(LS_CUSTOM_TEXT) || "";
  }

  function parseCustomText(raw) {
    if (!raw || !raw.trim()) return null;
    let title = "自訂文本";
    let content = raw.trim();
    if (raw.trim().startsWith("{")) {
      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.content === "string") {
          content = obj.content.trim();
          if (obj.title && typeof obj.title === "string") {
            title = obj.title.trim();
          }
        }
      } catch {}
    }
    return { title, content };
  }

  function ensureCustomData() {
    if (!DATA) return;
    const parsed = parseCustomText(getCustomTextRaw());
    if (parsed && parsed.content) {
      DATA.custom_text = {
        label: parsed.title,
        texts: [{ id: "custom-1", text: parsed.content }]
      };
    } else {
      DATA.custom_text = {
        label: "自訂文本",
        texts: []
      };
    }
  }

  function renderHome() {
    ensureCustomData();
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
      const isCustom = m.key === "custom_text";
      const items = (DATA[m.dataKey] && DATA[m.dataKey].texts) || [];
      const b = best[m.key];
      const card = document.createElement("button");
      card.className = "mode-card m-" + m.key;
      card.type = "button";
      card.dataset.modeKey = m.key;
      card.dataset.index = idx;
      card.setAttribute("aria-label", m.title + "，點擊開始練習");

      const customSub = isCustom && items.length > 0
        ? `<span>長度 <strong>${Array.from(items[0].text).length} 字</strong></span>`
        : `<span>題庫 <strong>${isCustom ? (items.length ? "已設定" : "尚未設定") : items.length + " 題"}</strong></span>`;

      card.innerHTML =
        `<span class="mode-card-bar" aria-hidden="true"></span>` +
        (isCustom && items.length > 0 ? `<span class="mode-card-edit" title="編輯文本" aria-label="編輯文本">✎</span>` : "") +
        `<h3>${m.title}</h3><p>${m.desc}</p>` +
        `<div class="mode-meta">${customSub}` +
        `<span>個人最佳 <strong>${b ? b.wpm + " 字/分 · " + b.acc + "%" : "—"}</strong></span></div>` +
        `<span class="mode-card-go">開始挑戰 →</span>` +
        `<span class="mode-glare" aria-hidden="true"></span>`;

      if (isCustom) {
        const editBtn = card.querySelector(".mode-card-edit");
        if (editBtn) {
          editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openCustomTextModal();
          });
        }
      }

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
      const modeKey = MODES[idx].key;
      // 首次點擊偵測：若當前輸入法選定為嘸蝦米，且本地尚未載入碼表，直接彈出引導彈窗
      if (getCurrentLayout() === "boshiamy" && !BOSHIAMY) {
        if (typeof openBoshiamyModal === "function") {
          openBoshiamyModal();
          return;
        }
      }
      if (modeKey === "custom_text") {
        const raw = getCustomTextRaw();
        if (!raw || !raw.trim()) {
          openCustomTextModal();
          return;
        }
      }
      startRound(modeKey);
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
      if (e.isComposing || (state && state.composing) || e.keyCode === 229) return;
      // If any modal/overlay is open, don't trigger carousel keyboard actions
      if (
        (statsOverlay && !statsOverlay.classList.contains("hidden")) ||
        (customTextOverlay && !customTextOverlay.classList.contains("hidden")) ||
        (boshiamyImportOverlay && !boshiamyImportOverlay.classList.contains("hidden")) ||
        (resultOverlay && !resultOverlay.classList.contains("hidden"))
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        setCarouselTarget(carousel.selected - 1);
      } else if (e.key === "ArrowRight") {
        setCarouselTarget(carousel.selected + 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onCardClicked(carousel.selected);
      }
    });
  }

  // Fisher-Yates 洗牌（in-place）：由尾往頭、含端點取 j ∈ [0..i]，均匀分布。
  // 不用 arr.sort(() => Math.random() - 0.5)——偏置嚴重。
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildQueue(modeKey) {
    const mode = MODES.find((m) => m.key === modeKey);
    const items = DATA[mode.dataKey].texts;
    const order = shuffleArray(items.map((it) => it.id));
    QUEUE[modeKey] = { order, cursor: 0 };
    return order;
  }

  // 從 queue 取下一題：queue 空或吃完才重洗；跨 queue 邊界（或剛進練習的首題）
  // 若與 LS_LAST 同 id，skip 一個再取，避免連續重複。
  // 英文保護跳題（triggerEnglishProtection）亦走 startRound → 此函數，
  // 被跳過的那題會佔據一個 cursor，佔位不補（見計畫 Tradeoffs）。
  function nextFromQueue(modeKey) {
    const mode = MODES.find((m) => m.key === modeKey);
    const items = DATA[mode.dataKey].texts;
    const byId = new Map(items.map((it) => [it.id, it]));
    let q = QUEUE[modeKey];
    if (!q || q.cursor >= q.order.length) buildQueue(modeKey);
    q = QUEUE[modeKey];
    let item = byId.get(q.order[q.cursor++]);
    const last = loadJSON(LS_LAST, {});
    if (item && items.length > 1 && last[modeKey] === item.id && q.cursor < q.order.length) {
      item = byId.get(q.order[q.cursor++]);
    }
    if (item) {
      last[modeKey] = item.id;
      saveJSON(LS_LAST, last);
    }
    return item;
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
    if (state && state.animTimer) {
      clearTimeout(state.animTimer);
      state.animTimer = null;
    }
    if (resultTimeoutId) {
      clearTimeout(resultTimeoutId);
      resultTimeoutId = null;
    }
    const mode = MODES.find((m) => m.key === modeKey);
    const item = nextFromQueue(modeKey);
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
      compositionStartAt: null,
      selectionStartAt: null,
      selectionInteractionDuration: 0,
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
      animTimer: null,
      chatSegs: null,
      chatVisible: 0,
      turnCycles: 0,      // how many full opponent↔user cycles completed
      animationPhase: 'idle',   // idle | opponent_entering | user_typing | user_sent | pause_brief
    };
    if (modeKey === "life_situations") {
      const chat = buildChatState(item);
      state.chatSegs = chat.segs;
      state.lines = chat.userTurns;
      state.chatVisible = 0;
    } else if (modeKey === "custom_text" && item && item.text) {
      const splitted = item.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      state.lines = splitted.length > 0 ? splitted : [item.text];
    }
    state.inputs = state.lines.map(() => "");
    showPractice();
    if (modeKey === "life_situations") {
      lifeKick();
    } else {
      renderPractice();
      focusCurrent();
    }
  }

  function resetEscConfirm() {
    if (escConfirmTimer) {
      clearTimeout(escConfirmTimer);
      escConfirmTimer = null;
    }
    escConfirmActive = false;
    if (backHomeBtn) {
      backHomeBtn.textContent = "← 回首頁";
    }
  }

  function showPractice() {
    resetEscConfirm();
    document.body.dataset.mode = state.modeKey;
    homeView.classList.add("hidden");
    practiceView.classList.remove("hidden");
    resultOverlay.classList.add("hidden");
    const titleText = state.modeKey === "custom_text" && state.item && state.item.label
      ? `自訂：${state.item.label}`
      : state.mode.title;
    $("#practiceTitle").textContent = titleText;
    if (changeCustomTextBtn) {
      changeCustomTextBtn.classList.toggle("hidden", state.modeKey !== "custom_text");
    }
  }

  function showHome() {
    resetEscConfirm();
    // Cancel any pending result modal that would reappear after going home
    if (resultTimeoutId) {
      clearTimeout(resultTimeoutId);
      resultTimeoutId = null;
    }
    if (state && state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
    if (state && state.animTimer) {
      clearTimeout(state.animTimer);
      state.animTimer = null;
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

  // ---- 生活情境題：只做 LINE ----
  // Text is "阿哲：……我：……" bubbles. "我" is always the user's turns
  // (typed in the input below); everyone else is the opponent (display only).
  // Char spans keep their data-line/data-pos so paint() works unchanged.
  const ME = "我";

  function buildChatState(item) {
    const segs = parseChatMessages(item.text).map((s) => ({
      speaker: s.speaker,
      isMe: s.speaker === ME,
      text: Array.from(item.text).slice(s.contentStart, s.end).join(""),
    }));
    const userTurns = segs.filter((s) => s.isMe).map((s) => s.text);
    return { segs, userTurns };
  }

  // Split "店員：…？我：…" into {speaker, start, contentStart, end} segments.
  // Speaker = 1-4 CJK chars + fullwidth colon, right after start or 。？！
  // Anything without that pattern becomes one anonymous bubble.
  function parseChatMessages(text) {
    const re = /(^|[。？！])([一-龥]{1,4})：/g;
    const hits = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index + m[1].length;
      hits.push({ speaker: m[2], start, contentStart: start + m[2].length + 1 });
    }
    const segs = [];
    if (!hits.length) return [{ speaker: null, start: 0, contentStart: 0, end: text.length }];
    if (hits[0].start > 0) segs.push({ speaker: null, start: 0, contentStart: 0, end: hits[0].start });
    hits.forEach((h, i) => {
      segs.push({ ...h, end: i + 1 < hits.length ? hits[i + 1].start : text.length });
    });
    return segs;
  }

  function renderPractice() {
    clearKeyError();
    const box = $("#targetBox");
    const inBox = $("#inputBox");
    box.innerHTML = "";
    inBox.innerHTML = "";

    // 1. 生活情境題 = LINE 回合聊天：對手氣泡（唯讀）→ 我打字（草稿泡）→ Enter 送出。
    //    每回合只顯示已經出現的氣泡，空白開始、逐輪浮現。
    const isChat = state.modeKey === "life_situations";
    if (isChat) {
      box.className = "target-box chat-target";
      box.dataset.platform = "line";
      const now = new Date();
      const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      const segs = state.chatSegs || [];
      const opp = segs.find((s) => !s.isMe);
      const who = opp ? opp.speaker : "對方";
      const header = document.createElement("div");
      header.className = "chat-header";
      header.innerHTML = `<span class="chat-back">‹</span><span class="chat-avatar">${who.slice(0, 1)}</span><span class="chat-name">${who}</span><span class="chat-icons">☎ ▸</span>`;
      box.appendChild(header);
      const body = document.createElement("div");
      body.className = "chat-body";
      box.appendChild(body);
      const phase = state.animationPhase;
      const visible = state.chatVisible || 0;
      let ui = 0;
      const lineOf = segs.map((s) => (s.isMe ? ui++ : -1));
      const makeChar = (uiIdx, ci, ch) => {
        const s = document.createElement("span");
        s.className = "char pending";
        s.dataset.line = uiIdx; s.dataset.pos = ci;
        s.textContent = ch === " " ? "\u00a0" : ch;
        return s;
      };
      const renderUserBubble = (seg, uiIdx, cls) => {
        const msg = document.createElement("div");
        msg.className = "chat-msg chat-right" + (cls ? " " + cls : "");
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";
        Array.from(seg.text).forEach((ch, ci) => bubble.appendChild(makeChar(uiIdx, ci, ch)));
        msg.appendChild(bubble);
        if (cls !== "chat-draft") {
          const meta = document.createElement("div");
          meta.className = "chat-meta";
          meta.textContent = "已讀 " + hhmm;
          msg.appendChild(meta);
        }
        body.appendChild(msg);
      };
      for (let si = 0; si < visible && si < segs.length; si++) {
        const seg = segs[si];
        const entering = si === visible - 1 && (phase === ANIMATION_PHASE.OPPONENT_ENTERING || phase === ANIMATION_PHASE.USER_SENT);
        if (seg.isMe) {
          renderUserBubble(seg, lineOf[si], entering ? "msg-enter" : "");
        } else {
          const msg = document.createElement("div");
          msg.className = "chat-msg chat-left" + (entering ? " msg-enter" : "");
          const name = document.createElement("div");
          name.className = "chat-speaker";
          name.textContent = seg.speaker;
          msg.appendChild(name);
          const bubble = document.createElement("div");
          bubble.className = "chat-bubble chat-static";
          bubble.textContent = seg.text;
          msg.appendChild(bubble);
          const meta = document.createElement("div");
          meta.className = "chat-meta";
          meta.textContent = hhmm;
          msg.appendChild(meta);
          body.appendChild(msg);
        }
      }
      // Draft bubble: the message I'm typing right now.
      if (phase === ANIMATION_PHASE.USER_TYPING && state.lineIdx < state.lines.length) {
        renderUserBubble({ text: state.lines[state.lineIdx] }, state.lineIdx, "chat-draft");
      }
      // Opponent typing indicator during the pause.
      if (phase === ANIMATION_PHASE.PAUSE_BRIEF) {
        const msg = document.createElement("div");
        msg.className = "chat-msg chat-left";
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-typing";
        bubble.innerHTML = "<span></span><span></span><span></span>";
        msg.appendChild(bubble);
        body.appendChild(msg);
      }
      body.scrollTop = body.scrollHeight;
    } else {
      box.className = "target-box";
      box.removeAttribute("data-platform");
      box.scrollTop = 0;
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
    }

    // 2. Render ONLY ONE active input bar at a time (even for multi-line articles)
    const li = state.lineIdx;
    const active = !state.finished;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = (isChat && state.animationPhase !== ANIMATION_PHASE.USER_TYPING)
      ? "" // in LINE turns the sent text lives in the bubble above, not the input
      : (state.inputs[li] || "");
    const lifeActive = !isChat || state.animationPhase === ANIMATION_PHASE.USER_TYPING;
    const currentLayout = getCurrentLayout();
    const isBoshiamyUninitialized = currentLayout === "boshiamy" && !BOSHIAMY;

    if (isBoshiamyUninitialized) {
      inp.placeholder = "請先點擊上方或鍵盤匯入碼表";
      inp.disabled = true;
    } else if (state.lines.length > 1 && !isChat) {
      const isLastLine = li >= state.lines.length - 1;
      inp.placeholder = active
        ? `第 ${li + 1} / ${state.lines.length} 行：在此輸入…（${isLastLine ? "打對即完成" : "打對自動換行"}）`
        : "（已完成）";
    } else if (isChat) {
      inp.placeholder = active
        ? (lifeActive ? "輸入訊息…（打滿按 Enter 送出）" : "等對方回覆…")
        : "（已完成）";
    } else {
      inp.placeholder = active ? "在此輸入…" : "（已完成）";
    }
    inp.disabled = !active || !lifeActive || isBoshiamyUninitialized;
    inp.autocomplete = "off"; inp.autocorrect = "off"; inp.autocapitalize = "off"; inp.spellcheck = false;
    inp.setAttribute("aria-label", `第 ${li + 1} 行輸入`);
    inp.dataset.line = li;

    inp.addEventListener("compositionstart", () => {
      ensureTimerStarted();
      state.composing = true;
      state.compositionStartAt = Date.now();
      state.selectionStartAt = null;
      state.selectionInteractionDuration = 0;
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
      const compEndNow = Date.now();
      let imeDuration = 0;
      if (state.selectionStartAt) {
        imeDuration = compEndNow - state.selectionStartAt;
      } else if (state.compositionStartAt) {
        imeDuration = compEndNow - state.compositionStartAt;
      }
      state.selectionInteractionDuration = Math.max(0, imeDuration);
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
      if (state && !state.finished) {
        const now = Date.now();
        if (state.charStartTime == null) state.charStartTime = now;
        if (state.charFirstKeyTime == null) state.charFirstKeyTime = now;
        if (e.key === "Backspace" || e.code === "Backspace" || e.keyCode === 8) {
          state.charBackspaces = (state.charBackspaces || 0) + 1;
        }
      }
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

      // Track IME selection actions (arrows, digits, Enter, Space during composition)
      if (state && !state.finished && (state.composing || state.compositionStartAt)) {
        const isSelectionNavOrChoice = (
          e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowLeft" ||
          e.code === "ArrowDown" || e.code === "ArrowUp" || e.code === "ArrowRight" || e.code === "ArrowLeft" ||
          e.key === "PageDown" || e.key === "PageUp" ||
          /^[0-9]$/.test(e.key) || /^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code) ||
          isEnter || e.key === " " || e.code === "Space"
        );
        if (isSelectionNavOrChoice) {
          if (!state.selectionStartAt) {
            state.selectionStartAt = Date.now();
          }
        }
      }

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

        const isLife = state.modeKey === "life_situations";
        const targetLen = Array.from(state.lines[li]).length;
        const cur = Array.from(state.inputs[li] || "").length;
        if (isLife) {
          if (state.animationPhase !== ANIMATION_PHASE.USER_TYPING) {
            if (state.animationPhase === ANIMATION_PHASE.PAUSE_BRIEF) hint("對方正在輸入…");
            else if (state.animationPhase === ANIMATION_PHASE.USER_SENT) hint("訊息送出中…");
            else hint("等對方氣泡出現…");
            return;
          }
          if (cur < targetLen) {
            hint("這句還沒打完（" + cur + "/" + targetLen + "）。打滿按 Enter 送出。");
            return;
          }
          lifeUserSent();
          return;
        }
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

        if (isCangjie || isSucheng) {
          // 倉頡／速成版面：鍵面主字 = 字根（A=日 … Y=卜，X=難，Z=重），
          // 副字 = 英文字母。速成取倉頡首尾碼，鍵位與倉頡相同，故鍵面亦同樣
          // 顯示部首（非只有英文字母）。
          // 非字母鍵（數字/標點）無字根，退回英數面；空白鍵副字為「選字」。
          // 非字母鍵主字用未按 Shift 的記號（, . / 等），副字才是 Shift 後的記號
          // （< > ? 等），避免打「，」時只看到 < 誤以為要按 Shift。
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">${item.label}</span><span class="k-sub">選字</span>`;
          } else if (item.key && CANGJIE_RADICAL[item.key.toLowerCase()]) {
            key.innerHTML = `<span class="k-main">${CANGJIE_RADICAL[item.key.toLowerCase()]}</span><span class="k-sub">${item.key.toUpperCase()}</span>`;
          } else if (item.key && /^[a-z]$/i.test(item.key)) {
            key.innerHTML = `<span class="k-main">${item.shift || item.key.toUpperCase()}</span><span class="k-sub">${item.key || ""}</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.key || ""}</span><span class="k-sub">${item.shift || ""}</span>`;
          }
        } else if (isBoshiamy) {
          // 嘸蝦米版面：鍵面只顯示大寫英文字母（使用者要求：不要部首）。
          // 非字母鍵主字用未按 Shift 的記號，副字才是 Shift 後的記號（同倉頡）。
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">${item.label}</span><span class="k-sub">選字</span>`;
          } else if (item.key && /^[a-z]$/i.test(item.key)) {
            key.innerHTML = `<span class="k-main">${item.shift || (item.key || "").toUpperCase()}</span><span class="k-sub">${item.key || ""}</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.key || ""}</span><span class="k-sub">${item.shift || ""}</span>`;
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
          // Fallback（舊值 qwerty 相容）：等同英數面；非字母鍵主字用未按 Shift 記號
          if (item.isFn) {
            key.innerHTML = `<span class="k-main">${item.label || ""}</span>`;
          } else if (item.isSpace) {
            key.innerHTML = `<span class="k-main">Space</span>`;
          } else if (item.key && /^[a-z]$/i.test(item.key)) {
            key.innerHTML = `<span class="k-main">${item.shift || item.key.toUpperCase()}</span><span class="k-sub">${item.key || ""}</span>`;
          } else {
            key.innerHTML = `<span class="k-main">${item.key || ""}</span><span class="k-sub">${item.shift || ""}</span>`;
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
    // 版面下拉只跟鍵位提示一起出現：關閉時隱藏，開啟時顯示。
    if (layoutLabel) layoutLabel.style.display = show ? "" : "none";
    // 題目厚度：關閉鍵位提示時維持原本高度（不撐滿整屏），開啟時才撐滿。
    if (practiceView) practiceView.classList.toggle("onkb-on", show);
    if (!show) return;
    const layout = (loadJSON(LS_ONKB, {}) || {}).layout || (layoutSelect ? layoutSelect.value : "bopomofo");
    if (onKeyboard.dataset.layout !== layout) buildOnKeyboard(layout);

    // 虛擬鍵盤區情境觸發：僅當使用者手動切換到「嘸蝦米」且未載入碼表時才顯示灰色遮罩與按鈕
    const isBoshiamyUninitialized = layout === "boshiamy" && !BOSHIAMY;
    onKeyboardWrap.classList.toggle("is-uninitialized", isBoshiamyUninitialized);
    let overlay = onKeyboard.querySelector(".on-kb-overlay");
    if (isBoshiamyUninitialized) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "on-kb-overlay";
        overlay.setAttribute("role", "button");
        overlay.setAttribute("tabindex", "0");
        overlay.setAttribute("aria-label", "點擊匯入 .cin 碼表啟用鍵盤");
        overlay.innerHTML = `<button type="button" class="on-kb-overlay-btn">📥 點擊匯入 .cin 碼表啟用鍵盤</button>`;
        overlay.addEventListener("click", () => {
          if (typeof openBoshiamyModal === "function") openBoshiamyModal();
        });
        onKeyboard.appendChild(overlay);
      }
    } else {
      if (overlay) overlay.remove();
    }

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

  function getCharDecompInfo(ch, contextLine, charIdx) {
    if (!ch) return "";
    const layout = getCurrentLayout();
    if (layout === "bopomofo") {
      const z = lookupZhuyinForChar(ch, contextLine, charIdx);
      return z ? `注音: ${z}` : "";
    }
    if (layout === "boshiamy") {
      if (BOSHIAMY && BOSHIAMY[ch] && BOSHIAMY[ch].length) {
        return `嘸蝦米: ${BOSHIAMY[ch][0]}`;
      }
      return "";
    }
    if (layout === "sucheng") {
      if (CANGJIE && CANGJIE[ch]) {
        const full = CANGJIE[ch];
        const sc = full.length <= 2 ? full : (full[0] + full[full.length - 1]);
        return `速成: ${sc}`;
      }
      return "";
    }
    // cangjie fallback
    if (CANGJIE && CANGJIE[ch]) {
      return `倉頡: ${CANGJIE[ch]}`;
    }
    return "";
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
      if (!BOSHIAMY) return { isBoshiamyUninitialized: true };
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
    if (methodKey === "boshiamy" && !BOSHIAMY) {
      return `<span class="decomp-name">${label}</span> ： <span class="decomp-import-btn" role="button" tabindex="0" title="點擊匯入碼表">匯入 .cin 檔</span>`;
    }
    const reloadBtn = methodKey === "boshiamy" ? ` <button type="button" class="decomp-reload-btn" title="重新上傳或更換碼表" aria-label="重新上傳或更換碼表">⚙️</button>` : "";
    if (PUNCT_KEY_MAP[ch] || /^[ -]$/.test(ch)) {
      return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： 照打${reloadBtn}`;
    }
    const dec = decompositionFor(ch, methodKey);
    if (dec && dec.missing) {
      return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： ${dec.missing}${reloadBtn}`;
    }
    if (dec && dec.lettersOnly) {
      const letters = Array.from(dec.code).map((c) => c.toUpperCase()).join(" ");
      return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： <span class="cj-letters">${letters}</span>${reloadBtn}`;
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

    // Nav buttons click (‹ / ›) & In-place CTA click (匯入 .cin / ⚙️)
    cangjieHint.addEventListener("click", (e) => {
      const importBtn = e.target.closest(".decomp-import-btn");
      const reloadBtn = e.target.closest(".decomp-reload-btn");
      if (importBtn || reloadBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof openBoshiamyModal === "function") openBoshiamyModal();
        return;
      }
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
        // 注音版全形標點「，」「。」除了亮標點鍵（ㄝ／ㄡ），還要一併亮 Ctrl 鍵
        if (curChar === "，" || curChar === "。") {
          const ctrlEl = onKeyboard.querySelector('.on-kb-key[data-code="ControlLeft"]');
          if (ctrlEl) ctrlEl.classList.add("is-next");
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
      if (PUNCT_KEY_MAP[curChar] && PUNCT_KEY_MAP[curChar].shift) {
        const shiftEl = onKeyboard.querySelector(`.on-kb-key[data-code="ShiftLeft"]`);
        if (shiftEl) shiftEl.classList.add("is-next");
      }
    }

    // 大寫英文字母需要 Shift（中英雜燴的工程／品牌／縮寫題大量使用）：
    // 上面分支只亮字母鍵，這裡補亮 ShiftLeft，讓大小寫訓練點看得見。
    if (/[A-Z]/.test(curChar)) {
      const shiftEl = onKeyboard.querySelector('.on-kb-key[data-code="ShiftLeft"]');
      if (shiftEl) shiftEl.classList.add("is-next");
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
    const box = document.getElementById("targetBox");
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
      const tgt = Array.from(state.lines[state.lineIdx] || "");
      el.classList.toggle("done", typed.length >= tgt.length);
    }
    // Keep the current char visible inside the (possibly scrolling)
    // target box, so long items never hide the caret off-screen.
    const curEl = document.querySelector(".char.current");
    if (box && curEl && box.scrollHeight > box.clientHeight) {
      const br = box.getBoundingClientRect(), cr = curEl.getBoundingClientRect();
      if (cr.top < br.top + 18) box.scrollTop -= (br.top + 18 - cr.top);
      else if (cr.bottom > br.bottom - 18) box.scrollTop += (cr.bottom - (br.bottom - 18));
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

    // Track per-character telemetry
    if (state && !state.finished) {
      if (!state.charLogs) state.charLogs = [];
      const typedChars = Array.from(state.inputs[li] || "");
      const lastLen = state.lastCommittedLen || 0;
      if (typedChars.length > lastLen) {
        const now = Date.now();
        const lineText = state.lines[li] || "";
        const targetChars = Array.from(lineText);
        for (let idx = lastLen; idx < typedChars.length; idx++) {
          const ch = typedChars[idx];
          const tgtCh = targetChars[idx] || ch;
          const charStart = state.charStartTime || (state.startedAt || now);
          const duration = Math.max(20, now - charStart);
          const firstKeyTime = state.charFirstKeyTime || now;
          const cognitiveLatency = Math.max(0, Math.min(duration, firstKeyTime - charStart));
          const imeSelectDuration = state.selectionInteractionDuration || 0;
          const netDuration = Math.max(20, duration - imeSelectDuration);
          const cpm = Math.round((1 / (duration / 1000)) * 60);
          const decomp = getCharDecompInfo(tgtCh, lineText, idx);
          state.charLogs.push({
            char: tgtCh,
            typedChar: ch,
            correct: norm(tgtCh) === norm(ch),
            duration,
            netDuration,
            imeSelectDuration,
            cpm,
            cognitiveLatency,
            backspaces: state.charBackspaces || 0,
            decomp,
            lineIdx: li,
            charIdx: idx
          });
          state.charStartTime = now;
          state.charFirstKeyTime = null;
          state.charBackspaces = 0;
          state.compositionStartAt = null;
          state.selectionStartAt = null;
          state.selectionInteractionDuration = 0;
        }
        state.lastCommittedLen = typedChars.length;
      }
    }
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
    state.lastCommittedLen = 0;
    state.charStartTime = Date.now();
    state.charFirstKeyTime = null;
    state.charBackspaces = 0;
    state.compositionStartAt = null;
    state.selectionStartAt = null;
    state.selectionInteractionDuration = 0;
    renderPractice();
    paint();
    focusCurrent();
  }

  function maybeFinish() {
    if (state.finished) return;
    // In LINE turns, finish only when the animation itself reaches the end
    // (trailing opponent bubble shown last). Typing the final character of
    // the final turn must not cut the animation short.
    if (state.modeKey === "life_situations" && state.animationPhase !== ANIMATION_PHASE.COMPLETED) return;
    const allFull = state.lines.every((line, i) => Array.from(state.inputs[i] || "").length >= Array.from(line).length);
    if (!allFull) return;

    state.elapsed = elapsedNow();
    state.finished = true;
    stopTimer();
    paintCangjieHint(); // finished -> 右上角顯示「完成！」而非停在上一字

    if (state.currentInputEl) {
      state.currentInputEl.disabled = true;
      state.currentInputEl.value = "";
    }

    state.sessionCompleted = (state.sessionCompleted || 0) + 1;

    const modeKey = state.modeKey;
    const target = ROUND_TARGET[modeKey] || 1;
    const endless = isEndlessEnabled(modeKey);
    const finiteShort = isShortMode(modeKey) && !endless;

    if (finiteShort) {
      state.roundTotalTyped = (state.roundTotalTyped || 0) + state.totalTyped;
      state.roundTotalCorrect = (state.roundTotalCorrect || 0) + state.totalCorrect;
      state.roundElapsed = (state.roundElapsed || 0) + state.elapsed;
      state.roundCharLogs = (state.roundCharLogs || []).concat(state.charLogs || []);
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
      const combinedLogs = (state.roundCharLogs || []).concat(state.charLogs || []);
      const stats = recordStats({
        totalTyped: state.roundTotalTyped,
        totalCorrect: state.roundTotalCorrect,
        sec: continuousSec,
        charLogs: combinedLogs,
      });
      state.sessionCompleted = 0;
      state.roundTotalTyped = 0;
      state.roundTotalCorrect = 0;
      state.roundElapsed = 0;
      state.roundStartedAt = null;
      state.roundCharLogs = [];
      resultTimeoutId = setTimeout(() => { resultTimeoutId = null; showResultModal(stats); }, 250);
      return;
    }

    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    state.roundCharLogs = [];
    const stats = recordStats();

    if (endless) {
      // 無盡模式：永不結算，只給回饋並自動跳下一題（所有模式皆同）。
      showAutoNextFeedback(stats);
      state.autoNextTimer = setTimeout(() => {
        state.autoNextTimer = null;
        startRound(state.modeKey);
      }, 300);
    } else {
      // 有限輪（無盡關閉）：其他模式打完一個就結算彈窗；
      // 單字／句子已在上面的 finiteShort 分支累積到 10／5 題才到達這裡的對應結算。
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

    const charLogs = (override && override.charLogs) || (state && state.charLogs) || [];

    // Calculate cognitive latency (first key reaction time)
    const validLatencies = charLogs
      .map((l) => l.cognitiveLatency)
      .filter((v) => typeof v === "number" && v > 0);
    const avgFirstKeyLatency = validLatencies.length
      ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
      : 0;

    // Calculate rhythm consistency (100 - CV% of char durations, clamped 0~100)
    let consistency = 80;
    if (charLogs.length > 2) {
      const durations = charLogs.map((l) => l.duration);
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (mean > 0) {
        const variance = durations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / durations.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / mean) * 100;
        consistency = Math.max(10, Math.min(100, Math.round(100 - cv)));
      }
    }

    // Bottleneck characters analysis (純構字延遲演算法，三重篩選門檻)
    const validLogs = charLogs.filter((l) => l && l.char && l.char.trim());
    let bottlenecks = [];

    if (validLogs.length > 0) {
      // 確保每筆 log 具備 netDuration
      validLogs.forEach((l) => {
        if (typeof l.netDuration !== "number") {
          const imeDur = l.imeSelectDuration || 0;
          l.netDuration = Math.max(20, (l.duration || 20) - imeDur);
        }
      });

      const netDurations = validLogs.map((l) => l.netDuration);
      const sortedDurs = [...netDurations].sort((a, b) => a - b);
      const mid = Math.floor(sortedDurs.length / 2);
      const median = sortedDurs.length % 2 !== 0
        ? sortedDurs[mid]
        : (sortedDurs[mid - 1] + sortedDurs[mid]) / 2;

      const mean = netDurations.reduce((a, b) => a + b, 0) / netDurations.length;
      const variance = netDurations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / netDurations.length;
      const stdDev = Math.sqrt(variance);

      // 條件 1: 淨延遲 > 400ms
      // 條件 2: 淨延遲 > Median + 2 * StdDev
      const outlierThreshold = median + 2 * stdDev;
      const qualified = validLogs.filter((l) => l.netDuration > 400 && l.netDuration > outlierThreshold);

      // 去重：同一字取最大淨延遲
      const bottleneckMap = new Map();
      qualified.forEach((l) => {
        if (!bottleneckMap.has(l.char) || l.netDuration > bottleneckMap.get(l.char).netDuration) {
          bottleneckMap.set(l.char, l);
        }
      });

      // 條件 3: 依延遲降序排序，若超過 8 個字僅保留前 8 名
      bottlenecks = Array.from(bottleneckMap.values())
        .sort((a, b) => b.netDuration - a.netDuration)
        .slice(0, 8)
        .map((l) => ({
          char: l.char,
          duration: l.duration,
          netDuration: l.netDuration,
          imeSelectDuration: l.imeSelectDuration || 0,
          latency: l.cognitiveLatency,
          decomp: l.decomp,
          backspaces: l.backspaces
        }));
    }

    return {
      sec,
      rawSec: eff.rawSec,
      cpm,
      acc,
      isRecord,
      isAnomalous,
      totalTyped,
      totalCorrect,
      avgFirstKeyLatency,
      consistency,
      bottlenecks,
      charLogs
    };
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
    const hudProgEl = $("#hudProg");
    if (hudProgEl) hudProgEl.textContent = "100%";
    $("#progressBar").style.width = "100%";
  }

  // ---- Profiler Dashboard & Telemetry Visualizer ----
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let chartPoints = [];
  let currentChartTab = "macro"; // "macro" | "latency"
  let lastResultTelemetry = null;
  let resultChartHoverIdx = -1;

  function drawSmoothLine(ctx, points) {
    if (!points || !points.length) return;
    if (points.length === 1) {
      ctx.moveTo(points[0].x, points[0].y);
      return;
    }
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  function renderResultChart(logs) {
    const canvas = document.getElementById("resultChartCanvas");
    if (!canvas) return;
    const container = document.getElementById("chartCanvasContainer");
    const rect = container ? container.getBoundingClientRect() : { width: 680, height: 260 };
    const width = Math.max(300, Math.floor(rect.width || 680));
    const height = 240;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!logs || !logs.length) {
      ctx.fillStyle = "#71717a";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("無足夠按鍵記錄可分析", width / 2, height / 2);
      chartPoints = [];
      return;
    }

    const padding = { top: 30, right: 30, bottom: 40, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const isLatencyTab = currentChartTab === "latency";

    if (isLatencyTab) {
      // Latency Tab: character-by-character breakdown
      const n = logs.length;
      const maxVal = Math.max(500, ...logs.map((l) => (l.netDuration != null ? l.netDuration : l.duration) || 0)) * 1.15;

      // Background horizontal grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.fillStyle = "rgba(161, 161, 170, 0.6)";
      ctx.font = "11px monospace";
      ctx.textAlign = "right";

      const gridSteps = 4;
      for (let i = 0; i <= gridSteps; i++) {
        const val = Math.round((maxVal / gridSteps) * i);
        const y = padding.top + chartH - (i / gridSteps) * chartH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(`${val}ms`, padding.left - 8, y + 4);
      }

      const stepX = chartW / Math.max(1, n);
      const barWidth = Math.max(3, Math.min(22, stepX * 0.65));
      chartPoints = [];

      logs.forEach((log, idx) => {
        const x = padding.left + idx * stepX + stepX / 2;
        const dur = (log.netDuration != null ? log.netDuration : log.duration) || 20;
        const barH = Math.min(chartH, (dur / maxVal) * chartH);
        const y = padding.top + chartH - barH;
        chartPoints.push({ x, y, barH, barWidth, log, idx, type: "latency" });
      });

      chartPoints.forEach((pt, idx) => {
        const isHovered = (resultChartHoverIdx === idx);
        const hasErrors = (pt.log.backspaces > 0) || !pt.log.correct;
        ctx.fillStyle = hasErrors
          ? (isHovered ? "rgba(239, 68, 68, 0.9)" : "rgba(239, 68, 68, 0.5)")
          : (isHovered ? "rgba(56, 189, 248, 0.9)" : "rgba(56, 189, 248, 0.4)");

        const rx = pt.x - pt.barWidth / 2;
        const ry = padding.top + chartH - pt.barH;
        const r = Math.min(3, pt.barWidth / 2);
        ctx.beginPath();
        ctx.moveTo(rx, ry + pt.barH);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.lineTo(rx + pt.barWidth - r, ry);
        ctx.quadraticCurveTo(rx + pt.barWidth, ry, rx + pt.barWidth, ry + r);
        ctx.lineTo(rx + pt.barWidth, ry + pt.barH);
        ctx.closePath();
        ctx.fill();

        if (n <= 45 || idx % Math.ceil(n / 35) === 0) {
          ctx.fillStyle = isHovered ? "#fbbf24" : "rgba(161, 161, 170, 0.75)";
          ctx.font = isHovered ? "bold 12px sans-serif" : "11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(pt.log.char || "", pt.x, height - 12);
        }
      });
      return;
    }

    // Macro Tab: Time Buckets X-Axis & Dual Smooth WPM Curves
    const totalDurationMs = logs.reduce((acc, l) => acc + (l.duration || 0), 0);
    const totalSec = Math.max(1, totalDurationMs / 1000);
    // Dynamic bucket size: 1s default, 2s if > 180s, 3s if > 300s
    let bucketSize = 1;
    if (totalSec > 300) {
      bucketSize = 3;
    } else if (totalSec > 180) {
      bucketSize = 2;
    }

    const numBuckets = Math.max(1, Math.ceil(totalSec / bucketSize));
    const buckets = [];
    for (let i = 0; i < numBuckets; i++) {
      buckets.push({
        bucketIdx: i,
        timeSec: (i + 1) * bucketSize,
        chars: [],
        charCount: 0,
        logs: [],
        instantWpm: 0,
        cumulativeWpm: 0
      });
    }

    let elapsedMs = 0;
    logs.forEach((log) => {
      elapsedMs += (log.duration || 0);
      const s = elapsedMs / 1000;
      let bIdx = Math.floor(s / bucketSize);
      if (bIdx >= numBuckets) bIdx = numBuckets - 1;
      buckets[bIdx].chars.push(log.char);
      buckets[bIdx].charCount += 1;
      buckets[bIdx].logs.push(log);
    });

    let cumulativeCount = 0;
    buckets.forEach((b) => {
      cumulativeCount += b.charCount;
      // 即時 WPM = 當前時間桶打字量 / 區間單位時間 (換算為分鐘)
      b.instantWpm = Math.round((b.charCount / bucketSize) * 60);
      // 累計平均 WPM = 至今累計字數 / 至今總時間 (換算為分鐘)
      b.cumulativeWpm = Math.round((cumulativeCount / b.timeSec) * 60);
    });

    const maxVal = Math.max(60, ...buckets.map((b) => Math.max(b.instantWpm, b.cumulativeWpm))) * 1.15;

    // Background horizontal grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(161, 161, 170, 0.6)";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = Math.round((maxVal / gridSteps) * i);
      const y = padding.top + chartH - (i / gridSteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      ctx.fillText(`${val}`, padding.left - 8, y + 4);
    }

    const stepX = chartW / Math.max(1, numBuckets);
    chartPoints = [];

    const instPts = [];
    const cumPts = [];

    buckets.forEach((b, idx) => {
      const x = padding.left + idx * stepX + stepX / 2;
      const instY = padding.top + chartH - (b.instantWpm / maxVal) * chartH;
      const cumY = padding.top + chartH - (b.cumulativeWpm / maxVal) * chartH;
      instPts.push({ x, y: instY });
      cumPts.push({ x, y: cumY });
      chartPoints.push({
        x,
        y: cumY,
        instY,
        bucket: b,
        idx,
        type: "macro"
      });
    });

    // Draw X-axis time labels
    const labelStep = Math.max(1, Math.ceil(numBuckets / 12));
    buckets.forEach((b, idx) => {
      if (idx === 0 || idx === numBuckets - 1 || idx % labelStep === 0) {
        const x = padding.left + idx * stepX + stepX / 2;
        ctx.fillStyle = "rgba(161, 161, 170, 0.75)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${b.timeSec}s`, x, height - 12);
      }
    });

    // 1. Draw Curve 2: 即時 WPM (Sky blue spline)
    if (instPts.length > 0) {
      ctx.beginPath();
      drawSmoothLine(ctx, instPts);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dots on Instant WPM line
      instPts.forEach((pt, idx) => {
        const isHovered = (resultChartHoverIdx === idx);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHovered ? 4.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#fff" : "#38bdf8";
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    // 2. Draw Curve 1: 累計平均 WPM (Amber spline with subtle area gradient)
    if (cumPts.length > 0) {
      // Area fill under Cumulative WPM
      ctx.beginPath();
      drawSmoothLine(ctx, cumPts);
      const lastPt = cumPts[cumPts.length - 1];
      const firstPt = cumPts[0];
      ctx.lineTo(lastPt.x, padding.top + chartH);
      ctx.lineTo(firstPt.x, padding.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.22)");
      grad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Smooth Line
      ctx.beginPath();
      drawSmoothLine(ctx, cumPts);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Dots on Cumulative WPM line
      cumPts.forEach((pt, idx) => {
        const isHovered = (resultChartHoverIdx === idx);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHovered ? 5.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#fff" : "#f59e0b";
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }
  }

  function setupChartInteractions() {
    const canvas = document.getElementById("resultChartCanvas");
    const tooltip = document.getElementById("chartTooltip");
    if (!canvas || !tooltip) return;

    function hideTooltip() {
      resultChartHoverIdx = -1;
      tooltip.classList.add("hidden");
      if (lastResultTelemetry) renderResultChart(lastResultTelemetry.charLogs);
    }

    function updateHover(evt) {
      if (!chartPoints.length || !lastResultTelemetry) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = evt.clientX - rect.left;
      const mouseY = evt.clientY - rect.top;

      let closestIdx = -1;
      let minDiff = Infinity;
      chartPoints.forEach((pt, idx) => {
        const diff = Math.abs(pt.x - mouseX);
        if (diff < minDiff && diff < (canvas.clientWidth / chartPoints.length) * 1.5) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      if (closestIdx === -1) {
        hideTooltip();
        return;
      }

      resultChartHoverIdx = closestIdx;
      renderResultChart(lastResultTelemetry.charLogs);

      const pt = chartPoints[closestIdx];

      if (pt.type === "macro" && pt.bucket) {
        const b = pt.bucket;
        const charsSample = b.chars.slice(0, 8).join("");
        const moreSuffix = b.chars.length > 8 ? "…" : "";
        const charsDisplay = b.chars.length > 0 ? `「${escapeHtml(charsSample + moreSuffix)}」` : "（無擊鍵）";

        tooltip.innerHTML = `
          <div class="tooltip-char-line">
            <span class="tooltip-char">${b.timeSec} 秒處</span>
            <span class="tooltip-duration">${b.charCount} 字</span>
          </div>
          <div class="tooltip-detail-grid">
            <div>累計均速: <strong style="color:#f59e0b">${b.cumulativeWpm} WPM</strong></div>
            <div>即時速度: <strong style="color:#38bdf8">${b.instantWpm} WPM</strong></div>
            <div style="margin-top:2px;color:#a1a1aa">區間字元: <span style="color:#f4f4f5">${charsDisplay}</span></div>
          </div>
        `;
      } else {
        const log = pt.log;
        const decompStr = log.decomp ? `<div class="tooltip-decomp">${escapeHtml(log.decomp)}</div>` : "";
        const errorStr = (log.backspaces > 0 || !log.correct)
          ? `<div class="tooltip-err">退格修正: ${log.backspaces} 次</div>`
          : "";
        const displayDur = log.netDuration != null ? log.netDuration : log.duration;

        tooltip.innerHTML = `
          <div class="tooltip-char-line">
            <span class="tooltip-char">「${escapeHtml(log.char)}」</span>
            <span class="tooltip-duration">${displayDur} ms</span>
          </div>
          <div class="tooltip-detail-grid">
            <div>首鍵思維: <strong>${log.cognitiveLatency} ms</strong></div>
            <div>選字耗時: <strong>${log.imeSelectDuration || 0} ms</strong></div>
            <div>即時速度: <strong>${log.cpm} CPM</strong></div>
          </div>
          ${decompStr}
          ${errorStr}
        `;
      }

      tooltip.classList.remove("hidden");
      const ttWidth = 190;
      let left = pt.x - ttWidth / 2;
      if (left < 10) left = 10;
      if (left + ttWidth > canvas.clientWidth - 10) left = canvas.clientWidth - ttWidth - 10;
      let top = pt.y - 85;
      if (top < 10) top = pt.y + 20;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }

    canvas.addEventListener("mousemove", updateHover);
    canvas.addEventListener("mouseleave", hideTooltip);
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) updateHover(e.touches[0]);
    }, { passive: true });
    canvas.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches[0]) updateHover(e.touches[0]);
    }, { passive: true });
    canvas.addEventListener("touchend", hideTooltip);
  }

  function showResultModal(stats) {
    if (practiceView.classList.contains("hidden")) return;
    lastResultTelemetry = stats;
    resultChartHoverIdx = -1;

    // 1. Update Header & Meta (if present)
    const elapsedText = fmtTime(stats.sec || 0);
    const correct = stats.totalCorrect != null ? stats.totalCorrect : (stats.correctChars != null ? stats.correctChars : (state ? state.totalCorrect : 0));
    const typed = stats.totalTyped != null ? stats.totalTyped : (stats.totalChars != null ? stats.totalChars : (state ? state.totalTyped : 0));

    const resultTimeElapsed = $("#resultTimeElapsed");
    if (resultTimeElapsed) resultTimeElapsed.textContent = `用時: ${elapsedText}`;
    const resultCharsStat = $("#resultCharsStat");
    if (resultCharsStat) resultCharsStat.textContent = `答對字數: ${correct} / ${typed}`;

    // 2. Update Top KPI Cards (WPM as primary, CPM as secondary)
    const kpiCpm = $("#kpiCpm");
    const kpiWpm = $("#kpiWpm");
    const kpiAcc = $("#kpiAcc");
    const kpiAccRatio = $("#kpiAccRatio");
    const kpiLatency = $("#kpiLatency");
    const kpiConsistency = $("#kpiConsistency");

    const wpmVal = Math.round(stats.cpm / 5);
    if (kpiWpm) kpiWpm.textContent = wpmVal;
    if (kpiCpm) kpiCpm.textContent = `${stats.cpm} CPM`;
    if (kpiAcc) kpiAcc.textContent = `${stats.acc}%`;
    if (kpiAccRatio) kpiAccRatio.textContent = `${correct} / ${typed} 字`;
    if (kpiLatency) kpiLatency.innerHTML = `${stats.avgFirstKeyLatency || 0} <span class="kpi-unit">ms</span>`;
    if (kpiConsistency) kpiConsistency.textContent = `${stats.consistency || 80}%`;

    // 3. New record & Anomaly flags
    const warn = $("#anomalyLine");
    if (warn) {
      warn.classList.toggle("hidden", !stats.isAnomalous);
      if (stats.isAnomalous) warn.textContent = "⚠️ 計時異常（完成時間過短，疑似貼上或瞬間輸入），速度未計入最佳紀錄。";
    }
    $("#newRecordLine").classList.toggle("hidden", !stats.isRecord);

    // 4. Render Bottlenecks
    const bottleneckList = $("#bottleneckList");
    const retryBottlenecksBtn = $("#retryBottlenecksBtn");
    if (bottleneckList) {
      bottleneckList.innerHTML = "";
      const bottlenecks = stats.bottlenecks || [];
      if (!bottlenecks.length) {
        bottleneckList.innerHTML = `<div class="bottlenecks-empty">本次練習節奏流暢，未偵測到明顯卡鍵字！ 🎉</div>`;
        if (retryBottlenecksBtn) retryBottlenecksBtn.classList.add("hidden");
      } else {
        if (retryBottlenecksBtn) retryBottlenecksBtn.classList.remove("hidden");
        bottlenecks.forEach((b) => {
          const card = document.createElement("div");
          card.className = "bottleneck-card";
          card.innerHTML = `
            <div class="bottleneck-char">${escapeHtml(b.char)}</div>
            <div class="bottleneck-info">
              <div class="bottleneck-duration">${b.netDuration != null ? b.netDuration : b.duration} ms</div>
              <div class="bottleneck-decomp">${escapeHtml(b.decomp || "—")}</div>
            </div>
          `;
          bottleneckList.appendChild(card);
        });
      }
    }

    // 5. Draw Telemetry Chart
    renderResultChart(stats.charLogs || []);

    if (resultChangeCustomBtn) {
      resultChangeCustomBtn.classList.toggle("hidden", !state || state.modeKey !== "custom_text");
    }
    resultOverlay.classList.remove("hidden");
  }

  function startBottlenecksPractice() {
    if (!lastResultTelemetry || !lastResultTelemetry.bottlenecks || !lastResultTelemetry.bottlenecks.length) return;
    const chars = lastResultTelemetry.bottlenecks.map((b) => b.char);
    // Generate a 20-character muscle-memory targeted drill
    let drill = "";
    while (drill.length < 20) {
      for (const ch of chars) {
        if (drill.length >= 20) break;
        drill += ch;
      }
    }
    resultOverlay.classList.add("hidden");
    startCustomTextDirectly(drill, "卡鍵專項重練");
  }

  function startCustomTextDirectly(text, title) {
    if (!text || !text.trim()) return;
    const item = {
      id: "bottlenecks_" + Date.now(),
      text: text.trim(),
      title: title || "專項練習"
    };
    DATA["custom_text"] = { texts: [item] };
    state.modeKey = "custom_text";
    state.item = item;
    state.sessionCompleted = 0;
    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    state.roundCharLogs = [];
    showPractice();
    setHintDefault();
    focusCurrent();
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
    const hudProgEl = $("#hudProg");
    if (hudProgEl) hudProgEl.textContent = typedProg + "%";
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
    function setStatsMsg(text, type) {
      if (!statsMsg) return;
      if (!text) {
        statsMsg.textContent = "";
        statsMsg.className = "stats-msg hidden";
        return;
      }
      statsMsg.textContent = text;
      statsMsg.className = `stats-msg is-${type || "success"}`;
    }

    function openStatsModal() {
      if (!statsOverlay) return;
      setStatsMsg("");
      renderStatsModal();
      statsOverlay.classList.remove("hidden");
    }

    function closeStatsModal() {
      if (!statsOverlay) return;
      statsOverlay.classList.add("hidden");
      setStatsMsg("");
      // Restore focus to active typing input if currently in practice view
      if (practiceView && !practiceView.classList.contains("hidden")) {
        focusCurrent();
      }
    }

    function exportStats() {
      try {
        const best = loadBest();
        const hist = loadHist();
        const data = {
          app: "JustType",
          version: 1,
          exportedAt: new Date().toISOString(),
          best,
          history: hist
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `justtype-stats-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatsMsg("成績匯出成功！已下載 JSON 檔案。", "success");
      } catch (err) {
        setStatsMsg("匯出失敗：" + (err && err.message ? err.message : String(err)), "error");
      }
    }

    function importStatsJSON(jsonStr) {
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        setStatsMsg("匯入失敗：檔案不是有效的 JSON 格式", "error");
        return;
      }

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setStatsMsg("匯入失敗：JSON 結構不正確（應為包含 best 或 history 的物件）", "error");
        return;
      }

      const importedBest = parsed.best || {};
      const importedHist = parsed.history || parsed.hist || [];

      if (!Array.isArray(importedHist) && typeof importedBest !== "object") {
        setStatsMsg("匯入失敗：未找到有效的成績紀錄或最佳紀錄", "error");
        return;
      }

      // 1. Sanitize & Merge best records
      const currentBest = loadBest();
      let bestUpdatedCount = 0;
      if (importedBest && typeof importedBest === "object" && !Array.isArray(importedBest)) {
        for (const [mode, val] of Object.entries(importedBest)) {
          if (val && typeof val === "object" && typeof val.wpm === "number") {
            const wpm = Math.round(val.wpm);
            if (wpm > 0 && wpm <= 450) {
              const acc = Number.isFinite(val.acc) ? Math.min(100, Math.max(0, Number(val.acc))) : 100;
              const sec = Number.isFinite(val.sec) ? Math.max(0, Math.round(val.sec)) : 0;
              const existing = currentBest[mode];
              // Update if no previous record or imported has higher WPM
              if (!existing || wpm > existing.wpm) {
                currentBest[mode] = { wpm, acc, sec };
                bestUpdatedCount++;
              }
            }
          }
        }
        saveJSON(LS_BEST, currentBest);
      }

      // 2. Sanitize & Merge history records
      const currentHist = loadHist();
      let histAddedCount = 0;
      if (Array.isArray(importedHist)) {
        importedHist.forEach((item) => {
          if (!item || typeof item !== "object") return;
          const wpm = Math.round(item.wpm || 0);
          if (wpm <= 0 || wpm > 450) return;
          const acc = Number.isFinite(item.acc) ? Math.min(100, Math.max(0, Number(item.acc))) : 100;
          const sec = Number.isFinite(item.sec) ? Math.max(0, Math.round(item.sec)) : 0;
          const mode = typeof item.mode === "string" ? item.mode : "words";
          const time = Number.isFinite(item.time) ? item.time : Date.now();
          const typed = typeof item.typed === "number" ? item.typed : undefined;
          const correct = typeof item.correct === "number" ? item.correct : undefined;
          const id = item.id;

          // Check duplicate against existing records (same mode, time, wpm)
          const isDuplicate = currentHist.some((h) =>
            h.mode === mode && Math.abs(h.time - time) < 1000 && h.wpm === wpm
          );
          if (!isDuplicate) {
            currentHist.push({ mode, wpm, acc, sec, time, typed, correct, id });
            histAddedCount++;
          }
        });

        // Sort descending by time and keep top 50
        currentHist.sort((a, b) => (b.time || 0) - (a.time || 0));
        saveJSON(LS_HIST, currentHist.slice(0, 50));
      }

      renderHome();
      renderStatsModal();
      setStatsMsg(`匯入成功！更新了 ${bestUpdatedCount} 項最佳成績，新增了 ${histAddedCount} 筆練習紀錄。`, "success");
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
      let sumTyped = 0;
      let sumCorrect = 0;
      hist.forEach((h) => {
        totalWpm += (h.wpm || 0);
        totalAcc += (h.acc || 0);
        if (typeof h.typed === "number" && typeof h.correct === "number") {
          sumTyped += h.typed;
          sumCorrect += h.correct;
        }
      });
      const avgWpm = totalRounds > 0 ? Math.round(totalWpm / totalRounds) : 0;
      // Use weighted accuracy if typed/correct stats exist; fallback to simple average
      const avgAcc = sumTyped > 0
        ? ((sumCorrect / sumTyped) * 100).toFixed(1)
        : (totalRounds > 0 ? (totalAcc / totalRounds).toFixed(1) : "100");

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
            const mTitle = m ? m.title : (LEGACY_MODE_TITLES[h.mode] || h.mode);
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
    if (exportStatsBtn) exportStatsBtn.addEventListener("click", exportStats);
    if (importStatsBtn) {
      importStatsBtn.addEventListener("click", () => {
        if (statsFileInput) {
          statsFileInput.value = "";
          statsFileInput.click();
        }
      });
    }
    if (statsFileInput) {
      statsFileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          importStatsJSON(evt.target.result);
        };
        reader.onerror = () => {
          setStatsMsg("讀取檔案失敗，請再試一次", "error");
        };
        reader.readAsText(file, "utf-8");
      });
    }
    if (statsOverlay) {
      statsOverlay.addEventListener("click", (e) => {
        if (e.target === statsOverlay) closeStatsModal();
      });
    }

    openCustomTextModal = function() {
      if (!customTextOverlay) return;
      const raw = getCustomTextRaw();
      if (customTextInput) {
        customTextInput.value = raw;
        customTextInput.classList.remove("is-invalid");
      }
      updateCustomMeta();
      hideCustomError();
      customTextOverlay.classList.remove("hidden");
      if (customTextInput) {
        setTimeout(() => customTextInput.focus(), 50);
      }
    }

    closeCustomTextModal = function() {
      if (!customTextOverlay) return;
      customTextOverlay.classList.add("hidden");
      hideCustomError();
      if (practiceView && !practiceView.classList.contains("hidden")) {
        focusCurrent();
      }
    }

    function hideCustomError() {
      if (customErrorMsg) {
        customErrorMsg.classList.add("hidden");
        customErrorMsg.textContent = "";
      }
      if (customTextInput) customTextInput.classList.remove("is-invalid");
    }

    function showCustomError(msg) {
      if (customErrorMsg) {
        customErrorMsg.classList.remove("hidden");
        customErrorMsg.textContent = msg;
      }
      if (customTextInput) {
        customTextInput.classList.add("is-invalid");
        customTextInput.focus();
      }
    }

    function updateCustomMeta() {
      if (!customTextInput || !customCharCount) return;
      const val = customTextInput.value || "";
      const len = Array.from(val.replace(/\s/g, "")).length;
      customCharCount.textContent = `${len} 字`;
    }

    function validateCustomInput(rawText) {
      if (!rawText || !rawText.trim()) {
        return { valid: false, error: "內容不能為空，請貼上文字" };
      }
      const trimmed = rawText.trim();
      let content = trimmed;

      if (isCustomJsonMode || trimmed.startsWith("{")) {
        try {
          const data = JSON.parse(trimmed);
          if (!data || typeof data !== "object") {
            return { valid: false, error: "JSON 格式錯誤：必須是包含 content 屬性的物件" };
          }
          if (!data.content || typeof data.content !== "string" || !data.content.trim()) {
            return { valid: false, error: "缺少必要內容：content 欄位必須有文字" };
          }
          content = data.content.trim();
        } catch {
          return { valid: false, error: "JSON 格式錯誤（括號、引號未閉合或語法錯誤）" };
        }
      }

      const charCount = Array.from(content.replace(/\s/g, "")).length;
      if (charCount < 5) {
        return { valid: false, error: "內容太短，請至少輸入 5 個字" };
      }
      if (Array.from(content).length > 5000) {
        return { valid: false, error: "文本過長，請限制在 5,000 字以內" };
      }

      return { valid: true, content };
    }

    function handleStartCustom() {
      if (!customTextInput) return;
      const raw = customTextInput.value;
      const res = validateCustomInput(raw);
      if (!res.valid) {
        showCustomError(res.error);
        return;
      }
      localStorage.setItem(LS_CUSTOM_TEXT, raw.trim());
      ensureCustomData();
      renderHome();
      closeCustomTextModal();
      startRound("custom_text");
    }

    if (closeCustomTextBtn) closeCustomTextBtn.addEventListener("click", closeCustomTextModal);
    if (cancelCustomBtn) cancelCustomBtn.addEventListener("click", closeCustomTextModal);
    if (startCustomBtn) startCustomBtn.addEventListener("click", handleStartCustom);
    if (customTextInput) {
      customTextInput.addEventListener("input", () => {
        updateCustomMeta();
        hideCustomError();
      });
    }
    if (toggleJsonModeBtn) {
      toggleJsonModeBtn.addEventListener("click", () => {
        isCustomJsonMode = !isCustomJsonMode;
        if (isCustomJsonMode) {
          toggleJsonModeBtn.textContent = "返回純文字模式";
          if (customModalSub) customModalSub.textContent = "以 JSON 格式貼上（例：{\"title\": \"文章標題\", \"content\": \"文章內文...\"}）：";
          if (customTextInput && !customTextInput.value.trim().startsWith("{")) {
            const currentVal = customTextInput.value.trim();
            customTextInput.value = JSON.stringify({ title: "自訂文章", content: currentVal || "請在此輸入內文..." }, null, 2);
          }
        } else {
          toggleJsonModeBtn.textContent = "進階：切換 JSON 格式";
          if (customModalSub) customModalSub.textContent = "直接貼上你想練習的文章、法條或文稿（5 ~ 5,000 字）：";
          if (customTextInput && customTextInput.value.trim().startsWith("{")) {
            try {
              const obj = JSON.parse(customTextInput.value.trim());
              if (obj && obj.content) customTextInput.value = obj.content;
            } catch {}
          }
        }
        updateCustomMeta();
        hideCustomError();
      });
    }

    if (customTextOverlay) {
      customTextOverlay.addEventListener("click", (e) => {
        if (e.target === customTextOverlay) closeCustomTextModal();
      });
    }

    if (changeCustomTextBtn) {
      changeCustomTextBtn.addEventListener("click", () => {
        resetEscConfirm();
        openCustomTextModal();
      });
    }
    if (resultChangeCustomBtn) {
      resultChangeCustomBtn.addEventListener("click", () => {
        resultOverlay.classList.add("hidden");
        openCustomTextModal();
      });
    }

    // Boshiamy Import Modal Logic
    openBoshiamyModal = function() {
      if (!boshiamyImportOverlay) return;
      hideBoshiamyStatus();
      if (boshiamyFileInput) boshiamyFileInput.value = "";
      boshiamyImportOverlay.classList.remove("hidden");
      if (boshiamyDropzone) setTimeout(() => boshiamyDropzone.focus(), 50);
    };

    closeBoshiamyModal = function() {
      if (!boshiamyImportOverlay) return;
      boshiamyImportOverlay.classList.add("hidden");
      hideBoshiamyStatus();
      if (practiceView && !practiceView.classList.contains("hidden")) {
        focusCurrent();
      }
    };

    function showBoshiamyStatus(msg, isError) {
      if (!boshiamyStatusMsg) return;
      boshiamyStatusMsg.textContent = msg;
      boshiamyStatusMsg.className = "boshiamy-status " + (isError ? "error" : "success");
      boshiamyStatusMsg.classList.remove("hidden");
    }

    function hideBoshiamyStatus() {
      if (!boshiamyStatusMsg) return;
      boshiamyStatusMsg.textContent = "";
      boshiamyStatusMsg.className = "boshiamy-status hidden";
    }

    async function handleBoshiamyFile(file) {
      if (!file) return;
      showBoshiamyStatus("解析碼表中，請稍候...", false);
      try {
        const text = await file.text();
        const table = parseCinTable(text);
        if (!table || Object.keys(table).length === 0) {
          showBoshiamyStatus("解析失敗：找不到有效的碼表資料，請確認檔案格式是否為 .cin 或包含字元編碼配對", true);
          return;
        }
        await saveBoshiamyToIDB(table);
        BOSHIAMY = table;
        showBoshiamyStatus(`成功解析 ${Object.keys(table).length} 字！正在開啟練習...`, false);
        setTimeout(() => {
          closeBoshiamyModal();
          // 若在首頁，自動進入練習頁面（預設第一項「單字」或當前選定關卡）
          if (homeView && !homeView.classList.contains("hidden")) {
            const modeKey = (carousel && MODES[carousel.selected]) ? MODES[carousel.selected].key : "words";
            startRound(modeKey);
          } else {
            // 已在練習頁：即時更新拆字、鍵盤與輸入框
            renderPractice();
            paint();
            focusCurrent();
          }
        }, 350);
      } catch (err) {
        showBoshiamyStatus(`讀取檔案錯誤：${err.message}`, true);
      }
    }

    if (closeBoshiamyModalBtn) closeBoshiamyModalBtn.addEventListener("click", closeBoshiamyModal);
    if (cancelBoshiamyBtn) cancelBoshiamyBtn.addEventListener("click", closeBoshiamyModal);
    if (boshiamyImportOverlay) {
      boshiamyImportOverlay.addEventListener("click", (e) => {
        if (e.target === boshiamyImportOverlay) closeBoshiamyModal();
      });
    }

    if (selectBoshiamyFileBtn && boshiamyFileInput) {
      selectBoshiamyFileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        boshiamyFileInput.click();
      });
    }
    if (boshiamyDropzone && boshiamyFileInput) {
      boshiamyDropzone.addEventListener("click", () => {
        boshiamyFileInput.click();
      });
      boshiamyDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        boshiamyDropzone.classList.add("dragover");
      });
      boshiamyDropzone.addEventListener("dragleave", () => {
        boshiamyDropzone.classList.remove("dragover");
      });
      boshiamyDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        boshiamyDropzone.classList.remove("dragover");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleBoshiamyFile(e.dataTransfer.files[0]);
        }
      });
    }
    if (boshiamyFileInput) {
      boshiamyFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleBoshiamyFile(e.target.files[0]);
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      // 若尚未載入嘸蝦米碼表且輸入框被停用，手快敲鍵盤時自動呼叫上傳彈窗（防呆體驗）
      if (
        getCurrentLayout() === "boshiamy" &&
        !BOSHIAMY &&
        practiceView &&
        !practiceView.classList.contains("hidden") &&
        (!boshiamyImportOverlay || boshiamyImportOverlay.classList.contains("hidden"))
      ) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key && e.key.length === 1) {
          e.preventDefault();
          if (typeof openBoshiamyModal === "function") {
            openBoshiamyModal();
            return;
          }
        }
      }

      if (e.key !== "Escape") return;

      // 1. 組字中防呆：若正在 IME 組字中，Esc 僅作為輸入法取消組字，不觸發任何退出或關閉動作
      if (e.isComposing || (state && state.composing) || e.keyCode === 229) {
        return;
      }

      // 2. 嘸蝦米匯入彈窗開啟時，Esc 優先關閉該彈窗
      if (boshiamyImportOverlay && !boshiamyImportOverlay.classList.contains("hidden")) {
        closeBoshiamyModal();
        return;
      }

      // 1. 組字中防呆：若正在 IME 組字中，Esc 僅作為輸入法取消組字，不觸發任何退出或關閉動作
      if (e.isComposing || (state && state.composing) || e.keyCode === 229) {
        return;
      }

      // 2. 自訂文本彈窗開啟時，Esc 優先關閉該彈窗
      if (customTextOverlay && !customTextOverlay.classList.contains("hidden")) {
        closeCustomTextModal();
        return;
      }

      // 3. 成績統計彈窗開啟時，Esc 優先關閉該彈窗
      if (statsOverlay && !statsOverlay.classList.contains("hidden")) {
        closeStatsModal();
        return;
      }

      // 4. 結算彈窗開啟時，Esc 關閉彈窗並回首頁
      if (resultOverlay && !resultOverlay.classList.contains("hidden")) {
        showHome();
        return;
      }

      // 5. 練習畫面中，實作兩段式 Esc 退出（2 秒內再按一次才觸發，2 秒後無動作自動恢復）
      if (practiceView && !practiceView.classList.contains("hidden")) {
        if (escConfirmActive) {
          // 2 秒內再次按下，觸發回首頁
          resetEscConfirm();
          showHome();
        } else {
          // 第一次按下：顯示提示，並啟動 2 秒計時器
          escConfirmActive = true;
          if (backHomeBtn) {
            backHomeBtn.textContent = "再按一次退出…";
          }
          hint("按 Esc 再確認一次以退出回首頁");
          if (escConfirmTimer) clearTimeout(escConfirmTimer);
          escConfirmTimer = setTimeout(() => {
            resetEscConfirm();
            setHintDefault();
          }, 2000);
        }
      }
    });

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
    $("#backHomeBtn").addEventListener("click", () => {
      resetEscConfirm();
      showHome();
    });
    $("#restartBtn").addEventListener("click", () => {
      resetEscConfirm();
      startRound(state.modeKey);
    });
    $("#againBtn").addEventListener("click", () => {
      resetEscConfirm();
      resultOverlay.classList.add("hidden");
      startRound(state.modeKey);
    });
    const retryBottlenecksBtn = $("#retryBottlenecksBtn");
    if (retryBottlenecksBtn) {
      retryBottlenecksBtn.addEventListener("click", () => {
        resetEscConfirm();
        startBottlenecksPractice();
      });
    }

    const tabMacro = $("#tabMacro");
    const tabLatency = $("#tabLatency");
    if (tabMacro && tabLatency) {
      tabMacro.addEventListener("click", () => {
        currentChartTab = "macro";
        tabMacro.classList.add("active");
        tabMacro.setAttribute("aria-selected", "true");
        tabLatency.classList.remove("active");
        tabLatency.setAttribute("aria-selected", "false");
        const legendCum = $("#legendCumWpm");
        const legendInst = $("#legendInstWpm");
        if (legendCum) legendCum.style.display = "inline-flex";
        if (legendInst) legendInst.style.display = "inline-flex";
        if (lastResultTelemetry) renderResultChart(lastResultTelemetry.charLogs);
      });
      tabLatency.addEventListener("click", () => {
        currentChartTab = "latency";
        tabLatency.classList.add("active");
        tabLatency.setAttribute("aria-selected", "true");
        tabMacro.classList.remove("active");
        tabMacro.setAttribute("aria-selected", "false");
        const legendCum = $("#legendCumWpm");
        const legendInst = $("#legendInstWpm");
        if (legendCum) legendCum.style.display = "none";
        if (legendInst) legendInst.style.display = "none";
        if (lastResultTelemetry) renderResultChart(lastResultTelemetry.charLogs);
      });
    }

    setupChartInteractions();

    window.addEventListener("resize", () => {
      if (!resultOverlay.classList.contains("hidden") && lastResultTelemetry) {
        renderResultChart(lastResultTelemetry.charLogs);
      }
    });

    // Keyboard shortcuts inside Result Overlay
    window.addEventListener("keydown", (e) => {
      if (resultOverlay.classList.contains("hidden")) return;
      if (e.isComposing || (state && state.composing) || e.keyCode === 229) return;

      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        startBottlenecksPractice();
      } else if (e.key === "Enter") {
        e.preventDefault();
        resultOverlay.classList.add("hidden");
        startRound(state.modeKey);
      } else if (e.key === "Escape") {
        e.preventDefault();
        resultOverlay.classList.add("hidden");
        showHome();
      }
    });
    $("#homeBtn").addEventListener("click", showHome);
    $("#targetBox").addEventListener("click", focusCurrent);
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
      const pref = loadJSON(LS_ONKB, {}) || {};
      const savedLayout = pref.layout;
      // 舊值 qwerty（英數）已移除，自動對應到嘸蝦米（英文字母鍵位），並寫回。預設為注音。
      const migrated = savedLayout === "qwerty" ? "boshiamy" : savedLayout;
      const currentInitialLayout = migrated || "bopomofo";
      if (layoutSelect) {
        layoutSelect.value = currentInitialLayout;
      }
      if (savedLayout === "qwerty") {
        pref.layout = "boshiamy";
        saveJSON(LS_ONKB, pref);
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
        onLayoutChanged(e.target.value);
      });
    }
  }

  function onLayoutChanged(val) {
    const pref = loadJSON(LS_ONKB, {});
    pref.layout = val;
    saveJSON(LS_ONKB, pref);
    syncLayoutSelectors(val);
    if (onKeyboard) onKeyboard.dataset.layout = "";
    renderOnKeyboard();
    const mIdx = methodIndex(val);
    if (mIdx !== -1 && decompWheel) {
      let diff = mIdx - (((decompWheel.pos % 3) + 3) % 3);
      diff = ((diff + 1.5) % 3 + 3) % 3 - 1.5;
      setDecompWheelTarget(Math.round(decompWheel.pos + diff));
    }
    if (state && !state.finished) {
      renderPractice();
      paint();
      focusCurrent();
    }
  }

  function syncLayoutSelectors(layout) {
    if (layoutSelect && layoutSelect.value !== layout) {
      layoutSelect.value = layout;
    }
  }

  window.showResultModal = showResultModal;

  // Register Service Worker for PWA support
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        // Silently catch registration errors in environments where SW might be restricted
        console.warn("ServiceWorker registration failed:", err);
      });
    });
  }

  init().catch((e) => {
    document.body.insertAdjacentHTML("afterbegin",
      `<div style="padding:12px 18px;background:#fee2e2;color:#7f1d1d">data/data.json 讀取失敗：${e.message}。請用 serve.py 開（直接開 index.html 的 fetch 可能被擋）。</div>`);
  });
})();
