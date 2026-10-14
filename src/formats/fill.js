// Điền từ: cho từ gốc trong ngoặc (cue), học sinh tự gõ.
import { esc, withBlank, blank } from "../ui/dom.js";
import { matchesAny } from "../core/grading.js";

function cueHtml(q) {
  return q.cue ? ` <span class="cue">(${esc(q.cue)})</span>` : "";
}

export default {
  id: "fill",

  grade(q, given) {
    return matchesAny(given, q.answers);
  },

  answerText(q) {
    return q.answers.join(" / ");
  },

  givenText(q, given) {
    return given == null || given === "" ? "(bỏ trống)" : String(given);
  },

  solvedHtml(q) {
    return withBlank(q.prompt, `<b>${esc(q.answers[0])}</b>` + cueHtml(q));
  },

  render(root, q, state, onAnswer) {
    const done = !!state;
    const cls = done ? (state.correct ? "ok" : "no") : "";
    root.innerHTML = `
      <h2 class="qtext">${withBlank(q.prompt, blank(done ? state.given : "", cls) + cueHtml(q))}</h2>
      <form class="fillForm" autocomplete="off">
        <label class="sr" for="fillInput">Câu trả lời</label>
        <input id="fillInput" class="fillInput ${cls}" type="text" inputmode="text" enterkeyhint="done"
          autocapitalize="off" autocorrect="off" spellcheck="false"
          placeholder="Gõ dạng đúng của từ" ${done ? "disabled" : ""} value="${done ? esc(state.given) : ""}">
        ${done ? "" : '<button class="btn primary" type="submit">Kiểm tra</button>'}
      </form>`;
    if (done) return;
    const input = root.querySelector("input");
    root.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      onAnswer(v);
    });
    // Không tự focus trên điện thoại để bàn phím không che câu hỏi khi vừa chuyển câu.
    if (window.matchMedia?.("(pointer: fine)").matches) input.focus();
  },
};
