import "./styles/app.css";
import { bank } from "./data/index.js";
import { createStore } from "./core/storage.js";
import { createSession } from "./core/session.js";
import { mistakeBook } from "./core/analytics.js";
import * as home from "./views/home.js";
import * as quiz from "./views/quiz.js";
import * as attempt from "./views/attempt.js";
import * as history from "./views/history.js";
import * as stats from "./views/stats.js";
import * as mistakes from "./views/mistakes.js";

const root = document.getElementById("app");
const store = createStore();

const ctx = {
  bank,
  store,
  go(path) {
    if (location.hash === "#" + path) render();
    else location.hash = path;
  },
  // Bắt đầu một lượt làm bài mới (ghi đè bài đang làm dở nếu có).
  startQuiz({ questions, mode = "normal", exercise, topics = [], settings = {} }) {
    if (!questions.length) return;
    store.setInProgress(createSession({ questions, mode, exercise, topics, settings }));
    ctx.go("/quiz");
  },
};

// Bảng định tuyến theo hash, để chạy được trên GitHub Pages mà không cần cấu hình server.
const routes = [
  [/^\/?$/, home, "home"],
  [/^\/quiz$/, quiz, "home"],
  [/^\/result\/(.+)$/, attempt, "home", { fromQuiz: true }],
  [/^\/history$/, history, "history"],
  [/^\/history\/(.+)$/, attempt, "history"],
  [/^\/stats$/, stats, "stats"],
  [/^\/mistakes$/, mistakes, "mistakes"],
];

let cleanup = null;
function render() {
  const path = decodeURIComponent(location.hash.replace(/^#/, "")) || "/";
  let match = null;
  for (const [re, view, tab, extra] of routes) {
    const m = path.match(re);
    if (m) { match = { view, tab, params: { id: m[1], ...extra } }; break; }
  }
  if (!match) { location.hash = "/"; return; }
  if (cleanup) { cleanup(); cleanup = null; }
  // Mỗi lần chuyển trang tạo phần tử mới, để sự kiện của trang cũ không còn sót lại.
  const el = document.createElement("div");
  el.className = "wrap";
  root.replaceChildren(el);
  cleanup = match.view.render(el, ctx, match.params) || null;
  document.querySelectorAll(".tabbar a").forEach((a) => {
    if (a.dataset.tab === match.tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  updateBadge();
  window.scrollTo(0, 0);
}

function updateBadge() {
  const n = mistakeBook(store.attempts).filter((e) => e.status === "learning" && bank.get(e.qid)).length;
  const b = document.getElementById("mistakeBadge");
  b.hidden = n === 0;
  b.textContent = n > 99 ? "99+" : String(n);
}

window.addEventListener("hashchange", render);
render();
