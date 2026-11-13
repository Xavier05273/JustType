// js/decomp-wheel.js — 拆字提示（倉頡 / 嘸蝦米 / 速成）3D 橫向反向環滾輪模組

import { CANGJIE_RADICAL, PUNCT_KEY_MAP } from "./constants.js";

export const DECOMP_METHODS = [
  { key: "cangjie", label: "倉頡", dataKey: "cangjie" },
  { key: "boshiamy", label: "嘸蝦米", dataKey: "boshiamy" },
  { key: "sucheng", label: "速成", dataKey: "sucheng" },
];

export const DECOMP_RING_STEP = 26;
export const DECOMP_RING_RADIUS = 88;

let decompWheel = null;
let decompWheelChar = null;
let decompWheelBody = null;
let decompWheelInfo = null;

export function getDecompWheel() {
  return decompWheel;
}

export function methodLabel(key) {
  const m = DECOMP_METHODS.find((x) => x.key === key);
  return m ? m.label : key;
}

export function methodIndex(key) {
  return DECOMP_METHODS.findIndex((m) => m.key === key);
}

export function lookupCangjieForChar(ch, CANGJIE) {
  if (!ch || !CANGJIE) return null;
  return CANGJIE[ch] || null;
}

export function radicalsForCode(code) {
  return Array.from(code || "").map((c) => CANGJIE_RADICAL[c] || c).join(" ");
}

// 速成 = 倉頡碼取首碼＋尾碼（1–2 碼原樣；3 碼以上取首尾，如謝 yrhhi→yi）。
export function suchengCodeForChar(ch, CANGJIE) {
  const cj = lookupCangjieForChar(ch, CANGJIE);
  if (!cj) return null;
  if (cj.length <= 2) return cj;
  return cj[0] + cj[cj.length - 1];
}

export function decompositionFor(ch, method, dictionaries = {}) {
  if (!ch) return null;
  const { BOSHIAMY, CANGJIE } = dictionaries;
  if (method === "boshiamy") {
    if (!BOSHIAMY) return { isBoshiamyUninitialized: true };
    const code = BOSHIAMY[ch] || null;
    if (!code) return { missing: "查無拆字" };
    return { code, radicals: null, lettersOnly: true };
  }
  if (method === "sucheng") {
    if (!CANGJIE) return { missing: "字庫未載入" };
    const code = suchengCodeForChar(ch, CANGJIE);
    if (!code) return { missing: "查無拆字" };
    return { code, radicals: radicalsForCode(code) };
  }
  // cangjie
  if (!CANGJIE) return { missing: "字庫未載入" };
  const code = lookupCangjieForChar(ch, CANGJIE);
  if (!code) return { missing: "查無拆字" };
  return { code, radicals: radicalsForCode(code) };
}

