# CHANGELOG — Thuexenhanh

**Mục đích:** để không luồng chat nào làm lại việc luồng khác đã làm. Trước khi bắt tay vào việc, **đọc file này trước**.

## Cách ghi

Mỗi việc xong → thêm **một dòng** vào đầu bảng của phiên bản đang làm. Đúng định dạng:

```
| YYYY-MM-DD | <luồng> | <đã làm gì> | <file chính bị đụng> |
```

Quy tắc:
- Ghi **ngay khi xong**, không để dồn cuối buổi.
- Một dòng một việc. Không viết đoạn văn.
- Có phá vỡ tương thích → thêm `⚠️` đầu dòng.
- Có đổi hợp đồng chung (`contracts/`) → thêm `🔒` và **báo lại** để cập nhật `CLAUDE.md`.

---

## v0.2 — Khung mới (Postgres + module) · đang làm

| Ngày | Luồng | Nội dung | File |
|---|---|---|---|
| 2026-09-21 | 04 tìm kiếm | Nâng giao diện theo mẫu `_archive/giao-dien-dev` (chỉ phần hiển thị, không bê Firebase): thẻ xe ảnh 16:9, nút chia sẻ + tim nổi trên ảnh (chép link có đường lui + báo lỗi thấy được), lưới thông số dạng ô (thêm nhiên liệu), giá đỏ, viền tích xanh, "Đăng … trước" từ `published_at` thật; điện thoại: thanh lọc cố định đáy + bảng lọc trượt từ đáy (Esc, khoá cuộn, vuốt xuống, trả tiêu điểm); máy tính: nút đổi lưới ↔ danh sách. Sửa lỗi nút tim trơ style ở trang tìm kiếm/trang chủ (style nằm ở `TrangXe.css` không được nạp). KHÔNG bê: banner quảng cáo, đánh giá/lượt thích, huy hiệu DEMO, trừ token khi liên hệ trên thẻ. Chưa làm: "gần tôi nhất", bản đồ Mapbox (cần lat/lng ở `listing_card` + token + dependency — xem báo cáo). Gói đầu vẫn 58,9 KB gzip | `src/modules/discovery/{search,the-xe}/**` |
| 2026-09-21 | 14 landing | Nâng trang chủ theo bố cục mẫu dev: hero 2 cột (chữ + thẻ tìm kiếm), "Cách hoạt động" 3 bước, "Xe mới đăng", khối chủ xe + hộp CTA tối; CSS token trong `TrangChu.css`. Nối ô tìm kiếm với `OTimKiem` + `duongDanTimKiem` và thẻ `TheXe` dùng chung của luồng 04 (gỡ TODO). Bỏ ảnh Unsplash, dải hãng xe, 4 câu cam kết, pills loại xe. `index.html` thêm favicon/apple-touch/og:image/twitter large/logo JSON-LD (tài sản do phiên nền tảng nén ở `197dfe2`) | `src/modules/shell/TrangChu.{jsx,css}`, `index.html` |
| 2026-09-21 | nền tảng | Nén logo: `logo.png` 1.725 KB → `logo.webp` **3,8 KB**; sinh đủ bộ favicon 32/180, PWA 192/512, og-image 1200×630 — **trọn bộ 79,3 KB**. Chốt repo chính duy nhất là `brandongia96-stack/Thuexenhanh` | `public/*`, `CLAUDE.md`, `QUYET-DINH.md` |
| 2026-09-21 | nền tảng | Phiên grill: chốt giữ Supabase, lấy giao diện `giale-lab/dev` theo phương án A, mapbox/recharts tải trễ, tên hiển thị "Thuê Xe Nhanh". Tải mã giao diện về `_archive/giao-dien-dev/`, lưu trữ Mainverson | `QUYET-DINH.md`, `CLAUDE.md`, `LUONG-CHAT/{02,04,14}` |
| 2026-09-21 | 04 tìm kiếm | Trang `/thue-xe` thật: tìm tiếng Việt không dấu (unaccent+tsvector `simple`, tsquery tiền tố, chấp "vf8"↔"vf 8"), đoán bộ lọc từ câu chữ ("xe so tu dong quan 7" → Số tự động + Quận 7), bộ lọc tỉnh/quận/giá/chỗ/hộp số/nhiên liệu/hãng/tiện nghi + chip có X, lưu trong URL, sắp xếp mới/giá tăng/giá giảm, keyset 20 tin/lần cuộn vô hạn, debounce 300ms + huỷ request cũ, Quay lại hiện tức thì đúng vị trí cuộn. Thẻ xe dùng chung `the-xe/TheXe` (thumb+blur, ảnh đầu ưu tiên). `BoLoc`/`ChipLoc`/`OTimKiem`/`duongDanTimKiem` export sẵn cho luồng 14. Sửa lỗi ở file luồng 05: `boNhoPhien` lưu sai vị trí cuộn, `diaGioi` nhớ nhầm bảng rỗng khi mất mạng lần đầu (+ thêm `quanTinh`, đổi khoá cache v2). Gói đầu vẫn 58,9 KB gzip, trang tìm kiếm 7,1 KB gzip. Chưa kiểm được trên CSDL thật/1.000 tin/Lighthouse. Cắt: sắp xếp "gần tôi nhất" (chưa có lat/lng ở `listing_card`), `discovery/compare` | `src/modules/discovery/{search,filter,the-xe}/**`, `discovery/{index,diaGioi,boNhoPhien}.js`, `src/App.jsx` |
| 2026-09-21 | 13 deploy | Điều tra `dev.thuexenhanh.pages.dev`: là **preview alias** (`x-robots-tag: noindex`) phục vụ build của codebase Firebase thứ ba (mapbox/recharts, cùng `projectId: thuexenhanh`), **không** phải v0.1 trong repo. Chứng minh Cloudflare **không nối** `brandongia96-stack/Thuexenhanh`: GitHub chỉ có đúng nhánh `dev`, không có `main`; alias `main.` trả 404. Tải trọn bản dev về `_scratch/` + đóng gói zip trước khi đụng gì. ✅ F5 ở 6 đường dẫn sâu trên production đều 200, `_redirects`/`_headers` chạy đúng | `_scratch/ban-sao-dev-pages/**` |
| 2026-09-21 | 14 landing | Viết lại trang chủ: hero có ô tìm kiếm tỉnh/quận → `/thue-xe?tinh=&quan=` (TODO thay bằng bộ lọc luồng 04), khối "Xe mới đăng" đọc `listing_card` thật, chưa có tin thì ẩn, khối chủ xe 10 token = 40.000đ. `index.html` thêm canonical/og/robots/JSON-LD; thêm `robots.txt`, `sitemap.xml`. **Chưa có** logo/favicon/og-image (không tìm thấy file gốc, chờ anh). Gói đầu vẫn 58,9 KB gzip. Đụng `index.html` (file khung) | `src/modules/shell/TrangChu.jsx`, `index.html`, `public/robots.txt`, `public/sitemap.xml` |
| 2026-09-21 | 02 tin đăng | Rà soát sau commit `1c3d91b`: 6 file trong `git status` thực ra đã commit, không còn thay đổi treo; `chay-tat-ca.sql` tái sinh ra giống hệt (10 file); `npm run build` xanh, gói đầu 58,93 KB gzip. Gỡ chú thích "Chặn" đã lỗi thời ở dòng 02 phía dưới | `CHANGELOG.md` |
| 2026-09-21 | 02 tin đăng | **Gỡ 2 chặn:** (1) Edge Function `submit-listing` + hàm `submit_listing()` (validate lại phía server, chặn trùng biển số, 1 dòng hàng đợi, idempotent); (2) trigger cấp `chu_xe` khi tạo tin đầu + `canAccess` mở riêng `/chu-xe/dang-tin` + nạp lại vai trò sau khi tạo. **Vá lỗi 0002:** `log_listing_status` thiếu `security definer` nên **không người dùng thật nào tạo/sửa được tin** (chỉ lộ khi thử bằng role `authenticated`). Đối chiếu `CarForm.jsx`: thêm Chọn tất cả tiện nghi, biển số bắt buộc + kiểm dạng khi gửi duyệt, bỏ 2 câu số liệu không căn cứ; biên bản ở `DOI-CHIEU-CARFORM.md`. Chạy thật `0001→0010` trên Postgres nhúng: 40/40 phép thử đạt. **Edge Function chưa chạy thật (chưa có Deno/Supabase). Chạy `0010` trên Supabase: dán riêng file `0010`, hoặc `chay-tat-ca.sql` nếu CSDL còn trống** | `supabase/migrations/0010_*.sql`, `supabase/functions/submit-listing/`, `src/modules/auth/rbac.js`, `src/modules/listing/**` |
| 2026-09-21 | ⚠️ 02→01 | **RÒ RỈ số điện thoại:** policy `listings_public_read` chỉ lọc theo dòng nên `anon` (key công khai) đọc thẳng được `contact_phone`, `contact_zalo`, `plate` của mọi tin đang hiển thị — bỏ qua `reveal-phone` (đếm lượt lấy số, hạn mức). Đã tái hiện bằng role `anon`. **Chưa sửa** vì đụng schema + query của luồng 03/05/admin; cần luồng 01 quyết cách chặn cột | `contracts/schema.sql`, `supabase/migrations/0009_grants.sql` |
| 2026-09-21 | 02 tin đăng | Form đăng/sửa 2 gói trường (cùng giá), nén ảnh client ra **4 bản** WebP (thử: 1.235 KB → full 103 / medium 38 / thumb 14 KB, blur 799 ký tự), lịch chặn ngày theo khoảng, `vongDoi` (trạng thái thật theo `expires_at`), khối "Hiển thị tin" **mở `HopTraPhi` của luồng 06** — không có cơ chế trừ token riêng. Nối 2 route `/chu-xe/dang-tin`, `/chu-xe/tin/:id`. Gói đầu vẫn 58,9 KB, gói đăng tin 15 KB gzip. **Chưa chạy với Supabase thật.** ~~Chặn: chưa có `submit-listing` và người mới không có vai trò `chu_xe`~~ → **ĐÃ GỠ 21/09, xem dòng "Gỡ 2 chặn" ngay trên (`0010`)** | `src/modules/listing/**`, `src/App.jsx` |
| 2026-09-21 | 01 nền tảng | 🔒 ⚠️ Vá lỗ hổng: `contracts/schema.sql` THIẾU HẲN phần `GRANT` → PostgREST trả `42501 insufficient_privilege`, client không đọc được bảng nào. Cấp `select` cho anon/authenticated, `insert,update` cho authenticated, **không cấp `delete`** (cưỡng chế luật không xoá cứng ngay ở tầng quyền) | `contracts/schema.sql` |
| 2026-09-21 | 01 nền tảng | ⚠️ Thêm `0009_grants.sql`: thu hồi EXECUTE của PUBLIC trên 22 hàm `security definer` đụng tiền/admin/cron — Postgres mặc định cho PUBLIC gọi, tức ai đăng nhập cũng gọi thẳng được `admin_adjust_wallet`. Đã rà: client không gọi `.rpc()` chỗ nào, mọi đường qua Edge Function (service_role) | `supabase/migrations/0009_grants.sql` |
| 2026-09-21 | 01 nền tảng | `clip` của Windows làm hỏng UTF-8 khi chép SQL (tên tỉnh, tiện nghi thành ký tự rác). Đổi sang PowerShell `Set-Clipboard -Encoding UTF8`. Thêm `reset-va-chay-lai.sql` để dọn khi migration chạy dở | `supabase/reset-va-chay-lai.sql`, `supabase/README.md` |
| 2026-09-21 | 01 nền tảng | ⚠️ Dựng lại thứ tự migration: chuyển `0005_billing.sql` (luồng 06) và `0004_trust.sql` (luồng 08) từ `src/modules/*/server/` vào `supabase/migrations/`; gỡ ba file cùng số `0005` thành dãy `0001→0008`. `0007`/`0008` gọi `wallet_so_du()` của `0004` nên thứ tự cũ chạy là lỗi | `supabase/migrations/*` |
| 2026-09-21 | 01 nền tảng | 🔒 Gộp `user_consents` (luồng 12) vào `contracts/schema.sql`: thêm trigger chặn sửa/xoá, policy đọc có nhánh admin. `0006_legal_consent.sql` thành file rỗng có chủ ý | `contracts/schema.sql`, `supabase/migrations/0001_init.sql`, `supabase/migrations/0006_legal_consent.sql` |
| 2026-09-21 | 01 nền tảng | Viết `kiem-tra-rls.sql`: đóng vai người dùng thường rồi thử 12 việc bậy, in PASS/FAIL từng mục, có đối chứng ngược, rollback sạch. Viết lại `supabase/README.md` thành 8 bước gồm deploy 6 Edge Function + biến môi trường | `supabase/kiem-tra-rls.sql`, `supabase/README.md` |
| 2026-09-21 | nền tảng | Thêm luồng 14 (landing & SEO). Xác minh: production `thuexenhanh.pages.dev` = repo này; alias `dev.` phục vụ bản build cũ của codebase Firebase khác | `LUONG-CHAT/14-landing.md`, `CLAUDE.md` |
| 2026-09-21 | 13 deploy | Dựng lại giao diện bảng điều khiển theo ảnh mẫu: thanh điều hướng bo tròn + 3 tab (Tổng quan/Module/Thay đổi), 4 thẻ chỉ số (thẻ đầu tô xanh), biểu đồ cột dòng code theo module + vành khuyên phân bổ `src/`. Nối remote `origin`; thêm kiểm tra khoá Firebase `AIza...` (chặn khi repo public, cảnh báo khi private) và tự đọc public/private qua GitHub API | `tools/deploy-ui/**` |
| 2026-09-21 | 13 deploy | Bảng điều khiển triển khai 3 nút (Quét / Dev / Main) chạy ở `127.0.0.1:4545`: tổng code + tổng module + code mới từng module, 11 phép kiểm tra chặn (build, secret, `_redirects`/`_headers`, ngân sách JS, tailwind, lucide cả gói, `App.jsx`>200 dòng), lỗi hiện ở ô ghim dính có nút copy ra prompt sửa. **Chỉ stage file được tick, không `git add -A`; không đổi nhánh, đẩy bằng `push HEAD:<nhánh>`** | `tools/deploy-ui/**`, `.gitignore` |
| 2026-09-20 | 10 quản trị | Dựng `/quan-tri/*` (admin): duyệt tin + cảnh báo trùng biển số, người dùng (khoá→ẩn tin, tích xanh), ví (tặng/hoàn/thu hồi tay), doanh thu (tách tiêu/nợ), sức khoẻ + báo cáo. Server: 8 hàm `admin_*` ghi `admin_actions` cùng transaction + Edge Function `admin-ops`. **Chưa chạy thử với Supabase thật; chưa có master-data.** Đụng `App.jsx` đúng 1 route | `src/modules/admin/**`, `supabase/migrations/0005_admin.sql`, `supabase/functions/admin-ops/`, `src/App.jsx` |
| 2026-09-20 | 05 trang xe | Trang `/xe/:id`: slider ảnh (medium, `full` chỉ khi phóng to, prefetch đúng 1 ảnh kế), khối thông số/tiện nghi/giá/mô tả/lịch bận tự ẩn khi thiếu dữ liệu, bản đồ là địa chỉ + nút mở app (không iframe), gỡ sạch đánh giá giả. Luồng lấy số 3 bước qua Edge Function `reveal-phone` (khử trùng lặp 1 giờ + bỏ lượt chủ xe tự xem). Lưu xe ghi THẬT vào `saved_listings`, optimistic + hoàn lại khi lỗi; trang `/da-luu` phân trang keyset. Gói trang xe 11,2 KB gzip, gói đầu vẫn 58,9 KB | `src/modules/discovery/**`, `supabase/functions/reveal-phone/`, `src/App.jsx` |
| 2026-09-20 | 06 ví token | Server: `charge_and_publish` (trừ token + bật hiển thị trong 1 transaction, khoá dòng ví, idempotent theo `idem_key`), `credit_topup` (idempotent theo mã giao dịch ngân hàng), `refund_tokens`, `expire_listings`, `doi_soat_vi`, view `wallet_ledger` (có "số dư sau"), trigger chặn số dư âm; 3 Edge Function `create-topup` / `publish-listing` / `bank-webhook` (VietQR động + webhook SePay). Client: trang `/chu-xe/vi`, hộp nạp token, hộp trả phí hiển thị. **Nạp tiền thật còn TẮT** (2 cổng: `FLAGS.nap_tien_that` + env `NAP_TIEN_THAT`) | `src/modules/billing/**`, `supabase/functions/{create-topup,publish-listing,bank-webhook}/`, `src/lib/config.js`, `src/App.jsx` |
| 2026-09-20 | 12 pháp lý | Viết Điều khoản, Bảo mật, Hoàn token (v1.0), Giới thiệu, FAQ, Liên hệ; ô tích đồng ý ở đăng nhập, ghi phiên bản + thời điểm vào `user_consents` (🔒 bảng mới, luồng 01 cần gộp vào `contracts/schema.sql`); link chân trang | `src/modules/legal/**`, `supabase/migrations/0005_legal_consent.sql`, `src/modules/auth/DangNhap.jsx`, `src/components/Footer.jsx`, `src/App.jsx` |
| 2026-09-20 | 11 thông báo | Server: `notification_outbox` (unique chống gửi trùng) + `notification_prefs`, hàm quét mốc 3 ngày/1 ngày/hết hạn/thiếu token, trigger duyệt/từ chối/bị ẩn/nạp thành công, Edge Function `send-notifications` (Resend + Zalo ZNS, chưa có khoá thì giữ hàng đợi). Client: trang `/thong-bao` + cài đặt bật/tắt. Chưa nối cron, chưa có chuông ở Header, chưa có mốc "tài khoản bị khoá" | `supabase/migrations/0005_notify.sql`, `supabase/functions/send-notifications/`, `src/modules/notify/**`, `src/App.jsx` |
| 2026-09-20 | 08 tin cậy | Nháp server: chặn INSERT tin lên thẳng đang hiển thị, chặn tự gửi duyệt, chuẩn hoá + chặn trùng biển số, 3 báo cáo → tự ẩn, hạn mức lấy số/OTP. Client: `trustApi`, `huyHieu` (chưa nối UI, chưa có Edge Function) | `src/modules/trust/**` |
| 2026-09-20 | 13 deploy | Chuẩn bị hạ tầng Cloudflare Pages: `_redirects` (hết 404 khi F5), `_headers` (cache + bảo mật), `.nvmrc`=20, dọn `thu-luong-02.html`, quét sạch secret, viết `DEPLOY.md` | `public/_redirects`, `public/_headers`, `.nvmrc`, `DEPLOY.md` |
| 2026-09-20 | nền tảng | Thêm luồng 13 (deploy): brief GitHub + Cloudflare Pages. Đổi hosting Netlify/Vercel → Cloudflare Pages | `LUONG-CHAT/13-deploy.md`, `CLAUDE.md` |
| 2026-09-12 | 01 nền tảng | 🔒 Bổ sung theo `HIEU-NANG.md`: view `listing_card`, bảng `events_daily` + hàm gộp/dọn, cột ảnh 4 cỡ + `blur_base64`, index keyset | `contracts/schema.sql`, `contracts/api.md` |
| 2026-09-12 | 01 nền tảng | Tải trễ `@supabase/supabase-js` + tách gói theo route: gói đầu 146,8 → **58,9 KB gzip** | `src/lib/supabase.js`, `src/App.jsx` |
| 2026-09-12 | 01 nền tảng | Sinh migration tự động từ hợp đồng + dữ liệu tĩnh (26 hãng, 173 dòng xe, 39 tỉnh, 68 quận/huyện, 13 tiện nghi) | `scripts/gen-migrations.mjs`, `supabase/migrations/*` |
| 2026-09-12 | 01 nền tảng | Dựng khung React mới ở gốc repo: `App.jsx` 83 dòng chỉ routing, auth Google, rbac, ui-kit, analytics/events | `src/**`, `package.json`, `vite.config.js` |
| 2026-09-12 | 01 nền tảng | 🔒 Viết 3 file hợp đồng chung: 25 bảng + RLS + trigger chống sửa sổ ví, API, design token | `contracts/schema.sql`, `contracts/api.md`, `contracts/tokens.css` |
| 2026-09-12 | nền tảng | 🔒 Thêm `HIEU-NANG.md`: ngân sách LCP/CLS/INP, ảnh 4 cỡ + blur base64, cursor pagination, `listing_card`, `events_daily` | `HIEU-NANG.md`, `CLAUDE.md`, brief 01–05 |
| 2026-09-12 | nền tảng | Tạo 12 brief luồng chat trong `LUONG-CHAT/` | `LUONG-CHAT/*.md` |
| 2026-09-12 | nền tảng | Thêm luật chống mất code, `.gitignore`, script sao lưu, khởi tạo Git | `CLAUDE.md`, `.gitignore`, `scripts/backup.ps1` |
| 2026-09-12 | nền tảng | 🔒 Chốt mô hình giá: ví token, 1 token = 4.000đ, 10 token/xe/tháng, bỏ gói vĩnh viễn | `CLAUDE.md`, `QUYET-DINH.md` |
| 2026-09-12 | nền tảng | 🔒 Chốt chuyển Firestore → Postgres (Supabase); dựng khung mới thay vì vá code cũ | `CLAUDE.md` |

