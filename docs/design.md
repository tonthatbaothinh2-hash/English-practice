# Thiết kế: Web luyện tập Tiếng Anh 7

Ngày chốt: 2026-10-14.

## Mục tiêu
Học sinh lớp 7 làm nhiều dạng bài trên điện thoại. Mỗi lần làm được lưu lại để thấy mình sai ở đâu
và ôn đúng chỗ sai. Web tĩnh, không đăng nhập, không server.

## Quyết định đã chốt
- Vite + JavaScript thuần, test bằng Vitest. Biểu đồ tự vẽ bằng SVG.
- Tách **dạng bài** (`exercise`, mục trên menu) và **format** (`mc` | `fill` | `error`, cách hiển thị và chấm).
  Thêm dạng bài mới = thêm dữ liệu JSON + (nếu cần) một module trong `src/formats/` và một dòng trong registry.
- Chủ đề dùng chung cho mọi dạng bài, gom thành 3 nhóm: dạng từ, thì, cấu trúc động từ.
- "Tổng hợp" của bài dạng từ không còn là chủ đề; 8 câu phần 5 cũ được gắn vào chủ đề thật. Menu có nút chọn tất cả.
- Bài chia động từ trộn câu trắc nghiệm và câu điền.
- Câu bỏ trống khi nộp: tính sai trong điểm, không vào sổ lỗi, không tính vào thống kê dài hạn.
- Bài tìm lỗi sai lọc theo nhóm chủ đề (mỗi nhóm ≥ 15 câu); các dạng khác lọc theo chủ đề (mỗi chủ đề ≥ 15 câu).
- Trắc nghiệm và tìm lỗi: vị trí đáp án đúng chia đều A–D (lệch tối đa 1) trong mỗi nhóm lọc. Có test kiểm tra.

## Dữ liệu
Xem `README.md` (mục "Thêm câu hỏi") cho định dạng câu hỏi. Bản ghi một lần làm:

```
{ id, startedAt, finishedAt, durationSec, mode: normal|retry-wrong|mistake-book,
  exercise, topics, settings: {count, shuffle}, score: {correct, total},
  items: [{ qid, topic, given, correct }] }   // given = null nghĩa là bỏ trống
```

Lưu tất cả trong localStorage, khoá `e7practice.v1`: `{ version: 1, attempts, inProgress }`.

## Sổ lỗi sai
Tính lại từ lịch sử theo thứ tự thời gian, không lưu riêng. Một câu vào sổ khi làm sai. Sau lần sai gần nhất,
đúng 2 lần liên tiếp thì thành "đã nắm"; sai lại thì quay về "đang ôn".

## Chấm câu điền
Chữ thường, gộp khoảng trắng, đổi nháy cong thành nháy thẳng, bỏ dấu câu cuối, coi dạng rút gọn và dạng đầy đủ
là như nhau (didn't = did not, won't = will not, can't = cannot = can not, 'm/'re/'ll). So với từng đáp án trong `answers`.

## Gợi ý "Nên ôn tiếp"
Chủ đề có tỷ lệ đúng thấp nhất trong các chủ đề đã làm ít nhất 5 câu (bỏ qua chủ đề đạt 100%). Bằng nhau thì chọn
chủ đề làm ít hơn. Chủ đề chưa làm được liệt kê riêng.

## Màn hình
Luyện tập (chọn bài + gợi ý), Làm bài, Kết quả, Lịch sử (+ chi tiết), Thống kê, Sổ lỗi sai.
Router dùng hash (`#/stats`, `#/history/<id>`) để chạy được trên GitHub Pages.

## Kế hoạch triển khai
1. Khung dự án, `core/grading.js` + test.
2. `core/analytics.js` + test; `core/storage.js`, `core/session.js`, `core/bank.js`.
3. Formats `mc`, `fill`, `error`; các view; CSS lấy từ bản gốc.
4. Ngân hàng câu hỏi (≈ 285 câu) + test kiểm tra dữ liệu.
5. Workflow GitHub Pages, README; build và thử trên khung điện thoại.
