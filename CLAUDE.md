# CLAUDE.md — Thuexenhanh

Tài liệu gốc cho mọi luồng chat. **Đọc file này + `CHANGELOG.md` trước khi sửa bất cứ thứ gì.**

| | |
|---|---|
| **Sản phẩm** | Thuexenhanh — nền tảng thuê xe tự lái |
| **Mô hình** | Rao vặt (classifieds). Cung cấp thông tin + kết nối trực tiếp chủ xe ↔ khách. **Không ăn hoa hồng.** Doanh thu duy nhất: phí hiển thị tin của chủ xe. |
| **Tham vọng** | Quy mô như Chợ Tốt |
| **Giao diện** | Tương đương các app thuê xe (Mioto) |
| **Ngôn ngữ** | Tiếng Việt. Claude xưng "em", gọi user là "anh". |
| **Code cũ (v0.1)** | `Web thue xe/` — **đóng băng, chỉ đọc tham chiếu** |
| **Code mới (v0.2)** | dựng ở luồng 01 |

---

## 1. Nguyên tắc bất di bất dịch

### 1.1 Mô hình kinh doanh
- **KHÔNG bao giờ thêm giữ tiền, escrow, hay ăn % giao dịch.** App không đứng giữa dòng tiền.
- Doanh thu **chỉ** từ phí hiển thị tin của chủ xe.
- Mọi tính năng mới phải trả lời được: *"cái này làm chủ xe sẵn sàng trả thêm, hay chỉ làm app nặng thêm?"*

### 1.2 Trung thực với người dùng
- **Cấm dữ liệu giả hiển thị như thật.** Không hardcode đánh giá, số sao, số chuyến, lượt xem — kể cả "dữ liệu mẫu cho đẹp". Chưa có thì hiện trạng thái rỗng ("Chưa có đánh giá").
- **Cấm nút hứa hẹn thứ app không làm được.** Không có booking thì không có nút "Đặt xe ngay". Nút phải là **"Xem số điện thoại"**.
- **Cấm bán huy hiệu xác minh bằng tiền.** Tích xanh xét theo giấy tờ, miễn phí.
- Mọi trang xe phải có dòng miễn trừ: *giao dịch do hai bên tự thoả thuận*.

### 1.3 Kỹ thuật
- **React (Vite) + CSS thuần.** KHÔNG TailwindCSS, không thư viện CSS ngoài.
- Icon `lucide-react`, `strokeWidth={1.8}` hoặc `2`.
- **Bắt buộc dùng design token** `var(--m-...)`. Không hardcode mã màu mới.
- **Graceful degradation:** thiếu dữ liệu thì **ẩn cả khối UI**, không render ô trống.
- Tên bảng/cột CSDL: **snake_case tiếng Anh**. Nội dung hiển thị tiếng Việt.
- **Không xoá cứng dữ liệu.** Soft delete bằng `deleted_at`.
- Phân tách rõ luồng **Khách thuê** và **Chủ xe**.

---

## 2. 🛡️ Luật chống phá code & mất code

**Bắt buộc với mọi luồng chat. Vi phạm là dừng việc.**

### 2.1 Trước khi sửa
1. **Đọc `CHANGELOG.md` trước.** Việc đã làm rồi thì không làm lại — đó là cách tốn token nhất.
2. **Chạy sao lưu** trước mỗi phiên sửa file có sẵn:
   ```bash
   powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
   ```
3. **Commit trước khi bắt đầu.** Cây làm việc phải sạch trước khi sửa lớn:
   ```bash
   git add -A; git commit -m "checkpoint truoc khi sua"
   ```

