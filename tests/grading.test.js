import { describe, it, expect } from "vitest";
import { normalizeAnswer, matchesAny } from "../src/core/grading.js";
import { formats, gradeQuestion } from "../src/formats/index.js";

describe("normalizeAnswer", () => {
  it("không phân biệt hoa thường và bỏ khoảng trắng thừa", () => {
    expect(normalizeAnswer("  Beautifully  ")).toBe("beautifully");
    expect(normalizeAnswer("is    going   to\tgo")).toBe("is going to go");
  });

  it("đổi dấu nháy cong (bàn phím điện thoại) thành nháy thẳng", () => {
    expect(normalizeAnswer("didn’t go")).toBe(normalizeAnswer("didn't go"));
  });

  it("bỏ dấu câu ở cuối", () => {
    expect(normalizeAnswer("happily.")).toBe("happily");
    expect(normalizeAnswer("happily !")).toBe("happily");
  });

  it("coi dạng rút gọn và dạng đầy đủ là như nhau", () => {
    expect(normalizeAnswer("didn't go")).toBe("did not go");
    expect(normalizeAnswer("won't come")).toBe("will not come");
    expect(normalizeAnswer("can't swim")).toBe(normalizeAnswer("cannot swim"));
    expect(normalizeAnswer("cannot swim")).toBe(normalizeAnswer("can not swim"));
    expect(normalizeAnswer("I'm going to")).toBe("i am going to");
    expect(normalizeAnswer("they're playing")).toBe("they are playing");
    expect(normalizeAnswer("she'll help")).toBe("she will help");
  });

  it("chịu được giá trị rỗng", () => {
    expect(normalizeAnswer(null)).toBe("");
    expect(normalizeAnswer(undefined)).toBe("");
  });
});

describe("matchesAny", () => {
  it("chấp nhận bất kỳ đáp án nào trong danh sách", () => {
    expect(matchesAny("does not like", ["doesn't like", "does not like"])).toBe(true);
    expect(matchesAny("Doesn’t like", ["doesn't like"])).toBe(true);
  });
  it("đáp án rỗng luôn sai", () => {
    expect(matchesAny("   ", ["help"])).toBe(false);
    expect(matchesAny("", [""])).toBe(false);
  });
  it("sai chính tả là sai", () => {
    expect(matchesAny("beautifuly", ["beautifully"])).toBe(false);
  });
});

describe("chấm theo từng format", () => {
  const mc = { format: "mc", options: ["a", "b", "c", "d"], answer: 2 };
  const fill = { format: "fill", cue: "beauty", answers: ["beautifully"] };
  const err = { format: "error", prompt: "She [[don't]] like [[playing]] football [[on]] [[Sundays]].", answer: 0, correction: "doesn't" };

  it("trắc nghiệm so vị trí đáp án", () => {
    expect(gradeQuestion(mc, 2)).toBe(true);
    expect(gradeQuestion(mc, 1)).toBe(false);
    expect(gradeQuestion(mc, null)).toBe(false);
  });
  it("điền từ dùng chuẩn hoá", () => {
    expect(gradeQuestion(fill, " BEAUTIFULLY ")).toBe(true);
    expect(gradeQuestion(fill, "beautiful")).toBe(false);
  });
  it("tìm lỗi sai so phần gạch chân", () => {
    expect(gradeQuestion(err, 0)).toBe(true);
    expect(gradeQuestion(err, 3)).toBe(false);
  });
  it("mọi format đăng ký đều có grade, render và answerText", () => {
    for (const f of Object.values(formats)) {
      expect(typeof f.grade).toBe("function");
      expect(typeof f.render).toBe("function");
      expect(typeof f.answerText).toBe("function");
      expect(typeof f.givenText).toBe("function");
    }
  });
  it("format lạ thì báo lỗi rõ ràng", () => {
    expect(() => gradeQuestion({ format: "zzz" }, 1)).toThrow(/zzz/);
  });
});
