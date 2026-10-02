# DEPLOY — Thuexenhanh (GitHub + Cloudflare Pages)

> Luồng 13. Chi tiết lý do ở `LUONG-CHAT/13-deploy.md`. File này là **bảng việc thực thi**.

Kiến trúc: Vite SPA tĩnh → `dist/` → Cloudflare Pages. Không server riêng. Supabase lo backend.

---

## 0. Phần code đã xong (không phải làm lại)

| Việc | Trạng thái |
|---|---|
| Quét secret trước khi push | ✅ sạch — không có JWT, không có `.env`, không có `.rar`/`node_modules`/`dist` bị theo dõi. Repo 217 KB. |
| `public/_redirects` | ✅ `/* /index.html 200` — F5 ở `/xe/CAR-123` không ra 404 |
| `public/_headers` | ✅ cache asset 1 năm, `index.html` không cache, `nosniff` + `Referrer-Policy` |
| Hai file trên có mặt trong `dist/` sau build | ✅ đã kiểm tra bằng `npm run build && ls dist/_redirects dist/_headers` |
| `.nvmrc` = `20` | ✅ ghim Node cho Cloudflare build |
| `thu-luong-02.html` | ✅ chuyển vào `_scratch/` + gitignore, không lên mạng |
| Bundle không lọt secret | ✅ 0 chuỗi JWT, 0 chữ `service_role` trong `dist/` |

Kích thước gói lần đầu: **58,93 KB gzip** — trong ngân sách 150 KB của `HIEU-NANG.md`.

---

## 1. GitHub — anh làm bằng tay

1. Vào github.com → tạo repo **private**. **Không tick** README / .gitignore / license.
2. Đưa URL cho luồng chat, hoặc tự chạy:

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

Máy này **chưa cài `gh` CLI**, nên không tạo repo tự động được.

---

## 2. Cloudflare Pages — anh làm bằng tay

Dashboard → **Workers & Pages** → tạo ứng dụng mới → **Pages** → nối GitHub → chọn repo.

> Giao diện Cloudflare hay đổi tên mục. Tìm theo nghĩa, đừng tìm theo đúng chữ.

### Thiết lập build