### 2.2 Trong khi sửa
4. **Đọc file trước khi ghi đè.** Cấm `Write` lên file chưa đọc trong phiên đó.
5. **Sửa nhỏ dùng Edit, không dùng Write.** `Write` lên file đang có = xoá sạch nội dung cũ.
6. **Không sửa file ngoài phạm vi module của luồng.** Cần đổi file chung → **dừng lại, báo anh**, mở luồng nền tảng.
7. **Không đổi tên / di chuyển / xoá file mà anh không yêu cầu.**
8. **Không chạy lệnh phá huỷ** nếu anh chưa nói rõ: `git reset --hard`, `git checkout -- .`, `git clean`, `Remove-Item -Recurse -Force`, xoá bảng CSDL.
9. **Một lần một việc.** Không vừa đổi cấu trúc vừa đổi hành vi. Đổi cấu trúc → chạy thử → commit → rồi mới đổi hành vi.

### 2.3 Sau khi sửa
10. **Chạy thử trước khi báo xong.** `npm run dev` không lỗi mới được nói là xong.
11. **Commit ngay khi một việc chạy được**, đừng dồn:
    ```bash
    git add -A; git commit -m "<luồng>: <việc đã làm>"
    ```
12. **Ghi một dòng vào `CHANGELOG.md`.**

### 2.4 Ba lớp an toàn
| Lớp | Công cụ | Khi nào |
|---|---|---|
| 1. Lịch sử từng thay đổi | **Git** (đã cài, repo đã khởi tạo) | commit sau mỗi việc chạy được |
| 2. Ảnh chụp toàn bộ | `scripts/backup.ps1` → `_backup/*.zip`, giữ 20 bản | trước mỗi phiên sửa lớn |
| 3. Bản gốc | `Web thue xe.rar` | không đụng tới |

> **Nên có thêm:** đẩy repo lên GitHub private. Ổ cứng hỏng thì Git local mất theo. Anh tạo repo rồi bảo em, em nối `remote` giúp.

---

## 3. Cách chia luồng chat

12 luồng, brief nằm trong `LUONG-CHAT/`. Mở luồng mới chỉ cần dán:

```
Đọc CLAUDE.md và LUONG-CHAT/<tên file>.md rồi bắt đầu.
```

| # | File | Luồng | Phụ thuộc |
|---|---|---|---|
| 01 | `01-nen-tang.md` | Nền tảng & CSDL | — |
| 02 | `02-tin-dang.md` | Tin đăng xe | 01 |
| 03 | `03-chu-xe.md` | Bảng điều khiển chủ xe | 01, 02 |
| 04 | `04-tim-kiem.md` | Tìm kiếm & bộ lọc | 01, 02 |
| 05 | `05-trang-xe.md` | Trang chi tiết xe & liên hệ | 01, 02 |
| 06 | `06-vi-token.md` | Ví token & thanh toán | 01, 03 |
| 07 | `07-day-tin.md` | Đẩy tin *(để sau)* | 06 |
| 08 | `08-tin-cay.md` | Tin cậy & kiểm duyệt | 01, 02 |
| 09 | `09-danh-gia.md` | Đánh giá thật *(để sau)* | 01, 05 |
| 10 | `10-quan-tri.md` | Trang quản trị | 01, 06 |
| 11 | `11-thong-bao.md` | Thông báo | 01, 06 |
| 12 | `12-phap-ly.md` | Pháp lý & trang tĩnh | 01 |

**Thứ tự:** `01 → 02 → 04 → 05 → 03 → 06 → 08 → 10 → 11 → 12 → 09 → 07`

**Luật:** luồng module **chỉ đọc** `CLAUDE.md`, `CHANGELOG.md`, brief của mình, thư mục module của mình, `contracts/`. **Chỉ luồng nền tảng** được sửa `CLAUDE.md` và `contracts/`.

---

## 4. Kiến trúc

Quyết định **B**: dựng khung mới, không vá `App.jsx` cũ 2.900 dòng.

```
src/
├─ main.jsx
├─ App.jsx              ← chỉ routing + layout, DƯỚI 200 dòng
├─ modules/
│  ├─ auth/  listing/  owner/  discovery/  billing/  trust/  admin/  notify/
├─ components/          ← component dùng chung
├─ data/                ← hãng xe, tỉnh thành, tiện nghi
└─ lib/                 ← format, phone, validate, supabase client

contracts/              ← hợp đồng chung, chỉ luồng 01 được sửa
├─ schema.sql
├─ api.md
└─ tokens.css
```

