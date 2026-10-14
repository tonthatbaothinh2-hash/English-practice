const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Đặt chỗ trống "___" trong câu bằng một đoạn HTML (đã escape phần còn lại).
export function withBlank(prompt, blankHtml) {
  const i = prompt.indexOf("___");
  if (i < 0) return esc(prompt) + " " + blankHtml;
  return esc(prompt.slice(0, i)) + blankHtml + esc(prompt.slice(i + 3));
}

export function blank(text, cls = "") {
  return `<span class="blank ${cls}">${text ? esc(text) : "&nbsp;"}</span>`;
}

export function fmtDate(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)} giờ ${m % 60} phút`;
  return m ? `${m} phút ${s} giây` : `${s} giây`;
}

export function pct(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}
