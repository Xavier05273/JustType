import unittest
import subprocess
import time
from playwright.sync_api import sync_playwright

class TestBugFixes(unittest.TestCase):
    def test_bug1_mistyped_char_and_bug2_round2_wpm(self):
        port = "8098"
        server = subprocess.Popen(["python3", "serve.py", port])
        time.sleep(1)

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(f"http://127.0.0.1:{port}/")

                # 等待主程式與資料初始化完成
                page.wait_for_selector(".mode-card")

                # ====================================================
                # 測試 1: 在選字緩衝區（IME 組字中）即時推進、對字變綠、錯字變紅、游標與拆字前進
                # ====================================================
                page.evaluate("""() => {
                    window.startRound("words");
                    const s = window.getState();
                    s.lines = ["今天天氣很好"];
                    s.inputs = [""];
                    s.lineIdx = 0;
                    document.getElementById("targetBox").innerHTML = `
                        <div class="target-line current-line" data-line="0">
                            <span class="char current" data-pos="0">今</span>
                            <span class="char pending" data-pos="1">天</span>
                            <span class="char pending" data-pos="2">天</span>
                            <span class="char pending" data-pos="3">氣</span>
                            <span class="char pending" data-pos="4">很</span>
                            <span class="char pending" data-pos="5">好</span>
                        </div>
                    `;
                }""")

                # 模擬進入 IME 組字狀態（選字緩衝區）
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.dispatchEvent(new Event("compositionstart", { bubbles: true }));
                    // 緩衝區輸入第一個字 '今'（尚未按 Enter 確認）
                    inp.value = "今";
                    inp.dispatchEvent(new Event("compositionupdate", { bubbles: true }));
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                }""")

                status_comp1 = page.evaluate("""() => {
                    const c0 = document.querySelector('.target-line[data-line="0"] .char[data-pos="0"]');
                    const c1 = document.querySelector('.target-line[data-line="0"] .char[data-pos="1"]');
                    return {
                        c0: c0.className,
                        c1: c1.className,
                        hint: document.getElementById("cangjieHint").textContent
                    };
                }""")
                self.assertIn("correct", status_comp1["c0"], "選字緩衝區中構建出的'今'必須標記為 correct")
                self.assertIn("current", status_comp1["c1"], "選字緩衝區中第 1 個字'天'必須前進為 current 游標")
                self.assertIn("天", status_comp1["hint"], "選字緩衝區中拆字提示應即時前進到第 1 個字'天'")

                # 在緩衝區中輸入未完成的注音符號 'ㄊㄧㄢ'（不應誤判為字元或錯字，游標應停在'天'）
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.value = "今ㄊㄧㄢ";
                    inp.dispatchEvent(new Event("compositionupdate", { bubbles: true }));
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                }""")
                status_comp_preedit = page.evaluate("""() => {
                    const c1 = document.querySelector('.target-line[data-line="0"] .char[data-pos="1"]');
                    return c1.className;
                }""")
                self.assertIn("current", status_comp_preedit, "鍵入注音符號時當前待打字仍應維持 current")

                # 注音轉出字元 '今天'
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.value = "今天";
                    inp.dispatchEvent(new Event("compositionupdate", { bubbles: true }));
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                }""")
                status_comp2 = page.evaluate("""() => {
                    const c0 = document.querySelector('.target-line[data-line="0"] .char[data-pos="0"]');
                    const c1 = document.querySelector('.target-line[data-line="0"] .char[data-pos="1"]');
                    const c2 = document.querySelector('.target-line[data-line="0"] .char[data-pos="2"]');
                    return {
                        c0: c0.className,
                        c1: c1.className,
                        c2: c2.className,
                        hint: document.getElementById("cangjieHint").textContent
                    };
                }""")
                self.assertIn("correct", status_comp2["c0"])
                self.assertIn("correct", status_comp2["c1"])
                self.assertIn("current", status_comp2["c2"])
                self.assertIn("天", status_comp2["hint"], "拆字提示推進至第 2 個字'天'")

                # 測試緩衝區打錯字：第 2 個字打錯成 '下' -> "今天下"
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.value = "今天下";
                    inp.dispatchEvent(new Event("compositionupdate", { bubbles: true }));
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                }""")
                status_comp_err = page.evaluate("""() => {
                    const c1 = document.querySelector('.target-line[data-line="0"] .char[data-pos="1"]');
                    const c2 = document.querySelector('.target-line[data-line="0"] .char[data-pos="2"]');
                    const c3 = document.querySelector('.target-line[data-line="0"] .char[data-pos="3"]');
                    return {
                        c1: c1.className,
                        c2: c2.className,
                        c3: c3.className,
                        hint: document.getElementById("cangjieHint").textContent
                    };
                }""")
                self.assertIn("correct", status_comp_err["c1"], "第 1 個字為 correct")
                self.assertIn("error", status_comp_err["c2"], "選字緩衝區中打錯的第 2 個字必須標記為 error 紅色")
                self.assertIn("current", status_comp_err["c3"], "選字緩衝區中打錯字後，下一個字'氣'必須前進為 current")
                self.assertIn("氣", status_comp_err["hint"], "拆字提示必須同步前進至'氣'")

                # 緩衝區繼續打 '氣' -> "今天下氣"
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.value = "今天下氣";
                    inp.dispatchEvent(new Event("compositionupdate", { bubbles: true }));
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                }""")
                status_comp_cont = page.evaluate("""() => {
                    const c2 = document.querySelector('.target-line[data-line="0"] .char[data-pos="2"]');
                    const c3 = document.querySelector('.target-line[data-line="0"] .char[data-pos="3"]');
                    const c4 = document.querySelector('.target-line[data-line="0"] .char[data-pos="4"]');
                    return {
                        c2: c2.className,
                        c3: c3.className,
                        c4: c4.className
                    };
                }""")
                self.assertIn("error", status_comp_cont["c2"], "第 2 個字維持 error 紅色")
                self.assertIn("correct", status_comp_cont["c3"], "第 3 個字為 correct")
                self.assertIn("current", status_comp_cont["c4"], "第 4 個字前進為 current")

                # 送出組字完成（compositionend）
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.value = "今天下氣很好";
                    inp.dispatchEvent(new Event("compositionend", { bubbles: true }));
                }""")
                is_fin = page.evaluate("""() => {
                    return window.getState().finished;
                }""")
                self.assertTrue(is_fin, "組字完成且全句打滿時，即便有錯字也應順利結算")

                # ====================================================
                # 測試 2: 進入第二輪測驗時，右上角打字速度不可突然暴衝到 300 WPM
                # ====================================================
                page.evaluate("""() => {
                    // 模擬進入第 2 關（第 1 關已完成，sessionCompleted = 1）
                    const s = window.getState();
                    s.sessionCompleted = 1;
                    s.roundTotalTyped = 50;
                    s.roundTotalCorrect = 50;
                    s.roundTotalKeys = 50;
                    s.roundElapsed = 15;
                    window.startRound("sentences");
                }""")

                # 進入第二輪剛開始時，HUD 必須初始化為 00:00 / 0 / 100%
                hud_initial = page.evaluate("""() => {
                    return {
                        time: document.getElementById("hudTime").textContent,
                        wpm: document.getElementById("hudWpm").textContent,
                        acc: document.getElementById("hudAcc").textContent
                    };
                }""")
                self.assertEqual(hud_initial["time"], "00:00", "第二輪剛進入時時間應初始化為 00:00")
                self.assertEqual(hud_initial["wpm"], "0", "第二輪剛進入時速度應初始化為 0")
                self.assertEqual(hud_initial["acc"], "100%", "第二輪剛進入時正確率應初始化為 100%")

                # 模擬敲下第二輪的第一個鍵
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.value = "這";
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                }""")

                # 稍候一小段時間讓 timer 更新
                time.sleep(0.3)

                hud_after_first_key = page.evaluate("""() => {
                    return {
                        time: document.getElementById("hudTime").textContent,
                        wpm: parseInt(document.getElementById("hudWpm").textContent, 10)
                    };
                }""")
                self.assertLess(hud_after_first_key["wpm"], 250, f"第二輪首字敲下後速度不應暴衝為 300 wpm，實測為 {hud_after_first_key['wpm']}")

                # ====================================================
                # 測試 3: 生活情境題（LINE 回合對話）修復驗證
                # ====================================================
                page.evaluate("""() => {
                    window.startRound("life_situations");
                }""")

                # 等候對手進場並切換至使用者輸入 (user_typing)
                page.wait_for_selector(".chat-msg.chat-right.chat-draft", timeout=6000)
                time.sleep(0.2)

                chat_dom = page.evaluate("""() => {
                    const box = document.getElementById("targetBox");
                    const body = box ? box.querySelector(".chat-body") : null;
                    const opponentMsg = body ? body.querySelector(".chat-msg.chat-left") : null;
                    const draftMsg = body ? body.querySelector(".chat-msg.chat-right.chat-draft") : null;
                    const currentChar = box ? box.querySelector(".char.current") : null;
                    const phase = window.getState().animationPhase;
                    return {
                        hasBody: Boolean(body),
                        hasOpponentMsg: Boolean(opponentMsg),
                        hasDraftMsg: Boolean(draftMsg),
                        hasCurrentChar: Boolean(currentChar),
                        phase
                    };
                }""")

                self.assertTrue(chat_dom["hasBody"], "targetBox 必須包含 chat-body，不得因 DOM 操作錯誤而遺失")
                self.assertTrue(chat_dom["hasOpponentMsg"], "chat-body 中必須有對手發言氣泡")
                self.assertTrue(chat_dom["hasDraftMsg"], "chat-body 中必須有使用者草稿待打氣泡")
                self.assertTrue(chat_dom["hasCurrentChar"], "待打氣泡中的第一個字必須正確標記為 .char.current 游標")
                self.assertEqual(chat_dom["phase"], "user_typing", "進入等待輸入時 animationPhase 應為 user_typing")

                # ====================================================
                # 測試 4: 虛擬鍵盤按鍵發光與紅光錯誤反饋驗證
                # ====================================================
                page.evaluate("""() => {
                    const chk = document.getElementById("onKeyboardCheck");
                    if (chk) {
                        chk.checked = true;
                        chk.dispatchEvent(new Event("change"));
                    }
                    window.startRound("words");
                    const s = window.getState();
                    s.lines = ["h"];
                    s.inputs = [""];
                    s.lineIdx = 0;
                    document.getElementById("targetBox").innerHTML = `
                        <div class="target-line current-line" data-line="0">
                            <span class="char current" data-pos="0">h</span>
                        </div>
                    `;
                    window.renderOnKeyboard();
                    window.paint();
                }""")

                # 1. 模擬按對鍵 'h'
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "h", code: "KeyH", bubbles: true }));
                }""")
                h_key_flash = page.evaluate("""() => {
                    const keyEl = document.querySelector('.on-kb-key[data-key="h"]');
                    return {
                        hasWhite: keyEl ? keyEl.classList.contains("flash-white") : false,
                        hasRed: keyEl ? keyEl.classList.contains("flash-red") : false,
                        isError: keyEl ? keyEl.classList.contains("is-error") : false
                    };
                }""")
                self.assertTrue(h_key_flash["hasWhite"], "按對鍵時該鍵應閃白光 (.flash-white)")
                self.assertFalse(h_key_flash["isError"], "按對鍵時不應標記為 .is-error")

                # 2. 模擬按錯鍵 'x' (預期為 'h' 或此時的輸入)
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "x", code: "KeyX", bubbles: true }));
                }""")
                x_key_flash = page.evaluate("""() => {
                    const keyEl = document.querySelector('.on-kb-key[data-key="x"]');
                    return {
                        hasWhite: keyEl ? keyEl.classList.contains("flash-white") : false,
                        hasRed: keyEl ? keyEl.classList.contains("flash-red") : false,
                        isError: keyEl ? keyEl.classList.contains("is-error") : false
                    };
                }""")
                self.assertTrue(x_key_flash["hasRed"], "按錯鍵時該鍵應閃紅光 (.flash-red)")
                self.assertTrue(x_key_flash["isError"], "按錯鍵時該鍵應維持 .is-error 錯誤提示")

                # 3. 模擬按 Backspace 退格
                page.evaluate("""() => {
                    const inp = document.querySelector("#inputBox input");
                    inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace", bubbles: true }));
                }""")
                x_key_after_backspace = page.evaluate("""() => {
                    const keyEl = document.querySelector('.on-kb-key[data-key="x"]');
                    return {
                        isError: keyEl ? keyEl.classList.contains("is-error") : false
                    };
                }""")
                self.assertFalse(x_key_after_backspace["isError"], "按 Backspace 時應清除鍵盤上的 .is-error 錯誤狀態")

                # ====================================================
                # 測試 5: 注音拆字與鍵位提示整合驗證
                # ====================================================
                page.evaluate("""() => {
                    const sel = document.getElementById("layoutSelect");
                    if (sel) {
                        sel.value = "bopomofo";
                        sel.dispatchEvent(new Event("change"));
                    }
                    window.startRound("words");
                    const s = window.getState();
                    s.lines = ["今天天氣很好"];
                    s.inputs = [""];
                    s.lineIdx = 0;
                    document.getElementById("targetBox").innerHTML = `
                        <div class="target-line current-line" data-line="0">
                            <span class="char current" data-pos="0">今</span>
                            <span class="char pending" data-pos="1">天</span>
                        </div>
                    `;
                    window.paint();
                }""")

                zhuyin_hint = page.evaluate("""() => {
                    const hintEl = document.getElementById("cangjieHint");
                    const nextKey = document.querySelector('.on-kb-key.is-next');
                    return {
                        hintText: hintEl ? hintEl.textContent : "",
                        nextKeyZh: nextKey ? nextKey.dataset.zh : null,
                        nextKeyCode: nextKey ? nextKey.dataset.code : null
                    };
                }""")
                self.assertIn("注音", zhuyin_hint["hintText"], "拆字滾輪提示應支援注音")
                self.assertIn("ㄐ", zhuyin_hint["hintText"], "注音提示中應包含首字'今'的注音符號'ㄐ'")
                self.assertIn("r", zhuyin_hint["hintText"].lower(), "注音提示中應包含按鍵'r'")
                self.assertEqual(zhuyin_hint["nextKeyZh"], "ㄐ", "鍵盤上下一個待敲鍵應標記在'ㄐ'")
                self.assertEqual(zhuyin_hint["nextKeyCode"], "KeyR", "鍵盤上下一個待敲鍵之 keyCode 應為 KeyR")

                # ====================================================
                # 測試 6: 滾輪循環切換注音與卡片對齊驗證（防卡在一半）
                # ====================================================
                # 從注音往左點擊 prev 到速成，再點擊 next 回到注音
                page.click(".decomp-wheel-prev")
                time.sleep(0.35)
                st_prev = page.evaluate("""() => {
                    const center = document.querySelector(".decomp-wheel-card.is-center");
                    return center ? center.dataset.method : null;
                }""")
                self.assertEqual(st_prev, "sucheng", "從注音向左應切換至速成")

                page.click(".decomp-wheel-next")
                time.sleep(0.35)
                st_next = page.evaluate("""() => {
                    const center = document.querySelector(".decomp-wheel-card.is-center");
                    return center ? center.dataset.method : null;
                }""")
                self.assertEqual(st_next, "bopomofo", "從速成向右應切換回注音且正中對齊，不應卡在一半")

                browser.close()
        finally:
            server.terminate()

if __name__ == "__main__":
    unittest.main()
