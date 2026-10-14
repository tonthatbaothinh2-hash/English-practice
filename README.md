# Tiếng Anh 7: Luyện ngữ pháp

Web luyện tập ngữ pháp cho học sinh lớp 7 (chương trình Tiếng Anh 7 của Việt Nam). Chạy hoàn toàn trên trình duyệt,
không cần đăng nhập, không cần server. Ưu tiên dùng trên điện thoại.

**Có gì trong web**

- 5 dạng bài: dạng từ (trắc nghiệm), dạng từ (điền từ), chia động từ theo thì, cấu trúc với động từ, tìm lỗi sai.
- 285 câu hỏi, 12 chủ đề. Mỗi chủ đề có ít nhất 15 câu, mỗi câu có giải thích bằng tiếng Việt.
- Biết đúng sai ngay sau mỗi câu. Có thanh tiến độ, bảng số câu và nút nộp bài.
- Lưu mọi lần làm ngay trên máy. Có trang **Lịch sử**, **Thống kê** (tỷ lệ đúng theo chủ đề, điểm theo thời gian,
  câu hay sai nhất), **Sổ lỗi sai** (làm đúng 2 lần liên tiếp thì chuyển sang "đã nắm") và gợi ý **Nên ôn tiếp**.
- Xuất và nhập file JSON để sao lưu hoặc chuyển sang máy khác.
- Tự đổi giao diện sáng hoặc tối theo cài đặt của máy.

---

## 1. Chạy thử trên máy

