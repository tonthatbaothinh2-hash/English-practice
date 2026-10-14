// Sổ lỗi sai: mọi câu từng làm sai. Đúng liên tiếp 2 lần thì chuyển sang "đã nắm".
import { mistakeBook, MASTERY_STREAK } from "../core/analytics.js";
import { shuffled } from "../core/session.js";
import { reviewCard } from "./review.js";

const PRACTICE_MAX = 20;

function entries(ctx) {
  return mistakeBook(ctx.store.attempts).filter((e) => ctx.bank.get(e.qid));
}

// Luyện các câu đang ôn: ưu tiên câu sai nhiều lần, rồi xáo thứ tự.
export function startMistakePractice(ctx) {
  const learning = entries(ctx).filter((e) => e.status === "learning").slice(0, PRACTICE_MAX);
  if (!learning.length) return;
  ctx.startQuiz({
    questions: shuffled(learning.map((e) => ctx.bank.get(e.qid))),
    mode: "mistake-book",
    exercise: "mistake-book",
    settings: { count: learning.length, shuffle: true },
  });
}

export function render(root, ctx) {
  const { bank } = ctx;
  const all = entries(ctx);
  const learning = all.filter((e) => e.status === "learning");
  const mastered = all.filter((e) => e.status === "mastered");
  let tab = learning.length || !mastered.length ? "learning" : "mastered";

  root.innerHTML = `<header class="top"><div><p class="kicker">${all.length} câu từng sai</p><h1>Sổ <span>lỗi sai</span></h1></div></header>
    <section class="card">
      <p class="sub">Câu nào làm sai sẽ vào sổ. Sau đó làm đúng ${MASTERY_STREAK} lần liên tiếp thì chuyển sang "Đã nắm". Sai lại thì quay về "Đang ôn".</p>
      ${learning.length ? `<button class="btn primary block" data-act="practice">Luyện ${Math.min(learning.length, PRACTICE_MAX)} câu đang ôn</button>` : ""}
    </section>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" data-t="learning">Đang ôn (${learning.length})</button>
      <button type="button" role="tab" data-t="mastered">Đã nắm (${mastered.length})</button>
    </div>
    <div class="rev" id="list"></div>`;

  const listEl = root.querySelector("#list");
  function paint() {
    root.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.t === tab)));
    const list = tab === "learning" ? learning : mastered;
    if (!list.length) {
      listEl.innerHTML = `<p class="empty">${tab === "learning"
        ? (all.length ? "Không còn câu nào đang ôn. Giỏi lắm!" : "Sổ đang trống. Câu nào bạn làm sai sẽ được ghi vào đây.")
        : "Chưa có câu nào đã nắm. Làm đúng một câu trong sổ 2 lần liên tiếp để chuyển nó sang đây."}</p>`;
      return;
    }
    listEl.innerHTML = list.map((e) => reviewCard(bank, bank.get(e.qid), {
      showExercise: true,
      extra: `<p class="streak">Sai ${e.wrongCount} lần · ${e.status === "mastered" ? "đã đúng liên tiếp " + e.streak + " lần" : `đúng liên tiếp ${e.streak}/${MASTERY_STREAK}`}</p>`,
    })).join("");
  }
  root.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) { tab = b.dataset.t; paint(); }
  });
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-act]")?.dataset.act !== "practice") return;
    if (ctx.store.inProgress && !confirm("Bạn đang làm dở một bài. Bắt đầu bài mới sẽ bỏ bài đó. Tiếp tục?")) return;
    startMistakePractice(ctx);
  });
  paint();
}

