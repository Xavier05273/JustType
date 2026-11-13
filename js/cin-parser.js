// js/cin-parser.js — 嘸蝦米 .cin 碼表本地解析器

/**
 * 將 .cin 檔案內容或碼表文字解析為字元映射：{ [char]: shortest_code }
 * @param {string} text .cin 檔案文本
 * @returns {Record<string, string> | null} 碼表對照物件或 null
 */
export function parseCinTable(text) {
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
