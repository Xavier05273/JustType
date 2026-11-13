// js/chart.js — 測驗結算圖表（Canvas 雙曲線即時 WPM 貝茲曲線平滑繪製與 Tooltip）

import { escapeHtml } from "./constants.js";

let chartPoints = [];
let lastResultTelemetry = null;
let resultChartHoverIdx = -1;

export function getLastResultTelemetry() {
  return lastResultTelemetry;
}

export function setLastResultTelemetry(stats) {
  lastResultTelemetry = stats;
  resultChartHoverIdx = -1;
  // 同步掛載至 window 供測試與除錯
  if (typeof window !== "undefined") {
    window.lastResultTelemetry = stats;
  }
}

/**
 * 繪製平滑貝茲曲線
 */
export function drawSmoothLine(ctx, points) {
  if (!points || !points.length) return;
  if (points.length === 1) {
    ctx.moveTo(points[0].x, points[0].y);
    return;
  }
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

/**
 * 繪製折線圖（即時 WPM 與累計平均 WPM 雙曲線）
 */
export function renderResultChart(logs) {
  const canvas = document.getElementById("resultChartCanvas");
  if (!canvas) return;
  const container = document.getElementById("chartCanvasContainer");
  const rect = container ? container.getBoundingClientRect() : { width: 680, height: 200 };
  const width = Math.max(300, Math.floor(rect.width || 680));
  const height = 190;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (!logs || !logs.length) {
    ctx.fillStyle = "#71717a";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("無足夠按鍵記錄可分析", width / 2, height / 2);
    chartPoints = [];
    return;
  }

  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Macro Tab: Time Buckets X-Axis & Dual Smooth WPM Curves
  const totalDurationMs = logs.reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalSec = Math.max(1, totalDurationMs / 1000);
  // Dynamic bucket size: 1s default, 2s if > 180s, 3s if > 300s
  let bucketSize = 1;
  if (totalSec > 300) {
    bucketSize = 3;
  } else if (totalSec > 180) {
    bucketSize = 2;
  }

  const numBuckets = Math.max(1, Math.ceil(totalSec / bucketSize));
  const buckets = [];
  for (let i = 0; i < numBuckets; i++) {
    buckets.push({
      bucketIdx: i,
      timeSec: (i + 1) * bucketSize,
      chars: [],
      charCount: 0,
      logs: [],
      instantWpm: 0,
      cumulativeWpm: 0
    });
  }

  let elapsedMs = 0;
  logs.forEach((log) => {
    elapsedMs += (log.duration || 0);
    const s = elapsedMs / 1000;
    let bIdx = Math.floor(s / bucketSize);
    if (bIdx >= numBuckets) bIdx = numBuckets - 1;
    buckets[bIdx].chars.push(log.char);
    buckets[bIdx].charCount += 1;
    buckets[bIdx].logs.push(log);
  });

  let cumulativeCount = 0;
  buckets.forEach((b) => {
    cumulativeCount += b.charCount;
    // 即時速度 = 當前時間桶實際字數換算為每分鐘字數
    b.instantWpm = Math.round((b.charCount / bucketSize) * 60);
    // 累計均速 = 至今累計字數換算為每分鐘字數
    b.cumulativeWpm = Math.round((cumulativeCount / b.timeSec) * 60);
  });

  const maxVal = Math.max(20, ...buckets.map((b) => Math.max(b.instantWpm, b.cumulativeWpm))) * 1.15;

  // Background horizontal grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(161, 161, 170, 0.6)";
  ctx.font = "11px monospace";
  ctx.textAlign = "right";

  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((maxVal / gridSteps) * i);
    const y = padding.top + chartH - (i / gridSteps) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
    ctx.fillText(`${val}`, padding.left - 8, y + 4);
  }

  const stepX = chartW / Math.max(1, numBuckets);
  chartPoints = [];

  const instPts = [];
  const cumPts = [];

  buckets.forEach((b, idx) => {
    const x = padding.left + idx * stepX + stepX / 2;
    const instY = padding.top + chartH - (b.instantWpm / maxVal) * chartH;
    const cumY = padding.top + chartH - (b.cumulativeWpm / maxVal) * chartH;
    instPts.push({ x, y: instY });
    cumPts.push({ x, y: cumY });
    chartPoints.push({
      x,
      y: cumY,
      instY,
      bucket: b,
      idx,
      type: "macro"
    });
  });

  // Draw X-axis time labels
  const labelStep = Math.max(1, Math.ceil(numBuckets / 12));
  buckets.forEach((b, idx) => {
    if (idx === 0 || idx === numBuckets - 1 || idx % labelStep === 0) {
      const x = padding.left + idx * stepX + stepX / 2;
      ctx.fillStyle = "rgba(161, 161, 170, 0.75)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${b.timeSec}s`, x, height - 12);
    }
  });

  // 1. Draw Curve 2: 即時速度 (Sky blue spline)
  if (instPts.length > 0) {
    ctx.beginPath();
    drawSmoothLine(ctx, instPts);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots on Instant line
    instPts.forEach((pt, idx) => {
      const isHovered = (resultChartHoverIdx === idx);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHovered ? 4.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#fff" : "#38bdf8";
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  // 2. Draw Curve 1: 累計平均速度 (Amber spline with subtle area gradient)
  if (cumPts.length > 0) {
    // Area fill under Cumulative WPM
    ctx.beginPath();
    drawSmoothLine(ctx, cumPts);
    const lastPt = cumPts[cumPts.length - 1];
    const firstPt = cumPts[0];
    ctx.lineTo(lastPt.x, padding.top + chartH);
    ctx.lineTo(firstPt.x, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, "rgba(245, 158, 11, 0.22)");
    grad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Smooth Line
    ctx.beginPath();
    drawSmoothLine(ctx, cumPts);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Dots on Cumulative line
    cumPts.forEach((pt, idx) => {
      const isHovered = (resultChartHoverIdx === idx);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHovered ? 5.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#fff" : "#f59e0b";
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }
}

/**
 * 綁定圖表滑鼠懸停與觸摸互動 (Tooltip)
 */
export function setupChartInteractions() {
  const canvas = document.getElementById("resultChartCanvas");
  const tooltip = document.getElementById("chartTooltip");
  if (!canvas || !tooltip) return;

  function hideTooltip() {
    resultChartHoverIdx = -1;
    tooltip.classList.add("hidden");
    if (lastResultTelemetry) renderResultChart(lastResultTelemetry.charLogs);
  }

  function updateHover(evt) {
    if (!chartPoints.length || !lastResultTelemetry) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = evt.clientX - rect.left;

    let closestIdx = -1;
    let minDiff = Infinity;
    chartPoints.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff && diff < (canvas.clientWidth / chartPoints.length) * 1.5) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx === -1) {
      hideTooltip();
      return;
    }

    resultChartHoverIdx = closestIdx;
    renderResultChart(lastResultTelemetry.charLogs);

    const pt = chartPoints[closestIdx];
    if (!pt || !pt.bucket) return;

    const b = pt.bucket;
    const charsSample = b.chars.slice(0, 8).join("");
    const moreSuffix = b.chars.length > 8 ? "…" : "";
    const charsDisplay = b.chars.length > 0 ? `「${escapeHtml(charsSample + moreSuffix)}」` : "（無擊鍵）";

    tooltip.innerHTML = `
      <div class="tooltip-char-line">
        <span class="tooltip-char">${b.timeSec} 秒處</span>
        <span class="tooltip-duration">${b.charCount} 字</span>
      </div>
      <div class="tooltip-detail-grid">
        <div>累計均速: <strong style="color:#f59e0b">${b.cumulativeWpm} 字/分</strong></div>
        <div>即時速度: <strong style="color:#38bdf8">${b.instantWpm} 字/分</strong></div>
        <div class="tooltip-range-row">區間字元: <span class="tooltip-range-chars">${charsDisplay}</span></div>
      </div>
    `;

    tooltip.classList.remove("hidden");
    const ttWidth = 190;
    let left = pt.x - ttWidth / 2;
    if (left < 10) left = 10;
    if (left + ttWidth > canvas.clientWidth - 10) left = canvas.clientWidth - ttWidth - 10;
    let top = pt.y - 85;
    if (top < 10) top = pt.y + 20;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  canvas.addEventListener("mousemove", updateHover);
  canvas.addEventListener("mouseleave", hideTooltip);
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches[0]) updateHover(e.touches[0]);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches[0]) updateHover(e.touches[0]);
  }, { passive: true });
  canvas.addEventListener("touchend", hideTooltip);
}
