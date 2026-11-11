import unittest

def calculate_bottlenecks(char_logs):
    valid_logs = [l for l in char_logs if l.get("char") and l.get("char").strip()]
    if not valid_logs:
        return []

    for l in valid_logs:
        if "netDuration" not in l or l["netDuration"] is None:
            ime_dur = l.get("imeSelectDuration", 0) or 0
            l["netDuration"] = max(20, (l.get("duration", 20) or 20) - ime_dur)

    net_durations = [l["netDuration"] for l in valid_logs]
    sorted_durs = sorted(net_durations)
    mid = len(sorted_durs) // 2
    if len(sorted_durs) % 2 != 0:
        median = sorted_durs[mid]
    else:
        median = (sorted_durs[mid - 1] + sorted_durs[mid]) / 2

    mean = sum(net_durations) / len(net_durations)
    variance = sum((d - mean) ** 2 for d in net_durations) / len(net_durations)
    std_dev = variance ** 0.5

    outlier_threshold = median + 2 * std_dev
    qualified = [l for l in valid_logs if l["netDuration"] > 400 and l["netDuration"] > outlier_threshold]

    bottleneck_map = {}
    for l in qualified:
        ch = l["char"]
        if ch not in bottleneck_map or l["netDuration"] > bottleneck_map[ch]["netDuration"]:
            bottleneck_map[ch] = l

    return sorted(bottleneck_map.values(), key=lambda x: x["netDuration"], reverse=True)[:8]

class TestBottleneckAlgo(unittest.TestCase):
    def test_condition_1_net_duration_above_400ms(self):
        # All normal around 100ms, outlier at 350ms (passes outlier threshold but fails >400ms)
        logs = [{"char": f"字{i}", "duration": 100, "imeSelectDuration": 0} for i in range(20)]
        logs.append({"char": "卡", "duration": 350, "imeSelectDuration": 0})
        res = calculate_bottlenecks(logs)
        self.assertEqual(len(res), 0)

    def test_deduction_of_ime_selection_duration(self):
        # Gross duration is 1500ms, but IME select took 1200ms -> net is 300ms <= 400ms
        logs = [{"char": f"字{i}", "duration": 150, "imeSelectDuration": 0} for i in range(20)]
        logs.append({"char": "選", "duration": 1500, "imeSelectDuration": 1200})
        res = calculate_bottlenecks(logs)
        self.assertEqual(len(res), 0)

    def test_condition_2_outlier_threshold_and_deduplication(self):
        logs = [{"char": f"字{i}", "duration": 200, "imeSelectDuration": 0} for i in range(20)]
        # Duplicate character '卡' with two instances: 800ms and 1100ms
        logs.append({"char": "卡", "duration": 800, "imeSelectDuration": 0})
        logs.append({"char": "卡", "duration": 1100, "imeSelectDuration": 0})
        res = calculate_bottlenecks(logs)
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["char"], "卡")
        self.assertEqual(res[0]["netDuration"], 1100)

    def test_condition_3_cap_at_8_items(self):
        logs = [{"char": f"基{i}", "duration": 150, "imeSelectDuration": 0} for i in range(50)]
        # Add 12 distinct bottleneck characters all > 400ms and > threshold
        for i in range(12):
            logs.append({"char": f"難{i}", "duration": 800 + i * 50, "imeSelectDuration": 0})
        res = calculate_bottlenecks(logs)
        self.assertEqual(len(res), 8)
        # Verify descending order
        self.assertTrue(res[0]["netDuration"] > res[-1]["netDuration"])

if __name__ == "__main__":
    unittest.main()
