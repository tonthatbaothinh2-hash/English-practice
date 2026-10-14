// Kiểm tra ngân hàng câu hỏi. Chạy mỗi khi sửa file JSON: npm test
import { describe, it, expect } from "vitest";
import { bank, questionFiles } from "../src/data/index.js";
import { validateQuestion } from "../src/core/bank.js";
import { gradeQuestion } from "../src/formats/index.js";

const { catalog, questions } = bank;
const MIN_PER_FILTER = 15;

function countBy(list, key) {
  const m = {};
  for (const x of list) m[key(x)] = (m[key(x)] || 0) + 1;
  return m;
}

describe("ngân hàng câu hỏi", () => {
  it("mọi file JSON là một mảng", () => {
    for (const [name, list] of Object.entries(questionFiles)) {
      expect(Array.isArray(list), name).toBe(true);
    }
  });

  it("mọi câu hợp lệ (đủ trường, đúng kiểu)", () => {
    const problems = questions
      .map((q) => [q.id, validateQuestion(q, catalog)])
      .filter(([, errs]) => errs.length)
      .map(([id, errs]) => `${id}: ${errs.join("; ")}`);
    expect(problems).toEqual([]);
  });

  it("id không trùng", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`mỗi lựa chọn lọc của mỗi dạng bài có ít nhất ${MIN_PER_FILTER} câu`, () => {
    const short = [];
    for (const ex of catalog.exercises) {
      const opts = bank.filterOptions(ex.id);
      expect(opts.length, ex.id).toBeGreaterThan(0);
      for (const o of opts) if (o.count < MIN_PER_FILTER) short.push(`${ex.id}/${o.id}: ${o.count}`);
    }
    expect(short).toEqual([]);
  });

  it("vị trí đáp án đúng chia đều A, B, C, D (lệch tối đa 1) trong mỗi lựa chọn lọc", () => {
    const bad = [];
    for (const ex of catalog.exercises) {
      for (const o of bank.filterOptions(ex.id)) {
        const choice = bank.pool(ex.id, [o.id]).filter((q) => q.format === "mc" || q.format === "error");
        if (choice.length < 4) continue;
        const c = countBy(choice, (q) => q.answer);
        const counts = [0, 1, 2, 3].map((i) => c[i] || 0);
        if (Math.max(...counts) - Math.min(...counts) > 1) bad.push(`${ex.id}/${o.id}: ${counts.join(",")}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("đáp án trong file được chính bộ chấm chấp nhận", () => {
    for (const q of questions) {
      if (q.format === "fill") for (const a of q.answers) expect(gradeQuestion(q, a), q.id).toBe(true);
      else expect(gradeQuestion(q, q.answer), q.id).toBe(true);
    }
  });

  it("mỗi câu chỉ có một chỗ trống", () => {
    for (const q of questions.filter((q) => q.format !== "error")) {
      expect(q.prompt.split("___").length - 1, q.id).toBe(1);
    }
  });

  it("có 40 câu gốc của bản đầu tiên", () => {
    expect(questions.filter((q) => q.exercise === "word-form-mc").length).toBeGreaterThanOrEqual(40);
  });
});
