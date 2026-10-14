// Màn hình chọn bài, kèm gợi ý "Nên ôn tiếp" và bài đang làm dở.
import { esc, pct } from "../ui/dom.js";
import { suggestTopic, topicStats, mistakeBook } from "../core/analytics.js";
import { pickQuestions } from "../core/session.js";
import { exerciseName } from "../ui/labels.js";
import { startMistakePractice } from "./mistakes.js";

const COUNTS = [10, 20, 40];

export function render(root, ctx) {
  const { bank, store } = ctx;
  const attempts = store.attempts;
  const prefs = store.prefs;
  const exercises = bank.catalog.exercises;
  let exId = exercises.some((e) => e.id === prefs.exercise) ? prefs.exercise : exercises[0].id;
  let count = COUNTS.includes(prefs.count) ? prefs.count : 20;
  let shuffle = prefs.shuffle ?? true;
  const chosen = { ...(prefs.filters || {}) }; // lựa chọn lọc đã chọn cho từng dạng bài

  let h = `<header class="top"><div><p class="kicker">Tiếng Anh lớp 7</p><h1>Luyện <span>ngữ pháp</span></h1></div></header>`;

  if (!store.persistent) {
    h += `<p class="notice">Trình duyệt đang chặn lưu dữ liệu (có thể do chế độ ẩn danh). Bạn vẫn làm bài được nhưng kết quả sẽ mất khi đóng trang.</p>`;
  }

  // Bài đang làm dở
  const ip = store.inProgress;
  if (ip && ip.qids?.length) {
    const done = Object.keys(ip.answers || {}).length;
    h += `<section class="card hl"><h2 class="sec">Bạn đang làm dở</h2>
      <p class="sub">${esc(exerciseName(bank, ip.exercise))}: đã làm ${done}/${ip.qids.length} câu.</p>
      <div class="actions"><button class="btn primary" data-act="resume">Làm tiếp</button><button class="btn" data-act="discard">Bỏ bài này</button></div></section>`;
  }

  // Gợi ý ôn tập
  const sug = suggestTopic(attempts);
  const learning = mistakeBook(attempts).filter((e) => e.status === "learning" && bank.get(e.qid));
  if (sug) {
    const t = bank.topic(sug.topic);
    h += `<section class="card hl"><p class="kicker">Nên ôn tiếp</p>
      <h2 class="sec">${esc(t.name)}</h2>
      <p class="sub">Bạn đúng ${pct(sug.correct, sug.total)}% (${sug.correct}/${sug.total} câu). Đây là chủ đề yếu nhất của bạn lúc này.</p>
      <div class="actions"><button class="btn primary" data-act="suggest">Ôn 10 câu ${esc(t.name.toLowerCase())}</button></div></section>`;
  } else if (!attempts.length) {
    h += `<section class="card"><h2 class="sec">Chào bạn!</h2><p class="sub">Chọn một dạng bài bên dưới để bắt đầu. Làm xong vài bài, web sẽ gợi ý chủ đề bạn cần ôn.</p></section>`;
  }
  if (learning.length) {
    h += `<section class="card"><div class="top"><div><h2 class="sec">Sổ lỗi sai</h2><p class="sub">${learning.length} câu đang ôn</p></div>
      <button class="btn" data-act="mistakes">Luyện ngay</button></div></section>`;
  }

  // Chọn bài
  h += `<form class="card" id="setup" novalidate>
    <fieldset class="field"><legend>1. Dạng bài</legend><div class="exList">`;
  for (const ex of exercises) {
    h += `<div class="exItem"><input type="radio" name="ex" id="ex-${ex.id}" value="${ex.id}" ${ex.id === exId ? "checked" : ""}>
      <label for="ex-${ex.id}"><b>${esc(ex.name)}</b><span>${esc(ex.desc)}</span></label></div>`;
  }
  h += `</div></fieldset>
    <fieldset class="field"><legend><span>2. Chủ đề</span><button type="button" class="link" id="allBtn"></button></legend><div class="chips" id="chips"></div></fieldset>
    <fieldset class="field"><legend>3. Số câu</legend><div class="seg">`;
  for (const c of COUNTS) {
    h += `<input type="radio" name="count" id="c${c}" value="${c}" ${c === count ? "checked" : ""}><label for="c${c}">${c} câu</label>`;
  }
  h += `</div></fieldset>
    <label class="switch">Xáo thứ tự câu hỏi <input type="checkbox" id="shuffle" ${shuffle ? "checked" : ""}></label>
    <p class="sub small" id="poolInfo"></p>
    <button class="btn primary block" type="submit" id="startBtn">Bắt đầu</button>
  </form>`;

  root.innerHTML = h;
  const $ = (s) => root.querySelector(s);
  const stats = topicStats(attempts);

  function selected() {
    const opts = bank.filterOptions(exId).map((o) => o.id);
    const saved = (chosen[exId] || []).filter((id) => opts.includes(id));
    return chosen[exId] ? saved : opts; // lần đầu chọn tất cả
  }

  function paintFilters() {
    const opts = bank.filterOptions(exId);
    const sel = new Set(selected());
    const isGroup = bank.exercise(exId).filterBy === "group";
    $("#chips").innerHTML = opts.map((o) => {
      const s = !isGroup && stats[o.id] ? ` · ${pct(stats[o.id].correct, stats[o.id].total)}%` : "";
      return `<div class="chip"><input type="checkbox" id="f-${o.id}" value="${o.id}" ${sel.has(o.id) ? "checked" : ""}>
        <label for="f-${o.id}">${esc(o.name)} <small>${o.count} câu${s}</small></label></div>`;
    }).join("");
    $("#allBtn").textContent = sel.size === opts.length ? "Bỏ chọn hết" : "Tổng hợp (chọn tất cả)";
    paintInfo();
  }

  function paintInfo() {
    const sel = selected();
    const n = bank.pool(exId, sel).length;
    const take = Math.min(n, count);
    $("#poolInfo").textContent = !sel.length
      ? "Hãy chọn ít nhất một chủ đề."
      : n < count ? `Chủ đề đã chọn có ${n} câu, bài sẽ gồm cả ${n} câu.` : `Có ${n} câu phù hợp, bài sẽ lấy ngẫu nhiên ${take} câu, chia đều các chủ đề.`;
    $("#startBtn").disabled = !sel.length;
  }

  function savePrefs() {
    store.setPrefs({ exercise: exId, count, shuffle, filters: chosen });
  }

  root.querySelector(".exList").addEventListener("change", (e) => {
    exId = e.target.value;
    paintFilters();
    savePrefs();
  });
  $("#chips").addEventListener("change", () => {
    chosen[exId] = [...root.querySelectorAll("#chips input:checked")].map((i) => i.value);
    paintFilters();
    savePrefs();
  });
  $("#allBtn").addEventListener("click", () => {
    const opts = bank.filterOptions(exId).map((o) => o.id);
    chosen[exId] = selected().length === opts.length ? [] : opts;
    paintFilters();
    savePrefs();
  });
  root.querySelector(".seg").addEventListener("change", (e) => {
    count = +e.target.value;
    paintInfo();
    savePrefs();
  });
  $("#shuffle").addEventListener("change", (e) => {
    shuffle = e.target.checked;
    savePrefs();
  });
  $("#setup").addEventListener("submit", (e) => {
    e.preventDefault();
    const sel = selected();
    const pool = bank.pool(exId, sel);
    if (!pool.length) return;
    if (ip && !confirm("Bạn đang làm dở một bài. Bắt đầu bài mới sẽ bỏ bài đó. Tiếp tục?")) return;
    ctx.startQuiz({
      questions: pickQuestions(pool, { count, shuffle }),
      exercise: exId,
      topics: sel,
      settings: { count, shuffle },
    });
  });

  root.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "resume") ctx.go("/quiz");
    if (act === "discard" && confirm("Bỏ bài đang làm dở? Các câu đã làm trong bài này sẽ không được lưu.")) {
      store.setInProgress(null);
      ctx.go("/");
    }
    if (act === "suggest") {
      if (ip && !confirm("Bạn đang làm dở một bài. Bắt đầu bài mới sẽ bỏ bài đó. Tiếp tục?")) return;
      ctx.startQuiz({
        questions: pickQuestions(bank.topicPool(sug.topic), { count: 10, shuffle: true }),
        exercise: "topic-review",
        topics: [sug.topic],
        settings: { count: 10, shuffle: true },
      });
    }
    if (act === "mistakes") {
      if (ip && !confirm("Bạn đang làm dở một bài. Bắt đầu bài mới sẽ bỏ bài đó. Tiếp tục?")) return;
      startMistakePractice(ctx);
    }
  });

  paintFilters();
}
