# Luồng 07 — Đẩy tin & vị trí ưu tiên

> Mở luồng mới, dán: `Đọc CLAUDE.md và LUONG-CHAT/07-day-tin.md rồi bắt đầu.`

**Phụ thuộc:** 06 · **Trạng thái: ĐỂ SAU — chưa mở luồng này**

---

## Khi nào mới làm

Chỉ mở luồng này khi **cả hai** điều kiện đúng:

1. Một tỉnh/thành có **trên 50 tin đang hiển thị** — chưa đủ tin thì không có cạnh tranh, đẩy tin vô nghĩa.
2. Có chủ xe **tự hỏi** làm sao để tin lên trên.

Làm sớm hơn là làm thừa.

## Mục tiêu khi làm

Bán vị trí hiển thị bằng token — nguồn doanh thu lặp lại thứ hai, co giãn theo nhu cầu. Đây là cách Chợ Tốt thực sự kiếm tiền.

## Module

- `billing/boost` — mua đẩy tin, xếp hạng ưu tiên

## Hình thức đề xuất

| Loại | Mô tả |
|---|---|
| Đẩy lên đầu | Tin nhảy lên đầu danh sách tỉnh đó trong N giờ |
| Tin ưu tiên | Khung nổi bật + nhãn, giữ trong 7 ngày |
| Ưu tiên theo từ khoá | Hiện đầu khi khách tìm hãng/dòng cụ thể |

Giá tính bằng token, trừ qua đúng cơ chế ví ở luồng 06 — **không làm cơ chế thanh toán riêng**.

## Luật bắt buộc

- Tin được đẩy **phải có nhãn "Tin ưu tiên"** rõ ràng. Cấm trộn lén vào kết quả tự nhiên — đó là lừa khách.
- Số vị trí ưu tiên mỗi trang có trần (ví dụ tối đa 3 trên 20 kết quả đầu). Không để trang đầu toàn tin trả tiền.
- Đẩy tin **không** làm tin xấu thành tin tốt: tin chưa duyệt, tin bị báo cáo không được đẩy.

## Bảng CSDL

`boosts` *(đã định nghĩa sẵn ở luồng 01)*

## Cấm

- Không bật khi chưa đủ 50 tin/tỉnh.
- Không tạo cơ chế thanh toán riêng ngoài ví token.
