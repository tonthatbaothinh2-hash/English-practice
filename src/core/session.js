// Một lượt làm bài: chọn câu, ghi đáp án, tính thời gian, xuất bản ghi kết quả.
import { gradeQuestion } from "../formats/index.js";

// Thời gian tối đa tính cho một câu, để để máy qua đêm không làm sai thời gian làm bài.
const MAX_STEP_MS = 3 * 60 * 1000;

export function shuffled(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Chọn count câu từ pool, chia đều giữa các chủ đề. shuffle = false thì giữ thứ tự trong ngân hàng.
export function pickQuestions(pool, { count, shuffle }, rng = Math.random) {
  const order = new Map(pool.map((q, i) => [q.id, i]));
  const groups = new Map();
  for (const q of pool) {
    if (!groups.has(q.topic)) groups.set(q.topic, []);
    groups.get(q.topic).push(q);
  }
  const lists = [...groups.values()].map((g) => shuffled(g, rng));
  const picked = [];
  const n = Math.min(count || pool.length, pool.length);
  for (let round = 0; picked.length < n; round++) {
    for (const l of lists) {
      if (picked.length >= n) break;
      if (round < l.length) picked.push(l[round]);
    }
  }
  return shuffle ? shuffled(picked, rng) : picked.sort((a, b) => order.get(a.id) - order.get(b.id));
}

function newId(now) {
  const d = new Date(now);
  const p = (x) => String(x).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `a-${stamp}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createSession({ questions, mode = "normal", exercise, topics = [], settings = {}, now = Date.now() }) {
  return {
    id: newId(now),
    startedAt: new Date(now).toISOString(),
    mode,
    exercise,
    topics,
    settings,
    qids: questions.map((q) => q.id),
    answers: {},
    cur: 0,
    elapsedMs: 0,
    lastTick: now,
  };
}

// Cộng dồn thời gian thực sự làm bài.
export function tick(session, now = Date.now()) {
  session.elapsedMs += Math.min(Math.max(0, now - session.lastTick), MAX_STEP_MS);
  session.lastTick = now;
}

export function answerQuestion(session, q, given, now = Date.now()) {
  if (session.answers[q.id]) return session.answers[q.id];
  tick(session, now);
  const rec = { given, correct: gradeQuestion(q, given) };
  session.answers[q.id] = rec;
  return rec;
}

export function progress(session) {
  const recs = Object.values(session.answers);
  return {
    total: session.qids.length,
    done: recs.length,
    correct: recs.filter((r) => r.correct).length,
  };
}

export function finishSession(session, bank, now = Date.now()) {
  tick(session, now);
  const items = session.qids.map((qid) => {
    const a = session.answers[qid];
    return {
      qid,
      topic: bank.get(qid)?.topic ?? "?",
      given: a ? a.given : null,
      correct: a ? a.correct : false,
    };
  });
  return {
    id: session.id,
    startedAt: session.startedAt,
    finishedAt: new Date(now).toISOString(),
    durationSec: Math.round(session.elapsedMs / 1000),
    mode: session.mode,
    exercise: session.exercise,
    topics: session.topics,
    settings: session.settings,
    score: { correct: items.filter((i) => i.correct).length, total: items.length },
    items,
  };
}
