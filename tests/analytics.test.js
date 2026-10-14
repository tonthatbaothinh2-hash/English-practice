import { describe, it, expect } from "vitest";
import {
  topicStats, attemptBreakdown, scoreSeries, mostMissed, mistakeBook, suggestTopic,
} from "../src/core/analytics.js";

// Tạo nhanh một lần làm. items: [qid, topic, given, correct]
let n = 0;
function attempt(items, minute = n) {
  n++;
  const at = new Date(Date.UTC(2026, 9, 1, 8, minute)).toISOString();
  const its = items.map(([qid, topic, given, correct]) => ({ qid, topic, given, correct }));
  return {
    id: "a" + n, finishedAt: at, startedAt: at, durationSec: 60, mode: "normal",
    exercise: "x", topics: [], settings: {},
    score: { correct: its.filter((i) => i.correct).length, total: its.length },
    items: its,
  };
}

describe("topicStats", () => {
  it("tính tỷ lệ đúng theo chủ đề, bỏ qua câu bỏ trống", () => {
    const s = topicStats([
      attempt([["q1", "noun", 1, true], ["q2", "noun", 0, false], ["q3", "adj", null, false]]),
      attempt([["q1", "noun", 1, true], ["q4", "adj", 2, true]]),
    ]);
    expect(s.noun).toEqual({ correct: 2, total: 3, rate: 2 / 3 });
    expect(s.adj).toEqual({ correct: 1, total: 1, rate: 1 });
  });
  it("không có dữ liệu thì trả về rỗng", () => {
    expect(topicStats([])).toEqual({});
  });
});

describe("attemptBreakdown", () => {
  it("điểm theo chủ đề của một lần làm tính câu bỏ trống là sai", () => {
    const a = attempt([["q1", "noun", 1, true], ["q2", "noun", null, false], ["q3", "adv", 0, false]]);
    expect(attemptBreakdown(a)).toEqual({
      noun: { correct: 1, total: 2 },
      adv: { correct: 0, total: 1 },
    });
  });
});

describe("scoreSeries", () => {
  it("sắp xếp theo thời gian và đổi ra phần trăm", () => {
    const late = attempt([["q1", "noun", 1, true]], 50);
    const early = attempt([["q1", "noun", 0, false], ["q2", "noun", 1, true]], 10);
    expect(scoreSeries([late, early]).map((p) => p.pct)).toEqual([50, 100]);
  });
});

describe("mostMissed", () => {
  it("xếp câu sai nhiều nhất lên đầu", () => {
    const list = mostMissed([
      attempt([["q1", "noun", 0, false], ["q2", "adj", 0, false]]),
      attempt([["q1", "noun", 0, false], ["q2", "adj", 1, true], ["q3", "adv", 1, true]]),
    ]);
    expect(list.map((x) => x.qid)).toEqual(["q1", "q2"]);
    expect(list[0]).toMatchObject({ qid: "q1", wrong: 2, total: 2 });
  });
  it("giới hạn số câu trả về", () => {
    const a = attempt([["q1", "n", 0, false], ["q2", "n", 0, false], ["q3", "n", 0, false]]);
    expect(mostMissed([a], 2)).toHaveLength(2);
  });
});

describe("mistakeBook", () => {
  const book = (atts) => Object.fromEntries(mistakeBook(atts).map((e) => [e.qid, e]));

  it("câu làm đúng ngay từ đầu không vào sổ", () => {
    expect(mistakeBook([attempt([["q1", "noun", 1, true]])])).toEqual([]);
  });

  it("câu sai vào sổ ở trạng thái đang ôn", () => {
    const b = book([attempt([["q1", "noun", 0, false]])]);
    expect(b.q1).toMatchObject({ status: "learning", wrongCount: 1, streak: 0 });
  });

  it("đúng 2 lần liên tiếp sau lần sai thì đã nắm", () => {
    const b = book([
      attempt([["q1", "noun", 0, false]], 1),
      attempt([["q1", "noun", 1, true]], 2),
      attempt([["q1", "noun", 1, true]], 3),
    ]);
    expect(b.q1).toMatchObject({ status: "mastered", streak: 2 });
  });

  it("đúng 1 lần chưa đủ", () => {
    const b = book([attempt([["q1", "noun", 0, false]], 1), attempt([["q1", "noun", 1, true]], 2)]);
    expect(b.q1.status).toBe("learning");
  });

  it("sai lại sau khi đã nắm thì quay về đang ôn", () => {
    const b = book([
      attempt([["q1", "noun", 0, false]], 1),
      attempt([["q1", "noun", 1, true]], 2),
      attempt([["q1", "noun", 1, true]], 3),
      attempt([["q1", "noun", 2, false]], 4),
    ]);
    expect(b.q1).toMatchObject({ status: "learning", wrongCount: 2, streak: 0 });
  });

  it("đúng - sai - đúng không phải liên tiếp", () => {
    const b = book([
      attempt([["q1", "noun", 0, false]], 1),
      attempt([["q1", "noun", 1, true]], 2),
      attempt([["q1", "noun", 0, false]], 3),
      attempt([["q1", "noun", 1, true]], 4),
    ]);
    expect(b.q1).toMatchObject({ status: "learning", streak: 1 });
  });

  it("xử lý theo thời gian chứ không theo thứ tự mảng", () => {
    const b = book([
      attempt([["q1", "noun", 1, true]], 30),
      attempt([["q1", "noun", 1, true]], 20),
      attempt([["q1", "noun", 0, false]], 10),
    ]);
    expect(b.q1.status).toBe("mastered");
  });

  it("câu bỏ trống không vào sổ và không cắt chuỗi đúng", () => {
    const b = book([
      attempt([["q1", "noun", 0, false], ["q2", "adj", null, false]], 1),
      attempt([["q1", "noun", 1, true]], 2),
      attempt([["q1", "noun", null, false]], 3),
      attempt([["q1", "noun", 1, true]], 4),
    ]);
    expect(b.q2).toBeUndefined();
    expect(b.q1.status).toBe("mastered");
  });
});

describe("suggestTopic", () => {
  it("chọn chủ đề có tỷ lệ đúng thấp nhất trong các chủ đề đã làm đủ câu", () => {
    const items = [];
    for (let i = 0; i < 5; i++) items.push(["n" + i, "noun", 0, i < 4]); // 80%
    for (let i = 0; i < 5; i++) items.push(["a" + i, "adj", 0, i < 2]); // 40%
    for (let i = 0; i < 2; i++) items.push(["v" + i, "adv", 0, false]); // 0% nhưng mới 2 câu
    const s = suggestTopic([attempt(items)]);
    expect(s).toMatchObject({ topic: "adj", correct: 2, total: 5 });
  });

  it("bằng tỷ lệ thì chọn chủ đề làm ít hơn", () => {
    const items = [];
    for (let i = 0; i < 10; i++) items.push(["n" + i, "noun", 0, i < 5]);
    for (let i = 0; i < 6; i++) items.push(["a" + i, "adj", 0, i < 3]);
    expect(suggestTopic([attempt(items)]).topic).toBe("adj");
  });

  it("không gợi ý khi chưa đủ dữ liệu hoặc mọi chủ đề đều đúng hết", () => {
    expect(suggestTopic([])).toBeNull();
    const items = [];
    for (let i = 0; i < 6; i++) items.push(["n" + i, "noun", 0, true]);
    expect(suggestTopic([attempt(items)])).toBeNull();
  });
});
