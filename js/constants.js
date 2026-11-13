// js/constants.js — 基礎常數、鍵盤版面數據與共用工具

// LocalStorage 鍵名常數
export const LS_BEST = "tp-lite-best-v1";
export const LS_HIST = "tp-lite-history-v1";
export const LS_LAST = "tp-lite-last-v1";
export const LS_THEME = "tp-lite-theme";
export const LS_FONT = "tp-lite-font-size";
export const LS_ENDLESS = "tp-lite-endless-v1";
export const LS_ONKB = "tp-lite-onkb-show-v1";
export const LS_LAYOUT = "tp-lite-onkb-layout-v1";
export const LS_DECOMP = "tp-lite-decomp-method-v1";
export const LS_CUSTOM_TEXT = "tp-lite-custom-text-v1";
export const LS_SETTLE_COUNT = "tp-lite-settle-counts-v1"; // 各模式結算目標題數

// Standard ANSI Physical Keyboard Layout (5 rows, exact 15.0u width per row).
// Matches real physical keyboards in Taiwan (Bopomofo + QWERTY).
export const ANSI_KEYBOARD_ROWS = [
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
export const BOPOMOFO_TO_KEY = {
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

// Physical code -> key char (for tracking typed keys during IME composition)
export const CODE_TO_KEY = {};
ANSI_KEYBOARD_ROWS.forEach((row) => row.forEach((item) => {
  if (item.key) CODE_TO_KEY[item.id] = item.key;
}));

// Cangjie (倉頡) code letter -> radical （字根）
export const CANGJIE_RADICAL = {
  a: "日", b: "月", c: "金", d: "木", e: "水", f: "火", g: "土",
  h: "竹", i: "戈", j: "十", k: "大", l: "中", m: "一", n: "弓",
  o: "人", p: "心", q: "手", r: "口", s: "尸", t: "廿", u: "山",
  v: "女", w: "田", x: "難", y: "卜", z: "重",
};
// 反查：字根 -> 倉頡碼字母
export const CANGJIE_RADICAL_TO_KEY = {};
Object.keys(CANGJIE_RADICAL).forEach((k) => { CANGJIE_RADICAL_TO_KEY[CANGJIE_RADICAL[k]] = k; });

// Punctuation physical key mapping for Taiwanese keyboard IME
export const PUNCT_KEY_MAP = {
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

export const ROUND_TARGET = { words: 10, sentences: 5 };

export const MODES = [
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

export const LEGACY_MODE_TITLES = {
  legal_texts: "法律條文（舊）",
  official_docs: "正式公文（舊）",
};

export const ANIMATION_PHASE = {
  IDLE: "idle",
  OPPONENT_ENTERING: "opponent_entering",
  USER_TYPING: "user_typing",
  USER_SENT: "user_sent",
  PAUSE_BRIEF: "pause_brief",
  COMPLETED: "completed",
};

export const ME = "我";

// 標點寬容比對：半形轉換為全形
export const PUNCT_MAP = { ",": "，", ".": "。", "!": "！", "?": "？", ";": "；", ":": "：" };
export function norm(ch) { return PUNCT_MAP[ch] || ch; }

// HTML 安全轉義（防禦 XSS）
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 格式化秒數為 mm:ss
export function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
