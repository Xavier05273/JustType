// js/queue.js — 題庫隊列與 Fisher-Yates 洗牌演算法

export const QUEUE = {}; // modeKey -> { order: [itemId,...], cursor: n }

// Fisher-Yates 原地隨機置亂
export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 建立某模式的隨機題目隊列
export function buildQueue(modeKey, MODES, DATA) {
  const mode = MODES.find((m) => m.key === modeKey);
  if (!mode || !DATA || !DATA[mode.dataKey]) return [];
  const items = DATA[mode.dataKey].texts;
  const order = shuffleArray(items.map((it) => it.id));
  QUEUE[modeKey] = { order, cursor: 0 };
  return order;
}

// 從 queue 取下一題：整輪零重複，吃完才重洗；跨邊界擋連續重複
export function nextFromQueue(modeKey, MODES, DATA, loadJSON, saveJSON, LS_LAST) {
  const mode = MODES.find((m) => m.key === modeKey);
  if (!mode || !DATA || !DATA[mode.dataKey]) return null;
  const items = DATA[mode.dataKey].texts;
  const byId = new Map(items.map((it) => [it.id, it]));
  let q = QUEUE[modeKey];
  if (!q || q.cursor >= q.order.length) buildQueue(modeKey, MODES, DATA);
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
