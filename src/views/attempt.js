// Kết quả một lần làm: điểm tổng, điểm theo chủ đề, xem lại từng câu, làm lại câu sai.
// Dùng cho cả màn hình cuối bài (#/result/:id) và xem lại trong lịch sử (#/history/:id).
import { esc, pct, fmtDate, fmtDuration } from "../ui/dom.js";
import { attemptBreakdown } from "../core/analytics.js";
import { attemptTitle, verdict, filtersText } from "../ui/labels.js";
import { reviewCard } from "./review.js";

export function render(root, ctx, { id, fromQuiz }) {
  const { bank, store } = ctx;
  const a = store.getAttempt(id);
  if (!a) {
    root.innerHTML = `<p class="empty">Không tìm thấy lần làm này.</p><a class="btn" href="#/history">Về lịch sử</a>`;
    return;
  }
  const p = pct(a.score.correct, a.score.total);
  const [v1, v2] = verdict(p);
  const breakdown = attemptBreakdown(a);
  const wrong = a.items.filter((it) => !it.correct);
  const retryable = wrong.map((it) => bank.get(it.qid)).filter(Boolean);
  const isMixedTopics = Object.keys(breakdown).length > 1;

  let h = `<header class="top"><div><p class="kicker">${fromQuiz ? "Kết quả" : esc(fmtDate(a.finishedAt))}</p>
    <h1>${esc(attemptTitle(bank, a))}</h1></div></header>
    <section class="card">
      <div class="score"><div class="big">${a.score.correct}<small>/${a.score.total}</small></div>
      <div><p class="verdict">${v1} (${p}%)</p><p class="sub">${v2}</p></div></div>
      <p class="sub small">${esc(filtersText(bank, a))}${filtersText(bank, a) ? " · " : ""}Thời gian làm: ${fmtDuration(a.durationSec)}</p>`;

  if (isMixedTopics) {
    h += `<div class="rows" aria-label="Điểm theo chủ đề">`;
    for (const [tid, s] of Object.entries(breakdown).sort((x, y) => x[1].correct / x[1].total - y[1].correct / y[1].total)) {
      h += `<div class="row"><span>${esc(bank.topic(tid).name)}</span><span>${s.correct}/${s.total}</span>
        <div class="track"><i style="width:${(s.correct / s.total) * 100}%"></i></div></div>`;
    }
    h += `</div>`;
  }

  h += `<div class="actions">`;
  if (retryable.length) h += `<button class="btn primary" data-act="retry">Làm lại ${retryable.length} câu sai</button>`;
  h += fromQuiz ? `<a class="btn" href="#/">Làm bài khác</a>` : `<a class="btn" href="#/history">Về lịch sử</a>`;
  h += `</div></section>`;

  h += `<div class="top"><h2 class="sec">Xem lại</h2></div>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" data-f="wrong" aria-selected="${wrong.length ? "true" : "false"}">Câu sai (${wrong.length})</button>
      <button type="button" role="tab" data-f="all" aria-selected="${wrong.length ? "false" : "true"}">Tất cả (${a.items.length})</button>
    </div>
    <div class="rev" id="rev"></div>`;
  root.innerHTML = h;

  const rev = root.querySelector("#rev");
  function paintList(filter) {
    const list = a.items.map((it, i) => ({ it, i })).filter(({ it }) => filter === "all" || !it.correct);
    rev.innerHTML = list.length
      ? list.map(({ it, i }) => reviewCard(bank, bank.get(it.qid), { num: i + 1, item: it, showExercise: !bank.exercise(a.exercise) })).join("")
      : `<p class="empty">Bạn đúng tất cả các câu, không có câu nào cần xem lại.</p>`;
    root.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.f === filter)));
  }
  root.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) paintList(b.dataset.f);
  });
  paintList(wrong.length ? "wrong" : "all");

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-act]")?.dataset.act !== "retry") return;
    if (store.inProgress && !confirm("Bạn đang làm dở một bài. Bắt đầu bài mới sẽ bỏ bài đó. Tiếp tục?")) return;
    ctx.startQuiz({
      questions: retryable,
      mode: "retry-wrong",
      exercise: a.exercise,
      topics: a.topics,
      settings: { count: retryable.length, shuffle: false },
    });
  });
}
