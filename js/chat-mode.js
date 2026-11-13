// js/chat-mode.js — 生活情境題（LINE 回合對話）解析與狀態機

import { ME } from "./constants.js";

/**
 * 解析 LINE 對話文本：
 * 格式如 "阿哲：……我：……"
 * 匹配以「名字：」開頭的發言段落
 */
export function parseChatMessages(text) {
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

/**
 * 依題目構建對話段落狀態
 */
export function buildChatState(item) {
  const segs = parseChatMessages(item.text).map((s) => ({
    speaker: s.speaker,
    isMe: s.speaker === ME,
    text: Array.from(item.text).slice(s.contentStart, s.end).join(""),
  }));
  return {
    chatSegs: segs,
    chatVisible: 0, // 初始空白，對手氣泡浮現時才 +1
  };
}