## v0.1 — Bản demo (Firebase) · đã đóng băng

| Ngày | Luồng | Nội dung | File |
|---|---|---|---|
| 2026-09-12 | nền tảng | Giải nén `Web thue xe.rar`, khảo sát code, viết `NGHIEN-CUU.md` | `NGHIEN-CUU.md` |
| 2026-09-12 | nền tảng | Tạo skill `grillme` | `.claude/skills/grillme/SKILL.md` |
| 2026-09-12 | nền tảng | Tạo `CLAUDE.md` | `CLAUDE.md` |

> Toàn bộ code trong `Web thue xe/` thuộc v0.1. **Đóng băng** — chỉ đọc để tham chiếu, không sửa. Khung mới dựng ở luồng 01.

---

## Trạng thái 12 luồng

| # | Luồng | Trạng thái | Ngày xong |
|---|---|---|---|
| 01 | Nền tảng & CSDL | 🟨 khung xong, chờ tạo dự án Supabase | |
| 02 | Tin đăng xe | 🟩 client + server xong, chờ chạy Supabase thật · ⚠️ chờ luồng 01 vá rò `contact_phone` | |
| 03 | Bảng điều khiển chủ xe | ⬜ | |
| 04 | Tìm kiếm & bộ lọc | 🟨 code xong + thử bằng CSDL giả; chờ đo trên Supabase thật | |
| 05 | Trang chi tiết xe | 🟨 xong phần giao diện + API, chờ Supabase để chạy thật | 2026-09-20 |
| 06 | Ví token & thanh toán | 🟨 code xong, SQL nay ở `supabase/migrations/0004_billing.sql`; chờ chạy + deploy function; chưa bật nạp tiền thật | |
| 07 | Đẩy tin | ⬜ để sau | |
| 08 | Tin cậy & kiểm duyệt | ⬜ | |
| 09 | Đánh giá thật | ⬜ để sau | |
| 10 | Trang quản trị | ⬜ | |
| 11 | Thông báo | ⬜ | |
| 12 | Pháp lý & trang tĩnh | 🟨 bản nháp xong, chờ luật sư đọc + email hỗ trợ | |
| 13 | Triển khai GitHub + Cloudflare | 🟨 hạ tầng repo xong, chờ tạo repo GitHub + nối Cloudflare (xem `DEPLOY.md`) | |
