import { describe, it, expect } from "vitest";
import { pickQuestions, createSession, answerQuestion, finishSession, progress } from "../src/core/session.js";
import { createStore } from "../src/core/storage.js";
import { createBank } from "../src/core/bank.js";

const catalog = {
  exercises: [{ id: "ex", name: "Ex", filterBy: "topic" }],
  groups: [{ id: "g", name: "G" }],
  topics: [{ id: "noun", group: "g", name: "N" }, { id: "adj", group: "g", name: "A" }],
};
const qs = [];
for (let i = 0; i < 10; i++) {
  qs.push({ id: "n" + i, exercise: "ex", format: "mc", topic: "noun", level: 1, prompt: "x ___", options: ["a", "b", "c", "d"], answer: 1, explain: "e" });
  qs.push({ id: "j" + i, exercise: "ex", format: "fill", topic: "adj", level: 1, prompt: "y ___", cue: "c", answers: ["happy"], explain: "e" });
}
const bank = createBank(catalog, qs);

function memory() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
}

describe("pickQuestions", () => {
  it("chia đều giữa các chủ đề và không trùng", () => {
    const p = pickQuestions(qs, { count: 10, shuffle: true });
    expect(p).toHaveLength(10);
    expect(new Set(p.map((q) => q.id)).size).toBe(10);
    expect(p.filter((q) => q.topic === "noun")).toHaveLength(5);
  });
  it("không xáo thì giữ thứ tự ngân hàng", () => {
    const p = pickQuestions(qs, { count: 6, shuffle: false });
    const idx = p.map((q) => qs.indexOf(q));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
  it("pool ít hơn số câu thì lấy hết", () => {
    expect(pickQuestions(qs.slice(0, 3), { count: 40, shuffle: true })).toHaveLength(3);
  });
});

describe("session", () => {
  it("chấm, đếm tiến độ và xuất bản ghi có câu bỏ trống", () => {
    const s = createSession({ questions: [bank.get("n0"), bank.get("j0"), bank.get("n1")], exercise: "ex", now: 0 });
    answerQuestion(s, bank.get("n0"), 1, 10_000);
    answerQuestion(s, bank.get("j0"), " Happy ", 20_000);
    answerQuestion(s, bank.get("j0"), "sad", 25_000); // trả lời lại không đổi kết quả
    expect(progress(s)).toEqual({ total: 3, done: 2, correct: 2 });
    const a = finishSession(s, bank, 30_000);
    expect(a.score).toEqual({ correct: 2, total: 3 });
    expect(a.durationSec).toBe(30);
    expect(a.items[2]).toEqual({ qid: "n1", topic: "noun", given: null, correct: false });
  });
});

describe("storage", () => {
  const att = (id, t = "2026-10-01T08:00:00Z") => ({ id, finishedAt: t, score: { correct: 1, total: 1 }, items: [{ qid: "n0", topic: "noun", given: 1, correct: true }] });

  it("lưu và đọc lại được", () => {
    const be = memory();
    createStore(be).addAttempt(att("a1"));
    expect(createStore(be).attempts.map((a) => a.id)).toEqual(["a1"]);
  });

  it("nhập file gộp theo id, bỏ bản trùng và bản hỏng", () => {
    const st = createStore(memory());
    st.addAttempt(att("a1"));
    const file = JSON.stringify({ attempts: [att("a1"), att("a2", "2026-09-01T00:00:00Z"), { id: "bad" }] });
    expect(st.importData(file)).toEqual({ added: 1, skipped: 1, invalid: 1 });
    expect(st.attempts.map((a) => a.id)).toEqual(["a2", "a1"]);
  });

  it("xuất rồi nhập sang máy khác giữ nguyên dữ liệu", () => {
    const st = createStore(memory());
    st.addAttempt(att("a1"));
    const other = createStore(memory());
    other.importData(st.exportData());
    expect(other.attempts).toEqual(st.attempts);
  });

  it("file không hợp lệ thì báo lỗi", () => {
    const st = createStore(memory());
    expect(() => st.importData("không phải json")).toThrow();
    expect(() => st.importData("{}")).toThrow();
  });

  it("dữ liệu hỏng trong localStorage không làm sập app", () => {
    const be = memory();
    be.setItem("e7practice.v1", "{hỏng");
    expect(createStore(be).attempts).toEqual([]);
  });
});