| Mục | Giá trị |
|---|---|
| Framework preset | Vite (hoặc None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | để trống |
| Production branch | `main` |

Node version: repo đã có `.nvmrc` = `20`, Cloudflare tự đọc. Nếu build vẫn báo sai Node thì thêm biến `NODE_VERSION` = `20`.

### Biến môi trường — đặt cho **cả Production và Preview**

```
VITE_SUPABASE_URL        = https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY   = <anon key>
VITE_APP_ENV             = production      (Preview đặt là: preview)
```

🔴 **Chỉ `anon` key.** Vite nhúng thẳng mọi biến `VITE_*` vào file JS công khai. `service_role` vào đây là lộ toàn bộ CSDL.

Anon key lộ ra ngoài là **đúng thiết kế** — nhưng chỉ an toàn khi RLS bật đủ (mục 4).

---

## 3. Supabase + Google OAuth — quên là đăng nhập chết trên production

Supabase → **Authentication → URL Configuration**:

- **Site URL**: tên miền production
- **Redirect URLs**: thêm đủ bốn dạng
  ```
  https://<tenmien>/**
  https://<repo>.pages.dev/**
  https://*.<repo>.pages.dev/**
  http://localhost:5173/**
  ```

Google Cloud Console → OAuth client: thêm đúng các origin đó vào **Authorized JavaScript origins** và **Authorized redirect URIs**.

Đây là lỗi hay gặp nhất: đăng nhập chạy ở máy, chết trên production.

---

## 4. 🔴 CHẶN CỨNG — chưa qua mục này thì không đưa link cho ai

Anon key nằm công khai trong file JS. Ai cũng mở console gọi thẳng Supabase được.
Chạy checklist ở `supabase/README.md` và **thử thật** bằng anon key:

- [ ] Sửa/xoá tin của người khác → **bị từ chối**
- [ ] Ghi `listings.is_verified` từ client → **bị từ chối**
- [ ] Ghi thẳng `wallets` / `wallet_transactions` → **bị từ chối**
- [ ] Đọc `otp_codes`, `admin_actions` → **bị từ chối**

Chưa đủ 4 gạch: deploy cứ deploy, **nhưng không đưa link cho người thật.**

Mục 4 là cổng **kỹ thuật**. Còn một cổng **pháp lý** độc lập ngay bên dưới (mục 4B) — phải qua cả hai.

---

## 4B. 🔴 Chưa được mở cho người dùng thật cho tới khi xong

> Cổng thứ hai, độc lập với mục 4. "Mở cho người thật" = đưa link, quảng bá, nhận chủ xe đăng tin thật.
> Cổng này **không chặn deploy** — địa chỉ `pages.dev` vẫn truy cập được từ bây giờ.
> Công cụ `tools/deploy-ui` **không kiểm** các mục này. Anh tự tick, mỗi mục xong ghi một dòng `CHANGELOG.md`.

Ghi nhận ngày 02/10/2026:

| # | Việc | Ai làm | Trạng thái |
|---|---|---|---|
| 1 | Thông tin pháp nhân + email hỗ trợ thật | anh đưa, luồng 12 điền | ⬜ cả 5 ô pháp nhân và email đều đang rỗng |
| 2 | Luật sư duyệt 6 văn bản pháp lý | anh | ⬜ chưa |
| 3 | Thông báo website với Bộ Công Thương | anh làm thủ tục, luồng 12 đổi cờ | ⬜ `DA_THONG_BAO_BCT = false` |
| 4 | Tên miền riêng | anh | ⬜ chưa |

Luồng 13 **không sửa `src/`** (brief cấm). Mọi chỗ dưới đây ghi "sửa `phienBan.js`" là việc của luồng 12 hoặc luồng nền tảng.

### 1. Thông tin pháp nhân + email hỗ trợ

File: `src/modules/legal/phienBan.js`.

- **`PHAP_NHAN`** có 5 ô: `ten`, `maSo`, `diaChi`, `nguoiDaiDien`, `dienThoai`.
  - Chỉ điền thông tin **thật** của đơn vị vận hành. Cấm điền thông tin doanh nghiệp khác, cấm bịa mã số thuế.
    (Footer cũ từng chép nguyên thông tin pháp lý của Mioto — đừng lặp lại.)
  - ⚠️ **Điền đủ cả 5 ô trong một lần.** Hàm `coPhapNhan()` coi là "đã có" khi chỉ cần **một** ô khác rỗng.
    Điền dở một ô là câu "đang hoàn tất, chưa mở cho người dùng thật" biến mất, dù còn thiếu 4 ô.
  - Hiện ở: `/quy-che`, `/bao-mat`, `/lien-he`.
- **`EMAIL_HO_TRO`**: email thật, **hộp thư có người đọc hằng ngày**.
  - Các trang đã cam kết tiếp nhận khiếu nại trong 3 ngày làm việc, xử lý trong 15 ngày làm việc, hoàn token trong 15 ngày làm việc
    (hằng `THOI_HAN`). Email không ai đọc thì các cam kết đó thành lời hứa suông.
  - Hiện ở: `/bao-mat`, `/hoan-token`, `/khieu-nai`, `/lien-he`, `/thue`. Còn rỗng thì khối tự ẩn,
    trang chỉ nhắc nút "Báo cáo tin".

### 2. Luật sư duyệt 6 văn bản

Cả 6 văn bản do AI soạn, **không phải tư vấn pháp lý** (`NGHIEN-CUU-PHAP-LY.md`, đầu file).

| Văn bản | Đường dẫn | File | Phiên bản | Người duyệt / ngày |
|---|---|---|---|---|
| Điều khoản sử dụng | `/dieu-khoan` | `DieuKhoan.jsx` | 1.1 | |
| Bảo vệ dữ liệu cá nhân | `/bao-mat` | `BaoMat.jsx` | 2.0 | |
| Chính sách hoàn token | `/hoan-token` | `HoanToken.jsx` | 1.1 | |
| Quy chế hoạt động | `/quy-che` | `QuyChe.jsx` | 1.0 | |
| Giải quyết khiếu nại | `/khieu-nai` | `KhieuNai.jsx` | 1.0 | |
| Thông tin thuế cho chủ xe | `/thue` | `ThongTinThue.jsx` | 1.0 | |

Ba câu nên hỏi đích danh (lấy từ `NGHIEN-CUU-PHAP-LY.md`):

1. **Thuế:** nền tảng không thu tiền thuê xe nên nhiều khả năng không phải khấu trừ, chủ xe tự kê khai —
   nhưng nghiên cứu ghi rõ điểm này **phải hỏi kế toán/luật sư trước khi viết chắc**.
2. **Dữ liệu ra nước ngoài:** Supabase (máy chủ Singapore), Cloudflare, Google đăng nhập.
3. **Có phải sàn thương mại điện tử không**, và thủ tục với Bộ Công Thương (liên quan mục 3 bên dưới).

Luật sư sửa văn bản nào thì **tăng phiên bản của văn bản đó** trong `VAN_BAN` (cùng file `phienBan.js`).
`terms` và `privacy` được ghi vào `user_consents`, nên tăng phiên bản = người dùng được hỏi đồng ý lại.
Đủ 6/6 mới tính xong mục này; điền tên người duyệt + ngày vào bảng trên.

### 3. Thông báo website với Bộ Công Thương

Cờ `DA_THONG_BAO_BCT` (`phienBan.js`) đang là `false`.

- **Chỉ đổi thành `true` SAU KHI** đã thông báo xong và có xác nhận của cơ quan. Không đổi trước.
- Cờ này đổi câu ở mục 10 của `/quy-che` từ "chưa hoàn tất thủ tục…" sang "Website đã được thông báo…".
  Đổi sớm = nền tảng tự khẳng định điều chưa đúng với người dùng.
- **Đổi cờ không tự thêm logo.** Logo / mã xác thực Bộ Công Thương chỉ gắn khi đã được cấp thật
  (`NGHIEN-CUU-PHAP-LY.md` §3A; footer cũ từng sai đúng chỗ này). Gắn logo là việc code riêng.
- Hình thức (thông báo hay đăng ký) và hồ sơ cần nộp: **hỏi luật sư**. Em chưa kiểm cổng của Bộ nên
  không ghi các bước bấm ở đây.
- Gợi ý thứ tự: làm sau mục 1, vì hồ sơ cần thông tin pháp nhân thật. Đây là suy luận, chưa xác minh.
- Xong thì ghi số / ngày xác nhận vào dòng `CHANGELOG.md` của lần đổi cờ.

### 4. Tên miền riêng

- Các bước mua, trỏ nameserver, SSL: **mục 5**. Xong thì **làm lại mục 3** (Site URL, Redirect URLs, Google OAuth).
- Mã hiện **hardcode `https://thuexenhanh.com`** ở 3 chỗ:
  - `index.html` — canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD
  - `public/robots.txt` — dòng `Sitemap:`
  - `scripts/prerender-seo.mjs` — giá trị mặc định của `SEO_ORIGIN` (sinh `sitemap.xml` lúc build)

  Tên miền anh mua mà khác `thuexenhanh.com` thì phải sửa cả 3 chỗ (hoặc đặt biến `SEO_ORIGIN` trên Cloudflare
  cho phần sitemap). Em **chưa kiểm** anh đã sở hữu `thuexenhanh.com` chưa.
- Nếu `thuexenhanh.com` chưa trỏ về site thì canonical / og của bản `pages.dev` đang chỉ tới địa chỉ không chạy site.
  Vì vậy chưa quảng bá / làm SEO cho tới khi trỏ xong.
- `CLAUDE.md` §5.2 liệt tên miền riêng là điều kiện trước khi thu tiền thật.

### Cổng 4B

- [ ] `PHAP_NHAN` đủ 5 ô thật + `EMAIL_HO_TRO` thật có người đọc
- [ ] Luật sư duyệt xong 6/6 văn bản, đã tăng phiên bản chỗ cần tăng
- [ ] Đã thông báo Bộ Công Thương, có xác nhận, rồi mới đổi `DA_THONG_BAO_BCT` thành `true`
- [ ] Tên miền riêng chạy, đã làm lại mục 3, đã sửa 3 chỗ hardcode nếu tên miền khác

Chưa đủ 4 gạch: deploy cứ deploy, **nhưng không đưa link, không quảng bá, không nhận chủ xe thật.**
Quan sát nhanh khi đã điền: mở `/lien-he` và `/quy-che` — khối pháp nhân đủ 5 dòng, hết câu "đang được hoàn tất",
mục 10 của quy chế đúng sự thật.

---

## 5. Tên miền riêng

1. Mua tên miền (`.vn` qua nhà đăng ký trong nước, `.com` mua thẳng trên Cloudflare).
2. Trỏ nameserver về Cloudflare.
3. Pages → **Custom domains** → thêm tên miền. SSL tự cấp.
4. Bật **Always Use HTTPS**.
5. Quay lại mục 3, thêm tên miền mới vào Supabase + Google OAuth.

---

## 6. Nghiệm thu sau khi lên mạng

- [ ] Cloudflare build xanh, mở được trang chủ
- [ ] F5 ở `/xe/CAR-123` **không ra 404**
- [ ] Đăng nhập Google chạy trên tên miền production
- [ ] Push một commit lên `main` → tự deploy lại
- [ ] Mở nhánh phụ → có link xem trước riêng
- [ ] Lighthouse mobile ≥ 90 (`HIEU-NANG.md` mục 0)
- [ ] 4 gạch RLS ở mục 4 đã thử thật
- [ ] 4 gạch pháp lý ở mục 4B đã xong (trước khi đưa link cho người thật)
