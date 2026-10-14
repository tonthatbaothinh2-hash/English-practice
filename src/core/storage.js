// Lưu dữ liệu trong localStorage. Không có localStorage (chế độ ẩn danh, bị chặn) thì giữ trong bộ nhớ
// và báo cho giao diện biết qua store.persistent.
export const STORAGE_KEY = "e7practice.v1";
const VERSION = 1;

function memoryBackend() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function defaultBackend() {
  try {
    const ls = globalThis.localStorage;
    const probe = "__e7probe";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return { backend: ls, persistent: true };
  } catch {
    return { backend: memoryBackend(), persistent: false };
  }
}

function emptyState() {
  return { version: VERSION, attempts: [], inProgress: null, prefs: {} };
}

export function isValidAttempt(a) {
  return (
    a && typeof a === "object" &&
    typeof a.id === "string" &&
    !Number.isNaN(Date.parse(a.finishedAt)) &&
    a.score && Number.isFinite(a.score.correct) && Number.isFinite(a.score.total) &&
    Array.isArray(a.items) &&
    a.items.every((it) => it && typeof it.qid === "string" && typeof it.correct === "boolean")
  );
}

export function createStore(backendArg) {
  const { backend, persistent } = backendArg ? { backend: backendArg, persistent: true } : defaultBackend();
  let state = emptyState();
  try {
    const raw = backend.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...emptyState(), ...parsed, attempts: (parsed.attempts || []).filter(isValidAttempt) };
    }
  } catch {
    state = emptyState();
  }

  let lastError = null;
  function save() {
    try {
      backend.setItem(STORAGE_KEY, JSON.stringify(state));
      lastError = null;
    } catch (e) {
      lastError = e;
    }
  }

  return {
    persistent,
    get lastError() { return lastError; },
    get attempts() { return state.attempts; },
    getAttempt: (id) => state.attempts.find((a) => a.id === id),
    addAttempt(a) {
      state.attempts = state.attempts.filter((x) => x.id !== a.id).concat(a);
      save();
    },
    get inProgress() { return state.inProgress; },
    setInProgress(s) { state.inProgress = s; save(); },
    get prefs() { return state.prefs || {}; },
    setPrefs(p) { state.prefs = { ...state.prefs, ...p }; save(); },

    exportData() {
      return JSON.stringify({ app: "english7-practice", version: VERSION, exportedAt: new Date().toISOString(), attempts: state.attempts }, null, 2);
    },

    // Gộp dữ liệu từ file sao lưu: thêm lần làm chưa có, bỏ qua lần làm trùng id hoặc hỏng.
    importData(text) {
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("File không phải JSON hợp lệ."); }
      const list = Array.isArray(data) ? data : data?.attempts;
      if (!Array.isArray(list)) throw new Error("File không có danh sách bài làm (attempts).");
      const have = new Set(state.attempts.map((a) => a.id));
      let added = 0, skipped = 0, invalid = 0;
      for (const a of list) {
        if (!isValidAttempt(a)) { invalid++; continue; }
        if (have.has(a.id)) { skipped++; continue; }
        state.attempts.push(a);
        have.add(a.id);
        added++;
      }
      state.attempts.sort((a, b) => Date.parse(a.finishedAt) - Date.parse(b.finishedAt));
      save();
      return { added, skipped, invalid };
    },

    clearAll() {
      state = emptyState();
      save();
    },
  };
}