---

## 5. Stack & nền tảng

### 5.1 Chốt cho v0.2
| Hạng mục | Công nghệ |
|---|---|
| Frontend | React 19 + Vite 7 |
| Styling | CSS thuần + Plus Jakarta Sans |
| Icon | lucide-react |
| **CSDL** | **Postgres (Supabase)** — thay Firestore |
| Auth | Supabase Auth (Google) + OTP SĐT |
| Lưu ảnh | Supabase Storage + nén client |
| Hosting | Netlify / Vercel |
| Thanh toán | VietQR động: SePay / PayOS / Casso |

**Lý do bỏ Firestore:** trang rao vặt là read-heavy, Firestore tính tiền từng document đọc → đắt theo quy mô. Ví tiền cần transaction SQL thật. Full-text tiếng Việt có sẵn trong Postgres. Báo cáo doanh thu bằng SQL là một câu lệnh.

### 5.2 Bắt buộc trước khi thu tiền thật
- RLS + phân quyền server (client không ghi được `is_verified`, không ghi được ví)
- Đếm lượt xem + lượt lấy số *(hàng hoá đem bán)*
- VietQR động + webhook đối soát
- Tên miền riêng
- Điều khoản + Bảo mật + **Chính sách hoàn token**

### 5.3 Khi lên quy mô
GA4/PostHog · Sentry · Google Maps API · Resend (email) · eSMS/Zalo ZNS (OTP) · Cloudflare Images · Typesense (khi >100k tin)

Ngân sách hạ tầng giai đoạn đầu: **~25–50 USD/tháng**.

---

## 6. Mô hình giá — ĐÃ CHỐT

| | |
|---|---|
| **1 token** | **4.000đ** |
| **Giá hiển thị tin** | **10 token / 1 xe / 1 tháng** = 40.000đ |
| 3 tháng | 30 token (tuyến tính) |
| Gói vĩnh viễn | ❌ **ĐÃ BỎ** |
| Trừ theo lead | hạ tầng sẵn, **chưa bật** |
| Đẩy tin / vị trí top | luồng 07, **chưa bật** |
| Tích xanh | **miễn phí**, xét giấy tờ — không bán |

Luật kế toán: sổ giao dịch **chỉ ghi thêm**; số dư = tổng các dòng; tách `token_da_nap` (nợ phải trả) và `token_da_tieu` (doanh thu); trừ token phải idempotent; client không bao giờ ghi vào bảng ví.

---

## 7. Design system

Token trong `Web thue xe/src/styles.css` (bê sang ở luồng 01):

```
Màu chính   --m-green  ⚠️ THỰC TẾ LÀ XANH DƯƠNG #3b82f6 — tên token gây hiểu nhầm
            --m-green-hover #2563eb   --m-green-light #eff6ff
Chữ         --m-dark #141414   --m-mid #4b4f56   --m-subtle #8a8f9a
Nền         --m-bg #f5f5f7   --m-surface #ffffff   --m-border #e8e8ec
Ngữ nghĩa   --m-red #e8364b   --m-amber #f59e0b   --m-blue #3b82f6   --m-zalo #0068ff
Bo góc      --r-sm 8  --r-md 12  --r-lg 16  --r-xl 20  --r-full 9999
Đổ bóng     --shadow-sm / md / lg / xl
Chuyển động --t-fast 0.15s   --t-mid 0.25s
Font        Plus Jakarta Sans, 15px gốc
```

Card bo 12–16px, shadow mềm, hover mượt, **không `border: dashed`** cho thành phần chính. Chi tiết: `Web thue xe/skill-ui.md`.

---

## 8. Bảng CSDL (v0.2)

```
users, user_roles
listings, listing_images, listing_blocked_dates, listing_events, saved_listings
wallets, wallet_transactions, topups, charges, boosts
reviews, reports, moderation_queue, otp_codes
events                  -- view_listing, reveal_phone, click_call, click_zalo, search, topup, renew
notifications
brands, models, provinces, districts, amenities
admin_actions           -- nhật ký admin, KHÔNG được xoá
```

