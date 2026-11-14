#!/usr/bin/env python3
"""產生 zhuyin.json（JustType 國語注音字庫）。

來源：政府資料開放平臺 CNS11643 中文標準交換碼全字庫（https://data.gov.tw/dataset/5961）
  - 屬性資料：https://data.cns11643.gov.tw/opendata/Properties.zip (CNS_phonetic.txt)
  - 碼表對照：https://data.cns11643.gov.tw/opendata/MapingTables.zip (Unicode/CNS2UNICODE_*.txt)

授權：政府資料開放授權條款-第1版（Open Government Data License, version 1.0）
  依條款規定任何人皆得自由利用、改作與散布。

用法：
  python3 build_zhuyin.py                # 自動下載全字庫資料並產生
  python3 build_zhuyin.py /path/to/cns   # 指定已解壓全字庫目錄產生
"""
import glob
import json
import os
import sys
import urllib.request
import zipfile
from collections import defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")
PROPERTIES_URL = "https://data.cns11643.gov.tw/opendata/Properties.zip"
MAPING_URL = "https://data.cns11643.gov.tw/opendata/MapingTables.zip"

# 臺灣在地常用語意破音字首選偏好（對齊教育部重編國語辭典 / 臺灣大眾規範讀音）
TAIWAN_PREF = {
    "圾": "ㄙㄜˋ",       # 垃圾（ㄌㄜˋ ㄙㄜˋ）
    "微": "ㄨㄟˊ",       # 微笑、微妙（ㄨㄟˊ）
    "質": "ㄓˊ",         # 品質、物質（ㄓˊ）
    "攜": "ㄒㄧ",         # 攜帶（ㄒㄧ）
    "識": "ㄕˋ",         # 知識、認識（ㄕˋ）
    "期": "ㄑㄧˊ",       # 期待、星期（ㄑㄧˊ）
    "蚵": "ㄜˊ",         # 蚵仔（ㄜˊ）
    "泊": "ㄅㄛˊ",       # 停泊、漂泊（ㄅㄛˊ）
    "昔": "ㄒㄧˊ",       # 往昔（ㄒㄧˊ）
    "諷": "ㄈㄥˋ",       # 諷刺（ㄈㄥˋ）
    "浣": "ㄏㄨㄢˇ",     # 浣熊（ㄏㄨㄢˇ）
    "郄": "ㄒㄧˋ",       # 郄（ㄒㄧˋ）
    "和": "ㄏㄜˊ",       # 和平、我和你（ㄏㄜˊ）
    "行": "ㄒㄧㄥˊ",     # 行走、行動（ㄒㄧㄥˊ）
    "重": "ㄓㄨㄥˋ",     # 重要、重量（ㄓㄨㄥˋ）
    "會": "ㄏㄨㄟˋ",     # 開會、會議（ㄏㄨㄟˋ）
    "得": "ㄉㄜˊ",       # 得到、獲得（ㄉㄜˊ）
    "地": "ㄉㄧˋ",       # 地方、土地（ㄉㄧˋ）
    "長": "ㄔㄤˊ",       # 長度、長短（ㄔㄤˊ）
    "沒": "ㄇㄟˊ",       # 沒有（ㄇㄟˊ）
    "給": "ㄍㄟˇ",       # 送給（ㄍㄟˇ）
    "著": "ㄓㄜ˙",       # 看著、走著（ㄓㄜ˙）
    "的": "ㄉㄜ˙",       # 我的、好的（ㄉㄜ˙）
    "了": "ㄌㄜ˙",       # 好了、來了（ㄌㄜ˙）
    "麼": "ㄇㄜ˙",       # 什麼（ㄇㄜ˙）
}


def load_cns_unicode_maps(base_dir):
    """讀取 CNS 對應至 Unicode 的對照表"""
    cns_to_char = {}
    pattern = os.path.join(base_dir, "Unicode", "CNS2UNICODE_*.txt")
    files = glob.glob(pattern)
    if not files:
        pattern = os.path.join(base_dir, "**", "CNS2UNICODE_*.txt")
        files = glob.glob(pattern, recursive=True)
    for path in files:
        with open(path, encoding="utf-8", errors="ignore") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    cns, uhex = parts[0], parts[1]
                    try:
                        cns_to_char[cns] = chr(int(uhex, 16))
                    except ValueError:
                        pass
    return cns_to_char


