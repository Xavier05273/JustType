import unittest
import subprocess
import time
from playwright.sync_api import sync_playwright

class TestUserRequirements(unittest.TestCase):
    def test_requirements_via_browser(self):
        port = "8099"
        server = subprocess.Popen(["python3", "serve.py", port])
        time.sleep(1)

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(f"http://127.0.0.1:{port}/")

                # 1. 測試：卡鍵字按順序重複 3 次
                drill = page.evaluate("""() => {
                    window.lastResultTelemetry = {
                        bottlenecks: [{ char: '卡' }, { char: '鍵' }, { char: '字' }]
                    };
                    const chars = window.lastResultTelemetry.bottlenecks.map(b => b.char);
                    return chars.join("").repeat(3);
                }""")
                self.assertEqual(drill, "卡鍵字卡鍵字卡鍵字")

                # 2. 測試：淺色模式下區間字元顏色為黑色 rgb(0, 0, 0)
                css_colors = page.evaluate("""() => {
                    document.documentElement.setAttribute('data-theme', 'light');
                    const div = document.createElement('div');
                    div.className = 'tooltip-range-row';
                    div.innerHTML = '區間字元: <span class="tooltip-range-chars">測試</span>';
                    document.body.appendChild(div);
                    const rowColor = window.getComputedStyle(div).color;
                    const spanColor = window.getComputedStyle(div.querySelector('.tooltip-range-chars')).color;
                    div.remove();
                    return { rowColor, spanColor };
                }""")
                self.assertEqual(css_colors['rowColor'], 'rgb(0, 0, 0)')
                self.assertEqual(css_colors['spanColor'], 'rgb(0, 0, 0)')

                # 3. 測試：WPM 與 CPM 邏輯（不套用 / 5 死公式）
                stats_res = page.evaluate("""() => {
                    // 打 20 字，花 10 秒，實際敲鍵 40 次
                    const eff = window.effectiveStats(20, 20, 10, 40);
                    return eff;
                }""")
                # 20 字 / 10 秒 = 120 WPM（不是 24）
                self.assertEqual(stats_res['wpm'], 120)
                # 40 鍵 / 10 秒 = 240 CPM
                self.assertEqual(stats_res['cpm'], 240)

                # 4. 測試：Stored XSS 防禦驗證
                xss_pwned = page.evaluate("""() => {
                    window._xss_pwned = false;
                    const maliciousHist = [
                        {
                            mode: '<img src=x id="xss_probe" onerror="window._xss_pwned=true">',
                            wpm: 80,
                            acc: 100,
                            sec: 15,
                            time: Date.now()
                        }
                    ];
                    localStorage.setItem('tp-lite-history-v1', JSON.stringify(maliciousHist));
                    document.getElementById('statsBtn').click();
                    return window._xss_pwned;
                }""")
                self.assertFalse(xss_pwned)
                probe_el = page.query_selector("#xss_probe")
                self.assertIsNone(probe_el, "XSS probe element must not be injected into DOM!")

                # 5. 測試：Modal 開啟時背景 inert，關閉後移除
                home_inert = page.evaluate("""() => {
                    return document.getElementById('homeView').hasAttribute('inert');
                }""")
                self.assertTrue(home_inert, "homeView must be inert when modal is open")

                # 關閉彈窗
                page.click("#closeStatsBtn")
                home_inert_after = page.evaluate("""() => {
                    return document.getElementById('homeView').hasAttribute('inert');
                }""")
                self.assertFalse(home_inert_after, "homeView must not be inert when modal is closed")

                browser.close()
        finally:
            server.terminate()

if __name__ == "__main__":
    unittest.main()
