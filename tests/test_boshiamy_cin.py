import time
import subprocess
import os
from playwright.sync_api import sync_playwright

SAMPLE_CIN = """# Sample CIN table for testing
%gen_inp
%ename liu
%cname 嘸蝦米
%keyname begin
a A
b B
c C
d D
e E
f F
g G
h H
i I
j J
k K
l L
m M
n N
o O
p P
q Q
r R
s S
t T
u U
v V
w W
x X
y Y
z Z
%keyname end
%chardef begin
a 一
a 對
aa 寸
aa 丶
fsp 炒
isa 謝
%chardef end
"""

def test_boshiamy_flow():
    cin_path = "/tmp/test_liu.cin"
    with open(cin_path, "w", encoding="utf-8") as f:
        f.write(SAMPLE_CIN)

    server = subprocess.Popen(["python3", "serve.py", "8098"])
    time.sleep(1)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            # 1. 初始造訪：清空 localStorage 與 IndexedDB
            page.goto("http://127.0.0.1:8098/")
            page.evaluate("""() => {
                localStorage.clear();
                return new Promise((resolve) => {
                    const req = indexedDB.deleteDatabase('justtype_db');
                    req.onsuccess = req.onerror = () => resolve();
                });
            }""")
            page.reload()

            # 確認預設頂部輸入法為「注音」
            top_select = page.locator("#topbarLayoutSelect")
            assert top_select.input_value() == "bopomofo"

            # 2. 首次點擊切換至「嘸蝦米」輸入法 -> 應觸發啟用引導彈窗
            modal = page.locator("#boshiamyImportOverlay")
            assert modal.is_hidden()
            top_select.select_option("boshiamy")
            modal.wait_for(state="visible")

            # 檢查彈窗標題與說明文字
            title = page.locator("#boshiamyModalTitle")
            sub = page.locator("#boshiamyModalSub")
            assert "啟用嘸蝦米模式" in title.inner_text()
            assert "因版權限制，本站不內建嘸蝦米碼表" in sub.inner_text()
            assert ".cin" in sub.inner_text()

            # 關閉彈窗測試
            cancel_btn = page.locator("#cancelBoshiamyBtn")
            cancel_btn.click()
            assert modal.is_hidden()

            # 3. 進入練習模式測試：此時輸入法為嘸蝦米但尚未載入碼表
            page.wait_for_selector(".mode-card.is-center")
            page.click(".mode-card.is-center")

            # 首頁點擊因未載入碼表，應再次跳出彈窗引導
            modal.wait_for(state="visible")

            # 關閉彈窗
            page.keyboard.press("Escape")
            assert modal.is_hidden()

            # 暫時切換回注音進入練習頁
            top_select.select_option("bopomofo")
            page.click(".mode-card.is-center")
            page.wait_for_selector("#practiceView:not(.hidden)")

            # 開啟鍵位提示
            page.check("#onKeyboardCheck")
            page.wait_for_timeout(300)

            # 4. 在練習頁切換至「嘸蝦米」
            layout_select = page.locator("#layoutSelect")
            layout_select.select_option("boshiamy")
            modal.wait_for(state="visible")
            page.keyboard.press("Escape")
            assert modal.is_hidden()

            # 驗證「上方拆字提示區」顯示情境提示「嘸蝦米：匯入 .cin 檔」
            cangjie_hint = page.locator("#cangjieHint")
            assert "匯入 .cin 檔" in cangjie_hint.inner_text()

            # 驗證「下方虛擬鍵盤區」具有 is-uninitialized 灰色遮罩與覆蓋按鈕
            onkb_wrap = page.locator("#onKeyboardWrap")
            assert "is-uninitialized" in onkb_wrap.get_attribute("class")
            overlay_btn = page.locator(".on-kb-overlay-btn")
            assert "點擊匯入 .cin 碼表啟用鍵盤" in overlay_btn.inner_text()

            # 驗證打字輸入框為 disabled 且 placeholder 提示匯入
            input_box = page.locator("#inputBox input")
            assert input_box.is_disabled()
            assert "請先點擊上方或鍵盤匯入碼表" in (input_box.get_attribute("placeholder") or "")

            # 驗證防呆體驗：在練習頁敲擊任何按鍵自動呼叫上傳彈窗
            page.keyboard.press("KeyA")
            modal.wait_for(state="visible")

            # 5. 上傳 .cin 檔案並本地解析
            file_input = page.locator("#boshiamyFileInput")
            file_input.set_input_files(cin_path)

            # 等待解析並自動開啟練習
            modal.wait_for(state="hidden")
            page.wait_for_timeout(500)

            # 驗證解析完成後的即時狀態同步 (State Reactivity)：
            # (a) 輸入框不再 disabled
            assert not input_box.is_disabled()
            # (b) 下方鍵盤遮罩移除，恢復彩色
            assert "is-uninitialized" not in onkb_wrap.get_attribute("class")
            # (c) 拆字提示區不再顯示「匯入 .cin 檔」，而是顯示拆字或 ⚙️ 重設按鈕
            assert "匯入 .cin 檔" not in cangjie_hint.inner_text()

            # 6. 第二次進入或重新整理：已有資料，無縫進入，不彈窗
            page.reload()
            page.wait_for_selector("#homeView:not(.hidden)")
            # 點擊進入練習
            page.click(".mode-card.is-center")
            page.wait_for_selector("#practiceView:not(.hidden)")
            assert modal.is_hidden()
            assert not page.locator("#inputBox input").is_disabled()

            # 截圖存證
            page.screenshot(path="boshiamy_verified.png")

            context.close()
            browser.close()
            print("All Boshiamy .cin in-place tests passed successfully!")
    finally:
        server.terminate()
        if os.path.exists(cin_path):
            os.remove(cin_path)

if __name__ == "__main__":
    test_boshiamy_flow()