def load_cns_phonetics(phonetic_path, cns_to_char):
    """讀取 CNS 注音對照表，並將輕聲記號 ˙ 移至字尾"""
    char_to_phonetics = defaultdict(list)
    with open(phonetic_path, encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                cns, bopomofo = parts[0], parts[1]
                if cns in cns_to_char:
                    ch = cns_to_char[cns]
                    # 輕聲符號 ˙ 移至字尾以符合臺灣標準鍵盤敲鍵習慣
                    if bopomofo.startswith("˙"):
                        bopomofo = bopomofo[1:] + "˙"
                    if bopomofo not in char_to_phonetics[ch]:
                        char_to_phonetics[ch].append(bopomofo)
    return char_to_phonetics


def build_zhuyin_dict(char_to_phonetics, old_chars=None):
    """為每個漢字決定標準注音讀音"""
    res = {}
    for ch, phones in char_to_phonetics.items():
        if len(phones) == 1:
            res[ch] = phones[0]
        else:
            # 優先採用臺灣偏好表
            if ch in TAIWAN_PREF and TAIWAN_PREF[ch] in phones:
                res[ch] = TAIWAN_PREF[ch]
            elif old_chars and ch in old_chars and old_chars[ch] in phones:
                res[ch] = old_chars[ch]
            else:
                res[ch] = phones[0]
    return res


def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else None
    cleanup_dirs = []

    if not target_dir or not os.path.exists(target_dir):
        tmp_dir = os.path.join(ROOT, ".cns_opendata_tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        cleanup_dirs.append(tmp_dir)

        prop_zip = os.path.join(tmp_dir, "Properties.zip")
        map_zip = os.path.join(tmp_dir, "MapingTables.zip")

        print(f"正在下載全字庫屬性資料: {PROPERTIES_URL} ...")
        urllib.request.urlretrieve(PROPERTIES_URL, prop_zip)
        with zipfile.ZipFile(prop_zip) as z:
            z.extractall(tmp_dir)

        print(f"正在下載全字庫對照表: {MAPING_URL} ...")
        urllib.request.urlretrieve(MAPING_URL, map_zip)
        with zipfile.ZipFile(map_zip) as z:
            z.extractall(tmp_dir)

        target_dir = tmp_dir

    try:
        print("解析 CNS2UNICODE 碼表...")
        cns_to_char = load_cns_unicode_maps(target_dir)
        print(f"CNS 映射字元總數: {len(cns_to_char)}")

        phonetic_path = os.path.join(target_dir, "CNS_phonetic.txt")
        if not os.path.exists(phonetic_path):
            found = glob.glob(os.path.join(target_dir, "**/CNS_phonetic.txt"), recursive=True)
            if found:
                phonetic_path = found[0]

        print(f"解析注音資料表: {phonetic_path} ...")
        char_to_phones = load_cns_phonetics(phonetic_path, cns_to_char)
        print(f"收錄注音之漢字數: {len(char_to_phones)}")

        # 讀取舊注音庫以保留合理的歷史單字選擇
        old_path = os.path.join(DATA_DIR, "zhuyin.json")
        old_chars = {}
        old_phrases = {}
        if os.path.exists(old_path):
            try:
                with open(old_path, encoding="utf-8") as f:
                    old_data = json.load(f)
                    old_chars = old_data.get("chars", old_data)
                    old_phrases = old_data.get("phrases", {})
            except Exception:
                pass

        new_chars = build_zhuyin_dict(char_to_phones, old_chars)

        # 題庫覆蓋度檢驗
        data_path = os.path.join(DATA_DIR, "data.json")
        data = json.load(open(data_path, encoding="utf-8"))
        used = set()
        for pool in data.values():
            for item in pool.get("texts", []):
                used.update(item.get("text", ""))

        import unicodedata
        han_used = [c for c in used if "\u4e00" <= c <= "\u9fff" or unicodedata.category(c) == "Lo"]
        uncovered = [c for c in han_used if c not in new_chars]
        print(f"題庫漢字覆蓋率: {len(han_used) - len(uncovered)} / {len(han_used)}")
        if uncovered:
            print("未覆蓋漢字:", "".join(uncovered))

        # 更新常用片語（如「倒垃圾」改為「ㄌㄜˋ ㄙㄜˋ」）
        new_phrases = {}
        for p, syms in old_phrases.items():
            new_syms = [new_chars.get(c, syms[idx] if idx < len(syms) else "") for idx, c in enumerate(p)]
            new_phrases[p] = new_syms
        new_phrases["垃圾"] = ["ㄌㄜˋ", "ㄙㄜˋ"]
        new_phrases["倒垃圾"] = ["ㄉㄠˋ", "ㄌㄜˋ", "ㄙㄜˋ"]

        out_data = {
            "chars": new_chars,
            "phrases": new_phrases
        }

        dest = os.path.join(DATA_DIR, "zhuyin.json")
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(out_data, f, ensure_ascii=False, separators=(",", ":"))
            f.write("\n")

        print(f"zhuyin.json 寫入完成: {len(new_chars)} 字, 檔案大小 {os.path.getsize(dest)} bytes -> {dest}")

    finally:
        for d in cleanup_dirs:
            if os.path.exists(d):
                import shutil
                shutil.rmtree(d, ignore_errors=True)


if __name__ == "__main__":
    main()
