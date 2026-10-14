// Ngân hàng câu hỏi: nạp, kiểm tra và lọc.
import { formats } from "../formats/index.js";
import { segmentTexts } from "./grading.js";

const LEVELS = [1, 2, 3];

// Trả về danh sách lỗi của một câu hỏi (mảng rỗng nghĩa là hợp lệ).
export function validateQuestion(q, catalog) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };
  need(typeof q.id === "string" && q.id, "thiếu id");
  need(catalog.exercises.some((e) => e.id === q.exercise), `exercise lạ: ${q.exercise}`);
  need(!!formats[q.format], `format lạ: ${q.format}`);
  need(catalog.topics.some((t) => t.id === q.topic), `topic lạ: ${q.topic}`);
  need(LEVELS.includes(q.level), "level phải là 1, 2 hoặc 3");
  need(typeof q.prompt === "string" && q.prompt.trim(), "thiếu prompt");
  need(typeof q.explain === "string" && q.explain.trim(), "thiếu explain");
  if (q.format === "mc") {
    need(Array.isArray(q.options) && q.options.length === 4, "mc cần đúng 4 options");
    need(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, "mc cần answer từ 0 đến 3");
    need(q.prompt.includes("___"), "mc cần chỗ trống ___ trong prompt");
    if (Array.isArray(q.options)) {
      need(new Set(q.options.map((o) => o.toLowerCase())).size === q.options.length, "options bị trùng");
    }
  }
  if (q.format === "fill") {
    need(Array.isArray(q.answers) && q.answers.length > 0 && q.answers.every((a) => typeof a === "string" && a.trim()), "fill cần answers không rỗng");
    need(q.prompt.includes("___"), "fill cần chỗ trống ___ trong prompt");
    need(typeof q.cue === "string" && q.cue.trim(), "fill cần cue (từ gốc trong ngoặc)");
  }
  if (q.format === "error") {
    const segs = typeof q.prompt === "string" ? segmentTexts(q.prompt) : [];
    need(segs.length === 4, "error cần đúng 4 phần [[...]]");
    need(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < segs.length, "error cần answer hợp lệ");
    need(typeof q.correction === "string" && q.correction.trim(), "error cần correction");
  }
  return errs;
}

export function createBank(catalog, questions) {
  const byId = new Map();
  for (const q of questions) {
    if (byId.has(q.id)) throw new Error(`Trùng id câu hỏi: ${q.id}`);
    byId.set(q.id, q);
  }
  const topics = new Map(catalog.topics.map((t) => [t.id, t]));
  const groups = new Map(catalog.groups.map((g) => [g.id, g]));
  const exercises = new Map(catalog.exercises.map((e) => [e.id, e]));
  const groupOf = (topicId) => topics.get(topicId)?.group;

  return {
    catalog,
    questions,
    get: (id) => byId.get(id),
    topic: (id) => topics.get(id) || { id, name: id, group: "", tip: "" },
    group: (id) => groups.get(id) || { id, name: id },
    exercise: (id) => exercises.get(id),
    groupOf,

    // Các lựa chọn lọc cho một dạng bài: chủ đề hoặc nhóm chủ đề, kèm số câu.
    filterOptions(exerciseId) {
      const ex = exercises.get(exerciseId);
      const qs = questions.filter((q) => q.exercise === exerciseId);
      const list = ex?.filterBy === "group" ? catalog.groups : catalog.topics;
      const key = ex?.filterBy === "group" ? (q) => groupOf(q.topic) : (q) => q.topic;
      return list
        .map((o) => ({ id: o.id, name: o.name, count: qs.filter((q) => key(q) === o.id).length }))
        .filter((o) => o.count > 0);
    },

    // Câu hỏi của một dạng bài thuộc các lựa chọn lọc đã chọn.
    pool(exerciseId, filterIds) {
      const ex = exercises.get(exerciseId);
      const set = new Set(filterIds);
      const key = ex?.filterBy === "group" ? (q) => groupOf(q.topic) : (q) => q.topic;
      return questions.filter((q) => q.exercise === exerciseId && set.has(key(q)));
    },

    // Mọi câu của một chủ đề, ở tất cả dạng bài (dùng cho "Nên ôn tiếp").
    topicPool(topicId) {
      return questions.filter((q) => q.topic === topicId);
    },
  };
}
