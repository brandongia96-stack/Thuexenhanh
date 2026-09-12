# Luồng 09 — Đánh giá & bình luận thật

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/09-danh-gia.md rồi bắt đầu.`

**Phụ thuộc:** 01, 05 · **Trạng thái: ĐỂ SAU**

---

## Vấn đề gốc phải giải trước khi code

App **không biết ai đã thuê xe của ai** — vì giao dịch xảy ra ngoài app (nguyên tắc 1.1: không giữ tiền). Nên không thể xác minh người đánh giá có thuê thật hay không.

Đánh giá không xác minh được = **bãi rác**: chủ xe tự khen mình, đối thủ dìm nhau.

### Ba cách xử lý, phải chọn một trước khi làm

| Cách | Nội dung | Đánh đổi |
|---|---|---|
| **A. Không có đánh giá** | Bỏ hẳn. Chỉ hiện huy hiệu xác minh + thâm niên | Thiếu tín hiệu xã hội, nhưng trung thực |
| **B. Đánh giá gắn với lượt lấy số** | Chỉ người đã bấm lấy số mới được đánh giá, sau 24h | Vẫn giả được nhưng đắt hơn nhiều |
| **C. Chủ xe mời đánh giá** | Chủ xe gửi link cho khách thật sau chuyến | Chủ xe chỉ mời khách hài lòng → lệch |

**Em khuyến nghị B**, kèm nhãn *"Đánh giá từ người đã liên hệ chủ xe"* — nói đúng mức độ xác minh, không hơn.

## Việc bắt buộc làm ngay, không chờ luồng này

**Gỡ đánh giá giả trong code cũ.** `CarDetailModal` (dòng 1625–1657) hardcode 2 bình luận + 5 sao. Việc gỡ đã giao cho **luồng 05**, không chờ luồng 09.

## Module

- `trust/reviews`

## Bảng CSDL

`reviews` *(đã định nghĩa sẵn ở luồng 01)*

## Nếu làm thì phải có

- [ ] Chỉ người đủ điều kiện (theo cách đã chọn) mới đánh giá được
- [ ] Một người một đánh giá cho một xe
- [ ] Chủ xe **không** đánh giá được xe của mình
- [ ] Chủ xe trả lời được đánh giá, **không xoá được**
- [ ] Báo cáo đánh giá sai sự thật
- [ ] Nhãn nói rõ mức độ xác minh
- [ ] Điểm trung bình chỉ hiện khi có **≥ 3 đánh giá**, dưới ngưỡng hiện "Chưa đủ đánh giá"

## Cấm

- **Cấm mọi dữ liệu đánh giá giả, kể cả dữ liệu mẫu để "cho đẹp".**
- Không cho chủ xe xoá đánh giá xấu.
- Không hiện "5.0" khi chỉ có 1 đánh giá.
