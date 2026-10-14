// Thống kê: tổng quan, tỷ lệ đúng theo chủ đề, điểm theo thời gian, các câu hay sai nhất.
import { esc, pct, fmtDate, fmtDuration } from "../ui/dom.js";
import { topicStats, scoreSeries, mostMissed, suggestTopic, totals } from "../core/analytics.js";
import { pickQuestions } from "../core/session.js";
import { lineChart } from "../ui/chart.js";
import { reviewCard } from "./review.js";

const SERIES_LIMIT = 30;

export function render(root, ctx) {
  const { bank, store } = ctx;
  const attempts = store.attempts;
  let h = `<header class="top"><div><p class="kicker">Tiến bộ của bạn</p><h1>Thống <span>kê</span></h1></div></header>`;
  if (!attempts.length) {
    root.innerHTML = h + `<p class="card empty">Chưa có dữ liệu. Làm xong vài bài, thống kê sẽ hiện ở đây.</p>`;
    return;
  }

  const t = totals(attempts);
  const stats = topicStats(attempts);
  const sug = suggestTopic(attempts);
  const series = scoreSeries(attempts).slice(-SERIES_LIMIT);
  const missed = mostMissed(attempts, 10).filter((m) => bank.get(m.qid));

  h += `<div class="tiles">
    <div class="tile"><b>${t.attempts}</b><span>lần làm bài</span></div>
    <div class="tile"><b>${t.items}</b><span>câu đã làm</span></div>
    <div class="tile"><b>${pct(t.correct, t.items)}%</b><span>tỷ lệ đúng chung</span></div>
    <div class="tile"><b>${Math.round(t.seconds / 60)}</b><span>phút luyện tập</span></div>
  </div>`;

  // Tỷ lệ đúng theo chủ đề, yếu nhất lên đầu
  const tried = bank.catalog.topics.filter((tp) => stats[tp.id]).sort((a, b) => stats[a.id].rate - stats[b.id].rate || stats[a.id].total - stats[b.id].total);
  const untried = bank.catalog.topics.filter((tp) => !stats[tp.id]);
  h += `<section class="card"><h2 class="sec">Tỷ lệ đúng theo chủ đề</h2>
    <p class="sub small">Chủ đề yếu nhất ở trên cùng. Chỉ tính các câu đã trả lời.</p><div class="rows">`;
  for (const tp of tried) {
    const s = stats[tp.id];
    h += `<div class="row ${sug?.topic === tp.id ? "weak" : ""}"><span>${esc(tp.name)}</span><span>${pct(s.correct, s.total)}% · ${s.correct}/${s.total}</span>
      <div class="track"><i style="width:${s.rate * 100}%"></i></div></div>`;
  }
  for (const tp of untried) {
    h += `<div class="row none"><span>${esc(tp.name)}</span><span>chưa làm</span><div class="track"><i></i></div></div>`;
  }
  h += `</div>`;
  if (sug) h += `<div class="actions"><button class="btn primary" data-act="suggest">Ôn 10 câu ${esc(bank.topic(sug.topic).name.toLowerCase())}</button></div>`;
  h += `</section>`;

  // Điểm theo thời gian
  h += `<section class="card"><h2 class="sec">Điểm theo thời gian</h2>
    <p class="sub small">${series.length < attempts.length ? `${SERIES_LIMIT} lần làm gần nhất. ` : ""}Chạm vào một điểm để xem chi tiết.</p>
    <div id="chart"></div>
    <details><summary class="small">Xem dạng bảng</summary><div class="rows small" style="margin-top:10px">
      ${series.slice().reverse().map((p) => `<div class="row"><span>${esc(fmtDate(p.at))}</span><span>${p.pct}%</span></div>`).join("")}
    </div></details>
  </section>`;

  // Câu hay sai nhất
  h += `<section class="card"><h2 class="sec">Câu hay sai nhất</h2>`;
  if (missed.length) {
    h += `<div class="rev">${missed.map((m) => reviewCard(bank, bank.get(m.qid), {
      showExercise: true,
      extra: `<p class="streak">Sai ${m.wrong}/${m.total} lần làm</p>`,
    })).join("")}</div>
    <div class="actions"><button class="btn primary" data-act="missed">Luyện ${missed.length} câu này</button></div>`;
  } else {
    h += `<p class="sub">Bạn chưa sai câu nào. Tuyệt vời!</p>`;
  }
  h += `</section>`;
  h += `<p class="sub small">Tổng thời gian làm bài: ${fmtDuration(t.seconds)}.</p>`;
  root.innerHTML = h;

  lineChart(root.querySelector("#chart"), series, {
    label: (p) => fmtDate(p.at).slice(0, 5),
    tip: (p) => `${fmtDate(p.at)}: ${p.pct}%`,
  });

  root.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (store.inProgress && !confirm("Bạn đang làm dở một bài. Bắt đầu bài mới sẽ bỏ bài đó. Tiếp tục?")) return;
    if (act === "suggest") {
      ctx.startQuiz({
        questions: pickQuestions(bank.topicPool(sug.topic), { count: 10, shuffle: true }),
        exercise: "topic-review", topics: [sug.topic], settings: { count: 10, shuffle: true },
      });
    }
    if (act === "missed") {
      const qs = missed.map((m) => bank.get(m.qid));
      ctx.startQuiz({ questions: qs, exercise: "most-missed", settings: { count: qs.length, shuffle: false } });
    }
  });
}
