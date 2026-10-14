// Tìm lỗi sai: câu có 4 phần gạch chân viết trong [[...]], chọn phần sai.
import { esc, LETTERS } from "../ui/dom.js";
import { splitSegments, segmentTexts } from "../core/grading.js";

function sentenceHtml(q, state) {
  return splitSegments(q.prompt).map((p) => {
    if (p.seg < 0) return esc(p.text);
    let c = "useg";
    if (state && p.seg === q.answer) c += " right";
    else if (state && p.seg === state.given) c += " wrong";
    return `<span class="${c}">${esc(p.text)}<sub>${LETTERS[p.seg]}</sub></span>`;
  }).join("");
}

export default {
  id: "error",

  grade(q, given) {
    return given === q.answer;
  },

  answerText(q) {
    const segs = segmentTexts(q.prompt);
    return `${LETTERS[q.answer]}. ${segs[q.answer]} → ${q.correction}`;
  },

  givenText(q, given) {
    return given == null ? "(bỏ trống)" : `${LETTERS[given]}. ${segmentTexts(q.prompt)[given]}`;
  },

  solvedHtml(q) {
    return splitSegments(q.prompt).map((p) =>
      p.seg === q.answer ? `<s>${esc(p.text)}</s> <b>${esc(q.correction)}</b>` : esc(p.text)
    ).join("");
  },

  render(root, q, state, onAnswer) {
    const done = !!state;
    let h = `<h2 class="qtext errText">${sentenceHtml(q, state)}</h2><div class="opts">`;
    segmentTexts(q.prompt).forEach((t, i) => {
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
    if (!state && e.key.length === 1 && i >= 0) { onAnswer(i); return true; }
    return false;
  },
};