Vòng đời tin: `nhap → cho_duyet → dang_hien_thi → sap_het_han → het_han → an` (nhánh `tu_choi` có lý do).

Dữ liệu tĩnh bê từ code cũ: 27 hãng xe + model, 39 tỉnh thành, quận/huyện 5 TP lớn, 13 tiện nghi.

---

## 9. Nợ của code cũ (v0.1) — để biết mà tránh lặp lại

🔴 **Lỗi chặn build** *(không sửa nữa — khung mới thay thế)*: `App.jsx:803-804` khai báo `editingId` 2 lần · `:1034` dùng `<User />` chưa import · `:1044` gọi `toggleFavorite` chưa định nghĩa.

🟠 **Tính năng rỗng**: "Lưu xe" bấm xong không lưu · `showFavorites` không được truyền · đánh giá 5 sao + 2 bình luận **hardcode giả** · QR thanh toán **không phải QR ngân hàng**, kích hoạt gói bằng `mailto:` thủ công.

🟡 **Bảo mật**: không có Firestore rules, client gọi thẳng `setDoc`/`deleteDoc`, ai cũng tự set `isVerified = true`.

> Khung mới phải không lặp lại bất kỳ lỗi nào ở trên. Mỗi brief đã ghi rõ chỗ cấm.

---

## 10. Lệnh thường dùng

```bash
powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
```
```bash
git add -A; git commit -m "mo ta viec da lam"
```
```bash
git log --oneline -20
```
```bash
cd "Web thue xe"; npm run dev
```

---

## 11. 🚫 Cấm đọc — tiết kiệm token

Các file này **tuyệt đối không đọc** trừ khi anh yêu cầu thẳng. Đọc nhầm một lần là bay hàng chục nghìn token:

| File | Kích thước |
|---|---|
| `Web thue xe/preview_offline.html` | **729 KB** |
| `Web thue xe/dist/index.html` | **729 KB** |
| `Web thue xe/source-6a2a6cbb.../` | **307 KB**, snapshot đời cũ |
| `node_modules/` | — |
| `Web thue xe.rar` | 47 MB |
| `_backup/*.zip` | — |

Cần tham chiếu code cũ → đọc **đúng khoảng dòng** brief đã ghi, không đọc cả `App.jsx` 131 KB.

---

## 12. Skill

| Skill | Kích hoạt | Công dụng |
|---|---|---|
| `grillme` | `/grillme`, hoặc nhắn "grill", "chất vấn", "hỏi đáp" | Phiên chất vấn ép ra quyết định. Kết quả ghi vào `QUYET-DINH.md`. |

Skill mới chỉ nạp khi **khởi động lại session**.

---

## 13. Quyết định đã chốt

Chi tiết + lý do: `QUYET-DINH.md`.

1. Bỏ Firestore, chuyển **Postgres (Supabase)**.
2. **Dựng khung mới** (phương án B), không vá `App.jsx` cũ. Code v0.1 đóng băng.
3. **Ví token** là hạ tầng thu tiền duy nhất. **1 token = 4.000đ**.
4. **10 token / 1 xe / 1 tháng**, tuyến tính.
5. **Bỏ gói "vĩnh viễn 199K"** — tin luôn có hạn.
6. Đẩy tin / vị trí top: dựng bảng sẵn, **chưa bật**.
7. **Analytics theo từng xe và từng chủ xe nằm ở lõi**, không phải tính năng phụ.
8. Chia **12 luồng chat**, mỗi luồng một brief trong `LUONG-CHAT/`.
9. Marketing / kênh khách hàng: **luồng chat riêng**, không bàn ở luồng nền tảng.
10. Tích xanh **không bán bằng tiền** — xét theo giấy tờ, miễn phí.

---

## 14. Nhật ký thay đổi

Nhật ký chi tiết đã chuyển sang **`CHANGELOG.md`**. Mỗi việc xong ghi một dòng ở đó.
