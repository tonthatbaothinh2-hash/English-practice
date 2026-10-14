// Danh sách các lần làm và sao lưu dữ liệu (xuất, nhập, xoá).
import { esc, pct, fmtDate, fmtDuration } from "../ui/dom.js";
import { attemptTitle, filtersText } from "../ui/labels.js";

export function render(root, ctx) {
  const { bank, store } = ctx;
  const list = [...store.attempts].sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt));

  let h = `<header class="top"><div><p class="kicker">${list.length} lần làm</p><h1>Lịch <span>sử</span></h1></div></header>`;
  if (!list.length) {
    h += `<p class="card empty">Chưa có lần làm nào. Làm xong một bài, kết quả sẽ hiện ở đây.</p>`;
  } else {
    h += `<ul class="list">`;
    for (const a of list) {
      const p = pct(a.score.correct, a.score.total);
      const f = filtersText(bank, a);
      h += `<li><a href="#/history/${encodeURIComponent(a.id)}">
        <b>${esc(attemptTitle(bank, a))}</b>
        <span class="pct ${p < 50 ? "lo" : p >= 80 ? "hi" : ""}">${p}%</span>
        <small>${esc(fmtDate(a.finishedAt))} · ${a.score.correct}/${a.score.total} câu · ${esc(fmtDuration(a.durationSec))}${f ? " · " + esc(f) : ""}</small>
      </a></li>`;
    }
    h += `</ul>`;
  }

  h += `<section class="card">
    <h2 class="sec">Sao lưu dữ liệu</h2>
    <p class="sub small">Kết quả chỉ lưu trên trình duyệt của máy này. Xuất ra file để giữ lại, hoặc nhập file đó trên máy khác. Nhập file sẽ gộp thêm, không xoá dữ liệu đang có.</p>
    <div class="actions">
      <button class="btn" type="button" id="exportBtn" ${list.length ? "" : "disabled"}>Xuất file</button>
      <label class="btn" for="importFile">Nhập file</label>
      <input type="file" id="importFile" accept="application/json,.json" class="sr">
    </div>
    <p class="sub small" id="dataMsg" role="status"></p>
    ${list.length ? `<button class="link" type="button" id="clearBtn">Xoá toàn bộ dữ liệu trên máy này</button>` : ""}
  </section>`;
  root.innerHTML = h;

  const msg = root.querySelector("#dataMsg");
  root.querySelector("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([store.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const link = Object.assign(document.createElement("a"), { href: url, download: `tieng-anh-7-sao-luu-${stamp}.json` });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    msg.textContent = "Đã tạo file sao lưu.";
  });

  root.querySelector("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = store.importData(await file.text());
      let t = `Đã nhập ${r.added} lần làm mới.`;
      if (r.skipped) t += ` Bỏ qua ${r.skipped} lần đã có.`;
      if (r.invalid) t += ` Bỏ qua ${r.invalid} mục bị lỗi.`;
      alert(t);
      ctx.go("/history");
    } catch (err) {
      msg.textContent = "Không nhập được: " + err.message;
    }
    e.target.value = "";
  });

  root.querySelector("#clearBtn")?.addEventListener("click", () => {
    if (!confirm("Xoá toàn bộ lịch sử, thống kê và sổ lỗi sai trên máy này? Không thể hoàn tác. Nên xuất file sao lưu trước.")) return;
    store.clearAll();
    ctx.go("/history");
  });
}
