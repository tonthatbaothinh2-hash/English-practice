// Biểu đồ đường một chuỗi (điểm % theo thời gian), vẽ bằng SVG. Chạm hoặc rê chuột để xem từng điểm.
import { esc } from "./dom.js";

export function lineChart(container, points, { label = (p) => "", tip = (p) => "" } = {}) {
  // Vẽ theo bề rộng thật của khung để chữ trên trục không bị co nhỏ trên điện thoại.
  const W = Math.max(280, Math.round(container.clientWidth || 640)), H = 200, L = 38, R = 14, T = 14, B = 28;
  const iw = W - L - R, ih = H - T - B;
  const n = points.length;
  const x = (i) => L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => T + ih - (v / 100) * ih;

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ điểm theo thời gian">`;
  s += '<g class="grid">';
  for (const v of [0, 25, 50, 75, 100]) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
  s += '</g><g class="axis">';
  for (const v of [0, 50, 100]) s += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`;
  if (n) {
    s += `<text x="${x(0)}" y="${H - 6}" text-anchor="${n === 1 ? "middle" : "start"}">${esc(label(points[0]))}</text>`;
    if (n > 1) s += `<text x="${x(n - 1)}" y="${H - 6}" text-anchor="end">${esc(label(points[n - 1]))}</text>`;
  }
  s += "</g>";
  if (n > 1) s += `<polyline class="series" points="${points.map((p, i) => `${x(i)},${y(p.pct)}`).join(" ")}"/>`;
  points.forEach((p, i) => { s += `<circle class="dot" data-i="${i}" cx="${x(i)}" cy="${y(p.pct)}" r="5"/>`; });
  // Vùng chạm rộng hơn điểm để dễ bấm trên điện thoại.
  const step = n > 1 ? iw / (n - 1) : iw;
  points.forEach((p, i) => {
    s += `<rect class="hit" data-i="${i}" x="${x(i) - step / 2}" y="${T}" width="${step}" height="${ih}"/>`;
  });
  s += "</svg>";
  container.innerHTML = `<div class="chart">${s}<div class="tipbox" hidden></div></div>`;

  const box = container.querySelector(".tipbox");
  const dots = container.querySelectorAll(".dot");
  function show(i) {
    dots.forEach((d) => d.classList.toggle("on", +d.dataset.i === i));
    box.hidden = false;
    box.textContent = tip(points[i]);
    box.style.left = (x(i) / W) * 100 + "%";
    box.style.top = (y(points[i].pct) / H) * 100 + "%";
  }
  function hide() {
    dots.forEach((d) => d.classList.remove("on"));
    box.hidden = true;
  }
  const svg = container.querySelector("svg");
  svg.addEventListener("pointermove", (e) => { const h = e.target.closest(".hit"); if (h) show(+h.dataset.i); });
  svg.addEventListener("pointerdown", (e) => { const h = e.target.closest(".hit"); if (h) show(+h.dataset.i); });
  svg.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
}
