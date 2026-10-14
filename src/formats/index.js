// Registry các format. Thêm format mới: tạo file trong thư mục này rồi thêm một dòng bên dưới.
// Mỗi format cần: grade(q, given), render(root, q, state, onAnswer), answerText(q),
// givenText(q, given), solvedHtml(q); tuỳ chọn onKey(e, q, state, onAnswer).
import mc from "./mc.js";
import fill from "./fill.js";
import error from "./error.js";

export const formats = { mc, fill, error };

export function formatOf(q) {
  const f = formats[q.format];
  if (!f) throw new Error(`Không có format "${q.format}" (câu ${q.id ?? "?"})`);
  return f;
}

export function gradeQuestion(q, given) {
  const f = formatOf(q);
  if (given == null) return false;
  return f.grade(q, given);
}
