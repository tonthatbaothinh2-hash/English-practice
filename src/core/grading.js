// Chuẩn hoá câu trả lời gõ tay trước khi so sánh.
// Mục tiêu: chỉ chấm sai khi học sinh sai thật, không sai vì bàn phím điện thoại.
export function normalizeAnswer(text) {
  let t = String(text ?? "")
    .toLowerCase()
    .replace(/[‘’‛ʼ`´]/g, "'") // nháy cong, nháy ngược → nháy thẳng
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s.!?,;:]+$/, "");

  // Dạng rút gọn và dạng đầy đủ được coi là một.
  t = t
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "can not")
    .replace(/\bcannot\b/g, "can not")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/n't\b/g, " not")
    .replace(/'m\b/g, " am")
    .replace(/'re\b/g, " are")
    .replace(/'ll\b/g, " will")
    .replace(/'ve\b/g, " have");

  return t.replace(/\s+/g, " ").trim();
}

export function matchesAny(given, answers) {
  const g = normalizeAnswer(given);
  if (!g) return false;
  return (answers || []).some((a) => normalizeAnswer(a) === g);
}

// Câu tìm lỗi sai viết các phần gạch chân trong [[...]].
// Trả về danh sách phần: { text, seg } với seg là chỉ số phần gạch chân (hoặc -1 nếu là chữ thường).
export function splitSegments(prompt) {
  const parts = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0, m, seg = 0;
  while ((m = re.exec(prompt))) {
    if (m.index > last) parts.push({ text: prompt.slice(last, m.index), seg: -1 });
    parts.push({ text: m[1], seg: seg++ });
    last = re.lastIndex;
  }
  if (last < prompt.length) parts.push({ text: prompt.slice(last), seg: -1 });
  return parts;
}

export function segmentTexts(prompt) {
  return splitSegments(prompt).filter((p) => p.seg >= 0).map((p) => p.text);
}
