import json
import os
import time
import subprocess
from playwright.sync_api import sync_playwright

def test_pwa_and_stats_transfer():
    port = "8098"
    server = subprocess.Popen(["python3", "serve.py", port])
    time.sleep(1)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            page.goto(f"http://127.0.0.1:{port}/")
            page.wait_for_selector(".mode-card.is-center")

            # 1. 驗證 PWA Manifest 與 Service Worker
            # 檢查 link manifest
            manifest_link = page.locator('link[rel="manifest"]')
            assert manifest_link.get_attribute("href") == "manifest.webmanifest"

            # 讀取 manifest 內容確認合法性
            manifest_resp = page.request.get(f"http://127.0.0.1:{port}/manifest.webmanifest")
            assert manifest_resp.ok
            m_json = manifest_resp.json()
            assert m_json["short_name"] == "JustType"
            assert m_json["display"] == "standalone"
            assert len(m_json["icons"]) >= 2

            # 驗證 Service Worker 註冊
            sw_registered = page.evaluate("""async () => {
                if (!('serviceWorker' in navigator)) return false;
                const reg = await navigator.serviceWorker.getRegistration();
                return !!reg;
            }""")
            print(f"Service worker registration status: {sw_registered}")

            # 2. 測試成績匯出與匯入
            # 先寫入一組測試成績到 localStorage
            mock_best = {
                "words": {"wpm": 85, "acc": 98, "sec": 24},
                "sentences": {"wpm": 72, "acc": 95, "sec": 30}
            }
            mock_hist = [
                {
                    "mode": "words",
                    "wpm": 85,
                    "acc": 98,
                    "sec": 24,
                    "typed": 50,
                    "correct": 49,
                    "time": 1700000000000
                }
            ]
            page.evaluate(f"""() => {{
                localStorage.setItem('tp-lite-best-v1', JSON.stringify({json.dumps(mock_best)}));
                localStorage.setItem('tp-lite-history-v1', JSON.stringify({json.dumps(mock_hist)}));
            }}""")

            # 打開成績統計彈窗
            page.click("#statsBtn")
            stats_modal = page.locator("#statsOverlay")
            stats_modal.wait_for(state="visible")

            # 截圖供視覺驗證
            os.makedirs("tests/screenshots", exist_ok=True)
            screenshot_path = "tests/screenshots/stats_modal.png"
            page.locator(".modal.stats-modal").screenshot(path=screenshot_path)

            # 驗證 UI 上的匯出與匯入按鈕存在
            export_btn = page.locator("#exportStatsBtn")
            import_btn = page.locator("#importStatsBtn")
            assert export_btn.is_visible()
            assert import_btn.is_visible()

            # 驗證匯出事件與下載檔案
            with page.expect_download() as download_info:
                export_btn.click()
            download = download_info.value
            assert download.suggested_filename.startswith("justtype-stats-")
            assert download.suggested_filename.endswith(".json")

            downloaded_path = "/tmp/exported_stats.json"
            download.save_as(downloaded_path)
            with open(downloaded_path, "r", encoding="utf-8") as f:
                exported_data = json.load(f)

            assert exported_data["app"] == "JustType"
            assert exported_data["best"]["words"]["wpm"] == 85
            assert exported_data["history"][0]["wpm"] == 85

            msg = page.locator("#statsMsg")
            assert msg.is_visible()
            assert "匯出成功" in msg.inner_text()

            # 清空 localStorage 並刷新彈窗
            page.evaluate("""() => {
                localStorage.removeItem('tp-lite-best-v1');
                localStorage.removeItem('tp-lite-history-v1');
            }""")
            # 關閉並重新打開彈窗
            page.click("#closeStatsBtn")
            stats_modal.wait_for(state="hidden")

            page.click("#statsBtn")
            stats_modal.wait_for(state="visible")
            # 此時無紀錄
            assert "目前尚無練習紀錄" in page.locator("#statsHistList").inner_text()

            # 3. 測試匯入功能
            # 上傳剛才匯出的 JSON
            file_input = page.locator("#statsFileInput")
            file_input.set_input_files(downloaded_path)

            # 檢查匯入成功訊息
            page.wait_for_timeout(300)
            assert "匯入成功" in msg.inner_text()

            # 檢查個人最佳與歷史紀錄已即時還原並呈現在介面上
            hist_text = page.locator("#statsHistList").inner_text()
            assert "單字" in hist_text
            assert "85 字/分" in hist_text

            best_text = page.locator("#statsBestGrid").inner_text()
            assert "85 字/分" in best_text

            # 4. 測試無效 JSON 的防呆處理
            bad_json_path = "/tmp/invalid_stats.json"
            with open(bad_json_path, "w", encoding="utf-8") as f:
                f.write("{ invalid json")

            file_input.set_input_files(bad_json_path)
            page.wait_for_timeout(300)
            assert "匯入失敗" in msg.inner_text()
            assert "不是有效的 JSON" in msg.inner_text()

            # 關閉彈窗
            page.click("#closeStatsBtn")
            stats_modal.wait_for(state="hidden")

            context.close()
            browser.close()
            print("All PWA & Stats transfer tests passed!")
    finally:
        server.terminate()

if __name__ == "__main__":
    test_pwa_and_stats_transfer()
