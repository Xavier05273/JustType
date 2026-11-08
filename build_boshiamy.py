#!/usr/bin/env python3
"""產生 boshiamy.json（JustType 嘸蝦米拆字字庫）。

來源：fcitx/fcitx5-table-extra 的 tables/boshiamy.txt
License：GNU General Public License v3.0 or later (GPL-3.0-or-later)。
專案授權：JustType 自身程式碼與文件為 MIT License（根目錄 LICENSE）。
注意：本字庫是由 GPLv3+ 來源衍生的資料，必須保留 GPL 授權；MIT 根授權
不適用於這個字庫，不得將 boshiamy.json 改標為 MIT。

  https://github.com/fcitx/fcitx5-table-extra
  原始檔：https://raw.githubusercontent.com/fcitx/fcitx5-table-extra/master/tables/boshiamy.txt
  GPL 原文：LICENSES/GPL-3.0-or-later.txt

字庫範圍：收錄來源表中實際出現的單字，每字取「最短碼」為首選
（同長取碼表出現較早者），與舊版 cin-tables 選碼邏輯一致。
格式：扁平 JSON 物件 { 漢字: 嘸蝦米碼小寫, ... }，
例如 { "半": "bj", "謝": "isa" }。

用法：
  python3 build_boshiamy.py                  # 自動下載 boshiamy.txt 後產生
  python3 build_boshiamy.py boshiamy.txt     # 用本機已下載的碼表產生
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_URL = "https://raw.githubusercontent.com/fcitx/fcitx5-table-extra/master/tables/boshiamy.txt"


def load_table(path):
    """回傳 {漢字: 最短嘸蝦米碼}。"""
    table = {}
    with open(path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 2:
                continue
            code, ch = parts[0].lower(), parts[1]
            if len(ch) != 1:
                continue
            if not code or not all("a" <= c <= "z" for c in code):
                continue
            # 最短碼勝出；同長保留先出現者
            if ch not in table or len(code) < len(table[ch]):
                table[ch] = code
    return table


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if src is None:
        tmp = os.path.join(ROOT, ".boshiamy.txt.tmp")
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
        for ch, expect in [("申", "ii"), ("感", "ah"), ("對", "a"), ("機", "g"), ("半", "bj"), ("謝", "isa")]:
            got = table.get(ch)
            print(f"  抽查 {ch}: {got} (預期 {expect}) {'OK' if got == expect else '注意'}")
    finally:
        if cleanup and os.path.exists(cleanup):
            os.remove(cleanup)


if __name__ == "__main__":
    main()
