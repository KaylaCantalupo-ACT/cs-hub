// Shared helpers for the Customer Service Hub
// Charts are hand-drawn with SVG (no external library / no CDN dependency).

const NAV_ITEMS = [
  { href: "index.html", label: "Overview" },
  { href: "volume.html", label: "Ticket Volume" },
  { href: "workload.html", label: "Workload" },
  { href: "customer-experience.html", label: "Customer Experience" },
  { href: "channels.html", label: "Channels" },
];

function renderNav(activeHref) {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.innerHTML = NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="${item.href === activeHref ? "active" : ""}">${item.label}</a>`
  ).join("");
}

function fmtNum(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-US");
}

function toMonthly(weekly) {
  const buckets = {};
  weekly.forEach((row) => {
    const key = row.date.slice(0, 7);
    if (!buckets[key]) {
      buckets[key] = { period: key, created: 0, closed: 0, replied: 0, messagesSent: 0 };
    }
    buckets[key].created += row.created;
    buckets[key].closed += row.closed;
    buckets[key].replied += row.replied;
    buckets[key].messagesSent += row.messagesSent;
  });
  return Object.values(buckets).sort((a, b) => a.period.localeCompare(b.period));
}

function toYearly(weekly) {
  const buckets = {};
  weekly.forEach((row) => {
    const key = row.date.slice(0, 4);
    if (!buckets[key]) {
      buckets[key] = { period: key, created: 0, closed: 0, replied: 0, messagesSent: 0 };
    }
    buckets[key].created += row.created;
    buckets[key].closed += row.closed;
    buckets[key].replied += row.replied;
    buckets[key].messagesSent += row.messagesSent;
  });
  return Object.values(buckets).sort((a, b) => a.period.localeCompare(b.period));
}

function parseDurationToMinutes(str) {
  if (!str || str === "-" || str === "N/A") return null;
  let total = 0;
  const dMatch = str.match(/(\d+)d/);
  const hMatch = str.match(/(\d+)h/);
  const mMatch = str.match(/(\d+)m(?!s)/);
  const sMatch = str.match(/(\d+)s/);
  if (dMatch) total += Number(dMatch[1]) * 24 * 60;
  if (hMatch) total += Number(hMatch[1]) * 60;
  if (mMatch) total += Number(mMatch[1]);
  if (sMatch) total += Number(sMatch[1]) / 60;
  return total;
}

function fmtDelta(current, previous, lowerIsBetter = false) {
  if (current === null || previous === null || previous === 0) return "";
  const pct = ((current - previous) / previous) * 100;
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  const arrow = pct >= 0 ? "▲" : "▼";
  return `<span class="delta ${good ? "up" : "down"}">${arrow} ${Math.abs(pct).toFixed(1)}% vs prior period</span>`;
}

function monthLabel(ym) {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

const CHART_COLORS = {
  blue: "#ABCAE9",
  greige: "#EDEAE8",
  midGrey: "#ABABAB",
  green: "#9FE3B3",
};

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function clearContainer(id) {
  const c = document.getElementById(id);
  if (c) c.innerHTML = "";
  return c;
}

function renderLegend(container, series) {
  const legend = document.createElement("div");
  legend.style.display = "flex";
  legend.style.gap = "16px";
  legend.style.marginTop = "10px";
  legend.style.flexWrap = "wrap";
  series.forEach((s) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "6px";
    item.style.fontSize = "12px";
    item.style.color = "#ABABAB";
    const sw = document.createElement("span");
    sw.style.width = "10px";
    sw.style.height = "10px";
    sw.style.borderRadius = "2px";
    sw.style.background = s.color;
    sw.style.display = "inline-block";
    item.appendChild(sw);
    const txt = document.createElement("span");
    txt.textContent = s.label;
    item.appendChild(txt);
    legend.appendChild(item);
  });
  container.appendChild(legend);
}

function renderBarChart(containerId, labels, series, opts) {
  opts = opts || {};
  const width = 1000;
  const height = opts.height || 320;
  const marginLeft = 55, marginBottom = labels.length > 14 ? 80 : 50, marginTop = 20, marginRight = 20;
  const plotW = width - marginLeft - marginRight;
  const plotH = height - marginTop - marginBottom;
  const maxVal = Math.max(1, ...series.flatMap((s) => s.data));
  const niceMax = maxVal * 1.15;
  const container = clearContainer(containerId);
  if (!container) return;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: "auto" });

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const y = marginTop + plotH - (plotH * i) / gridCount;
    const val = (niceMax * i) / gridCount;
    svg.appendChild(svgEl("line", { x1: marginLeft, x2: width - marginRight, y1: y, y2: y, stroke: "rgba(255,255,255,0.08)" }));
    const t = svgEl("text", { x: marginLeft - 8, y: y + 4, "text-anchor": "end", fill: "#ABABAB", "font-size": "11" });
    t.textContent = Math.round(val).toLocaleString();
    svg.appendChild(t);
  }

  const n = labels.length;
  const groupW = plotW / n;
  const barGap = 4;
  const barW = (groupW - barGap * 2) / series.length;
  labels.forEach((label, i) => {
    const groupX = marginLeft + i * groupW;
    series.forEach((s, si) => {
      const val = s.data[i] || 0;
      const barH = plotH * (val / niceMax);
      const x = groupX + barGap + si * barW;
      const y = marginTop + plotH - barH;
      svg.appendChild(svgEl("rect", { x, y, width: Math.max(barW - 2, 1), height: Math.max(barH, 0), fill: s.color, rx: 2 }));
    });
    const t = svgEl("text", { x: groupX + groupW / 2, y: height - marginBottom + 16, "text-anchor": "middle", fill: "#ABABAB", "font-size": "10" });
    t.textContent = label;
    if (n > 14) {
      t.setAttribute("transform", `rotate(-45 ${groupX + groupW / 2} ${height - marginBottom + 16})`);
      t.setAttribute("text-anchor", "end");
    }
    svg.appendChild(t);
  });

  container.appendChild(svg);
  renderLegend(container, series);
}

function renderHorizontalBarChart(containerId, labels, series, opts) {
  opts = opts || {};
  const rowH = 20 * series.length + 12;
  const height = labels.length * rowH + 20;
  const width = 1000;
  const marginLeft = 170, marginRight = 40, marginTop = 10;
  const plotW = width - marginLeft - marginRight;
  const maxVal = Math.max(1, ...series.flatMap((s) => s.data));
  const niceMax = maxVal * 1.1;
  const container = clearContainer(containerId);
  if (!container) return;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: "auto" });

  labels.forEach((label, i) => {
    const rowY = marginTop + i * rowH;
    const t = svgEl("text", { x: marginLeft - 10, y: rowY + rowH / 2 + 4, "text-anchor": "end", fill: "#FFFFFF", "font-size": "11" });
    t.textContent = label;
    svg.appendChild(t);
    series.forEach((s, si) => {
      const val = s.data[i] || 0;
      const barW = plotW * (val / niceMax);
      const y = rowY + si * (rowH / series.length) + 2;
      svg.appendChild(svgEl("rect", { x: marginLeft, y, width: Math.max(barW, 1), height: rowH / series.length - 4, fill: s.color, rx: 2 }));
    });
  });

  container.appendChild(svg);
  renderLegend(container, series);
}

function renderLineChart(containerId, labels, series, opts) {
  opts = opts || {};
  const width = 1000;
  const height = opts.height || 320;
  const marginLeft = 55, marginBottom = labels.length > 14 ? 80 : 50, marginTop = 20, marginRight = 20;
  const plotW = width - marginLeft - marginRight;
  const plotH = height - marginTop - marginBottom;
  const maxVal = Math.max(1, ...series.flatMap((s) => s.data));
  const niceMax = maxVal * 1.15;
  const n = labels.length;
  const container = clearContainer(containerId);
  if (!container) return;
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: "auto" });

  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const y = marginTop + plotH - (plotH * i) / gridCount;
    const val = (niceMax * i) / gridCount;
    svg.appendChild(svgEl("line", { x1: marginLeft, x2: width - marginRight, y1: y, y2: y, stroke: "rgba(255,255,255,0.08)" }));
    const t = svgEl("text", { x: marginLeft - 8, y: y + 4, "text-anchor": "end", fill: "#ABABAB", "font-size": "11" });
    t.textContent = Math.round(val).toLocaleString();
    svg.appendChild(t);
  }

  const stepX = n > 1 ? plotW / (n - 1) : 0;
  series.forEach((s) => {
    let points = "";
    s.data.forEach((val, i) => {
      const x = marginLeft + i * stepX;
      const y = marginTop + plotH - plotH * (val / niceMax);
      points += `${x},${y} `;
    });
    svg.appendChild(svgEl("polyline", { points: points.trim(), fill: "none", stroke: s.color, "stroke-width": 2 }));
    s.data.forEach((val, i) => {
      const x = marginLeft + i * stepX;
      const y = marginTop + plotH - plotH * (val / niceMax);
      svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 3, fill: s.color }));
    });
  });

  labels.forEach((label, i) => {
    const x = marginLeft + i * stepX;
    const t = svgEl("text", { x, y: height - marginBottom + 16, "text-anchor": "middle", fill: "#ABABAB", "font-size": "10" });
    t.textContent = label;
    if (n > 14) {
      t.setAttribute("transform", `rotate(-45 ${x} ${height - marginBottom + 16})`);
      t.setAttribute("text-anchor", "end");
    }
    svg.appendChild(t);
  });

  container.appendChild(svg);
  renderLegend(container, series);
}

function renderDoughnutChart(containerId, labels, data, colors) {
  const size = 260, r = 100, cx = 130, cy = 130, inner = 55;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const container = clearContainer(containerId);
  if (!container) return;
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.gap = "24px";
  wrap.style.alignItems = "center";
  wrap.style.flexWrap = "wrap";

  const svg = svgEl("svg", { viewBox: `0 0 ${size} ${size}`, width: "260", height: "260" });
  let angle = -90;
  data.forEach((val, i) => {
    const frac = val / total;
    const sweep = frac * 360;
    const largeArc = sweep > 180 ? 1 : 0;
    const startRad = (angle * Math.PI) / 180;
    const endRad = ((angle + sweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const path = svgEl("path", {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      fill: colors[i % colors.length],
    });
    svg.appendChild(path);
    angle += sweep;
  });
  svg.appendChild(svgEl("circle", { cx, cy, r: inner, fill: "#4D4D4D" }));
  wrap.appendChild(svg);

  const legend = document.createElement("div");
  legend.style.display = "flex";
  legend.style.flexDirection = "column";
  legend.style.gap = "6px";
  labels.forEach((label, i) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "6px";
    item.style.fontSize = "12px";
    item.style.color = "#FFFFFF";
    const sw = document.createElement("span");
    sw.style.width = "10px";
    sw.style.height = "10px";
    sw.style.borderRadius = "2px";
    sw.style.background = colors[i % colors.length];
    sw.style.display = "inline-block";
    item.appendChild(sw);
    const txt = document.createElement("span");
    txt.textContent = label;
    item.appendChild(txt);
    legend.appendChild(item);
  });
  wrap.appendChild(legend);

  container.appendChild(wrap);
}
