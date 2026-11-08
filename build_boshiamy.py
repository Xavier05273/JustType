#!/usr/bin/env python3
"""產生 boshiamy.json（JustType 嘸蝦米拆字字庫）。

來源：chinese-opendesktop/cin-tables 的 boshiamy.cin（行易嘸蝦米碼表，
格式由趙惟倫轉換；檔案標示 Free for non-commercial use）。
  https://github.com/chinese-opendesktop/cin-tables
  原始檔：https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/master/boshiamy.cin

字庫範圍：與 cangjie.json / zhuyin.json 平行的「常用字」子集——收錄
cin 表中實際出現的字（約 13.5k 字），每字取「最短碼」為首選
（同長取碼表出現較早者）。格式：扁平 JSON 物件 { 漢字: 嘸蝦米碼小寫, ... }，
例如 { "半": "bj", "謝": "isa" }。嘸蝦米字根數量多於倉頡、碼長較短，
故同一字碼長通常比倉頡短（半 fq vs bj、謝 yrhhi vs isa）。

與 cangjie.json 的差別：倉頡表收 41,857 字（含生僻），嘸蝦米 cin 表只收
13,563 字；題庫（data.json）實際用的 1,464 個漢字中除「⋯」外全覆蓋。
練習流程不需生僻字，查無拆字時 UI 會顯示「（查無拆字）」。

用法：
  python3 build_boshiamy.py                  # 自動下載 boshiamy.cin 後產生
  python3 build_boshiamy.py boshiamy.cin     # 用本機已下載的碼表產生
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_URL = "https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/master/boshiamy.cin"


def load_table(path):
    """回傳 {漢字: 最短嘸蝦米碼}。"""
    table = {}
    in_def = False
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            s = line.strip()
            if s == "%chardef begin":
                in_def = True
                continue
            if s == "%chardef end":
                in_def = False
                continue
            if not in_def or not s or s.startswith("#"):
                continue
            parts = s.split()
            if len(parts) < 2:
                continue
            code = parts[0].lower()
            if not code or not all("a" <= c <= "z" for c in code):
                continue
            for ch in parts[1]:
                if len(ch) != 1:
                    continue
                # 最短碼勝出；同長保留先出現者
                if ch not in table or len(code) < len(table[ch]):
                    table[ch] = code
    return table


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if src is None:
        tmp = os.path.join(ROOT, ".boshiamy.cin.tmp")
        print(f"下載 {SRC_URL} ...")
        urllib.request.urlretrieve(SRC_URL, tmp)
        src, cleanup = tmp, tmp
    else:
        cleanup = None
    try:
        table = load_table(src)
        dest = os.path.join(ROOT, "boshiamy.json")
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(table, f, ensure_ascii=False, separators=(",", ":"))
            f.write("\n")
        print(f"碼表總字數: {len(table)}")
        print(f"boshiamy.json 寫入: {len(table)} 字, {os.path.getsize(dest)} bytes -> {dest}")
        # 題庫覆蓋率自檢
        data = json.load(open(os.path.join(ROOT, "data.json"), encoding="utf-8"))
        used = set()
        for pool in data.values():
            for item in pool.get("texts", []):
                used.update(item.get("text", ""))
        han_used = [c for c in used if c not in "\n " and not c.isascii()]
        uncovered = [c for c in han_used if c not in table]
        print(f"題庫漢字覆蓋: {len(han_used) - len(uncovered)}/{len(han_used)}，未覆蓋: {''.join(uncovered) or '無'}")
        # 已知字抽查：申 iqi（另有 2 碼簡碼 ii，取最短故為 ii）、感 ah、對 a、機 g
        for ch, expect in [("申", "ii"), ("感", "ah"), ("對", "a"), ("機", "g"), ("半", "bj"), ("謝", "isa")]:
            got = table.get(ch)
            print(f"  抽查 {ch}: {got} (預期 {expect}) {'OK' if got == expect else '注意'}")
    finally:
        if cleanup and os.path.exists(cleanup):
            os.remove(cleanup)


if __name__ == "__main__":
    main()
