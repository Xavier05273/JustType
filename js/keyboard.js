// js/keyboard.js — 虛擬鍵盤構建、按鍵佈局渲染、即時鍵位高亮提示

import {
  ANSI_KEYBOARD_ROWS,
  CANGJIE_RADICAL,
  BOPOMOFO_TO_KEY,
  PUNCT_KEY_MAP,
  CODE_TO_KEY,
} from "./constants.js";

let currentExpectedKey = null;
const flashTimeoutIds = {};

export function getCurrentExpectedKey() {
  return currentExpectedKey;
}

export function clearCurrentExpectedKey() {
  currentExpectedKey = null;
}

export function findOnKbKey(k, onKeyboard) {
  if (!onKeyboard || k == null) return null;
  const target = String(k).toLowerCase();
  const keys = onKeyboard.querySelectorAll(".on-kb-key[data-key]");
  for (const el of keys) {
    if ((el.dataset.key || "").toLowerCase() === target) return el;
  }
  const zhKeys = onKeyboard.querySelectorAll(".on-kb-key[data-zh]");
  for (const el of zhKeys) {
    if (el.dataset.zh === k) return el;
  }
  return null;
}

export function setExpectedKey(keyEl, isSpace, keyChar) {
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

export function clearKeyError(onKeyboard, state) {
  if (onKeyboard) {
    onKeyboard.querySelectorAll(".is-error").forEach((k) => k.classList.remove("is-error"));
  }
  if (state) state.lastKeyError = null;
}

export function flashKeyElement(keyEl, kind) {
  if (!keyEl) return;
  const idKey = keyEl.dataset.code || keyEl.dataset.key || "key";
  if (flashTimeoutIds[idKey]) {
    clearTimeout(flashTimeoutIds[idKey]);
    delete flashTimeoutIds[idKey];
  }
  keyEl.classList.remove("flash-white", "flash-red");
  void keyEl.offsetWidth; // 重新觸發 CSS 動畫
  const cls = (kind === "white" || kind === "flash-white") ? "flash-white" : "flash-red";
  keyEl.classList.add(cls);
  flashTimeoutIds[idKey] = setTimeout(() => {
    keyEl.classList.remove("flash-white", "flash-red");
    delete flashTimeoutIds[idKey];
  }, 320);
}

/**
 * 依版面動態構建虛擬鍵盤 DOM
 */
export function buildOnKeyboard(layout, onKeyboard, callbacks = {}) {
  if (!onKeyboard) return;
  onKeyboard.innerHTML = "";
  onKeyboard.dataset.layout = layout;
  const isBopomofo = layout === "bopomofo";
  const isCangjie = layout === "cangjie";
  const isBoshiamy = layout === "boshiamy";
  const isSucheng = layout === "sucheng";

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
        if (typeof callbacks.onKeyPointerDown === "function") {
          callbacks.onKeyPointerDown(item, key);
        }
      });

      rowEl.appendChild(key);
    });
    onKeyboard.appendChild(rowEl);
  });
}