Cần [Node.js](https://nodejs.org) bản 20 trở lên (bản LTS là được).

```bash
npm install
```

```bash
npm run dev
```

Mở địa chỉ `http://localhost:5173` mà lệnh in ra. Lệnh này cũng in địa chỉ dạng `http://192.168.x.x:5173`:
điện thoại dùng chung Wi-Fi với máy tính mở địa chỉ đó là thử được trên điện thoại.

Các lệnh khác:

| Lệnh | Việc làm |
|---|---|
| `npm test` | Chạy test: chấm điểm, thống kê, sổ lỗi, lưu trữ và kiểm tra toàn bộ file câu hỏi |
| `npm run build` | Chạy test rồi build ra thư mục `dist/` (web tĩnh để đưa lên mạng) |
| `npm run preview` | Mở thử bản đã build trong `dist/` |

---

## 2. Thêm câu hỏi mới

Câu hỏi nằm trong `src/data/questions/`, mỗi dạng bài một file:

| File | Dạng bài |
|---|---|
| `word-form-mc.json` | Dạng từ: trắc nghiệm |
| `word-form-fill.json` | Dạng từ: điền từ |
| `tenses.json` | Chia động từ theo thì (có cả trắc nghiệm và điền) |
| `verb-patterns.json` | Cấu trúc với động từ |
| `error-id.json` | Tìm lỗi sai |

Mỗi file là một danh sách (mảng). Muốn thêm câu, chép một câu có sẵn, dán vào cuối danh sách (nhớ dấu phẩy
giữa hai câu) rồi sửa nội dung.

### Các trường chung

| Trường | Ý nghĩa |
|---|---|
| `id` | Mã câu, **không được trùng**. Ví dụ `wfm-noun-16`. Đừng đổi id của câu cũ, vì lịch sử làm bài dựa vào id. |
| `exercise` | Dạng bài: `word-form-mc`, `word-form-fill`, `tenses`, `verb-patterns`, `error-id` |
| `format` | Cách hiển thị và chấm: `mc` (trắc nghiệm), `fill` (điền), `error` (tìm lỗi sai) |
| `topic` | Chủ đề: `noun`, `adj`, `adv`, `verb`, `present-simple`, `present-continuous`, `past-simple`, `future-will`, `future-going-to`, `ving-or-tov`, `modals`, `after-prep` |
| `level` | Mức độ: `1` dễ, `2` vừa, `3` khó |
| `prompt` | Câu hỏi tiếng Anh. Dùng `___` (3 dấu gạch dưới) cho chỗ trống. |
| `explain` | Giải thích ngắn bằng tiếng Việt, nói rõ vì sao đáp án đúng. Ví dụ: "Đứng sau your nên cần danh từ." |

### Trắc nghiệm (`"format": "mc"`)

```json
{
  "id": "wfm-noun-16",
  "exercise": "word-form-mc",
  "format": "mc",
  "topic": "noun",
  "level": 1,
  "prompt": "Thank you for your ___.",
  "options": ["helpless", "help", "helpful", "helpfully"],
  "answer": 1,
  "explain": "Sau tính từ sở hữu your cần danh từ: help."
}
```

- `options`: đúng 4 phương án. Phương án sai nên là lỗi học sinh hay mắc (sai loại từ, quên -s, nhầm -ed/-ing...).
- `answer`: vị trí đáp án đúng, **đếm từ 0**: `0` = A, `1` = B, `2` = C, `3` = D.
- Trong mỗi chủ đề, số câu có đáp án A, B, C, D phải gần bằng nhau (lệch tối đa 1). `npm test` sẽ báo nếu bị lệch.

### Điền từ (`"format": "fill"`)

```json
{
  "id": "wff-adv-16",
  "exercise": "word-form-fill",
  "format": "fill",
  "topic": "adv",
  "level": 1,
  "prompt": "She sings very ___.",
  "cue": "beauty",
  "answers": ["beautifully"],
  "explain": "Bổ nghĩa cho động từ sings cần trạng từ: beautifully."
}
```

- `cue`: từ gốc, hiện trong ngoặc ngay sau chỗ trống. Với thì tương lai, nên ghi rõ cấu trúc, ví dụ `"will + pass"`
  hoặc `"be going to + buy"`.
- `answers`: **mọi** đáp án được chấp nhận, ví dụ `["historic", "historical"]`.
- Khi chấm, web tự bỏ qua chữ hoa/thường, khoảng trắng thừa, dấu chấm cuối câu, dấu nháy cong của điện thoại,
  và coi dạng rút gọn với dạng đầy đủ là một (`didn't` = `did not`, `won't` = `will not`, `can't` = `cannot`,
  `'m` = `am`, `'re` = `are`, `'ll` = `will`). Vì vậy chỉ cần ghi một trong hai dạng.

### Tìm lỗi sai (`"format": "error"`)

```json
{
  "id": "err-ten-16",
  "exercise": "error-id",
  "format": "error",
  "topic": "present-simple",
  "level": 2,
  "prompt": "She [[don't]] like [[playing]] football [[on]] [[Sundays]].",
  "answer": 0,
  "correction": "doesn't",
  "explain": "Chủ ngữ She nên phủ định dùng doesn't."
}
```

- Viết đúng 4 phần gạch chân trong `[[...]]`. Chúng thành A, B, C, D theo thứ tự.
- `answer`: phần bị sai (đếm từ 0). `correction`: cách sửa đúng.
- Bài tìm lỗi lọc theo nhóm (dạng từ, thì, cấu trúc động từ). Mỗi nhóm cần ít nhất 15 câu và đáp án chia đều A–D.

### Sau khi sửa file

```bash
npm test
```

Test kiểm tra: đủ trường, đúng kiểu, id không trùng, mỗi chủ đề có ít nhất 15 câu, đáp án chia đều A–D,
và mọi đáp án trong file đều được bộ chấm chấp nhận. Nếu có lỗi, test sẽ in ra id của câu bị lỗi.

### Thêm chủ đề hoặc dạng bài mới

- **Chủ đề mới**: thêm vào mục `topics` trong `src/data/catalog.json` (id, nhóm, tên tiếng Việt, mẹo), rồi thêm câu hỏi dùng chủ đề đó.
- **Dạng bài mới dùng format có sẵn**: thêm vào mục `exercises` trong `catalog.json` và tạo file JSON mới trong
  `src/data/questions/`. File mới được nạp tự động.
- **Kiểu câu hỏi hoàn toàn mới** (ví dụ nối câu): tạo một file trong `src/formats/` có các hàm `grade`, `render`,
  `answerText`, `givenText`, `solvedHtml` (xem `mc.js` làm mẫu), rồi thêm một dòng vào `src/formats/index.js`.
  Phần còn lại của web (lưu kết quả, thống kê, sổ lỗi) không phải sửa.

---

## 3. Web đang chạy ở đâu và cách cập nhật

- Link cho học sinh: **https://tonthatbaothinh2-hash.github.io/English-practice/**
- Code: **https://github.com/tonthatbaothinh2-hash/English-practice** (nhánh `main`)

Mỗi lần đẩy code lên nhánh `main`, workflow `.github/workflows/deploy.yml` tự chạy test, build và đưa web lên
GitHub Pages (khoảng 1–2 phút). Nếu test hỏng, web không bị cập nhật và giữ bản cũ; xem lỗi ở tab **Actions** của repo.

Cập nhật sau khi sửa câu hỏi:

```bash
npm test
```

```bash
git add -A
```

```bash
git commit -m "Thêm câu hỏi chủ đề ..."
```

```bash
git push
```

Bật GitHub Pages (chỉ làm một lần, đã làm): **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## 4. Dữ liệu của học sinh

- Kết quả lưu trong trình duyệt của từng máy (localStorage, khoá `e7practice.v1`). Giáo viên không nhìn thấy kết quả
  của học sinh; mỗi học sinh tự xem trên máy mình.
- Xoá dữ liệu trình duyệt hoặc dùng tab ẩn danh sẽ mất kết quả. Vì vậy trang **Lịch sử** có nút **Xuất file** để sao lưu,
  và **Nhập file** để chuyển sang máy khác (nhập sẽ gộp thêm, không xoá dữ liệu đang có).
- Nếu sau này sửa hoặc xoá câu hỏi, lịch sử cũ vẫn giữ điểm. Câu đã bị xoá sẽ hiện là "không còn trong ngân hàng câu hỏi".

---

## 5. Cấu trúc thư mục

```
src/
  main.js               khởi động, định tuyến theo hash (#/stats, #/history/...)
  data/
    catalog.json        dạng bài, nhóm, chủ đề (tên và mẹo tiếng Việt)
    questions/*.json    ngân hàng câu hỏi
    index.js            nạp mọi file câu hỏi
  core/                 logic thuần, không đụng giao diện, có test
    grading.js          chuẩn hoá và so khớp câu trả lời gõ tay
    bank.js             kiểm tra và lọc câu hỏi
    session.js          chọn câu, ghi đáp án, tạo bản ghi kết quả
    analytics.js        thống kê, sổ lỗi sai, gợi ý ôn tập
    storage.js          localStorage, xuất/nhập JSON
  formats/              mỗi kiểu câu hỏi một file: mc, fill, error
  views/                các màn hình: home, quiz, attempt, history, stats, mistakes
  ui/                   hàm dựng giao diện, biểu đồ SVG
  styles/app.css
tests/                  test bằng Vitest
docs/design.md          bản thiết kế đã chốt
```
