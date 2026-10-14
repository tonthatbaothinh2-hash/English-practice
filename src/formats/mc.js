// Trắc nghiệm 4 phương án, chỗ trống "___" trong câu.
import { esc, LETTERS, withBlank, blank } from "../ui/dom.js";

export default {
  id: "mc",

  grade(q, given) {
    return given === q.answer;
  },

  answerText(q) {
    return `${LETTERS[q.answer]}. ${q.options[q.answer]}`;
  },

  givenText(q, given) {
    return given == null ? "(bỏ trống)" : `${LETTERS[given]}. ${q.options[given]}`;
  },

  // Câu hoàn chỉnh với đáp án đúng in đậm, dùng ở trang xem lại.
  solvedHtml(q) {
    return withBlank(q.prompt, `<b>${esc(q.options[q.answer])}</b>`);
  },

  render(root, q, state, onAnswer) {
    const done = !!state;
    const cls = done ? (state.correct ? "ok" : "no") : "";
    let h = `<h2 class="qtext">${withBlank(q.prompt, blank(done ? q.options[state.given] : "", cls))}</h2><div class="opts">`;
    q.options.forEach((t, i) => {
      let c = "opt";
      if (done && i === q.answer) c += " right";
      else if (done && i === state.given) c += " wrong";
      h += `<button type="button" class="${c}" data-i="${i}" ${done ? 'aria-disabled="true"' : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(t)}</span></button>`;
    });
    root.innerHTML = h + "</div>";
    if (!done) {
      root.querySelector(".opts").addEventListener("click", (e) => {
        const b = e.target.closest(".opt");
        if (b) onAnswer(+b.dataset.i);
      });
    }
  },

  onKey(e, q, state, onAnswer) {
    const i = "abcd".indexOf(e.key.toLowerCase());
    if (!state && e.key.length === 1 && i >= 0 && i < q.options.length) {
      onAnswer(i);
      return true;
    }
    return false;
  },
};
