// js/decomp-wheel.js — 拆字與鍵位提示（注音 / 倉頡 / 嘸蝦米 / 速成）3D 橫向反向環滾輪模組

import { CANGJIE_RADICAL, BOPOMOFO_TO_KEY, PUNCT_KEY_MAP } from "./constants.js";

export const DECOMP_METHODS = [
  { key: "bopomofo", label: "注音", dataKey: "zhuyin" },
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
  const { BOSHIAMY, CANGJIE, ZHUYIN } = dictionaries;
  if (method === "bopomofo") {
    if (!ZHUYIN) return { missing: "字庫未載入" };
    const zy = (ZHUYIN.chars ? ZHUYIN.chars[ch] : ZHUYIN[ch]) || null;
    if (!zy) return { missing: "查無注音" };
    const rawSymbols = Array.from(zy);
    const keys = [];
    let hasTone = false;
    rawSymbols.forEach((sym) => {
      if (BOPOMOFO_TO_KEY[sym]) {
        if (/[ˊˇˋ˙]/.test(sym)) hasTone = true;
        keys.push(BOPOMOFO_TO_KEY[sym]);
      }
    });
    if (!hasTone) {
      keys.push("Space");
    }
    return {
      code: keys.join(" "),
      radicals: rawSymbols.join(" "),
      zhuyin: zy
    };
  }
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
  if (methodKey === "bopomofo") {
    return `<span class="decomp-name">${label}</span> <strong>${ch}</strong> ： <span class="cj-radicals">${dec.radicals}</span> <span class="cj-code">${dec.code}</span>`;
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

function shortestDistance(from, to, n) {
  const rawDiff = ((to - from) % n + n) % n;
  return rawDiff > n / 2 ? rawDiff - n : rawDiff;
}

function decompWheelFrame() {
  if (!decompWheel) return;
  decompWheel.raf = null;
  if (!decompWheel.dragging) {
    const diff = decompWheel.target - decompWheel.pos;
    if (Math.abs(diff) > 0.004) {
      decompWheel.pos += diff * 0.32;
    } else {
      decompWheel.pos = decompWheel.target;
    }
  }
  try {
    paintDecompWheel();
  } catch (err) {
    console.error("paintDecompWheel error:", err);
  }
  const settled = !decompWheel.dragging && Math.abs(decompWheel.target - decompWheel.pos) <= 0.004;
  if (settled) {
    const n = decompWheel.cards.length;
    const wrapped = ((Math.round(decompWheel.pos) % n) + n) % n;
    decompWheel.pos = wrapped;
    decompWheel.target = wrapped;
    try {
      paintDecompWheel();
    } catch (err) {
      console.error("paintDecompWheel error:", err);
    }
    decompWheel.raf = null;
    const newKey = DECOMP_METHODS[wrapped].key;
    if (typeof decompWheel.onMethodChange === "function") {
      try {
        decompWheel.onMethodChange(newKey);
      } catch (err) {
        console.error("onMethodChange error:", err);
      }
    }
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
}

export function setDecompWheelTarget(targetIdx, immediate = false) {
  if (!decompWheel) return;
  decompWheel.dragging = false;
  if (decompWheel.viewport) decompWheel.viewport.classList.remove("dragging");
  const n = decompWheel.cards.length;
  const currentWrapped = ((decompWheel.pos % n) + n) % n;
  const diff = shortestDistance(currentWrapped, targetIdx, n);
  const newTarget = Math.round(decompWheel.pos + diff);
  decompWheel.target = newTarget;
  if (immediate) {
    if (decompWheel.raf != null) {
      cancelAnimationFrame(decompWheel.raf);
      decompWheel.raf = null;
    }
    const wrapped = ((newTarget % n) + n) % n;
    decompWheel.pos = wrapped;
    decompWheel.target = wrapped;
    paintDecompWheel();
    const newKey = DECOMP_METHODS[wrapped].key;
    if (typeof decompWheel.onMethodChange === "function") {
      try {
        decompWheel.onMethodChange(newKey);
      } catch (err) {
        console.error("onMethodChange error:", err);
      }
    }
    return;
  }
  queueDecompWheelFrame();
}

export function setDecompWheelTargetOffset(offset) {
  if (!decompWheel) return;
  decompWheel.dragging = false;
  if (decompWheel.viewport) decompWheel.viewport.classList.remove("dragging");
  decompWheel.target = Math.round(decompWheel.pos) + offset;
  queueDecompWheelFrame();
}

export function buildDecompWheel(container, ch, initialMethod, dictionaries, callbacks = {}) {
  const startIdx = Math.max(0, methodIndex(initialMethod));
  container.innerHTML =
    `<span class="decomp-wheel" role="group" aria-label="拆字輸入法滾輪：注音、倉頡、嘸蝦米、速成" tabindex="0">` +
    `<span class="decomp-wheel-track"></span></span>` +
    `<span class="decomp-wheel-nav">` +
    `<button type="button" class="decomp-wheel-prev" aria-label="上一個輸入法">‹</button>` +
    `<button type="button" class="decomp-wheel-next" aria-label="下一個輸入法">›</button>` +
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
    const prev = e.target.closest(".decomp-wheel-prev");
    const next = e.target.closest(".decomp-wheel-next");
    if (prev) {
      e.preventDefault();
      setDecompWheelTargetOffset(-1);
      if (typeof callbacks.focusCurrent === "function") callbacks.focusCurrent();
      return;
    }
    if (next) {
      e.preventDefault();
      setDecompWheelTargetOffset(1);
      if (typeof callbacks.focusCurrent === "function") callbacks.focusCurrent();
      return;
    }

    const reloadBtn = e.target.closest(".decomp-reload-btn");
    const importBtn = e.target.closest(".decomp-import-btn");

    if (importBtn || reloadBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof callbacks.openBoshiamyModal === "function") callbacks.openBoshiamyModal();
      return;
    }
  });

  cangjieHint.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const reloadBtn = e.target.closest(".decomp-reload-btn");
      const importBtn = e.target.closest(".decomp-import-btn");
      if (importBtn || reloadBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof callbacks.openBoshiamyModal === "function") callbacks.openBoshiamyModal();
      }
    }
  });

  cangjieHint.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    const vp = e.target.closest(".decomp-wheel");
    if (!vp || !decompWheel) return;
    decompWheel.dragging = true;
    decompWheel.moved = false;
    decompWheel.captured = false;
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
    if (Math.abs(dx) > 5) {
      decompWheel.moved = true;
      if (!decompWheel.captured && decompWheel.viewport && decompWheel.viewport.setPointerCapture) {
        try {
          decompWheel.viewport.setPointerCapture(e.pointerId);
          decompWheel.captured = true;
        } catch (_) {}
      }
    }
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
    if (decompWheel.captured && e && e.pointerId != null && decompWheel.viewport) {
      try {
        decompWheel.viewport.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    decompWheel.captured = false;
    decompWheel.dragging = false;
    if (decompWheel.viewport) decompWheel.viewport.classList.remove("dragging");
    const now = performance.now();
    if (now - decompWheel.lastT > 80) {
      decompWheel.velocity = 0;
    }
    if (decompWheel.moved) {
      decompWheel.target = Math.round(decompWheel.pos + decompWheel.velocity * 0.15);
      queueDecompWheelFrame();
    } else if (e) {
      const card = e.target.closest(".decomp-wheel-card");
      const vp = e.target.closest(".decomp-wheel");
      if (card) {
        const targetMethod = card.dataset.method;
        const targetIdx = methodIndex(targetMethod);
        if (targetIdx !== -1) {
          setDecompWheelTarget(targetIdx);
        } else {
          decompWheel.target = Math.round(decompWheel.pos);
          queueDecompWheelFrame();
        }
      } else if (vp) {
        const rect = vp.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        if (e.clientX < cx - 35) setDecompWheelTargetOffset(-1);
        else if (e.clientX > cx + 35) setDecompWheelTargetOffset(1);
        else {
          decompWheel.target = Math.round(decompWheel.pos);
          queueDecompWheelFrame();
        }
      } else {
        decompWheel.target = Math.round(decompWheel.pos);
        queueDecompWheelFrame();
      }
    } else {
      decompWheel.target = Math.round(decompWheel.pos);
      queueDecompWheelFrame();
    }
    if (typeof callbacks.focusCurrent === "function") callbacks.focusCurrent();
    setTimeout(() => { if (decompWheel) decompWheel.moved = false; }, 0);
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  cangjieHint.addEventListener("keydown", (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setDecompWheelTargetOffset(-1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setDecompWheelTargetOffset(1);
    }
  });

  window.addEventListener("keydown", (e) => {
    if (!decompWheel) return;
    if (e.isComposing || e.keyCode === 229) return;
    const active = document.activeElement;
    const isHintFocus = active && active.closest && active.closest("#cangjieHint");
    if (isHintFocus) return;
    const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
    if (isInput) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setDecompWheelTargetOffset(e.key === "ArrowUp" ? -1 : 1);
      } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && (!active.value || active.value.length === 0)) {
        e.preventDefault();
        setDecompWheelTargetOffset(e.key === "ArrowLeft" ? -1 : 1);
      }
    }
  });

  cangjieHint.addEventListener("wheel", (e) => {
    if (!decompWheel) return;
    const now = performance.now();
    if (now < decompWheel.wheelLockedUntil) { e.preventDefault(); return; }
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 4) return;
    decompWheel.wheelLockedUntil = now + 180;
    setDecompWheelTargetOffset(delta > 0 ? 1 : -1);
    e.preventDefault();
  }, { passive: false });
}
