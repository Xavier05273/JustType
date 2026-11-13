// js/storage.js — LocalStorage 與 IndexedDB 資料存取模組

import { LS_BEST, LS_HIST } from "./constants.js";

// ---- LocalStorage 輔助函式 ----
export function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// 讀取並過濾個人最佳成績（防禦異常數值）
export function loadBest() {
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

// 讀取練習歷史紀錄
export function loadHist() {
  const hist = loadJSON(LS_HIST, []);
  const cleaned = hist.filter((h) => h && h.wpm <= 450 && h.wpm > 0);
  if (cleaned.length !== hist.length) saveJSON(LS_HIST, cleaned);
  return cleaned;
}

// ---- IndexedDB Helper for Boshiamy Table & Large Dictionaries ----
export const IDB_NAME = "justtype_db";
export const IDB_VERSION = 1;
export const IDB_STORE = "tables";
export const IDB_KEY_BOSHIAMY = "boshiamy";
export const IDB_KEY_ZHUYIN = "zhuyin";
export const IDB_KEY_CANGJIE = "cangjie";

export function openIndexedDB() {
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

export async function loadTableFromIDB(key) {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveTableToIDB(key, table) {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(table, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export async function fetchOrLoadCached(key, url) {
  const cached = await loadTableFromIDB(key);
  if (cached) return cached;
  try {
    const r = await fetch(url);
    const data = await r.json();
    saveTableToIDB(key, data);
    return data;
  } catch {
    return null;
  }
}

export async function loadBoshiamyFromIDB() {
  return loadTableFromIDB(IDB_KEY_BOSHIAMY);
}

export async function saveBoshiamyToIDB(table) {
  return saveTableToIDB(IDB_KEY_BOSHIAMY, table);
}