export function decompositionCardHTML(ch, methodKey, dictionaries = {}) {
  const label = methodLabel(methodKey);
  if (!ch) return `<span class="decomp-name">${label}</span> ： —`;
  const { BOSHIAMY } = dictionaries;
  if (methodKey === "boshiamy" && !BOSHIAMY) {
    return `<span class="decomp-name">${label}</span> ： <span class="decomp-import-btn" role="button" tabindex="0" title="點擊匯入碼表">匯入 .cin 檔</span>`;
  }
  const reloadBtn = methodKey === "boshiamy" ? ` <button type="button" class="decomp-reload-btn" title="重新上傳或更換碼表" aria-label="重新上傳或更換碼表">⚙️</button>` : "";
  if (PUNCT_KEY_MAP[ch] || /^[\x00-\x7f]$/.test(ch)) {
    return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： 照打${reloadBtn}`;
  }
  const dec = decompositionFor(ch, methodKey, dictionaries);
  if (dec && dec.missing) {
    return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： ${dec.missing}${reloadBtn}`;
  }
  if (dec && dec.lettersOnly) {
    const letters = Array.from(dec.code).map((c) => c.toUpperCase()).join(" ");
    return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： <span class="cj-letters">${letters}</span>${reloadBtn}`;
  }
  return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： <span class="cj-radicals">${dec.radicals}</span> <span class="cj-code">${dec.code}</span>`;
}

export function clearDecompWheel() {
  if (decompWheel && decompWheel.raf != null) {
    cancelAnimationFrame(decompWheel.raf);
    decompWheel.raf = null;
  }
  decompWheel = null;
  decompWheelChar = null;
  decompWheelBody = null;
  decompWheelInfo = null;
}

export function queueDecompWheelFrame() {
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

export function paintDecompWheel() {
  if (!decompWheel) return;
  const n = decompWheel.cards.length;
  const spacing = decompWheel.viewport
    ? Math.max(220, decompWheel.viewport.clientWidth * 0.95)
    : 245;
  decompWheel.cards.forEach((card, i) => {
    let raw = i - decompWheel.pos;
    let off = ((raw + n / 2) % n + n) % n - n / 2;
    const ao = Math.abs(off);
    const angle = Math.max(-28, Math.min(28, -off * 20));
    const x = off * spacing;
    const z = -Math.min(ao * 50, 100);
    const scale = Math.max(0.86, 1 - 0.14 * ao);
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
  if (typeof decompWheel.onMethodChange === "function") {
    decompWheel.onMethodChange(newKey);
  }
}

export function setDecompWheelTarget(idx) {
  if (!decompWheel) return;
  decompWheel.target = idx;
  queueDecompWheelFrame();
}

export function buildDecompWheel(container, ch, initialMethod, dictionaries, callbacks = {}) {
  const startIdx = Math.max(0, methodIndex(initialMethod));
  container.innerHTML =
    `<span class="decomp-wheel" role="group" aria-label="拆字輸入法滾輪：倉頡、嘸蝦米、速成">` +
    `<span class="decomp-wheel-track"></span></span>` +
    `<span class="decomp-wheel-nav">` +
    `<button type="button" class="decomp-wheel-prev" aria-label="上一個輸入法" tabindex="-1">‹</button>` +
    `<button type="button" class="decomp-wheel-next" aria-label="下一個輸入法" tabindex="-1">›</button>` +
    `</span>`;
  const viewport = container.querySelector(".decomp-wheel");
  const track = container.querySelector(".decomp-wheel-track");
  const cards = DECOMP_METHODS.map((m) => {
    const card = document.createElement("span");
    card.className = "decomp-wheel-card";
    card.dataset.method = m.key;
    card.innerHTML = decompositionCardHTML(ch, m.key, dictionaries);
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
    onMethodChange: callbacks.onMethodChange
  };
  decompWheelChar = ch;
  decompWheelBody = `${methodLabel(initialMethod)} ${ch}`;
  decompWheelInfo = true;
  paintDecompWheel();
  queueDecompWheelFrame();
}

export function updateDecompWheelCardText(dictionaries) {
  if (!decompWheel) return;
  decompWheel.cards.forEach((card) => {
    card.innerHTML = decompositionCardHTML(decompWheelChar, card.dataset.method, dictionaries);
  });
}

export function setDecompWheelChar(ch) {
  decompWheelChar = ch;
}

export function bindDecompWheelEvents(cangjieHint, callbacks = {}) {
  if (!cangjieHint || cangjieHint.dataset.decompBound) return;
  cangjieHint.dataset.decompBound = "1";

  cangjieHint.addEventListener("click", (e) => {
    const importBtn = e.target.closest(".decomp-import-btn");
    const reloadBtn = e.target.closest(".decomp-reload-btn");
    if (importBtn || reloadBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof callbacks.openBoshiamyModal === "function") callbacks.openBoshiamyModal();
      return;
    }
    const prev = e.target.closest(".decomp-wheel-prev");
    const next = e.target.closest(".decomp-wheel-next");
    if (prev) {
      e.preventDefault();
      setDecompWheelTarget(Math.round(decompWheel ? decompWheel.target : 0) - 1);
      if (typeof callbacks.focusCurrent === "function") callbacks.focusCurrent();
      return;
    }
    if (next) {
      e.preventDefault();
      setDecompWheelTarget(Math.round(decompWheel ? decompWheel.target : 0) + 1);
      if (typeof callbacks.focusCurrent === "function") callbacks.focusCurrent();
      return;
    }
  });

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
      setDecompWheelTarget(Math.round(decompWheel.pos + decompWheel.velocity * 0.15));
    } else if (e) {
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
    if (typeof callbacks.focusCurrent === "function") callbacks.focusCurrent();
    setTimeout(() => { if (decompWheel) decompWheel.moved = false; }, 0);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

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
