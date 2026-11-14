// app.js — JustType 繁體中文打字練習核心主程式
// 模組化重構：各專門功能已拆分至 js/ 目錄（constants, storage, queue, cin-parser, bottlenecks, chart, keyboard, decomp-wheel, chat-mode, carousel）

import {
  LS_BEST, LS_HIST, LS_LAST, LS_THEME, LS_FONT, LS_ENDLESS, LS_ONKB, LS_LAYOUT, LS_DECOMP,
  LS_CUSTOM_TEXT, LS_SETTLE_COUNT, ANSI_KEYBOARD_ROWS, BOPOMOFO_TO_KEY, CODE_TO_KEY,
  CANGJIE_RADICAL, CANGJIE_RADICAL_TO_KEY, PUNCT_KEY_MAP, PUNCT_MAP, ROUND_TARGET, MODES,
  LEGACY_MODE_TITLES, ANIMATION_PHASE, ME, norm, escapeHtml, fmtTime
} from "./js/constants.js";

import {
  loadJSON, saveJSON, loadBest, loadHist, openIndexedDB, loadTableFromIDB, saveTableToIDB,
  fetchOrLoadCached, loadBoshiamyFromIDB, saveBoshiamyToIDB,
  IDB_KEY_BOSHIAMY, IDB_KEY_ZHUYIN, IDB_KEY_CANGJIE
} from "./js/storage.js";

import { parseCinTable } from "./js/cin-parser.js";
import { analyzeBottlenecks, generateBottleneckDrill } from "./js/bottlenecks.js";
import {
  renderResultChart, setupChartInteractions, setLastResultTelemetry, getLastResultTelemetry
} from "./js/chart.js";

import {
  buildOnKeyboard, flashKeyElement, clearKeyError, findOnKbKey, setExpectedKey,
  getCurrentExpectedKey, clearCurrentExpectedKey
} from "./js/keyboard.js";

import {
  DECOMP_METHODS, DECOMP_RING_STEP, DECOMP_RING_RADIUS, lookupCangjieForChar,
  radicalsForCode, suchengCodeForChar, decompositionFor, decompositionCardHTML, methodLabel, methodIndex,
  getDecompWheel, clearDecompWheel, setDecompWheelTarget, buildDecompWheel,
  updateDecompWheelCardText, setDecompWheelChar, bindDecompWheelEvents
} from "./js/decomp-wheel.js";

import { parseChatMessages, buildChatState } from "./js/chat-mode.js";

// ---- DOM 選擇器與快取節點 ----
const $ = (s) => document.querySelector(s);
const homeView = $("#homeView");
const practiceView = $("#practiceView");
const modeGrid = $("#modeGrid");
const resultOverlay = $("#resultOverlay");
const endlessCheck = $("#endlessCheck");
const endlessLabel = $("#endlessLabel");
const settleCountInput = $("#settleCountInput");
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
let resultTimeoutId = null;

let DATA = null;
let ZHUYIN = null;
let CANGJIE = null;
let BOSHIAMY = null;
let decompMethod = "cangjie";
let state = null;
let carousel = null;
let currentBottleneckDrillText = "";

// ---- 抽題隊列（Queue 演算法相容區）----
const QUEUE = {};

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

// ---- 打字速度與統計計算核心 ----
function effectiveStats(totalTyped, totalCorrect, rawSec, totalKeys) {
  const floorSec = Math.max(1.0, totalCorrect * 0.20);
  const effSec = Math.max(rawSec || 0, floorSec);
  const anomalous = (rawSec || 0) < floorSec * 0.6 && totalCorrect >= 5;
  // WPM: 實際打了多少字，除以秒數換算為每分鐘（即 (字數 / 秒數) * 60，不套用 / 5 死公式）
  const wpm = effSec > 0 ? Math.round(totalCorrect / (effSec / 60)) : 0;
  // CPM: 實際按了多少鍵，換算為每分鐘（即 (按鍵數 / 秒數) * 60）
  const keys = Math.max(totalKeys != null ? totalKeys : 0, totalTyped || 0);
  const cpm = effSec > 0 ? Math.round(keys / (effSec / 60)) : 0;
  const acc = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 1000) / 10 : 100;
  return { sec: effSec, rawSec: rawSec || 0, wpm, cpm, acc, anomalous, totalTyped, totalCorrect, totalKeys: keys };
}

// ---- 生活情境題（LINE）回合排程 ----
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

