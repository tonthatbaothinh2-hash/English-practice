// Khối xem lại một câu hỏi, dùng chung cho kết quả, lịch sử, thống kê và sổ lỗi.
import { esc } from "../ui/dom.js";
import { formatOf } from "../formats/index.js";
import { exerciseName } from "../ui/labels.js";

// item: { given, correct } nếu có câu trả lời của học sinh; extra: HTML thêm (ví dụ số lần sai).
export function reviewCard(bank, q, { num, item, extra = "", showExercise = false } = {}) {
  if (!q) {
    return `<article><p class="why">Câu này không còn trong ngân hàng câu hỏi.</p></article>`;
  }
  const fmt = formatOf(q);
  const topic = bank.topic(q.topic);
  const tag = [showExercise ? exerciseName(bank, q.exercise) : "", topic.name].filter(Boolean).join(" · ");
  const cls = item ? (item.correct ? "isok" : "isno") : "";
  let h = `<article class="${cls}"><p class="tag">${esc(tag)}</p>`;
  h += `<p>${num ? `<b>Câu ${num}.</b> ` : ""}${fmt.solvedHtml(q)}</p>`;
  if (item) {
    h += item.correct
      ? `<p class="pick okpick">Bạn trả lời đúng: ${esc(fmt.givenText(q, item.given))}</p>`
      : `<p class="pick">Bạn trả lời: ${esc(fmt.givenText(q, item.given))}</p><p class="fix">Đáp án: ${esc(fmt.answerText(q))}</p>`;
  } else {
    h += `<p class="fix">Đáp án: ${esc(fmt.answerText(q))}</p>`;
  }
  h += `<p class="why">${esc(q.explain)}</p>${extra}</article>`;
  return h;
}
