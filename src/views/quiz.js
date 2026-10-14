// Màn hình làm bài: một câu mỗi lần, bảng số câu, thanh tiến độ, biết đúng sai ngay.
import { esc } from "../ui/dom.js";
import { formatOf } from "../formats/index.js";
import { answerQuestion, finishSession, progress } from "../core/session.js";
import { exerciseName } from "../ui/labels.js";

export function render(root, ctx) {
  const { bank, store } = ctx;
  const session = store.inProgress;
  if (!session || !session.qids?.length) { ctx.go("/"); return; }

  // Bỏ các câu không còn trong ngân hàng (ví dụ đã bị xoá khỏi file JSON).
  session.qids = session.qids.filter((id) => bank.get(id));
  if (!session.qids.length) { store.setInProgress(null); ctx.go("/"); return; }
  session.cur = Math.min(session.cur || 0, session.qids.length - 1);
  session.lastTick = Date.now(); // không tính thời gian lúc rời trang
  const N = session.qids.length;
  const mixed = !bank.exercise(session.exercise);

  root.innerHTML = `
    <header class="top">
      <div><p class="kicker">${esc(exerciseName(bank, session.exercise))}${session.mode === "retry-wrong" ? " · làm lại câu sai" : ""}</p>
      <h1 id="qtitle"></h1></div>
      <div class="stats" aria-live="polite"><div>Đã làm <b id="stDone">0</b>/${N}</div><div>Đúng <b id="stOk">0</b></div></div>
    </header>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${N}" aria-label="Tiến độ" id="bar"><i style="width:0"></i></div>
    <nav class="map" id="map" aria-label="Danh sách ${N} câu hỏi">${session.qids.map((_, i) => `<button type="button" data-i="${i}" aria-label="Câu ${i + 1}">${i + 1}</button>`).join("")}</nav>
    <section class="card" aria-live="polite">
      <div class="meta"><p class="partTag" id="partTag"></p><p class="qnum" id="qnum"></p></div>
      <details class="tip" id="tip"><summary>Gợi ý</summary><p id="tipText"></p></details>
      <div id="qbody"></div>
      <div class="fb" id="fb" hidden></div>
    </section>
    <div class="nav"><button class="btn" id="prev" type="button">Câu trước</button><button class="btn primary" id="next" type="button">Câu tiếp</button></div>
    <button class="btn block" id="submit" type="button">Nộp bài</button>
    <p class="hint kbd-hint">Có thể bấm phím A, B, C, D để chọn và phím mũi tên để chuyển câu.</p>`;

  const $ = (s) => root.querySelector(s);
  const save = () => store.setInProgress(session);
  const q = (i = session.cur) => bank.get(session.qids[i]);

  function firstOpen() {
    for (let i = 0; i < N; i++) if (!session.answers[session.qids[i]]) return i;
    return -1;
  }

  function paint() {
    const cur = session.cur, item = q(), state = session.answers[item.id];
    const fmt = formatOf(item), topic = bank.topic(item.topic);
    const p = progress(session);

    // Bài lọc theo nhóm (tìm lỗi sai) chỉ hiện tên nhóm, vì tên chủ đề sẽ lộ chỗ sai.
    const byGroup = bank.exercise(item.exercise)?.filterBy === "group";
    const title = byGroup ? bank.group(topic.group).name : topic.name;
    $("#qtitle").innerHTML = mixed ? esc(exerciseName(bank, item.exercise)) : `<span>${esc(title)}</span>`;
    $("#partTag").textContent = mixed ? title : byGroup ? "Chọn phần gạch chân bị sai" : bank.group(topic.group).name;
    $("#qnum").textContent = `Câu ${cur + 1}/${N}`;
    $("#tipText").textContent = topic.tip;
    $("#tip").hidden = !topic.tip;

    fmt.render($("#qbody"), item, state, (given) => {
      answerQuestion(session, item, given);
      save();
      paint();
    });

    const fb = $("#fb");
    if (!state) fb.hidden = true;
    else {
      fb.hidden = false;
      fb.className = "fb " + (state.correct ? "ok" : "no");
      fb.innerHTML = `<strong>${state.correct ? "Đúng rồi!" : "Chưa đúng. Đáp án: " + esc(fmt.answerText(item))}</strong><p>${esc(item.explain)}</p>`;
    }

    $("#stDone").textContent = p.done;
    $("#stOk").textContent = p.correct;
    $("#bar").firstElementChild.style.width = (p.done / N) * 100 + "%";
    $("#bar").setAttribute("aria-valuenow", p.done);

    [...$("#map").children].forEach((b, i) => {
      const s = session.answers[session.qids[i]];
      b.className = (s ? (s.correct ? "ok" : "no") : "") + (i === cur ? " cur" : "");
      if (i === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });

    $("#prev").disabled = cur === 0;
    const allDone = p.done === N;
    $("#next").textContent = allDone ? "Xem kết quả" : cur === N - 1 ? "Đến câu chưa làm" : "Câu tiếp";
    $("#submit").hidden = allDone;
  }

  function go(i) {
    session.cur = i;
    save();
    paint();
    $("#qbody").closest(".card").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function finish() {
    const attempt = finishSession(session, bank);
    store.addAttempt(attempt);
    store.setInProgress(null);
    ctx.go(`/result/${attempt.id}`);
  }

  function next() {
    const p = progress(session);
    if (p.done === N) { finish(); return; }
    if (session.cur < N - 1) { go(session.cur + 1); return; }
    const f = firstOpen();
    if (f >= 0) go(f);
  }

  $("#map").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) go(+b.dataset.i);
  });
  $("#prev").addEventListener("click", () => session.cur > 0 && go(session.cur - 1));
  $("#next").addEventListener("click", next);
  $("#submit").addEventListener("click", () => {
    const left = N - progress(session).done;
    if (left && !confirm(`Còn ${left} câu chưa làm. Câu bỏ trống sẽ tính là sai. Nộp bài luôn?`)) return;
    finish();
  });

  function onKey(e) {
    if (e.target.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
    const item = q();
    const fmt = formatOf(item);
    const handled = fmt.onKey?.(e, item, session.answers[item.id], (given) => {
      answerQuestion(session, item, given);
      save();
      paint();
    });
    if (handled) { e.preventDefault(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft" && session.cur > 0) { e.preventDefault(); go(session.cur - 1); }
  }
  document.addEventListener("keydown", onKey);

  paint();
  return () => document.removeEventListener("keydown", onKey);
}