function lifeUserSent() {
  state.chatVisible++;
  state.turnCycles++;
  if (state.lineIdx + 1 < state.lines.length) state.lineIdx++;
  else state.lineIdx = state.lines.length;
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

// ---- 主題與偏好管理 ----
function getSavedTheme() {
  return localStorage.getItem(LS_THEME) || "system";
}

function applyTheme(theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  const icon = $("#themeIcon");
  const text = $("#themeText");
  if (icon && text) {
    icon.textContent = isDark ? "🌙" : "☀️";
    text.textContent = isDark ? "深色" : "淺色";
  }
  const metaTheme = $('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", isDark ? "#0f172a" : "#2563eb");
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = cur === "dark" ? "light" : "dark";
  saveJSON(LS_THEME, next);
  applyTheme(next);
}

function applyFontSize(size) {
  const sizes = { sm: "19px", md: "22px", lg: "26px" };
  document.documentElement.style.setProperty("--font-size", sizes[size] || sizes.md);
  const sel = $("#fontSizeSelect");
  if (sel) sel.value = size;
}

function isShortMode(modeKey) {
  return modeKey === "words" || modeKey === "sentences";
}

function getModeSettleTarget(modeKey) {
  const defaults = { words: 10, sentences: 5 };
  const defaultVal = defaults[modeKey] !== undefined ? defaults[modeKey] : 1;
  const custom = loadJSON(LS_SETTLE_COUNT, {});
  if (custom && typeof custom[modeKey] === "number" && custom[modeKey] >= 1) {
    return custom[modeKey];
  }
  return defaultVal;
}

function setModeSettleTarget(modeKey, val) {
  const num = Math.max(1, Math.min(999, Math.round(Number(val) || 1)));
  const custom = loadJSON(LS_SETTLE_COUNT, {});
  custom[modeKey] = num;
  saveJSON(LS_SETTLE_COUNT, custom);
}

function isEndlessEnabled(modeKey) {
  const pref = loadJSON(LS_ENDLESS, {});
  return pref && pref[modeKey] === true;
}

function setEndlessEnabled(modeKey, val) {
  const pref = loadJSON(LS_ENDLESS, {});
  pref[modeKey] = !!val;
  saveJSON(LS_ENDLESS, pref);
}

function isEndlessApplicable(modeKey) {
  return true;
}

function getCurrentLayout() {
  let val = (onKeyboard && onKeyboard.dataset.layout) ||
            (layoutSelect ? layoutSelect.value : "") ||
            ((loadJSON(LS_ONKB, {}) || {}).layout) ||
            "bopomofo";
  if (val === "qwerty") val = "boshiamy";
  return val;
}

function isOnKeyboardEnabled() {
  return onKeyboardCheck ? onKeyboardCheck.checked : false;
}

// ---- 自訂文本處理 ----
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
  const raw = getCustomTextRaw();
  const parsed = parseCustomText(raw);
  if (parsed && parsed.content) {
    DATA.custom_text = {
      label: parsed.title,
      texts: [{ id: "custom-1", title: parsed.title, text: parsed.content }]
    };
  } else {
    DATA.custom_text = {
      label: "自訂文本",
      texts: []
    };
  }
}

// ---- 首頁 3D 卡片輪播 ----
function renderHome() {
  ensureCustomData();
  const best = loadBest();
  modeGrid.innerHTML = "";
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

  const startIndex = 0;
  carousel = {
    cards,
    pos: startIndex,
    target: startIndex,
    selected: startIndex,
    dragging: false,
    dragStartX: 0,
    dragStartPos: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
    raf: null,
    wheelLockedUntil: 0,
  };
  bindCarousel();
  paintCarousel();
  if (MODES[carousel.selected]) {
    document.body.dataset.mode = MODES[carousel.selected].key;
  }
  queueCarouselFrame();
}

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
    const rot = Math.max(-60, Math.min(60, -off * 42));
    const z = -Math.min(ao * 180, 400);
    const scale = Math.max(0.6, 1 - 0.19 * ao);
    const opacity = Math.max(0.12, 1 - 0.34 * ao);
    card.style.transform =
      `translate(-50%,-50%) translateX(${(off * spacing).toFixed(1)}px) ` +
      `translateZ(${z.toFixed(1)}px) rotateY(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity = opacity.toFixed(2);
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
    const card = cards[sel];
    if (card) {
      card.classList.remove("just-centered");
      void card.offsetWidth;
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
    return;
  }
  if (idx === carousel.selected) {
    const modeKey = MODES[idx].key;
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
      const projected = carousel.pos + carousel.velocity * 0.18;
      setCarouselTarget(Math.round(projected));
      queueCarouselFrame();
    }
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  carouselViewport.addEventListener("wheel", (e) => {
    if (!carousel) return;
    const now = performance.now();
    if (now < carousel.wheelLockedUntil) return;
    const delta = e.deltaY + e.deltaX;
    if (Math.abs(delta) < 4) return;
    carousel.wheelLockedUntil = now + 400;
    if (delta > 0) setCarouselTarget(carousel.selected + 1);
    else setCarouselTarget(carousel.selected - 1);
  }, { passive: true });

  if (carouselPrev) carouselPrev.addEventListener("click", () =>
    setCarouselTarget(carousel.selected - 1));
  if (carouselNext) carouselNext.addEventListener("click", () =>
    setCarouselTarget(carousel.selected + 1));
}

// ---- 打字狀態與題目流程 ----
function showHome() {
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
  if (state) {
    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundTotalKeys = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    state.roundCharLogs = [];
  }
  resultOverlay.classList.add("hidden");
  practiceView.classList.add("hidden");
  homeView.classList.remove("hidden");
  stopTimer();
  renderHome();
}

function showPractice() {
  homeView.classList.add("hidden");
  resultOverlay.classList.add("hidden");
  practiceView.classList.remove("hidden");
  if (changeCustomTextBtn) {
    changeCustomTextBtn.classList.toggle("hidden", state.modeKey !== "custom_text");
  }
}

// 英文誤入保護：自動攔截並消除誤打英文字母，不作廢整題
function checkEnglishProtection(val) {
  if (!state || state.finished || state.composing) return false;
  if (state.modeKey === "mixed_zh_en") return false;
  const layout = getCurrentLayout();
  if (layout === "boshiamy") return false;

  const info = getCurrentPosInfo();
  const curTargetChar = info ? info.char : "";
  if (/[a-zA-Z]/.test(curTargetChar)) return false;

  const letters = (val || "").match(/[a-zA-Z]/g);
  if (letters && letters.length >= 2) {
    triggerEnglishProtection();
    return true;
  }
  return false;
}

function triggerEnglishProtection() {
  if (!state || state.finished) return;
  const inputEl = state.currentInputEl;
  if (inputEl) {
    const currentVal = inputEl.value || "";
    const cleaned = currentVal.replace(/[a-zA-Z]+/g, "");
    inputEl.value = cleaned;
    state.inputs[state.lineIdx] = cleaned;
    inputEl.classList.remove("input-shake");
    void inputEl.offsetWidth;
    inputEl.classList.add("input-shake");
    setTimeout(() => {
      if (inputEl) inputEl.classList.remove("input-shake");
    }, 500);
  }
  hint("⚠️ 偵測到英文輸入法，請切換至中文輸入法！（已為您自動消除誤打英文字母）");
}

function startRound(modeKey) {
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
  const mode = MODES.find((m) => m.key === modeKey);
  const isCustom = modeKey === "custom_text";
  const isBottlenecks = modeKey === "bottlenecks";
  let item;
  if (isCustom) {
    ensureCustomData();
    item = DATA.custom_text.texts[0];
  } else if (isBottlenecks) {
    item = {
      id: "bottlenecks-drill",
      title: "卡鍵專項重練",
      text: currentBottleneckDrillText || "卡鍵字練習"
    };
  } else {
    item = nextFromQueue(modeKey);
  }

  let lines;
  if (modeKey === "life_situations") {
    const chatSegs = parseChatMessages(item.text).map((s) => ({
      speaker: s.speaker,
      isMe: s.speaker === ME,
      text: Array.from(item.text).slice(s.contentStart, s.end).join(""),
    }));
    lines = chatSegs.filter((s) => s.isMe).map((s) => s.text);
  } else {
    lines = (item.text || item.content || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }
  if (!lines.length) lines = [""];

  const sameMode = state && state.modeKey === modeKey;
  const prevCount = sameMode ? (state.sessionCompleted || 0) : 0;
  const prevRoundTyped = sameMode && prevCount > 0 ? (state.roundTotalTyped || 0) : 0;
  const prevRoundCorrect = sameMode && prevCount > 0 ? (state.roundTotalCorrect || 0) : 0;
  const prevRoundKeys = sameMode && prevCount > 0 ? (state.roundTotalKeys || 0) : 0;
  const prevRoundElapsed = sameMode && prevCount > 0 ? (state.roundElapsed || 0) : 0;
  const prevRoundStartedAt = sameMode && prevCount > 0 ? (state.roundStartedAt || null) : null;
  const prevStages = sameMode && prevCount > 0 ? (state.roundStages || []) : [];
  state = {
    modeKey,
    item,
    lines,
    inputs: lines.map(() => ""),
    lineIdx: 0,
    startedAt: null,
    timerId: null,
    elapsed: 0,
    composing: false,
    composingText: "",
    composingRawText: "",
    composingKeys: [],
    composingKeysBase: 0,
    compositionStartAt: null,
    selectionStartAt: null,
    selectionInteractionDuration: 0,
    charStartTime: null,
    charFirstKeyTime: null,
    charBackspaces: 0,
    charLogs: [],
    roundCharLogs: sameMode && prevCount > 0 ? (state.roundCharLogs || []) : [],
    roundStages: prevStages,
    finished: false,
    totalTyped: 0,
    totalCorrect: 0,
    totalKeys: 0,
    sessionCompleted: prevCount,
    roundTotalTyped: prevRoundTyped,
    roundTotalCorrect: prevRoundCorrect,
    roundTotalKeys: prevRoundKeys,
    roundElapsed: prevRoundElapsed,
    roundStartedAt: prevRoundStartedAt,
    autoNextTimer: null,
    animTimer: null,
  };
  if (modeKey === "life_situations") {
    const cs = buildChatState(item);
    state.chatSegs = cs.chatSegs;
    state.chatVisible = cs.chatVisible;
    state.animationPhase = ANIMATION_PHASE.IDLE;
    state.turnCycles = 0;
  }

  document.body.dataset.mode = modeKey;
  let titleText = mode ? mode.title : (isBottlenecks ? "卡鍵專項" : modeKey);
  if (modeKey === "life_situations") {
    titleText = `${mode.title} · ${item.title || "LINE 對話"}`;
  } else if (isCustom && item.title) {
    titleText = `${mode.title} · ${item.title}`;
  } else if (isBottlenecks) {
    titleText = "卡鍵專項重練";
  }
  $("#practiceTitle").textContent = titleText;
  showPractice();
  renderPractice();
  paint();
  focusCurrent();
  setHintDefault();
  updateHud();
  if (modeKey === "life_situations") {
    lifeKick();
  }
}

function startCustomTextDirectly(content, title) {
  if (!content || !content.trim()) return;
  saveJSON(LS_CUSTOM_TEXT, {
    title: title || "自訂文章",
    content: content.trim()
  });
  if (state && state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  if (state) {
    state.sessionCompleted = 0;
    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundTotalKeys = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    state.roundCharLogs = [];
  }
  startRound("custom_text");
}

function renderPractice() {
  clearKeyError(onKeyboard, state);
  const box = $("#targetBox");
  const inBox = $("#inputBox");
  box.innerHTML = "";
  inBox.innerHTML = "";

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
    header.innerHTML = `<span class="chat-back">‹</span><span class="chat-avatar">${escapeHtml(who.slice(0, 1))}</span><span class="chat-name">${escapeHtml(who)}</span><span class="chat-icons">☎ ▸</span>`;
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
    if (phase === ANIMATION_PHASE.USER_TYPING && state.lineIdx < state.lines.length) {
      renderUserBubble({ text: state.lines[state.lineIdx] }, state.lineIdx, "chat-draft");
    }
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

  const li = state.lineIdx;
  const active = li < state.lines.length && !state.finished;
  const lifeActive = !isChat || state.animationPhase === ANIMATION_PHASE.USER_TYPING;
  const layout = getCurrentLayout();
  const isBoshiamyUninitialized = layout === "boshiamy" && !BOSHIAMY;

  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = state.inputs[li] || "";
  if (isBoshiamyUninitialized) {
    inp.placeholder = "請先點擊上方或鍵盤匯入碼表";
    inp.disabled = true;
  } else if (state.lines.length > 1 && !isChat) {
    const isLastLine = li >= state.lines.length - 1;
    inp.placeholder = active
      ? `第 ${li + 1} / ${state.lines.length} 行：在此輸入…（${isLastLine ? "打滿即完成" : "打滿自動換行"}）`
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
    state.frozenCangjieHint = cangjieHint ? cangjieHint.innerHTML : null;
    state.frozenCangjieInfo = getCurrentPosInfo();
    paint();
  });
  inp.addEventListener("compositionupdate", (e) => {
    ensureTimerStarted();
    state.composingRawText = e.data || state.composingRawText;
    state.composingText = e.data || state.composingText;
    onCommitted(li);
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
      clearKeyError(onKeyboard, state);
      setHintDefault();
    }
    if (state && typeof state.lastInputVal === "string" && e.target.value.length < state.lastInputVal.length) {
      clearKeyError(onKeyboard, state);
      setHintDefault();
    }
    if (state) state.lastInputVal = e.target.value;

    if (state.composing) {
      const val = e.target.value;
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
      onCommitted(li);
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

    if (state && !state.finished) {
      const isSelectionNavOrChoice = (
        e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowLeft" ||
        e.code === "ArrowDown" || e.code === "ArrowUp" || e.code === "ArrowRight" || e.code === "ArrowLeft" ||
        e.key === "PageDown" || e.key === "PageUp" ||
        /^[0-9]$/.test(e.key) || /^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code) ||
        isEnter || e.key === " " || e.code === "Space"
      );
      if (!isModifierOrNav || isBackspace || isEnter || ((state.composing || state.compositionStartAt) && isSelectionNavOrChoice)) {
        state.totalKeys = (state.totalKeys || 0) + 1;
      }
    }

    if (isBackspace) {
      clearKeyError(onKeyboard, state);
      setHintDefault();
    }

    // Flash feedback for on-screen keyboard: white = correct, red = wrong (persist until Backspace)
    if (onKeyboard && onKeyboardWrap && !onKeyboardWrap.classList.contains("hidden") && !isBackspace && !isEnter && !isModifierOrNav) {
      const expected = getCurrentExpectedKey();
      if (expected) {
        let pressedEl = null;
        if (e.code) {
          pressedEl = onKeyboard.querySelector(`.on-kb-key[data-code="${e.code}"]`);
        }
        if (!pressedEl && e.key && e.key !== "Process") {
          const k = e.key.toLowerCase();
          pressedEl = k === " "
            ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
            : findOnKbKey(k, onKeyboard);
        }

        if (pressedEl) {
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
            flashKeyElement(pressedEl, "flash-white");
            clearKeyError(onKeyboard, state);
            setHintDefault();
          } else {
            flashKeyElement(pressedEl, "flash-red");
            onKeyboard.querySelectorAll(".is-error").forEach((k) => k.classList.remove("is-error"));
            pressedEl.classList.add("is-error");
            if (state) state.lastKeyError = pressedEl.dataset.code || pressedEl.dataset.key || "error";
            hint("❌ 按錯鍵 — 請按 Backspace 修改");
          }
        }
      }
    }

    if (state && !state.finished && (state.composing || state.compositionStartAt)) {
      let pressedLetter = null;
      if (/^[a-zA-Z]$/.test(e.key)) {
        pressedLetter = e.key.toLowerCase();
      } else if (e.code && CODE_TO_KEY[e.code]) {
        pressedLetter = CODE_TO_KEY[e.code];
      }
      if (pressedLetter) state.composingKeys.push(pressedLetter);
      else if (isBackspace) state.composingKeys.pop();
    } else if (!isBackspace && !isModifierOrNav && e.key && e.key !== "Process") {
      if (/^[a-zA-Z]$/.test(e.key)) {
        state.composingKeys.push(e.key.toLowerCase());
      } else if (e.code && CODE_TO_KEY[e.code]) {
        state.composingKeys.push(CODE_TO_KEY[e.code]);
      }
    }

    if (isEnter) {
      e.preventDefault();
      if (state.composing) return;
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
  inp.addEventListener("keyup", () => ensureTimerStarted());
  inp.addEventListener("beforeinput", () => ensureTimerStarted());

  updateHud();
  setHintDefault();
  syncEndlessCheck();
  renderOnKeyboard();
  paintCangjieHint();
}

function renderOnKeyboard() {
  if (!onKeyboardWrap || !onKeyboard) return;
  const show = isOnKeyboardEnabled() && state && !state.finished;
  onKeyboardWrap.classList.toggle("hidden", !show);
  if (layoutLabel) layoutLabel.style.display = show ? "" : "none";
  if (practiceView) practiceView.classList.toggle("onkb-on", show);
  if (!show) return;
  const layout = (loadJSON(LS_ONKB, {}) || {}).layout || (layoutSelect ? layoutSelect.value : "bopomofo");
  if (onKeyboard.dataset.layout !== layout) {
    buildOnKeyboard(layout, onKeyboard, {
      onKeyPointerDown: (item, key) => {
        if (item.type === "back") {
          clearKeyError(onKeyboard, state);
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
        } else if (layout !== "bopomofo" && item.key) {
          typeOnKeyboardKey(item.key, key);
        } else {
          focusCurrent();
        }
      }
    });
  }

  const isBoshiamyUninitialized = layout === "boshiamy" && !BOSHIAMY;
  onKeyboardWrap.classList.toggle("is-uninitialized", isBoshiamyUninitialized);
  let overlay = onKeyboard.querySelector(".on-kb-overlay");
  if (isBoshiamyUninitialized) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "on-kb-overlay";
      overlay.setAttribute("role", "button");
      overlay.setAttribute("tabindex", "0");
      overlay.innerHTML = `<button type="button" class="on-kb-overlay-btn">📥 點擊匯入 .cin 碼表啟用鍵盤</button>`;
      overlay.addEventListener("click", () => {
        if (typeof openBoshiamyModal === "function") openBoshiamyModal();
      });
      onKeyboard.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
}

function typeOnKeyboardKey(ch, keyEl) {
  const inp = state && state.currentInputEl;
  if (!inp || inp.disabled) return;
  const exp = getCurrentExpectedKey();
  if (exp && exp.key) {
    const isTarget = exp.isSpace
      ? (ch === " " || (keyEl && keyEl.dataset.code === "Space"))
      : exp.key.toLowerCase() === ch.toLowerCase();
    if (!isTarget) {
      flashKeyElement(keyEl, "flash-red");
      if (exp.el) flashKeyElement(exp.el, "flash-white");
    }
  }
  inp.value += ch;
  inp.dispatchEvent(new Event("input", { bubbles: true }));
  focusCurrent();
}

function focusCurrent() {
  if (state && state.currentInputEl && !state.currentInputEl.disabled) {
    state.currentInputEl.focus();
  }
}

function ensureTimerStarted() {
  if (!state || state.startedAt || state.finished) return;
  startTimer();
}

function startTimer() {
  state.startedAt = Date.now();
  state.charStartTime = state.startedAt;
  state.charFirstKeyTime = state.startedAt;
  state.timerId = setInterval(() => {
    if (!state || state.finished) return;
    state.elapsed = elapsedNow();
    updateHud();
  }, 200);
}

function stopTimer() {
  if (state && state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function elapsedNow() {
  if (!state || !state.startedAt) return 0;
  return (Date.now() - state.startedAt) / 1000;
}

function updateHud() {
  if (!state) return;
  const sec = state.elapsed || (state.startedAt ? elapsedNow() : 0);
  const eff = effectiveStats(state.totalTyped, state.totalCorrect, sec, state.totalKeys);
  $("#hudTime").textContent = fmtTime(sec);
  $("#hudWpm").textContent = String(eff.wpm);
  const acc = state.totalTyped > 0 ? Math.round((state.totalCorrect / state.totalTyped) * 100) : 100;
  $("#hudAcc").textContent = acc + "%";
}

function hint(msg) {
  const h = $("#hintLine");
  if (h) h.textContent = msg;
}
function setHintDefault() {
  hint("");
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

function syncEndlessCheck() {
  if (!endlessCheck || !state) return;
  const applicable = isEndlessApplicable(state.modeKey);
  if (endlessLabel) {
    endlessLabel.style.display = applicable ? "" : "none";
  }
  endlessCheck.disabled = !applicable;
  const on = applicable && isEndlessEnabled(state.modeKey);
  endlessCheck.checked = on;
  if (settleCountInput) {
    settleCountInput.value = getModeSettleTarget(state.modeKey);
    settleCountInput.disabled = on;
  }
  if (endlessLabel) {
    endlessLabel.classList.toggle("is-endless-active", on);
  }
}

function getCurrentPosInfo() {
  if (!state || state.lineIdx >= state.lines.length) return null;
  const targetChars = Array.from(state.lines[state.lineIdx]);
  const displayStr = displayFor(state.lineIdx);
  const inputChars = Array.from(displayStr);
  const pos = inputChars.length;
  if (pos >= targetChars.length) {
    return {
      lineIdx: state.lineIdx,
      charIdx: pos,
      char: "",
      zhuyin: null,
      completed: inputChars,
      composingSlice: "",
    };
  }
  const ch = targetChars[pos];
  const zhuyin = (ZHUYIN && (ZHUYIN.chars ? ZHUYIN.chars[ch] : ZHUYIN[ch])) || null;
  return {
    lineIdx: state.lineIdx,
    charIdx: pos,
    char: ch,
    zhuyin,
    completed: inputChars,
    composingSlice: state.composingRawText || state.composingText || "",
  };
}

function lettersFromPreedit(preedit) {
  if (!preedit) return [];
  const res = [];
  for (const ch of preedit) {
    const l = ch.toLowerCase();
    if (/^[a-z]$/.test(l)) {
      res.push(l);
    } else if (CANGJIE_RADICAL_TO_KEY[ch]) {
      res.push(CANGJIE_RADICAL_TO_KEY[ch]);
    }
  }
  return res;
}

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
  if (state.composing && state.frozenCangjieHint && state.frozenCangjieInfo && state.frozenCangjieInfo.char === info.char) {
    cangjieHint.classList.remove("is-done");
    return;
  }
  state.frozenCangjieHint = cangjieHint.innerHTML;
  state.frozenCangjieInfo = info;
  const ch = info.char;
  if (getDecompWheel()) {
    setDecompWheelChar(ch);
    updateDecompWheelCardText({ BOSHIAMY, CANGJIE });
    return;
  }
  buildDecompWheel(cangjieHint, ch, decompMethod, { BOSHIAMY, CANGJIE }, {
    onMethodChange: (newKey) => {
      if (newKey !== decompMethod) {
        decompMethod = newKey;
        saveJSON(LS_DECOMP, newKey);
        paintOnKeyboard();
      }
    }
  });
}

function bindDecompWheel() {
  bindDecompWheelEvents(cangjieHint, {
    openBoshiamyModal: () => {
      if (typeof openBoshiamyModal === "function") openBoshiamyModal();
    },
    focusCurrent: () => focusCurrent()
  });
}

function paintOnKeyboard() {
  if (!state || !onKeyboard || !onKeyboardWrap || onKeyboardWrap.classList.contains("hidden")) {
    clearCurrentExpectedKey();
    return;
  }
  const layout = onKeyboard.dataset.layout || (layoutSelect ? layoutSelect.value : "bopomofo");
  const isBopomofo = layout === "bopomofo";
  const isCangjie = layout === "cangjie";
  const isBoshiamy = layout === "boshiamy";
  const isSucheng = layout === "sucheng";
  const isCodeLayout = isCangjie || isBoshiamy || isSucheng;

  onKeyboard.querySelectorAll(".on-kb-key").forEach((k) => k.classList.remove("is-next"));
  clearCurrentExpectedKey();

  const info = getCurrentPosInfo();
  if (!info) return;

  const curChar = info.char;
  const zhuyin = info.zhuyin;
  const curKeys = (state.composingKeys || []).slice(state.composingKeysBase || 0);

  if (isCodeLayout) {
    let code = null;
    const isPunctOrAscii = PUNCT_KEY_MAP[curChar] || /^[\x00-\x7F]$/.test(curChar);
    if (!isPunctOrAscii) {
      if (isBoshiamy) code = BOSHIAMY ? (BOSHIAMY[curChar] || null) : null;
      else if (isSucheng) code = suchengCodeForChar(curChar, CANGJIE);
      else code = lookupCangjieForChar(curChar, CANGJIE);
    }
    if (code) {
      const keySequence = Array.from(code).map((letter) => ({
        sym: isBoshiamy ? letter.toUpperCase() : (CANGJIE_RADICAL[letter] || letter),
        key: letter,
        label: isBoshiamy
          ? letter.toUpperCase()
          : `${CANGJIE_RADICAL[letter] || letter} (${letter.toUpperCase()})`,
      }));
      keySequence.push({ sym: "空白", key: " ", isSpace: true, label: "空白 (選字)" });

      let typedSteps = 0;
      const validLetters = isBoshiamy ? (l) => /^[a-z]$/.test(l) : (l) => CANGJIE_RADICAL[l];
      let typedLetters = lettersFromPreedit(info.composingSlice).filter(validLetters);
      if (!typedLetters.length && curKeys.length) typedLetters = curKeys.filter(validLetters);

      while (
        typedSteps < typedLetters.length &&
        typedSteps < keySequence.length &&
        !keySequence[typedSteps].isSpace &&
        typedLetters[typedSteps] === keySequence[typedSteps].key
      ) {
        typedSteps++;
      }
      const nextItem = typedSteps < keySequence.length ? keySequence[typedSteps] : null;
      if (nextItem) {
        const keyEl = nextItem.isSpace
          ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
          : findOnKbKey(nextItem.key, onKeyboard);
        setExpectedKey(keyEl, nextItem.isSpace, nextItem.key);
      }
    } else if (PUNCT_KEY_MAP[curChar]) {
      const pInfo = PUNCT_KEY_MAP[curChar];
      const keyEl = findOnKbKey(pInfo.key, onKeyboard);
      setExpectedKey(keyEl, false, pInfo.key);
      if (pInfo.shift) {
        const shiftEl = onKeyboard.querySelector(`.on-kb-key[data-code="ShiftLeft"]`);
        if (shiftEl) shiftEl.classList.add("is-next");
      }
    } else {
      const lower = curChar.toLowerCase();
      const keyEl = lower === " "
        ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
        : findOnKbKey(lower, onKeyboard);
      setExpectedKey(keyEl, lower === " ", lower);
    }
  } else if (isBopomofo) {
    if (zhuyin && /[ㄅ-ㄩ]/.test(zhuyin)) {
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
      if (!hasTone) {
        keySequence.push({ sym: "空白", key: " ", isSpace: true, label: "空白 (一聲)" });
      }

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
          : findOnKbKey(nextItem.key, onKeyboard);
        setExpectedKey(keyEl, nextItem.isSpace, nextItem.key);
      }
    } else if (PUNCT_KEY_MAP[curChar]) {
      const pInfo = PUNCT_KEY_MAP[curChar];
      const keyEl = findOnKbKey(pInfo.key, onKeyboard);
      setExpectedKey(keyEl, false, pInfo.key);
      if (pInfo.shift) {
        const shiftEl = onKeyboard.querySelector(`.on-kb-key[data-code="ShiftLeft"]`);
        if (shiftEl) shiftEl.classList.add("is-next");
      }
      if (curChar === "，" || curChar === "。") {
        const ctrlEl = onKeyboard.querySelector('.on-kb-key[data-code="ControlLeft"]');
        if (ctrlEl) ctrlEl.classList.add("is-next");
      }
    } else {
      const lower = curChar.toLowerCase();
      const keyEl = lower === " "
        ? onKeyboard.querySelector('.on-kb-key[data-code="Space"]')
        : findOnKbKey(lower, onKeyboard);
      setExpectedKey(keyEl, lower === " ", lower);
    }
  }

  if (/[A-Z]/.test(curChar)) {
    const shiftEl = onKeyboard.querySelector('.on-kb-key[data-code="ShiftLeft"]');
    if (shiftEl) shiftEl.classList.add("is-next");
  }
}

function getComposedDisplay(li) {
  const el = state.currentInputEl;
  const val = (el && typeof el.value === "string") ? el.value : (state.inputs[li] || "");
  if (!val) return "";
  if (!state.composing) return val;

  const targetLine = state.lines[li] || "";
  const targetChars = Array.from(targetLine);

  // 1) 移除結尾的注音符號（選字/組字緩衝區中的未完成拼音）
  let stripped = val.replace(/[ㄅ-ㄩˊˇˋ˙]+$/, "");

  // 2) 移除結尾的英文字母或倉頡字根（若目標字元在該位置不是英文字母）
  const strippedChars = Array.from(stripped);
  const nextTargetChar = targetChars[strippedChars.length];
  if (!nextTargetChar || !/[a-zA-Z]/.test(nextTargetChar)) {
    stripped = stripped.replace(/[a-zA-Z日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜重]+$/, "");
  }

  return stripped;
}

function displayFor(li) {
  if (li === state.lineIdx) {
    return getComposedDisplay(li);
  }
  return state.inputs[li] || "";
}

function paint() {
  if (!state) return;
  const isChat = state.modeKey === "life_situations";
  const box = document.getElementById("targetBox");

  let totalChars = 0;
  let correctChars = 0;
  let typedChars = 0;

  state.lines.forEach((line, li) => {
    const targetArr = Array.from(line);
    const typedArr = Array.from(displayFor(li));
    totalChars += targetArr.length;
    typedChars += Math.min(targetArr.length, typedArr.length);

    let lineDiv = (!isChat && box) ? box.querySelector(`.target-line[data-line="${li}"]`) : null;
    let isLineCurrent = (li === state.lineIdx);
    if (lineDiv) {
      lineDiv.classList.toggle("current-line", isLineCurrent);
    }

    let foundCurrent = false;

    targetArr.forEach((tch, pos) => {
      let span = null;
      if (lineDiv) {
        span = lineDiv.querySelector(`.char[data-pos="${pos}"]`);
      }
      if (!span && box) {
        span = box.querySelector(`.char[data-line="${li}"][data-pos="${pos}"]`);
      }
      if (!span) return;

      span.className = "char";
      const u = typedArr[pos];

      if (u === undefined) {
        if (isLineCurrent && !foundCurrent) {
          span.classList.add("current");
          foundCurrent = true;
        } else {
          span.classList.add("pending");
        }
      } else if (norm(u) === norm(tch)) {
        span.classList.add("correct");
        correctChars++;
      } else {
        span.classList.add("error");
      }
    });
  });

  const pct = totalChars > 0 ? Math.min(100, Math.round((typedChars / totalChars) * 100)) : 0;
  const progEl = document.getElementById("progressBar");
  if (progEl) progEl.style.width = pct + "%";

  const currentCharEl = box ? box.querySelector(".char.current") : null;
  if (currentCharEl && box) {
    const cRect = currentCharEl.getBoundingClientRect();
    const bRect = box.getBoundingClientRect();
    if (cRect.bottom > bRect.bottom - 10) {
      box.scrollTop += (cRect.bottom - bRect.bottom + 25);
    } else if (cRect.top < bRect.top + 10) {
      box.scrollTop -= (bRect.top - cRect.top + 25);
    }
  }

  paintOnKeyboard();
  paintCangjieHint();
}

function onCommitted(lineIdx) {
  const line = state.lines[lineIdx];
  const targetChars = Array.from(line);
  const inputChars = Array.from(displayFor(lineIdx));
  let correct = 0;
  const now = Date.now();

  for (let i = 0; i < targetChars.length && i < inputChars.length; i++) {
    const isCorrect = norm(inputChars[i]) === norm(targetChars[i]);
    if (isCorrect) {
      correct++;
    }
    const isLogged = state.charLogs.some((l) => l.line === lineIdx && l.pos === i);
    if (!isLogged) {
      const start = state.charStartTime || now;
      const dur = Math.max(10, now - start);
      const imeDur = state.selectionInteractionDuration || 0;
      const netDur = Math.max(20, dur - imeDur);
      const firstKey = state.charFirstKeyTime || start;
      const latency = Math.max(0, firstKey - start);
      const ch = targetChars[i];
      let decomp = "—";
      const dec = decompositionFor(ch, decompMethod, { BOSHIAMY, CANGJIE });
      if (dec && !dec.missing && !dec.isBoshiamyUninitialized) {
        if (dec.lettersOnly) decomp = Array.from(dec.code).map((c) => c.toUpperCase()).join(" ");
        else if (dec.radicals) decomp = `${dec.radicals} (${dec.code})`;
        else decomp = dec.code;
      }
      state.charLogs.push({
        line: lineIdx,
        pos: i,
        char: ch,
        duration: dur,
        netDuration: netDur,
        imeSelectDuration: imeDur,
        cognitiveLatency: latency,
        decomp,
        backspaces: state.charBackspaces || 0,
        error: !isCorrect
      });
      state.charStartTime = now;
      state.charFirstKeyTime = null;
      state.charBackspaces = 0;
      state.selectionInteractionDuration = 0;
    }
  }
  let allTyped = 0;
  let allCorrect = 0;
  state.lines.forEach((l, idx) => {
    const tChars = Array.from(l);
    const iChars = Array.from(displayFor(idx));
    allTyped += iChars.length;
    for (let j = 0; j < tChars.length && j < iChars.length; j++) {
      if (norm(iChars[j]) === norm(tChars[j])) allCorrect++;
    }
  });
  state.totalTyped = allTyped;
  state.totalCorrect = allCorrect;
}

function advance(lineIdx) {
  if (lineIdx + 1 < state.lines.length) {
    state.lineIdx++;
    renderPractice();
    paint();
    focusCurrent();
  } else {
    finishRound();
  }
}

function maybeFinish() {
  if (state.finished) return;
  // 組字（preedit / composition）中：不前進、不結束，等確定後 compositionend 再評估
  if (state.composing) return;
  const isChat = state.modeKey === "life_situations";
  if (isChat) {
    if (state.animationPhase === ANIMATION_PHASE.COMPLETED) {
      finishRound();
    }
    return;
  }
  // 自動前進：目前行打完，直接 advance，不必按 Enter 確認
  const li = state.lineIdx;
  const line = state.lines[li];
  const targetArr = Array.from(line);
  const inputArr = Array.from(displayFor(li));
  const complete = inputArr.length >= targetArr.length;
  if (li + 1 < state.lines.length && complete) {
    advance(li);
    return;
  }
  const allComplete = state.lines.every((l, i) => {
    const tArr = Array.from(l);
    const iArr = Array.from(displayFor(i));
    return iArr.length >= tArr.length;
  });
  if (allComplete) {
    finishRound();
  }
}

function finishRound() {
  if (state.finished) return;
  state.finished = true;
  stopTimer();
  state.elapsed = elapsedNow();
  state.sessionCompleted = (state.sessionCompleted || 0) + 1;

  const currentStageEff = effectiveStats(state.totalTyped, state.totalCorrect, state.elapsed, state.totalKeys);
  const stageRecord = {
    stageNum: state.sessionCompleted,
    text: state.lines.join(" "),
    item: state.item,
    sec: state.elapsed,
    wpm: currentStageEff.wpm,
    cpm: currentStageEff.cpm,
    acc: currentStageEff.acc,
    correct: state.totalCorrect,
    typed: state.totalTyped
  };
  state.roundStages = (state.roundStages || []).concat([stageRecord]);

  const targetCount = getModeSettleTarget(state.modeKey);
  const isEndless = isEndlessEnabled(state.modeKey);

  if (isEndless) {
    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundTotalKeys = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    state.roundCharLogs = [];
    state.roundStages = [];
    const stats = recordStats();
    showAutoNextFeedback(stats);
    state.autoNextTimer = setTimeout(() => {
      state.autoNextTimer = null;
      startRound(state.modeKey);
    }, 450);
    return;
  }

  const reached = state.sessionCompleted >= targetCount;
  if (!reached) {
    state.roundTotalTyped = (state.roundTotalTyped || 0) + state.totalTyped;
    state.roundTotalCorrect = (state.roundTotalCorrect || 0) + state.totalCorrect;
    state.roundTotalKeys = (state.roundTotalKeys || 0) + state.totalKeys;
    state.roundElapsed = (state.roundElapsed || 0) + state.elapsed;
    state.roundCharLogs = (state.roundCharLogs || []).concat(state.charLogs || []);
    const stats = peekStats(state.roundTotalTyped, state.roundTotalCorrect, state.roundElapsed, state.roundTotalKeys);
    showAutoNextFeedback(stats, { progress: `${state.sessionCompleted} / ${targetCount}` });
    state.autoNextTimer = setTimeout(() => {
      state.autoNextTimer = null;
      startRound(state.modeKey);
    }, 450);
    return;
  }

  const combinedTyped = (state.roundTotalTyped || 0) + state.totalTyped;
  const combinedCorrect = (state.roundTotalCorrect || 0) + state.totalCorrect;
  const combinedKeys = (state.roundTotalKeys || 0) + state.totalKeys;
  const combinedSec = (state.roundElapsed || 0) + state.elapsed;
  const combinedLogs = (state.roundCharLogs || []).concat(state.charLogs || []);
  const allStages = (state.roundStages || []).slice();

  const stats = recordStats({
    totalTyped: combinedTyped,
    totalCorrect: combinedCorrect,
    totalKeys: combinedKeys,
    sec: combinedSec,
    charLogs: combinedLogs,
    stages: allStages,
  });

  state.sessionCompleted = 0;
  state.roundTotalTyped = 0;
  state.roundTotalCorrect = 0;
  state.roundTotalKeys = 0;
  state.roundElapsed = 0;
  state.roundStartedAt = null;
  state.roundCharLogs = [];
  state.roundStages = [];
  resultTimeoutId = setTimeout(() => {
    resultTimeoutId = null;
    showResultModal(stats);
  }, 250);
}

function peekStats(totalTyped, totalCorrect, sec, totalKeys) {
  return effectiveStats(totalTyped, totalCorrect, sec, totalKeys);
}

function recordStats(override) {
  const totalTyped = override ? override.totalTyped : state.totalTyped;
  const totalCorrect = override ? override.totalCorrect : state.totalCorrect;
  const totalKeys = override ? override.totalKeys : state.totalKeys;
  const rawSec = override ? override.sec : state.elapsed;
  const stages = (override && override.stages) || [];
  const eff = effectiveStats(totalTyped, totalCorrect, rawSec, totalKeys);
  const sec = eff.sec;
  const wpm = eff.wpm;
  const cpm = eff.cpm;
  const acc = eff.acc;

  const isAnomalous = eff.anomalous || wpm > 450;
  const best = loadBest();
  const prev = best[state.modeKey];
  const isRecord = !isAnomalous && (!prev || wpm > prev.wpm) && wpm > 0;
  if (isRecord) {
    best[state.modeKey] = { wpm, cpm, acc, sec: Math.round(sec) };
    saveJSON(LS_BEST, best);
  }
  if (!isAnomalous) {
    const hist = loadHist();
    const stageIds = stages.length > 0
      ? stages.map((s) => s.item && s.item.id).filter(Boolean)
      : (state.item ? [state.item.id] : []);
    const stageTexts = stages.length > 0
      ? stages.map((s) => s.text).filter(Boolean)
      : (state.lines ? [state.lines.join(" ")] : []);
    hist.unshift({
      mode: state.modeKey,
      wpm,
      cpm,
      acc,
      sec: Math.round(sec),
      id: state.item ? state.item.id : (stageIds[0] || ""),
      stageIds,
      stageTexts,
      stagesCount: stages.length || 1,
      typed: totalTyped,
      correct: totalCorrect,
      keys: eff.totalKeys,
      time: Date.now()
    });
    saveJSON(LS_HIST, hist.slice(0, 50));
  }

  const charLogs = (override && override.charLogs) || (state && state.charLogs) || [];
  const validLatencies = charLogs.map((l) => l.cognitiveLatency).filter((v) => typeof v === "number" && v > 0);
  const avgFirstKeyLatency = validLatencies.length
    ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
    : 0;

  let consistency = 80;
  if (charLogs.length > 2) {
    const durations = charLogs.map((l) => l.duration);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    if (mean > 0) {
      const variance = durations.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0) / durations.length;
      const cv = (Math.sqrt(variance) / mean) * 100;
      consistency = Math.max(10, Math.min(100, Math.round(100 - cv)));
    }
  }

  const bottlenecks = analyzeBottlenecks(charLogs);

  return {
    sec,
    rawSec: eff.rawSec,
    wpm,
    cpm,
    acc,
    isRecord,
    isAnomalous,
    totalTyped,
    totalCorrect,
    totalKeys: eff.totalKeys,
    avgFirstKeyLatency,
    consistency,
    bottlenecks,
    charLogs,
    stages
  };
}

function showAutoNextFeedback(stats, opts) {
  const progress = opts && opts.progress ? `（${opts.progress}）` : "";
  const speed = stats.wpm != null ? stats.wpm : stats.cpm;
  if (stats.isRecord) {
    hint(`★ 新紀錄！速度 ${speed} 字/分 · 正確率 ${stats.acc}%${progress} · 進入下一題…`);
  } else {
    hint(`完成！速度 ${speed} 字/分 · 正確率 ${stats.acc}%${progress} · 進入下一題…`);
  }
  $("#hudTime").textContent = fmtTime(stats.sec);
  $("#hudWpm").textContent = speed;
  $("#hudAcc").textContent = stats.acc + "%";
  const hudProgEl = $("#hudProg");
  if (hudProgEl) hudProgEl.textContent = "100%";
  $("#progressBar").style.width = "100%";
}

function showResultModal(stats) {
  if (practiceView.classList.contains("hidden")) return;
  setLastResultTelemetry(stats);

  const correct = stats.totalCorrect != null ? stats.totalCorrect : (state ? state.totalCorrect : 0);
  const typed = stats.totalTyped != null ? stats.totalTyped : (state ? state.totalTyped : 0);

  const kpiCpm = $("#kpiCpm");
  const kpiWpm = $("#kpiWpm");
  const kpiAcc = $("#kpiAcc");
  const kpiAccRatio = $("#kpiAccRatio");
  const kpiLatency = $("#kpiLatency");
  const kpiConsistency = $("#kpiConsistency");

  const wpmVal = stats.wpm != null ? stats.wpm : Math.round(stats.cpm / 5);
  if (kpiWpm) kpiWpm.textContent = wpmVal;
  if (kpiCpm) kpiCpm.textContent = `${stats.cpm} CPM`;
  if (kpiAcc) kpiAcc.textContent = `${stats.acc}%`;
  if (kpiAccRatio) kpiAccRatio.textContent = `${correct} / ${typed} 字`;
  if (kpiLatency) kpiLatency.innerHTML = `${stats.avgFirstKeyLatency || 0} <span class="kpi-unit">ms</span>`;
  if (kpiConsistency) kpiConsistency.textContent = `${stats.consistency || 80}%`;

  const warn = $("#anomalyLine");
  if (warn) {
    warn.classList.toggle("hidden", !stats.isAnomalous);
    if (stats.isAnomalous) warn.textContent = "⚠️ 計時異常（完成時間過短，疑似貼上或瞬間輸入），速度未計入最佳紀錄。";
  }

  const stagesPanel = $("#profilerStagesPanel");
  const stagesList = $("#stagesList");
  const stagesSummary = $("#stagesSummary");
  const stages = stats.stages || [];
  if (stagesPanel && stagesList) {
    if (stages.length > 1) {
      stagesPanel.classList.remove("hidden");
      if (stagesSummary) stagesSummary.textContent = `共 ${stages.length} 關`;
      stagesList.innerHTML = stages.map((s) => `
        <div class="stage-card">
          <div class="stage-card-head">
            <span class="stage-num">第 ${s.stageNum} 關</span>
            <span class="stage-speed text-amber">${s.wpm} 字/分</span>
          </div>
          <div class="stage-text" title="${escapeHtml(s.text)}">${escapeHtml(s.text)}</div>
          <div class="stage-meta">正確率 ${s.acc}% · ${fmtTime(s.sec)} · ${s.correct}/${s.typed} 字</div>
        </div>
      `).join("");
    } else {
      stagesPanel.classList.add("hidden");
    }
  }

  if (stages.length > 1) {
    const box = $("#targetBox");
    if (box) {
      box.className = "target-box";
      box.innerHTML = "";
      stages.forEach((s, idx) => {
        const div = document.createElement("div");
        div.className = "target-line";
        div.dataset.line = idx;
        const stagePrefix = document.createElement("span");
        stagePrefix.style.color = "var(--muted)";
        stagePrefix.style.fontSize = "13px";
        stagePrefix.style.marginRight = "8px";
        stagePrefix.textContent = `${idx + 1}.`;
        div.appendChild(stagePrefix);
        Array.from(s.text).forEach((ch) => {
          const sp = document.createElement("span");
          sp.className = "char correct";
          sp.textContent = ch === " " ? "\u00a0" : ch;
          div.appendChild(sp);
        });
        box.appendChild(div);
      });
    }
  }

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

  renderResultChart(stats.charLogs || []);
  resultOverlay.classList.remove("hidden");
}

function startBottlenecksPractice() {
  const tele = getLastResultTelemetry();
  if (!tele || !tele.bottlenecks || !tele.bottlenecks.length) return;
  const drill = generateBottleneckDrill(tele.bottlenecks);
  resultOverlay.classList.add("hidden");
  currentBottleneckDrillText = drill;
  if (state && state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  if (state) {
    state.sessionCompleted = 0;
    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundTotalKeys = 0;
    state.roundElapsed = 0;
    state.roundStartedAt = null;
    state.roundCharLogs = [];
    state.roundStages = [];
  }
  startRound("bottlenecks");
}

// ---- 全域事件與 Modal 控制 ----
function updateInert() {
  const overlays = [
    document.getElementById("resultOverlay"),
    document.getElementById("statsOverlay"),
    document.getElementById("customTextOverlay"),
    document.getElementById("boshiamyImportOverlay")
  ];
  const anyOpen = overlays.some((o) => o && !o.classList.contains("hidden"));
  const mainEls = [document.querySelector(".topbar"), document.getElementById("homeView"), document.getElementById("practiceView")];
  mainEls.forEach((el) => {
    if (el) {
      if (anyOpen) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    }
  });
}

function initModalInertObserver() {
  const overlays = [
    document.getElementById("resultOverlay"),
    document.getElementById("statsOverlay"),
    document.getElementById("customTextOverlay"),
    document.getElementById("boshiamyImportOverlay")
  ];
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(updateInert);
    overlays.forEach((o) => {
      if (o) observer.observe(o, { attributes: true, attributeFilter: ["class"] });
    });
  }
  updateInert();
}

function bindGlobal() {
  initModalInertObserver();
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
    updateInert();
  }

  function closeStatsModal() {
    if (!statsOverlay) return;
    statsOverlay.classList.add("hidden");
    setStatsMsg("");
    if (practiceView && !practiceView.classList.contains("hidden")) {
      focusCurrent();
    }
    updateInert();
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
            if (!existing || wpm > existing.wpm) {
              currentBest[mode] = { wpm, acc, sec };
              bestUpdatedCount++;
            }
          }
        }
      }
      saveJSON(LS_BEST, currentBest);
    }

    const currentHist = loadHist();
    let histAddedCount = 0;
    if (Array.isArray(importedHist)) {
      importedHist.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const wpm = Math.round(item.wpm || 0);
        if (wpm <= 0 || wpm > 450) return;
        const acc = Number.isFinite(item.acc) ? Math.min(100, Math.max(0, Number(item.acc))) : 100;
        const sec = Number.isFinite(item.sec) ? Math.max(0, Math.round(item.sec)) : 0;
        const rawMode = typeof item.mode === "string" ? item.mode.trim().slice(0, 50) : "words";
        const mode = rawMode.replace(/[<>"'&]/g, "");
        const time = Number.isFinite(item.time) ? item.time : Date.now();
        const typed = typeof item.typed === "number" ? item.typed : undefined;
        const correct = typeof item.correct === "number" ? item.correct : undefined;
        const id = item.id;

        const isDuplicate = currentHist.some((h) =>
          h.mode === mode && Math.abs(h.time - time) < 1000 && h.wpm === wpm
        );
        if (!isDuplicate) {
          currentHist.push({ mode, wpm, acc, sec, time, typed, correct, id });
          histAddedCount++;
        }
      });
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
              <span class="hist-mode">${escapeHtml(mTitle)}</span>
              <span class="hist-wpm">${Math.round(Number(h.wpm) || 0)} 字/分</span>
              <span class="hist-meta">${Number(h.acc) || 0}% · ${fmtTime(Number(h.sec) || 0)}</span>
              <span class="hist-meta">${escapeHtml(timeStr)}</span>
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
        setStatsMsg("檔案讀取失敗，請重新嘗試", "error");
      };
      reader.readAsText(file);
    });
  }
  if (statsOverlay) {
    statsOverlay.addEventListener("click", (e) => {
      if (e.target === statsOverlay) closeStatsModal();
    });
  }

  openCustomTextModal = function () {
    if (!customTextOverlay) return;
    const raw = getCustomTextRaw();
    if (customTextInput) {
      customTextInput.value = raw;
      customTextInput.classList.remove("is-invalid");
    }
    hideCustomError();
    updateCustomMeta();
    customTextOverlay.classList.remove("hidden");
    if (customTextInput) {
      setTimeout(() => customTextInput.focus(), 50);
    }
  };

  closeCustomTextModal = function () {
    if (!customTextOverlay) return;
    customTextOverlay.classList.add("hidden");
    hideCustomError();
    if (practiceView && !practiceView.classList.contains("hidden")) {
      focusCurrent();
    }
  };

  function hideCustomError() {
    if (!customErrorMsg) return;
    customErrorMsg.textContent = "";
    customErrorMsg.classList.add("hidden");
    if (customTextInput) customTextInput.classList.remove("is-invalid");
  }

  function showCustomError(msg) {
    if (!customErrorMsg) return;
    customErrorMsg.textContent = msg;
    customErrorMsg.classList.remove("hidden");
    if (customTextInput) {
      customTextInput.classList.add("is-invalid");
      customTextInput.focus();
    }
  }

  function updateCustomMeta() {
    if (!customTextInput || !customCharCount) return;
    const val = customTextInput.value || "";
    if (isCustomJsonMode) {
      customCharCount.textContent = `JSON 模式（${val.length} 字元）`;
    } else {
      const count = Array.from(val.trim()).length;
      customCharCount.textContent = `${count} 字`;
    }
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
      hideCustomError();
      updateCustomMeta();
    });
  }
  if (toggleJsonModeBtn) {
    toggleJsonModeBtn.addEventListener("click", () => {
      isCustomJsonMode = !isCustomJsonMode;
      hideCustomError();
      if (isCustomJsonMode) {
        toggleJsonModeBtn.textContent = "切換回純文字模式";
        if (customModalSub) customModalSub.textContent = "請輸入 JSON 格式，需包含 content 欄位：";
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
    });
  }
  if (customTextOverlay) {
    customTextOverlay.addEventListener("click", (e) => {
      if (e.target === customTextOverlay) closeCustomTextModal();
    });
  }
  if (changeCustomTextBtn) {
    changeCustomTextBtn.addEventListener("click", () => {
      openCustomTextModal();
    });
  }

  function showBoshiamyStatus(msg, type = "info") {
    if (!boshiamyStatusMsg) return;
    boshiamyStatusMsg.textContent = msg;
    boshiamyStatusMsg.className = `boshiamy-status is-${type}`;
    boshiamyStatusMsg.classList.remove("hidden");
  }

  function hideBoshiamyStatus() {
    if (!boshiamyStatusMsg) return;
    boshiamyStatusMsg.classList.add("hidden");
    boshiamyStatusMsg.textContent = "";
  }

  openBoshiamyModal = function () {
    if (!boshiamyImportOverlay) return;
    hideBoshiamyStatus();
    boshiamyImportOverlay.classList.remove("hidden");
  };

  closeBoshiamyModal = function () {
    if (!boshiamyImportOverlay) return;
    boshiamyImportOverlay.classList.add("hidden");
    hideBoshiamyStatus();
    if (practiceView && !practiceView.classList.contains("hidden")) {
      focusCurrent();
    }
  };

  async function handleBoshiamyFile(file) {
    if (!file) return;
    showBoshiamyStatus("正在讀取並解析碼表檔案…", "info");
    try {
      const text = await file.text();
      const table = parseCinTable(text);
      if (!table || Object.keys(table).length === 0) {
        showBoshiamyStatus("解析失敗：找不到有效的碼表字元對照（需包含 %chardef 區塊或 key/char 對照）", "error");
        return;
      }
      const count = Object.keys(table).length;
      showBoshiamyStatus(`成功解析 ${count} 個字元！正在儲存至本機資料庫…`, "info");
      await saveBoshiamyToIDB(table);
      BOSHIAMY = table;
      showBoshiamyStatus(`已啟用嘸蝦米模式（共 ${count} 字）！`, "success");
      setTimeout(() => {
        closeBoshiamyModal();
        if (state && !state.finished) {
          renderPractice();
          paint();
        }
      }, 700);
    } catch (err) {
      showBoshiamyStatus("讀取檔案出錯：" + (err.message || String(err)), "error");
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
    selectBoshiamyFileBtn.addEventListener("click", () => boshiamyFileInput.click());
  }
  if (boshiamyDropzone && boshiamyFileInput) {
    boshiamyDropzone.addEventListener("click", (e) => {
      if (e.target !== selectBoshiamyFileBtn) boshiamyFileInput.click();
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
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleBoshiamyFile(files[0]);
      }
    });
    boshiamyFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleBoshiamyFile(e.target.files[0]);
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (getCurrentLayout() === "boshiamy" && !BOSHIAMY && practiceView && !practiceView.classList.contains("hidden")) {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
      if (!isInput && e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (typeof openBoshiamyModal === "function") {
          e.preventDefault();
          openBoshiamyModal();
          return;
        }
      }
    }

    if (e.key === "Escape") {
      if (e.isComposing || (state && state.composing) || e.keyCode === 229) return;
      if (boshiamyImportOverlay && !boshiamyImportOverlay.classList.contains("hidden")) {
        closeBoshiamyModal();
        return;
      }
      if (customTextOverlay && !customTextOverlay.classList.contains("hidden")) {
        closeCustomTextModal();
        return;
      }
      if (statsOverlay && !statsOverlay.classList.contains("hidden")) {
        closeStatsModal();
        return;
      }
      if (practiceView && !practiceView.classList.contains("hidden")) {
        if (escConfirmActive) {
          resetEscConfirm();
          showHome();
        } else {
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
    if (state) {
      state.sessionCompleted = 0;
      state.roundTotalTyped = 0;
      state.roundTotalCorrect = 0;
      state.roundTotalKeys = 0;
      state.roundElapsed = 0;
      state.roundStartedAt = null;
      state.roundCharLogs = [];
      state.roundStages = [];
    }
    startRound(state.modeKey);
  });
  $("#againBtn").addEventListener("click", () => {
    resultOverlay.classList.add("hidden");
    if (state) {
      state.sessionCompleted = 0;
      state.roundTotalTyped = 0;
      state.roundTotalCorrect = 0;
      state.roundTotalKeys = 0;
      state.roundElapsed = 0;
      state.roundStartedAt = null;
      state.roundCharLogs = [];
      state.roundStages = [];
      startRound(state.modeKey);
    }
  });
  const retryBottlenecksBtn = $("#retryBottlenecksBtn");
  if (retryBottlenecksBtn) {
    retryBottlenecksBtn.addEventListener("click", () => {
      startBottlenecksPractice();
    });
  }

  setupChartInteractions();

  let chartResizeTimer = null;
  window.addEventListener("resize", () => {
    if (chartResizeTimer) clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => {
      const tele = getLastResultTelemetry();
      if (!resultOverlay.classList.contains("hidden") && tele) {
        renderResultChart(tele.charLogs);
      }
    }, 100);
  });

  window.addEventListener("keydown", (e) => {
    if (resultOverlay.classList.contains("hidden")) return;
    if (e.isComposing || (state && state.composing) || e.keyCode === 229) return;
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      resultOverlay.classList.add("hidden");
      if (state) {
        state.sessionCompleted = 0;
        state.roundTotalTyped = 0;
        state.roundTotalCorrect = 0;
        state.roundTotalKeys = 0;
        state.roundElapsed = 0;
        state.roundStartedAt = null;
        state.roundCharLogs = [];
        state.roundStages = [];
        startRound(state.modeKey);
      }
    }
  });

  $("#homeBtn").addEventListener("click", showHome);
  $("#targetBox").addEventListener("click", focusCurrent);

  endlessCheck.addEventListener("change", (e) => {
    if (!state) return;
    setEndlessEnabled(state.modeKey, e.target.checked);
    if (settleCountInput) {
      settleCountInput.disabled = e.target.checked;
    }
    if (endlessLabel) {
      endlessLabel.classList.toggle("is-endless-active", e.target.checked);
    }
    if (state.timerId) {
      state.sessionCompleted = 0;
      state.roundTotalTyped = 0;
      state.roundTotalCorrect = 0;
      state.roundTotalKeys = 0;
      state.roundElapsed = 0;
      syncEndlessCheck();
      showPractice();
      renderPractice();
      paint();
      focusCurrent();
    }
  });

  const onSettleCountChange = () => {
    if (!state) return;
    setModeSettleTarget(state.modeKey, settleCountInput.value);
    settleCountInput.value = getModeSettleTarget(state.modeKey);
    state.sessionCompleted = 0;
    state.roundTotalTyped = 0;
    state.roundTotalCorrect = 0;
    state.roundTotalKeys = 0;
    state.roundElapsed = 0;
    syncEndlessCheck();
  };
  settleCountInput.addEventListener("change", onSettleCountChange);
  settleCountInput.addEventListener("blur", onSettleCountChange);
  settleCountInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      settleCountInput.blur();
    }
  });

  function onLayoutChanged(val) {
    const pref = loadJSON(LS_ONKB, {}) || {};
    pref.layout = val;
    saveJSON(LS_ONKB, pref);
    syncLayoutSelectors(val);
    if (onKeyboard) onKeyboard.dataset.layout = "";
    renderOnKeyboard();
    const mIdx = methodIndex(val);
    if (mIdx !== -1) {
      setDecompWheelTarget(mIdx);
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

  if (onKeyboardCheck) {
    onKeyboardCheck.checked = (loadJSON(LS_ONKB, {}) || {}).show === true;
    const pref = loadJSON(LS_ONKB, {}) || {};
    const savedLayout = pref.layout;
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
      const p = loadJSON(LS_ONKB, {}) || {};
      p.show = e.target.checked;
      saveJSON(LS_ONKB, p);
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

// ---- 應用初始化入口 ----
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

  const res = await fetch("data/data.json");
  DATA = await res.json();
  ensureCustomData();

  decompMethod = ["cangjie", "boshiamy", "sucheng"].includes(loadJSON(LS_DECOMP, "cangjie"))
    ? loadJSON(LS_DECOMP, "cangjie") : "cangjie";
  renderHome();
  bindGlobal();

  // 背景非同步平行載入注音與倉頡字典（具備 IndexedDB 持久快取）
  Promise.all([
    fetchOrLoadCached(IDB_KEY_ZHUYIN, "data/zhuyin.json").then((d) => { ZHUYIN = d; }).catch(() => { ZHUYIN = null; }),
    fetchOrLoadCached(IDB_KEY_CANGJIE, "data/cangjie.json").then((d) => { CANGJIE = d; }).catch(() => { CANGJIE = null; }),
    loadBoshiamyFromIDB().then((d) => { BOSHIAMY = d; }).catch(() => { BOSHIAMY = null; }),
  ]).then(() => {
    if (state && !state.finished) {
      paintOnKeyboard();
      paintCangjieHint();
    }
  });
}

// 掛載至 window 供測試與除錯
if (typeof window !== "undefined") {
  window.effectiveStats = effectiveStats;
  window.showResultModal = showResultModal;
  window.startBottlenecksPractice = startBottlenecksPractice;
  window.startRound = startRound;
  window.paint = paint;
  window.paintOnKeyboard = paintOnKeyboard;
  window.renderOnKeyboard = renderOnKeyboard;
  window.getState = () => state;
}

// 註冊 Service Worker
if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

init();
