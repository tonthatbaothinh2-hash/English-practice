// Thống kê và sổ lỗi sai. Tất cả là hàm thuần, tính từ danh sách các lần làm (attempts).
// Câu bỏ trống (given === null) không tính vào thống kê dài hạn và sổ lỗi.

const answered = (it) => it.given !== null && it.given !== undefined && it.given !== "";

function byTime(attempts) {
  return [...attempts].sort((a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt));
}

export function topicStats(attempts) {
  const out = {};
  for (const a of attempts) {
    for (const it of a.items) {
      if (!answered(it)) continue;
      const s = (out[it.topic] ||= { correct: 0, total: 0, rate: 0 });
      s.total++;
      if (it.correct) s.correct++;
    }
  }
  for (const s of Object.values(out)) s.rate = s.correct / s.total;
  return out;
}

// Điểm theo chủ đề của một lần làm: câu bỏ trống tính là sai (giống điểm tổng).
export function attemptBreakdown(attempt) {
  const out = {};
  for (const it of attempt.items) {
    const s = (out[it.topic] ||= { correct: 0, total: 0 });
    s.total++;
    if (it.correct) s.correct++;
  }
  return out;
}

export function scoreSeries(attempts) {
  return byTime(attempts).map((a) => ({
    id: a.id,
    at: a.finishedAt,
    pct: a.score.total ? Math.round((a.score.correct / a.score.total) * 100) : 0,
  }));
}

export function mostMissed(attempts, limit = 10) {
  const m = new Map();
  for (const a of attempts) {
    for (const it of a.items) {
      if (!answered(it)) continue;
      const e = m.get(it.qid) || { qid: it.qid, topic: it.topic, wrong: 0, total: 0 };
      e.total++;
      if (!it.correct) e.wrong++;
      m.set(it.qid, e);
    }
  }
  return [...m.values()]
    .filter((e) => e.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total)
    .slice(0, limit);
}

export const MASTERY_STREAK = 2;

// Sổ lỗi sai: câu nào từng sai thì vào sổ. Sau lần sai gần nhất, đúng MASTERY_STREAK lần liên tiếp
// thì thành "mastered" (đã nắm); sai lại thì về "learning" (đang ôn).
export function mistakeBook(attempts) {
  const book = new Map();
  for (const a of byTime(attempts)) {
    for (const it of a.items) {
      if (!answered(it)) continue;
      let e = book.get(it.qid);
      if (!it.correct) {
        if (!e) {
          e = { qid: it.qid, topic: it.topic, wrongCount: 0, streak: 0, status: "learning", lastWrongAt: null };
          book.set(it.qid, e);
        }
        e.wrongCount++;
        e.streak = 0;
        e.status = "learning";
        e.lastWrongAt = a.finishedAt;
      } else if (e) {
        e.streak++;
        if (e.streak >= MASTERY_STREAK) e.status = "mastered";
      }
    }
  }
  return [...book.values()].sort(
    (a, b) => b.wrongCount - a.wrongCount || Date.parse(b.lastWrongAt) - Date.parse(a.lastWrongAt)
  );
}

// Chủ đề nên ôn tiếp: tỷ lệ đúng thấp nhất trong các chủ đề đã làm ít nhất minItems câu.
// Bỏ qua chủ đề đã đúng hết. Bằng tỷ lệ thì chọn chủ đề làm ít câu hơn.
export function suggestTopic(attempts, { minItems = 5 } = {}) {
  const stats = topicStats(attempts);
  const cands = Object.entries(stats)
    .filter(([, s]) => s.total >= minItems && s.rate < 1)
    .sort(([, a], [, b]) => a.rate - b.rate || a.total - b.total);
  if (!cands.length) return null;
  const [topic, s] = cands[0];
  return { topic, ...s };
}

export function totals(attempts) {
  let items = 0, correct = 0, seconds = 0;
  for (const a of attempts) {
    seconds += a.durationSec || 0;
    for (const it of a.items) {
      if (!answered(it)) continue;
      items++;
      if (it.correct) correct++;
    }
  }
  return { attempts: attempts.length, items, correct, seconds };
}
