# Hướng dẫn dùng 12 luồng chat

## Cách mở một luồng mới

Mở session Claude Code mới, dán đúng một câu:

```
Đọc CLAUDE.md và LUONG-CHAT/<tên file>.md rồi bắt đầu.
```

Không kể lại bối cảnh. Không dán code. Hai file đó là đủ.

## 12 luồng

| # | File | Tên luồng | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 01 | `01-nen-tang.md` | Nền tảng & CSDL | — | ⬜ chưa làm |
| 02 | `02-tin-dang.md` | Tin đăng xe (chủ xe) | 01 | ⬜ |
| 03 | `03-chu-xe.md` | Bảng điều khiển chủ xe | 01, 02 | ⬜ |
| 04 | `04-tim-kiem.md` | Tìm kiếm & bộ lọc | 01, 02 | ⬜ |
| 05 | `05-trang-xe.md` | Trang chi tiết xe & liên hệ | 01, 02 | ⬜ |
| 06 | `06-vi-token.md` | Ví token & thanh toán | 01, 03 | ⬜ |
| 07 | `07-day-tin.md` | Đẩy tin & vị trí top | 06 | ⬜ để sau |
| 08 | `08-tin-cay.md` | Tin cậy, kiểm duyệt, chống gian lận | 01, 02 | ⬜ |
| 09 | `09-danh-gia.md` | Đánh giá & bình luận thật | 01, 05 | ⬜ để sau |
| 10 | `10-quan-tri.md` | Trang quản trị (admin) | 01, 06 | ⬜ |
| 11 | `11-thong-bao.md` | Email / SMS / Zalo / in-app | 01, 06 | ⬜ |
| 12 | `12-phap-ly.md` | Pháp lý & trang tĩnh | 01 | ⬜ |

## Thứ tự làm

```
01 → 02 → 04 → 05 → 03 → 06 → 08 → 10 → 11 → 12 → 09 → 07
```

Lý do: hết bước 05 là app **dùng được nhưng chưa thu tiền**. Bước 03 tạo ra con số lượt xem/lead. Bước 06 mới bật ví — **không thu tiền trước khi chứng minh được có khách xem**.

## Luật chung cho mọi luồng

1. Luồng module **chỉ đọc** `CLAUDE.md`, `CHANGELOG.md`, brief của mình, và thư mục module của mình.
2. Luồng module **không được sửa** `CLAUDE.md`, `contracts/`, hay file của module khác. Cần đổi hợp đồng chung → báo lại, anh mở luồng nền tảng.
3. Xong việc → ghi một dòng vào `CHANGELOG.md` và đánh dấu ⬜ → ✅ trong bảng trên.
4. Trước khi sửa file có sẵn → chạy `scripts/backup.ps1`.
5. Cấm đọc các file trong danh sách cấm ở `CLAUDE.md` mục 11.
