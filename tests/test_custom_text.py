import time
import subprocess
from playwright.sync_api import sync_playwright

def test_custom_text_and_shortcuts():
    server = subprocess.Popen(["python3", "serve.py", "8096"])
    time.sleep(1)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            # 清除 localStorage
            page.goto("http://127.0.0.1:8096/")
            page.evaluate("() => localStorage.clear()")
            page.reload()

            # 1. 測試快捷鍵：進入單字模式
            page.wait_for_selector(".mode-card.is-center")
            page.click(".mode-card.is-center")
            page.wait_for_selector("#practiceView:not(.hidden)")

            back_btn = page.locator("#backHomeBtn")
            assert "回首頁" in back_btn.inner_text()

            # 第一次按 Esc
            page.keyboard.press("Escape")
            assert "再按一次退出" in back_btn.inner_text()

            # 2 秒內再次按 Esc，返回首頁
            page.keyboard.press("Escape")
            page.wait_for_selector("#homeView:not(.hidden)")

            # 2. 測試自訂文本卡片
            # 透過 dots 切換到最後一張卡片（自訂文本）
            dots = page.locator(".carousel-dot")
            dots.last.click()
            page.wait_for_timeout(500)

            # 自訂文本卡片現在居中，點擊啟動
            # 由於第一次 localStorage 是空的，點擊應該彈出自訂文本彈窗
            custom_card = page.locator(".mode-card.m-custom_text.is-center")
            custom_card.wait_for(state="visible")
            custom_card.click()

            modal = page.locator("#customTextOverlay")
            modal.wait_for(state="visible")

            # 測試防呆：輸入太短 (< 5 字)
            textarea = page.locator("#customTextInput")
            textarea.fill("測試")
            page.click("#startCustomBtn")
            err = page.locator("#customErrorMsg")
            assert not err.is_hidden()
            assert "至少輸入 5 個字" in err.inner_text()

            # 輸入正常文字
            valid_text = "這是一段專門用來測試自訂文本練習的內容，第一行。\n第二行內容接續測試！"
            textarea.fill(valid_text)
            page.click("#startCustomBtn")

            # 應成功關閉彈窗並直接進入練習
            page.wait_for_selector("#practiceView:not(.hidden)")
            assert "自訂" in page.locator("#practiceTitle").inner_text()

            # 驗證練習頁的「更換文章」按鈕顯示
            change_btn = page.locator("#changeCustomTextBtn")
            assert not change_btn.is_hidden()

            # 測試點擊「更換文章」
            change_btn.click()
            modal.wait_for(state="visible")
            assert valid_text in textarea.input_value()

            # 關閉彈窗
            page.click("#closeCustomTextBtn")
            assert modal.is_hidden()

            # 回首頁
            page.keyboard.press("Escape")
            page.keyboard.press("Escape")
            page.wait_for_selector("#homeView:not(.hidden)")

            # 第二次點擊自訂文本：已有內容，應該 1 秒直接進入練習（不彈窗）
            dots.last.click()
            page.wait_for_timeout(500)
            custom_card = page.locator(".mode-card.m-custom_text.is-center")
            custom_card.wait_for(state="visible")
            custom_card.click()
            page.wait_for_selector("#practiceView:not(.hidden)")
            assert modal.is_hidden()

            context.close()
            browser.close()
            print("All custom text & shortcut tests passed successfully!")
    finally:
        server.terminate()

if __name__ == "__main__":
    test_custom_text_and_shortcuts()
