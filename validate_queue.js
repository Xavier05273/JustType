// validate_queue.js — 抽題隊列回歸門（從 app.js 擷取 queue 三函數來跑，跑真碼）
// 用法：node validate_queue.js
//
// 解法：把三函數擷取出來包進 new Function，參數注入 QUEUE / LS_LAST /
// loadJSON / saveJSON / DATA / MODES——即 app.js IIFE 內的閉包環境。
// 不是複製原型：改 app.js 時本門自動跟着跑真碼。

"use strict";
const fs = require("fs");
const assert = require("assert");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "app.js"), "utf-8");

function extractFn(name) {
  const start = src.indexOf("function " + name + "(");
  assert(start >= 0, `app.js 找不到 function ${name}（改名或刪除？）`);
  const brace = src.indexOf("{", start);
  let depth = 0;
  for (let j = brace; j < src.length; j++) {
    if (src[j] === "{") depth++;
    if (src[j] === "}") {
      depth--;
      if (depth === 0) return src.slice(start, j + 1);
    }
  }
  throw new Error(`function ${name} 大括號不平衡`);
}

assert(src.includes("const QUEUE = {}"), "app.js 缺 QUEUE 常數");
assert(!src.includes("function pick("), "app.js 還有殘留舊 pick()");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "data.json"), "utf-8"));
const MODES = [
  { key: "words", dataKey: "words" },
  { key: "sentences", dataKey: "sentences" },
  { key: "articles_punct", dataKey: "articles_punct" },
  { key: "long_articles", dataKey: "long_articles" },
  { key: "life_situations", dataKey: "life_situations" },
  { key: "mixed_zh_en", dataKey: "mixed_zh_en" },
  { key: "general_legal_docs", dataKey: "general_legal_docs" },
  { key: "litigation_legal_docs", dataKey: "litigation_legal_docs" },
  { key: "classical_texts", dataKey: "classical_texts" },
];

const LS_LAST = "tp-lite-last-v1";
const store = {};
const loadJSON = (k, d) => (store[k] ? JSON.parse(store[k]) : JSON.parse(JSON.stringify(d)));
const saveJSON = (k, v) => { store[k] = JSON.stringify(v); };
const QUEUE = {};

// 把三函數包進 new Function，注入閉包環境（複刻 app.js IIFE 的作用域）
const queueSrc = [extractFn("shuffleArray"), extractFn("buildQueue"), extractFn("nextFromQueue")].join("\n");
const factory = new Function("QUEUE", "LS_LAST", "loadJSON", "saveJSON", "DATA", "MODES",
  queueSrc + "\nreturn { shuffleArray, buildQueue, nextFromQueue };");
const { shuffleArray, buildQueue, nextFromQueue } = factory(QUEUE, LS_LAST, loadJSON, saveJSON, DATA, MODES);

function resetMode(modeKey) {
  delete QUEUE[modeKey];
  delete store[LS_LAST];
}

// (1) sentences（115 題池）115 連抽零重複 + 第 116 題跨邊界不同題
{
  resetMode("sentences");
  const seen = new Set();
  let prev = null;
  for (let i = 0; i < 116; i++) {
    const item = nextFromQueue("sentences");
    if (i < 115) {
      assert(!seen.has(item.id), `sentences 第 ${i} 抽重複: ${item.id}`);
      seen.add(item.id);
    } else {
      assert(item.id !== prev, "sentences 跨重洗邊界連續重複");
    }
    prev = item.id;
  }
  console.log("PASS sentences: 115 題整池零重複、跨邊界第 116 題不同題");
}

// (2) words（494 題池）494 連抽零重複 + 第 495 題跨邊界不同題
{
  resetMode("words");
  const seen = new Set();
  let prev = null;
  for (let i = 0; i < 495; i++) {
    const item = nextFromQueue("words");
    if (i < 494) {
      assert(!seen.has(item.id), `words 第 ${i} 抽重複: ${item.id}`);
      seen.add(item.id);
    } else {
      assert(item.id !== prev, "words 跨重洗邊界連續重複");
    }
    prev = item.id;
  }
  console.log("PASS words: 494 題整池零重複、跨邊界第 495 題不同題");
}

// (3) LS_LAST skip：把 LS_LAST 設定為 queue 首題 id → nextFromQueue 應 skip 回傳第二題
{
  resetMode("classical_texts");
  buildQueue("classical_texts");
  store[LS_LAST] = JSON.stringify({ classical_texts: QUEUE["classical_texts"].order[0] });
  const got = nextFromQueue("classical_texts");
  assert.strictEqual(got.id, QUEUE["classical_texts"].order[1], "LS_LAST=首題時應 skip 到第二題");
  console.log("PASS LS_LAST skip: 首題與上一題相同時跳過");
}

// (4) 小池 articles_punct（30 題）30 連抽零重複 + 第 31 題跨邊界不同題
{
  resetMode("articles_punct");
  const seen = new Set();
  let prev = null;
  for (let i = 0; i < 31; i++) {
    const item = nextFromQueue("articles_punct");
    if (i < 30) {
      assert(!seen.has(item.id), `articles_punct 第 ${i} 抽重複: ${item.id}`);
      seen.add(item.id);
    } else {
      assert(item.id !== prev, "articles_punct 跨重洗邊界連續重複");
    }
    prev = item.id;
  }
  console.log("PASS articles_punct: 30 題整池零重複、31 題跨邊界不同題");
}

console.log("\nALL PASS");
