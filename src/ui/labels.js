// Tên hiển thị cho các lần làm, và lời nhận xét theo điểm.
export const PSEUDO_EXERCISES = {
  "topic-review": "Ôn theo chủ đề",
  "mistake-book": "Luyện sổ lỗi sai",
  "most-missed": "Luyện câu hay sai",
};

export function exerciseName(bank, id) {
  return bank.exercise(id)?.name || PSEUDO_EXERCISES[id] || id;
}

export function attemptTitle(bank, a) {
  const base = exerciseName(bank, a.exercise);
  return a.mode === "retry-wrong" ? `${base} (làm lại câu sai)` : base;
}

// Tên các chủ đề hoặc nhóm đã chọn, rút gọn.
export function filtersText(bank, a) {
  const names = (a.topics || []).map((id) => bank.catalog.topics.find((t) => t.id === id)?.name || bank.group(id).name);
  if (!names.length) return "";
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ");
}

export function verdict(p) {
  if (p >= 90) return ["Rất tốt", "Bạn nắm chắc phần này rồi."];
  if (p >= 70) return ["Khá ổn", "Xem lại các câu sai bên dưới là bạn lên điểm ngay."];
  if (p >= 50) return ["Cần ôn thêm", "Đọc kỹ phần giải thích rồi làm lại các câu sai nhé."];
  return ["Hãy ôn lại một lượt", "Đọc phần giải thích của từng câu sai, sau đó làm lại bài."];
}
