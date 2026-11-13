// js/bottlenecks.js — 卡鍵瓶頸字演算法（純構字延遲分析，三重篩選門檻）

/**
 * 分析打字過程中的卡鍵瓶頸字
 * @param {Array} charLogs 按鍵字元記錄
 * @returns {Array} 前 8 名卡鍵字物件陣列
 */
export function analyzeBottlenecks(charLogs) {
  const validLogs = (charLogs || []).filter((l) => l && l.char && l.char.trim());
  if (!validLogs.length) return [];

  // 確保每筆 log 具備 netDuration（扣除 IME 選字時間後的純構字時間）
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
  // 條件 2: 淨延遲 > Median + 2 * StdDev（統計離群值）
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
  return Array.from(bottleneckMap.values())
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

/**
 * 依卡鍵字產生專項練習文本（卡鍵字按順序重複 3 次）
 * @param {Array<{char: string}>} bottlenecks
 * @returns {string}
 */
export function generateBottleneckDrill(bottlenecks) {
  if (!bottlenecks || !bottlenecks.length) return "";
  const chars = bottlenecks.map((b) => b.char);
  return chars.join("").repeat(3);
}
