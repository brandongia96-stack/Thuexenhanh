# Hướng dẫn dùng 14 luồng chat

## Cách mở một luồng mới

Mở session Claude Code mới, dán đúng một câu. Không kể lại bối cảnh, không dán code — file brief là đủ.

### Prompt sẵn, theo đúng thứ tự nên làm

**01 — Nền tảng & CSDL**
```
Đọc CLAUDE.md, HIEU-NANG.md và LUONG-CHAT/01-nen-tang.md rồi bắt đầu.
```

**02 — Tin đăng xe**
```
Đọc CLAUDE.md, CHANGELOG.md, HIEU-NANG.md và LUONG-CHAT/02-tin-dang.md rồi bắt đầu.
```

**04 — Tìm kiếm & bộ lọc**
```
Đọc CLAUDE.md, CHANGELOG.md, HIEU-NANG.md và LUONG-CHAT/04-tim-kiem.md rồi bắt đầu.
```

**05 — Trang chi tiết xe**
```
Đọc CLAUDE.md, CHANGELOG.md, HIEU-NANG.md và LUONG-CHAT/05-trang-xe.md rồi bắt đầu.
```

**03 — Bảng điều khiển chủ xe**
```
Đọc CLAUDE.md, CHANGELOG.md, HIEU-NANG.md và LUONG-CHAT/03-chu-xe.md rồi bắt đầu.
```

**06 — Ví token & thanh toán** ⚠️ nhạy cảm nhất
```
Đọc CLAUDE.md, CHANGELOG.md và LUONG-CHAT/06-vi-token.md rồi bắt đầu.
Đọc kỹ mục "Luật kế toán" trước khi viết dòng code đầu tiên.
```

**08 — Tin cậy & kiểm duyệt**
```
Đọc CLAUDE.md, CHANGELOG.md và LUONG-CHAT/08-tin-cay.md rồi bắt đầu.
```

**10 — Trang quản trị**
```
Đọc CLAUDE.md, CHANGELOG.md, HIEU-NANG.md và LUONG-CHAT/10-quan-tri.md rồi bắt đầu.
```

**11 — Thông báo**
```
Đọc CLAUDE.md, CHANGELOG.md và LUONG-CHAT/11-thong-bao.md rồi bắt đầu.
```

**12 — Pháp lý & trang tĩnh**
```
Đọc CLAUDE.md, CHANGELOG.md và LUONG-CHAT/12-phap-ly.md rồi bắt đầu.
```

**09 — Đánh giá thật** *(để sau)*
```
Đọc CLAUDE.md, CHANGELOG.md và LUONG-CHAT/09-danh-gia.md rồi bắt đầu.
Trước khi code, trình bày 3 phương án A/B/C trong brief và chờ anh chọn.
```

**07 — Đẩy tin** *(để sau)*
```
Đọc CLAUDE.md, CHANGELOG.md và LUONG-CHAT/07-day-tin.md rồi bắt đầu.
Kiểm tra điều kiện mở luồng trước: có tỉnh nào trên 50 tin đang hiển thị chưa?
```

**13 — Triển khai: GitHub + Cloudflare** *(chạy được ngay sau 01)*
```
Đọc CLAUDE.md và LUONG-CHAT/13-deploy.md rồi bắt đầu.
Repo GitHub private của anh: <dán URL vào đây>
```

**14 — Landing page & SEO**
```
Đọc CLAUDE.md, HIEU-NANG.md và LUONG-CHAT/14-landing.md rồi bắt đầu.
```

### Câu dùng chung

Khi luồng đi lạc phạm vi:
```
Dừng. Việc này ngoài phạm vi brief. Ghi lại vào CHANGELOG rồi báo anh.
```

Chốt sổ giữa chừng:
```
Chạy scripts/backup.ps1, commit, ghi một dòng vào CHANGELOG.md, rồi tóm tắt việc đã xong.
```

Nghi luồng làm lại việc cũ:
```
Đọc CHANGELOG.md trước. Việc này đã làm chưa?
```

### Chạy song song

Sau khi 01 xong, **02 / 04 / 05 chạy song song được** — không đụng file của nhau.
**03 và 06 phải chờ 02** vì ăn dữ liệu của nó.

## 14 luồng

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
| 13 | `13-deploy.md` | Triển khai: GitHub + Cloudflare | 01 | ⬜ |
| 14 | `14-landing.md` | Landing page & SEO | 01, 04 | ⬜ |

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
