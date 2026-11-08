#!/usr/bin/env python3
"""產生 cangjie.json（JustType 倉頡拆字字庫）。

來源：Jackchows/Cangjie5 的 Cangjie5_TC.txt（倉頡五代，台灣用字優先），MIT License。
  https://github.com/Jackchows/Cangjie5
  原始檔：https://raw.githubusercontent.com/Jackchows/Cangjie5/master/Cangjie5_TC.txt

字庫範圍：與 zhuyin.json 的 chars 平行——收錄 zhuyin.json 全部漢字 ∪ data.json
題庫實際出現的漢字，每字取碼表「首次出現的倉頡碼」（即該表字頻排序下的首選碼）。
格式：扁平 JSON 物件 { 漢字: 倉頡碼小寫字母, ... }，例如 { "半": "fq", "謝": "yrhhi" }。
倉頡碼字母對照（a–y 為 24 字根 + x=難，z=重）見 app.js 的 CANGJIE_RADICAL。

用法：
  python3 build_cangjie.py                # 自動下載 Cangjie5_TC.txt 後產生
  python3 build_cangjie.py Cangjie5_TC.txt  # 用本機已下載的碼表產生
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_URL = "https://raw.githubusercontent.com/Jackchows/Cangjie5/master/Cangjie5_TC.txt"


def load_table(path):
    """回傳 {漢字: 倉頡碼}，每字取首次出現的碼。"""
    table = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 2:
                continue
            ch, code = parts[0], parts[1].strip()
            if len(ch) != 1:
                continue
            if not code or not all("a" <= c <= "z" for c in code):
                continue
            if ch not in table:
                table[ch] = code
    return table


def wanted_chars():
    zhuyin = json.load(open(os.path.join(ROOT, "zhuyin.json"), encoding="utf-8"))
    wanted = set((zhuyin.get("chars") or {}).keys())
    data = json.load(open(os.path.join(ROOT, "data.json"), encoding="utf-8"))
    for pool in data.values():
        for item in pool.get("texts", []):
            wanted.update(item.get("text", ""))
    return wanted


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if src is None:
        tmp = os.path.join(ROOT, ".Cangjie5_TC.txt.tmp")
        print(f"下載 {SRC_URL} ...")
        urllib.request.urlretrieve(SRC_URL, tmp)
        src, cleanup = tmp, tmp
    else:
        cleanup = None
    try:
        table = load_table(src)
        wanted = wanted_chars()
        # 依碼表原始順序輸出（按 code 再按字，僅為可重現性；查表不依賴順序）
        out = {ch: table[ch] for ch in table if ch in wanted}
        missing = sorted(ch for ch in wanted if ch not in table)
        dest = os.path.join(ROOT, "cangjie.json")
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
            f.write("\n")
        print(f"碼表總字數: {len(table)}")
        print(f"cangjie.json 寫入: {len(out)} 字, {os.path.getsize(dest)} bytes -> {dest}")
        print(f"未收錄（標點/英數/符號等，練習流程不需倉頡）: {len(missing)}: {''.join(missing)}")
        # 題庫覆蓋率自檢
        data = json.load(open(os.path.join(ROOT, "data.json"), encoding="utf-8"))
        used = set()
        for pool in data.values():
            for item in pool.get("texts", []):
                used.update(item.get("text", ""))
        han_used = [c for c in used if c not in "\n " and not c.isascii()]
        uncovered = [c for c in han_used if c not in out]
        print(f"題庫漢字覆蓋: {len(han_used) - len(uncovered)}/{len(han_used)}，未覆蓋: {''.join(uncovered) or '無'}")
    finally:
        if cleanup and os.path.exists(cleanup):
            os.remove(cleanup)


if __name__ == "__main__":
    main()
